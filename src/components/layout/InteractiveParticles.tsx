"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useKpiStore } from '@/store/useKpiStore';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  angle: number;
  speed: number;
  colorType: number; // 0-3のインデックスで基本色を保持
}

interface InteractiveParticlesProps {
  kpiStatus?: 'good' | 'warning' | 'danger' | 'unassigned';
}

export const InteractiveParticles = ({ kpiStatus }: InteractiveParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const { currentPeriod } = useKpiStore();
  const prevPeriodRef = useRef(currentPeriod);
  
  // ワープエフェクトの状態管理（0〜1、1が最大ワープ）
  const warpStrengthRef = useRef(0);
  const warpDirectionRef = useRef(1); // 1 = 画面手前へ迫る（ミクロへ）、-1 = 画面奥へ引っ込む（マクロへ）

  useEffect(() => {
    // 期間が変更された時にワープエフェクトをトリガー
    if (prevPeriodRef.current !== currentPeriod) {
      // 年間(year)は奥、今日(today)は手前、その他は中間の深さ
      const getDepth = (p: string) => p === 'year' ? 0 : p === 'today' ? 2 : 1;
      const prevDepth = getDepth(prevPeriodRef.current);
      const currentDepth = getDepth(currentPeriod);
      
      warpDirectionRef.current = currentDepth > prevDepth ? 1 : -1;
      warpStrengthRef.current = 1.0; // ワープ開始
      
      prevPeriodRef.current = currentPeriod;
    }
  }, [currentPeriod]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000, radius: 300, isMoving: false };
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';

    // プレミアムなパーティクルカラーパレット（基本テーマ用）
    const baseColors = isDark 
      ? ['255,255,255', '147,197,253', '196,181,253', '96,165,250'] 
      : ['30,58,138', '59,130,246', '139,92,246', '14,165,233'];

    // ステータスごとのカラー（光らせるためのRGB）
    const statusColors = {
      good: ['52, 211, 153', '16, 185, 129', '6, 95, 70'], // Emerald
      warning: ['251, 191, 36', '245, 158, 11', '180, 83, 9'], // Amber
      danger: ['244, 63, 94', '225, 29, 72', '159, 18, 57'], // Rose
    };

    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 8000); 
      
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const z = Math.random() * 0.9 + 0.1;
        
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: (Math.random() * 2.5 + 0.5) * z,
          alpha: z * 0.8,
          angle: Math.random() * Math.PI * 2,
          speed: (Math.random() * 0.3 + 0.05) * z,
          colorType: Math.floor(Math.random() * 4),
        });
      }
    };

    let mouseTimeout: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isMoving = true;
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouse.isMoving = false;
      }, 100);
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isMoving = false;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 0.005;

      particles.forEach((p) => {
        // --- 気候（KPIステータス）による重力の計算 ---
        let gravityY = 0;
        let activeColorArray = baseColors;
        
        if (kpiStatus === 'good') {
          gravityY = -0.5 * p.speed; // 上昇気流
          activeColorArray = statusColors.good;
        } else if (kpiStatus === 'danger') {
          gravityY = 1.0 * p.speed; // 強い下降気流（火の粉）
          activeColorArray = statusColors.danger;
        } else if (kpiStatus === 'warning') {
          gravityY = 0; // 停滞
          activeColorArray = statusColors.warning;
        }

        // パーティクルの個別色を決定
        const colorRgb = activeColorArray[p.colorType % activeColorArray.length];

        const waveX = Math.sin(time + p.baseY * 0.005) * 0.5;
        const waveY = Math.cos(time + p.baseX * 0.005) * 0.5;
        
        p.x += Math.cos(p.angle) * p.speed + waveX;
        p.y += Math.sin(p.angle) * p.speed + waveY + gravityY;
        p.angle += 0.01;

        // --- ワープ効果（期間変更時） ---
        if (warpStrengthRef.current > 0.01) {
          const dxCenter = p.x - canvas.width / 2;
          const dyCenter = p.y - canvas.height / 2;
          const distFromCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
          
          // 中心からの距離に応じた放射状の力
          const warpForce = warpStrengthRef.current * 15 * warpDirectionRef.current * (distFromCenter / 500);
          
          p.vx += (dxCenter / distFromCenter) * warpForce;
          p.vy += (dyCenter / distFromCenter) * warpForce;
        }

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angleToMouse = Math.atan2(dy, dx);
          
          if (mouse.isMoving) {
            p.vx -= Math.cos(angleToMouse) * force * 1.5;
            p.vy -= Math.sin(angleToMouse) * force * 1.5;
          } else {
            // スフィア（球体）を形成するように渦を巻く
            p.vx += Math.cos(angleToMouse + Math.PI/3) * force * 1.0;
            p.vy += Math.sin(angleToMouse + Math.PI/3) * force * 1.0;
            // さらに中心に少し引き寄せる
            p.vx += Math.cos(angleToMouse) * force * 0.2;
            p.vy += Math.sin(angleToMouse) * force * 0.2;
          }
        }

        // ホームポジションへの緩やかな回帰（気候変動中は弱める）
        if (!kpiStatus) {
          const distToBaseX = p.baseX - p.x;
          const distToBaseY = p.baseY - p.y;
          p.vx += distToBaseX * 0.0002;
          p.vy += distToBaseY * 0.0002;
        }

        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        // 画面端のループ
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // ワープ強度を徐々に減衰
        warpStrengthRef.current *= 0.9;

        // 描画（個々の粒子の発光を表現）
        ctx.beginPath();
        // ワープ中は粒子が手前に引き伸ばされる表現
        const stretch = 1 + warpStrengthRef.current * 2;
        ctx.arc(p.x, p.y, p.size * (warpDirectionRef.current > 0 ? stretch : 1), 0, Math.PI * 2);
        
        // Glowエフェクト（KPI選択中やマウス周辺で強く発光）
        const glowStrength = distance < mouse.radius ? (1 - distance/mouse.radius) : (kpiStatus ? 0.5 : 0.1);
        
        // パフォーマンスを考慮し、手前の粒子のみ強くBlurをかける
        if (p.size > 1.5) {
          ctx.shadowBlur = p.size * 5 * (1 + glowStrength);
          ctx.shadowColor = `rgba(${colorRgb}, 1)`;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = `rgba(${colorRgb}, ${Math.min(1, p.alpha + glowStrength * 0.5)})`;
        ctx.fill();
        ctx.shadowBlur = 0; // 他の描画に影響しないようにリセット
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      clearTimeout(mouseTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, kpiStatus]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen dark:mix-blend-color-dodge transition-opacity duration-1000"
    />
  );
};
