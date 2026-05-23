"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

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
  color: string;
}

export const InteractiveParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

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

    // プレミアムなパーティクルカラーパレット
    const colors = isDark 
      ? ['rgba(255,255,255,0.8)', 'rgba(147,197,253,0.6)', 'rgba(196,181,253,0.5)', 'rgba(96,165,250,0.7)'] 
      : ['rgba(30,58,138,0.6)', 'rgba(59,130,246,0.5)', 'rgba(139,92,246,0.4)', 'rgba(14,165,233,0.5)'];

    const initParticles = () => {
      particles = [];
      // パーティクルの数を画面サイズに合わせて適切に設定（多すぎず、少なすぎず）
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 8000); 
      
      for (let i = 0; i < numberOfParticles; i++) {
        // 画面全体に散らすが、少し波を打つような初期配置
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        // Z軸（奥行き）をシミュレート。0.1(奥) 〜 1.0(手前)
        const z = Math.random() * 0.9 + 0.1;
        
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: (Math.random() * 2 + 0.5) * z, // 手前のものほど大きい
          alpha: z * 0.8, // 手前のものほどくっきり
          angle: Math.random() * Math.PI * 2,
          speed: (Math.random() * 0.2 + 0.05) * z, // 手前のものほど速く漂う
          color: colors[Math.floor(Math.random() * colors.length)],
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
      // 残像効果（Trailing effect）で流体のような滑らかさを演出
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      time += 0.005;

      particles.forEach((p) => {
        // --- 1. 自然な漂い（Perlin Noise風の波） ---
        // 時間経過と自身の座標に基づいた波の動き
        const waveX = Math.sin(time + p.baseY * 0.005) * 0.5;
        const waveY = Math.cos(time + p.baseX * 0.005) * 0.5;
        
        p.x += Math.cos(p.angle) * p.speed + waveX;
        p.y += Math.sin(p.angle) * p.speed + waveY;
        p.angle += 0.01;

        // --- 2. マウスインタラクション（流体的な反発と引力） ---
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          // マウスとの距離に応じた力の強さ
          const force = (mouse.radius - distance) / mouse.radius;
          const angleToMouse = Math.atan2(dy, dx);
          
          if (mouse.isMoving) {
            // マウスが動いている時は、水をかき分けるように「反発（斥力）」する
            p.vx -= Math.cos(angleToMouse) * force * 1.5;
            p.vy -= Math.sin(angleToMouse) * force * 1.5;
          } else {
            // マウスが止まっている時は、ゆっくりと「集まる（引力）」
            // ただし中心には近づきすぎないように渦を巻く
            p.vx += Math.cos(angleToMouse + Math.PI/4) * force * 0.5;
            p.vy += Math.sin(angleToMouse + Math.PI/4) * force * 0.5;
          }
        }

        // --- 3. ホームポジションへの緩やかな回帰 ---
        // 画面外に出たり、離れすぎたらゆっくり元の位置に戻る
        const distToBaseX = p.baseX - p.x;
        const distToBaseY = p.baseY - p.y;
        p.vx += distToBaseX * 0.0005;
        p.vy += distToBaseY * 0.0005;

        // --- 4. 摩擦（減衰）と位置更新 ---
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        // 画面端のループ処理（シームレスな移動）
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // --- 5. 描画 ---
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // マウスの近くの粒子は少し明るく輝く
        const glow = distance < mouse.radius ? (1 - distance/mouse.radius) * 0.5 : 0;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.alpha + glow);
        ctx.fill();
        ctx.globalAlpha = 1.0;
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
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen dark:mix-blend-color-dodge"
    />
  );
};
