import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 実際の運用ではヘッダーのトークン等から organizationId を取得します
    // 今回はモックとしてヘッダーから渡されるか、ダミーIDを使用します
    const organizationId = request.headers.get('x-organization-id') || 'dummy-org-id';
    const { prisma } = await import('@/lib/prisma');

    const projects = await prisma.project.findMany({
      where: {
        organizationId: organizationId,
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
    const body = await request.json();
    const { name, description, organizationId } = body;

    if (!name || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // 初期KPIツリー（KGI: 営業利益、KPI: 売上高・原価）の生成
    const kgiId = `node_${Date.now()}_kgi`;
    const salesId = `node_${Date.now()}_sales`;
    const costId = `node_${Date.now()}_cost`;

    await prisma.kpiNode.create({
      data: {
        id: kgiId,
        projectId: project.id,
        name: '営業利益',
        type: 'KGI',
        unit: '円',
        targetValue: 10000000,
        isCalculated: true,
        formula: `#{${salesId}} - #{${costId}}`,
        positionX: 500,
        positionY: 100,
      }
    });

    await prisma.kpiNode.createMany({
      data: [
        {
          id: salesId,
          projectId: project.id,
          name: '売上高',
          type: 'KPI',
          unit: '円',
          parentId: kgiId,
          targetValue: 30000000,
          positionX: 250,
          positionY: 400,
        },
        {
          id: costId,
          projectId: project.id,
          name: '原価',
          type: 'KPI',
          unit: '円',
          parentId: kgiId,
          targetValue: 20000000,
          positionX: 750,
          positionY: 400,
        }
      ]
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
