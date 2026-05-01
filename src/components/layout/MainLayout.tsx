"use client";

import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKpiStore } from '@/store/useKpiStore';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { initializeDB } = useKpiStore();

  useEffect(() => {
    initializeDB();
  }, [initializeDB]);

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
