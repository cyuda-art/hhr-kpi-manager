"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = localStorage.getItem("hhr_cookie_consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("hhr_cookie_consent", "all");
    setIsVisible(false);
    // Here you would typically initialize GA/Pixel
  };

  const handleRejectAll = () => {
    localStorage.setItem("hhr_cookie_consent", "necessary_only");
    setIsVisible(false);
    // Here you would ensure non-essential cookies are blocked
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#282a2d] border border-slate-200 dark:border-[#3c4043] rounded-xl shadow-2xl p-6 pointer-events-auto flex flex-col md:flex-row gap-6 items-start md:items-center animate-in slide-in-from-bottom-10 fade-in duration-500 relative overflow-hidden">
        
        {/* Subtle background decoration */}
        <div className="absolute -top-10 -right-10 text-slate-50 dark:text-slate-800/50 pointer-events-none">
          <Cookie size={120} />
        </div>

        <div className="flex-1 relative z-10">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Cookie size={16} className="text-strategic-teal" />
            Cookieの利用について
          </h3>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            本サイトでは、ユーザー体験の向上、サイトの利用状況の分析、およびマーケティング活動のために Cookie および類似のトラッキング技術を使用しています。
            [すべて受け入れる] をクリックすると、お使いのデバイスでのすべての Cookie の保存に同意したことになります。
            詳細や設定の変更については、
            <Link href="/privacy" className="text-strategic-teal hover:underline ml-1">プライバシーポリシー</Link>
            をご覧ください。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0 relative z-10 w-full md:w-auto">
          <button 
            onClick={handleRejectAll}
            className="flex-1 md:flex-none px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            すべて拒否する
          </button>
          <button 
            onClick={handleAcceptAll}
            className="flex-1 md:flex-none px-6 py-2 text-[12px] font-bold text-white bg-oxford-navy dark:bg-strategic-teal hover:bg-oxford-navy/90 dark:hover:bg-strategic-teal/90 rounded-lg shadow-sm transition-colors"
          >
            すべて受け入れる
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
