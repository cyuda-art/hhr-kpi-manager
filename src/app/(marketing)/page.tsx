"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, LogIn } from 'lucide-react';
import { AmbientSky } from '@/components/layout/AmbientSky';
import { MarketingKpiTree } from '@/components/marketing/MarketingKpiTree';
import { MarketingLeftPanel } from '@/components/marketing/MarketingLeftPanel';
import { MarketingRightPanel } from '@/components/marketing/MarketingRightPanel';
import { MarketingHeroSequence } from '@/components/marketing/MarketingHeroSequence';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'tour'>('intro');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isTouring, setIsTouring] = useState(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (phase !== 'tour') return;

    setIsTouring(true);
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
        setActiveNodeId('ksf_main');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('kpi_main');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('process_main');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('process_zap');

        await wait(3500);
        if (!isTouring) return;
        setActiveNodeId('all');
        setIsTouring(false);
      } catch (e) {
        // Tour interrupted
      }
    };

    startTour();

    return () => {
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    };
  }, [phase]);

  const handleSelectNode = (id: string | 'all') => {
    setIsTouring(false); // ツアー中断
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    setActiveNodeId(id);
  };

  const handleTourEnd = () => {
    setIsTouring(false);
  };

  const handleIntroComplete = () => {
    setPhase('tour');
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="intro-sequence"
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-[100]"
          >
            <MarketingHeroSequence onComplete={handleIntroComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'tour' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            {/* 空間背景 */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <AmbientSky focusedNodeId={activeNodeId} />
            </div>
            
            {/* フローティングロゴ (左上) */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => handleSelectNode('all')}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-white/10 dark:bg-black/20 backdrop-blur-lg px-4 py-2 rounded-full border border-white/40 dark:border-white/10 shadow-lg hover:bg-white/20 dark:hover:bg-black/30 transition-all group pointer-events-auto"
            >
              <Network className="w-4 h-4 text-strategic-teal group-hover:scale-110 transition-transform" />
              <span className="font-black text-sm tracking-widest font-poppins text-slate-900 dark:text-white uppercase">
                Gnu.
              </span>
            </motion.button>

            {/* フローティングログイン (右上) */}
            <motion.a
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              href="/login"
              className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-white/10 dark:bg-black/20 backdrop-blur-lg px-4 py-2 rounded-full border border-white/40 dark:border-white/10 shadow-lg hover:bg-white/20 dark:hover:bg-black/30 transition-all pointer-events-auto text-slate-800 dark:text-slate-200"
            >
              <LogIn className="w-4 h-4" />
              <span className="font-bold text-xs tracking-widest">LOGIN</span>
            </motion.a>

            {/* キャンバス */}
            <div className="absolute inset-0 z-10">
              <MarketingKpiTree activeNodeId={activeNodeId} onTourEnd={handleTourEnd} />
            </div>

            {/* パネル */}
            <div className="pointer-events-none absolute inset-0 z-40">
              <div className="flex h-full w-full justify-between p-6 pb-20">
                <MarketingLeftPanel 
                  activeNodeId={activeNodeId} 
                  onSelectNode={handleSelectNode}
                  isVisible={!isTouring || activeNodeId === 'all'} 
                />
                
                <MarketingRightPanel 
                  isVisible={!isTouring || activeNodeId === 'all'} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 左右のパネル (Tour終了後に表示) は上部の条件付きレンダリング内に移動済み */}

    </div>
  );
}
