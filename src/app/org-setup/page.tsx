"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Building2, ArrowRight } from 'lucide-react';

export default function OrgSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createOrganization, organizations, isLoading } = useOrgStore();
  const [orgName, setOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 既に組織を持っている場合はプロジェクト一覧へ
    if (!isLoading && organizations.length > 0) {
      router.push('/projects');
    }
  }, [isLoading, organizations, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orgName.trim()) return;

    setIsSubmitting(true);
    try {
      await createOrganization(orgName, user.uid);
      // 作成成功したらプロジェクト一覧へ
      router.push('/projects');
    } catch (error) {
      console.error("Failed to create organization:", error);
      setIsSubmitting(false);
    }
  };

  if (isLoading || organizations.length > 0) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-slate-800/50 relative z-10">
        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">ビジネス情報の登録</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            KPIを管理するあなたの会社や組織の名前を入力してください。後からメンバーを招待することができます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              組織・会社名
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="例：株式会社HHRグループ"
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !orgName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? '登録中...' : '組織を登録して次へ'}
            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
