import { Handle, Position } from '@xyflow/react';
import { KpiNodeWithComputed } from '@/types';
import { useKpiStore } from '@/store/useKpiStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, ChevronRight, Sparkles, History } from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface NodeProps {
  data: KpiNodeWithComputed & { hasChildren?: boolean; isCollapsed?: boolean };
  targetPosition?: Position;
  sourcePosition?: Position;
}

export const KpiNodeComponent = ({ data, targetPosition = Position.Top, sourcePosition = Position.Bottom }: NodeProps) => {
  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'good': return 'border-emerald-400';
      case 'warning': return 'border-amber-400';
      case 'danger': return 'border-rose-400';
      default: return 'border-slate-300';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const selectedNodeId = useKpiStore((state) => state.selectedNodeId);
  const toggleNodeCollapse = useKpiStore((state) => state.toggleNodeCollapse);
  const currentPeriod = useKpiStore((state) => state.currentPeriod);
  const isPredictionMode = useKpiStore((state) => state.isPredictionMode);
  const isSelected = selectedNodeId === data.id;

  // モック用の時系列・予測ロジック
  let displayActual = data.actualValue;
  let displayTarget = data.targetValue;
  let displayLabel = "実績";
  let isPast = false;

  if (currentPeriod === '2026-03') {
    displayActual = Math.round(data.actualValue * 0.8);
    displayTarget = Math.round(data.targetValue * 0.9);
    isPast = true;
  } else if (currentPeriod === '2026-04') {
    displayActual = Math.round(data.actualValue * 0.9);
    displayTarget = Math.round(data.targetValue * 0.95);
    isPast = true;
  }

  if (isPredictionMode) {
    displayLabel = "AI予測";
    displayActual = data.simulatedValue !== undefined ? data.simulatedValue : data.actualValue;
  }

  const displayAchievementRate = isPredictionMode && data.simulatedAchievementRate !== undefined 
    ? data.simulatedAchievementRate 
    : (displayActual / displayTarget) * 100;
    
  const displayStatus = isPredictionMode && data.simulatedStatus !== undefined
    ? data.simulatedStatus
    : displayAchievementRate >= 100 ? 'good' : displayAchievementRate >= 80 ? 'warning' : 'danger';

  const isAlert = displayTarget > 0 && displayAchievementRate < 50;

  return (
    <div className={cn(
      "w-64 bg-white dark:bg-[#2d2f31] rounded-[8px] shadow-sm border border-slate-200 dark:border-slate-600 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-300",
      getStatusBorder(displayStatus),
      data.isSimulated && "shadow-[#8ab4f8]/20",
      isSelected && "ring-2 ring-[#8ab4f8] border-[#8ab4f8]",
      isAlert && "animate-pulse shadow-red-900/30 border-[#f28b82]",
      isPredictionMode && "bg-slate-50 dark:bg-[#202124] border-[#8ab4f8]"
    )}>
      <Handle type="target" position={targetPosition} className="w-3 h-3 !bg-[#5f6368] border-none" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold text-[#8ab4f8] uppercase tracking-wider">{data.businessUnit}</span>
            {data.type === 'KGI' ? (
              <span className="text-[9px] bg-[#c58af9]/20 text-[#c58af9] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">Goal & KGI</span>
            ) : (
              <span className="text-[9px] bg-[#fbbc04]/20 text-[#fbbc04] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">KSF & KPI</span>
            )}
          </div>
          
          <div className="flex flex-col gap-2.5">
            {/* 定性（Goal/KSF）部分 */}
            {(data.qualitativeName || data.type === 'KGI') && (
              <div>
                <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-bold mb-0.5">{data.type === 'KGI' ? '🎯 Goal (定性目標)' : '🎯 KSF (重要成功要因)'}</p>
                <p className="font-bold text-slate-800 dark:text-[#e8eaed] text-[14px] leading-tight break-words">{data.qualitativeName || '未設定'}</p>
              </div>
            )}
            
            {/* 定量（KGI/KPI）部分 */}
            <div>
              <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-bold mb-0.5">{data.type === 'KGI' ? '📊 KGI (定量指標)' : '📊 KPI (定量指標)'}</p>
              <p className="font-bold text-slate-800 dark:text-[#e8eaed] text-[13px] leading-tight break-words">{data.name}</p>
            </div>
          </div>
        </div>
        <div className={cn("px-2 py-0.5 rounded-[4px] text-[11px] font-bold text-[#202124]", getStatusBg(displayStatus))}>
          {displayAchievementRate.toFixed(1)}%
        </div>
      </div>

      <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-[#3c4043]">
        <div className="flex justify-between text-[12px] items-center">
          <span className={cn(
            "flex items-center gap-1",
            isPredictionMode ? "text-[#8ab4f8] font-medium" : "text-slate-500 dark:text-[#9aa0a6]"
          )}>
            {isPredictionMode && <Sparkles size={12} />}
            {isPast && !isPredictionMode && <History size={12} />}
            {displayLabel}
          </span>
          <span className={cn(
            "font-medium",
            isPredictionMode ? "text-slate-800 dark:text-[#e8eaed]" : "text-slate-900 dark:text-[#f1f3f4]"
          )}>
            {displayActual.toLocaleString()} {data.unit}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-slate-500 dark:text-[#9aa0a6]">目標</span>
          <span className="text-slate-500 dark:text-[#9aa0a6]">{displayTarget.toLocaleString()} {data.unit}</span>
        </div>
      </div>
      
      {data.hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleNodeCollapse(data.id);
          }}
          className={cn(
            "absolute w-6 h-6 bg-white dark:bg-[#2d2f31] border border-slate-300 dark:border-[#5f6368] rounded-full flex items-center justify-center text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:text-[#e8eaed] hover:border-[#8ab4f8] hover:bg-slate-50 dark:hover:bg-[#323639] transition-colors z-10",
            sourcePosition === Position.Right ? "-right-3 top-1/2 -translate-y-1/2" : "-bottom-3 left-1/2 -translate-x-1/2"
          )}
        >
          {data.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      <Handle type="source" position={sourcePosition} className="w-3 h-3 !bg-transparent border-none opacity-0" />
    </div>
  );
};
