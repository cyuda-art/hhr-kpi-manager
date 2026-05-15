"use client";

import Link from 'next/link';
import { Check, Network, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      {/* Header (Simplified for this page) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#001133]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/lp" className="flex items-center gap-2 font-black text-xl tracking-widest font-poppins text-slate-900 dark:text-white uppercase">
            <Network className="w-5 h-5 text-strategic-teal" />
            LogicTree Pro
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Link href="/product" className="hover:text-strategic-teal transition-colors">製品</Link>
            <Link href="/pricing" className="text-strategic-teal">料金</Link>
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

      <div className="container mx-auto px-6 max-w-6xl mt-12">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-black mb-6 font-poppins tracking-tight">シンプルで透明な料金体系</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">すべての機能が14日間無料でお試しいただけます。クレジットカードの登録は不要です。</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col bg-white dark:bg-[#001133] shadow-sm">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">単一事業のKPI管理を始めるための基本プラン</p>
            <div className="mb-8">
              <span className="text-4xl font-black font-poppins">¥9,800</span>
              <span className="text-slate-500 text-sm"> / 月</span>
            </div>
            <Link href="/login" className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-center rounded-full transition-colors mb-8">
              14日間無料で試す
            </Link>
            <div className="space-y-4 flex-1">
              {['1プロジェクト（ツリー）', '最大5ユーザー', 'AIツリー自動生成（月5回まで）', '基本ダッシュボード'].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-strategic-teal shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-strategic-teal rounded-2xl p-8 flex flex-col bg-white dark:bg-[#001133] shadow-xl relative scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-strategic-teal text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2 text-strategic-teal">Pro</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">AIによる未来予測と完全なタスク管理を導入</p>
            <div className="mb-8">
              <span className="text-4xl font-black font-poppins">¥29,800</span>
              <span className="text-slate-500 text-sm"> / 月</span>
            </div>
            <Link href="/login" className="w-full py-3 px-4 bg-strategic-teal hover:bg-strategic-teal/90 text-white font-bold text-center rounded-full transition-colors mb-8 shadow-md">
              14日間無料で試す
            </Link>
            <div className="space-y-4 flex-1">
              {['5プロジェクト（ツリー）', '最大20ユーザー', 'AIツリー自動生成（無制限）', 'AIローリングフォーキャスト', 'CSVインポート連携', '優先サポート'].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-strategic-teal shrink-0" />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col bg-white dark:bg-[#001133] shadow-sm">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">複数組織・大規模拠点を統括するエンタープライズ</p>
            <div className="mb-8">
              <span className="text-4xl font-black font-poppins">Custom</span>
            </div>
            <button className="w-full py-3 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-center rounded-full transition-colors mb-8">
              営業に問い合わせる
            </button>
            <div className="space-y-4 flex-1">
              {['無制限のプロジェクト', '無制限のユーザー', '組織階層のアクセス権限管理', 'SSO (SAML) 認証', '専任のカスタマーサクセス', 'SLA保証'].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-strategic-teal shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
