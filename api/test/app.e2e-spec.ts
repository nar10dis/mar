import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers.js';

// Requiert Postgres : npm run db:up à la racine.
describe('API publique (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200).expect({ status: 'ok' });
  });

  it.each(['/api/themes', '/api/magazines', '/api/announcements'])('GET %s returns an array', async (url) => {
    const res = await request(app.getHttpServer()).get(url).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/magazines hides unpublished fields', async () => {
    const res = await request(app.getHttpServer()).get('/api/magazines').expect(200);
    for (const m of res.body) {
      expect(m).not.toHaveProperty('published');
      expect(m).not.toHaveProperty('order');
    }
  });

  it('GET /api/media refuses keys outside the served prefixes', async () => {
    await request(app.getHttpServer()).get('/api/media/secret/file.txt').expect(404);
  });
});
