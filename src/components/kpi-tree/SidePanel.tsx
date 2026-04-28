"use client";

import { useState } from 'react';
import { SimulationPanel } from './SimulationPanel';
import { ActionPanel } from './ActionPanel';
import { LayoutDashboard, CheckSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const SidePanel = () => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'action'>('action');

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('simulation')}
          className={cn(
            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
            activeTab === 'simulation' ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <LayoutDashboard size={16} />
          シミュレーション
        </button>
        <button
          onClick={() => setActiveTab('action')}
          className={cn(
            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
            activeTab === 'action' ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <CheckSquare size={16} />
          改善アクション
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'simulation' ? (
          <div className="h-full overflow-y-auto">
            {/* SimulationPanelは元々パディングを持っているが、SidePanel内で扱いやすくするためにスタイルを調整が必要かもしれない */}
            <SimulationPanel />
          </div>
        ) : (
          <div className="h-full p-4 overflow-y-auto">
            <ActionPanel />
          </div>
        )}
      </div>
    </div>
  );
};
