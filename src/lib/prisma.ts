import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (prop === 'then' || prop === '__esModule') return undefined;
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({ accelerateUrl: "prisma://dummy" } as any);
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
