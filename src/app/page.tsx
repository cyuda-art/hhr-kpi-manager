"use client";

import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { Network, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const [isTreeExpanded, setIsTreeExpanded] = useState(true); // 初期状態で開く
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col transition-colors p-4 gap-4 overflow-hidden">
      {/* 1. 動的サマリー（実データ連動） */}
      <div className="shrink-0">
        <DashboardSummary />
      </div>

      <div className={`min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${isTreeExpanded ? 'flex-1' : 'flex-none'}`}>
        <button 
          onClick={() => setIsTreeExpanded(!isTreeExpanded)}
          className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isTreeExpanded ? 'border-b border-slate-200 dark:border-slate-800' : ''}`}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              <Network className="w-4 h-4 text-primary-500" />
              インタラクティブ・KPIツリー
            </h2>
          </div>
          <div className="text-slate-400 hover:text-primary-600 transition-colors">
            {isTreeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        <div className={`flex-1 flex flex-col min-h-0 ${isTreeExpanded ? 'opacity-100' : 'hidden'}`}>
          <KpiTree isDashboard={true} />
        </div>
      </div>
    </div>
  );
}
