import type { Role } from '../generated/prisma/client.js';

/** L'utilisateur connecté tel qu'il circule dans l'app (jamais le hash du mot de passe). */
export interface AuthUser {
  id: number;
  email: string;
  pseudo: string;
  avatarUrl: string | null;
  role: Role;
}

/** Colonnes Prisma correspondant à AuthUser. */
export const AUTH_USER_SELECT = {
  id: true,
  email: true,
  pseudo: true,
  avatarUrl: true,
  role: true,
} as const;

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: AuthUser;
    sessionExtra: { user: AuthUser };
  }
}
