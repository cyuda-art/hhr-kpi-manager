import { Handle, Position } from '@xyflow/react';
import { KpiNodeWithComputed } from '@/types';
import { useKpiStore } from '@/store/useKpiStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getDisplayValue } from '@/lib/kpi-utils';
import { ChevronDown, ChevronRight, Sparkles, History, Target, BarChart2, Calculator, Link2 } from 'lucide-react';

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
      case 'good': return 'border-strategic-teal/60';
      case 'warning': return 'border-amber-500/60';
      case 'danger': return 'border-red-600/60';
      default: return 'border-slate-300';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-strategic-teal text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'danger': return 'bg-red-600 text-white';
      default: return 'bg-logic-slate text-white';
    }
  };

  const selectedNodeId = useKpiStore((state) => state.selectedNodeId);
  const toggleNodeCollapse = useKpiStore((state) => state.toggleNodeCollapse);
  const currentPeriod = useKpiStore((state) => state.currentPeriod);
  const isPredictionMode = useKpiStore((state) => state.isPredictionMode);
  const isSelected = selectedNodeId === data.id;

  const kpiData = useKpiStore((state) => state.kpiData);

  // 階層(深さ)の計算
  const getLevel = (nodeId: string | null): number => {
    let currentId = nodeId;
    let level = 0;
    while (currentId && kpiData[currentId]) {
      const parentId = kpiData[currentId].parentId;
      if (!parentId) break; // KGI (ルート)
      currentId = parentId;
      level++;
    }
    return level;
  };
  const level = getLevel(data.id);

  // 定性ラベルの決定
  const getQualitativeLabel = () => {
    if (data.type === 'KGI') return 'Goal';
    if (level === 1) return 'KSF';
    return 'Process';
  };

  // モック用の時系列・予測ロジック
  let isPast = false;
  let displayLabel = isPast ? "過去実績" : "実績";
  
  // 期間換算（year基準をベースとする）
  let displayActualRaw = data.actualValue;
  let displayTargetRaw = data.targetValue;
  
  if (isPredictionMode) {
    displayLabel = "AI予測";
    displayActualRaw = data.simulatedValue !== undefined ? data.simulatedValue : data.actualValue;
  }

  // kpi-utilsを用いてUI表示用に換算する
  let displayActual = getDisplayValue(displayActualRaw, data, currentPeriod);
  let displayTarget = getDisplayValue(displayTargetRaw, data, currentPeriod);

  // 過去データの判定（ここでは一旦シンプルにfalseとする。必要に応じて実際の日付比較を追加）
  isPast = false;

  const displayAchievementRate = isPredictionMode && data.simulatedAchievementRate !== undefined 
    ? data.simulatedAchievementRate 
    : (displayActual / displayTarget) * 100;
    
  const displayStatus = isPredictionMode && data.simulatedStatus !== undefined
    ? data.simulatedStatus
    : displayAchievementRate >= 100 ? 'good' : displayAchievementRate >= 80 ? 'warning' : 'danger';

  const isAlert = displayTarget > 0 && displayAchievementRate < 50;

  // フォーミュラを可読な文字列に変換
  const getReadableFormula = () => {
    try {
      if (!data || !data.isCalculated || typeof data.formula !== 'string') return null;
      
      // #{id} を正規表現で抽出して名前に置換
      return data.formula.replace(/#\{([^}]+)\}/g, (match, id) => {
        if (!kpiData) return match;
        const refNode = kpiData[id];
        return refNode ? `[${refNode.name || '不明'}]` : match;
      });
    } catch (e) {
      console.error("Formula parsing error", e);
      return null;
    }
  };

  const readableFormula = getReadableFormula();

  return (
    <div className={cn(
      "w-64 bg-white dark:bg-slate-800 rounded-lg dark:border-slate-700 shadow-sm border p-4 transition-all duration-300 relative",
      getStatusBorder(displayStatus),
      isAlert ? "bg-red-50/50 border-red-600" : "",
      isSelected && "ring-2 ring-oxford-navy border-oxford-navy dark:ring-blue-400 dark:border-blue-400 shadow-md",
      data.isKsf && "border-2 border-strategic-teal shadow-[0_0_12px_rgba(0,163,161,0.15)] ring-1 ring-strategic-teal/20"
    )}>
      {/* Background Progress Bar Wrapper (Refined Gradient) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-lg">
        <div 
          className={cn(
            "absolute top-0 left-0 h-full opacity-10 transition-all duration-1000 ease-out",
            displayStatus === 'good' ? "bg-gradient-to-r from-strategic-teal to-strategic-teal/60" :
            displayStatus === 'warning' ? "bg-gradient-to-r from-amber-500 to-amber-400" :
            "bg-gradient-to-r from-red-600 to-red-400"
          )}
          style={{ width: `${Math.min(100, Math.max(0, displayAchievementRate))}%` }}
        />
      </div>

      <Handle type="target" position={targetPosition} className="w-3 h-3 !bg-[#5f6368] border-none relative z-10" />
      
      <div className="relative z-10 flex justify-between items-start mb-2">
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap font-poppins">
            <span className="text-[9px] font-bold text-strategic-teal uppercase tracking-widest">{data.businessUnit}</span>
            {data.linkedSource && (
              <span className="text-[8px] bg-logic-slate/10 dark:bg-slate-700 text-logic-slate dark:text-slate-300 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 flex items-center gap-0.5 tracking-wider">
                <Link2 size={10} /> LINKED
              </span>
            )}
            {data.warning && (
              <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 animate-pulse tracking-wider">
                ⚠️ RESET
              </span>
            )}
            <span className="text-[8px] bg-logic-slate/5 dark:bg-slate-700 text-logic-slate dark:text-slate-300 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 tracking-wider">
              {data.type === 'KGI' ? 'GOAL / KGI' : level === 1 ? 'KSF / KPI' : 'PROCESS / KPI'}
            </span>
          </div>
          
          <div className="flex flex-col gap-2.5">
            {/* 定性（Goal/KSF）部分 */}
            {(data.qualitativeName || data.type === 'KGI') && (
              <div>
                <p className={cn(
                  "text-[9px] font-bold mb-0.5 flex items-center gap-1 font-poppins tracking-wider uppercase",
                  data.isKsf ? "text-strategic-teal" : "text-logic-slate dark:text-slate-300/70 dark:text-slate-400"
                )}>
                  <Target size={10} /> 
                  {data.isKsf ? "Key Success Factor" : getQualitativeLabel()}
                </p>
                <p className={cn(
                  "font-bold text-[13px] leading-snug break-words font-sans",
                  data.isKsf ? "text-oxford-navy dark:text-slate-100" : "text-oxford-navy dark:text-slate-100/90 dark:text-slate-200"
                )}>
                  {(data.qualitativeName || '未設定').replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
                </p>
              </div>
            )}
            
            {/* 定量（KGI/KPI）部分 */}
            <div>
              <p className="text-[9px] text-logic-slate dark:text-slate-300/70 dark:text-slate-400 font-bold mb-0.5 flex items-center gap-1 font-poppins tracking-wider uppercase"><BarChart2 size={10} /> {data.type === 'KGI' ? 'Quantitative KGI' : 'Quantitative KPI'}</p>
              <p className="font-bold text-oxford-navy dark:text-slate-100 text-[12px] leading-snug break-words font-sans">{data.name}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn("px-2 py-0.5 rounded-[4px] text-[11px] font-bold text-[#202124]", getStatusBg(displayStatus))}>
            {displayAchievementRate.toFixed(1)}%
          </div>
          {displayTarget > 0 && (displayActual - displayTarget) < 0 && (
            <div className="text-[10px] font-bold text-[#f43f5e] bg-[#f43f5e]/10 px-1.5 py-0.5 rounded">
              不足: {Math.round(displayActual - displayTarget).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-[#3c4043]">
        <div className="flex justify-between text-[11px] items-center font-lato">
          <span className="flex items-center gap-1 text-logic-slate dark:text-slate-300 font-bold">
            {data.isCalculated && <span title="自動計算項目"><Calculator size={11} className="text-strategic-teal" /></span>}
            {displayLabel}
          </span>
          <span className="font-bold text-oxford-navy dark:text-slate-100">
            {displayActual.toLocaleString()} {data.unit}
          </span>
        </div>
        <div className="flex justify-between text-[11px] font-lato">
          <span className="text-logic-slate dark:text-slate-300/70 dark:text-slate-400 font-bold">目標</span>
          <span className="text-logic-slate dark:text-slate-300/70 dark:text-slate-400 font-bold">{displayTarget.toLocaleString()} {data.unit}</span>
        </div>

        {readableFormula && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="text-[10px] bg-clean-canvas dark:bg-slate-900 p-1.5 rounded-md border border-slate-100 dark:border-slate-700 break-words font-formula italic text-logic-slate dark:text-slate-300">
              {readableFormula}
            </div>
          </div>
        )}
      </div>
      
      {data.hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleNodeCollapse(data.id);
          }}
          className={cn(
            "absolute w-5 h-5 bg-white border rounded-full flex items-center justify-center text-logic-slate dark:text-slate-300 hover:text-oxford-navy dark:text-slate-100 hover:border-oxford-navy transition-all z-20 shadow-sm",
            getStatusBorder(displayStatus),
            sourcePosition === Position.Right ? "-right-2.5 top-1/2 -translate-y-1/2" : "-bottom-2.5 left-1/2 -translate-x-1/2"
          )}
        >
          {data.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            btn.classList.add('animate-pulse', 'pointer-events-none');
            await useKpiStore.getState().expandKpiNode(data.id);
            btn.classList.remove('animate-pulse', 'pointer-events-none');
          }}
          title="AIでさらに要素分解する"
          className={cn(
            "absolute w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-strategic-teal hover:bg-strategic-teal hover:text-white hover:border-strategic-teal transition-all z-20 shadow-sm group",
            sourcePosition === Position.Right ? "-right-3 top-1/2 -translate-y-1/2" : "-bottom-3 left-1/2 -translate-x-1/2"
          )}
        >
          <Sparkles size={12} className="group-hover:animate-spin" />
        </button>
      )}

      <Handle type="source" position={sourcePosition} className="w-3 h-3 !bg-transparent border-none opacity-0" />
    </div>
  );
};
