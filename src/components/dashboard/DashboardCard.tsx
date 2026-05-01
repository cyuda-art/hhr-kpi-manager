import { KpiNodeWithComputed } from '@/types';
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  kpi: KpiNodeWithComputed;
  onClick?: () => void;
}

export const DashboardCard = ({ kpi, onClick }: Props) => {
  const isUp = kpi.actualValue >= kpi.previousValue;
  const isNeutral = kpi.actualValue === kpi.previousValue;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'warning': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'danger': return 'text-rose-500 bg-rose-50 border-rose-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
        onClick && "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500",
        kpi.isSimulated ? "border-indigo-300 shadow-indigo-100 dark:border-indigo-500 dark:shadow-none" : "border-slate-200 dark:border-slate-800"
      )}
    >
      {kpi.isSimulated && (
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={10} />
          Simulated
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{kpi.name}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {kpi.actualValue.toLocaleString()}
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">{kpi.unit}</span>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1", getStatusColor(kpi.status))}>
          {kpi.achievementRate.toFixed(1)}% 達成
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>目標: {kpi.targetValue.toLocaleString()} {kpi.unit}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", getProgressColor(kpi.status))}
            style={{ width: `${Math.min(kpi.achievementRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className={cn(
          "flex items-center font-medium",
          isUp ? "text-emerald-500" : isNeutral ? "text-slate-400" : "text-rose-500"
        )}>
          {isUp ? <ArrowUpRight size={16} className="mr-1" /> : isNeutral ? <Minus size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {Math.abs(kpi.actualValue - kpi.previousValue).toLocaleString()} {kpi.unit}
        </span>
        <span className="text-slate-400 text-xs">前月比</span>
      </div>
    </div>
  );
};
