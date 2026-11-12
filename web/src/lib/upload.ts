import { api } from './api.ts';

export type UploadPurpose = 'avatar' | 'cover';

const RULES: Record<UploadPurpose, { maxMb: number }> = { avatar: { maxMb: 2 }, cover: { maxMb: 5 } };
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

/**
 * Upload direct navigateur → bucket :
 * 1. l'API signe une URL de PUT (type + taille exacts),
 * 2. le navigateur y envoie le fichier,
 * 3. on renvoie la clé, à enregistrer ensuite (PATCH /api/me, formulaire admin…).
 */
export async function uploadImage(file: File, purpose: UploadPurpose): Promise<{ key: string; url: string }> {
  if (!IMAGE_ACCEPT.split(',').includes(file.type)) throw new Error('Format accepté : PNG, JPG, WebP ou GIF.');
  if (file.size > RULES[purpose].maxMb * 1024 * 1024) throw new Error(`Image trop lourde (max ${RULES[purpose].maxMb} Mo).`);

  const prep = await api<{ key: string; uploadUrl: string; url: string }>('POST', '/api/uploads', {
    purpose,
    contentType: file.type,
    size: file.size,
  });
  const res = await fetch(prep.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!res.ok) throw new Error("L'envoi du fichier a échoué. Réessayez.");
  return { key: prep.key, url: prep.url };
}
