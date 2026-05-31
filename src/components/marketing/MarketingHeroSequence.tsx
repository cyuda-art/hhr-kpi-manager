"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Network, BrainCircuit, Zap, Lightbulb } from 'lucide-react';

interface MarketingHeroSequenceProps {
  onComplete: () => void;
}

type Phase = 'gnu' | 'gnuuu' | 'gnuuuuu' | 'chaos';

export const MarketingHeroSequence = ({ onComplete }: MarketingHeroSequenceProps) => {
  const [phase, setPhase] = useState<Phase>('gnu');
  const [particles, setParticles] = useState<{ 
    id: number; x: number; y: number; delay: number; icon: number;
    targetX: number; targetY: number; targetScale: number; targetRotate: number;
    duration: number; iconSize: number;
  }[]>([]);

  useEffect(() => {
    // タイムライン制御
    const timers = [
      setTimeout(() => setPhase('gnuuu'), 2000),
      setTimeout(() => setPhase('gnuuuuu'), 4000),
      setTimeout(() => {
        setPhase('chaos');
        
        // ヌーの大群（パーティクル）を生成し、ランダム値を事前計算
        const newParticles = Array.from({ length: 300 }).map((_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 1500,
          delay: Math.random() * 1.5,
          icon: Math.floor(Math.random() * 5),
          targetX: (Math.random() > 0.5 ? 800 : -800),
          targetY: (Math.random() > 0.5 ? 800 : -800),
          targetScale: Math.random() * 3 + 1,
          targetRotate: Math.random() * 720 - 360,
          duration: 2 + Math.random() * 2,
          iconSize: 16 + Math.random() * 48
        }));
        setParticles(newParticles);
      }, 5500),
      setTimeout(() => onComplete(), 8000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const icons = [Target, Network, BrainCircuit, Zap, Lightbulb];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
      
      {/* 爆発とカオス（ヌーの大群）エフェクト */}
      <AnimatePresence>
        {phase === 'chaos' && particles.map((p) => {
          const Icon = icons[p.icon];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                x: p.x + p.targetX, 
                y: p.y + p.targetY,
                scale: [0, p.targetScale, 0.5],
                rotate: p.targetRotate
              }}
              transition={{ 
                duration: p.duration, 
                delay: p.delay,
                ease: "circOut"
              }}
              className="absolute text-strategic-teal/50 dark:text-strategic-teal/30"
              style={{ left: '50%', top: '50%' }}
            >
              <Icon size={p.iconSize} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {phase === 'gnu' && (
            <motion.div
              key="gnu"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-4 tracking-tight">
                Gnu.
              </h1>
              <p className="text-xl text-strategic-teal font-medium tracking-[0.3em] uppercase">Gathering Needs & Understanding</p>
              <p className="text-slate-500 mt-4 text-sm tracking-wider">対話から、真のニーズを汲み取る。</p>
            </motion.div>
          )}

          {phase === 'gnuuu' && (
            <motion.div
              key="gnuuu"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-strategic-teal to-blue-500 mb-4 tracking-widest">
                Gnuuu.
              </h1>
              <p className="text-2xl text-blue-400 font-medium tracking-[0.3em] uppercase">Goal Node Unfolder</p>
              <p className="text-slate-400 mt-4 text-sm tracking-wider">目標を無数の行動ノードへと展開する。</p>
            </motion.div>
          )}

          {(phase === 'gnuuuuu' || phase === 'chaos') && (
            <motion.div
              key="gnuuuuu"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: phase === 'chaos' ? [1, 1.2, 1.5, 2, 4] : 1,
                opacity: phase === 'chaos' ? [1, 1, 0] : 1,
                x: phase === 'chaos' ? [0, -15, 15, -25, 25, 0] : 0, // 激しい振動
                filter: phase === 'chaos' ? ['blur(0px)', 'blur(4px)', 'blur(10px)'] : 'blur(0px)'
              }}
              transition={{ duration: phase === 'chaos' ? 2 : 0.8 }}
              className="text-center"
            >
              <h1 className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-strategic-teal via-purple-500 to-rose-500 mb-4 tracking-[0.2em]">
                Gnuuuuu...
              </h1>
              <p className="text-3xl text-purple-400 font-bold tracking-[0.4em] uppercase">Grand Nodes United</p>
              <p className="text-slate-300 mt-6 text-lg tracking-widest font-bold">すべてのノードが、一つの頂点へと収束する。</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
