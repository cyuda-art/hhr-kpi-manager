"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { useLayoutStore } from '@/store/useLayoutStore';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarWidth, isSidebarCollapsed, themeColor } = useLayoutStore();
  const [isMobile, setIsMobile] = useState(true);
  const pathname = usePathname();

  const isKpiTreePage = pathname?.endsWith('/kpi-tree');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="h-screen bg-slate-50 dark:bg-[#202124] flex w-full overflow-hidden transition-colors duration-300">
      <PaywallModal />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 h-full">
        {!isKpiTreePage && <Header />}
        <main className={`flex-1 text-slate-800 dark:text-[#e8eaed] transition-colors relative ${isKpiTreePage ? 'h-screen bg-transparent' : 'h-[calc(100vh-64px)] overflow-auto bg-slate-50 dark:bg-[#202124]'} w-full`}>
          {children}
        </main>
      </div>
    </div>
  );
};
