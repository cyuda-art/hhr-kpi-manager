"use client";

import Link from 'next/link';
import { Network, PlayCircle, FileText, Download } from 'lucide-react';

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#001133]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/lp" className="flex items-center gap-2 font-black text-xl tracking-widest font-poppins text-slate-900 dark:text-white uppercase">
            <Network className="w-5 h-5 text-strategic-teal" />
            LogicTree Pro
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Link href="/product" className="hover:text-strategic-teal transition-colors">製品</Link>
            <Link href="/pricing" className="hover:text-strategic-teal transition-colors">料金</Link>
            <Link href="/tutorial" className="text-strategic-teal">チュートリアル</Link>
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

      <div className="container mx-auto px-6 max-w-4xl mt-12">
        <h1 className="text-4xl font-black mb-4">リソース & チュートリアル</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">LogicTree Proの基本的な使い方から、高度なAI予測の活用方法までを学びます。</p>

        <div className="space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-slate-200 dark:border-slate-700 hover:border-strategic-teal transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm shrink-0">
              <PlayCircle size={32} className="text-strategic-teal" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">クイックスタートガイド（動画）</h3>
              <p className="text-slate-600 dark:text-slate-400">アカウント作成から、AIによる最初のKPIツリー作成、CSVデータの一括インポートまでの基本操作を5分でマスターします。</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-slate-200 dark:border-slate-700 hover:border-strategic-teal transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm shrink-0">
              <FileText size={32} className="text-strategic-teal" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">AIシミュレーションの活用マニュアル</h3>
              <p className="text-slate-600 dark:text-slate-400">ショートフォール（目標未達）が発生した際の、AIへの効果的なプロンプト入力とアクションプランの生成方法を解説します。</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-slate-200 dark:border-slate-700 hover:border-strategic-teal transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm shrink-0">
              <Download size={32} className="text-strategic-teal" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">インポート用CSVテンプレート</h3>
              <p className="text-slate-600 dark:text-slate-400">既存のシステムやExcelからデータを移行するための、最新の公式CSVテンプレートとマッピングガイドをダウンロードできます。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
