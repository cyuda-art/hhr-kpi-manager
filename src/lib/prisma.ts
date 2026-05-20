import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = () => {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    // Vercelのビルド時（接続文字列がない環境）でインポートエラーになるのを防ぐためのダミーフォールバック
    const dummyPool = new Pool({ connectionString: "postgresql://postgres:dummy@localhost:5432/dummy" });
    const dummyAdapter = new PrismaPg(dummyPool);
    return new PrismaClient({ adapter: dummyAdapter });
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma =
  globalForPrisma.prisma ??
  getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
