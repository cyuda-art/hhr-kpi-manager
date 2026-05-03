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
}

export const KpiNodeComponent = ({ data }: NodeProps) => {
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
      "w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border-2 p-4 transition-all hover:shadow-xl hover:-translate-y-1 duration-300",
      getStatusBorder(displayStatus),
      data.isSimulated && "shadow-primary-100 dark:shadow-none",
      isSelected && "ring-4 ring-primary-400/50 border-primary-400 dark:ring-primary-800/50 dark:border-primary-600",
      isAlert && "animate-pulse shadow-red-500/20 dark:shadow-red-900/30 border-red-400 dark:border-red-600",
      isPredictionMode && "bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-950/30 dark:to-purple-950/30 border-primary-300 dark:border-primary-700"
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-300 dark:!bg-slate-600" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{data.businessUnit}</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{data.name}</span>
        </div>
        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white", getStatusBg(displayStatus))}>
          {displayAchievementRate.toFixed(1)}%
        </div>
      </div>

      <div className="space-y-1 mt-3">
        <div className="flex justify-between text-xs items-center">
          <span className={cn(
            "flex items-center gap-1",
            isPredictionMode ? "text-primary-600 dark:text-primary-400 font-bold" : "text-slate-500 dark:text-slate-400"
          )}>
            {isPredictionMode && <Sparkles size={12} />}
            {isPast && !isPredictionMode && <History size={12} />}
            {displayLabel}
          </span>
          <span className={cn(
            "font-bold",
            isPredictionMode ? "text-primary-700 dark:text-primary-300" : "text-slate-700 dark:text-slate-200"
          )}>
            {displayActual.toLocaleString()} {data.unit}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500">目標</span>
          <span className="text-slate-500 dark:text-slate-400">{displayTarget.toLocaleString()} {data.unit}</span>
        </div>
      </div>
      
      {data.hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleNodeCollapse(data.id);
          }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-500 hover:text-primary-500 hover:border-primary-400 transition-colors z-10"
        >
          {data.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-slate-300 dark:!bg-slate-600 opacity-0" />
    </div>
  );
};
