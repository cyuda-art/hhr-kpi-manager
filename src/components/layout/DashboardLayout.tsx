"use client";

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLayoutStore } from '@/store/useLayoutStore';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarWidth, isSidebarCollapsed, themeColor } = useLayoutStore();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#202124] flex transition-colors w-full overflow-hidden">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0"
        style={{ marginLeft: isMobile ? 0 : (isSidebarCollapsed ? 80 : sidebarWidth) }}
      >
        <Header />
        <main className="flex-1 bg-[#202124] text-[#e8eaed] p-4 md:p-8 transition-colors max-w-full overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
