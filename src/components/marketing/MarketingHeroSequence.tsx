"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Target, Network, BrainCircuit, Zap } from 'lucide-react';

interface MarketingHeroSequenceProps {
  onComplete: (goal: string) => void;
}

export const MarketingHeroSequence = ({ onComplete }: MarketingHeroSequenceProps) => {
  const [goal, setGoal] = useState('');
  const [phase, setPhase] = useState<'input' | 'chaos'>('input');
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; icon: number }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || phase === 'chaos') return;

    setPhase('chaos');

    // ヌーの大群（パーティクル）を生成
    const newParticles = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 1000,
      y: (Math.random() - 0.5) * 1000,
      delay: Math.random() * 2,
      icon: Math.floor(Math.random() * 4)
    }));
    setParticles(newParticles);

    // 数秒後にカオスを終了し、結果（ツリー構築）へ遷移
    setTimeout(() => {
      onComplete(goal);
    }, 4500);
  };

  const icons = [Target, Network, BrainCircuit, Zap];

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
                x: p.x + (Math.random() > 0.5 ? 500 : -500), 
                y: p.y + (Math.random() > 0.5 ? 500 : -500),
                scale: [0, 2, 0.5],
                rotate: 360
              }}
              transition={{ 
                duration: 2 + Math.random() * 1.5, 
                delay: p.delay,
                ease: "circOut"
              }}
              className="absolute text-strategic-teal/40 dark:text-strategic-teal/20"
              style={{ left: '50%', top: '50%' }}
            >
              <Icon size={24 + Math.random() * 40} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        {/* 文字が伸びるエフェクト (Gnuuuuu...) */}
        <AnimatePresence mode="wait">
          {phase === 'input' ? (
            <motion.div
              key="input-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                その目標、今日から踏み出せる<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-strategic-teal to-blue-500">『計算式』</span>に変えよう。
              </h1>
              <p className="text-slate-400 font-medium">あなたの言葉をAIが聞き、四則演算で繋がるKPIツリーへ展開します。</p>
            </motion.div>
          ) : (
            <motion.div
              key="chaos-title"
              initial={{ scale: 1, x: 0 }}
              animate={{ 
                scale: [1, 1.2, 1.5, 2, 3],
                x: [0, -10, 10, -20, 20, 0], // 激しいシェイク
                filter: ['blur(0px)', 'blur(2px)', 'blur(4px)'],
                opacity: [1, 1, 0]
              }}
              transition={{ duration: 4, ease: "easeIn" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-strategic-teal to-purple-500 tracking-[0.5em] whitespace-nowrap"
            >
              {/* u が増殖していくように見せる */}
              <motion.span>Gnu</motion.span>
              <motion.span
                animate={{ letterSpacing: ['0em', '0.2em', '0.5em'] }}
                transition={{ duration: 3 }}
              >
                uuuuu...
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 入力フォーム */}
        <AnimatePresence>
          {phase === 'input' && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="w-full relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-strategic-teal to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="売上を2倍にしたい、チームの生産性を上げたい..."
                  className="flex-1 bg-transparent border-none text-white px-4 py-4 focus:outline-none text-lg placeholder:text-slate-600 font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className="bg-white text-black p-4 rounded-xl disabled:opacity-50 hover:bg-strategic-teal hover:text-white transition-all"
                >
                  <Send size={24} />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
