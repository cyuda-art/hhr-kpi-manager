import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KpiNodeData, Action, MonthlyData as ClientMonthlyData } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { kpiData, actions } = body as {
      kpiData: Record<string, KpiNodeData>;
      actions: Action[];
    };

    if (!kpiData) {
      return NextResponse.json({ error: 'Missing kpiData' }, { status: 400 });
    }

    const incomingNodeIds = Object.keys(kpiData);
    const incomingActionIds = actions ? actions.map(a => a.id) : [];

    // トランザクションでアトミックに実行
    await prisma.$transaction(async (tx) => {
      // 1. 今回のリクエストに含まれないノードを削除
      await tx.kpiNode.deleteMany({
        where: {
          projectId: projectId,
          id: { notIn: incomingNodeIds },
        },
      });

      // 2. 1-pass目: parentIdを一旦nullにしてノード枠をupsert（親子参照FKエラーの回避）
      for (const nodeId of incomingNodeIds) {
        const node = kpiData[nodeId];
        await tx.kpiNode.upsert({
          where: { id: nodeId },
          create: {
            id: nodeId,
            projectId: projectId,
            name: node.name,
            qualitativeName: node.qualitativeName || null,
            type: node.type,
            unit: node.unit || '円',
            businessUnit: node.businessUnit || 'company',
            actualValue: node.actualValue || 0,
            targetValue: node.targetValue || 0,
            previousValue: node.previousValue || 0,
            simulatedValue: node.simulatedValue || null,
            isCalculated: node.isCalculated || false,
            formula: node.formula || null,
            description: node.description || null,
            warning: node.warning || null,
            positionX: node.position?.x ?? 0,
            positionY: node.position?.y ?? 0,
            parentId: null, // 後で設定
          },
          update: {
            name: node.name,
            qualitativeName: node.qualitativeName || null,
            type: node.type,
            unit: node.unit || '円',
            businessUnit: node.businessUnit || 'company',
            actualValue: node.actualValue || 0,
            targetValue: node.targetValue || 0,
            previousValue: node.previousValue || 0,
            simulatedValue: node.simulatedValue || null,
            isCalculated: node.isCalculated || false,
            formula: node.formula || null,
            description: node.description || null,
            warning: node.warning || null,
            positionX: node.position?.x ?? 0,
            positionY: node.position?.y ?? 0,
          },
        });
      }

      // 3. 2-pass目: parentIdを設定して親子リレーションを結合
      for (const nodeId of incomingNodeIds) {
        const node = kpiData[nodeId];
        if (node.parentId) {
          // 親が存在することを確認
          const parentExists = incomingNodeIds.includes(node.parentId);
          await tx.kpiNode.update({
            where: { id: nodeId },
            data: {
              parentId: parentExists ? node.parentId : null,
            },
          });
        } else {
          await tx.kpiNode.update({
            where: { id: nodeId },
            data: {
              parentId: null,
            },
          });
        }
      }

      // 4. 各ノードの時系列月次データの更新
      for (const nodeId of incomingNodeIds) {
        const node = kpiData[nodeId];
        
        // 既存の月次データを一度全削除
        await tx.monthlyData.deleteMany({
          where: { nodeId: nodeId },
        });

        if (node.monthlyData && Object.keys(node.monthlyData).length > 0) {
          const createData = Object.keys(node.monthlyData).map(monthKey => {
            const md = node.monthlyData![monthKey];
            // "2026-04" -> 202604
            const periodInt = parseInt(monthKey.replace('-', ''));
            return {
              nodeId: nodeId,
              period: periodInt,
              actualValue: md.actualValue || 0,
              targetValue: md.targetValue || 0,
            };
          });

          await tx.monthlyData.createMany({
            data: createData,
          });
        }
      }

      // 5. 今回のリクエストに含まれないタスクを削除
      await tx.task.deleteMany({
        where: {
          nodeId: { in: incomingNodeIds },
          id: { notIn: incomingActionIds },
        },
      });

      // 6. タスク（actions）のupsert
      if (actions && actions.length > 0) {
        for (const action of actions) {
          // タスクに紐づくノードが存在するか確認
          const nodeExists = incomingNodeIds.includes(action.kpiId);
          if (!nodeExists) continue; // ノードがなければスキップ

          const statusUpper = (action.status || 'todo').toUpperCase(); // todo -> TODO
          
          await tx.task.upsert({
            where: { id: action.id },
            create: {
              id: action.id,
              nodeId: action.kpiId,
              title: action.title,
              description: action.description || null,
              status: statusUpper,
              priority: action.priority || 'unassigned',
              isAiAgentTask: action.isAiAgentTask || false,
              agentStatus: action.agentStatus || null,
              agentLog: action.agentLog || null,
              startDate: action.startDate ? new Date(action.startDate) : null,
              dueDate: action.dueDate ? new Date(action.dueDate) : null,
            },
            update: {
              nodeId: action.kpiId,
              title: action.title,
              description: action.description || null,
              status: statusUpper,
              priority: action.priority || 'unassigned',
              isAiAgentTask: action.isAiAgentTask || false,
              agentStatus: action.agentStatus || null,
              agentLog: action.agentLog || null,
              startDate: action.startDate ? new Date(action.startDate) : null,
              dueDate: action.dueDate ? new Date(action.dueDate) : null,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save KPI data:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
