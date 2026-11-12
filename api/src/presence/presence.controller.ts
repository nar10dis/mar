import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Fenêtre « en ligne ». La lib d'auth n'écrit lastActiveAt qu'une fois par minute au plus
 * (touchInterval) ; le front pinge toutes les 45 s tant que l'onglet est visible,
 * donc lastActiveAt a au plus ~1 min 45 de retard : 3 min laisse de la marge.
 */
const ONLINE_WINDOW_MS = 3 * 60_000;

@Controller('presence')
export class PresenceController {
  constructor(private readonly prisma: PrismaService) {}

  /** Utilisateurs actifs récemment (pseudo + avatar seulement, jamais l'email). Lecture seule. */
  @Public()
  @Get()
  async online() {
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

  /**
   * Signal de présence d'un utilisateur connecté. Rien à faire ici : la route exige une session,
   * et la lib d'auth rafraîchit son lastActiveAt en la validant.
   */
  @Can.Anyone()
  @HttpCode(204)
  @Post('ping')
  ping() {}
}
