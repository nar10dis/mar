import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, sessionCookie, uniq } from './helpers.js';

// Requiert Postgres : npm run db:up à la racine.
describe('Archives : thème × tri × recherche (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const id = uniq();
  // Un mot unique à ces tests, pour isoler leurs articles des autres données de la base.
  const tag = `zorglub${id}`;
  const user = { email: `arch-${id}@test.local`, password: 'motdepasse-solide', pseudo: `Archiviste_${id}` };
  let cookie: string;
  const created: Record<string, number> = {};

  const http = () => request(app.getHttpServer());
  const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

  async function article(key: string, title: string, theme: string, text: string) {
    const themeId = (await prisma.theme.findUniqueOrThrow({ where: { slug: theme } })).id;
    const res = await http()
      .post('/api/articles')
      .set('Cookie', cookie)
      .send({ title, themeId, content: { v: 1, rows: [{ id: 'r', cols: [{ id: 'b', type: 'text', doc: doc(`${text} ${tag}`) }] }] } })
      .expect(201);
    created[key] = res.body.id;
  }

  const search = async (params: Record<string, string>) => {
    const res = await http().get('/api/articles/search').query(params).expect(200);
    return res.body as { items: { id: number; title: string }[]; total: number; nextOffset: number | null };
  };
  const titles = async (params: Record<string, string>) => (await search({ q: tag, ...params })).items.map((a) => a.title);

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    cookie = sessionCookie(await http().post('/api/auth/sign-up').send(user).expect(201));
    // Créés dans cet ordre : « récent » = l'inverse.
    await article('bd', 'Bande dessinée et rats', 'litterature', 'Une BD sur les égouts de Paris');
    await article('cine', 'Zombies au cinéma', 'cinema', 'Les rats envahissent l’écran');
    await article('ecole', 'École des rongeurs', 'cinema', 'Documentaire animalier');
    await article('arbre', 'Arbre généalogique', 'intime', 'Souvenirs de famille');
  });

  afterAll(async () => {
    await prisma.article.deleteMany({ where: { id: { in: Object.values(created) } } });
    await prisma.user.deleteMany({ where: { email: user.email } });
    await app.close();
  });

  it('tri A → Z et Z → A, à la française (É avec les E)', async () => {
    expect(await titles({ sort: 'az' })).toEqual(['Arbre généalogique', 'Bande dessinée et rats', 'École des rongeurs', 'Zombies au cinéma']);
    expect(await titles({ sort: 'za' })).toEqual(['Zombies au cinéma', 'École des rongeurs', 'Bande dessinée et rats', 'Arbre généalogique']);
  });

  it('tri récent → ancien et ancien → récent', async () => {
    expect(await titles({ sort: 'recent' })).toEqual(['Arbre généalogique', 'École des rongeurs', 'Zombies au cinéma', 'Bande dessinée et rats']);
    expect(await titles({ sort: 'ancien' })).toEqual(['Bande dessinée et rats', 'Zombies au cinéma', 'École des rongeurs', 'Arbre généalogique']);
  });

  it('aléatoire par défaut : stable pour une même graine, tous les articles présents', async () => {
    const a = await titles({ seed: 'abc' });
    const b = await titles({ seed: 'abc' });
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([...(await titles({ sort: 'az' }))].sort());
    // Au moins une graine donne un autre ordre que la première.
    const others = await Promise.all(['x1', 'x2', 'x3', 'x4', 'x5'].map((seed) => titles({ seed })));
    expect(others.some((o) => o.join() !== a.join())).toBe(true);
  });

  it('filtre par thème', async () => {
    expect(await titles({ theme: 'cinema', sort: 'az' })).toEqual(['École des rongeurs', 'Zombies au cinéma']);
    expect(await titles({ theme: 'politique' })).toEqual([]);
  });

  it('recherche : titre, contenu, sans accents, au singulier, pseudo', async () => {
    const only = async (q: string) => (await search({ q, sort: 'az' })).items.filter((a) => Object.values(created).includes(a.id)).map((a) => a.title);
    expect(await only('BD')).toEqual(['Bande dessinée et rats']);
    expect(await only('egout')).toEqual(['Bande dessinée et rats']); // « égouts » dans le texte
    expect(await only('ÉCOLE')).toEqual(['École des rongeurs']); // titre, casse et accents ignorés
    expect(await only(`archiviste_${id}`)).toHaveLength(4); // pseudo de l'auteur
    expect(await only('introuvablexyz')).toEqual([]);
  });

  it('combinaisons : thème + Z → A + recherche', async () => {
    expect(await titles({ theme: 'cinema', sort: 'za', q: `${tag} rats` })).toEqual(['Zombies au cinéma']);
    expect(await titles({ theme: 'litterature', sort: 'za', q: `BD ${tag}` })).toEqual(['Bande dessinée et rats']);
    expect(await titles({ theme: 'intime', sort: 'recent', q: `${tag} rats` })).toEqual([]);
  });

  it('pagination : total et page suivante', async () => {
    const page = await search({ q: tag, sort: 'az' });
    expect(page.total).toBe(4);
    expect(page.nextOffset).toBeNull();
  });

  it('refuse un tri ou un thème mal formé, résiste aux caractères spéciaux', async () => {
    await http().get('/api/articles/search').query({ sort: 'n_importe_quoi' }).expect(400);
    await http().get('/api/articles/search').query({ theme: "'; DROP TABLE" }).expect(400);
    await http().get('/api/articles/search').query({ q: "'; DROP TABLE \"Article\"; -- % _ \\" }).expect(200);
    await http().get('/api/articles/search').query({ q: '!!! & | <-> :*' }).expect(200);
  });
});
