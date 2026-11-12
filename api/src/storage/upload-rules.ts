/** Ce qu'on accepte à l'upload, par usage. Le préfixe de clé isole chaque usage (et chaque utilisateur). */
export const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

export const AUDIO_TYPES = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
} as const;

export const PDF_TYPES = { 'application/pdf': 'pdf' } as const;

const MB = 1024 * 1024;

export const UPLOAD_RULES = {
  avatar: { maxBytes: 2 * MB, types: IMAGE_TYPES, adminOnly: false },
  cover: { maxBytes: 5 * MB, types: IMAGE_TYPES, adminOnly: true },
  // Médias d'articles (et couverture d'article) : rangés par auteur.
  'article-image': { maxBytes: 10 * MB, types: IMAGE_TYPES, adminOnly: false },
  'article-audio': { maxBytes: 20 * MB, types: AUDIO_TYPES, adminOnly: false },
  'article-pdf': { maxBytes: 20 * MB, types: PDF_TYPES, adminOnly: false },
} as const;

export type UploadPurpose = keyof typeof UPLOAD_RULES;

export const keyPrefix = (purpose: UploadPurpose, userId: number) => {
  if (purpose === 'avatar') return `avatars/${userId}/`;
  if (purpose === 'cover') return 'covers/';
  return `media/${userId}/`;
};

/** URL publique (via notre API) d'un objet du bucket */
export const mediaUrl = (key: string) => `/api/media/${key}`;

/** Inverse de mediaUrl, ou null si l'URL ne pointe pas vers le bucket (ex. /assets/…) */
export const keyFromMediaUrl = (url: string | null | undefined) =>
  url?.startsWith('/api/media/') ? url.slice('/api/media/'.length) : null;
