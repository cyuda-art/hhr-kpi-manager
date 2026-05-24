"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Hexagon, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { ThemeToggle } from './ThemeToggle';
import { AmbientSky } from './AmbientSky';

export const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const { organizations, currentOrgId } = useOrgStore();

  const currentOrg = organizations.find(o => o.id === currentOrgId);
  const pathname = usePathname();
  const isKpiTreePage = pathname?.includes('/kpi-tree');

  return (
    <div className="min-h-screen relative flex flex-col font-sans transition-colors overflow-x-hidden text-slate-800 dark:text-slate-200">
      {/* 空間背景を常に敷き詰める */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientSky />
      </div>

      {!isKpiTreePage && (
        <header className="h-16 bg-white/40 dark:bg-[#1a1b1e]/40 backdrop-blur-xl border-b border-white/50 dark:border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={currentOrgId ? `/${currentOrgId}/dashboard` : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-strategic-teal rounded flex items-center justify-center">
              <Hexagon className="text-white" size={20} />
            </div>
            <span className="font-bold text-oxford-navy dark:text-slate-200 tracking-tight text-[18px]">
              {currentOrg ? currentOrg.name : 'Gnu.Done'}
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <ThemeToggle />
          
          {currentOrgId && (
            <Link 
              href={`/${currentOrgId}/settings`}
              className="p-2 text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-full transition-all"
              title="組織設定"
            >
              <Settings size={20} />
            </Link>
          )}
          
          {user && (
            <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-slate-400/30 dark:border-white/10">
              <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-[#8ab4f8]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-primary-500 dark:text-[#8ab4f8]" />
                )}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-[13px] font-medium text-slate-800 dark:text-[#e8eaed] truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                  {currentOrg ? '組織メンバー' : 'ゲスト'}
                </span>
              </div>
              <button 
                onClick={async () => {
                  await logout();
                  window.location.href = '/';
                }}
                title="ログアウト"
                className="ml-2 p-2 text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-full transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>
      )}
      <main className="flex-1 relative z-10 overflow-auto">
        {children}
      </main>
    </div>
  );
};
