import { Handle, Position } from '@xyflow/react';
import { KpiNodeWithComputed } from '@/types';
import { useKpiStore } from '@/store/useKpiStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  const isSelected = selectedNodeId === data.id;
  const isAlert = data.targetValue > 0 && data.achievementRate < 50;

  return (
    <div className={cn(
      "w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border-2 p-4 transition-all hover:shadow-xl hover:-translate-y-1 duration-300",
      getStatusBorder(data.status),
      data.isSimulated && "shadow-primary-100 dark:shadow-none",
      isSelected && "ring-4 ring-primary-400/50 border-primary-400 dark:ring-primary-800/50 dark:border-primary-600",
      isAlert && "animate-pulse shadow-red-500/20 dark:shadow-red-900/30 border-red-400 dark:border-red-600"
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-300 dark:!bg-slate-600" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{data.businessUnit}</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{data.name}</span>
        </div>
        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white", getStatusBg(data.status))}>
          {data.achievementRate.toFixed(1)}%
        </div>
      </div>

      <div className="space-y-1 mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">実績</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{data.actualValue.toLocaleString()} {data.unit}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500">目標</span>
          <span className="text-slate-500 dark:text-slate-400">{data.targetValue.toLocaleString()} {data.unit}</span>
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
