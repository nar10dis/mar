import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, sessionCookie, uniq } from './helpers.js';

// Requiert Postgres + S3Mock : npm run db:up à la racine.
describe('Auth, compte, admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const id = uniq();
  const user = { email: `user-${id}@test.local`, password: 'motdepasse-solide', pseudo: `rat_${id}` };
  const admin = { email: `admin-${id}@test.local`, password: 'motdepasse-solide', pseudo: `admin_${id}` };
  let userCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    process.env.ADMIN_EMAILS = admin.email;
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [user.email, admin.email] } } });
    await prisma.magazine.deleteMany({ where: { title: `Test ${id}` } });
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('inscription : crée le compte, pose un cookie httpOnly, ne renvoie pas le hash', async () => {
    const res = await http().post('/api/auth/sign-up').send(user).expect(201);
    expect(res.body).toMatchObject({ email: user.email, pseudo: user.pseudo, role: 'USER' });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(String(res.headers['set-cookie'])).toMatch(/HttpOnly/i);
    userCookie = sessionCookie(res);
  });

  it('inscription : refuse un email déjà pris et un pseudo pris (casse ignorée)', async () => {
    await http().post('/api/auth/sign-up').send(user).expect(409);
    await http()
      .post('/api/auth/sign-up')
      .send({ ...user, email: `autre-${id}@test.local`, pseudo: user.pseudo.toUpperCase() })
      .expect(409);
  });

  it('inscription : valide les champs', async () => {
    const res = await http().post('/api/auth/sign-up').send({ email: 'pas-un-email', password: 'court', pseudo: 'a' });
    expect(res.status).toBe(400);
  });

  it('me : renvoie le compte avec le cookie, null sans', async () => {
    await http().get('/api/auth/me').set('Cookie', userCookie).expect(200).expect((r) => {
      expect(r.body.user.email).toBe(user.email);
    });
    const anon = await http().get('/api/auth/me').expect(200);
    expect(anon.body).toEqual({ user: null });
  });

  it('connexion : mauvais mot de passe = 401, bon = 200 + cookie', async () => {
    await http().post('/api/auth/sign-in').send({ email: user.email, password: 'mauvais-mdp' }).expect(401);
    await http().post('/api/auth/sign-in').send({ email: `inconnu-${id}@test.local`, password: 'x' }).expect(401);
    const res = await http().post('/api/auth/sign-in').send({ email: user.email.toUpperCase(), password: user.password }).expect(200);
    userCookie = sessionCookie(res);
  });

  it("ADMIN_EMAILS : l'inscription donne le rôle ADMIN", async () => {
    const res = await http().post('/api/auth/sign-up').send(admin).expect(201);
    expect(res.body.role).toBe('ADMIN');
    adminCookie = sessionCookie(res);
  });

  it('admin : 401 sans compte, 403 pour un USER, 200 pour un ADMIN', async () => {
    await http().get('/api/admin/users').expect(401);
    await http().get('/api/admin/users').set('Cookie', userCookie).expect(403);
    await http().get('/api/admin/users').set('Cookie', adminCookie).expect(200);
  });

  it('admin : ne peut pas se retirer son propre rôle', async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { email: admin.email } });
    await http().patch(`/api/admin/users/${me.id}/role`).set('Cookie', adminCookie).send({ role: 'USER' }).expect(400);
  });

  it('CSRF : une écriture venant d’un autre site est refusée', async () => {
    await http()
      .patch('/api/me')
      .set('Cookie', userCookie)
      .set('Origin', 'https://evil.example')
      .set('Sec-Fetch-Site', 'cross-site')
      .send({ pseudo: `pirate_${id}` })
      .expect(403);
  });

  it('compte : change le pseudo', async () => {
    const res = await http().patch('/api/me').set('Cookie', userCookie).send({ pseudo: `ratou_${id}` }).expect(200);
    expect(res.body.pseudo).toBe(`ratou_${id}`);
  });

  it('upload avatar : URL signée → PUT dans le bucket → PATCH /me → /api/media redirige', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPj/HwADAgH/Zx8OQgAAAABJRU5ErkJggg==',
      'base64',
    );
    // Type refusé / taille excessive
    await http().post('/api/uploads').set('Cookie', userCookie).send({ purpose: 'avatar', contentType: 'text/html', size: 10 }).expect(400);
    await http().post('/api/uploads').set('Cookie', userCookie).send({ purpose: 'avatar', contentType: 'image/png', size: 50_000_000 }).expect(400);
    // Couverture de magazine : réservé aux admins
    await http().post('/api/uploads').set('Cookie', userCookie).send({ purpose: 'cover', contentType: 'image/png', size: 10 }).expect(403);

    const prep = await http()
      .post('/api/uploads')
      .set('Cookie', userCookie)
      .send({ purpose: 'avatar', contentType: 'image/png', size: png.length })
      .expect(201);
    const put = await fetch(prep.body.uploadUrl, { method: 'PUT', body: png, headers: { 'Content-Type': 'image/png' } });
    expect(put.status).toBe(200);

    const me = await http().patch('/api/me').set('Cookie', userCookie).send({ avatarKey: prep.body.key }).expect(200);
    expect(me.body.avatarUrl).toBe(`/api/media/${prep.body.key}`);

    const media = await http().get(me.body.avatarUrl).expect(302);
    const file = await fetch(media.headers.location);
    expect(file.status).toBe(200);
    expect(Buffer.from(await file.arrayBuffer()).equals(png)).toBe(true);
  });

  it("upload : refuse la clé d'un autre utilisateur", async () => {
    await http().patch('/api/me').set('Cookie', userCookie).send({ avatarKey: 'avatars/999999/x.png' }).expect(400);
  });

  it('admin : crée, modifie, masque et supprime un magazine', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPj/HwADAgH/Zx8OQgAAAABJRU5ErkJggg==', 'base64');
    const prep = await http()
      .post('/api/uploads')
      .set('Cookie', adminCookie)
      .send({ purpose: 'cover', contentType: 'image/png', size: png.length })
      .expect(201);
    await fetch(prep.body.uploadUrl, { method: 'PUT', body: png, headers: { 'Content-Type': 'image/png' } });

    const created = await http()
      .post('/api/admin/magazines')
      .set('Cookie', adminCookie)
      .send({
        title: `Test ${id}`,
        issue: 'N°99',
        price: 1500,
        description: '',
        helloAssoUrl: 'https://www.helloasso.com/test',
        order: 0,
        published: true,
        coverKey: prep.body.key,
      })
      .expect(201);
    expect(created.body.description).toBeNull();

    let pub = await http().get('/api/magazines').expect(200);
    expect(pub.body.some((m: { id: number }) => m.id === created.body.id)).toBe(true);

    await http().patch(`/api/admin/magazines/${created.body.id}`).set('Cookie', adminCookie).send({ published: false }).expect(200);
    pub = await http().get('/api/magazines').expect(200);
    expect(pub.body.some((m: { id: number }) => m.id === created.body.id)).toBe(false);

    await http().delete(`/api/admin/magazines/${created.body.id}`).set('Cookie', adminCookie).expect(204);
  });

  it('déconnexion : la session ne marche plus', async () => {
    await http().post('/api/auth/sign-out').set('Cookie', userCookie).expect(204);
    const res = await http().get('/api/auth/me').set('Cookie', userCookie).expect(200);
    expect(res.body).toEqual({ user: null });
  });
});
