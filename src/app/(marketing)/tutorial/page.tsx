"use client";

import Link from 'next/link';
import { PlayCircle, FileText, Download } from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      <MarketingHeader />

      <div className="container mx-auto px-6 max-w-4xl mt-12">
        <h1 className="text-4xl font-black mb-4">リソース & チュートリアル</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">Gnu.Doneの基本的な使い方から、高度なAI予測の活用方法までを学びます。</p>

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
