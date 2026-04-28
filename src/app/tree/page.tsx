import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { SidePanel } from '@/components/kpi-tree/SidePanel';

export default function TreePage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">KPIツリー</h1>
        <p className="text-slate-500 mt-1">全社KGIから現場アクションまでの構造</p>
      </div>
      
      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 min-w-0">
          <KpiTree />
        </div>
        <SidePanel />
      </div>
    </div>
  );
}
