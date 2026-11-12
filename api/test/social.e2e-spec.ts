import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, sessionCookie, uniq } from './helpers.js';

// Requiert Postgres : npm run db:up à la racine.
describe('Réactions et commentaires (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const id = uniq();
  const author = { email: `auteur-${id}@test.local`, password: 'motdepasse-solide', pseudo: `auteur_${id}` };
  const reader = { email: `lecteur-${id}@test.local`, password: 'motdepasse-solide', pseudo: `lecteur_${id}` };
  let authorCookie: string;
  let readerCookie: string;
  let articleId: number;
  let otherArticleId: number;

  const http = () => request(app.getHttpServer());

  /** Le cookie anonyme est `__Host-` (Secure) : supertest ne le renverrait pas en http. */
  const voterCookie = (res: request.Response) => {
    const raw = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const c = raw.find((x) => x.startsWith('__Host-mar_voter='));
    if (!c) throw new Error('pas de cookie votant');
    return c.split(';')[0];
  };

  const newArticle = async (title: string) => {
    const themeId = (await prisma.theme.findFirstOrThrow()).id;
    const res = await http()
      .post('/api/articles')
      .set('Cookie', authorCookie)
      .send({
        title,
        themeId,
        content: { v: 1, rows: [{ id: 'r', cols: [{ id: 'b', type: 'youtube', videoId: 'dQw4w9WgXcQ' }] }] },
      })
      .expect(201);
    return res.body.id as number;
  };

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    authorCookie = sessionCookie(await http().post('/api/auth/sign-up').send(author).expect(201));
    readerCookie = sessionCookie(await http().post('/api/auth/sign-up').send(reader).expect(201));
    articleId = await newArticle(`Réactions ${id}`);
    otherArticleId = await newArticle(`Autre ${id}`);
  });

  afterAll(async () => {
    await prisma.article.deleteMany({ where: { id: { in: [articleId, otherArticleId] } } });
    await prisma.user.deleteMany({ where: { email: { in: [author.email, reader.email] } } });
    await app.close();
  });

  it('visiteur non connecté : réagit, change d’avis, retire sa réaction', async () => {
    const empty = await http().get(`/api/articles/${articleId}/reactions`).expect(200);
    expect(empty.body.mine).toBeNull();
    expect(empty.body.counts.HEART).toBe(0);

    const first = await http().put(`/api/articles/${articleId}/reactions`).send({ kind: 'HEART' }).expect(200);
    expect(first.body).toMatchObject({ mine: 'HEART', counts: { HEART: 1 } });
    const anon = voterCookie(first);
    expect(String(first.headers['set-cookie'])).toMatch(/HttpOnly/i);

    // Même visiteur : modifie sa réaction, le total ne double pas
    const changed = await http().put(`/api/articles/${articleId}/reactions`).set('Cookie', anon).send({ kind: 'ZZ' }).expect(200);
    expect(changed.body).toMatchObject({ mine: 'ZZ', counts: { HEART: 0, ZZ: 1 } });

    // Un autre visiteur (sans cookie) compte à part
    await http().put(`/api/articles/${articleId}/reactions`).send({ kind: 'ZZ' }).expect(200);
    const seen = await http().get(`/api/articles/${articleId}/reactions`).set('Cookie', anon).expect(200);
    expect(seen.body).toMatchObject({ mine: 'ZZ', counts: { ZZ: 2 } });

    const removed = await http().delete(`/api/articles/${articleId}/reactions`).set('Cookie', anon).expect(200);
    expect(removed.body).toMatchObject({ mine: null, counts: { ZZ: 1 } });
  });

  it('connecté : une réaction liée au compte', async () => {
    const res = await http().put(`/api/articles/${articleId}/reactions`).set('Cookie', readerCookie).send({ kind: 'NOTE' }).expect(200);
    expect(res.body.mine).toBe('NOTE');
    expect(await prisma.reaction.count({ where: { articleId, voterKey: { startsWith: 'user:' } } })).toBe(1);
  });

  it('refuse une bulle inconnue et un article inexistant', async () => {
    await http().put(`/api/articles/${articleId}/reactions`).send({ kind: 'LOL' }).expect(400);
    await http().put('/api/articles/999999999/reactions').send({ kind: 'HEART' }).expect(404);
  });

  it('commentaires : il faut un compte pour écrire', async () => {
    await http().post(`/api/articles/${articleId}/comments`).send({ body: 'Coucou' }).expect(401);
  });

  it('commentaires : commenter, répondre, lister (public)', async () => {
    const parent = await http().post(`/api/articles/${articleId}/comments`).set('Cookie', readerCookie).send({ body: 'Premier !' }).expect(201);
    expect(parent.body.author.pseudo).toBe(reader.pseudo);
    const reply = await http()
      .post(`/api/articles/${articleId}/comments`)
      .set('Cookie', authorCookie)
      .send({ body: 'Merci', parentId: parent.body.id })
      .expect(201);
    expect(reply.body.parentId).toBe(parent.body.id);

    const list = await http().get(`/api/articles/${articleId}/comments`).expect(200);
    expect(list.body.map((c: { body: string }) => c.body)).toEqual(['Premier !', 'Merci']);
    expect(list.body[0].author).not.toHaveProperty('email');

    // Répondre à un commentaire d'un autre article : refusé
    await http()
      .post(`/api/articles/${otherArticleId}/comments`)
      .set('Cookie', readerCookie)
      .send({ body: 'Hors sujet', parentId: parent.body.id })
      .expect(400);
    // Commentaire vide : refusé
    await http().post(`/api/articles/${articleId}/comments`).set('Cookie', readerCookie).send({ body: '   ' }).expect(400);
  });

  it('le fil compte réactions et commentaires', async () => {
    const res = await http().get('/api/articles').expect(200);
    const a = res.body.items.find((x: { id: number }) => x.id === articleId);
    expect(a.commentCount).toBe(2);
    expect(a.reactionCount).toBe(2);
  });
});
