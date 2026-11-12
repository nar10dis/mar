import { HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import type { AuthUser } from '../auth/auth.types.js';

/**
 * Limites par « seau » : au plus `limit` requêtes par fenêtre glissante de `windowMs`,
 * comptées par personne (id si connecté, sinon IP — `trust proxy` est réglé dans app.setup.ts).
 * Assez larges pour une soirée où tout le monde s'inscrit depuis le même wifi.
 */
export const RATE_LIMITS = {
  'sign-in': { limit: 20, windowMs: 15 * 60_000, message: 'Trop de tentatives de connexion. Réessaie dans quelques minutes.' },
  'sign-up': { limit: 20, windowMs: 60 * 60_000, message: 'Trop d’inscriptions depuis cette connexion. Réessaie plus tard.' },
  reaction: { limit: 30, windowMs: 60_000, message: 'Doucement sur les bulles ! Réessaie dans une minute.' },
  comment: { limit: 10, windowMs: 5 * 60_000, message: 'Trop de commentaires d’affilée. Réessaie dans quelques minutes.' },
  upload: { limit: 30, windowMs: 10 * 60_000, message: 'Trop d’envois de fichiers. Réessaie dans quelques minutes.' },
  'account-delete': { limit: 5, windowMs: 15 * 60_000, message: 'Trop de tentatives. Réessaie dans quelques minutes.' },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

const RATE_LIMIT_KEY = 'mar:rate-limit';

/** À poser sur une route (ou un controller) pour la limiter. */
export const RateLimit = (bucket: RateLimitBucket) => SetMetadata(RATE_LIMIT_KEY, bucket);

/**
 * Compteurs en mémoire : suffisant avec une seule instance (Railway). Avec plusieurs instances,
 * il faudrait les stocker en BDD ou dans Redis.
 */
@Injectable()
export class RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private lastSweep = Date.now();

  /** Enregistre une requête ; renvoie le nombre de secondes à attendre si la limite est dépassée. */
  hit(key: string, limit: number, windowMs: number, now = Date.now()): number | null {
    this.sweep(now, windowMs);
    const recent = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= limit) {
      this.hits.set(key, recent);
      return Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    }
    recent.push(now);
    this.hits.set(key, recent);
    return null;
  }

  /** Oublie les compteurs inactifs, pour que la Map ne grossisse pas indéfiniment. */
  private sweep(now: number, windowMs: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    const maxWindow = Math.max(windowMs, ...Object.values(RATE_LIMITS).map((r) => r.windowMs));
    for (const [k, times] of this.hits) if ((times.at(-1) ?? 0) <= now - maxWindow) this.hits.delete(k);
  }
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: RateLimitStore,
  ) {}

  // Intercepteur (et pas guard) : il passe après l'authentification, donc request.user est connu.
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const bucket = this.reflector.getAllAndOverride<RateLimitBucket | undefined>(RATE_LIMIT_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (bucket) {
      const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser | null }>();
      const who = req.user ? `user:${req.user.id}` : `ip:${req.ip ?? 'unknown'}`;
      const { limit, windowMs, message } = RATE_LIMITS[bucket];
      const wait = this.store.hit(`${bucket}|${who}`, limit, windowMs);
      if (wait !== null) {
        ctx.switchToHttp().getResponse<Response>().setHeader('Retry-After', String(wait));
        throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
      }
    }
    return next.handle();
  }
}
