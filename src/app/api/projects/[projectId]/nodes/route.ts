import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { prisma } = await import('@/lib/prisma');

    // Prismaを利用して指定されたプロジェクトの全KPIノードを取得
    // 関連するタスク（AIエージェントの実行状態を含む）も一緒に取得します
    const nodes = await prisma.kpiNode.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            isAiAgentTask: true,
            agentStatus: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc', // ツリーの描画順序を安定させるため
      },
    });

    // クライアント側（Zustand等）でツリー構造を再構築しやすいよう、
    // 親子関係のフラットな配列として返却します
    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Failed to fetch nodes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
