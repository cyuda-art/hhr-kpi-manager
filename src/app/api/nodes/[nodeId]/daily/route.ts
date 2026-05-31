import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    // 最新の30件（過去30日分）を取得
    const records = await prisma.dailyRecord.findMany({
      where: { nodeId },
      orderBy: { date: 'desc' },
      take: 30,
    });
    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('Failed to fetch daily records:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();
    const { date, actualValue, comment } = body;

    if (!date || actualValue === undefined) {
      return NextResponse.json({ error: 'Missing date or actualValue' }, { status: 400 });
    }

    const dateObj = new Date(`${date}T00:00:00Z`);

    // 1. ノードが所属するプロジェクトと全ノードを取得 (カスケード計算用)
    const targetNode = await prisma.kpiNode.findUnique({
      where: { id: nodeId },
      select: { projectId: true },
    });

    if (!targetNode) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    const allNodes = await prisma.kpiNode.findMany({
      where: { projectId: targetNode.projectId },
    });

    // 2. トランザクションで保存とカスケード計算を実行
    await prisma.$transaction(async (tx) => {
      // 2-1. 対象ノードの実績をUpsert
      await tx.dailyRecord.upsert({
        where: { nodeId_date: { nodeId: nodeId, date: dateObj } },
        create: {
          nodeId: nodeId,
          date: dateObj,
          actualValue: Number(actualValue),
          comment: comment || null,
        },
        update: {
          actualValue: Number(actualValue),
          comment: comment || null,
        },
      });

      // 2-2. この日付の全DailyRecordを取得
      const dailyRecords = await tx.dailyRecord.findMany({
        where: { 
          date: dateObj,
          nodeId: { in: allNodes.map(n => n.id) }
        },
      });

      const recordMap = new Map<string, number>();
      dailyRecords.forEach(r => recordMap.set(r.nodeId, r.actualValue));
      
      // 対象ノードの最新値をMapにセット（Upsert直後のため）
      recordMap.set(nodeId, Number(actualValue));

      // 2-3. トポロジカルソート（ボトムアップで親へ計算を伝播させるため）
      const adj = new Map<string, string[]>(); // node -> depends on
      const inDegree = new Map<string, number>();
      
      allNodes.forEach(n => {
        adj.set(n.id, []);
        inDegree.set(n.id, 0);
      });

      allNodes.forEach(n => {
        if (n.isCalculated && n.formula) {
          const matches = n.formula.match(/#\{([^}]+)\}/g);
          if (matches) {
            matches.forEach(m => {
              const depId = m.replace('#{', '').replace('}', '');
              if (adj.has(depId)) {
                adj.get(depId)!.push(n.id); // depId が変わったら n.id を再計算
                inDegree.set(n.id, inDegree.get(n.id)! + 1);
              }
            });
          }
        }
      });

      // BFSで再計算順序を決定 (Kahn's algorithm)
      const queue: string[] = [];
      inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
      });

      const calcOrder: string[] = [];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        calcOrder.push(curr);
        adj.get(curr)!.forEach(neighbor => {
          inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        });
      }

      // 2-4. 順番に式を評価して更新
      for (const id of calcOrder) {
        const node = allNodes.find(n => n.id === id);
        if (node && node.isCalculated && node.formula) {
          let formulaStr = node.formula;
          const canEvaluate = true;
          
          const matches = formulaStr.match(/#\{([^}]+)\}/g);
          if (matches) {
            matches.forEach(m => {
              const depId = m.replace('#{', '').replace('}', '');
              const val = recordMap.has(depId) ? recordMap.get(depId)! : 0;
              formulaStr = formulaStr.replace(m, val.toString());
            });
          }

          if (canEvaluate) {
            try {
              // 安全な評価 (JSの関数として実行)
              const result = new Function(`return ${formulaStr}`)();
              if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                recordMap.set(id, result);
                // DBも更新
                await tx.dailyRecord.upsert({
                  where: { nodeId_date: { nodeId: id, date: dateObj } },
                  create: {
                    nodeId: id,
                    date: dateObj,
                    actualValue: result,
                  },
                  update: {
                    actualValue: result,
                  },
                });
              }
            } catch (e) {
              console.error(`Formula evaluation failed for node ${id}: ${formulaStr}`, e);
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to upsert daily record:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
