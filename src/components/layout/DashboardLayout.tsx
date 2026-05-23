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
        <main className={`flex-1 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] transition-colors relative ${isKpiTreePage ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-y-auto custom-scrollbar'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
