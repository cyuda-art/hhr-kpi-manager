"use client";

import { KpiTree } from '@/components/kpi-tree/KpiTree';

export default function Dashboard() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col transition-colors overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <KpiTree isDashboard={true} />
      </div>
    </div>
  );
}
