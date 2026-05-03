"use client";

import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { Network, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Dashboard() {
  const [isTreeExpanded, setIsTreeExpanded] = useState(true);
  const [summaryHeight, setSummaryHeight] = useState(250); // 初期高さ
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerTop = containerRef.current.getBoundingClientRect().top;
      // マウスY座標からコンテナ上部を引いた値が新しい高さ
      const newHeight = e.clientY - containerTop;
      // 最小高さと最大高さを制限
      if (newHeight >= 100 && newHeight <= window.innerHeight - 200) {
        setSummaryHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] flex flex-col transition-colors p-4 gap-2 overflow-hidden">
      {/* 1. 動的サマリー（実データ連動） */}
      <div 
        className="shrink-0 flex flex-col min-h-0"
        style={{ height: `${summaryHeight}px` }}
      >
        <DashboardSummary />
      </div>

      {/* リサイズハンドル */}
      <div 
        className="h-2 -mx-4 cursor-row-resize flex items-center justify-center group/resizer"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-700 group-hover/resizer:bg-primary-400 dark:group-hover/resizer:bg-primary-500 transition-colors flex items-center justify-center">
        </div>
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
