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
  Clock
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-sans selection:bg-primary-500/30 overflow-x-hidden">
      
      {/* Custom Animations defined via inline style */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawLine {
          from { height: 0; opacity: 0; }
          to { height: 40px; opacity: 1; }
        }
        @keyframes drawLineH {
          from { width: 0; opacity: 0; }
          to { width: 120px; opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulseValue {
          0%, 100% { color: #f43f5e; }
          50% { color: #10b981; }
        }
        @keyframes progressFill {
          0% { width: 30%; background-color: #f43f5e; }
          100% { width: 85%; background-color: #10b981; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .anim-line-v { animation: drawLine 0.5s ease-out forwards; }
        .anim-line-h { animation: drawLineH 0.5s ease-out forwards; }
        .anim-pop { animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-pulse-val { animation: pulseValue 4s ease-in-out infinite alternate; }
        .anim-progress { animation: progressFill 4s ease-in-out infinite alternate; }
        .anim-float { animation: float 6s ease-in-out infinite; }
      `}} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tight text-primary-600 dark:text-primary-500">
            <Network className="w-6 h-6" />
            LogicTree Pro
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium hover:text-primary-600 transition-colors hidden md:block">
              ログイン
            </Link>
            <Link href="/login" className="text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-5 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] opacity-40 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-400 to-indigo-600 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-primary-600 dark:text-primary-400 text-sm font-bold mb-8 border border-slate-200/50 dark:border-slate-700/50 shadow-sm anim-pop" style={{ animationDelay: '0s', opacity: 0 }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
            </span>
            Excelからの脱却。次世代のKPIマネジメント
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tight mb-8 leading-[1.1] anim-pop" style={{ animationDelay: '0.1s', opacity: 0 }}>
            経営のブラックボックスを破壊する。<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500 dark:from-primary-400 dark:to-indigo-400">
              「生きた」KPIツリー。
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed anim-pop" style={{ animationDelay: '0.2s', opacity: 0 }}>
            静的なExcel管理はもう限界です。事業構造を可視化するインタラクティブなツリーと、未達を防ぐ「KSF（重要施策）」の実行管理を統合。AIが達成率から次の一手を提案し、会議室の議論を「過去の反省」から「未来の打ち手」へと変革します。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 anim-pop" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              今すぐ無料デモを体験する
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-sm">
              資料をダウンロード
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Dashboard Mockup Preview */}
        {mounted && (
          <div className="mt-20 container mx-auto px-6 relative z-10 hidden md:block anim-pop" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <div className="relative mx-auto max-w-5xl anim-float">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0B0F19] to-transparent z-20 bottom-0 h-1/3"></div>
              
              <div className="rounded-t-2xl border-x border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2 shadow-2xl overflow-hidden relative z-10">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1e1e20] h-[450px] flex overflow-hidden">
                  
                  {/* Left Sidebar Mock */}
                  <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full h-8 bg-slate-100 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-700/50"></div>
                      ))}
                    </div>
                  </div>

                  {/* Center Main Tree Canvas */}
                  <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#1a1c1e] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                    
                    {/* Node 1: KGI (Top) */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-slate-800 border-2 border-primary-500 rounded-xl shadow-lg p-3 z-10 anim-pop" style={{ animationDelay: '1s', opacity: 0 }}>
                      <div className="text-[10px] font-bold text-primary-500 mb-1">KGI</div>
                      <div className="font-bold text-sm mb-2 text-slate-800 dark:text-white">全社売上高</div>
                      <div className="flex justify-between items-end">
                        <div className="text-xl font-black anim-pulse-val">¥ 1,250,000</div>
                        <div className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">+15%</div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full anim-progress"></div>
                      </div>
                    </div>

                    {/* Vertical Line from KGI */}
                    <div className="absolute top-[130px] left-1/2 -translate-x-1/2 w-0.5 bg-primary-300 dark:bg-primary-500/50 anim-line-v" style={{ animationDelay: '1.4s', opacity: 0 }}></div>
                    
                    {/* Horizontal Line Split */}
                    <div className="absolute top-[170px] left-[calc(50%-120px)] h-0.5 bg-primary-300 dark:bg-primary-500/50 anim-line-h" style={{ animationDelay: '1.7s', opacity: 0, width: '240px' }}></div>

                    {/* Left vertical drop */}
                    <div className="absolute top-[170px] left-[calc(50%-120px)] w-0.5 bg-primary-300 dark:bg-primary-500/50 anim-line-v" style={{ animationDelay: '2.0s', opacity: 0 }}></div>
                    {/* Right vertical drop */}
                    <div className="absolute top-[170px] left-[calc(50%+120px)] w-0.5 bg-primary-300 dark:bg-primary-500/50 anim-line-v" style={{ animationDelay: '2.0s', opacity: 0 }}></div>

                    {/* Node 2: KPI Left */}
                    <div className="absolute top-[210px] left-[calc(50%-120px)] -translate-x-1/2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md p-3 z-10 anim-pop" style={{ animationDelay: '2.4s', opacity: 0 }}>
                      <div className="text-[10px] font-bold text-slate-500 mb-1">KPI</div>
                      <div className="font-bold text-sm mb-2">宿泊事業売上</div>
                      <div className="text-lg font-black text-slate-700 dark:text-slate-200">¥ 800,000</div>
                    </div>

                    {/* Node 3: KPI Right */}
                    <div className="absolute top-[210px] left-[calc(50%+120px)] -translate-x-1/2 w-56 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-xl shadow-md p-3 z-10 anim-pop relative overflow-hidden" style={{ animationDelay: '2.6s', opacity: 0 }}>
                      <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                      <div className="text-[10px] font-bold text-rose-500 mb-1 flex items-center gap-1"><AlertTriangle size={10}/> 要注意KPI</div>
                      <div className="font-bold text-sm mb-2">飲食事業売上</div>
                      <div className="text-lg font-black text-rose-500">¥ 450,000</div>
                    </div>

                  </div>

                  {/* Right Action Panel Mock */}
                  <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 relative">
                    <div className="absolute top-4 right-4 flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    </div>
                    
                    <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                    
                    {/* Simulated AI Card */}
                    <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg p-3 mb-4 anim-pop" style={{ animationDelay: '3.5s', opacity: 0 }}>
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
                        <BrainCircuit size={14} /> AI PDCA 分析
                      </div>
                      <div className="h-2 bg-indigo-200 dark:bg-indigo-800/50 rounded w-full mb-2"></div>
                      <div className="h-2 bg-indigo-200 dark:bg-indigo-800/50 rounded w-4/5 mb-4"></div>
                      <div className="w-full h-8 bg-indigo-600 text-white text-[10px] font-bold rounded flex items-center justify-center">
                        解決タスクを自動生成
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500 mb-2">KSF (重要施策)</div>
                      {[1, 2].map((i) => (
                        <div key={i} className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-700/50 flex items-center px-2 gap-2 anim-pop" style={{ animationDelay: `${3.8 + i*0.2}s`, opacity: 0 }}>
                          <div className="w-3 h-3 rounded-full border border-slate-400"></div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
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
      <section className="py-20 bg-primary-600 dark:bg-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-white/10 blur-[100px] rounded-full"></div>
        
        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="p-6">
              <div className="flex items-center justify-center gap-2 text-primary-200 font-bold mb-2">
                <Clock size={20} /> 経営会議の準備時間
              </div>
              <div className="text-5xl md:text-6xl font-black mb-2 tracking-tight">
                -80<span className="text-3xl">%</span>
              </div>
              <p className="text-sm text-primary-100/80">各部署からのExcel収集と結合がゼロに。システムを開けば常に最新の全体図が完成。</p>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center gap-2 text-primary-200 font-bold mb-2">
                <Zap size={20} /> 意思決定スピード
              </div>
              <div className="text-5xl md:text-6xl font-black mb-2 tracking-tight">
                即時
              </div>
              <p className="text-sm text-primary-100/80">シミュレーション機能により、「持ち帰って再計算」がなくなり、会議のその場で打ち手が決まる。</p>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center gap-2 text-primary-200 font-bold mb-2">
                <TrendingUp size={20} /> 施策実行率
              </div>
              <div className="text-5xl md:text-6xl font-black mb-2 tracking-tight">
                100<span className="text-3xl">%</span>
              </div>
              <p className="text-sm text-primary-100/80">KPIとタスク(KSF)が完全に紐づくため、「決めたけどやらない」が物理的に発生しない。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-24 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">こんな課題、経営会議で起きていませんか？</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">従来の静的なExcel管理では、組織の実行スピードは上がりません。</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ListChecks size={32} className="text-rose-500" />,
                title: "「結局、誰がいつまでにやるの？」",
                desc: "KPIが未達なのは分かったが、それをリカバリーするための具体的な行動（誰が・いつまでに・何を）が現場に落ちていない。"
              },
              {
                icon: <Calculator size={32} className="text-amber-500" />,
                title: "「影響範囲が計算できない」",
                desc: "「客単価が5%下がったら、最終利益はいくら減るのか？」Excelが複雑すぎて、会議のその場ですぐにシミュレーションできない。"
              },
              {
                icon: <AlertTriangle size={32} className="text-orange-500" />,
                title: "「手遅れになってから気付く」",
                desc: "月末や期末に数字が締まってから「未達」に気付くため、軌道修正の打ち手を打つ時間がない。"
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-primary-500/50 transition-colors group">
                <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Solutions / Core Features */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute top-1/2 right-0 w-1/2 h-[800px] bg-primary-500/5 dark:bg-primary-900/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-black mb-6">LogicTree Pro がもたらす<br className="md:hidden" /> 4つの革新</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              ただのダッシュボードではありません。戦略を描き、シミュレーションし、行動を管理するための統合プラットフォームです。
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1: Dynamic Calculation */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <Calculator size={16} />
                  Feature 01
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">計算式を入力するだけ。<br />リアルタイム連動エンジン。</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Excelのような「計算式（例: 客数 × 客単価）」を設定するだけで、ツリー全体が動的に連動。下位KPIの数値を変更した瞬間に、上位KPIや全社利益へ即座に波及し、会議室でのシミュレーションを圧倒的に加速させます。
                </p>
                <ul className="space-y-3 pt-4">
                  {['四則演算による高度な自動計算', '目標・実績・シミュレーションの完全連動', 'ドラッグ＆ドロップの直感的なUI'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="text-blue-500" size={20} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                  <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="text-xs text-slate-500 mb-2">計算式（構造）</div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 font-mono text-sm mb-6 flex items-center gap-2">
                      <span className="text-blue-500 font-bold">宿泊事業売上</span> <span className="text-slate-400">＋</span> <span className="text-emerald-500 font-bold">飲食事業売上</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">実績値</span>
                        <span className="font-bold text-lg">¥ 12,500,000</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 w-[65%] h-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Task Management */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Target size={16} />
                  Feature 02
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">「数字」の責任と、<br />「行動」の責任を分離する。</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  KPIはあくまで「数値の箱」。それを動かすための具体的な行動を「KSF (重要施策)」として定義し、担当部署・担当者をアサイン。サイドバーのアクションパネルから、タスクの進捗を直接管理できます。
                </p>
                <ul className="space-y-3 pt-4">
                  {['フルハイトのプロパティサイドバー', 'KPIごとのタスク紐付け', '担当者・期限の設定と進捗追跡'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                  <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                      <div className="text-sm font-bold text-slate-400">詳細</div>
                      <div className="text-sm font-bold text-emerald-500 border-b-2 border-emerald-500 pb-2">タスク (3)</div>
                      <div className="text-sm font-bold text-slate-400">AI・PDCA</div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: '新規LPの公開', owner: 'マーケティング部', done: true },
                        { title: '既存顧客への架電', owner: '営業部', done: false },
                        { title: '広告クリエイティブのA/Bテスト', owner: 'デザイン部', done: false }
                      ].map((task, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'}`}>
                            {task.done && <CheckCircle2 size={12} />}
                          </div>
                          <div className="flex-1 text-sm font-medium">{task.title}</div>
                          <div className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{task.owner}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: AI PDCA */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <BrainCircuit size={16} />
                  Feature 03
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">AIが未達要因を分析し、<br />リカバリー策を自動提案。</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  現在の達成率と関連タスクの進行状況をAIが分析。目標に対して未達の場合は、その要因を特定し、リカバリーのための「次の一手（タスク）」を自動で生成・提案します。
                </p>
                <ul className="space-y-3 pt-4">
                  {['ワンクリックでの現状分析', '達成要因・未達要因の言語化', 'リカバリータスクの自動アサイン'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="text-indigo-500" size={20} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                  <div className="w-full bg-slate-900 rounded-xl shadow-2xl border border-indigo-500/30 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-2 mb-4 text-indigo-400">
                      <SparklesIcon />
                      <span className="font-bold text-sm">AI PDCA 分析結果</span>
                    </div>
                    <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                      <p><AlertTriangle className="inline w-4 h-4 mr-1 text-rose-500" /> <strong className="text-white">【未達要因の分析】</strong><br/>目標に対して15.0%ショートしています。現在の進捗スピードでは目標達成が困難です。</p>
                      <div className="bg-indigo-950/50 border border-indigo-500/30 p-4 rounded-lg">
                        <strong className="text-white block mb-2">【次の一手のご提案】</strong>
                        <ul className="list-disc pl-4 space-y-1 text-indigo-200">
                          <li>原因究明とボトルネックの特定（担当：マネージャー）</li>
                          <li>今週末までのテコ入れ施策の立案</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-32 relative overflow-hidden text-center bg-white dark:bg-[#0B0F19]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-900/50"></div>
        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
            経営の解像度を上げ、<br />実行力を最大化する。
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
            あなたの会社の戦略を、今日から「動く地図」に変えませんか？
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <Link 
              href="/login"
              className="px-10 py-5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full font-black text-xl transition-all shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 flex items-center gap-3"
            >
              無料で自社のKPIツリーを作ってみる
              <ChevronRight size={24} />
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              ※セットアップは最短5分。お手持ちの事業計画書(CSV/PDF)をAIに読み込ませるだけで初期ツリーが完成します。
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#0B0F19] text-center text-slate-500 dark:text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-2 font-black text-lg tracking-tight text-slate-300 dark:text-slate-700 mb-4 grayscale">
          <Network className="w-5 h-5" />
          LogicTree Pro
        </div>
        <p>© 2026 LogicTree Pro. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Sparkles Icon Helper
function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
