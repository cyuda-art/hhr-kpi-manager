import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: true,
        projects: true
      }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const data = await req.json();
    
    // 不要なIDフィールドなどは弾いて安全に更新する
    const { id, createdAt, updatedAt, users, projects, creditLogs, ...updateData } = data;

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: updateData
    });

    return NextResponse.json(updatedOrg);
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
