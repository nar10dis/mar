import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { idParam } from '../admin/admin.schemas.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Commentaire vide').max(5000, '5000 caractères maximum'),
  /** Réponse à un commentaire du même article */
  parentId: z.number().int().positive().nullable().optional(),
});

const COMMENT_SELECT = {
  id: true,
  body: true,
  parentId: true,
  createdAt: true,
  author: { select: { id: true, pseudo: true, avatarUrl: true } },
} as const;

/**
 * Commentaires façon Reddit : liste à plat (le front construit l'arbre avec parentId).
 * Lecture publique, écriture pour les connectés. Suppression : back-office admin.
 */
@Controller('articles/:id/comments')
export class CommentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list(@Param('id', { schema: idParam }) id: number) {
    await this.requireArticle(id);
    return this.prisma.comment.findMany({ where: { articleId: id }, orderBy: { createdAt: 'asc' }, select: COMMENT_SELECT });
  }

  @Can.Anyone()
  @Post()
  async create(
    @Param('id', { schema: idParam }) id: number,
    @CurrentUser() user: AuthUser,
    @Body({ schema: commentSchema }) body: z.infer<typeof commentSchema>,
  ) {
    await this.requireArticle(id);
    if (body.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: body.parentId }, select: { articleId: true } });
      if (!parent || parent.articleId !== id) throw new BadRequestException('Commentaire parent introuvable');
    }
    return this.prisma.comment.create({
      data: { articleId: id, authorId: user.id, body: body.body, parentId: body.parentId ?? null },
      select: COMMENT_SELECT,
    });
  }

  private async requireArticle(id: number) {
    const found = await this.prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Article introuvable');
  }
}
