import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { AuthUser } from '../auth/auth.types.js';

/**
 * Qui réagit ? « user:<id> » si connecté, sinon un identifiant anonyme gardé dans
 * un cookie httpOnly (« anon:<uuid> »). Une réaction par article et par identifiant.
 * `__Host-` : cookie lié à ce domaine exact, Secure, path=/ (accepté aussi sur http://localhost).
 */
const COOKIE = '__Host-mar_voter';
const ONE_YEAR_MS = 365 * 24 * 3600 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** Identifiant de votant, ou null pour un visiteur qui n'a encore jamais réagi. */
export function voterKey(req: Request, user: AuthUser | null): string | null {
  if (user) return `user:${user.id}`;
  const anon = readCookie(req, COOKIE);
  return anon && UUID.test(anon) ? `anon:${anon}` : null;
}

/** Comme voterKey(), mais crée le cookie anonyme si besoin (au moment de réagir). */
export function ensureVoterKey(req: Request, res: Response, user: AuthUser | null): string {
  const existing = voterKey(req, user);
  if (existing) return existing;
  const id = randomUUID();
  res.cookie(COOKIE, id, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: ONE_YEAR_MS });
  return `anon:${id}`;
}
