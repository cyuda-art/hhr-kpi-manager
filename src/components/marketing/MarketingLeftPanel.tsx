"use client";

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Target, Network, Lightbulb, BrainCircuit, Zap } from 'lucide-react';

interface MarketingLeftPanelProps {
  activeNodeId: string | null;
  onSelectNode: (id: string | 'all') => void;
  isVisible: boolean;
}

export const MarketingLeftPanel = ({ activeNodeId, onSelectNode, isVisible }: MarketingLeftPanelProps) => {
  const menuItems = [
    { id: 'kgi', label: 'The End of Management.', icon: Target },
    { id: 'ksf', label: 'Goal Narrative Universe', icon: Lightbulb },
    { id: 'kpi', label: 'Goal Node Unfolder', icon: Network },
    { id: 'process1', label: 'Soulful AI Coach', icon: BrainCircuit },
    { id: 'process2', label: 'Agentic Execution', icon: Zap },
    { id: 'all', label: 'View Full Architecture', icon: Network },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
      transition={{ duration: 0.5 }}
      className={`absolute left-6 top-24 bottom-24 w-64 z-50 pointer-events-auto flex flex-col ${!isVisible && 'pointer-events-none'}`}
    >
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 flex-1 flex flex-col">
        <div className="mb-6 px-2 pt-2">
          <h3 className="font-black text-slate-900 dark:text-white tracking-widest text-sm uppercase">Navigation</h3>
          <p className="text-xs text-slate-500 mt-1">Select a node to explore</p>
        </div>

        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNodeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectNode(item.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  isActive 
                    ? 'bg-strategic-teal text-white shadow-md' 
                    : 'hover:bg-white/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-strategic-teal'} />
                <span className="text-[11px] font-bold tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
