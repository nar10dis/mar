import { Injectable } from '@nestjs/common';
import { AuthenticationStorage } from '@nestjs/authentication';
import type { SessionRecord, SessionStore } from '@nestjs/authentication';
import type { Prisma, Session } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AUTH_USER_SELECT } from './auth.types.js';

const toRecord = (row: Session): SessionRecord => ({
  id: row.id,
  userId: String(row.userId),
  createdAt: row.createdAt,
  expiresAt: row.expiresAt,
  lastActiveAt: row.lastActiveAt,
  // Les champs optionnels reviennent absents, jamais null (contrat SessionStore).
  ...(row.mfa && { mfa: row.mfa as SessionRecord['mfa'] }),
  ...(row.metadata && { metadata: row.metadata as Record<string, unknown> }),
});

/** Sessions de @nestjs/authentication stockées en Postgres via Prisma. */
@Injectable()
export class PrismaSessionStore implements SessionStore {
  constructor(
    private readonly prisma: PrismaService,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ sessions: this });
  }

  async getSession(id: string) {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: { user: { select: AUTH_USER_SELECT } },
    });
    if (!row) return undefined;
    // On lit l'utilisateur dans la même requête : validate() n'a pas à le relire.
    return { ...toRecord(row), extra: { user: row.user } };
  }

  async createSession(record: SessionRecord) {
    await this.prisma.$transaction([
      // Ménage des sessions expirées. Référence = l'horloge du service d'auth
      // (record.createdAt), jamais celle de la base ou du serveur (contrat SessionStore).
      this.prisma.session.deleteMany({ where: { expiresAt: { lt: record.createdAt } } }),
      this.prisma.session.create({
        data: {
          id: record.id,
          userId: Number(record.userId),
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
          lastActiveAt: record.lastActiveAt,
          mfa: record.mfa ?? null,
          metadata: (record.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      }),
    ]);
  }

  async touchSession(id: string, lastActiveAt: Date) {
    // Une seule écriture conditionnelle : ne ressuscite jamais une session supprimée.
    await this.prisma.session.updateMany({
      where: { id, lastActiveAt: { lt: lastActiveAt } },
      data: { lastActiveAt },
    });
  }

  async deleteSession(id: string) {
    const { count } = await this.prisma.session.deleteMany({ where: { id } });
    return count > 0;
  }

  async listUserSessions(userId: string) {
    const rows = await this.prisma.session.findMany({ where: { userId: Number(userId) } });
    return rows.map(toRecord);
  }

  async deleteUserSessions(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId: Number(userId) } });
  }
}
