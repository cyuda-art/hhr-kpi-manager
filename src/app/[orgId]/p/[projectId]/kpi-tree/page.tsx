"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { KpiExecutionPanel } from '@/components/kpi-tree/KpiExecutionPanel';
import { SimulationPanel } from '@/components/kpi-tree/SimulationPanel';
import { KpiTreeExplorer } from '@/components/kpi-tree/KpiTreeExplorer';
import { CopilotSidebar } from '@/components/kpi-tree/CopilotSidebar';
import { useKpiStore } from '@/store/useKpiStore';
import { useLayoutStore } from '@/store/useLayoutStore';

export default function KpiTreePage() {
  const isPredictionMode = useKpiStore(state => state.isPredictionMode);
  const isCopilotSidebarOpen = useKpiStore(state => state.isCopilotSidebarOpen);
  const isActionPanelCollapsed = useLayoutStore(state => state.isActionPanelCollapsed);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400); // 右サイドバー初期幅
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250); // 左サイドバー初期幅
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftDragging, setIsLeftDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if ((isCopilotSidebarOpen || isPredictionMode) && sidebarWidth < 350) {
      setSidebarWidth(450);
    }
  }, [isCopilotSidebarOpen, isPredictionMode]);

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

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] flex overflow-hidden bg-white dark:bg-[#1e1e20] relative">
      {/* 左サイドバー：KPIエクスプローラー */}
      <div 
        style={{ width: `${leftSidebarWidth}px` }} 
        className="shrink-0 bg-slate-50 dark:bg-[#2d2f31] flex flex-col h-full overflow-hidden"
      >
        <KpiTreeExplorer />
      </div>

      {/* 左リサイズ用境界線（Resizer） */}
      <div 
        onMouseDown={(e) => { e.preventDefault(); setIsLeftDragging(true); }}
        className={`w-1 cursor-col-resize shrink-0 z-10 hover:bg-primary-500/50 transition-colors border-r border-slate-200 dark:border-[#3c4043] ${
          isLeftDragging ? 'bg-primary-500' : 'bg-transparent'
        }`}
      />

      {/* メインエリア：KPIツリー */}
      <div className="flex-1 bg-white dark:bg-[#2d2f31] flex flex-col min-w-0 h-full relative">
        <KpiTree />
      </div>

      {/* リサイズ用境界線（Resizer） - パネルが閉じている場合は非表示 */}
      {!isActionPanelCollapsed || isCopilotSidebarOpen || isPredictionMode ? (
        <div 
          onMouseDown={handleMouseDown}
          className={`w-1 cursor-col-resize shrink-0 z-10 hover:bg-primary-500/50 transition-colors border-l border-slate-200 dark:border-[#3c4043] ${
            isDragging ? 'bg-primary-500' : 'bg-transparent'
          }`}
        />
      ) : null}

      {/* 右サイドバー：アクションパネル or Copilot */}
      <div 
        style={{ 
          width: isActionPanelCollapsed && !isCopilotSidebarOpen && !isPredictionMode ? '0px' : `${sidebarWidth}px`,
          display: (!isCopilotSidebarOpen && !isPredictionMode && isActionPanelCollapsed) ? 'none' : 'flex'
        }} 
        className="shrink-0 bg-white dark:bg-[#2d2f31] flex-col h-full overflow-hidden"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          {isCopilotSidebarOpen ? (
            <CopilotSidebar />
          ) : isPredictionMode ? (
            <SimulationPanel />
          ) : (
            <div className="h-full overflow-hidden custom-scrollbar">
              <KpiExecutionPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
