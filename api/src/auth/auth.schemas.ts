import { z } from 'zod';

export const email = z.string().trim().toLowerCase().email('Email invalide').max(254);
export const password = z.string().min(8, '8 caractères minimum').max(256);
export const pseudo = z
  .string()
  .trim()
  .min(3, '3 caractères minimum')
  .max(24, '24 caractères maximum')
  .regex(/^[\p{L}\p{N}_.-]+$/u, 'Lettres, chiffres, « _ », « . » et « - » uniquement');

export const signUpSchema = z.object({ email, password, pseudo });
export const signInSchema = z.object({ email, password: z.string().min(1).max(256) });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
