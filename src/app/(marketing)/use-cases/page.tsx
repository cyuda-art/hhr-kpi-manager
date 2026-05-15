"use client";

import Link from 'next/link';
import { Building2, Store, Rocket, Briefcase } from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000a1f] text-slate-900 dark:text-slate-100 font-sans pt-32 pb-24">
      <MarketingHeader />

      <div className="container mx-auto px-6 max-w-5xl mt-12">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">あらゆるビジネスの解像度を上げる</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            LogicTree Proは、業界やフェーズを問わず、目標達成に向けた「最善のルート」をAIが導き出します。<br/>様々なビジネスシーンでの活用方法をご紹介します。
          </p>
        </div>

        <div className="space-y-16">
          {/* Use Case 1 */}
          <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
                <Store size={48} className="text-strategic-teal" />
              </div>
            </div>
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-4">1. 多店舗展開・フランチャイズビジネス</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                ホテル、飲食店、小売店などの多店舗ビジネスにおいて、店舗ごとの「客数×客単価」からなる複雑なKPIを統合管理します。
              </p>
              <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <li>エリア別、店舗別の未達要因（集客不足なのか、単価低下なのか）を一目で特定。</li>
                <li>「雨天で客足が落ちた」などの突発的なショートフォールに対し、AIがリカバリー策（クーポン配信など）を提案。</li>
              </ul>
            </div>
          </div>

          {/* Use Case 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center bg-white dark:bg-[#001133] p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                <Building2 size={48} className="text-strategic-teal" />
              </div>
            </div>
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-4">2. B2B SaaS・ITスタートアップ</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                ARR（年間経常収益）の最大化に向け、マーケティング、インサイドセールス、カスタマーサクセスのKPIを滑らかに繋ぎます。
              </p>
              <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <li>リード獲得数、商談化率、チャーンレート（解約率）などのSaaS特有の指標をツリー化。</li>
                <li>「商談化率が落ちた」瞬間に、マーケティング部と営業部の間でどこにボトルネックがあるかを即座に可視化し、タスクを割り当て。</li>
              </ul>
            </div>
          </div>

          {/* Use Case 3 */}
          <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
                <Rocket size={48} className="text-strategic-teal" />
              </div>
            </div>
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-4">3. 新規事業立ち上げ（ゼロイチ）</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                まだデータが存在しない新規事業の計画段階において、事業モデルと目標金額を入力するだけで、追うべき指標（KPI）をAIが設計します。
              </p>
              <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <li>ドメイン知識がなくても、AIが「このビジネスモデルならこのKPIを見るべき」というセオリーを10秒で提示。</li>
                <li>ローンチ前にシミュレーションを行うことで、事業計画の「穴」や「非現実的な目標設定」を事前に防ぐことができます。</li>
              </ul>
            </div>
          </div>

          {/* Use Case 4 */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center bg-white dark:bg-[#001133] p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                <Briefcase size={48} className="text-strategic-teal" />
              </div>
            </div>
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-4">4. 経営企画・コーポレート</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                複数事業のレポートをExcelで集計し、毎月深夜まで会議資料を作っている経営企画部の「エクセル集計地獄」を完全に終わらせます。
              </p>
              <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <li>現場が入力した末端のデータが、即座に全社KGIへと自動集計・ロールアップされます。</li>
                <li>会議はPowerPointではなく、LogicTreeの画面を映しながら「過去の言い訳」ではなく「未来のリカバリー策」を議論する場に変わります。</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link href="/login" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold shadow-lg hover:shadow-xl transition-all">
            あなたのビジネスのツリーを作ってみる
          </Link>
        </div>
      </div>
    </div>
  );
}
