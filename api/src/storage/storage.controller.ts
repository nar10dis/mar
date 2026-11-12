import { Body, Controller, Get, Header, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { Response } from 'express';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { StorageService } from './storage.service.js';
import { UploadsService } from './uploads.service.js';
import { UPLOAD_RULES } from './upload-rules.js';
import type { UploadPurpose } from './upload-rules.js';

const prepareSchema = z.object({
  purpose: z.enum(Object.keys(UPLOAD_RULES) as [UploadPurpose, ...UploadPurpose[]]),
  contentType: z.string().max(100),
  size: z.number().int().positive(),
});

const SERVED_PREFIXES = ['avatars/', 'covers/', 'media/'];

@Controller()
export class StorageController {
  constructor(
    private readonly storage: StorageService,
    private readonly uploads: UploadsService,
  ) {}

  /** Demande d'upload : renvoie une URL de PUT signée, valable 10 min. */
  @Can.Anyone()
  @Post('uploads')
  prepare(@CurrentUser() user: AuthUser, @Body({ schema: prepareSchema }) body: z.infer<typeof prepareSchema>) {
    return this.uploads.prepare(user, body.purpose, body.contentType, body.size);
  }

  /** Sert un fichier du bucket privé : redirection vers une URL signée (1 h). */
  @Public()
  @Get('media/*key')
  @Header('Cache-Control', 'public, max-age=3000')
  async media(@Param('key') raw: string | string[], @Res() res: Response) {
    const key = Array.isArray(raw) ? raw.join('/') : raw;
    if (!SERVED_PREFIXES.some((p) => key.startsWith(p)) || key.includes('..')) throw new NotFoundException();
    if (!this.storage.enabled) throw new NotFoundException();
    res.redirect(302, await this.storage.presignDownload(key));
  }

  /** Utile au front pour savoir s'il peut proposer l'upload. */
  @Public()
  @Get('uploads/status')
  status() {
    return { enabled: this.storage.enabled };
  }
}
