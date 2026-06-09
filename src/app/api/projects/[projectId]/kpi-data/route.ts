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
      kpiData: Record<string, KpiNodeData & { monthlyData?: Record<string, ClientMonthlyData> }>;
      actions: Action[];
    };

    // Helper: shouldScaleWithPeriod logic simplified for backend since it's already in kpiData.unit/name
    const shouldScaleWithPeriod = (node: Partial<KpiNodeData>): boolean => {
      if (!node) return true;
      const name = node.name || '';
      const unit = node.unit || '';
      if (unit === '%' || unit === '％' || unit === 'pt' || unit === 'ポイント') return false;
      if (name.includes('率') || name.includes('割合') || name.includes('レート') || name.includes('rate')) return false;
      if (unit === '円' && (name.includes('単価') || name.includes('LTV') || name.includes('コスト') || name.includes('原価'))) return false;
      return true;
    };

    if (!kpiData) {
      return NextResponse.json({ error: 'Missing kpiData' }, { status: 400 });
    }

    const incomingNodeIds = Object.keys(kpiData);
    const incomingActionIds = actions ? actions.map(a => a.id) : [];

    // 自己修復ロジック：マイグレーションがスキップされた環境のために、直接カラムを追加する（すでに存在する場合は無視される）
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "positionX" DOUBLE PRECISION DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "positionY" DOUBLE PRECISION DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "KpiNode" ADD COLUMN IF NOT EXISTS "aggregationType" TEXT DEFAULT 'sum';`);
    } catch (e) {
      console.warn("Auto-migration failed (columns might already exist):", e);
    }

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
      await Promise.all(incomingNodeIds.map(nodeId => {
        const node = kpiData[nodeId];
        return tx.kpiNode.upsert({
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
            isCalculated: node.isCalculated || false,
            formula: node.formula || null,
            description: node.description || null,
            warning: node.warning || null,
            positionX: node.position?.x ?? 0,
            positionY: node.position?.y ?? 0,
            aggregationType: node.aggregationType || 'sum',
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
            isCalculated: node.isCalculated || false,
            formula: node.formula || null,
            description: node.description || null,
            warning: node.warning || null,
            positionX: node.position?.x ?? 0,
            positionY: node.position?.y ?? 0,
            aggregationType: node.aggregationType || 'sum',
          },
        });
      }));

      // 3. 2-pass目: parentIdを設定して親子リレーションを結合
      await Promise.all(incomingNodeIds.map(nodeId => {
        const node = kpiData[nodeId];
        if (node.parentId) {
          // 親が存在することを確認
          const parentExists = incomingNodeIds.includes(node.parentId);
          return tx.kpiNode.update({
            where: { id: nodeId },
            data: {
              parentId: parentExists ? node.parentId : null,
            },
          });
        } else {
          return tx.kpiNode.update({
            where: { id: nodeId },
            data: {
              parentId: null,
            },
          });
        }
      }));

      // 4. 各ノードの時系列月次データの更新
      for (const nodeId of incomingNodeIds) {
        const node = kpiData[nodeId];
        
        // 既存の月次データを一度全削除
        await tx.monthlyData.deleteMany({
          where: { nodeId: nodeId },
        });

        let effectiveMonthlyData: Record<string, ClientMonthlyData> = {};
        if (node.monthlyData && Object.keys(node.monthlyData).length > 0) {
          effectiveMonthlyData = node.monthlyData;
        } else {
          // フロントエンドで生成されていない場合のフォールバック（新規作成時など）
          effectiveMonthlyData = {};
          const currentYear = new Date().getFullYear();
          const targetValue = node.targetValue || 0;
          const actualValue = node.actualValue || 0;
          const isScale = shouldScaleWithPeriod(node);
          
          for (let month = 4; month <= 15; month++) {
            const actualMonth = month > 12 ? month - 12 : month;
            const actualYear = month > 12 ? currentYear + 1 : currentYear;
            const monthStr = `${actualYear}-${String(actualMonth).padStart(2, '0')}`;
            effectiveMonthlyData[monthStr] = {
              month: monthStr,
              targetValue: isScale ? targetValue / 12 : targetValue,
              actualValue: isScale ? actualValue / 12 : actualValue,
            } as any;
          }
        }

        if (Object.keys(effectiveMonthlyData).length > 0) {
          const createData = Object.keys(effectiveMonthlyData).map(monthKey => {
            const md = effectiveMonthlyData![monthKey];
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

          // DailyRecordの生成 (Bulk Upsert)
          // PostgreSQLの ON CONFLICT を利用して、既存の実績値(actualValue)を保護しつつ目標値(targetValue)を日割りで更新する
          const dailyValues: string[] = [];
          
          for (const monthKey of Object.keys(effectiveMonthlyData)) {
            const md = effectiveMonthlyData[monthKey];
            const targetVal = md.targetValue || 0;
            const [yearStr, monthStr] = monthKey.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            const daysInMonth = new Date(year, month, 0).getDate();
            const dailyTgt = targetVal / daysInMonth;

            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
              // cuid を手動生成するのは面倒なので、PostgreSQL側の gen_random_uuid() を利用するか、
              // prisma.$executeRawUnsafe で UUID を発行する。ここでは簡易的に c${Date.now()}${Math.random().toString(36).substr(2, 9)} 的なものを生成
              const fakeId = `c${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
              dailyValues.push(`('${fakeId}', '${nodeId}', '${dateStr}'::date, ${dailyTgt}, 0, false)`);
            }
          }

          if (dailyValues.length > 0) {
            // chunking to prevent too large queries if needed (max 1000 params, but raw string has no param limit, though statement size matters)
            const chunkSize = 1000;
            for (let i = 0; i < dailyValues.length; i += chunkSize) {
              const chunk = dailyValues.slice(i, i + chunkSize);
              const query = `
                INSERT INTO "DailyRecord" (id, "nodeId", date, "targetValue", "actualValue", "isApiSourced")
                VALUES ${chunk.join(',')}
                ON CONFLICT ("nodeId", date) DO UPDATE 
                SET "targetValue" = EXCLUDED."targetValue";
              `;
              await tx.$executeRawUnsafe(query);
            }
          }
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
        await Promise.all(actions.map(action => {
          // タスクに紐づくノードが存在するか確認
          const nodeExists = incomingNodeIds.includes(action.kpiId);
          if (!nodeExists) return Promise.resolve(); // ノードがなければスキップ

          const statusUpper = (action.status || 'todo').toUpperCase(); // todo -> TODO
          
          return tx.task.upsert({
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
        }));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save KPI data:', error);
    return NextResponse.json({ 
      error: 'Failed to save data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
