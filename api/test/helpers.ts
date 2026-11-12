import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

export async function createApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
  await app.init();
  return app;
}

/** Le cookie de session est `Secure` : supertest ne le renverrait pas en http, on le gère à la main. */
export function sessionCookie(res: request.Response) {
  const raw = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const sid = raw.find((c) => c.startsWith('__Host-sid='));
  if (!sid) throw new Error(`Pas de cookie de session dans ${JSON.stringify(raw)}`);
  return sid.split(';')[0];
}

export const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type TestServer = App;
