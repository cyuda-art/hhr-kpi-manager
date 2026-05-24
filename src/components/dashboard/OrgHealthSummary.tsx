"use client";

import { Activity, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Project } from '@/types/project';

interface OrgHealthSummaryProps {
  projects: Project[];
}

export const OrgHealthSummary = ({ projects }: OrgHealthSummaryProps) => {
  // モックデータ：実際は各プロジェクトのKGI実績値やKPIのステータスを集計する
  const totalProjects = projects.length;
  
  // プロジェクト数から適当なモックの数値を生成
  const totalKpis = totalProjects * 12;
  const onTrackKpis = Math.floor(totalKpis * 0.75);
  const atRiskKpis = totalKpis - onTrackKpis;
  
  // KGIの達成率の平均（モック）
  const avgKgiProgress = totalProjects > 0 ? 68 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target size={64} />
        </div>
        <h3 className="text-[13px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider mb-2">Overall Progress</h3>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-oxford-navy dark:text-white">{avgKgiProgress}%</span>
        </div>
        <div className="mt-3 w-full h-1.5 bg-white/30 dark:bg-black/50 rounded-full overflow-hidden">
          <div className="h-full bg-strategic-teal rounded-full" style={{ width: `${avgKgiProgress}%` }}></div>
        </div>
      </div>

      <div className="bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity size={64} />
        </div>
        <h3 className="text-[13px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider mb-2">Active Projects</h3>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-oxford-navy dark:text-white">{totalProjects}</span>
          <span className="text-sm text-slate-500 dark:text-[#9aa0a6] mb-1">projects</span>
        </div>
        <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-2">
          全社目標に向けて稼働中
        </p>
      </div>

      <div className="bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CheckCircle2 size={64} />
        </div>
        <h3 className="text-[13px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider mb-2">On Track KPIs</h3>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{onTrackKpis}</span>
          <span className="text-sm text-slate-500 dark:text-[#9aa0a6] mb-1">/ {totalKpis} KPIs</span>
        </div>
        <p className="text-[12px] text-emerald-700 dark:text-emerald-500 mt-2 font-medium">
          順調に推移しています
        </p>
      </div>

      <div className="bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-rose-400/30 dark:border-rose-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500">
          <AlertTriangle size={64} />
        </div>
        <h3 className="text-[13px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">At Risk KPIs</h3>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-rose-600 dark:text-rose-400">{atRiskKpis}</span>
          <span className="text-sm text-slate-500 dark:text-[#9aa0a6] mb-1">KPIs</span>
        </div>
        <p className="text-[12px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
          アクションが必要です
        </p>
      </div>
    </div>
  );
};
