"use client";

import { useParams, useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, LayoutDashboard, Activity, Sparkles, Printer, Database, CheckSquare } from 'lucide-react';
import Link from 'next/link';

import { useState, useEffect, useRef, useCallback } from 'react';
import { KpiTree } from '@/components/kpi-tree/KpiTree';
import { KpiExecutionPanel } from '@/components/kpi-tree/KpiExecutionPanel';
import { KpiTreeExplorer } from '@/components/kpi-tree/KpiTreeExplorer';
import { FloatingUserControls } from '@/components/layout/FloatingUserControls';
import { AmbientSky } from '@/components/layout/AmbientSky';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useKpiStore } from '@/store/useKpiStore';

export default function KpiTreePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;
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

  const getGlobalBackground = () => {
    // 古い背景ロジックを無効化（AmbientSkyが処理するため）
    return "bg-transparent";
  };

  return (
    <div ref={containerRef} className={`h-screen overflow-hidden relative transition-colors duration-1000 ${getGlobalBackground()}`}>
      
      {/* 空間の環境（時間連動型の空と太陽・月） */}
      <AmbientSky />

      {/* 戻るボタン（フローティング） */}
      <button 
        onClick={() => router.push(`/${orgId}/dashboard`)}
        className="absolute top-6 left-6 z-50 flex items-center justify-center w-10 h-10 bg-white/20 dark:bg-black/30 backdrop-blur-xl rounded-full border border-white/40 dark:border-white/10 shadow-2xl text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-black/50 transition-all group pointer-events-auto"
        title="ダッシュボードへ戻る"
      >
        <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
      </button>

      {/* 右上コントロール（フローティング） */}
      <div className="absolute top-6 right-6 z-50 pointer-events-auto">
        <FloatingUserControls />
      </div>

      {/* メインエリア：KPIツリー (全画面キャンバス) */}
      <div className="absolute inset-0 z-10 flex flex-col">
        <KpiTree />
      </div>

      {/* 左サイドバー：KPIエクスプローラー (フローティング) */}
      <div 
        style={{ width: `${leftSidebarWidth}px` }} 
        className="hidden lg:flex absolute top-20 bottom-20 left-4 z-20 bg-white/10 dark:bg-black/20 backdrop-blur-lg flex-col overflow-hidden border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_16px_48px_rgba(0,0,0,0.16)] pointer-events-auto"
      >
        <KpiTreeExplorer />
      </div>

      {/* 左リサイズ用ハンドル */}
      <div 
        style={{ left: `calc(1rem + ${leftSidebarWidth}px - 0.25rem)` }}
        onMouseDown={(e) => { e.preventDefault(); setIsLeftDragging(true); }}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 w-3 h-12 cursor-col-resize z-30 justify-center items-center group pointer-events-auto"
      >
        <div className={`w-[3px] h-10 rounded-full transition-all ${isLeftDragging ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-y-110' : 'bg-white/50 dark:bg-white/20 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)] backdrop-blur-md border border-white/20'}`} />
      </div>

      {/* 右サイドバー：アクションパネル (フローティング) */}
      <div 
        style={{ 
          width: `${sidebarWidth}px`,
          right: '1rem',
          transform: (isActionPanelCollapsed || !selectedNodeId) ? 'translateX(120%)' : 'translateX(0)',
          opacity: (isActionPanelCollapsed || !selectedNodeId) ? 0 : 1,
          pointerEvents: (isActionPanelCollapsed || !selectedNodeId) ? 'none' : 'auto'
        }} 
        className="hidden lg:flex absolute top-20 bottom-20 z-20 bg-white/10 dark:bg-black/20 backdrop-blur-lg flex-col overflow-hidden border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-hidden custom-scrollbar">
            <KpiExecutionPanel />
          </div>
        </div>
      </div>

      {/* トップドック（ナビゲーション） */}
      <div className="hidden lg:flex absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="flex items-center bg-white/20 dark:bg-black/30 backdrop-blur-xl p-1.5 rounded-full border border-white/40 dark:border-white/10 shadow-2xl">
          <Link href={`/${orgId}/p/${projectId}`} title="ダッシュボード" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all">
            <LayoutDashboard size={16} /> <span className="hidden xl:inline">ダッシュボード</span>
          </Link>
          <Link href={`/${orgId}/p/${projectId}/kpi-tree`} title="KPIツリー" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all">
            <Activity size={16} /> <span className="hidden xl:inline">KPIツリー</span>
          </Link>
          <Link href={`/${orgId}/p/${projectId}/manifesto`} title="マニフェスト" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all">
            <Sparkles size={16} /> <span className="hidden xl:inline">マニフェスト</span>
          </Link>
          <Link href={`/${orgId}/p/${projectId}/report`} title="戦略レポート" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all">
            <Printer size={16} /> <span className="hidden xl:inline">レポート</span>
          </Link>
          <Link href={`/${orgId}/p/${projectId}/data-entry`} title="シートエディタ" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all">
            <Database size={16} /> <span className="hidden xl:inline">エディタ</span>
          </Link>
          <Link href={`/${orgId}/p/${projectId}/my-tasks`} title="マイタスク" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all">
            <CheckSquare size={16} /> <span className="hidden xl:inline">タスク</span>
          </Link>
        </div>
      </div>

      {/* 右リサイズ用ハンドル */}
      {!isActionPanelCollapsed && selectedNodeId && (
        <div 
          style={{ right: `calc(1rem + ${sidebarWidth}px - 0.25rem)` }}
          onMouseDown={handleMouseDown}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 w-3 h-12 cursor-col-resize z-30 justify-center items-center group pointer-events-auto transition-all duration-500"
        >
          <div className={`w-[3px] h-10 rounded-full transition-all ${isDragging ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-y-110' : 'bg-white/50 dark:bg-white/20 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)] backdrop-blur-md border border-white/20'}`} />
        </div>
      )}
    </div>
  );
}
