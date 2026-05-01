"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { initializeDB } = useKpiStore();
  const { user, isLoading: isAuthLoading, initializeAuth } = useAuthStore();
  const { currentProjectId, isLoading: isProjectLoading } = useProjectStore();
  const { organizations, isLoading: isOrgLoading, initializeOrgs } = useOrgStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      const unsubscribeOrgs = initializeOrgs(user.uid);
      return () => {
        unsubscribeOrgs();
      };
    }
  }, [user, initializeOrgs]);

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
        // 組織データのロードが終わったらチェック
        if (!isOrgLoading) {
          if (organizations.length === 0 && pathname !== '/org-setup') {
            router.push('/org-setup');
          } else if (organizations.length > 0) {
            // 組織がある場合、プロジェクト未選択ならプロジェクト画面へ
            if (!currentProjectId && pathname !== '/projects' && !isProjectLoading && pathname !== '/org-setup') {
              router.push('/projects');
            }
          }
        }
      }
    }
  }, [user, isAuthLoading, isOrgLoading, organizations, pathname, router, currentProjectId, isProjectLoading]);

  // ローディング中は何かしらのスピナーか空画面を見せる
  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  // ログインページやプロジェクト選択、オンボーディング、組織作成、招待画面の場合はサイドバーなどを表示しない
  if (pathname === '/login' || pathname === '/projects' || pathname === '/onboarding' || pathname === '/org-setup' || pathname.startsWith('/invite')) {
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
