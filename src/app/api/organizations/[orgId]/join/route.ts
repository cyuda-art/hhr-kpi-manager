import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const body = await req.json();
    const { userId, email, userName } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 指定された組織が存在するか確認
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // ユーザーを組織に追加（Userレコードの update または create）
    const user = await prisma.user.upsert({
      where: { firebaseUid: userId },
      update: {
        organizationId: org.id,
        // すでに存在するユーザーの場合、権限は既存のものを維持するか、上書きするか。
        // ここでは join なので基本は維持だが、安全のため一旦 MEMBER として扱う
      },
      create: {
        firebaseUid: userId,
        email: email || `${userId}@placeholder.com`,
        name: userName || 'Invited User',
        role: 'MEMBER', // デフォルトは MEMBER
        organizationId: org.id
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error joining organization:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
