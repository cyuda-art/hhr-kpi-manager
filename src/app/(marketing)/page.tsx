"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { AmbientSky } from '@/components/layout/AmbientSky';
import { MarketingKpiTree } from '@/components/marketing/MarketingKpiTree';
import { MarketingLeftPanel } from '@/components/marketing/MarketingLeftPanel';
import { MarketingRightPanel } from '@/components/marketing/MarketingRightPanel';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isTouring, setIsTouring] = useState(true);
  const [customGoal, setCustomGoal] = useState<string | null>(null);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);

    // シネマティックツアーのシーケンス
    const startTour = async () => {
      // 初期状態：KGIにフォーカス
      setActiveNodeId('kgi');
      
      const wait = (ms: number) => new Promise(resolve => {
        const timeout = setTimeout(resolve, ms);
        tourTimeoutRef.current = timeout;
      });

      try {
        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('kpi1');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('kpi2');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('kpi3');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('all');
        setIsTouring(false);
      } catch (e) {
        // Tour interrupted
      }
    };

    if (isTouring) {
      startTour();
    }

    return () => {
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    };
  }, []); // Run once on mount

  const handleSelectNode = (id: string | 'all') => {
    setIsTouring(false); // ツアー中断
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    setActiveNodeId(id);
  };

  const handleAddCustomGoal = (goal: string) => {
    setCustomGoal(goal);
    handleSelectNode('custom_goal');
  };

  const handleTourEnd = () => {
    setIsTouring(false);
  };

  return (
    <div className="min-h-screen relative font-sans selection:bg-strategic-teal/30 overflow-hidden text-slate-800 dark:text-slate-200">
      {/* 空間背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AmbientSky focusedNodeId={activeNodeId} />
      </div>
      
      <MarketingHeader />

      {/* キャンバス */}
      <div className="absolute inset-0 z-10 pt-16">
        <MarketingKpiTree activeNodeId={activeNodeId} onTourEnd={handleTourEnd} customGoal={customGoal} />
      </div>

      {/* オーバーレイ (Tour中のシネマティック帯) */}
      <AnimatePresence>
        {isTouring && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-40 pointer-events-none flex items-end justify-center pb-8"
          >
            <p className="text-white font-mono text-xs tracking-[0.3em] uppercase animate-pulse">
              System Booting... Loading Project Directives
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* スキップボタン */}
      <AnimatePresence>
        {isTouring && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleSelectNode('all')}
            className="absolute bottom-6 right-6 z-50 bg-white/20 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-[10px] font-bold tracking-widest text-slate-800 dark:text-white hover:bg-white/40 transition-colors"
          >
            SKIP TOUR 
          </motion.button>
        )}
      </AnimatePresence>

      {/* 左右のパネル (Tour終了後に表示) */}
      <MarketingLeftPanel 
        activeNodeId={activeNodeId} 
        onSelectNode={handleSelectNode} 
        onAddCustomGoal={handleAddCustomGoal}
        isVisible={!isTouring && mounted} 
      />
      
      <MarketingRightPanel 
        customGoalEvent={customGoal}
        isVisible={!isTouring && mounted} 
      />

    </div>
  );
}
