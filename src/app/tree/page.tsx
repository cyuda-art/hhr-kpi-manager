import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { SidePanel } from '@/components/kpi-tree/SidePanel';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TreePage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">KPIツリー</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">全社KGIから現場アクションまでの構造</p>
        </div>
        <Link 
          href="/tree/preview" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-indigo-100 dark:border-indigo-800/50"
        >
          <ExternalLink size={16} />
          別ウィンドウで全体表示
        </Link>
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
