import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasPostgresUrl: !!process.env.POSTGRES_PRISMA_URL || !!process.env.DATABASE_URL,
    postgresUrlLength: (process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '').length,
    nodeEnv: process.env.NODE_ENV,
  });
}
