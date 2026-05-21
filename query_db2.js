const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.vercel' });

async function main() {
  console.log("DB URL:", process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);
}
main();
