"use client";

import React, { useMemo } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { X, Target, Zap, Bot } from 'lucide-react';
import { getDisplayValue, getStorageValue, formatDisplayValue } from '@/lib/kpi-utils';

export const SimulationPanel = ({ onClose }: { onClose?: () => void }) => {
  const { kpiData, currentPeriod, updateSimulatedValue, updateSimulatedTarget, isPredictionMode, selectedNodeId, setSelectedNodeId } = useKpiStore();

  const rootKpis = useMemo(() => {
    return Object.values(kpiData).filter(k => !k.parentId);
  }, [kpiData]);

  const getChildren = (parentId: string) => {
    return Object.values(kpiData).filter(k => k.parentId === parentId && !k.isArchived);
  };

  const renderKpiRow = (id: string, depth: number = 0) => {
    const kpi = kpiData[id];
    if (!kpi || kpi.isArchived) return null;

    const children = getChildren(id);

    const simTarget = kpi.simulatedTargetValue !== undefined ? kpi.simulatedTargetValue : kpi.targetValue;
    const simActual = kpi.simulatedValue !== undefined ? kpi.simulatedValue : kpi.actualValue;
    
    const displaySimTarget = getDisplayValue(simTarget, kpi, currentPeriod, 'simulatedTargetValue');
    const displaySimActual = getDisplayValue(simActual, kpi, currentPeriod, 'simulatedValue');
    const displayTarget = getDisplayValue(kpi.targetValue, kpi, currentPeriod, 'targetValue');
    const displayActual = getDisplayValue(kpi.actualValue, kpi, currentPeriod, 'actualValue');

    // スライダーの範囲設定（現状の0%〜200%などをカバー。目標値は0にならないよう最低値1を設定）
    const targetMax = Math.max(displayTarget * 2, 100);
    const actualMax = Math.max(displayTarget * 2, displayActual * 2, 100);

    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const displayVal = Number(e.target.value);
      const storageVal = getStorageValue(displayVal, kpi, currentPeriod, 'simulatedTargetValue');
      updateSimulatedTarget(id, storageVal);
    };

    const handleActualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const displayVal = Number(e.target.value);
      const storageVal = getStorageValue(displayVal, kpi, currentPeriod, 'simulatedValue');
      updateSimulatedValue(id, storageVal);
    };

    const isSelected = selectedNodeId === id;

    return (
      <React.Fragment key={id}>
        <div 
          className={`flex flex-col py-4 px-4 border-b border-slate-100 dark:border-slate-800 transition-colors cursor-pointer ${isSelected ? 'bg-[#8ab4f8]/10 dark:bg-[#8ab4f8]/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${kpi.isSimulated && !isSelected ? 'bg-[#8ab4f8]/5 dark:bg-[#8ab4f8]/5' : ''}`}
          onClick={() => setSelectedNodeId(id)}
          style={{ paddingLeft: `${Math.max(1, depth) * 1.5}rem` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi.type === 'KGI' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                {kpi.type}
              </span>
              <span className="font-bold text-sm text-oxford-navy dark:text-slate-200">{kpi.name}</span>
              {kpi.isSimulated && <span className="text-[9px] font-bold text-[#8ab4f8] bg-[#8ab4f8]/10 px-1.5 py-0.5 rounded animate-pulse">SIMULATING</span>}
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">達成率</span>
              <span className={`text-sm font-bold ${(kpi.simulatedAchievementRate || 0) >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {(kpi.simulatedAchievementRate || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Slider */}
            <div className="flex flex-col gap-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Target size={12}/> 目標 (Top-Down)</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatDisplayValue(displaySimTarget, kpi.unit)} {kpi.unit}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={targetMax} 
                value={displaySimTarget} 
                onChange={handleTargetChange}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                <span>0</span>
                <span>基準: {formatDisplayValue(displayTarget, kpi.unit)}</span>
                <span>{formatDisplayValue(targetMax, kpi.unit)}</span>
              </div>
            </div>

            {/* Actual/Prediction Slider */}
            <div className="flex flex-col gap-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-[#8ab4f8]/30 dark:border-[#8ab4f8]/30 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-[#8ab4f8] flex items-center gap-1"><Zap size={12}/> 予測 (Bottom-Up)</span>
                <span className="text-xs font-bold text-[#8ab4f8] dark:text-[#8ab4f8]">{formatDisplayValue(displaySimActual, kpi.unit)} {kpi.unit}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={actualMax} 
                value={displaySimActual} 
                onChange={handleActualChange}
                className="w-full accent-[#8ab4f8] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                <span>0</span>
                <span>基準: {formatDisplayValue(displayActual, kpi.unit)}</span>
                <span>{formatDisplayValue(actualMax, kpi.unit)}</span>
              </div>
            </div>
          </div>
        </div>
        {children.map(child => renderKpiRow(child.id, depth + 1))}
      </React.Fragment>
    );
  };

  if (!isPredictionMode) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] border-l border-slate-200 dark:border-slate-800 w-[550px] shadow-2xl z-50 animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-[#8ab4f8]/30 bg-gradient-to-r from-[#8ab4f8]/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="bg-[#8ab4f8] p-1.5 rounded-md shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-oxford-navy dark:text-slate-100 leading-tight">経営シミュレーション・ボード</h2>
            <p className="text-[9px] text-slate-500 font-medium">Top-down Target & Bottom-up Prediction</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          <span className="text-emerald-600 font-bold">目標スライダー:</span> KGIの目標を上げると、比率に応じて配下のKPI目標も自動で引き上げられます。<br/>
          <span className="text-[#8ab4f8] font-bold">予測スライダー:</span> 現場の予測実績を引き上げると、上位の達成率に連動計算されます。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {rootKpis.map(root => renderKpiRow(root.id, 0))}
      </div>
    </div>
  );
};
