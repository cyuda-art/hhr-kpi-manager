import { Handle, Position } from '@xyflow/react';
import { KpiNodeWithComputed } from '@/types';
import { useKpiStore } from '@/store/useKpiStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface NodeProps {
  data: KpiNodeWithComputed;
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
  const isSelected = selectedNodeId === data.id;

  return (
    <div className={cn(
      "w-64 bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md",
      getStatusBorder(data.status),
      data.isSimulated && "shadow-indigo-100",
      isSelected && "ring-4 ring-indigo-400 border-indigo-400"
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-300" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{data.businessUnit}</span>
          <span className="font-bold text-slate-800 text-sm">{data.name}</span>
        </div>
        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white", getStatusBg(data.status))}>
          {data.achievementRate.toFixed(1)}%
        </div>
      </div>

      <div className="space-y-1 mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">実績</span>
          <span className="font-bold text-slate-700">{data.actualValue.toLocaleString()} {data.unit}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">目標</span>
          <span className="text-slate-500">{data.targetValue.toLocaleString()} {data.unit}</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-slate-300" />
    </div>
  );
};
