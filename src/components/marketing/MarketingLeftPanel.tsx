"use client";

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Target, Network, Compass, Lightbulb, Plus } from 'lucide-react';

interface MarketingLeftPanelProps {
  activeNodeId: string | null;
  onSelectNode: (id: string | 'all') => void;
  onAddCustomGoal: (goal: string) => void;
  isVisible: boolean;
}

export const MarketingLeftPanel = ({ activeNodeId, onSelectNode, onAddCustomGoal, isVisible }: MarketingLeftPanelProps) => {
  const [customGoal, setCustomGoal] = useState('');
  const menuItems = [
    { id: 'kgi', label: 'Gnu. Core Concept', icon: Target },
    { id: 'kpi1', label: 'Goal Node Unfolder', icon: Network },
    { id: 'kpi2', label: 'Guide to Next Upgrade', icon: Compass },
    { id: 'kpi3', label: 'Goal Narrative Universe', icon: Lightbulb },
    { id: 'all', label: 'View Full Architecture', icon: Network },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
      transition={{ duration: 0.5 }}
      className={`absolute left-6 top-24 bottom-24 w-64 z-50 pointer-events-auto flex flex-col ${!isVisible && 'pointer-events-none'}`}
    >
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl shadow-2xl p-4 flex-1 flex flex-col">
        <div className="mb-6 px-2 pt-2">
          <h3 className="font-black text-slate-900 dark:text-white tracking-widest text-sm uppercase">Navigation</h3>
          <p className="text-xs text-slate-500 mt-1">Select a node to explore</p>
        </div>

        <div className="flex flex-col gap-2 mb-6">
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

        {/* Custom Goal Input */}
        <div className="mt-auto border-t border-white/40 dark:border-white/10 pt-4">
          <p className="text-[10px] font-bold text-slate-500 mb-2 tracking-widest">TRY IT YOURSELF</p>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (customGoal.trim()) {
                onAddCustomGoal(customGoal);
                setCustomGoal('');
              }
            }}
            className="flex items-center gap-2"
          >
            <input 
              type="text" 
              placeholder="自分の目標を追加..." 
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              className="w-full bg-white/50 dark:bg-[#111]/50 border border-white/60 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-strategic-teal"
            />
            <button 
              type="submit"
              disabled={!customGoal.trim()}
              className="p-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg disabled:opacity-50 transition-opacity"
            >
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
