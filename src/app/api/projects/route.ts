import { NextResponse } from 'next/server';
import { authenticateRequest, hasPermission } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const organizationId = request.headers.get('x-organization-id') || 'dummy-org-id';
    
    // 他組織のデータへのアクセス防止
    if (organizationId !== 'dummy-org-id' && user.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // READ権限の確認
    if (!hasPermission(user, 'READ')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma');

    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId, // 常に自身の組織IDで上書き
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, organizationId } = body;

    if (!name || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 他組織への書き込み防止
    if (user.organizationId !== organizationId && organizationId !== 'dummy-org-id') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // WRITE権限（作成権限）の確認
    if (!hasPermission(user, 'WRITE')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create project' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma');

    // プロジェクト作成前に、紐づくOrganizationが存在するか確認し、なければ自動生成する（外部キーエラー回避）
    await prisma.organization.upsert({
      where: { id: organizationId },
      update: {},
      create: {
        id: organizationId,
        name: 'My Organization', // Firebase側の名称が不明なため初期名を設定
      },
    });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        organizationId,
      },
    });

    // 初期KPIツリー（KGI: 営業利益 のみ）の生成
    const kgiId = `node_${Date.now()}_kgi`;

    await prisma.kpiNode.create({
      data: {
        id: kgiId,
        projectId: project.id,
        name: '営業利益',
        type: 'KGI',
        unit: '円',
        targetValue: 10000000,
        isCalculated: false,
        formula: '',
        positionX: 500,
        positionY: 100,
      }
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
