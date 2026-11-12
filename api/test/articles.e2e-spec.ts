import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StorageService } from '../src/storage/storage.service.js';
import { createApp, sessionCookie, uniq } from './helpers.js';

// Requiert Postgres + S3Mock : npm run db:up à la racine.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPj/HwADAgH/Zx8OQgAAAABJRU5ErkJggg==',
  'base64',
);
const MP3 = Buffer.from('ID3fake-mp3-for-tests');

describe('Articles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let storage: StorageService;
  const id = uniq();
  const alice = { email: `alice-${id}@test.local`, password: 'motdepasse-solide', pseudo: `alice_${id}` };
  const bob = { email: `bob-${id}@test.local`, password: 'motdepasse-solide', pseudo: `bob_${id}` };
  let aliceCookie: string;
  let bobCookie: string;
  let themeId: number;
  let articleId: number;
  let imageKey: string;
  let audioKey: string;

  const http = () => request(app.getHttpServer());

  async function upload(cookie: string, purpose: string, contentType: string, body: Buffer) {
    const prep = await http().post('/api/uploads').set('Cookie', cookie).send({ purpose, contentType, size: body.length }).expect(201);
    const put = await fetch(prep.body.uploadUrl, { method: 'PUT', body, headers: { 'Content-Type': contentType } });
    expect(put.status).toBe(200);
    return prep.body.key as string;
  }

  const text = (s: string, marks?: unknown[]) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: s, ...(marks && { marks }) }] }],
  });

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    storage = app.get(StorageService);
    aliceCookie = sessionCookie(await http().post('/api/auth/sign-up').send(alice).expect(201));
    bobCookie = sessionCookie(await http().post('/api/auth/sign-up').send(bob).expect(201));
    themeId = (await prisma.theme.findFirstOrThrow({ where: { slug: 'cinema' } })).id;
  });

  afterAll(async () => {
    await prisma.article.deleteMany({ where: { author: { email: { in: [alice.email, bob.email] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [alice.email, bob.email] } } });
    await app.close();
  });

  it('crée un article mixte : texte riche + image + son + YouTube, sur 2 rangées', async () => {
    imageKey = await upload(aliceCookie, 'article-image', 'image/png', PNG);
    audioKey = await upload(aliceCookie, 'article-audio', 'audio/mpeg', MP3);
    const res = await http()
      .post('/api/articles')
      .set('Cookie', aliceCookie)
      .send({
        title: 'Un article mixte',
        themeId,
        content: {
          v: 1,
          rows: [
            {
              id: 'r1',
              cols: [
                { id: 'b1', type: 'text', doc: text('Du gras', [{ type: 'bold' }, { type: 'highlight' }]) },
                { id: 'b2', type: 'image', key: imageKey, alt: 'Un pixel', caption: 'Légende' },
              ],
            },
            {
              id: 'r2',
              cols: [
                { id: 'b3', type: 'audio', key: audioKey, title: 'Un son' },
                { id: 'b4', type: 'youtube', videoId: 'dQw4w9WgXcQ' },
              ],
            },
          ],
        },
      })
      .expect(201);
    articleId = res.body.id;
    expect(res.body.author.pseudo).toBe(alice.pseudo);
    expect(res.body.content.rows).toHaveLength(2);
    expect(await prisma.media.count({ where: { articleId } })).toBe(2);
  });

  it('lecture publique : liste et détail, sans compte', async () => {
    const list = await http().get('/api/articles').expect(200);
    expect(list.body.some((a: { id: number }) => a.id === articleId)).toBe(true);
    const one = await http().get(`/api/articles/${articleId}`).expect(200);
    expect(one.body.title).toBe('Un article mixte');
    await http().get('/api/articles/999999999').expect(404);
  });

  it('refuse un lien javascript:, un nœud non autorisé, une vidéo invalide, une rangée de 4 colonnes', async () => {
    const base = { title: 'Pirate', themeId };
    const bad = [
      { v: 1, rows: [{ id: 'r', cols: [{ id: 'b', type: 'text', doc: text('x', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]) }] }] },
      { v: 1, rows: [{ id: 'r', cols: [{ id: 'b', type: 'text', doc: { type: 'doc', content: [{ type: 'codeBlock', content: [] }] } }] }] },
      { v: 1, rows: [{ id: 'r', cols: [{ id: 'b', type: 'youtube', videoId: '"><script>' }] }] },
      { v: 1, rows: [{ id: 'r', cols: [1, 2, 3, 4].map((n) => ({ id: `b${n}`, type: 'youtube', videoId: 'dQw4w9WgXcQ' })) }] },
      { v: 1, rows: [] },
    ];
    for (const content of bad) {
      await http().post('/api/articles').set('Cookie', aliceCookie).send({ ...base, content }).expect(400);
    }
  });

  it("refuse le fichier d'un autre utilisateur et un fichier du mauvais type", async () => {
    const content = (key: string, type = 'image') => ({
      v: 1,
      rows: [{ id: 'r', cols: [{ id: 'b', type, key, alt: 'x' }] }],
    });
    // Bob tente de réutiliser l'image d'Alice
    await http().post('/api/articles').set('Cookie', bobCookie).send({ title: 'Vol', themeId, content: content(imageKey) }).expect(400);
    // Un son déclaré comme image
    await http().post('/api/articles').set('Cookie', aliceCookie).send({ title: 'Faux', themeId, content: content(audioKey) }).expect(400);
  });

  it("seul l'auteur modifie ; un fichier retiré est supprimé du bucket", async () => {
    const content = { v: 1, rows: [{ id: 'r1', cols: [{ id: 'b1', type: 'text', doc: text('Version 2') }] }] };
    await http().patch(`/api/articles/${articleId}`).set('Cookie', bobCookie).send({ title: 'Volé', themeId, content }).expect(403);

    const res = await http().patch(`/api/articles/${articleId}`).set('Cookie', aliceCookie).send({ title: 'Version 2', themeId, content }).expect(200);
    expect(res.body.title).toBe('Version 2');
    expect(await prisma.media.count({ where: { articleId } })).toBe(0);
    expect(await storage.head(imageKey)).toBeNull();
    expect(await storage.head(audioKey)).toBeNull();
  });

  it('suppression : 403 pour un autre, 204 pour l’auteur', async () => {
    await http().delete(`/api/articles/${articleId}`).set('Cookie', bobCookie).expect(403);
    await http().delete(`/api/articles/${articleId}`).set('Cookie', aliceCookie).expect(204);
    await http().get(`/api/articles/${articleId}`).expect(404);
  });

  it('écrire demande un compte', async () => {
    await http().post('/api/articles').send({}).expect(401);
  });
});
