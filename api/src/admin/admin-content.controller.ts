import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { z } from 'zod';
import { AdminPolicy } from '../auth/admin.policy.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { keyFromMediaUrl } from '../storage/upload-rules.js';
import { UploadsService } from '../storage/uploads.service.js';
import {
  announcementSchema,
  announcementUpdateSchema,
  idParam,
  magazineCreateSchema,
  magazineUpdateSchema,
} from './admin.schemas.js';

/** Back-office : magazines (shop) et annonces (actu). */
@Can(AdminPolicy, 'manage')
@Controller('admin')
export class AdminContentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly storage: StorageService,
  ) {}

  // ---------------------------------------------------------------- Magazines
  @Get('magazines')
  listMagazines() {
    return this.prisma.magazine.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  }

  @Post('magazines')
  async createMagazine(@CurrentUser() user: AuthUser, @Body({ schema: magazineCreateSchema }) body: z.infer<typeof magazineCreateSchema>) {
    const { coverKey, ...data } = body;
    const coverUrl = await this.uploads.confirm(user, 'cover', coverKey);
    return this.prisma.magazine.create({ data: { ...data, coverUrl } });
  }

  @Patch('magazines/:id')
  async updateMagazine(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: magazineUpdateSchema }) body: z.infer<typeof magazineUpdateSchema>,
  ) {
    const existing = await this.prisma.magazine.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const { coverKey, ...data } = body;
    const coverUrl = coverKey ? await this.uploads.confirm(user, 'cover', coverKey) : undefined;
    const updated = await this.prisma.magazine.update({ where: { id }, data: { ...data, ...(coverUrl && { coverUrl }) } });
    const oldKey = keyFromMediaUrl(existing.coverUrl);
    if (coverUrl && oldKey) await this.storage.deleteQuietly(oldKey);
    return updated;
  }

  @Delete('magazines/:id')
  @HttpCode(204)
  async deleteMagazine(@Param('id', { schema: idParam }) id: number) {
    const existing = await this.prisma.magazine.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.magazine.delete({ where: { id } });
    const key = keyFromMediaUrl(existing.coverUrl);
    if (key) await this.storage.deleteQuietly(key);
  }

  // ---------------------------------------------------------------- Annonces
  @Get('announcements')
  listAnnouncements() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('announcements')
  createAnnouncement(@Body({ schema: announcementSchema }) body: z.infer<typeof announcementSchema>) {
    return this.prisma.announcement.create({ data: body });
  }

  @Patch('announcements/:id')
  async updateAnnouncement(
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: announcementUpdateSchema }) body: z.infer<typeof announcementUpdateSchema>,
  ) {
    const { count } = await this.prisma.announcement.updateMany({ where: { id }, data: body });
    if (!count) throw new NotFoundException();
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  @Delete('announcements/:id')
  @HttpCode(204)
  async deleteAnnouncement(@Param('id', { schema: idParam }) id: number) {
    const { count } = await this.prisma.announcement.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException();
  }
}
