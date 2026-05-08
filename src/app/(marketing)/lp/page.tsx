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
  Calculator
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-sans selection:bg-primary-500/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tight text-primary-600 dark:text-primary-500">
            <Network className="w-6 h-6" />
            HHR-KPI MANAGER
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
        {/* Rich Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] opacity-40 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-400 to-indigo-600 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-primary-600 dark:text-primary-400 text-sm font-bold mb-8 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
            </span>
            Excelからの脱却。次世代のKPIマネジメント
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tight mb-8 leading-[1.1]">
            経営のブラックボックスを破壊する。<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500 dark:from-primary-400 dark:to-indigo-400">
              「生きた」KPIツリー。
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            静的なExcel管理はもう限界です。事業構造を可視化するインタラクティブなツリーと、未達を防ぐ「KSF（重要施策）」の実行管理を統合。AIが達成率から次の一手を提案し、会議室の議論を「過去の反省」から「未来の打ち手」へと変革します。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              今すぐ無料デモを体験する
              <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-sm">
              資料をダウンロード
            </button>
          </div>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-20 container mx-auto px-6 relative z-10 hidden md:block">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0B0F19] to-transparent z-10 bottom-0 h-1/2"></div>
            <div className="rounded-t-2xl border-x border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2 shadow-2xl overflow-hidden">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e1e20] h-[400px] flex overflow-hidden">
                <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full h-8 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"></div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-8 relative">
                  {/* Mock Tree Nodes */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-white dark:bg-slate-800 border-2 border-primary-500 rounded-lg shadow-sm"></div>
                  <div className="absolute top-30 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-slate-300 dark:bg-slate-700"></div>
                  <div className="absolute top-[168px] left-[30%] w-48 h-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm"></div>
                  <div className="absolute top-[168px] right-[30%] w-48 h-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm"></div>
                </div>
                <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                  <div className="w-full h-32 bg-slate-50 dark:bg-slate-800 rounded mb-4"></div>
                  <div className="w-full h-32 bg-slate-50 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
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
            <h2 className="text-3xl md:text-5xl font-black mb-6">HHR-KPI MANAGER がもたらす<br className="md:hidden" /> 4つの革新</h2>
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
                      <p>⚠️ <strong className="text-white">【未達要因の分析】</strong><br/>目標に対して15.0%ショートしています。現在の進捗スピードでは目標達成が困難です。</p>
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

      {/* 4. Use Case (Before / After) */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] to-slate-900"></div>
        <div className="container mx-auto px-6 relative z-10 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">経営会議が、劇的に変わる。</h2>
            <p className="text-slate-400">過去の報告に1時間を費やすか、未来の打ち手を15分で決めるか。</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-700 text-slate-300 text-xs font-bold mb-6 tracking-wider">
                BEFORE
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-100">従来の報告会</h3>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>「今月の売上は未達でした。理由は客数減です。」</p>
                <p>「なぜ客数が減ったんだ？」</p>
                <p>「競合の影響かと...来月は広告を頑張ります。」</p>
                <p className="text-rose-400 font-medium pt-4 border-t border-slate-700/50 mt-4">→ 1時間経過。誰も具体的な行動が決まらないまま解散。</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-900/80 to-indigo-900/80 backdrop-blur-xl p-8 rounded-2xl border border-primary-500/30 relative overflow-hidden shadow-2xl shadow-primary-900/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/20 blur-[50px] rounded-full"></div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-500/20 text-primary-300 text-xs font-bold mb-6 tracking-wider border border-primary-500/30">
                AFTER
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">MANAGER 導入後</h3>
              <div className="space-y-4 text-indigo-100/90 leading-relaxed relative z-10">
                <p>「サマリーを見ると、宿泊部の施策完了率が30%で遅れていますね。」</p>
                <p>「ツリーでシミュレーションしましょう。客単価を200円上げられれば挽回可能です。」</p>
                <p>「では、AIが提案した単価UPの新規タスクをそのままマーケティング部にアサインします。」</p>
                <p className="text-primary-300 font-bold pt-4 border-t border-indigo-500/30 mt-4 flex items-center gap-2">
                  <Zap size={18} /> わずか15分で「次なる打ち手」が決定。
                </p>
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
          HHR-KPI MANAGER
        </div>
        <p>© 2026 HHR-KPI MANAGER. All rights reserved.</p>
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
