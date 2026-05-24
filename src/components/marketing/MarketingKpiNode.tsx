"use client";

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { LucideIcon } from 'lucide-react';

interface MarketingNodeProps {
  data: {
    type: string;
    title: string;
    subtitle?: string;
    description?: string;
    icon?: LucideIcon;
    color?: string;
  };
  targetPosition?: Position;
  sourcePosition?: Position;
}

export const MarketingKpiNode = memo(({ data, targetPosition = Position.Left, sourcePosition = Position.Right }: MarketingNodeProps) => {
  const Icon = data.icon;
  const isKgi = data.type === 'kgi';
  
  return (
    <div className={`
      relative w-[340px] rounded-2xl overflow-hidden
      bg-white/40 dark:bg-black/40 backdrop-blur-2xl
      border border-white/50 dark:border-white/10
      shadow-2xl hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]
      transition-all duration-300
    `}>
      <Handle type="target" position={targetPosition} className="w-3 h-3 bg-slate-300 dark:bg-slate-600 !border-2 !border-white dark:!border-black" />
      
      {/* 煌めくアクセントライン */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${data.color || 'bg-strategic-teal'}`} />
      
      {isKgi && (
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
           {Icon && <Icon size={120} />}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${data.color?.replace('bg-', 'bg-').replace('500', '100 dark:bg-opacity-20') || 'bg-strategic-teal/10'} flex items-center justify-center`}>
            {Icon && <Icon size={20} className={`${data.color?.replace('bg-', 'text-') || 'text-strategic-teal'}`} />}
          </div>
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
              {data.type}
            </div>
            <h3 className={`font-black tracking-tight ${isKgi ? 'text-4xl text-slate-900 dark:text-white' : 'text-xl text-slate-800 dark:text-slate-100'}`}>
              {data.title}
            </h3>
          </div>
        </div>
        
        {data.subtitle && (
          <div className="mb-2 font-bold text-[13px] text-strategic-teal dark:text-[#8ab4f8]">
            {data.subtitle}
          </div>
        )}
        
        {data.description && (
          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {data.description}
          </p>
        )}
      </div>

      <Handle type="source" position={sourcePosition} className="w-3 h-3 bg-slate-300 dark:bg-slate-600 !border-2 !border-white dark:!border-black" />
    </div>
  );
});

MarketingKpiNode.displayName = 'MarketingKpiNode';
