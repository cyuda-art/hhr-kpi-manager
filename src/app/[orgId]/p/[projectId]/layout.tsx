"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useKpiStore } from '@/store/useKpiStore';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const orgId = params.orgId as string;
  
  const { currentProjectId, setCurrentProjectId, projects, isLoading } = useProjectStore();
  const { setSelectedNodeId, initializeDB } = useKpiStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    // URLのprojectIdが存在するプロジェクトかどうか確認
    const projectExists = projects.some(p => p.id === projectId);
    
    if (!projectExists && projects.length > 0) {
      // 存在しないプロジェクトIDの場合は最初のプロジェクトにリダイレクト
      router.replace(`/p/${projects[0].id}`);
      return;
    } else if (!projectExists && projects.length === 0) {
      // プロジェクトが1つもない場合は作成画面へ
      router.replace('/');
      return;
    }

    // URLのIDと現在のIDが違う場合は同期する
    if (currentProjectId !== projectId) {
      setCurrentProjectId(projectId);
      setSelectedNodeId(null);
      
      // KPIのDB（Firestore）からの読み込み・初期化もこのタイミングで行う
      initializeDB(projectId, orgId).then(() => {
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, [projectId, orgId, currentProjectId, projects, isLoading, router, setCurrentProjectId, setSelectedNodeId, initializeDB]);

  if (isLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-slate-500">プロジェクトデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
