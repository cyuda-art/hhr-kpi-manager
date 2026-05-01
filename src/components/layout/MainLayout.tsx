"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { initializeDB } = useKpiStore();
  const { user, isLoading, initializeAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // データベースと認証の初期化
    initializeDB();
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeDB, initializeAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  // ローディング中は何かしらのスピナーか空画面を見せる
  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  // ログインページの場合はサイドバーなどを表示しない
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 未ログインの場合は何も表示しない（リダイレクトが走るまで）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
