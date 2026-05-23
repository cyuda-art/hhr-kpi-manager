import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KpiNodeData, Action, MonthlyData as ClientMonthlyData, BusinessUnit, KpiType, TaskPriority } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // 自己修復ロジック：マイグレーションがスキップされた環境のために、直接カラムを追加する
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "positionX" DOUBLE PRECISION DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "positionY" DOUBLE PRECISION DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "aggregationType" TEXT DEFAULT 'sum';`);
    } catch (e) {
      console.warn("Auto-migration failed in GET (columns might already exist):", e);
    }

    // Prismaを利用して指定されたプロジェクトの全KPIノード、日次データ、およびタスクを取得
    const nodesFromDb = await prisma.kpiNode.findMany({
      where: { projectId: projectId },
      include: {
        dailyRecords: {
          orderBy: { date: 'asc' }
        },
        tasks: true,
      },
    });

    const kpiData: Record<string, any> = {};
    const actions: Action[] = [];

    for (const node of nodesFromDb) {
      // dailyRecordsから月次データ（monthlyDataMap）を動的に集計
      const monthlyDataMap: Record<string, ClientMonthlyData> = {};
      const aggType = node.aggregationType || 'sum';

      // 1. レコードを月ごとにグループ化
      const recordsByMonth: Record<string, { actuals: number[], targets: number[] }> = {};
      
      node.dailyRecords.forEach(dr => {
        const d = new Date(dr.date);
        const year = d.getUTCFullYear();
        const monthNum = d.getUTCMonth() + 1;
        const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
        
        if (!recordsByMonth[monthStr]) {
          recordsByMonth[monthStr] = { actuals: [], targets: [] };
        }
        recordsByMonth[monthStr].actuals.push(dr.actualValue);
        recordsByMonth[monthStr].targets.push(dr.targetValue);
      });

      // 2. aggregationType に応じて集計
      Object.keys(recordsByMonth).forEach(monthStr => {
        const data = recordsByMonth[monthStr];
        let aggActual = 0;
        let aggTarget = 0;

        if (data.actuals.length > 0) {
          if (aggType === 'sum') {
            aggActual = data.actuals.reduce((a, b) => a + b, 0);
            aggTarget = data.targets.reduce((a, b) => a + b, 0);
          } else if (aggType === 'average') {
            aggActual = data.actuals.reduce((a, b) => a + b, 0) / data.actuals.length;
            aggTarget = data.targets.reduce((a, b) => a + b, 0) / data.targets.length;
          } else if (aggType === 'latest') {
            aggActual = data.actuals[data.actuals.length - 1]; // orderBy date asc されている前提
            aggTarget = data.targets[data.targets.length - 1];
          }
        }

        monthlyDataMap[monthStr] = {
          month: monthStr,
          actualValue: aggActual,
          targetValue: aggTarget,
        };
      });

      kpiData[node.id] = {
        id: node.id,
        name: node.name,
        qualitativeName: node.qualitativeName || undefined,
        businessUnit: (node.businessUnit || 'company') as BusinessUnit,
        type: node.type as KpiType,
        parentId: node.parentId,
        targetValue: node.targetValue,
        actualValue: node.actualValue,
        unit: node.unit,
        previousValue: node.previousValue,
        description: node.description || '',
        isCalculated: node.isCalculated,
        formula: node.formula || '',
        aggregationType: node.aggregationType || 'sum',
        warning: node.warning || undefined,
        simulatedValue: node.simulatedValue || undefined,
        simulatedTargetValue: node.simulatedTargetValue || undefined,
        isKsf: node.type === 'KSF' || undefined, // KSFフラグ
        position: { x: node.positionX || 0, y: node.positionY || 0 },
        monthlyData: monthlyDataMap,
      };

      // タスク(Action)を蓄積
      node.tasks.forEach(task => {
        actions.push({
          id: task.id,
          kpiId: task.nodeId,
          title: task.title,
          description: task.description || undefined,
          owner: task.assigneeId || '未設定', // assigneeIdを仮にownerへ
          startDate: task.startDate ? task.startDate.toISOString().split('T')[0] : undefined,
          dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: (task.status.toLowerCase()) as 'todo' | 'in_progress' | 'done',
          priority: (task.priority || 'unassigned') as TaskPriority,
          isAiAgentTask: task.isAiAgentTask,
          agentStatus: task.agentStatus as any,
          agentLog: task.agentLog || undefined,
        });
      });
    }

    return NextResponse.json({ kpiData, actions });
  } catch (error) {
    console.error('Failed to fetch nodes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
