"use client";

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { LucideIcon, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isExecuting, setIsExecuting] = useState(false);
  const Icon = data.icon;
  const isKgi = data.type === 'kgi';
  const isCtaNode = data.title === 'Join Gnu.';

  const handleZap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExecuting(true);
    if (isCtaNode) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
      return;
    }
    setTimeout(() => setIsExecuting(false), 5000);
  };
  
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
        {isCtaNode ? (
          <div className="flex items-center justify-between">
            <h3 className="font-black tracking-tight text-xl text-slate-800 dark:text-slate-100">
              {data.title}
            </h3>
            <button 
              onClick={handleZap}
              disabled={isExecuting}
              className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 ${
                isExecuting 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-white shadow-[0_0_15px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]'
              }`}
            >
              <Zap size={16} className={isExecuting ? '' : 'animate-pulse'} />
            </button>
          </div>
        ) : (
          <h3 className={`font-black tracking-tight ${isKgi ? 'text-4xl text-slate-900 dark:text-white' : 'text-xl text-slate-800 dark:text-slate-100'}`}>
            {data.title}
          </h3>
        )}
          </div>
        </div>
        
        {data.subtitle && (
          <div className="mb-2 font-bold text-[13px] text-strategic-teal dark:text-[#8ab4f8]">
            {data.subtitle}
          </div>
        )}
        
        {data.description && (
          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-2">
            {data.description}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isExecuting && !isCtaNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute -bottom-32 left-0 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">Autonomous Execution</span>
            </div>
            <div className="font-mono text-[10px] space-y-1">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-emerald-400 flex items-center gap-2">
                <ChevronRight size={10} /> Authenticating via OAuth2... [OK]
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-emerald-400 flex items-center gap-2">
                <ChevronRight size={10} /> Generating Google Slide Deck...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="text-slate-400 flex items-center gap-2">
                <ChevronRight size={10} /> Inserting KPI charts...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="text-slate-400 flex items-center gap-2">
                <ChevronRight size={10} /> Task completed successfully.
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={sourcePosition} className="w-3 h-3 bg-slate-300 dark:bg-slate-600 !border-2 !border-white dark:!border-black" />
    </div>
  );
});

MarketingKpiNode.displayName = 'MarketingKpiNode';
