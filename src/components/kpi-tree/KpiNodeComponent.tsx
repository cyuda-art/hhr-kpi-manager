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
      "w-64 bg-white dark:bg-[#2d2f31] rounded-[8px] shadow-sm border border-slate-200 dark:border-slate-600 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 relative overflow-hidden",
      getStatusBorder(displayStatus),
      data.isSimulated && "shadow-[#8ab4f8]/20",
      isSelected && "ring-2 ring-[#8ab4f8] border-[#8ab4f8]",
      isAlert && "animate-pulse shadow-red-900/30 border-[#f28b82]",
      data.warning && "border-amber-500 shadow-amber-500/20 ring-1 ring-amber-500",
      isPredictionMode && "bg-slate-50 dark:bg-[#202124] border-[#8ab4f8]",
      data.isKsf && "ring-2 ring-amber-400 dark:ring-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.4)] dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    )}>
      {/* Background Progress Bar */}
      <div 
        className={cn(
          "absolute top-0 left-0 h-full opacity-[0.15] dark:opacity-[0.25] transition-all duration-1000 ease-out",
          displayStatus === 'good' ? "bg-gradient-to-r from-emerald-100 to-emerald-500 dark:from-emerald-900 dark:to-emerald-500" :
          displayStatus === 'warning' ? "bg-gradient-to-r from-amber-100 to-amber-500 dark:from-amber-900 dark:to-amber-500" :
          "bg-gradient-to-r from-rose-100 to-rose-500 dark:from-rose-900 dark:to-rose-500"
        )}
        style={{ width: `${Math.min(100, Math.max(0, displayAchievementRate))}%` }}
      />

      <Handle type="target" position={targetPosition} className="w-3 h-3 !bg-[#5f6368] border-none relative z-10" />
      
      <div className="relative z-10 flex justify-between items-start mb-2">
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#8ab4f8] uppercase tracking-wider">{data.businessUnit}</span>
            {data.linkedSource && (
              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 flex items-center gap-0.5" title="他プロジェクトから同期中の指標">
                <Link2 size={10} /> LINKED
              </span>
            )}
            {data.warning && (
              <span className="text-[9px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 animate-pulse" title={data.warning}>
                ⚠️ 数式リセット
              </span>
            )}
            {data.type === 'KGI' ? (
              <span className="text-[9px] bg-[#c58af9]/20 text-[#c58af9] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">Goal & KGI</span>
            ) : level === 1 ? (
              <span className="text-[9px] bg-[#fbbc04]/20 text-[#fbbc04] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">KSF & KPI</span>
            ) : (
              <span className="text-[9px] bg-[#8ab4f8]/20 text-[#8ab4f8] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">Process & KPI</span>
            )}
          </div>
          
          <div className="flex flex-col gap-2.5">
            {/* 定性（Goal/KSF）部分 */}
            {(data.qualitativeName || data.type === 'KGI') && (
              <div>
                <p className={cn(
                  "text-[10px] font-bold mb-0.5 flex items-center gap-1",
                  data.isKsf ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-[#9aa0a6]"
                )}>
                  <Target size={10} /> 
                  {data.isKsf ? "Key Success Factor" : getQualitativeLabel()}
                  {data.isKsf && <Sparkles size={10} className="text-amber-500 animate-pulse ml-0.5" />}
                </p>
                <p className={cn(
                  "font-bold text-[14px] leading-tight break-words",
                  data.isKsf ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-[#e8eaed]"
                )}>
                  {(data.qualitativeName || '未設定').replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
                </p>
              </div>
            )}
            
            {/* 定量（KGI/KPI）部分 */}
            <div>
              <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-bold mb-0.5 flex items-center gap-1">{data.type === 'KGI' ? <><BarChart2 size={10} /> KGI (定量指標)</> : <><BarChart2 size={10} /> KPI (定量指標)</>}</p>
              <p className="font-bold text-slate-800 dark:text-[#e8eaed] text-[13px] leading-tight break-words">{data.name}</p>
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
        <div className="flex justify-between text-[12px] items-center">
          <span className={cn(
            "flex items-center gap-1",
            isPredictionMode ? "text-[#8ab4f8] font-medium" : "text-slate-500 dark:text-[#9aa0a6]"
          )}>
            {isPredictionMode && <Sparkles size={12} />}
            {isPast && !isPredictionMode && <History size={12} />}
            {data.isCalculated && <span title="自動計算項目"><Calculator size={12} className="text-primary-500" /></span>}
            {displayLabel}
          </span>
          <span className={cn(
            "font-medium",
            isPredictionMode ? "text-slate-800 dark:text-[#e8eaed]" : "text-slate-900 dark:text-[#f1f3f4]"
          )}>
            {displayActual.toLocaleString()} {data.unit}
            {data.linkedSource && <span title="他プロジェクトと同期されています"><Link2 size={10} className="inline ml-1 text-slate-400" /></span>}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-slate-500 dark:text-[#9aa0a6]">目標</span>
          <span className="text-slate-500 dark:text-[#9aa0a6]">{displayTarget.toLocaleString()} {data.unit}</span>
        </div>

        {readableFormula && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-[#5f6368]/50">
            <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] bg-slate-50 dark:bg-[#202124] p-1.5 rounded border border-slate-100 dark:border-slate-700/50 break-words">
              <div className="flex items-center gap-1 mb-0.5 text-primary-600 dark:text-primary-400 font-bold">
                <Calculator size={10} /> 計算式
              </div>
              <div className="font-mono leading-tight text-[9px] text-slate-700 dark:text-slate-300">
                = {readableFormula}
              </div>
            </div>
          </div>
        )}
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
