import { api } from './api.ts';

export type UploadPurpose = 'avatar' | 'cover' | 'article-image' | 'article-audio' | 'article-pdf';

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
export const AUDIO_ACCEPT = 'audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/x-wav,audio/wave';
export const PDF_ACCEPT = 'application/pdf';

/** Mêmes règles que l'API (api/src/storage/upload-rules.ts), pour prévenir avant d'envoyer. */
const RULES: Record<UploadPurpose, { maxMb: number; accept: string; label: string }> = {
  avatar: { maxMb: 2, accept: IMAGE_ACCEPT, label: 'PNG, JPG, WebP ou GIF' },
  cover: { maxMb: 5, accept: IMAGE_ACCEPT, label: 'PNG, JPG, WebP ou GIF' },
  'article-image': { maxMb: 10, accept: IMAGE_ACCEPT, label: 'PNG, JPG, WebP ou GIF' },
  'article-audio': { maxMb: 20, accept: AUDIO_ACCEPT, label: 'MP3, OGG ou WAV' },
  'article-pdf': { maxMb: 20, accept: PDF_ACCEPT, label: 'PDF' },
};

export const uploadRule = (purpose: UploadPurpose) => RULES[purpose];

/** Plus grand côté, en px, au-delà duquel on redimensionne. */
const MAX_SIDE: Partial<Record<UploadPurpose, number>> = { avatar: 512, cover: 1600, 'article-image': 2000 };
/** En dessous de ce poids et de MAX_SIDE, l'image part telle quelle (pixel art, petites images). */
const LIGHT_BYTES = 500 * 1024;

/**
 * Compression avant envoi (l'upload va directement au bucket : c'est le seul endroit où le faire).
 * - GIF : jamais touché (animations).
 * - Image petite et légère : envoyée telle quelle, pour ne pas abîmer le pixel art.
 * - Sinon : réduite à MAX_SIDE au plus, réencodée en WebP (JPEG si le navigateur ne sait pas),
 *   et gardée seulement si elle est plus légère que l'originale ou si elle devait rétrécir.
 * En cas de souci (navigateur ancien, image illisible), on envoie l'originale.
 */
export async function shrinkImage(file: File, purpose: UploadPurpose): Promise<File> {
  const maxSide = MAX_SIDE[purpose];
  if (!maxSide || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = bitmap;
    const tooBig = Math.max(width, height) > maxSide;
    if (!tooBig && file.size <= LIGHT_BYTES) {
      bitmap.close();
      return file;
    }
    const scale = tooBig ? maxSide / Math.max(width, height) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const encode = (type: string, quality: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, quality));
    let blob = await encode('image/webp', 0.85);
    // Safari ancien : toBlob renvoie du PNG quand il ne sait pas faire de WebP.
    if (blob?.type !== 'image/webp') blob = await encode(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
    if (!blob || (!tooBig && blob.size >= file.size)) return file;

    const ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[blob.type] ?? 'img';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: blob.type });
  } catch {
    return file;
  }
}

/**
 * Upload direct navigateur → bucket :
 * 1. l'API signe une URL de PUT (type + taille exacts),
 * 2. le navigateur y envoie le fichier,
 * 3. on renvoie la clé, à enregistrer ensuite (PATCH /api/me, formulaire admin, article…).
 */
export async function uploadFile(original: File, purpose: UploadPurpose): Promise<{ key: string; url: string }> {
  const rule = RULES[purpose];
  if (!rule.accept.split(',').includes(original.type)) throw new Error(`Format accepté : ${rule.label}.`);
  const file = await shrinkImage(original, purpose);
  if (file.size > rule.maxMb * 1024 * 1024) throw new Error(`Fichier trop lourd (max ${rule.maxMb} Mo).`);

  const prep = await api<{ key: string; uploadUrl: string; url: string }>('POST', '/api/uploads', {
    purpose,
    contentType: file.type,
    size: file.size,
  });
  const res = await fetch(prep.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!res.ok) throw new Error("L'envoi du fichier a échoué. Réessayez.");
  return { key: prep.key, url: prep.url };
}

/** Alias historique (avatar, couverture de magazine). */
export const uploadImage = (file: File, purpose: 'avatar' | 'cover' | 'article-image') => uploadFile(file, purpose);

/** URL d'affichage d'un fichier du bucket. */
export const mediaUrl = (key: string) => `/api/media/${key}`;
