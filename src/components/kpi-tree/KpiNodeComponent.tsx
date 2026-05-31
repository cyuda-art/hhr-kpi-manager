import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { KpiNodeWithComputed } from '@/types';
import { useKpiStore } from '@/store/useKpiStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getDisplayValue, shouldScaleWithPeriod, formatDisplayValue } from '@/lib/kpi-utils';
import { ChevronDown, ChevronRight, Sparkles, History, Target, BarChart2, Calculator, Link2 } from 'lucide-react';
import { AILoadingIndicator } from '@/components/ui/AILoadingIndicator';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface NodeProps {
  data: KpiNodeWithComputed & { hasChildren?: boolean; isCollapsed?: boolean };
}

export const KpiNodeComponent = ({ data }: NodeProps) => {
  const layoutDirection = useLayoutStore((state) => state.layoutDirection);
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Right : Position.Bottom;
  const sourcePosition = isHorizontal ? Position.Left : Position.Top;
  // getStatusBorder は不要になったため削除します

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-strategic-teal text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'danger': return 'bg-red-600 text-white';
      default: return 'bg-logic-slate text-white';
    }
  };

  const getHighlightGlow = (status: string, isSelectedNode: boolean = false) => {
    if (isSelectedNode) {
      switch (status) {
        case 'good': return "ring-2 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)] z-30 scale-105 bg-white/60 dark:bg-black/50";
        case 'warning': return "ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] z-30 scale-105 bg-white/60 dark:bg-black/50";
        case 'danger': return "ring-2 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] z-30 scale-105 bg-white/60 dark:bg-black/50";
        default: return "ring-2 ring-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.4)] z-30 scale-105 bg-white/60 dark:bg-black/50";
      }
    } else {
      switch (status) {
        case 'good': return "ring-1 ring-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.2)] z-20";
        case 'warning': return "ring-1 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)] z-20";
        case 'danger': return "ring-1 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)] z-20";
        default: return "";
      }
    }
  };

  const selectedNodeId = useKpiStore((state) => state.selectedNodeId);
  const toggleNodeCollapse = useKpiStore((state) => state.toggleNodeCollapse);
  const currentPeriod = useKpiStore((state) => state.currentPeriod);
  const isSelected = selectedNodeId === data.id;

  const isQualitative = ['VISION', 'MISSION', 'MANIFESTO', 'GOAL'].includes(data.type);

  const kpiData = useKpiStore((state) => state.kpiData);
  
  const [isNew, setIsNew] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  
  useEffect(() => {
    if (data.addedAt && Date.now() - data.addedAt < 5000) {
      setIsNew(true);
      const timer = setTimeout(() => setIsNew(false), 5000 - (Date.now() - data.addedAt));
      return () => clearTimeout(timer);
    }
  }, [data.addedAt]);

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
  const isPast = false;
  const displayLabel = "実績";
  
  // 期間換算（year基準をベースとする）
  const displayActualRaw = data.actualValue;
  const displayTargetRaw = data.targetValue;

  // kpi-utilsを用いてUI表示用に換算する
  const displayActual = getDisplayValue(displayActualRaw, data, currentPeriod, 'actualValue');
  const displayTarget = getDisplayValue(displayTargetRaw, data, currentPeriod, 'targetValue');

  let displayAchievementRate = 0;
  if (displayTarget > 0) {
    if (data.name?.includes('原価率') || data.name?.includes('キャンセル率') || data.name?.includes('コスト')) {
      displayAchievementRate = displayActual === 0 ? 0 : (displayTarget / displayActual) * 100;
    } else {
      displayAchievementRate = (displayActual / displayTarget) * 100;
    }
  }
  const projectInfo = useKpiStore((state) => state.currentProjectInfo);
  const thresholds = projectInfo?.statusThresholds || { good: 100, warning: 80 };

  const displayStatus = displayAchievementRate >= thresholds.good ? 'good' : displayAchievementRate >= thresholds.warning ? 'warning' : 'danger';

  const isAlert = displayTarget > 0 && displayAchievementRate < 50;

  // 未達残債（ショートフォール）の計算
  let shortfall = 0;
  let hasShortfall = false;
  if (currentPeriod.match(/^\d{4}-\d{2}$/) && data.monthlyData) {
    let accumTarget = 0;
    let accumActual = 0;
    const sortedMonths = Object.keys(data.monthlyData).sort();
    for (const month of sortedMonths) {
      if (month < currentPeriod) { // We compare strict less than current period to see YTD debt before this month?
        // Actually, YTD shortfall includes current period, or up to previous?
        // Usually, the debt we carry over is up to the *previous* month.
        accumTarget += data.monthlyData[month].targetValue || 0;
        accumActual += data.monthlyData[month].actualValue || 0;
      }
    }
    shortfall = accumActual - accumTarget;
    // For cumulative metrics, if shortfall is negative, it's a debt.
    if (shortfall < 0 && shouldScaleWithPeriod(data)) {
      hasShortfall = true;
    }
  }

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

  const isHighlighted = (data as any).isHighlighted;
  const isDimmed = (data as any).isDimmed;
  
  const recentlyUpdatedNodes = useKpiStore((state) => state.recentlyUpdatedNodes);
  const isRecentlyUpdated = recentlyUpdatedNodes.includes(data.id);

  // コンテナスタイル
  const containerStyle = "w-[280px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] p-5 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.6)] hover:bg-white dark:hover:bg-slate-800/95";

  // Z軸の奥行き計算（期間によって深度を変える）
  const getZDepth = (depth: number) => {
    if (currentPeriod === 'year') return 'translateZ(0px)';
    if (currentPeriod === 'today') return `translateZ(${depth}px)`;
    return `translateZ(${depth / 2}px)`; // 月次やQ次
  };

  return (
    <div 
      className={cn(
        "group transition-all duration-700 ease-out relative",
        containerStyle,
        isDimmed ? "opacity-30" : "opacity-100",
        isSelected && getHighlightGlow(displayStatus, true),
        !isSelected && isHighlighted && getHighlightGlow(displayStatus, false),
        data.isKsf && "ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
        isNew && "ring-2 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] z-50 animate-pulse",
        isRecentlyUpdated && "ring-2 ring-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.4)] z-[60] animate-pulse transition-all duration-1000 scale-105"
      )}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {/* 2. 内側から溢れるステータス・オーラ（Glowing Aura） */}
      <div className={cn("absolute pointer-events-none z-0 overflow-hidden", "inset-0 rounded-2xl")}>
        <div 
          className={cn(
            "absolute transition-all duration-700 ease-in-out",
            "-inset-4 blur-2xl opacity-40 group-hover:opacity-60",
            displayStatus === 'good' ? "bg-emerald-400/20" :
            displayStatus === 'warning' ? "bg-amber-400/20" :
            "bg-rose-500/20"
          )}
        />
        {/* プログレスバーの代わりの極細の光るライン */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 h-[2px] transition-all duration-1000 ease-out opacity-80",
            displayStatus === 'good' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" :
            displayStatus === 'warning' ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" :
            "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
          )}
          style={{ width: `${Math.min(100, Math.max(0, displayAchievementRate))}%` }}
        />
      </div>

      <Handle 
        type="target" 
        position={targetPosition} 
        className={cn(
          "absolute w-5 h-5 border-none z-10 opacity-0",
          targetPosition === Position.Right 
            ? "!right-0 !top-1/2 !-translate-y-1/2" 
            : "!bottom-0 !left-1/2 !-translate-x-1/2"
        )} 
      />
      
      {/* MID & MICRO VIEW: メインコンテンツ */}
      <div 
        className="relative z-10 flex justify-between items-center mb-1 transition-all duration-700 ease-out"
        style={{ transform: getZDepth(15) }}
      >
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <p className="font-black text-oxford-navy dark:text-slate-100 text-[15px] leading-snug break-words font-sans line-clamp-2">
            {data.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {!isQualitative && (
            <div className={cn("px-2 py-1 rounded-[6px] text-[13px] font-black tracking-wide text-[#202124] shadow-sm", getStatusBg(displayStatus))}>
              {displayAchievementRate.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* MICRO VIEW のみ: 詳細な数値 */}
      {!isQualitative && (
        <div 
          className="relative z-10 mt-2 transition-all duration-700 ease-out"
          style={{ transform: getZDepth(30) }}
        >
          <div className="flex items-end gap-2 text-[12px] font-lato">
            <span className="font-black text-oxford-navy dark:text-slate-100 text-[15px]">
              {formatDisplayValue(displayActual, data.unit)}
            </span>
            <span className="text-logic-slate dark:text-slate-300/70 font-bold mb-[2px]">
              / {formatDisplayValue(displayTarget, data.unit)} <span className="text-[10px]">{data.unit}</span>
            </span>
          </div>
        </div>
      )}


      {data.hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleNodeCollapse(data.id);
          }}
          className={cn(
            "absolute w-5 h-5 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 transition-all z-20 shadow-sm",
            targetPosition === Position.Right ? "-right-2.5 top-1/2 -translate-y-1/2" : "-bottom-2.5 left-1/2 -translate-x-1/2"
          )}
        >
          {data.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (isExpanding) return;
            setIsExpanding(true);
            try {
              await useKpiStore.getState().expandKpiNode(data.id);
            } catch (err) {
              console.error(err);
            } finally {
              setIsExpanding(false);
            }
          }}
          title="AIでさらに要素分解する"
          className={cn(
            "absolute w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-strategic-teal hover:bg-strategic-teal hover:text-white hover:border-strategic-teal transition-all z-20 shadow-sm group",
            targetPosition === Position.Right ? "-right-3 top-1/2 -translate-y-1/2" : "-bottom-3 left-1/2 -translate-x-1/2"
          )}
        >
          <Sparkles size={12} className="group-hover:animate-spin" />
        </button>
      )}

      {isExpanding && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden flex items-center justify-center">
          <AILoadingIndicator 
            message="GENERATING..." 
            subMessage="下位KPIを生成中" 
            className="h-full border-none shadow-none bg-transparent dark:bg-transparent"
          />
        </div>
      )}

      <Handle 
        type="source" 
        position={sourcePosition} 
        className={cn(
          "absolute w-5 h-5 border-none z-10 opacity-0",
          sourcePosition === Position.Left 
            ? "!left-0 !top-1/2 !-translate-y-1/2" 
            : "!top-0 !left-1/2 !-translate-x-1/2"
        )} 
      />

    </div>
  );
};
