import { Controller, Get } from '@nestjs/common';
import { Authenticate } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Fenêtre « en ligne ». La lib d'auth n'écrit lastActiveAt qu'une fois par minute au plus
 * (touchInterval), et le widget interroge cette route toutes les 30 s : 3 min laisse de la marge.
 */
const ONLINE_WINDOW_MS = 3 * 60_000;

@Controller('presence')
export class PresenceController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Utilisateurs actifs récemment (pseudo + avatar seulement, jamais l'email).
   * Auth optionnelle : un visiteur voit la liste, et l'appel d'un connecté rafraîchit sa session,
   * donc garder le site ouvert suffit pour rester « en ligne ».
   */
  @Authenticate({ optional: true })
  @Can.Anyone()
  @Get()
  async online() {
    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    return this.prisma.user.findMany({
      where: { sessions: { some: { lastActiveAt: { gte: since }, expiresAt: { gt: new Date() } } } },
      select: { id: true, pseudo: true, avatarUrl: true },
      orderBy: { pseudo: 'asc' },
      take: 50,
    });
  }
}
