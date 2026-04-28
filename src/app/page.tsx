import { KpiList } from '@/components/dashboard/KpiList';

export default function Dashboard() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
        <p className="text-slate-500 mt-1">全社のKGIと事業別指標の達成状況</p>
      </div>
      
      <KpiList />
    </div>
  );
}
