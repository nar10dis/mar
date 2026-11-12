import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable();

export const magazineSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(120),
  issue: optionalText(40),
  /** centimes */
  price: z.number().int().min(0).max(100_000),
  description: optionalText(1000),
  helloAssoUrl: z.string().trim().url('URL invalide').startsWith('https://', 'URL en https:// requise').max(500),
  order: z.number().int().min(0).max(10_000),
  published: z.boolean(),
  /** Nouvelle couverture uploadée (clé renvoyée par POST /api/uploads, purpose: cover) */
  coverKey: z.string().max(300).optional(),
});
export const magazineCreateSchema = magazineSchema.extend({ coverKey: z.string().max(300) });
export const magazineUpdateSchema = magazineSchema.partial();

export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(160),
  body: z.string().trim().min(1, 'Texte requis').max(10_000),
  published: z.boolean(),
});
export const announcementUpdateSchema = announcementSchema.partial();

export const roleSchema = z.object({ role: z.enum(['USER', 'ADMIN']) });

export const idParam = z.coerce.number().int().positive();
