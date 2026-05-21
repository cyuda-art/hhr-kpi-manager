const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.vercel.test' });

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
      }
    }
  });
  const users = await prisma.user.findMany({ include: { organization: true } });
  console.log("Users in Postgres:", JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
