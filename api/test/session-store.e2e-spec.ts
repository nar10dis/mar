import type { INestApplication } from '@nestjs/common';
import type { SessionRecord, SessionStore } from '@nestjs/authentication';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { PrismaSessionStore } from '../src/auth/prisma-session.store.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp } from './helpers.js';

/**
 * Vérifie PrismaSessionStore contre le contrat officiel de @nestjs/authentication.
 * Le contrat invente des userId texte ("user-<uuid>") ; nos sessions pointent vers de vrais
 * utilisateurs (clé étrangère int), donc un adaptateur crée un utilisateur par userId.
 */
let app: INestApplication;
let prisma: PrismaService;
let store: PrismaSessionStore;
const ids = new Map<string, string>();
const back = new Map<string, string>();

async function realId(fake: string) {
  if (!ids.has(fake)) {
    const u = await prisma.user.create({
      data: { email: `${fake}@contract.local`, pseudo: fake.slice(0, 24) + Math.random().toString(36).slice(2, 6), passwordHash: 'x' },
    });
    ids.set(fake, String(u.id));
    back.set(String(u.id), fake);
  }
  return ids.get(fake)!;
}
const out = (r: SessionRecord): SessionRecord => {
  const { extra: _extra, ...rest } = r;
  return { ...rest, userId: back.get(r.userId) ?? r.userId };
};

const adapter: SessionStore = {
  async getSession(id) {
    const r = await store.getSession(id);
    return r && out(r);
  },
  async createSession(r) {
    await store.createSession({ ...r, userId: await realId(r.userId) });
  },
  touchSession: (id, at) => store.touchSession(id, at),
  deleteSession: (id) => store.deleteSession(id),
  async listUserSessions(userId) {
    return (await store.listUserSessions(await realId(userId))).map(out);
  },
  async deleteUserSessions(userId) {
    await store.deleteUserSessions(await realId(userId));
  },
};

beforeAll(async () => {
  app = await createApp();
  prisma = app.get(PrismaService);
  store = app.get(PrismaSessionStore);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: '@contract.local' } } });
  await app.close();
});

describe('PrismaSessionStore : contrat SessionStore', () => {
  for (const c of authenticationStoreContract(() => ({ sessions: adapter }), { contracts: ['sessions'] })) {
    it(c.name, () => c.run());
  }
});
