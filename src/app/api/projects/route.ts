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

    const project = await prisma.project.create({
      data: {
        name,
        description,
        organizationId,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
