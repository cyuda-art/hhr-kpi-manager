import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (key !== 'hhr_repair_2024') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Organization table
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "managementPhilosophy" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "masterMvv" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "companyUrl" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "businessDescription" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "targetMarket" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "industry" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "pest" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "fiveForces" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "vrio" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "lastCrawledAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "requiresStrategyReview" BOOLEAN NOT NULL DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "aiCreditBalance" INTEGER NOT NULL DEFAULT 1000;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeCurrentPeriodEnd" TIMESTAMP(3);`);

    // KpiNode table
    await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "qualitativeName" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "simulatedValue" DOUBLE PRECISION;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "simulatedTargetValue" DOUBLE PRECISION;`);
    
    // AiCreditLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AiCreditLog" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "featureName" TEXT NOT NULL,
        "tokensUsed" INTEGER NOT NULL,
        "creditsCharged" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AiCreditLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AiCreditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // AuditLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "projectId" TEXT,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);

    // MonthlyData table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MonthlyData" (
        "id" TEXT NOT NULL,
        "nodeId" TEXT NOT NULL,
        "period" INTEGER NOT NULL,
        "actualValue" DOUBLE PRECISION NOT NULL,
        "targetValue" DOUBLE PRECISION NOT NULL,
        CONSTRAINT "MonthlyData_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "MonthlyData_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KpiNode"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    // MonthlyData unique constraint
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "MonthlyData_nodeId_period_key" ON "MonthlyData"("nodeId", "period");`);
    } catch (e) {
      // Ignore if index already exists
    }

    return NextResponse.json({ success: true, message: 'Database schema successfully updated directly via SQL' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
