import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const SLOTS = 8;

const position = z.coerce.number().int().min(0).max(SLOTS - 1);
const addSchema = z.object({ articleId: z.number().int().positive() });
const swapSchema = z.object({ from: position, to: position });

const ARTICLE_SELECT = {
  id: true,
  title: true,
  coverUrl: true,
  theme: { select: { slug: true, name: true, color: true } },
  author: { select: { id: true, pseudo: true } },
} as const;

/**
 * Sac de 8 cases façon Pokémon, rempli avec des articles des autres.
 * Privé : chaque route ne touche que le sac de la personne connectée.
 */
@Can.Anyone()
@Controller('me')
export class InventoryController {
  constructor(private readonly prisma: PrismaService) {}

  /** Profil privé : identité, articles écrits, sac. */
  @Get('profile')
  async profile(@CurrentUser() user: AuthUser) {
    const [me, articles, inventory] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { pseudo: true, avatarUrl: true, createdAt: true } }),
      this.prisma.article.findMany({ where: { authorId: user.id }, orderBy: { createdAt: 'desc' }, select: { ...ARTICLE_SELECT, createdAt: true } }),
      this.inventory(user),
    ]);
    return { ...me, articles, inventory };
  }

  /** Les 8 cases, dans l'ordre ; null = case vide. */
  @Get('inventory')
  async inventory(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.inventorySlot.findMany({ where: { userId: user.id }, select: { position: true, article: { select: ARTICLE_SELECT } } });
    const slots: (typeof rows)[number]['article'][] | null[] = Array.from({ length: SLOTS }, () => null);
    for (const r of rows) (slots as unknown[])[r.position] = r.article;
    return slots;
  }

  /** Ajoute dans la première case libre (bouton « Mettre dans le sac » d'un article). */
  @Post('inventory')
  async add(@CurrentUser() user: AuthUser, @Body({ schema: addSchema }) body: z.infer<typeof addSchema>) {
    await this.checkArticle(user, body.articleId);
    const used = new Set((await this.prisma.inventorySlot.findMany({ where: { userId: user.id }, select: { position: true } })).map((s) => s.position));
    const free = Array.from({ length: SLOTS }, (_, i) => i).find((i) => !used.has(i));
    if (free === undefined) throw new ConflictException('Ton sac est plein (8 cases). Retire un article d’abord.');
    await this.prisma.inventorySlot.create({ data: { userId: user.id, position: free, articleId: body.articleId } });
    return this.inventory(user);
  }

  /** Pose un article dans une case précise (remplace son contenu). */
  @Put('inventory/:position')
  async put(@CurrentUser() user: AuthUser, @Param('position', { schema: position }) pos: number, @Body({ schema: addSchema }) body: z.infer<typeof addSchema>) {
    await this.checkArticle(user, body.articleId);
    await this.prisma.$transaction([
      this.prisma.inventorySlot.deleteMany({ where: { userId: user.id, position: pos } }),
      this.prisma.inventorySlot.create({ data: { userId: user.id, position: pos, articleId: body.articleId } }),
    ]);
    return this.inventory(user);
  }

  /** Échange deux cases (réordonner). Une case vide peut faire partie de l'échange. */
  @Post('inventory/swap')
  async swap(@CurrentUser() user: AuthUser, @Body({ schema: swapSchema }) { from, to }: z.infer<typeof swapSchema>) {
    if (from === to) return this.inventory(user);
    const [a, b] = await Promise.all(
      [from, to].map((p) => this.prisma.inventorySlot.findUnique({ where: { userId_position: { userId: user.id, position: p } } })),
    );
    // Passage par une position temporaire (-1) : la contrainte unique (userId, position) ne gêne pas l'échange.
    await this.prisma.$transaction([
      ...(a ? [this.prisma.inventorySlot.update({ where: { id: a.id }, data: { position: -1 } })] : []),
      ...(b ? [this.prisma.inventorySlot.update({ where: { id: b.id }, data: { position: from } })] : []),
      ...(a ? [this.prisma.inventorySlot.update({ where: { id: a.id }, data: { position: to } })] : []),
    ]);
    return this.inventory(user);
  }

  /** Vide une case. */
  @Delete('inventory/:position')
  async remove(@CurrentUser() user: AuthUser, @Param('position', { schema: position }) pos: number) {
    await this.prisma.inventorySlot.deleteMany({ where: { userId: user.id, position: pos } });
    return this.inventory(user);
  }

  private async checkArticle(user: AuthUser, articleId: number) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId }, select: { authorId: true } });
    if (!article) throw new NotFoundException('Article introuvable');
    if (article.authorId === user.id) throw new BadRequestException('Le sac est fait pour les articles des autres.');
    const already = await this.prisma.inventorySlot.findUnique({ where: { userId_articleId: { userId: user.id, articleId } } });
    if (already) throw new ConflictException('Cet article est déjà dans ton sac.');
  }
}
