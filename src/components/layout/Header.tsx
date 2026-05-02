"use client";

import { Bell, Search, User, LogOut, Link2, Check, Settings, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import Link from 'next/link';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { currentProjectId, projects } = useProjectStore();
  const { currentOrgId } = useOrgStore();
  const { toggleMobileMenu } = useLayoutStore();
  const [isCopied, setIsCopied] = useState(false);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleCopyInviteLink = () => {
    if (!currentOrgId) return;
    // 組織への招待リンクに変更
    const url = `${window.location.origin}/invite-org/${currentOrgId}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-full px-4 py-2 w-96 border border-slate-200/50 dark:border-slate-700/50">
          <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="指標を検索..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-6">
        {currentProject && (
          <button 
            onClick={handleCopyInviteLink}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded-lg text-sm font-bold transition-colors border border-primary-200 dark:border-primary-800"
          >
            {isCopied ? <Check size={16} /> : <Link2 size={16} />}
            {isCopied ? 'コピーしました' : '共有リンク'}
          </button>
        )}
        <ThemeToggle />
        <button className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <Bell size={20} />
          <span className="absolute 0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <Link href="/settings" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <Settings size={20} />
        </Link>
        <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
              {user?.displayName || user?.email?.split('@')[0] || 'ゲスト'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">経営管理部</span>
          </div>
          <button 
            onClick={logout}
            title="ログアウト"
            className="ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
