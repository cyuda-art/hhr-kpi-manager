"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { initializeDB } = useKpiStore();
  const { user, isLoading: isAuthLoading, initializeAuth } = useAuthStore();
  const { currentProjectId, isLoading: isProjectLoading } = useProjectStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    if (user && currentProjectId) {
      initializeDB(currentProjectId);
    }
  }, [user, currentProjectId, initializeDB]);

  useEffect(() => {
    if (!isAuthLoading) {
      const isPublicPath = pathname === '/login' || pathname.startsWith('/invite');
      
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user) {
        // ログイン済みだがプロジェクト未選択の場合はプロジェクト画面へ
        if (!currentProjectId && pathname !== '/projects' && !isProjectLoading) {
          router.push('/projects');
        } else if (currentProjectId && pathname === '/projects') {
          // プロジェクト選択済みなのにプロジェクト一覧にいる場合はダッシュボードへ戻すのもありだが、
          // 別プロジェクトに切り替えたい場合もあるのでここでは何もしない
        }
      }
    }
  }, [user, isAuthLoading, pathname, router, currentProjectId, isProjectLoading]);

  // ローディング中は何かしらのスピナーか空画面を見せる
  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  // ログインページやプロジェクト選択、オンボーディング、招待画面の場合はサイドバーなどを表示しない
  if (pathname === '/login' || pathname === '/projects' || pathname === '/onboarding' || pathname.startsWith('/invite')) {
    return <>{children}</>;
  }

  // 未ログインの場合は何も表示しない（リダイレクトが走るまで）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
