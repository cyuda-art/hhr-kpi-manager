"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useLayoutStore } from '@/store/useLayoutStore';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { initializeDB } = useKpiStore();
  const { user, isLoading: isAuthLoading, initializeAuth } = useAuthStore();
  const { currentProjectId, isLoading: isProjectLoading } = useProjectStore();
  const { organizations, isLoading: isOrgLoading, initializeOrgs } = useOrgStore();
  const { sidebarWidth, isSidebarCollapsed } = useLayoutStore();
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
      const isPublicPath = pathname === '/login' || pathname.startsWith('/invite') || pathname.startsWith('/invite-org');
      
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
  if (pathname === '/login' || pathname === '/projects' || pathname === '/onboarding' || pathname === '/org-setup' || pathname.startsWith('/invite') || pathname.startsWith('/invite-org')) {
    return <>{children}</>;
  }

  // 未ログインの場合は何も表示しない（リダイレクトが走るまで）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out w-full md:w-auto md:ml-0"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? (isSidebarCollapsed ? 80 : sidebarWidth) : 0 }}
      >
        <Header />
        <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-8 transition-colors max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
