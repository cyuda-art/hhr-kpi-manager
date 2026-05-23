"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { KpiExecutionPanel } from '@/components/kpi-tree/KpiExecutionPanel';
import { KpiTreeExplorer } from '@/components/kpi-tree/KpiTreeExplorer';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useKpiStore } from '@/store/useKpiStore';

export default function KpiTreePage() {
  const isActionPanelCollapsed = useLayoutStore(state => state.isActionPanelCollapsed);
  const { selectedNodeId, kpiData } = useKpiStore();
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400); // 右サイドバー初期幅
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250); // 左サイドバー初期幅
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftDragging, setIsLeftDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      // 右サイドバーの幅を計算
      const newWidth = containerRect.right - e.clientX;
      if (newWidth >= 10 && newWidth <= window.innerWidth - 100) {
        setSidebarWidth(newWidth);
      }
    } else if (isLeftDragging) {
      // 左サイドバーの幅を計算
      const newLeftWidth = e.clientX - containerRect.left;
      if (newLeftWidth >= 10 && newLeftWidth <= window.innerWidth - 100) {
        setLeftSidebarWidth(newLeftWidth);
      }
    }
  }, [isDragging, isLeftDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsLeftDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging || isLeftDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // ドラッグ中のテキスト選択防止
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isLeftDragging, handleMouseMove, handleMouseUp]);

  if (!isMounted) return null;

  // 1. 全体背景の動的グラデーション
  const getGlobalBackground = () => {
    const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;
    if (!selectedKpi) {
      return "bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-[#121212] dark:to-slate-900/50";
    }
    
    if (selectedKpi.status === 'good') {
      return "bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-blue-50/20 dark:from-[#081a17] dark:via-[#0c1a24] dark:to-[#121212]";
    } else if (selectedKpi.status === 'warning') {
      return "bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-rose-50/20 dark:from-[#241a0e] dark:via-[#1f1416] dark:to-[#121212]";
    } else {
      return "bg-gradient-to-br from-rose-50/50 via-red-50/30 to-purple-50/20 dark:from-[#261014] dark:via-[#1e1026] dark:to-[#121212]";
    }
  };

  return (
    <div ref={containerRef} className={`h-[calc(100vh-4rem)] flex overflow-hidden relative transition-colors duration-1000 ${getGlobalBackground()}`}>
      
      {/* 背景の呼吸するメッシュグラデーション（全画面） */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 mix-blend-multiply dark:mix-blend-screen">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-300 dark:bg-blue-600/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-purple-300 dark:bg-purple-600/40 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        {selectedNodeId && kpiData[selectedNodeId]?.status === 'good' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-emerald-200 dark:bg-emerald-700/30 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        )}
        {selectedNodeId && kpiData[selectedNodeId]?.status === 'warning' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-amber-200 dark:bg-amber-700/30 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        )}
        {selectedNodeId && kpiData[selectedNodeId]?.status === 'danger' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-rose-200 dark:bg-rose-700/30 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        )}
      </div>

      {/* 左サイドバー：KPIエクスプローラー (グラスモーフィズム) */}
      <div 
        style={{ width: `${leftSidebarWidth}px` }} 
        className="shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-2xl flex flex-col h-full overflow-hidden border-r border-white/40 dark:border-white/5 relative z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
      >
        <KpiTreeExplorer />
      </div>

      {/* 左リサイズ用境界線（スリット調） */}
      <div 
        onMouseDown={(e) => { e.preventDefault(); setIsLeftDragging(true); }}
        className="w-2 -ml-1 cursor-col-resize shrink-0 z-20 flex justify-center items-center group relative"
      >
        <div className={`w-[2px] h-12 rounded-full transition-colors ${isLeftDragging ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-300/50 dark:bg-slate-600/50 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)]'}`} />
      </div>

      {/* メインエリア：KPIツリー (透明) */}
      <div className="flex-1 bg-transparent flex flex-col min-w-0 h-full relative z-10">
        <KpiTree />
      </div>

      {/* 右リサイズ用境界線（スリット調） */}
      {!isActionPanelCollapsed && selectedNodeId ? (
        <div 
          onMouseDown={handleMouseDown}
          className="w-2 -mr-1 cursor-col-resize shrink-0 z-20 flex justify-center items-center group relative"
        >
          <div className={`w-[2px] h-12 rounded-full transition-colors ${isDragging ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-300/50 dark:bg-slate-600/50 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)]'}`} />
        </div>
      ) : null}

      {/* 右サイドバー：アクションパネル (グラスモーフィズム) */}
      <div 
        style={{ 
          width: (isActionPanelCollapsed || !selectedNodeId) ? '0px' : `${sidebarWidth}px`,
          display: (isActionPanelCollapsed || !selectedNodeId) ? 'none' : 'flex'
        }} 
        className="shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-2xl flex-col h-full overflow-hidden border-l border-white/40 dark:border-white/5 relative z-10 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-hidden custom-scrollbar">
            <KpiExecutionPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
