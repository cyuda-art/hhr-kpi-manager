"use client";

import { useState, useEffect } from 'react';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { ActionPanel } from '@/components/kpi-tree/ActionPanel';

export default function KpiTreePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="h-[calc(100vh-4rem)] p-4 flex flex-col lg:flex-row gap-4 overflow-hidden bg-slate-50 dark:bg-[#1e1e20]">
      {/* メインエリア：KPIツリー */}
      <div className="flex-1 bg-white dark:bg-[#2d2f31] rounded-[8px] shadow-sm border border-slate-200 dark:border-[#3c4043] overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 min-h-0 relative">
          <KpiTree isDashboard={true} />
        </div>
      </div>

      {/* 右サイドバー：アクションパネル */}
      <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white dark:bg-[#2d2f31] rounded-[8px] shadow-sm border border-slate-200 dark:border-[#3c4043] overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
          <ActionPanel />
        </div>
      </div>
    </div>
  );
}
