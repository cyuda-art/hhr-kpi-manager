"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';

export default function DashboardRootRedirect() {
  const router = useRouter();
  const { currentProjectId, projects, isLoading } = useProjectStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (currentProjectId) {
      // 最後に開いていたプロジェクトにリダイレクト
      router.replace(`/p/${currentProjectId}`);
    } else if (projects.length > 0) {
      // プロジェクトがある場合は最初のプロジェクトにリダイレクト
      router.replace(`/p/${projects[0].id}`);
    } else {
      // プロジェクトがない場合は作成画面へ
      router.replace('/projects');
    }
  }, [mounted, isLoading, currentProjectId, projects, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">プロジェクトを読み込み中...</p>
      </div>
    </div>
  );
}
