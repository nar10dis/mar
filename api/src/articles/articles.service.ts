import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { keyFromMediaUrl } from '../storage/upload-rules.js';
import { UploadsService } from '../storage/uploads.service.js';
import { mediaRefs } from './article-content.schema.js';
import type { ArticleContent, ArticleInput } from './article-content.schema.js';

const LIST_SELECT = {
  id: true,
  title: true,
  coverUrl: true,
  createdAt: true,
  theme: { select: { slug: true, name: true, color: true } },
  author: { select: { id: true, pseudo: true, avatarUrl: true } },
} as const;

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly storage: StorageService,
  ) {}

  list() {
    return this.prisma.article.findMany({ orderBy: { createdAt: 'desc' }, take: 50, select: LIST_SELECT });
  }

  async get(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { ...LIST_SELECT, content: true, updatedAt: true, themeId: true },
    });
    if (!article) throw new NotFoundException('Article introuvable');
    return article;
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
