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

/**
 * Upload direct navigateur → bucket :
 * 1. l'API signe une URL de PUT (type + taille exacts),
 * 2. le navigateur y envoie le fichier,
 * 3. on renvoie la clé, à enregistrer ensuite (PATCH /api/me, formulaire admin, article…).
 */
export async function uploadFile(file: File, purpose: UploadPurpose): Promise<{ key: string; url: string }> {
  const rule = RULES[purpose];
  if (!rule.accept.split(',').includes(file.type)) throw new Error(`Format accepté : ${rule.label}.`);
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
