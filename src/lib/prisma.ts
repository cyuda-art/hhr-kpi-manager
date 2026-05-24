import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = () => {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    const dummyPool = new Pool({ connectionString: "postgresql://postgres:dummy@localhost:5432/dummy" });
    const dummyAdapter = new PrismaPg(dummyPool);
    return new PrismaClient({ adapter: dummyAdapter });
  }

  // Vercel Postgresなどの外部DBへ接続する際、pgモジュールはデフォルトでSSLを要求しない場合があるため、
  // 本番環境（または localhost 以外の接続）では SSL: true を明示的に指定します。
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({ 
    connectionString,
    ssl: !isLocal ? { rejectUnauthorized: false } : undefined
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma =
  globalForPrisma.prisma ??
  getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
