"use client";

import Link from 'next/link';
import { Network, ArrowRight, BrainCircuit, Target, CheckCircle2 } from 'lucide-react';

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#001133]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/lp" className="flex items-center gap-2 font-black text-xl tracking-widest font-poppins text-slate-900 dark:text-white uppercase">
            <Network className="w-5 h-5 text-strategic-teal" />
            LogicTree Pro
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Link href="/product" className="text-strategic-teal">製品</Link>
            <Link href="/pricing" className="hover:text-strategic-teal transition-colors">料金</Link>
            <Link href="/tutorial" className="hover:text-strategic-teal transition-colors">チュートリアル</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors hidden md:block">
              ログイン
            </Link>
            <Link href="/login" className="text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
              無料トライアル
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-5xl mt-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">AIが導く、次世代のKPI管理</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed">
          LogicTree Proは、ただ数値を記録するだけのツールではありません。<br/>
          事業の構造を視覚化し、AIが未来の未達リスクを検知・修正する「生きた戦略コックピット」です。
        </p>

        <div className="grid md:grid-cols-3 gap-12 text-left mt-20">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-12 h-12 bg-strategic-teal/10 text-strategic-teal rounded-xl flex items-center justify-center mb-6">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4">10秒でツリー自動生成</h3>
            <p className="text-slate-600 dark:text-slate-400">事業モデルと目標を入力するだけで、コンサルタントレベルのKPIツリーをAIが瞬時に構築します。</p>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-12 h-12 bg-strategic-teal/10 text-strategic-teal rounded-xl flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4">AIローリング・予測</h3>
            <p className="text-slate-600 dark:text-slate-400">進捗の遅れを検知し、残りの期間でどのようにリカバリーすべきかのシミュレーションをAIが自動提示します。</p>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-12 h-12 bg-strategic-teal/10 text-strategic-teal rounded-xl flex items-center justify-center mb-6">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4">タスクとの完全連動</h3>
            <p className="text-slate-600 dark:text-slate-400">「誰が」「いつまでに」やるべき施策（KSF）なのかをKPIに直接紐付け、実行漏れをゼロにします。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
