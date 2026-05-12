"use client";

import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Target, Sparkles, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

export default function ManifestoPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { projects, isLoading } = useProjectStore();
  const { currentOrgId } = useOrgStore();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === projectId);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-logic-slate dark:text-slate-400 flex flex-col items-center">
          <AlertCircle size={48} className="mb-4 text-slate-300" />
          <p>プロジェクトが見つかりません</p>
        </div>
      </div>
    );
  }

  // Manifesto string is usually saved as "Title\nDescription"
  const manifestoText = currentProject.manifesto || 'マニフェストが設定されていません。';
  const parts = manifestoText.split('\n');
  const title = parts[0];
  const description = parts.slice(1).join('\n');

  return (
    <div className="w-full h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 dark:bg-[#202124]">
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-8 md:pt-12 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center text-strategic-teal dark:text-primary-400">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-oxford-navy dark:text-slate-200 tracking-tight">Project Manifesto</h1>
            <p className="text-sm text-logic-slate dark:text-slate-400 mt-1">このKPIツリーの設計基盤となる戦略シナリオ</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2d2f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden relative mb-12">
          {/* 背景の装飾 */}
          <div className="absolute -top-10 -right-10 p-12 opacity-[0.02] dark:opacity-[0.04] pointer-events-none text-primary-500">
            <Target size={300} />
          </div>

          <div className="p-8 md:p-10 relative z-10">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full mb-4">
                <Sparkles size={12} /> AI Generated Strategy
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-oxford-navy dark:text-slate-200 leading-tight mb-2">
                {title}
              </h2>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="bg-clean-canvas dark:bg-slate-900/50 p-6 md:p-8 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-xs font-bold text-slate-400 dark:text-logic-slate dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Strategic Approach
                </h3>
                <p className="text-[15px] md:text-[17px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {description || '詳細な戦略内容はありません。'}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="p-5 border border-slate-100 dark:border-slate-700/50 bg-clean-canvas dark:bg-slate-900/30 rounded-xl">
                <h4 className="text-[11px] font-bold text-logic-slate dark:text-slate-400 uppercase tracking-wider mb-2">Target KGI</h4>
                <p className="font-bold text-oxford-navy dark:text-slate-200 text-lg">{currentProject.kgiType || '未設定'}</p>
              </div>
              <div className="p-5 border border-slate-100 dark:border-slate-700/50 bg-clean-canvas dark:bg-slate-900/30 rounded-xl">
                <h4 className="text-[11px] font-bold text-logic-slate dark:text-slate-400 uppercase tracking-wider mb-2">Target Value</h4>
                <p className="font-bold text-oxford-navy dark:text-slate-200 text-lg">
                  {currentProject.kgiTargetValue ? currentProject.kgiTargetValue.toLocaleString() : '未設定'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
