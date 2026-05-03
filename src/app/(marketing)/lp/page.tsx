"use client";

import Link from 'next/link';
import { 
  Network, 
  TrendingUp, 
  Target, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  BarChart3,
  ListChecks,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans selection:bg-primary-500/30">
      
      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-700 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-bold mb-8 border border-primary-200 dark:border-primary-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            次世代のKPIマネジメント SaaS
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            過去の報告会を終わらせる。<br />
            <span className="text-transparent bg-clip-text bg-primary-600">
              「動く」KPIツリー。
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Excelでの静的なKPI管理はもう限界です。事業構造を可視化するインタラクティブなツリーと、未達を防ぐ「KFC（重要施策）」の実行管理を統合。AIが期末の着地点を予測し、会議室の議論を「過去の反省」から「未来の打ち手」へと変革します。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              無料デモを体験する
              <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
              資料をダウンロード
            </button>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-24 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">こんな課題、経営会議で起きていませんか？</h2>
            <p className="text-slate-500 dark:text-slate-400">従来の静的なExcel管理では、組織のスピードは上がりません。</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ListChecks size={32} className="text-rose-500" />,
                title: "「結局、誰がやるの？」",
                desc: "KPIが未達なのは分かったが、それをリカバリーするための具体的な行動（誰が・いつまでに・何を）が現場に落ちていない。"
              },
              {
                icon: <Network size={32} className="text-amber-500" />,
                title: "「影響範囲が計算できない」",
                desc: "「客単価が5%下がったら、最終利益はいくら減るのか？」Excelが複雑すぎて、会議のその場ですぐにシミュレーションできない。"
              },
              {
                icon: <AlertTriangle size={32} className="text-orange-500" />,
                title: "「手遅れになってから気付く」",
                desc: "月末や期末に数字が締まってから「未達」に気付くため、軌道修正の打ち手を打つ時間がない。"
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-primary-500/50 transition-colors">
                <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-lg flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
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
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6">K-Navigatorがもたらす<br className="md:hidden" /> 3つの革新</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              ただのダッシュボードではありません。戦略を描き、シミュレーションし、行動を管理するための統合プラットフォームです。
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm">
                  <Network size={16} />
                  Feature 01
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">事業構造を地図にし、<br />その場で最適解を導く。</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  事業のすべての指標がツリー状に連携。「もし、温浴部門の来客数が10%増えたら？」という仮説をスライダーで動かすだけで、飲食部門への送客効果から全社の最終利益まで、リアルタイムにシミュレーション波及します。
                </p>
                <ul className="space-y-3 pt-4">
                  {['無限階層のKPIツリー構築', '他部門への波及効果シミュレーション', 'ドラッグ＆ドロップの直感的なUI'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="text-primary-500" size={20} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                  {/* Mockup visual */}
                  <div className="w-full h-full bg-white dark:bg-slate-950 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800 flex flex-col p-4 opacity-90">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center flex-col gap-4">
                      <Network size={48} className="text-primary-400 opacity-50" />
                      <div className="font-bold text-slate-400 tracking-widest">INTERACTIVE KPI TREE</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Target size={16} />
                  Feature 02
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">「数字」の責任と、<br />「行動」の責任を分離する。</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  KPIはあくまで「数値の箱」。それを動かすための具体的な行動を「KFC (重要施策)」として定義し、担当部署・担当者をアサイン。ダッシュボードには「部署別のKFC進捗率」が表示され、行動レベルのボトルネックを瞬時に把握できます。
                </p>
                <ul className="space-y-3 pt-4">
                  {['部署・担当者別のタスク紐付け', 'スプレッドシート型エディターでの一括管理', '部署別の施策進捗サマリー'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                  <div className="w-full h-full bg-white dark:bg-slate-950 rounded-xl shadow-inner border border-emerald-100 dark:border-emerald-900 flex flex-col p-4 opacity-90">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center justify-center flex-col gap-4">
                      <ListChecks size={48} className="text-emerald-400 opacity-50" />
                      <div className="font-bold text-emerald-400/80 tracking-widest">KFC MANAGEMENT</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <BrainCircuit size={16} />
                  Feature 03
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">手遅れになる前に、<br />AIが未来の着地点を警告。</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  過去のトレンドと現在の進捗ペースをAIが分析し、ボタン一つで「期末の着地予測値」を算出。未達が予測されるボトルネックKPIを赤くハイライトし、今すぐ打つべき有効な施策（KFC）案をAIがその場で提案します。
                </p>
                <ul className="space-y-3 pt-4">
                  {['ワンクリックAI未来予測', 'ボトルネックの自動特定', '生成AIによる改善施策の提案'].map((point, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="text-indigo-500" size={20} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                  <div className="w-full h-full bg-slate-900 rounded-xl shadow-inner border border-indigo-500/30 flex flex-col p-4 opacity-95 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                    <div className="flex-1 border border-indigo-500/20 rounded-lg flex items-center justify-center flex-col gap-4 relative z-10 bg-slate-900/50 backdrop-blur-sm">
                      <BrainCircuit size={48} className="text-indigo-400" />
                      <div className="font-bold text-indigo-300 tracking-widest text-shadow-neon">AI FORECAST MODE</div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 to-indigo-900/50"></div>
        <div className="container mx-auto px-6 relative z-10 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">経営会議が、劇的に変わる。</h2>
            <p className="text-slate-300">過去の報告に1時間を費やすか、未来の打ち手を15分で決めるか。</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-xl border border-slate-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-700 text-slate-300 text-xs font-bold mb-6 tracking-wider">
                BEFORE
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-100">従来の報告会</h3>
              <div className="space-y-4 text-slate-400">
                <p>「今月の売上は未達でした。理由は客数減です。」</p>
                <p>「なぜ客数が減ったんだ？」</p>
                <p>「競合の影響かと...来月は広告を頑張ります。」</p>
                <p className="text-rose-400 font-medium pt-2">→ 1時間経過。誰も具体的な行動が決まらないまま解散。</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-900/80 to-indigo-900/80 backdrop-blur-xl p-8 rounded-xl border border-primary-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-3xl rounded-full"></div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-500/20 text-primary-300 text-xs font-bold mb-6 tracking-wider border border-primary-500/30">
                AFTER
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">K-Navigator 導入後</h3>
              <div className="space-y-4 text-indigo-100/80">
                <p>「サマリーを見ると、宿泊部の施策完了率が30%で遅れていますね。」</p>
                <p>「ツリーでシミュレーションしましょう。客単価を200円上げられれば挽回可能です。」</p>
                <p>「では、単価UPのための新しいKFCを今すぐデータエディターで追加し、マーケティング部にアサインします。」</p>
                <p className="text-primary-300 font-bold pt-2 flex items-center gap-2">
                  <ArrowRight size={16} /> わずか15分で「次なる打ち手」が決定。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-32 relative overflow-hidden text-center">
        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            経営の解像度を上げ、<br />実行力を最大化する。
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
            あなたの会社の戦略を、今日から「動く地図」に変えませんか？
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <Link 
              href="/"
              className="px-10 py-5 bg-primary-600 hover:from-primary-600 hover:to-indigo-600 text-white rounded-lg font-black text-xl transition-all shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 flex items-center gap-3"
            >
              無料で自社のKPIツリーを作ってみる
              <ChevronRight size={24} />
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ※セットアップは最短5分。お手持ちの事業計画書(CSV/PDF)をAIに読み込ませるだけで初期ツリーが完成します。
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>© 2026 K-Navigator. All rights reserved.</p>
      </footer>
    </div>
  );
}
