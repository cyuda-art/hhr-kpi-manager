"use client";

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AiLoadingOverlayProps {
  isVisible: boolean;
  statusText?: string;
  subText?: string;
}

export const AiLoadingOverlay: React.FC<AiLoadingOverlayProps> = ({ isVisible, statusText = 'AIが処理を行っています...', subText = 'しばらくお待ちください' }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  // マウント/アンマウントのフェードアニメーション制御
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 500); // フェードアウトの時間と合わせる
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'transparent' }} 
    >
      {/* ATLAS AI Agent風の全画面発光ボーダーと光彩とドットグリッド */}
      <div className="atlas-dot-grid"></div>
      <div className="atlas-border-glow"></div>
      <div className="atlas-inner-glow"></div>

      {/* 前面のテキストUI */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* 光るアイコン（ライト/ダーク両対応） */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary-400 dark:bg-white rounded-full blur-xl opacity-30 dark:opacity-60 animate-pulse"></div>
          <div className="bg-primary-50 dark:bg-white/10 backdrop-blur-md p-4 rounded-full border border-primary-200 dark:border-white/40 relative shadow-[0_0_15px_rgba(14,165,233,0.3)] dark:shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            <Sparkles className="w-10 h-10 text-primary-500 dark:text-white animate-pulse" />
          </div>
        </div>

        {/* テキスト */}
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-wide mb-2 drop-shadow-[0_0_10px_rgba(14,165,233,0.3)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
          {statusText}
        </h3>
        {subText && (
          <p className="text-sm md:text-base text-slate-600 dark:text-white/80 font-medium max-w-lg drop-shadow-md">
            {subText}
          </p>
        )}

        {/* ナイトライダー風プログレスバー（ライト/ダーク両対応） */}
        <div className="mt-8 w-48 h-1 bg-slate-200 dark:bg-white/20 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(14,165,233,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-primary-500 dark:via-white to-transparent animate-[shimmer_1.5s_infinite_linear] -translate-x-full"></div>
        </div>
      </div>
    </div>
  );
};
