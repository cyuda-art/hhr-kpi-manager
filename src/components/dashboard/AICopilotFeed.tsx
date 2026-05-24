"use client";

import { Sparkles, TrendingDown, ExternalLink, Newspaper, Zap } from 'lucide-react';
import { Project } from '@/types/project';

interface AICopilotFeedProps {
  projects: Project[];
}

export const AICopilotFeed = ({ projects }: AICopilotFeedProps) => {
  return (
    <div className="bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-400/20 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-strategic-teal to-primary-500 flex items-center justify-center text-white shadow-lg">
          <Sparkles size={16} />
        </div>
        <h2 className="text-[18px] font-bold text-oxford-navy dark:text-white">Copilot Intelligence</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 relative z-10 pr-2">
        {/* Insight 1: KPI Risk */}
        <div className="group p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 hover:border-rose-400/50 dark:hover:border-rose-500/50 rounded-2xl transition-all cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5">
              <TrendingDown size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">KPI Alert</span>
                <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">2 hours ago</span>
              </div>
              <p className="text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium mb-2">
                「{projects[0]?.name || '主力事業'}」のQ3『新規リード獲得数』が目標に対して15%ビハインドしています。
              </p>
              <div className="flex items-center gap-2">
                <button className="text-[12px] px-3 py-1.5 bg-strategic-teal text-white rounded-lg hover:bg-strategic-teal/90 transition-colors shadow-sm font-medium">
                  挽回策（Action）をAI生成
                </button>
                <button className="text-[12px] px-3 py-1.5 bg-white/50 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white/80 dark:hover:bg-white/20 transition-colors">
                  ツリーを確認
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Insight 2: Macro Environment News */}
        <div className="group p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 hover:border-blue-400/50 dark:hover:border-blue-500/50 rounded-2xl transition-all cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
              <Newspaper size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Macro Env Update</span>
                <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">1 day ago</span>
              </div>
              <p className="text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium mb-2">
                設定されている「5Forces（新規参入の脅威）」に関する最新のニュースを検知しました。競合他社が新機能をリリースした模様です。
              </p>
              <div className="flex items-center gap-2">
                <button className="text-[12px] px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
                  前提条件を見直す
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Insight 3: Quick Action */}
        <div className="group p-4 bg-gradient-to-br from-strategic-teal/10 to-primary-500/10 dark:from-strategic-teal/20 dark:to-primary-500/20 backdrop-blur-md border border-strategic-teal/30 dark:border-strategic-teal/30 rounded-2xl transition-all cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/30 flex items-center justify-center text-strategic-teal flex-shrink-0 mt-0.5">
              <Zap size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-strategic-teal uppercase tracking-wider">Suggest</span>
              </div>
              <p className="text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                新しい四半期が始まりました。新しいプロジェクト（KPIツリー）を構築しますか？
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
