/** Ce qu'on accepte à l'upload, par usage. Le préfixe de clé isole chaque usage (et chaque utilisateur). */
export const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

export const UPLOAD_RULES = {
  avatar: { maxBytes: 2 * 1024 * 1024, types: IMAGE_TYPES, adminOnly: false },
  cover: { maxBytes: 5 * 1024 * 1024, types: IMAGE_TYPES, adminOnly: true },
} as const;

export type UploadPurpose = keyof typeof UPLOAD_RULES;

export const keyPrefix = (purpose: UploadPurpose, userId: number) =>
  purpose === 'avatar' ? `avatars/${userId}/` : 'covers/';

/** URL publique (via notre API) d'un objet du bucket */
export const mediaUrl = (key: string) => `/api/media/${key}`;

/** Inverse de mediaUrl, ou null si l'URL ne pointe pas vers le bucket (ex. /assets/…) */
export const keyFromMediaUrl = (url: string | null | undefined) =>
  url?.startsWith('/api/media/') ? url.slice('/api/media/'.length) : null;
