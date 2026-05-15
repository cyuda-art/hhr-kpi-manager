"use client";

import Link from 'next/link';
import { 
  Network, 
  Target, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ListChecks,
  ChevronRight,
  Zap,
  Calculator,
  TrendingUp,
  Clock,
  Database,
  X,
  FileText,
  Sparkles,
  Download,
  Telescope,
  Diamond
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'input' | 'loading' | 'success'>('input');
  const [businessModel, setBusinessModel] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity1 = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-clean-canvas dark:bg-[#000a1f] text-oxford-navy dark:text-slate-200 font-sans selection:bg-strategic-teal/30 overflow-x-hidden">
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#001133]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-widest font-poppins text-oxford-navy dark:text-white uppercase">
            <Network className="w-5 h-5 text-strategic-teal" />
            LogicTree Pro
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-bold font-poppins text-logic-slate dark:text-slate-300 hover:text-oxford-navy dark:hover:text-white transition-colors hidden md:block">
              LOG IN
            </Link>
            <Link href="/login" className="text-xs font-bold font-poppins tracking-wider bg-oxford-navy dark:bg-white text-white dark:text-oxford-navy hover:bg-strategic-teal dark:hover:bg-slate-200 px-6 py-2.5 rounded-sm transition-all shadow-sm">
              FREE TRIAL
            </Link>
          </div>
        </div>
      </motion.header>

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
        {/* Minimal Grid Background */}
        <motion.div style={{ y: y1, opacity: opacity1 }} className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></motion.div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white dark:from-[#001133] to-transparent z-0"></div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-strategic-teal text-xs font-bold font-poppins tracking-widest mb-8 shadow-sm"
          >
            NEXT-GEN KPI MANAGEMENT
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.15] font-poppins text-oxford-navy dark:text-white"
          >
            過去を測る管理から、<br />未来を創る経営へ。<br />
            <span className="text-strategic-teal font-serif italic font-normal tracking-normal mt-2 inline-block">
              "AI-Driven" KPI Cockpit
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg text-logic-slate dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-lato"
          >
            表計算ツールによる緻密な実績管理は、次なる成長への確かな土台です。<br />
            本システムはそこから一歩踏み出し、AIによる「未来の軌道修正」を提供します。<br />
            10秒での戦略ツリー生成から、未達を防ぐシミュレーションまで。<br />目標と現在地を直結させる次世代の経営コックピットをご体験ください。
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-oxford-navy dark:bg-strategic-teal hover:bg-strategic-teal dark:hover:bg-strategic-teal/80 text-white rounded-sm font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center gap-3">
                14日間 無料トライアルを開始
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <button 
              onClick={() => {
                setModalStep('input');
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#001133] hover:bg-slate-50 dark:hover:bg-[#001a4d] text-oxford-navy dark:text-white border border-slate-200 dark:border-slate-700 rounded-sm font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              エクセルとの比較資料DL
            </button>
          </motion.div>
        </div>

        {/* Dynamic Interactive Dashboard Mockup Preview */}
        {mounted && (
          <div className="mt-24 container mx-auto px-6 relative z-10 hidden md:block anim-pop" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <div className="relative mx-auto max-w-5xl anim-float shadow-2xl">
              <div className="rounded-t-lg border-x border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#001133] p-1.5 relative z-10">
                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-clean-canvas dark:bg-[#000a1f] h-[450px] flex overflow-hidden">
                  
                  {/* Left Sidebar Mock */}
                  <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#001133] p-5">
                    <div className="w-2/3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm mb-8"></div>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full h-8 bg-clean-canvas dark:bg-slate-800/50 rounded-sm border border-slate-100 dark:border-slate-700/50"></div>
                      ))}
                    </div>
                  </div>

                  {/* Center Main Tree Canvas */}
                  <div className="flex-1 relative overflow-hidden bg-clean-canvas dark:bg-[#000a1f] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
                    
                    {/* Node 1: KGI (Top) */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-strategic-teal p-4 z-10 anim-pop overflow-hidden" style={{ animationDelay: '1s', opacity: 0 }}>
                      <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-0 left-0 h-full opacity-10 bg-gradient-to-r from-strategic-teal to-strategic-teal/60 anim-progress"></div>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-2 font-poppins">
                          <span className="text-[9px] font-bold text-strategic-teal uppercase tracking-widest">COMPANY</span>
                          <span className="text-[8px] bg-logic-slate/5 text-logic-slate px-1.5 py-0.5 rounded-[2px] font-bold tracking-wider">GOAL / KGI</span>
                        </div>
                        <div className="font-bold text-[13px] text-oxford-navy dark:text-white mb-2">全社売上高</div>
                        <div className="flex justify-between items-end font-lato">
                          <div className="text-xl font-black text-oxford-navy dark:text-white">¥ 1,250,000</div>
                        </div>
                      </div>
                    </div>

                    {/* Vertical Line from KGI */}
                    <div className="absolute top-[140px] left-1/2 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-600 anim-line-v" style={{ animationDelay: '1.4s', opacity: 0, '--final-height': '40px' } as React.CSSProperties}></div>
                    
                    {/* Horizontal Line Split */}
                    <div className="absolute top-[180px] left-[calc(50%-120px)] h-px bg-slate-300 dark:bg-slate-600 anim-line-h" style={{ animationDelay: '1.7s', opacity: 0, '--final-width': '240px' } as React.CSSProperties}></div>

                    {/* Left vertical drop */}
                    <div className="absolute top-[180px] left-[calc(50%-120px)] w-px bg-slate-300 dark:bg-slate-600 anim-line-v" style={{ animationDelay: '2.0s', opacity: 0, '--final-height': '40px' } as React.CSSProperties}></div>
                    {/* Right vertical drop */}
                    <div className="absolute top-[180px] left-[calc(50%+120px)] w-px bg-slate-300 dark:bg-slate-600 anim-line-v" style={{ animationDelay: '2.0s', opacity: 0, '--final-height': '40px' } as React.CSSProperties}></div>

                    {/* Node 2: KPI Left */}
                    <div className="absolute top-[220px] left-[calc(50%-120px)] -translate-x-1/2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4 z-10 anim-pop overflow-hidden" style={{ animationDelay: '2.4s', opacity: 0 }}>
                      <div className="flex items-center gap-1.5 mb-2 font-poppins">
                        <span className="text-[9px] font-bold text-strategic-teal uppercase tracking-widest">HOTEL</span>
                        <span className="text-[8px] bg-logic-slate/5 text-logic-slate px-1.5 py-0.5 rounded-[2px] font-bold tracking-wider">PROCESS / KPI</span>
                      </div>
                      <div className="font-bold text-[12px] text-oxford-navy dark:text-slate-200 mb-2">宿泊事業売上</div>
                      <div className="text-lg font-black text-oxford-navy dark:text-white font-lato">¥ 800,000</div>
                    </div>

                    {/* Node 3: KPI Right (Alert) */}
                    <div className="absolute top-[220px] left-[calc(50%+120px)] -translate-x-1/2 w-56 bg-red-50/50 dark:bg-red-900/10 border border-red-600/60 rounded-lg shadow-sm p-4 z-10 anim-pop overflow-hidden" style={{ animationDelay: '2.6s', opacity: 0 }}>
                       <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-0 left-0 h-full opacity-10 bg-gradient-to-r from-red-600 to-red-400 w-[40%]"></div>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-2 font-poppins">
                          <span className="text-[9px] font-bold text-strategic-teal uppercase tracking-widest">FOOD</span>
                          <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-[2px] font-bold tracking-wider">ALERT</span>
                        </div>
                        <div className="font-bold text-[12px] text-oxford-navy dark:text-slate-200 mb-2">飲食事業売上</div>
                        <div className="text-lg font-black text-oxford-navy dark:text-white font-lato">¥ 450,000</div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-[9px] bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-100 dark:border-slate-800 font-formula italic text-logic-slate break-words">
                            = [客単価] * [組数]
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Action Panel Mock */}
                  <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-clean-canvas dark:bg-[#001133] p-5 relative">
                    <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm mb-6"></div>
                    
                    {/* Simulated AI Card */}
                    <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6 shadow-sm anim-pop" style={{ animationDelay: '3.5s', opacity: 0 }}>
                      <div className="flex items-center gap-2 text-oxford-navy dark:text-white text-xs font-bold mb-3 font-poppins">
                        <BrainCircuit size={14} className="text-strategic-teal" /> AI ANALYSIS
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded w-full mb-2"></div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded w-4/5 mb-4"></div>
                      <div className="w-full h-8 bg-strategic-teal hover:bg-strategic-teal/90 text-white text-[10px] font-bold tracking-widest rounded-sm flex items-center justify-center cursor-pointer transition-colors">
                        GENERATE ACTION PLAN
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-2 font-poppins tracking-widest">KEY SUCCESS FACTORS</div>
                      {[1, 2].map((i) => (
                        <div key={i} className="w-full bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-3 flex items-start gap-3 anim-pop shadow-sm" style={{ animationDelay: `${3.8 + i*0.2}s`, opacity: 0 }}>
                          <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 mt-0.5"></div>
                          <div className="flex-1">
                            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-sm w-3/4 mb-2"></div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-sm w-1/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* NEW: Business Impact (ROI) Section */}
      <section className="py-24 bg-[#001133] text-white relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-[0.03] [background-size:24px_24px]"></div>
        
        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              {
                icon: <Clock size={16} />,
                label: "DATA GATHERING TIME",
                value: "-100",
                unit: "%",
                desc: "末端KPIの入力が上位に自動連鎖。中間管理職を苦しめる数字の「二重集計業務」がゼロ化。"
              },
              {
                icon: <Zap size={16} />,
                label: "DECISION SPEED",
                value: "即時",
                unit: "",
                desc: "シミュレーション機能により、「持ち帰って再計算」がなくなり、会議のその場で打ち手が決まる。"
              },
              {
                icon: <TrendingUp size={16} />,
                label: "EXECUTION RATE",
                value: "100",
                unit: "%",
                desc: "KPIとタスク(KSF)が完全に紐づくため、「決めたけどやらない」が物理的に発生しない。"
              }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="p-6"
              >
                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold mb-4 font-poppins tracking-widest text-xs">
                  {stat.icon} {stat.label}
                </div>
                <div className="text-5xl md:text-6xl font-black mb-4 tracking-tight text-strategic-teal font-lato">
                  {stat.value}<span className="text-3xl">{stat.unit}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: MVV (Identity) Section */}
      <section className="py-24 bg-white dark:bg-[#000a1f] border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-sm font-bold tracking-[0.2em] text-strategic-teal mb-4 font-poppins">OUR IDENTITY</h2>
            <h3 className="text-3xl md:text-4xl font-black text-oxford-navy dark:text-white font-poppins tracking-tight">次世代経営管理プラットフォームのMVV</h3>
          </motion.div>

          <div className="space-y-20">
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="bg-clean-canvas dark:bg-[#001133] p-10 rounded-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-strategic-teal"></div>
                <div className="flex items-center gap-3 mb-6">
                  <Target className="text-strategic-teal" size={24} />
                  <h4 className="text-xl font-bold text-oxford-navy dark:text-white font-poppins tracking-wider">Mission <span className="text-sm font-normal text-slate-500 ml-2">私たちが果たすべき使命</span></h4>
                </div>
                <p className="text-2xl font-black text-oxford-navy dark:text-white mb-6 leading-tight">「すべての『文脈』を見せつけ、<br/>経営と現場をひとつのチームにする」</p>
                <p className="text-sm text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                  経営の「数字」と現場の「行動」の間にあるブラックボックスを破壊するという宣言です。あなたが最も解決したい「泥臭い集計作業」や「不毛な摩擦」をなくし、全員が同じ方向を向くためのプラットフォームであるという存在意義を明確にしています。
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-clean-canvas dark:bg-[#001133] p-10 rounded-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center gap-3 mb-6">
                  <Telescope className="text-blue-500" size={24} />
                  <h4 className="text-xl font-bold text-oxford-navy dark:text-white font-poppins tracking-wider">Vision <span className="text-sm font-normal text-slate-500 ml-2">私たちが実現したい未来</span></h4>
                </div>
                <p className="text-2xl font-black text-oxford-navy dark:text-white mb-6 leading-tight">「個人の努力が会社の未来に直結し、<br/>誰もが『なぜやるのか』に迷わない世界」</p>
                <p className="text-sm text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                  プロダクトが普及した先にある理想の社会です。末端の数値（毎日の仕事）がどのように会社の成果に紐づき、自分に返ってくるのか。その道筋がAIとUIによって完全に可視化され、働く人すべてが納得感を持って前進できる世界を描いています。
                </p>
              </motion.div>
            </div>

            {/* Values */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center mb-4">
                  <Diamond className="text-strategic-teal" size={28} />
                </div>
                <h4 className="text-2xl font-bold text-oxford-navy dark:text-white font-poppins tracking-wider mb-2">Values</h4>
                <p className="text-sm text-logic-slate dark:text-slate-400">ミッションを達成し、圧倒的なプロダクトを創り続けるための3つの行動規範</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-[#000a1f] p-8 border border-slate-200 dark:border-slate-800 rounded-sm hover:border-strategic-teal transition-colors duration-300">
                  <div className="text-4xl font-black text-slate-100 dark:text-slate-800/50 mb-4 font-poppins">01</div>
                  <h5 className="text-lg font-bold text-oxford-navy dark:text-white mb-4">Context over Control<br/><span className="text-xs font-normal text-strategic-teal mt-1 block">管理より、文脈を</span></h5>
                  <p className="text-sm text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                    トップダウンで数字を管理するのではなく、「なぜこの目標なのか」という背景と文脈の共有を最優先する。顧客に対しても、チーム内でも、情報の透明性を徹底する。
                  </p>
                </div>
                
                <div className="bg-white dark:bg-[#000a1f] p-8 border border-slate-200 dark:border-slate-800 rounded-sm hover:border-strategic-teal transition-colors duration-300">
                  <div className="text-4xl font-black text-slate-100 dark:text-slate-800/50 mb-4 font-poppins">02</div>
                  <h5 className="text-lg font-bold text-oxford-navy dark:text-white mb-4">Destroy the "Dorokusai"<br/><span className="text-xs font-normal text-strategic-teal mt-1 block">泥臭さをテクノロジーで駆逐せよ</span></h5>
                  <p className="text-sm text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                    気合いと根性の手作業を憎む。AI推論、自己修復ロジック（Auto-repair）、自動計算エンジンなどの技術を駆使し、人間は「意思決定」と「創造」にのみ時間を使う。
                  </p>
                </div>

                <div className="bg-white dark:bg-[#000a1f] p-8 border border-slate-200 dark:border-slate-800 rounded-sm hover:border-strategic-teal transition-colors duration-300">
                  <div className="text-4xl font-black text-slate-100 dark:text-slate-800/50 mb-4 font-poppins">03</div>
                  <h5 className="text-lg font-bold text-oxford-navy dark:text-white mb-4">Beautiful Truth<br/><span className="text-xs font-normal text-strategic-teal mt-1 block">美しく、飾らない真実を</span></h5>
                  <p className="text-sm text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                    ボトルネックや未達の現実から目を背けない。プロダクトの洗練されたUI（Premium & Modern）のように、複雑なデータや厳しい現実であっても、直感的で美しく、ごまかしのない形で相手に提示する。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-32 bg-white dark:bg-[#000a1f] border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-oxford-navy dark:text-white font-poppins tracking-tight">こんな課題、経営会議で起きていませんか？</h2>
            <p className="text-lg text-logic-slate dark:text-slate-400 font-lato">従来の静的なExcel管理では、組織の実行スピードは上がりません。</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ListChecks size={28} className="text-oxford-navy dark:text-white" />,
                title: "「結局、誰がいつまでにやるの？」",
                desc: "KPIが未達なのは分かったが、それをリカバリーするための具体的な行動（誰が・いつまでに・何を）が現場に落ちていない。"
              },
              {
                icon: <Calculator size={28} className="text-oxford-navy dark:text-white" />,
                title: "「影響範囲が計算できない」",
                desc: "「客単価が5%下がったら、最終利益はいくら減るのか？」Excelが複雑すぎて、会議のその場ですぐにシミュレーションできない。"
              },
              {
                icon: <AlertTriangle size={28} className="text-oxford-navy dark:text-white" />,
                title: "「手遅れになってから気付く」",
                desc: "月末や期末に数字が締まってから「未達」に気付くため、軌道修正の打ち手を打つ時間がない。"
              }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="bg-clean-canvas dark:bg-[#001133] p-10 rounded-sm border border-slate-200 dark:border-slate-800 hover:border-strategic-teal dark:hover:border-strategic-teal transition-colors group shadow-sm"
              >
                <div className="w-14 h-14 flex items-center justify-center mb-6 border-b-2 border-strategic-teal">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-oxford-navy dark:text-white">{item.title}</h3>
                <p className="text-logic-slate dark:text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Solutions / Core Features */}
      <section className="py-32 relative bg-clean-canvas dark:bg-[#000a1f]">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-oxford-navy dark:text-white font-poppins tracking-tight">LogicTree Pro がもたらす<br className="md:hidden" /> 4つの革新</h2>
            <p className="text-lg text-logic-slate dark:text-slate-400 max-w-2xl mx-auto font-lato">
              ただのダッシュボードではありません。戦略を描き、シミュレーションし、行動を管理するための統合プラットフォームです。
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-16 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-strategic-teal font-bold text-xs font-poppins tracking-widest shadow-sm">
                  <BrainCircuit size={14} /> FEATURE 01
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight text-oxford-navy dark:text-white">理念（MVV）を数字に。<br />一気通貫の戦略生成。</h3>
                <p className="text-base text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                  抽象的な企業理念やビジネスモデルを入力するだけで、AIが市場分析（PEST等）からマニフェストを作成。そこから全社KGIと現場の末端KPIが完全に紐づいたツリー構造を数秒で自動生成します。トップの思想と現場の数字の断絶を解消します。
                </p>
                <ul className="space-y-4 pt-4">
                  {['MVVに基づく市場環境・ビジネスフレームワークの自動分析', '理念から現場指標（KPI）までの数珠つなぎツリーを生成', '初期の実績・目標値もデータベースへ完全セット'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-oxford-navy dark:text-slate-300 text-sm">
                      <CheckCircle2 className="text-strategic-teal" size={18} />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 w-full bg-white dark:bg-[#001133] p-8 rounded-sm border border-slate-200 dark:border-slate-800 shadow-xl"
              >
                <div className="text-xs text-logic-slate dark:text-slate-400 mb-4 font-bold flex items-center gap-2 font-poppins tracking-widest"><BrainCircuit className="w-4 h-4 text-strategic-teal" /> AI PROMPT</div>
                <div className="bg-clean-canvas dark:bg-[#000a1f] p-5 border border-slate-200 dark:border-slate-800 text-sm text-oxford-navy dark:text-slate-300 mb-6 font-lato leading-relaxed">
                  "B2BのSaaS企業です。月額課金で、エンタープライズ向けのプランを売り出したいのでKPIツリーを作って。"
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-strategic-teal animate-pulse"></div>
                    <span className="text-xs font-bold text-strategic-teal tracking-widest font-poppins">GENERATING STRUCTURE...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 w-full"></div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 w-4/5"></div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 w-2/3"></div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-strategic-teal font-bold text-xs font-poppins tracking-widest shadow-sm">
                  <Database size={14} /> FEATURE 02
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight text-oxford-navy dark:text-white">中間管理職の解放。<br />ボトムアップ自動連鎖。</h3>
                <p className="text-base text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                  現場が末端のKPI（日々のタスクや数値）を達成するだけで、中間指標から最終利益（KGI）までが自動計算されリアルタイムに更新されます。中間層が数字を収集・報告するだけの「二重業務」を完全に撲滅し、本来のマネジメント業務に集中させます。
                </p>
                <ul className="space-y-4 pt-4">
                  {['末端数値の更新が上位ノードへ即時波及する自動連鎖エンジン', '中間管理層の「Excel集計・報告バケツリレー」の撲滅', '全レイヤーが「単一の真実（Single Source of Truth）」を共有'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-oxford-navy dark:text-slate-300 text-sm">
                      <CheckCircle2 className="text-strategic-teal" size={18} />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 w-full bg-[#001133] p-8 rounded-sm shadow-xl relative overflow-hidden font-mono text-xs"
              >
                <div className="absolute top-4 right-4 text-[9px] border border-strategic-teal/50 text-strategic-teal px-2 py-1 tracking-widest">LIVE SYNC</div>
                <div className="text-slate-500 mb-4">// Database Object</div>
                <div className="text-blue-400">"kpiData"<span className="text-slate-500">:</span> {'{'}</div>
                <div className="pl-4 text-slate-300 my-1">
                  <span className="text-teal-400">"actualValue"</span><span className="text-slate-500">:</span> <span className="text-amber-400">1250000</span>,
                </div>
                <div className="pl-4 text-slate-300">
                  <span className="text-teal-400">"history"</span><span className="text-slate-500">:</span> {'['}
                </div>
                <div className="pl-8 text-slate-300 my-1">
                  {'{'} <span className="text-teal-400">"date"</span><span className="text-slate-500">:</span> <span className="text-emerald-400">"2026-05-11"</span>, <span className="text-teal-400">"actual"</span><span className="text-slate-500">:</span> <span className="text-amber-400">1250000</span> {'}'}
                </div>
                <div className="pl-4 text-slate-300">{']'}</div>
                <div className="text-blue-400 mb-6">{'}'}</div>
                
                <div className="bg-white p-4 rounded-sm shadow-lg w-48 relative z-10 ml-auto border border-slate-200">
                  <div className="text-[9px] text-logic-slate mb-2 font-poppins tracking-widest">UI REFLECTION</div>
                  <div className="font-bold text-sm text-oxford-navy flex justify-between font-lato">
                    <span>全社売上</span>
                    <span className="text-strategic-teal">¥1.25M</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row items-center gap-16 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-strategic-teal font-bold text-xs font-poppins tracking-widest shadow-sm">
                  <Target size={14} /> FEATURE 03
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight text-oxford-navy dark:text-white">「数字」と「行動」を繋ぐ。<br />アクション管理の統合。</h3>
                <p className="text-base text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                  KPIはあくまで「数値の箱」です。それを動かすための具体的な行動を「重要施策（KSF）」としてツリー上に直接定義し、担当者・期限をアサイン。「誰がどの数字のために何をしているか」を一覧化し、「決めたけどやらない」を物理的に排除します。
                </p>
                <ul className="space-y-4 pt-4">
                  {['指標に直接紐づくタスクの可視化', '担当部署・期限の厳格なトラッキング', '数値目標に対する行動の進捗パーセンテージ'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-oxford-navy dark:text-slate-300 text-sm">
                      <CheckCircle2 className="text-strategic-teal" size={18} />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 w-full bg-[#001133] p-8 rounded-sm shadow-xl flex items-center justify-center"
              >
                <div className="w-full bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                    <div className="text-xs font-bold text-logic-slate dark:text-slate-400 font-poppins tracking-widest">KEY SUCCESS FACTORS</div>
                    <div className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1">商談化率の改善</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: 'MAツールのシナリオ改修', owner: 'マーケティング部', done: true },
                      { title: '休眠顧客リストへの架電', owner: 'インサイドセールス', done: false },
                      { title: 'トークスクリプトのA/Bテスト', owner: '営業企画', done: false }
                    ].map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-clean-canvas dark:bg-[#000a1f] rounded-sm border border-slate-200 dark:border-slate-700">
                        <div className={`w-4 h-4 flex items-center justify-center border rounded-sm ${task.done ? 'bg-strategic-teal border-strategic-teal text-white' : 'border-slate-400'}`}>
                          {task.done && <CheckCircle2 size={12} />}
                        </div>
                        <div className="flex-1 text-sm font-medium text-oxford-navy dark:text-slate-200 font-lato">{task.title}</div>
                        <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 tracking-wider bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5">{task.owner}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-strategic-teal font-bold text-xs font-poppins tracking-widest shadow-sm">
                  <TrendingUp size={14} /> FEATURE 04
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight text-oxford-navy dark:text-white">未来予測とシミュレーション。<br />次の一手をAIが導く。</h3>
                <p className="text-base text-logic-slate dark:text-slate-400 leading-relaxed font-lato">
                  トポロジカルソートを用いた高度な計算エンジンにより、会議のその場で「客単価が5%変化した場合の最終利益」を瞬時にシミュレーション。さらに、過去のトレンドから期末の未達をAIが早期警告し、即効性のあるリカバリータスクまで自動提案します。
                </p>
                <ul className="space-y-4 pt-4">
                  {['トポロジカルソートによる即時シミュレーション', '期末の着地予測と未達アラート', 'ボトルネック解析とリカバリータスクの自動生成'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-oxford-navy dark:text-slate-300 text-sm">
                      <CheckCircle2 className="text-strategic-teal" size={18} />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 w-full bg-slate-50 dark:bg-slate-800/50 p-8 rounded-sm border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-strategic-teal/10 blur-3xl rounded-full"></div>
                <div className="w-full bg-white dark:bg-[#001133] rounded-sm shadow-md border border-slate-200 dark:border-slate-800 p-6 relative">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">
                    <BrainCircuit size={16} className="text-strategic-teal" />
                    <span className="font-bold text-xs font-poppins tracking-widest text-oxford-navy dark:text-white">AI FORECAST & PDCA</span>
                  </div>
                  <div className="space-y-5 text-sm leading-relaxed">
                    <div className="bg-red-50 dark:bg-red-900/10 border-l-2 border-red-500 p-4">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2">
                        <AlertTriangle size={14} /> 着地予測アラート
                      </div>
                      <p className="text-oxford-navy dark:text-slate-300 font-lato">現在のトレンドが継続した場合、期末KGIに対して<strong className="text-red-500">15.0%ショート</strong>する予測です。ボトルネックは「商談化率」です。</p>
                    </div>
                    <div className="bg-clean-canvas dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-sm">
                      <strong className="text-strategic-teal block mb-2 text-xs font-poppins tracking-widest">RECOMMENDED ACTIONS</strong>
                      <ul className="list-disc pl-4 space-y-1 text-logic-slate dark:text-slate-300 font-lato text-sm">
                        <li>リード獲得単価の予算再配分（即時）</li>
                        <li>休眠顧客リストへの架電キャンペーン開始</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-32 relative overflow-hidden text-center bg-white dark:bg-[#001133] border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight text-oxford-navy dark:text-white font-poppins"
          >
            経営の解像度を上げ、<br />実行力を最大化する。
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-lg text-logic-slate dark:text-slate-400 mb-12 font-lato"
          >
            あなたの会社の戦略を、今日から「動く地図」に変えませんか？
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <Link 
              href="/login"
              className="px-10 py-5 bg-oxford-navy dark:bg-strategic-teal hover:bg-strategic-teal dark:hover:bg-strategic-teal/90 text-white rounded-sm font-bold text-sm tracking-widest transition-all shadow-lg flex items-center gap-3 group font-poppins"
            >
              START FREE TRIAL
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-logic-slate dark:text-slate-400 max-w-lg mt-4 leading-relaxed">
              ※セットアップは最短5分。お手持ちの事業計画書(CSV/PDF)をAIに読み込ませるだけで初期ツリーが完成します。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-clean-canvas dark:bg-[#000a1f] text-center text-logic-slate dark:text-slate-500 text-xs font-poppins tracking-wider uppercase">
        <div className="flex items-center justify-center gap-2 font-bold mb-4">
          <Network className="w-4 h-4" />
          LogicTree Pro
        </div>
        <p>© 2026 LOGICTREE PRO. ALL RIGHTS RESERVED.</p>
      </footer>

      {/* Lead Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-oxford-navy/80 dark:bg-[#000a1f]/90 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-[#001133] rounded-sm shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-oxford-navy dark:hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              {modalStep === 'input' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-oxford-navy dark:text-white mb-2 border-b border-strategic-teal pb-4">
                    <FileText size={24} className="text-strategic-teal" />
                    <h2 className="text-xl font-bold font-poppins tracking-tight">資料ダウンロード</h2>
                  </div>
                  <p className="text-logic-slate dark:text-slate-300 text-sm leading-relaxed">
                    最新の機能紹介と導入事例をまとめたPDF資料をお送りします。入力いただいた業種をもとに、貴社専用のデモ環境をその場で自動生成します。
                  </p>
                  
                  <div className="space-y-5 pt-4">
                    <div>
                      <label className="block text-xs font-bold text-oxford-navy dark:text-slate-300 mb-2 font-poppins tracking-widest">COMPANY NAME</label>
                      <input type="text" placeholder="株式会社〇〇" className="w-full p-3 rounded-sm border border-slate-200 dark:border-slate-700 bg-clean-canvas dark:bg-[#000a1f] text-oxford-navy dark:text-white focus:outline-none focus:border-strategic-teal transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-oxford-navy dark:text-slate-300 mb-2 font-poppins tracking-widest">EMAIL ADDRESS</label>
                      <input type="email" placeholder="example@company.com" className="w-full p-3 rounded-sm border border-slate-200 dark:border-slate-700 bg-clean-canvas dark:bg-[#000a1f] text-oxford-navy dark:text-white focus:outline-none focus:border-strategic-teal transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-oxford-navy dark:text-slate-300 mb-2 font-poppins tracking-widest">BUSINESS MODEL</label>
                      <select 
                        value={businessModel}
                        onChange={(e) => setBusinessModel(e.target.value)}
                        className="w-full p-3 rounded-sm border border-slate-200 dark:border-slate-700 bg-clean-canvas dark:bg-[#000a1f] text-oxford-navy dark:text-white focus:outline-none focus:border-strategic-teal transition-colors text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="B2B SaaS">B2B SaaS</option>
                        <option value="飲食・小売チェーン">飲食・小売チェーン</option>
                        <option value="宿泊・ホテル">宿泊・ホテル</option>
                        <option value="Eコマース">Eコマース</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setModalStep('loading');
                      setTimeout(() => setModalStep('success'), 3000);
                    }}
                    className="w-full py-4 mt-8 bg-oxford-navy hover:bg-oxford-navy/90 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-oxford-navy rounded-sm font-bold text-xs tracking-widest font-poppins transition-colors flex items-center justify-center gap-2"
                  >
                    DOWNLOAD PDF
                  </button>
                </div>
              )}

              {modalStep === 'loading' && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-12 h-12 border-2 border-slate-200 dark:border-slate-700 border-t-strategic-teal rounded-full animate-spin"></div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-oxford-navy dark:text-white font-poppins tracking-widest uppercase">Analyzing...</h3>
                    <p className="text-sm text-logic-slate dark:text-slate-400 max-w-xs mx-auto">
                      AIが「{businessModel || '貴社の業種'}」に最適な戦略ツリーの論理構造を構築しています。
                    </p>
                  </div>
                </div>
              )}

              {modalStep === 'success' && (
                <div className="py-12 flex flex-col items-center text-center space-y-8">
                  <div className="w-16 h-16 border-2 border-strategic-teal text-strategic-teal rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-oxford-navy dark:text-white font-poppins tracking-tight">準備が完了しました</h3>
                    <p className="text-logic-slate dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                      以下のボタンから資料（PDF）をダウンロードいただけます。<br />
                      さらに、貴社専用のプロトタイプ環境の準備が完了しています。
                    </p>
                  </div>
                  
                  <a 
                    href="#"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-[#000a1f] hover:bg-clean-canvas text-oxford-navy dark:text-white border border-slate-300 dark:border-slate-700 rounded-sm font-bold text-xs tracking-widest font-poppins transition-colors"
                  >
                    <Download size={16} />
                    PDF DOWNLOAD
                  </a>
                  
                  <div className="w-full bg-clean-canvas dark:bg-[#000a1f] border border-slate-200 dark:border-slate-800 p-6 rounded-sm mt-4">
                    <h4 className="font-bold text-sm mb-3 text-oxford-navy dark:text-white">
                      いますぐブラウザでプロトタイプを操作する
                    </h4>
                    <p className="text-xs text-logic-slate dark:text-slate-400 mb-6 leading-relaxed">
                      SaaS向けの「MRR」や「チャーン率」を組み込んだツリー構造がセットアップされています。
                    </p>
                    <Link 
                      href="/org-setup"
                      className="w-full py-4 bg-strategic-teal hover:bg-strategic-teal/90 text-white rounded-sm font-bold text-xs tracking-widest transition-colors flex items-center justify-center gap-2 font-poppins"
                    >
                      OPEN DASHBOARD
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
