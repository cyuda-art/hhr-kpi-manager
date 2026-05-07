"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';

export default function DashboardRootRedirect() {
  const router = useRouter();
  const { currentProjectId, projects, isLoading } = useProjectStore();
  const { currentOrgId, isLoading: isOrgLoading } = useOrgStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading || isOrgLoading) return;

    if (currentOrgId) {
      if (currentProjectId) {
        // 最後に開いていたプロジェクトにリダイレクト
        router.replace(`/${currentOrgId}/p/${currentProjectId}`);
      } else if (projects.length > 0) {
        // プロジェクトがある場合は最初のプロジェクトにリダイレクト
        router.replace(`/${currentOrgId}/p/${projects[0].id}`);
      } else {
        // プロジェクトがない場合は作成画面（プロジェクト一覧）へ
        router.replace(`/${currentOrgId}/projects`);
      }
    } else {
      // 組織が存在しない場合は組織作成（または初期プロジェクト一覧）へ
      router.replace('/org-setup');
    }
  }, [mounted, isLoading, isOrgLoading, currentProjectId, currentOrgId, projects, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">プロジェクトを読み込み中...</p>
      </div>
    </div>
  );
}
