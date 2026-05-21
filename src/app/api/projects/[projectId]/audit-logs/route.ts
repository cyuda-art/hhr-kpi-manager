import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

    const logs = await prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { organizationId, userId, action, details } = body;

    const log = await prisma.auditLog.create({
      data: {
        projectId,
        organizationId,
        userId,
        action,
        details: details ? JSON.stringify(details) : null
      }
    });

    return NextResponse.json({ log });
  } catch (error: any) {
    console.error('Error adding audit log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
