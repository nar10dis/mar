import { Body, ConflictException, Controller, Patch } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { pseudo } from '../auth/auth.schemas.js';
import { AUTH_USER_SELECT } from '../auth/auth.types.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { keyFromMediaUrl } from '../storage/upload-rules.js';
import { UploadsService } from '../storage/uploads.service.js';

const updateMeSchema = z.object({
  pseudo: pseudo.optional(),
  /** Clé renvoyée par POST /api/uploads (purpose: avatar), ou null pour revenir à l'avatar par défaut */
  avatarKey: z.string().max(300).nullable().optional(),
});

@Controller('me')
export class AccountController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly storage: StorageService,
  ) {}

  @Can.Anyone()
  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body({ schema: updateMeSchema }) body: z.infer<typeof updateMeSchema>) {
    const data: { pseudo?: string; avatarUrl?: string | null } = {};

    if (body.pseudo !== undefined && body.pseudo !== user.pseudo) {
      const taken = await this.prisma.user.findFirst({
        where: { pseudo: { equals: body.pseudo, mode: 'insensitive' }, NOT: { id: user.id } },
        select: { id: true },
      });
      if (taken) throw new ConflictException('Ce pseudo est déjà pris');
      data.pseudo = body.pseudo;
    }

    if (body.avatarKey !== undefined) {
      data.avatarUrl = body.avatarKey === null ? null : await this.uploads.confirm(user, 'avatar', body.avatarKey);
    }

    const updated = await this.prisma.user.update({ where: { id: user.id }, data, select: AUTH_USER_SELECT });

    // L'ancien avatar n'est plus référencé : on le retire du bucket.
    const oldKey = keyFromMediaUrl(user.avatarUrl);
    if (data.avatarUrl !== undefined && oldKey && oldKey !== keyFromMediaUrl(data.avatarUrl)) {
      await this.storage.deleteQuietly(oldKey);
    }
    return updated;
  }
}
