import { Controller, HttpCode, Post, Sse } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { interval, map, merge } from 'rxjs';
import type { Observable } from 'rxjs';
import { PresenceService } from './presence.service.js';

/** Un commentaire toutes les 25 s : empêche les proxys (Railway, Vite) de couper un flux silencieux. */
const KEEPALIVE_MS = 25_000;

@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  /**
   * Flux SSE des connectés : la liste complète à la connexion, puis à chaque changement
   * (connexion, déconnexion, retour sur l'onglet, départ détecté). Lecture seule, ouvert à tous.
   */
  @Public()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return merge(
      this.presence.online$.pipe(map((users) => ({ data: users }))),
      interval(KEEPALIVE_MS).pipe(map(() => ({ type: 'keepalive', data: '' }))),
    );
  }

  /**
   * Signal de présence d'un utilisateur connecté. La route exige une session, et la lib d'auth
   * rafraîchit son lastActiveAt en la validant ; on prévient ensuite le flux.
   */
  @Can.Anyone()
  @HttpCode(204)
  @Post('ping')
  ping() {
    this.presence.pingedBy();
  }
}
