import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, sessionCookie, uniq } from './helpers.js';

// Requiert Postgres : npm run db:up à la racine.
describe('Profil et sac (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const id = uniq();
  const author = { email: `auteur-${id}@test.local`, password: 'motdepasse-solide', pseudo: `sac_a_${id}` };
  const reader = { email: `lecteur-${id}@test.local`, password: 'motdepasse-solide', pseudo: `sac_l_${id}` };
  let authorCookie: string;
  let readerCookie: string;
  /** 9 articles de l'auteur : un de plus que le sac n'a de cases */
  const articles: number[] = [];

  const http = () => request(app.getHttpServer());
  const ids = (body: ({ id: number } | null)[]) => body.map((a) => a?.id ?? null);

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    authorCookie = sessionCookie(await http().post('/api/auth/sign-up').send(author).expect(201));
    readerCookie = sessionCookie(await http().post('/api/auth/sign-up').send(reader).expect(201));
    const themeId = (await prisma.theme.findFirstOrThrow()).id;
    for (let i = 0; i < 9; i++) {
      const res = await http()
        .post('/api/articles')
        .set('Cookie', authorCookie)
        .send({
          title: `Sac ${i} ${id}`,
          themeId,
          content: { v: 1, rows: [{ id: 'r', cols: [{ id: 'b', type: 'youtube', videoId: 'dQw4w9WgXcQ' }] }] },
        })
        .expect(201);
      articles.push(res.body.id as number);
    }
  });

  afterAll(async () => {
    await prisma.article.deleteMany({ where: { id: { in: articles } } });
    await prisma.user.deleteMany({ where: { email: { in: [author.email, reader.email] } } });
    await app.close();
  });

  it('refuse les visiteurs non connectés', async () => {
    await http().get('/api/me/profile').expect(401);
    await http().get('/api/me/inventory').expect(401);
    await http().post('/api/me/inventory').send({ articleId: articles[0] }).expect(401);
  });

  it('sac vide au départ, ses propres articles refusés', async () => {
    const inv = await http().get('/api/me/inventory').set('Cookie', readerCookie).expect(200);
    expect(inv.body).toEqual(Array(8).fill(null));
    await http().post('/api/me/inventory').set('Cookie', authorCookie).send({ articleId: articles[0] }).expect(400);
    await http().post('/api/me/inventory').set('Cookie', readerCookie).send({ articleId: 999_999_999 }).expect(404);
  });

  it('remplit, refuse les doublons et le 9e article', async () => {
    let body: ({ id: number } | null)[] = [];
    for (const a of articles.slice(0, 8)) {
      body = (await http().post('/api/me/inventory').set('Cookie', readerCookie).send({ articleId: a }).expect(201)).body;
    }
    expect(ids(body)).toEqual(articles.slice(0, 8));
    await http().post('/api/me/inventory').set('Cookie', readerCookie).send({ articleId: articles[0] }).expect(409);
    await http().post('/api/me/inventory').set('Cookie', readerCookie).send({ articleId: articles[8] }).expect(409);
  });

  it('vide une case, la remplit à nouveau dans le premier trou', async () => {
    const removed = await http().delete('/api/me/inventory/2').set('Cookie', readerCookie).expect(200);
    expect(removed.body[2]).toBeNull();
    const added = await http().post('/api/me/inventory').set('Cookie', readerCookie).send({ articleId: articles[8] }).expect(201);
    expect(added.body[2].id).toBe(articles[8]);
  });

  it('réordonne : échange deux cases pleines, puis une pleine avec une vide', async () => {
    const swapped = await http().post('/api/me/inventory/swap').set('Cookie', readerCookie).send({ from: 0, to: 7 }).expect(201);
    expect(swapped.body[0].id).toBe(articles[7]);
    expect(swapped.body[7].id).toBe(articles[0]);

    await http().delete('/api/me/inventory/5').set('Cookie', readerCookie).expect(200);
    const moved = await http().post('/api/me/inventory/swap').set('Cookie', readerCookie).send({ from: 7, to: 5 }).expect(201);
    expect(moved.body[5].id).toBe(articles[0]);
    expect(moved.body[7]).toBeNull();

    await http().post('/api/me/inventory/swap').set('Cookie', readerCookie).send({ from: 0, to: 8 }).expect(400);
  });

  it('profil : identité, articles écrits, sac', async () => {
    const res = await http().get('/api/me/profile').set('Cookie', authorCookie).expect(200);
    expect(res.body.pseudo).toBe(author.pseudo);
    expect(res.body.articles).toHaveLength(9);
    expect(res.body.inventory).toEqual(Array(8).fill(null));
    expect(res.body).not.toHaveProperty('email');
  });

  it('un article supprimé disparaît du sac', async () => {
    await http().delete(`/api/articles/${articles[1]}`).set('Cookie', authorCookie).expect(204);
    const inv = await http().get('/api/me/inventory').set('Cookie', readerCookie).expect(200);
    expect(ids(inv.body)).not.toContain(articles[1]);
  });
});
