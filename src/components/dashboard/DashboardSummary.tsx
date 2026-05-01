"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { DashboardCard } from './DashboardCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { useState } from 'react';
import { AlertTriangle, TrendingUp, Target, Activity, ChevronDown, ChevronUp } from 'lucide-react';

export const DashboardSummary = () => {
  const { kpiData } = useKpiStore();
  const [drawerKpiId, setDrawerKpiId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // データドリブンな集計
  const allNodes = Object.values(kpiData);
  
  if (allNodes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-400">KPIデータがありません。オンボーディングまたはツリーからKPIを追加してください。</p>
      </div>
    );
  }

  // KGIとKPIを抽出
  const kgis = allNodes.filter(node => node.type === 'KGI' || node.parentId === null);
  const kpis = allNodes.filter(node => node.type === 'KPI' && node.parentId !== null);
  
  // 達成率が危険なKPIを抽出 (80%未満をアラートとする)
  const alertKpis = allNodes.filter(node => (node.achievementRate || 0) < 80);

  // 全体の平均達成率（KGIベース）
  const avgKgiAchievement = kgis.length > 0 
    ? kgis.reduce((sum, kgi) => sum + (kgi.achievementRate || 0), 0) / kgis.length
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
      {/* アコーディオンのヘッダー部分 */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            ダッシュボード・サマリー
          </h2>
          
          {/* 折りたたみ時でも重要な指標だけは小さく見せる */}
          {!isExpanded && (
            <div className="flex items-center gap-6 text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Target className="w-3.5 h-3.5" />
                <span>平均達成率: {Math.round(avgKgiAchievement)}%</span>
              </div>
              {alertKpis.length > 0 && (
                <div className="flex items-center gap-1.5 text-rose-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>要対応: {alertKpis.length}件</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-slate-400 hover:text-indigo-600 transition-colors">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* 展開されるコンテンツ */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-4 pt-0 space-y-6">
          {/* サマリーハイライト */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
              <div className="flex items-center gap-2 text-indigo-100 mb-2">
                <Target className="w-5 h-5" />
                <span className="font-bold text-sm">主要KGI 平均達成率</span>
              </div>
              <div className="text-3xl font-black">{Math.round(avgKgiAchievement)}%</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">総指標数</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{allNodes.length} <span className="text-sm font-medium text-slate-400">ノード</span></div>
            </div>

            <div className={`rounded-2xl p-4 border flex flex-col justify-center ${alertKpis.length > 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'}`}>
              <div className={`flex items-center gap-2 mb-1 ${alertKpis.length > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">要対応（達成率80%未満）</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{alertKpis.length} <span className="text-sm font-medium text-slate-400">件</span></div>
            </div>
          </div>

          {/* KGIカード一覧（横スクロール可能に） */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
              全社重要指標 (KGI)
            </h3>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x custom-scrollbar">
              {kgis.map((kpi) => (
                <div key={kpi.id} className="min-w-[280px] snap-start">
                  <DashboardCard kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
                </div>
              ))}
            </div>
          </div>

          {/* KPIカード一覧（横スクロール可能に） */}
          {kpis.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                現場指標 (KPI)
              </h3>
              <div className="flex overflow-x-auto pb-4 gap-4 snap-x custom-scrollbar">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="min-w-[280px] snap-start">
                    <DashboardCard kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailDrawer 
        isOpen={drawerKpiId !== null}
        onClose={() => setDrawerKpiId(null)}
        kpi={drawerKpiId ? kpiData[drawerKpiId] : null}
      />
    </div>
  );
};
