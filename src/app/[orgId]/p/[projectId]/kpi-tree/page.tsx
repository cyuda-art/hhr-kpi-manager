"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { ActionPanel } from '@/components/kpi-tree/ActionPanel';

export default function KpiTreePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400); // 初期幅
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    // ウィンドウ全体の幅からマウスのX座標を引いてサイドバーの幅を計算
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    // 最小幅・最大幅の制限
    if (newWidth >= 300 && newWidth <= 800) {
      setSidebarWidth(newWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] flex overflow-hidden bg-white dark:bg-[#1e1e20] relative">
      {/* メインエリア：KPIツリー */}
      <div className="flex-1 bg-white dark:bg-[#2d2f31] flex flex-col min-w-0 h-full relative">
        <KpiTree />
      </div>

      {/* リサイズ用境界線（Resizer） */}
      <div 
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize shrink-0 z-10 hover:bg-primary-500/50 transition-colors border-l border-slate-200 dark:border-[#3c4043] ${
          isDragging ? 'bg-primary-500' : 'bg-transparent'
        }`}
      />

      {/* 右サイドバー：アクションパネル */}
      <div 
        style={{ width: `${sidebarWidth}px` }} 
        className="shrink-0 bg-white dark:bg-[#2d2f31] flex flex-col h-full overflow-hidden"
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
          <ActionPanel />
        </div>
      </div>
    </div>
  );
}
