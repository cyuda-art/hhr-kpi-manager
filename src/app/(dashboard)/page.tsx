"use client";

import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { ActionPanel } from '@/components/kpi-tree/ActionPanel';
import { useKpiStore } from '@/store/useKpiStore';
import { GripHorizontal } from 'lucide-react';

export default function Dashboard() {
  const { selectedNodeId } = useKpiStore();
  const [isMounted, setIsMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layouts, setLayouts] = useState<any>({
    lg: [
      { i: 'kpi-tree', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 2 },
      { i: 'action-panel', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 2 },
    ],
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isMounted]);

  const onLayoutChange = (layout: any[], allLayouts: any) => {
    setLayouts(allLayouts);
  };

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] p-2 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={150}
        width={containerWidth}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
      >
        <div key="kpi-tree" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="drag-handle h-10 shrink-0 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 cursor-move hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <GripHorizontal size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">KPI Tree</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <KpiTree isDashboard={true} />
          </div>
        </div>

        <div key="action-panel" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="drag-handle h-10 shrink-0 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 cursor-move hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <GripHorizontal size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Action Panel</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
            <ActionPanel />
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
