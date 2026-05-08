"use client";

import Link from 'next/link';
import { User, LogOut, Hexagon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { ThemeToggle } from './ThemeToggle';

export const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const { organizations, currentOrgId } = useOrgStore();

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors">
      <header className="h-16 bg-white dark:bg-[#202124] border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-3">
          <Link href={currentOrgId ? `/${currentOrgId}/projects` : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
              <Hexagon className="text-white" size={20} />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-[18px]">
              {currentOrg ? currentOrg.name : 'LogicTree Pro'}
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <ThemeToggle />
          
          {user && (
            <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-slate-200 dark:border-[#3c4043]">
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
                  window.location.href = '/lp';
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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
