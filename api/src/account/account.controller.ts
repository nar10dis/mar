import { Body, ConflictException, Controller, Delete, ForbiddenException, HttpCode, Patch } from '@nestjs/common';
import { CurrentUser, PasswordHasher, SignInService } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { pseudo } from '../auth/auth.schemas.js';
import { AUTH_USER_SELECT } from '../auth/auth.types.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RateLimit } from '../rate-limit/rate-limit.js';
import { StorageService } from '../storage/storage.service.js';
import { keyFromMediaUrl, keyPrefix } from '../storage/upload-rules.js';
import { UploadsService } from '../storage/uploads.service.js';

const updateMeSchema = z.object({
  pseudo: pseudo.optional(),
  /** Clé renvoyée par POST /api/uploads (purpose: avatar), ou null pour revenir à l'avatar par défaut */
  avatarKey: z.string().max(300).nullable().optional(),
});

const deleteMeSchema = z.object({ password: z.string().min(1).max(200) });

@Controller('me')
export class AccountController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly storage: StorageService,
    private readonly hasher: PasswordHasher,
    private readonly signInService: SignInService,
  ) {}

  /**
   * Suppression du compte (RGPD), confirmée par le mot de passe. Part avec le compte :
   * articles (et leurs réactions / commentaires), commentaires (et les réponses en dessous),
   * réactions, sac, sessions, avatar et fichiers uploadés.
   */
  @Can.Anyone()
  @RateLimit('account-delete')
  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Body({ schema: deleteMeSchema }) body: z.infer<typeof deleteMeSchema>) {
    const row = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
    if (!(await this.hasher.verify(body.password, row.passwordHash))) throw new ForbiddenException('Mot de passe incorrect');

    await this.signInService.signOut();
    await this.prisma.$transaction([
      // Pas de clé étrangère sur voterKey : on retire ses réactions à la main.
      this.prisma.reaction.deleteMany({ where: { voterKey: `user:${user.id}` } }),
      // Le reste suit par cascade (articles, commentaires, médias, sac, sessions).
      this.prisma.user.delete({ where: { id: user.id } }),
    ]);
    // Fichiers ensuite : si la BDD échoue, on n'a rien perdu.
    await this.storage.deletePrefix(keyPrefix('avatar', user.id));
    await this.storage.deletePrefix(keyPrefix('article-image', user.id));
  }

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
