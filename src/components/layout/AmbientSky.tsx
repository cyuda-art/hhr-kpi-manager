"use client";

import { useEffect, useState } from "react";

export const AmbientSky = () => {
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'sunset' | 'night'>('day');
  const [orbPosition, setOrbPosition] = useState({ x: '50%', y: '10%' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateTime = () => {
      const hour = new Date().getHours();
      
      // 1. フェーズ判定
      if (hour >= 5 && hour < 10) {
        setTimeOfDay('dawn');
      } else if (hour >= 10 && hour < 16) {
        setTimeOfDay('day');
      } else if (hour >= 16 && hour < 19) {
        setTimeOfDay('sunset');
      } else {
        setTimeOfDay('night');
      }

      // 2. オーブ（太陽・月）の軌道計算（放物線）
      let progress = 0;
      if (hour >= 6 && hour < 18) {
        // 昼間の軌道（6:00〜18:00）
        progress = (hour - 6) / 12;
      } else {
        // 夜間の軌道（18:00〜翌6:00）
        const adjustedHour = hour >= 18 ? hour : hour + 24;
        progress = (adjustedHour - 18) / 12;
      }
      
      // X軸: 10% (左) から 90% (右) へ移動
      const x = `${10 + (progress * 80)}%`;
      
      // Y軸: progress=0.5 (正午/真夜中) で一番高く(10%), 0や1で低く(80%)なる放物線
      const normalizedX = (progress - 0.5) * 2; // -1 to +1
      const yPercent = 10 + (normalizedX * normalizedX * 70);
      const y = `${yPercent}%`;
      
      setOrbPosition({ x, y });
    };

    updateTime();
    // 1分ごとに更新
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  // 時間帯ごとのテーマ定義
  const themes = {
    dawn: {
      bg: "bg-gradient-to-br from-indigo-200 via-rose-100 to-amber-50 dark:from-indigo-950 dark:via-rose-950/40 dark:to-slate-900",
      orbColor: "bg-gradient-to-tr from-rose-400 to-amber-300",
      orbSize: "w-[400px] h-[400px]",
      orbBlur: "blur-[120px]",
    },
    day: {
      bg: "bg-gradient-to-b from-sky-300 via-blue-100 to-slate-50 dark:from-sky-900 dark:via-slate-900 dark:to-slate-950",
      orbColor: "bg-amber-100 dark:bg-amber-200",
      orbSize: "w-[300px] h-[300px]",
      orbBlur: "blur-[100px]",
    },
    sunset: {
      bg: "bg-gradient-to-b from-purple-400 via-rose-400 to-amber-200 dark:from-purple-950 dark:via-rose-900 dark:to-amber-950/40",
      orbColor: "bg-gradient-to-b from-orange-400 to-rose-500",
      orbSize: "w-[500px] h-[500px]",
      orbBlur: "blur-[100px]",
    },
    night: {
      bg: "bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950",
      orbColor: "bg-blue-200 dark:bg-indigo-300",
      orbSize: "w-[250px] h-[250px]",
      orbBlur: "blur-[80px]",
    }
  };

  const currentTheme = themes[timeOfDay];

  return (
    <div className={`absolute inset-0 transition-colors duration-[3000ms] ease-in-out ${currentTheme.bg} overflow-hidden pointer-events-none z-0`}>
      
      {/* 太陽 / 月 のオーブ */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${currentTheme.orbColor} ${currentTheme.orbSize} ${currentTheme.orbBlur} opacity-90 transition-all duration-[3000ms] ease-in-out`}
        style={{
          left: orbPosition.x,
          top: orbPosition.y,
        }}
      />

      {/* 夜空の星屑（夜のみ表示） */}
      <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${timeOfDay === 'night' ? 'opacity-50' : 'opacity-0'}`}>
        <div className="absolute top-[20%] left-[30%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[40%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[15%] left-[80%] w-2 h-2 bg-blue-100 rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[60%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
        <div className="absolute top-[30%] left-[15%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s' }} />
        <div className="absolute top-[70%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4.5s' }} />
      </div>

      {/* 薄いオーバーレイ（全体のトーンを落ち着かせる） */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/30" />
    </div>
  );
};
