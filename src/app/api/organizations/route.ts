import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ユーザーが所属する組織の一覧を取得
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId'); // firebaseUid の想定

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // まずユーザーが存在するか確認。存在しなければ空配列を返す。
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: {
        organization: true
      }
    });

    if (!user || !user.organization) {
      return NextResponse.json({ organizations: [] });
    }

    // 現状は1ユーザー1組織（UserのorganizationIdは単一）だが、複数対応を見据えて配列で返す
    return NextResponse.json({ organizations: [user.organization] });

  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 組織の新規作成
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, userId, email, userName } = body;

    if (!name || !userId) {
      return NextResponse.json({ error: 'name and userId are required' }, { status: 400 });
    }

    // 1. 組織を作成
    const newOrg = await prisma.organization.create({
      data: {
        name,
        aiCreditBalance: 1000,
        subscriptionPlan: 'FREE'
      }
    });

    // 2. ユーザーを作成（または更新）し、この組織に紐付ける
    // 注意: User は email も unique のため、すでに存在する場合は organizationId を更新する
    await prisma.user.upsert({
      where: { firebaseUid: userId },
      update: {
        organizationId: newOrg.id,
        role: 'ADMIN',
        // もし email や name が渡されていれば更新
        ...(email && { email }),
        ...(userName && { name: userName })
      },
      create: {
        firebaseUid: userId,
        email: email || `${userId}@placeholder.com`, // email is required in schema
        name: userName || 'New User',
        role: 'ADMIN',
        organizationId: newOrg.id
      }
    });

    return NextResponse.json(newOrg);
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
