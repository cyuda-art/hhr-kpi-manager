"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { organizations, isLoading: isOrgLoading } = useOrgStore();
  const { currentProjectId, isLoading: isProjectLoading } = useProjectStore();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (isOrgLoading) return;

    // 組織がない場合は組織作成画面へ
    if (organizations.length === 0 && pathname !== '/org-setup') {
      router.push('/org-setup');
      return;
    }

    // 組織はあるがプロジェクトが未選択の場合はプロジェクト選択画面へ
    if (organizations.length > 0 && !currentProjectId && !isProjectLoading && pathname !== '/projects' && pathname !== '/org-setup') {
      router.push('/projects');
      return;
    }

  }, [user, isAuthLoading, isOrgLoading, organizations, pathname, router, currentProjectId, isProjectLoading]);

  // ローディング中、またはリダイレクト条件に引っかかっている場合は何も表示しない（チラつき防止）
  if (isAuthLoading || (!user)) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  // 組織情報ロード中も待つ
  if (isOrgLoading && organizations.length === 0) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Organizations...</div>;
  }

  return <>{children}</>;
};
