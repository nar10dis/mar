import { Injectable, Logger } from '@nestjs/common';
import { AuthenticationEvents } from '@nestjs/authentication';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, filter, from, merge, shareReplay, switchMap, timer } from 'rxjs';
import type { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Fenêtre « en ligne ». La lib d'auth n'écrit lastActiveAt qu'une fois par minute au plus
 * (touchInterval) ; le front pinge toutes les 45 s tant que l'onglet est visible,
 * donc lastActiveAt a au plus ~1 min 45 de retard : 3 min laisse de la marge.
 */
const ONLINE_WINDOW_MS = 3 * 60_000;
/** Relecture périodique : c'est elle qui voit partir ceux qui ont fermé ou caché l'onglet. */
const RESCAN_MS = 15_000;

export interface OnlineUser {
  id: number;
  pseudo: string;
  avatarUrl: string | null;
}

/**
 * La liste des connectés, en flux partagé : une seule requête en base par changement,
 * quel que soit le nombre de visiteurs abonnés. Une seule instance de l'API (cf. ROADMAP) :
 * les signaux restent en mémoire.
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly pinged = new Subject<void>();

  /** Émet la liste à l'abonnement, puis seulement quand elle change. */
  readonly online$: Observable<OnlineUser[]>;

  constructor(
    private readonly prisma: PrismaService,
    events: AuthenticationEvents,
  ) {
    const signInOut$ = events.events$.pipe(filter((e) => e.type === 'sign-in' || e.type === 'sign-out'));
    this.online$ = merge(timer(0, RESCAN_MS), signInOut$, this.pinged.pipe(debounceTime(300))).pipe(
      switchMap(() =>
        from(this.list()).pipe(
          catchError((e: unknown) => {
            // Une erreur de base ne doit pas couper le flux de tout le monde : on attend le prochain tour.
            this.logger.warn(`Lecture des connectés impossible : ${String(e)}`);
            return EMPTY;
          }),
        ),
      ),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      // Partagé entre tous les abonnés ; le dernier état est rejoué aux nouveaux venus.
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /** Un connecté vient de signaler sa présence (retour sur l'onglet, par exemple). */
  pingedBy() {
    this.pinged.next();
  }

  /** Utilisateurs actifs récemment : pseudo + avatar seulement, jamais l'email. */
  private list(): Promise<OnlineUser[]> {
    const now = Date.now();
    return this.prisma.user.findMany({
      where: {
        sessions: { some: { lastActiveAt: { gte: new Date(now - ONLINE_WINDOW_MS) }, expiresAt: { gt: new Date(now) } } },
      },
      select: { id: true, pseudo: true, avatarUrl: true },
      orderBy: { pseudo: 'asc' },
      take: 50,
    });
  }
}
