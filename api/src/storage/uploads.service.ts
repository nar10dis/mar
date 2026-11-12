import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth.types.js';
import { StorageService } from './storage.service.js';
import { keyPrefix, mediaUrl, UPLOAD_RULES } from './upload-rules.js';
import type { UploadPurpose } from './upload-rules.js';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  /** Étape 1 : le navigateur demande où envoyer son fichier. */
  async prepare(user: AuthUser, purpose: UploadPurpose, contentType: string, size: number) {
    const rule = UPLOAD_RULES[purpose];
    if (rule.adminOnly && user.role !== 'ADMIN') throw new ForbiddenException();
    const ext = (rule.types as Record<string, string>)[contentType];
    if (!ext) throw new BadRequestException(`Format refusé. Acceptés : ${Object.values(rule.types).join(', ')}`);
    if (size > rule.maxBytes) {
      throw new BadRequestException(`Fichier trop lourd (max ${Math.round(rule.maxBytes / 1024 / 1024)} Mo)`);
    }
    const key = `${keyPrefix(purpose, user.id)}${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.presignUpload(key, contentType, size);
    return { key, uploadUrl, url: mediaUrl(key) };
  }

  /**
   * Étape 2 : avant d'enregistrer une clé en base, on vérifie qu'elle appartient bien
   * à cet usage / cet utilisateur et que le fichier uploadé respecte les règles.
   */
  async confirm(user: AuthUser, purpose: UploadPurpose, key: string) {
    return (await this.inspect(user, purpose, key)).url;
  }

  /** Comme confirm(), et renvoie aussi le type et la taille réels du fichier. */
  async inspect(user: AuthUser, purpose: UploadPurpose, key: string) {
    const rule = UPLOAD_RULES[purpose];
    if (!key.startsWith(keyPrefix(purpose, user.id)) || key.includes('..')) {
      throw new BadRequestException('Fichier invalide');
    }
    const meta = await this.storage.head(key);
    if (!meta) throw new BadRequestException("Le fichier n'a pas été reçu, réessayez");
    if (!(meta.contentType in rule.types) || meta.size > rule.maxBytes) {
      await this.storage.deleteQuietly(key);
      throw new BadRequestException('Fichier refusé');
    }
    return { url: mediaUrl(key), contentType: meta.contentType, size: meta.size };
  }
}
