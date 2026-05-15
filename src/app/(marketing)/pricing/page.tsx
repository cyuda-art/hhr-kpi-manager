"use client";

import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      <MarketingHeader />

      <div className="container mx-auto px-6 max-w-6xl mt-12">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-black mb-6 font-poppins tracking-tight">シンプルで透明な料金体系</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">すべての機能が14日間無料でお試しいただけます。クレジットカードの登録は不要です。</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col bg-white dark:bg-[#001133] shadow-sm">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">ビジネスの解像度を上げたい全ての野心的な挑戦者へ</p>
            <div className="mb-8">
              <span className="text-4xl font-black font-poppins">¥0</span>
              <span className="text-slate-500 text-sm"> / ずっと無料</span>
            </div>
            <Link href="/login" className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-center rounded-full transition-colors mb-8">
              無料で始める
            </Link>
            <div className="space-y-4 flex-1">
              {['1プロジェクト（ツリー）', '個人利用（1ユーザー）', 'AIツリー自動生成（月3回まで）', '基本のタスク管理'].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Starter Plan */}
          <div className="border-2 border-strategic-teal rounded-2xl p-8 flex flex-col bg-white dark:bg-[#001133] shadow-xl relative scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-strategic-teal text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2 text-strategic-teal">Starter</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">個人事業主や少人数チームの目標達成をAIが伴走</p>
            <div className="mb-8">
              <span className="text-4xl font-black font-poppins">¥1,980</span>
              <span className="text-slate-500 text-sm"> / 月</span>
            </div>
            <Link href="/login" className="w-full py-3 px-4 bg-strategic-teal hover:bg-strategic-teal/90 text-white font-bold text-center rounded-full transition-colors mb-8 shadow-md">
              14日間無料で試す
            </Link>
            <div className="space-y-4 flex-1">
              {['無制限のプロジェクト', '最大5ユーザーまで招待可能', 'AIツリー自動生成（無制限）', 'AIローリングフォーキャスト（予測）', '過去履歴の保存と推移グラフ'].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-strategic-teal shrink-0" />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Business Plan */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col bg-white dark:bg-[#001133] shadow-sm">
            <h3 className="text-xl font-bold mb-2">Business</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">複数部署のKPIを横断管理する法人・組織向け</p>
            <div className="mb-8">
              <span className="text-4xl font-black font-poppins">¥9,800</span>
              <span className="text-slate-500 text-sm"> / 月</span>
            </div>
            <Link href="/login" className="w-full py-3 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-center rounded-full transition-colors mb-8">
              14日間無料で試す
            </Link>
            <div className="space-y-4 flex-1">
              {['Starterの全機能', '最大30ユーザーまで招待可能', 'CSVデータ一括インポート', '組織階層のアクセス権限管理', '優先カスタマーサポート'].map((feature, i) => (
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
