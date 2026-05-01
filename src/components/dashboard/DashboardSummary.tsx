"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { DashboardCard } from './DashboardCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { useState } from 'react';
import { AlertTriangle, TrendingUp, Target, Activity } from 'lucide-react';

export const DashboardSummary = () => {
  const { kpiData } = useKpiStore();
  const [drawerKpiId, setDrawerKpiId] = useState<string | null>(null);

  // データドリブンな集計
  const allNodes = Object.values(kpiData);
  
  if (allNodes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-400">KPIデータがありません。オンボーディングまたはツリーからKPIを追加してください。</p>
      </div>
    );
  }

  // KGIをすべて抽出
  const kgis = allNodes.filter(node => node.type === 'KGI' || node.parentId === null);
  
  // 達成率が危険なKPIを抽出 (80%未満をアラートとする)
  const alertKpis = allNodes.filter(node => (node.achievementRate || 0) < 80);

  // 全体の平均達成率（KGIベース）
  const avgKgiAchievement = kgis.length > 0 
    ? kgis.reduce((sum, kgi) => sum + (kgi.achievementRate || 0), 0) / kgis.length
    : 0;

  return (
    <div className="space-y-6">
      {/* サマリーハイライト */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-100 mb-2">
            <Target className="w-5 h-5" />
            <span className="font-bold text-sm">主要KGI 平均達成率</span>
          </div>
          <div className="text-3xl font-black">{Math.round(avgKgiAchievement)}%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Activity className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">総指標数</span>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{allNodes.length} <span className="text-sm font-medium text-slate-400">ノード</span></div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">要対応（達成率80%未満）</span>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{alertKpis.length} <span className="text-sm font-medium text-slate-400">件</span></div>
        </div>
      </div>

      {/* KGIカード一覧（横スクロール可能に） */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          ビジネスKPI/KGI ハイライト
        </h2>
        <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar">
          {kgis.map((kpi) => (
            <div key={kpi.id} className="min-w-[300px] snap-start">
              <DashboardCard kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
            </div>
          ))}
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
