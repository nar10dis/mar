import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { keyFromMediaUrl } from '../storage/upload-rules.js';
import { UploadsService } from '../storage/uploads.service.js';
import { mediaRefs } from './article-content.schema.js';
import type { ArticleContent, ArticleInput } from './article-content.schema.js';
import { readingMinutes } from './reading-time.js';

const LIST_SELECT = {
  id: true,
  title: true,
  coverUrl: true,
  createdAt: true,
  theme: { select: { slug: true, name: true, color: true } },
  author: { select: { id: true, pseudo: true, avatarUrl: true } },
} as const;

/** Les ~220 premiers caractères du premier bloc texte, pour le fil. */
export function excerptOf(content: ArticleContent | null, max = 220): string {
  const parts: string[] = [];
  const walk = (n: { text?: string; content?: unknown[] }) => {
    if (n.text) parts.push(n.text);
    for (const c of n.content ?? []) {
      if (parts.join(' ').length >= max) return;
      walk(c as { text?: string; content?: unknown[] });
    }
  };
  const firstText = content?.rows?.flatMap((r) => r.cols).find((b) => b.type === 'text');
  if (firstText?.type === 'text') walk(firstText.doc as { content?: unknown[] });
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Fil du blog, du plus récent au plus ancien, par pages.
   * `before` = id du dernier article de la page précédente (les id croissent avec la date).
   */
  async list(before?: number, pageSize = 12) {
    const rows = await this.prisma.article.findMany({
      where: before ? { id: { lt: before } } : undefined,
      orderBy: { id: 'desc' },
      take: pageSize + 1,
      select: { ...LIST_SELECT, content: true, _count: { select: { comments: true, reactions: true } } },
    });
    const page = rows.slice(0, pageSize);
    return {
      items: page.map(({ content, _count, ...a }) => ({
        ...a,
        excerpt: excerptOf(content as unknown as ArticleContent),
        readingMinutes: readingMinutes(content as unknown as ArticleContent),
        commentCount: _count.comments,
        reactionCount: _count.reactions,
      })),
      nextBefore: rows.length > pageSize ? page[page.length - 1].id : null,
    };
  }

  async get(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { ...LIST_SELECT, content: true, updatedAt: true, themeId: true },
    });
    if (!article) throw new NotFoundException('Article introuvable');
    return { ...article, readingMinutes: readingMinutes(article.content as unknown as ArticleContent) };
  }

  async create(user: AuthUser, input: ArticleInput) {
    await this.requireTheme(input.themeId);
    const { coverUrl, media } = await this.checkFiles(user, input);
    const article = await this.prisma.article.create({
      data: {
        title: input.title,
        themeId: input.themeId,
        authorId: user.id,
        coverUrl: coverUrl ?? null,
        content: input.content as unknown as Prisma.InputJsonValue,
        media: { create: media.map((m) => ({ ...m, uploaderId: user.id })) },
      },
      select: { id: true },
    });
    return this.get(article.id);
  }

  async update(user: AuthUser, id: number, input: ArticleInput) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article introuvable');
    if (existing.authorId !== user.id) throw new ForbiddenException("Seul l'auteur peut modifier cet article");
    await this.requireTheme(input.themeId);

    const { coverUrl, media } = await this.checkFiles(user, input);
    const keepCover = input.coverKey === undefined;
    const newCover = keepCover ? existing.coverUrl : (coverUrl ?? null);

    await this.prisma.$transaction([
      this.prisma.media.deleteMany({ where: { articleId: id } }),
      this.prisma.article.update({
        where: { id },
        data: {
          title: input.title,
          themeId: input.themeId,
          coverUrl: newCover,
          content: input.content as unknown as Prisma.InputJsonValue,
          media: { create: media.map((m) => ({ ...m, uploaderId: user.id })) },
        },
      }),
    ]);

    // Fichiers qui ne sont plus utilisés par cet article : on les retire du bucket.
    const before = this.filesOf(existing.content as unknown as ArticleContent, existing.coverUrl);
    const after = this.filesOf(input.content, newCover);
    await Promise.all([...before].filter((k) => !after.has(k)).map((k) => this.storage.deleteQuietly(k)));

    return this.get(id);
  }

  /** Auteur, ou admin (modération). */
  async remove(user: AuthUser, id: number) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article introuvable');
    if (existing.authorId !== user.id && user.role !== 'ADMIN') throw new ForbiddenException();
    await this.removeById(id);
  }

  /** Suppression sans contrôle de droits (déjà fait par l'appelant), fichiers compris. */
  async removeById(id: number) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article introuvable');
    await this.prisma.$transaction([
      this.prisma.media.deleteMany({ where: { articleId: id } }),
      this.prisma.article.delete({ where: { id } }),
    ]);
    const files = this.filesOf(existing.content as unknown as ArticleContent, existing.coverUrl);
    await Promise.all([...files].map((k) => this.storage.deleteQuietly(k)));
  }

  private async requireTheme(themeId: number) {
    const theme = await this.prisma.theme.findUnique({ where: { id: themeId }, select: { id: true } });
    if (!theme) throw new BadRequestException('Thème inconnu');
  }

  /** Vérifie chaque fichier référencé (appartient à l'auteur, bien reçu, bon type, bonne taille). */
  private async checkFiles(user: AuthUser, input: ArticleInput) {
    const refs = mediaRefs(input.content);
    const media = await Promise.all(
      refs.map(async (r) => {
        const meta = await this.uploads.inspect(user, r.purpose, r.key);
        return { type: r.type, url: meta.url, mime: meta.contentType, size: meta.size };
      }),
    );
    const coverUrl = input.coverKey ? await this.uploads.confirm(user, 'article-image', input.coverKey) : input.coverKey;
    return { coverUrl, media };
  }

  private filesOf(content: ArticleContent | null, coverUrl: string | null) {
    const keys = new Set(content?.rows ? mediaRefs(content).map((r) => r.key) : []);
    const cover = keyFromMediaUrl(coverUrl);
    if (cover) keys.add(cover);
    return keys;
  }
}
