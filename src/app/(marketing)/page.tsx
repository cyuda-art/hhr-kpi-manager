"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { AmbientSky } from '@/components/layout/AmbientSky';
import { MarketingKpiTree } from '@/components/marketing/MarketingKpiTree';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative font-sans selection:bg-strategic-teal/30 overflow-hidden text-slate-800 dark:text-slate-200">
      {/* 空間背景を常に敷き詰める */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AmbientSky />
      </div>
      
      {/* フローティングヘッダー */}
      <MarketingHeader />

      {/* インフィニティキャンバス (KPIツリー) */}
      <div className="absolute inset-0 z-10 pt-16">
        <MarketingKpiTree />
      </div>

      {/* 右下フローティング・オーバーレイ（全体ガイドやデモ案内） */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-6 right-6 z-50 pointer-events-auto"
      >
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-5 rounded-2xl shadow-2xl max-w-sm">
          <p className="text-xs font-bold tracking-[0.2em] text-strategic-teal uppercase mb-2">Interactive Canvas</p>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight">
            ドラッグして全体像を<br />探索してください
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 font-medium">
            Gnu. は目標をツリー状に展開し、AIが自律的に実行までサポートする新しい「部下」です。
          </p>
          <a 
            href="/login"
            className="w-full px-5 py-3 bg-strategic-teal hover:bg-strategic-teal/90 text-white shadow-lg rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
          >
            無料で体験する <ArrowRight size={16} />
          </a>
        </div>
      </motion.div>

      {/* 左下フローティング：フッター的要素 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-6 z-50 pointer-events-auto"
      >
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase">
          © 2026 Gnu. Platform<br/>
          Built for the era of execution.
        </div>
      </motion.div>

    </div>
  );
}
