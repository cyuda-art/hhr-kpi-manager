"use client";

import Link from 'next/link';
import { BrainCircuit, Target, CheckCircle2 } from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      <MarketingHeader />

      <div className="container mx-auto px-6 max-w-5xl mt-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">AIが導く、次世代のKPI管理</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed">
          Gnu.Doneは、ただ数値を記録するだけのツールではありません。<br/>
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
