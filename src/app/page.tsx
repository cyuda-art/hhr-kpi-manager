import { KpiList } from '@/components/dashboard/KpiList';

export default function Dashboard() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col transition-colors">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">KPI ツリー</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">組織全体の目標と現状の達成度を可視化します</p>
        </div>
      </div>
      
      <KpiList />
    </div>
  );
}
