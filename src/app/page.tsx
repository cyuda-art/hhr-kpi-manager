import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { KpiTree } from '@/components/kpi-tree/KpiTree';

export default function Dashboard() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col transition-colors p-6 gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">ダッシュボード</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">組織の目標達成度とKPIツリーのリアルタイム状況</p>
        </div>
      </div>
      
      {/* 1. 動的サマリー（実データ連動） */}
      <div className="shrink-0">
        <DashboardSummary />
      </div>

      {/* 2. インタラクティブなツリー */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <KpiTree isDashboard={true} />
      </div>
    </div>
  );
}
