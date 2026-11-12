import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  if ((await prisma.message.count()) > 0) {
    console.log('Seed skipped: messages already exist.');
    return;
  }
  await prisma.message.createMany({
    data: [
      { author: 'Demo', content: 'Bienvenue sur la démo 👋' },
      { author: 'Demo', content: 'Ouvre cette page dans deux onglets et envoie un message : il apparaît en temps réel.' },
    ],
  });
  console.log('Seed done.');
}

main().finally(() => prisma.$disconnect());
