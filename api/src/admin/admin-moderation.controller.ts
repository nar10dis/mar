import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { z } from 'zod';
import { AdminPolicy } from '../auth/admin.policy.js';
import type { AuthUser } from '../auth/auth.types.js';
import { ArticlesService } from '../articles/articles.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { idParam, roleSchema } from './admin.schemas.js';

/** Back-office : utilisateurs (rôles), suppression d'articles et de commentaires. */
@Can(AdminPolicy, 'manage')
@Controller('admin')
export class AdminModerationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly articles: ArticlesService,
  ) {}

  @Get('users')
  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        createdAt: true,
        _count: { select: { articles: true, comments: true } },
      },
    });
  }

  @Patch('users/:id/role')
  async setRole(
    @CurrentUser() me: AuthUser,
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: roleSchema }) body: z.infer<typeof roleSchema>,
  ) {
    // Évite de se retirer soi-même les droits (et de laisser le site sans admin).
    if (id === me.id && body.role !== 'ADMIN') {
      throw new BadRequestException('Vous ne pouvez pas retirer votre propre rôle admin');
    }
    const { count } = await this.prisma.user.updateMany({ where: { id }, data: { role: body.role } });
    if (!count) throw new NotFoundException();
    return { id, role: body.role };
  }

  @Get('articles')
  listArticles() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, title: true, createdAt: true, author: { select: { pseudo: true } }, theme: { select: { name: true } } },
    });
  }

  @Delete('articles/:id')
  @HttpCode(204)
  async deleteArticle(@Param('id', { schema: idParam }) id: number) {
    // Passe par le service : les fichiers de l'article sont aussi retirés du bucket.
    await this.articles.removeById(id);
  }

  @Get('comments')
  listComments() {
    return this.prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { pseudo: true } },
        article: { select: { id: true, title: true } },
      },
    });
  }

  @Delete('comments/:id')
  @HttpCode(204)
  async deleteComment(@Param('id', { schema: idParam }) id: number) {
    // Les réponses sont supprimées en cascade (fil Reddit).
    const { count } = await this.prisma.comment.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException();
  }
}
