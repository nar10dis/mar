import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StorageService } from '../src/storage/storage.service.js';
import { createApp, sessionCookie, uniq } from './helpers.js';

// Requiert Postgres + S3Mock : npm run db:up à la racine.
describe('Suppression de compte et limites (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const id = uniq();
  const gone = { email: `parti-${id}@test.local`, password: 'motdepasse-solide', pseudo: `parti_${id}` };
  const other = { email: `reste-${id}@test.local`, password: 'motdepasse-solide', pseudo: `reste_${id}` };
  let goneCookie: string;
  let otherCookie: string;
  let goneId: number;
  let otherArticle: number;

  const http = () => request(app.getHttpServer());
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPj/HwADAgH/Zx8OQgAAAABJRU5ErkJggg==', 'base64');

  const upload = async (purpose: string) => {
    const prep = await http().post('/api/uploads').set('Cookie', goneCookie).send({ purpose, contentType: 'image/png', size: png.length }).expect(201);
    const put = await fetch(prep.body.uploadUrl, { method: 'PUT', body: new Uint8Array(png), headers: { 'Content-Type': 'image/png' } });
    expect(put.status).toBe(200);
    return prep.body.key as string;
  };

  const article = async (cookie: string, title: string, cols: unknown[]) => {
    const themeId = (await prisma.theme.findFirstOrThrow()).id;
    const res = await http().post('/api/articles').set('Cookie', cookie).send({ title, themeId, content: { v: 1, rows: [{ id: 'r', cols }] } }).expect(201);
    return res.body.id as number;
  };

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    const signUp = await http().post('/api/auth/sign-up').send(gone).expect(201);
    goneCookie = sessionCookie(signUp);
    goneId = signUp.body.id;
    otherCookie = sessionCookie(await http().post('/api/auth/sign-up').send(other).expect(201));
    otherArticle = await article(otherCookie, `Reste ${id}`, [{ id: 'b', type: 'youtube', videoId: 'dQw4w9WgXcQ' }]);
  });

  afterAll(async () => {
    await prisma.article.deleteMany({ where: { id: otherArticle } });
    await prisma.user.deleteMany({ where: { email: { in: [gone.email, other.email] } } });
    await app.close();
  });

  it('supprime le compte, ses contenus et ses fichiers ; le reste du site est intact', async () => {
    // Le compte qui va partir : avatar, article avec image, réaction et commentaire chez l'autre, un article dans son sac
    const avatarKey = await upload('avatar');
    await http().patch('/api/me').set('Cookie', goneCookie).send({ avatarKey }).expect(200);
    const imageKey = await upload('article-image');
    const own = await article(goneCookie, `Parti ${id}`, [{ id: 'b', type: 'image', key: imageKey, alt: 'Une image' }]);
    await http().put(`/api/articles/${otherArticle}/reactions`).set('Cookie', goneCookie).send({ kind: 'HEART' }).expect(200);
    await http().post(`/api/articles/${otherArticle}/comments`).set('Cookie', goneCookie).send({ body: 'Au revoir' }).expect(201);
    await http().post('/api/me/inventory').set('Cookie', goneCookie).send({ articleId: otherArticle }).expect(201);
    // Et l'autre compte avait mis l'article du partant dans son sac
    await http().post('/api/me/inventory').set('Cookie', otherCookie).send({ articleId: own }).expect(201);

    // Mauvais mot de passe : rien ne bouge
    await http().delete('/api/me').set('Cookie', goneCookie).send({ password: 'pas-le-bon' }).expect(403);
    await http().delete('/api/me').send({ password: gone.password }).expect(401);

    await http().delete('/api/me').set('Cookie', goneCookie).send({ password: gone.password }).expect(204);

    expect(await prisma.user.findUnique({ where: { id: goneId } })).toBeNull();
    expect(await prisma.article.findUnique({ where: { id: own } })).toBeNull();
    expect(await prisma.reaction.count({ where: { voterKey: `user:${goneId}` } })).toBe(0);
    expect(await prisma.comment.count({ where: { authorId: goneId } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: goneId } })).toBe(0);
    // Fichiers retirés du bucket
    const storage = app.get(StorageService);
    expect(await storage.head(avatarKey)).toBeNull();
    expect(await storage.head(imageKey)).toBeNull();
    // Session révoquée
    await http().get('/api/me/profile').set('Cookie', goneCookie).expect(401);
    // L'autre compte et son article sont intacts ; l'article disparu a quitté son sac
    const reactions = await http().get(`/api/articles/${otherArticle}/reactions`).expect(200);
    expect(reactions.body.counts.HEART).toBe(0);
    const inv = await http().get('/api/me/inventory').set('Cookie', otherCookie).expect(200);
    expect(inv.body).toEqual(Array(8).fill(null));
  });

  it('rate limiting : 429 au-delà de la limite, avec Retry-After', async () => {
    const wrong = { email: `inconnu-${id}@test.local`, password: 'mauvais-mot-de-passe' };
    for (let i = 0; i < 20; i++) await http().post('/api/auth/sign-in').send(wrong).expect(401);
    const res = await http().post('/api/auth/sign-in').send(wrong).expect(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(res.body.message).toMatch(/tentatives/);
  }, 30_000); // 20 vérifications de mot de passe (scrypt) : plus long que le timeout par défaut
});
