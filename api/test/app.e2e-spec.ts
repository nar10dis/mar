import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Requires the database to be running (npm run db:up at the repo root).
describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
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

  afterEach(async () => {
    await app.close();
  });
});
