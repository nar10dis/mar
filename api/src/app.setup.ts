import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

/** Réglages communs à main.ts et aux tests e2e. */
export function configureApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  // Railway termine le TLS devant l'app : on fait confiance à son proxy pour l'IP / le protocole.
  app.set('trust proxy', 1);
  // Valide les @Body({ schema }) / @Param(..., { schema }) avec zod.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // 403 sur toute écriture (POST, PATCH, DELETE…) venant d'un autre site.
  app.enableCsrfProtection();
  return app;
}
