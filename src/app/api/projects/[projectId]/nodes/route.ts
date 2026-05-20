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

    // Prismaを利用して指定されたプロジェクトの全KPIノード、月次データ、およびタスクを取得
    const nodesFromDb = await prisma.kpiNode.findMany({
      where: { projectId: projectId },
      include: {
        monthlyData: true,
        tasks: true,
      },
    });

    const kpiData: Record<string, any> = {};
    const actions: Action[] = [];

    for (const node of nodesFromDb) {
      // monthlyDataをRecord形式に変換
      const monthlyDataMap: Record<string, ClientMonthlyData> = {};
      node.monthlyData.forEach(md => {
        // period: 202604 -> "2026-04"
        const year = Math.floor(md.period / 100);
        const monthNum = md.period % 100;
        const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
        
        monthlyDataMap[monthStr] = {
          month: monthStr,
          actualValue: md.actualValue,
          targetValue: md.targetValue,
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
        warning: node.warning || undefined,
        simulatedValue: node.simulatedValue || undefined,
        simulatedTargetValue: node.simulatedTargetValue || undefined,
        isKsf: node.type === 'KSF' || undefined, // KSFフラグ
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
