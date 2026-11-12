import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Couleurs provisoires, à caler sur les pastilles de la roue.
const themes = [
  { slug: 'cinema', name: 'Cinéma', color: '#b5533c' },
  { slug: 'litterature', name: 'Littérature', color: '#7a8f4e' },
  { slug: 'jeux-video', name: 'Jeux vidéo', color: '#4a6a8a' },
  { slug: 'arts-plastiques', name: 'Arts plastiques', color: '#c08a3e' },
  { slug: 'photo', name: 'Photo', color: '#8a6aa8' },
  { slug: 'politique', name: 'Politique', color: '#8f3a4a' },
  { slug: 'intime', name: 'Intime', color: '#c27a8f' },
];

async function main() {
  // Idempotent : peut tourner à chaque déploiement.
  for (const [i, t] of themes.entries()) {
    await prisma.theme.upsert({
      where: { slug: t.slug },
      update: { name: t.name, color: t.color, order: i + 1 },
      create: { ...t, order: i + 1 },
    });
  }
  console.log(`Seed: ${themes.length} thèmes.`);

  // Contenu de démo : seulement si la table est vide, et désactivable en prod
  // avec SEED_DEMO=false (sinon un admin qui vide la table le verrait revenir).
  if (process.env.SEED_DEMO === 'false') return;

  if ((await prisma.magazine.count()) === 0) {
    await prisma.magazine.createMany({ data: demoMagazines });
    console.log(`Seed: ${demoMagazines.length} magazines de démo.`);
  }
  if ((await prisma.announcement.count()) === 0) {
    for (const a of demoAnnouncements) await prisma.announcement.create({ data: a });
    console.log(`Seed: ${demoAnnouncements.length} annonces de démo.`);
  }
}

// --- Contenu de démo (placeholders) -------------------------------------------
const HELLOASSO_PLACEHOLDER = 'https://www.helloasso.com/';

const demoMagazines = [
  {
    title: 'Mort aux Rats',
    issue: 'N°1',
    coverUrl: '/assets/covers/numero-1.png',
    price: 800,
    description: 'Le tout premier numéro. Textes, dessins et photos sortis des égouts.',
    helloAssoUrl: HELLOASSO_PLACEHOLDER,
    order: 4,
  },
  {
    title: 'Mort aux Rats',
    issue: 'N°2',
    coverUrl: '/assets/covers/numero-2.png',
    price: 800,
    description: 'Numéro spécial cinéma de quartier.',
    helloAssoUrl: HELLOASSO_PLACEHOLDER,
    order: 3,
  },
  {
    title: 'Mort aux Rats',
    issue: 'N°3',
    coverUrl: '/assets/covers/numero-3.png',
    price: 1000,
    description: 'Jeux vidéo, nostalgie et mauvaise foi.',
    helloAssoUrl: HELLOASSO_PLACEHOLDER,
    order: 2,
  },
  {
    title: 'Hors-série',
    issue: 'Intime',
    coverUrl: '/assets/covers/hors-serie.png',
    price: 1200,
    description: 'Un hors-série consacré aux récits intimes.',
    helloAssoUrl: HELLOASSO_PLACEHOLDER,
    order: 1,
  },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000);

const demoAnnouncements = [
  {
    title: 'Le site fait peau neuve',
    body: 'Bienvenue sur la nouvelle version du site.\n\nPromenez-vous sur la carte : chaque lieu ouvre une partie du site.',
    createdAt: daysAgo(1),
  },
  {
    title: 'Appel à textes',
    body: "Le prochain numéro cherche des textes courts sur le thème de la ville la nuit.\n\nEnvoyez-nous vos propositions avant la fin du mois.",
    createdAt: daysAgo(9),
  },
  {
    title: 'Soirée de lancement',
    body: 'Lancement du N°3 dans un bar à préciser. Lectures, projections et vente de numéros sur place.',
    createdAt: daysAgo(30),
  },
];

main().finally(() => prisma.$disconnect());
