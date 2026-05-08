"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardRootRedirect() {
  const router = useRouter();
  const { currentProjectId, projects, isLoading } = useProjectStore();
  const { currentOrgId, isLoading: isOrgLoading } = useOrgStore();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isAuthLoading || isOrgLoading || (user && isLoading)) return;

    if (!user) {
      router.replace('/lp');
      return;
    }

    if (currentOrgId) {
      // 組織のプロジェクト一覧へ一律リダイレクト
      router.replace(`/${currentOrgId}/projects`);
    } else {
      // 組織が存在しない場合は組織作成（または初期プロジェクト一覧）へ
      router.replace('/org-setup');
    }
  }, [mounted, isAuthLoading, user, isLoading, isOrgLoading, currentProjectId, currentOrgId, projects, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">プロジェクトを読み込み中...</p>
      </div>
    </div>
  );
}
