"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AiLoadingOverlayProps {
  isVisible: boolean;
  statusText?: string;
  subText?: string;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  hue: number;

  constructor(width: number, height: number) {
    this.x = width / 2;
    this.y = height / 2;
    
    // 中央から放射状に飛ぶ角度と速度
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.size = Math.random() * 2 + 0.5;
    this.alpha = 1;
    this.life = 0;
    this.maxLife = Math.random() * 100 + 50;
    
    // シアン〜ブルー系の色相 (190〜220)
    this.hue = Math.random() * 30 + 190;
  }

  update() {
    // 外側にいくほど加速する（流線型の表現）
    this.vx *= 1.05;
    this.vy *= 1.05;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.life++;
    // 寿命に応じてフェードアウト
    this.alpha = Math.max(0, 1 - this.life / this.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
    ctx.fill();
    
    // 光彩（グロー）効果
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
    ctx.fill();
    ctx.restore();
  }
}

export const AiLoadingOverlay: React.FC<AiLoadingOverlayProps> = ({ isVisible, statusText = 'AIが処理を行っています...', subText = 'しばらくお待ちください' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Canvas アニメーションループ
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      if (!ctx || !canvas) return;
      
      // 軌跡を残すための半透明の黒塗り（残像効果）
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // Tailwindのslate-900に近い色
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // パーティクルの生成（毎フレーム数個ずつ）
      if (particles.length < 200) {
        for (let i = 0; i < 3; i++) {
          particles.push(new Particle(canvas.width, canvas.height));
        }
      }

      // パーティクルの更新と描画
      particles.forEach((p, index) => {
        p.update();
        p.draw(ctx);
        
        // 画面外に出たか寿命が尽きたら削除
        if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          particles.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }} // 濃いslate系の半透明オーバーレイ
    >
      {/* Canvasを最背面に配置 */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 前面のテキストUI */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 光るアイコン */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
          <div className="bg-slate-800 p-4 rounded-full border border-cyan-500/30 relative">
            <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* テキスト */}
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          {statusText}
        </h3>
        {subText && (
          <p className="text-sm md:text-base text-cyan-100/70 font-medium">
            {subText}
          </p>
        )}

        {/* 下部のプログレスバー的な演出 */}
        <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_1.5s_infinite_linear] -translate-x-full"></div>
        </div>
      </div>
    </div>
  );
};
