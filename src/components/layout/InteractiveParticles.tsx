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
    let mouse = { x: -1000, y: -1000, radius: 250 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 10000); // 画面サイズに応じた密度
      
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // マウスが画面外に出たときの処理
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // パーティクルの色（ダークモードは白、ライトモードは青みがかった暗色）
      const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';
      const r = isDark ? 255 : 30;
      const g = isDark ? 255 : 64;
      const b = isDark ? 255 : 175;

      particles.forEach((p) => {
        // マウスとの距離を計算
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 引力と反発の計算
        if (distance < mouse.radius) {
          // マウスに集まる力（Attraction）
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          // マウスに近いほど力が強いが、中心部では弱める（急激な加速を防ぐ）
          const force = (mouse.radius - distance) / mouse.radius;
          
          // 引力をかける（0.05は引力の強さ）
          p.vx += forceDirectionX * force * 0.4;
          p.vy += forceDirectionY * force * 0.4;
        }

        // ホームポジションに戻ろうとする力（Spring force）
        p.vx += (p.baseX - p.x) * 0.02;
        p.vy += (p.baseY - p.y) * 0.02;

        // 摩擦（速度の減衰）
        p.vx *= 0.9;
        p.vy *= 0.9;

        // 位置の更新
        p.x += p.vx;
        p.y += p.vy;

        // ランダムな揺らぎ（漂う感じ）
        p.x += (Math.random() - 0.5) * 0.5;
        p.y += (Math.random() - 0.5) * 0.5;

        // 描画
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // マウスに近いパーティクルは少し明るくする
        const glow = distance < mouse.radius ? Math.max(0, 1 - distance / mouse.radius) * 0.5 : 0;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha + glow})`;
        ctx.fill();
      });

      // マウスの近くのパーティクル同士を線で結ぶ（星座エフェクト）
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // パーティクル同士が近く、かつマウスの近くにある場合のみ線を引く
          if (distance < 50) {
            const dxToMouse = mouse.x - particles[i].x;
            const dyToMouse = mouse.y - particles[i].y;
            const distToMouse = Math.sqrt(dxToMouse * dxToMouse + dyToMouse * dyToMouse);
            
            if (distToMouse < mouse.radius) {
              const opacity = (1 - distance / 50) * (1 - distToMouse / mouse.radius) * 0.3;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

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
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
