"use client";

import { X } from 'lucide-react';
import { KpiNodeWithComputedAndInit } from '@/store/useKpiStore';
import { TrendChart } from '../dashboard/TrendChart';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiNodeWithComputedAndInit | null;
}

export const DetailDrawer = ({ isOpen, onClose, kpi }: Props) => {
  if (!isOpen || !kpi) return null;

  const isUp = kpi.actualValue >= kpi.previousValue;
  const isNeutral = kpi.actualValue === kpi.previousValue;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-[500px] bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 bg-white border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
              {kpi.businessUnit}
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">{kpi.name}</h2>
            <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">当月実績</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-800">{kpi.actualValue.toLocaleString()}</span>
                <span className="text-sm text-slate-500">{kpi.unit}</span>
              </div>
              <div className={`text-xs mt-1 font-medium ${isUp ? 'text-emerald-500' : isNeutral ? 'text-slate-400' : 'text-rose-500'}`}>
                前月比 {isUp ? '+' : ''}{(kpi.actualValue - kpi.previousValue).toLocaleString()}{kpi.unit}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">達成率</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-800">{kpi.achievementRate.toFixed(1)}</span>
                <span className="text-sm text-slate-500">%</span>
              </div>
              <div className="text-xs mt-1 text-slate-400">
                目標 {kpi.targetValue.toLocaleString()}{kpi.unit}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
              直近6ヶ月の推移
            </h3>
            <TrendChart actualValue={kpi.actualValue} targetValue={kpi.targetValue} unit={kpi.unit} />
          </div>

          {/* Insights (モックテキストの削除と誘導) */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
              アクション＆インサイト
            </h3>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm text-slate-600 space-y-2">
              <p>この指標のより詳細なAI分析、および改善アクションプランの作成・管理は、<strong>KPIツリー画面の右側「AIチャット」および「アクション＆インサイト」パネル</strong>から実行できます。</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
