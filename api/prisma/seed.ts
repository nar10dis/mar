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
}

main().finally(() => prisma.$disconnect());
