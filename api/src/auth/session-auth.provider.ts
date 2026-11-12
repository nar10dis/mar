import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, SessionCookieProvider } from '@nestjs/authentication';
import type { SessionRecord } from '@nestjs/authentication';
import type { AuthUser } from './auth.types.js';

/** Lit le cookie de session ; l'utilisateur a déjà été chargé par PrismaSessionStore.getSession(). */
@Injectable()
export class SessionAuth extends SessionCookieProvider<AuthUser> {
  constructor(registry: AuthenticationRegistry) {
    super();
    registry.registerProvider(this);
  }

  protected validate(session: SessionRecord) {
    return session.extra?.user ?? null;
  }
}
