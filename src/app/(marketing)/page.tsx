"use client";

import Link from 'next/link';
import { 
  Terminal, 
  BrainCircuit, 
  CheckCircle2, 
  Zap,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Database,
  Network
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import { MarketingHeader } from '@/components/layout/MarketingHeader';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-strategic-teal/30 overflow-x-hidden">
      
      {/* Header */}
      <MarketingHeader />

      {/* 1. Hero Section - Majestic US Tech Style */}
      <section className="relative pt-40 pb-32 md:pt-56 md:pb-48 overflow-hidden">
        {/* Divine Aurora Background */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-strategic-teal/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[20%] left-1/4 w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#111] border border-slate-800 rounded-full text-slate-300 text-xs font-bold font-mono tracking-[0.2em] mb-8 shadow-sm"
          >
            THE NEW GLOBAL STANDARD
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-[85px] font-black tracking-tighter mb-8 leading-[1.05] font-sans text-white"
          >
            The End of Management.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-strategic-teal to-blue-500">The Era of Execution.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-sans font-medium"
          >
            「管理」は終わった。すでに世界の最前線では、ダッシュボードを眺めるだけの時代は終わりました。<br className="hidden md:block" />
            あなたの会社の理念を理解し、Google Workspaceを直接操作し、マーケティングの実務を全自動で完遂する。<br className="hidden md:block" />
            次世代のAgentic Platformが、ついに日本へ。
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-200 text-[#050505] rounded-sm font-bold text-sm tracking-[0.15em] transition-all flex items-center justify-center gap-3 font-mono"
            >
              DEPLOY AGENT <ChevronRight size={18} />
            </Link>
            <Link 
              href="#architecture"
              className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/5 text-white border border-slate-700 rounded-sm font-bold text-sm tracking-[0.15em] transition-all flex items-center justify-center gap-3 font-mono"
            >
              VIEW ARCHITECTURE
            </Link>
          </motion.div>

          {/* Social Proof - King Vibe */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-24 pt-12 border-t border-slate-800/50"
          >
            <p className="text-xs font-bold text-slate-500 tracking-[0.3em] mb-8 font-mono uppercase">Built exclusively on</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
              {/* Google Vertex AI Typography treatment */}
              <div className="flex items-center gap-3">
                <Database className="text-blue-500" size={28} />
                <span className="font-sans font-bold text-2xl tracking-tight text-white">Google Cloud</span>
              </div>
              <div className="flex items-center gap-3">
                <BrainCircuit className="text-strategic-teal" size={28} />
                <span className="font-sans font-black text-2xl tracking-tighter text-white">Vertex AI</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cinematic UI Reveal (Divine/Cyberpunk) */}
        {mounted && (
          <div className="mt-32 container mx-auto px-6 relative z-10 hidden md:block">
            <div className="relative mx-auto max-w-6xl">
              {/* Glow behind the UI */}
              <div className="absolute inset-0 bg-strategic-teal/20 blur-[100px] rounded-full"></div>
              
              <div className="rounded-xl border border-slate-800 bg-[#0a0a0a] shadow-2xl relative z-10 overflow-hidden ring-1 ring-white/10 transform perspective-1000 rotate-x-12 scale-105 transition-transform duration-1000 hover:rotate-0 hover:scale-100">
                {/* Simulated UI Header */}
                <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-[#111]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  </div>
                  <div className="mx-auto font-mono text-[10px] text-slate-500 tracking-widest">HHR-AGENT // WORKSPACE</div>
                </div>
                
                {/* Simulated Agentic Terminal inside the UI */}
                <div className="h-[500px] flex">
                  {/* Left Sidebar */}
                  <div className="w-64 border-r border-slate-800 p-6 bg-[#0a0a0a]">
                    <div className="w-3/4 h-3 bg-slate-800 rounded mb-8"></div>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full h-8 bg-slate-900 rounded border border-slate-800/50"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main Canvas - Dark Mode with Aurora */}
                  <div className="flex-1 relative bg-[#050505] p-8 overflow-hidden bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-90">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] z-0"></div>
                    
                    {/* Simulated Zap Execution */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0a] border border-strategic-teal/30 shadow-[0_0_50px_rgba(45,212,191,0.1)] rounded-lg p-6 z-10">
                      <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
                        <Zap size={20} className="text-yellow-400" />
                        <h3 className="font-mono text-sm text-white tracking-widest">AUTONOMOUS EXECUTION</h3>
                      </div>
                      <div className="font-mono text-[11px] text-strategic-teal space-y-2">
                        <p>{'>'} Authenticating with Google Workspace API... [OK]</p>
                        <p>{'>'} Accessing Calendar & Docs...</p>
                        <p>{'>'} Generating Q3 Marketing Strategy based on Manifesto...</p>
                        <p className="animate-pulse">_</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Features Section - The Agentic Shift */}
      <section className="py-32 bg-[#050505] border-t border-slate-800 relative z-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-24">
            <h2 className="text-sm font-bold tracking-[0.3em] text-strategic-teal mb-4 font-mono uppercase">Agentic Architecture</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              SaaSはツールから、<br />あなたの「部下」になる。
            </h3>
          </div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                  <BrainCircuit className="text-white" size={24} />
                </div>
                <h4 className="text-3xl font-bold text-white mb-6 tracking-tight">Soulful AI Coach.<br />魂を持った戦略パートナー。</h4>
                <p className="text-slate-400 leading-relaxed mb-6 font-sans">
                  システムに数字を入れるだけの時代は終わりました。あなたの会社の「経営理念（MVV）」と「現在の作戦（Manifesto）」を事前にAIにインストール。
                  <br /><br />
                  ただ数字を上げるための無機質な提案ではなく、「御社の理念に沿うなら、このアプローチですよね」と、熱意と共感を持って壁打ちに付き合う「右腕」が誕生します。
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-slate-800 p-8 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-strategic-teal"></div>
                <div className="font-mono text-xs text-slate-500 mb-4 tracking-widest uppercase">System Prompt Override</div>
                <div className="bg-[#111] p-4 font-mono text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                  <span className="text-purple-400">const</span> <span className="text-blue-400">systemPrompt</span> = `<br />
                  あなたは当社の最高戦略責任者です。<br />
                  <span className="text-strategic-teal">{"${projectInfo.mvv}"}</span> に反する提案は絶対にしないでください。<br />
                  現在のマニフェスト <span className="text-strategic-teal">{"${projectInfo.manifesto}"}</span> に基づき、<br />
                  熱意を持って現場をコーチングしてください。`
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative">
                <div className="absolute -inset-4 bg-strategic-teal/10 blur-2xl rounded-full"></div>
                <div className="bg-[#0a0a0a] border border-slate-800 p-8 rounded-lg relative z-10 flex flex-col items-center justify-center h-[300px]">
                  <div className="relative group cursor-pointer">
                    <div className="absolute -inset-2 bg-yellow-400/20 blur-md rounded-full group-hover:bg-yellow-400/40 transition-all"></div>
                    <button className="relative bg-[#111] border border-slate-700 hover:border-yellow-400 p-4 rounded-xl flex items-center justify-center gap-3 transition-colors">
                      <Zap className="text-yellow-400" size={32} />
                      <span className="font-mono font-bold text-white tracking-widest text-sm">EXECUTE VIA AI</span>
                    </button>
                  </div>
                  <p className="mt-8 font-mono text-xs text-slate-500 tracking-widest text-center">Click to bypass human execution</p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                  <Terminal className="text-white" size={24} />
                </div>
                <h4 className="text-3xl font-bold text-white mb-6 tracking-tight">Agentic Execution.<br />自律実行モード。</h4>
                <p className="text-slate-400 leading-relaxed mb-6 font-sans">
                  最大の差別化要因。チャットで「〇〇をすべき」というToDoが出た後、あなたが画面外で作業する必要はありません。
                  <br /><br />
                  タスク横の「⚡️（Zap）ボタン」を押すだけで、AIエージェントが自律的にGoogle Workspace（カレンダーやドキュメント）を操作し、実務を完遂させます。
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div id="architecture" className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <h4 className="text-3xl font-bold text-white mb-6 tracking-tight">All-Google Ecosystem.<br />鉄壁のセキュリティ。</h4>
                <p className="text-slate-400 leading-relaxed mb-6 font-sans">
                  複数の外部APIを組み合わせる情報漏洩リスクを完全に排除。<br />
                  頭脳（Gemini）、画像（Imagen 3）、動画（Veo）、音声（Journey Voice）のすべてをエンタープライズ向けの**Google Vertex AI**に一本化。
                  <br /><br />
                  お客様の機密データがAIの学習に使われることは一切なく、エンタープライズ水準の極めて高いセキュリティで自律型マーケティング環境を提供します。
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-slate-800 p-8 rounded-lg relative">
                <div className="space-y-4">
                  {[
                    { label: "LLM Engine", value: "Vertex AI: Gemini 1.5 Pro" },
                    { label: "Image Gen", value: "Vertex AI: Imagen 3" },
                    { label: "Video Gen", value: "Vertex AI: Veo" },
                    { label: "Voice TTS", value: "Cloud TTS: Journey" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <span className="font-mono text-xs text-slate-500 tracking-widest">{item.label}</span>
                      <span className="font-sans font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-4 flex items-center gap-2 text-emerald-400 font-mono text-[10px] tracking-widest">
                    <CheckCircle2 size={12} /> ENTERPRISE DATA PRIVACY ENABLED
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#111] border-t border-slate-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-[0.02] [background-size:24px_24px]"></div>
        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
            Stop Managing. Start Executing.
          </h2>
          <p className="text-xl text-slate-400 mb-12 font-sans">
            あなたの会社の戦略を、今日から「動くエージェント」に変えませんか？
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/login"
              className="px-10 py-5 bg-white hover:bg-slate-200 text-[#050505] rounded-sm font-bold text-sm tracking-[0.15em] transition-all flex items-center gap-3 font-mono"
            >
              REQUEST DEMO <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-[#050505] border-t border-slate-800 text-center text-slate-600 text-xs font-mono tracking-widest uppercase">
        <div className="flex items-center justify-center gap-2 font-bold mb-4">
          <Network className="w-4 h-4" />
          HHR-AGENT PLATFORM
        </div>
        <div className="flex items-center justify-center gap-6 mb-6">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">プライバシーポリシー</Link>
        </div>
        <p>© 2026 HHR-AGENT. BUILT FOR THE FUTURE.</p>
      </footer>

    </div>
  );
}
