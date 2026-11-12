import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { OnApplicationBootstrap } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Bucket S3 : Railway Storage Bucket en prod, S3Mock en local.
 * Les buckets Railway sont privés : on upload et on sert via des URLs signées.
 * Sans configuration (S3_BUCKET absent), l'app tourne quand même, seuls les uploads sont refusés.
 */
@Injectable()
export class StorageService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.S3_BUCKET;
  private readonly client = this.bucket
    ? new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION ?? 'auto',
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
      })
    : null;

  /**
   * Le navigateur envoie les fichiers directement au bucket : celui-ci doit autoriser
   * (CORS) le domaine du site. On l'applique à chaque démarrage depuis S3_CORS_ORIGINS
   * ("https://site.up.railway.app,https://mortauxrats.fr"), ce qui évite toute manip en CLI.
   */
  async onApplicationBootstrap() {
    const origins = (process.env.S3_CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
    if (!this.client || !this.bucket || origins.length === 0) return;
    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [{ AllowedOrigins: origins, AllowedMethods: ['PUT'], AllowedHeaders: ['*'], MaxAgeSeconds: 3000 }],
          },
        }),
      );
      this.logger.log(`CORS du bucket : ${origins.join(', ')}`);
    } catch (e) {
      this.logger.error(`Impossible de configurer le CORS du bucket : ${String(e)}`);
    }
  }

  get enabled() {
    return this.client !== null;
  }

  private require() {
    if (!this.client || !this.bucket) throw new ServiceUnavailableException("Le stockage de fichiers n'est pas configuré");
    return { client: this.client, bucket: this.bucket };
  }

  /** URL de PUT signée : le type et la taille exacts font partie de la signature. */
  presignUpload(key: string, contentType: string, size: number) {
    const { client, bucket } = this.require();
    return getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: size }),
      { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-length']) },
    );
  }

  /** URL de lecture signée (le bucket est privé). */
  presignDownload(key: string, expiresIn = 3600) {
    const { client, bucket } = this.require();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  }

  /** Métadonnées de l'objet, ou null s'il n'existe pas. */
  async head(key: string) {
    const { client, bucket } = this.require();
    try {
      const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { contentType: res.ContentType ?? '', size: res.ContentLength ?? 0 };
    } catch (e) {
      if ((e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  }

  /** Suppression best-effort (ex. ancien avatar) : un échec ne doit pas casser la requête. */
  async deleteQuietly(key: string) {
    if (!this.client || !this.bucket) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (e) {
      this.logger.warn(`Suppression de ${key} impossible : ${String(e)}`);
    }
  }

  /**
   * Supprime tout ce qui commence par `prefix` (ex. « media/12/ » à la suppression d'un compte).
   * Best-effort comme deleteQuietly : renvoie le nombre de fichiers supprimés.
   */
  async deletePrefix(prefix: string) {
    if (!this.client || !this.bucket || !prefix.endsWith('/')) return 0;
    let deleted = 0;
    let token: string | undefined;
    try {
      do {
        const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: token }));
        for (const obj of page.Contents ?? []) {
          if (!obj.Key) continue;
          await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: obj.Key }));
          deleted++;
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    } catch (e) {
      this.logger.warn(`Suppression de ${prefix}* incomplète : ${String(e)}`);
    }
    return deleted;
  }
}
