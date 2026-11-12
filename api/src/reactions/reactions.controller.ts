import { Body, Controller, Delete, Get, NotFoundException, Param, Put, Req, Res } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { idParam } from '../admin/admin.schemas.js';
import type { AuthUser } from '../auth/auth.types.js';
import { ReactionKind } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RateLimit } from '../rate-limit/rate-limit.js';
import { ensureVoterKey, voterKey } from './voter.js';

const reactSchema = z.object({ kind: z.enum(Object.values(ReactionKind) as [ReactionKind, ...ReactionKind[]]) });

/**
 * Réactions en bulles : ouvertes à tous (connectés ou non), une par article et par personne,
 * modifiable. Réponse commune : compteur par bulle + la réaction de la personne.
 */
@Authenticate({ optional: true })
@Can.Anyone()
@Controller('articles/:id/reactions')
export class ReactionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@Param('id', { schema: idParam }) id: number, @CurrentUser() user: AuthUser | null, @Req() req: Request) {
    await this.requireArticle(id);
    return this.summary(id, voterKey(req, user));
  }

  @RateLimit('reaction')
  @Put()
  async react(
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: reactSchema }) body: z.infer<typeof reactSchema>,
    @CurrentUser() user: AuthUser | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.requireArticle(id);
    const key = ensureVoterKey(req, res, user);
    await this.prisma.reaction.upsert({
      where: { articleId_voterKey: { articleId: id, voterKey: key } },
      create: { articleId: id, voterKey: key, kind: body.kind },
      update: { kind: body.kind },
    });
    return this.summary(id, key);
  }

  @RateLimit('reaction')
  @Delete()
  async unreact(@Param('id', { schema: idParam }) id: number, @CurrentUser() user: AuthUser | null, @Req() req: Request) {
    await this.requireArticle(id);
    const key = voterKey(req, user);
    if (key) await this.prisma.reaction.deleteMany({ where: { articleId: id, voterKey: key } });
    return this.summary(id, key);
  }

  private async requireArticle(id: number) {
    const found = await this.prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Article introuvable');
  }

  private async summary(articleId: number, key: string | null) {
    const [groups, mine] = await Promise.all([
      this.prisma.reaction.groupBy({ by: ['kind'], where: { articleId }, _count: { _all: true } }),
      key ? this.prisma.reaction.findUnique({ where: { articleId_voterKey: { articleId, voterKey: key } }, select: { kind: true } }) : null,
    ]);
    const counts = Object.fromEntries(Object.values(ReactionKind).map((k) => [k, 0])) as Record<ReactionKind, number>;
    for (const g of groups) counts[g.kind] = g._count._all;
    return { counts, mine: mine?.kind ?? null };
  }
}
