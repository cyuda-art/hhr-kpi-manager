"use client";

import { Bell, Search, User, LogOut, Link2, Check, Settings, Menu, Calendar, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useKpiStore } from '@/store/useKpiStore';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, Database, Activity, CheckSquare, FolderGit2 } from 'lucide-react';

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentProjectId, projects } = useProjectStore();
  const { currentOrgId } = useOrgStore();
  const { toggleMobileMenu } = useLayoutStore();
  const { currentPeriod, setPeriod, isPredictionMode, togglePredictionMode } = useKpiStore();
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
    <header className="h-16 bg-white dark:bg-[#202124] border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* ロゴ / 管理コンソールへのリンク */}
        <Link 
          href={currentOrgId ? `/${currentOrgId}/projects` : '/'} 
          className="hidden md:flex items-center gap-2 mr-2 group"
          title="管理コンソールへ戻る"
        >
          <div className="w-7 h-7 bg-amber-400 rounded flex items-center justify-center text-slate-900 font-bold shadow-sm transition-transform group-hover:scale-105">
            H
          </div>
          <span className="font-bold text-[15px] text-slate-800 dark:text-slate-200 tracking-tight hidden xl:block group-hover:text-amber-500 transition-colors">
            HHR-KPI
          </span>
        </Link>

        {/* プロジェクト切り替え */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-[#2d2f31] rounded-lg px-3 py-1.5 border border-slate-200 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368] transition-colors max-w-[200px]">
          <FolderGit2 size={16} className="text-primary-500 dark:text-[#8ab4f8] shrink-0" />
          <select 
            value={currentProjectId || ''}
            onChange={(e) => {
              if (e.target.value && currentOrgId && currentProjectId) {
                const newPath = pathname.replace(`/${currentOrgId}/p/${currentProjectId}`, `/${currentOrgId}/p/${e.target.value}`);
                router.push(newPath);
              }
            }}
            className="bg-transparent border-none text-[13px] font-bold text-slate-800 dark:text-[#e8eaed] outline-none cursor-pointer truncate w-full"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-1 overflow-x-auto custom-scrollbar pr-4 pl-2 border-l border-slate-200 dark:border-[#3c4043]">
          <Link href={`/${currentOrgId}/p/${currentProjectId}`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${pathname === `/${currentOrgId}/p/${currentProjectId}` ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <LayoutDashboard size={16} /> ダッシュボード
          </Link>
          <Link href={`/${currentOrgId}/p/${currentProjectId}/trend-report`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${pathname.includes('/trend-report') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <Activity size={16} /> KPIツリー
          </Link>
          <Link href={`/${currentOrgId}/p/${currentProjectId}/data-entry`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${pathname.includes('/data-entry') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <Database size={16} /> シートエディタ
          </Link>
          <Link href={`/${currentOrgId}/p/${currentProjectId}/my-tasks`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${pathname.includes('/my-tasks') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <CheckSquare size={16} /> マイタスク
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-[#2d2f31] rounded-[4px] px-3 py-1.5 border border-slate-200 dark:border-[#3c4043]">
          <Calendar size={16} className="text-slate-500 dark:text-[#9aa0a6]" />
          <select 
            value={currentPeriod}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-800 dark:text-[#e8eaed] cursor-pointer"
          >
            <option value="2026-03">2026年3月 (過去)</option>
            <option value="2026-04">2026年4月 (過去)</option>
            <option value="2026-05">2026年5月 (現在)</option>
          </select>
        </div>
        <button
          onClick={togglePredictionMode}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-all border ${
            isPredictionMode 
              ? 'bg-[#8ab4f8] text-[#202124] border-[#8ab4f8]' 
              : 'bg-slate-50 dark:bg-[#2d2f31] text-slate-500 dark:text-[#9aa0a6] border-slate-200 dark:border-[#3c4043] hover:text-slate-800 dark:hover:text-[#e8eaed] hover:border-slate-300 dark:hover:border-[#5f6368]'
          }`}
        >
          <Sparkles size={16} className={isPredictionMode ? "animate-pulse" : ""} />
          AI未来予測
        </button>
      </div>
      <div className="flex items-center gap-3 md:gap-6">
        {currentProject && (
          <button 
            onClick={handleCopyInviteLink}
            className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-[#2d2f31] text-primary-500 dark:text-[#8ab4f8] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px] text-[13px] font-medium transition-colors border border-slate-200 dark:border-[#3c4043]"
          >
            {isCopied ? <Check size={16} /> : <Link2 size={16} />}
            {isCopied ? 'コピーしました' : '共有リンク'}
          </button>
        )}
        <ThemeToggle />
        
        {/* 管理コンソールへのリンク（アイコン） */}
        <Link 
          href={currentOrgId ? `/${currentOrgId}/projects` : '/'} 
          title="管理コンソール（プロジェクト一覧）" 
          className="text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] transition-colors"
        >
          <FolderKanban size={20} />
        </Link>

        <button className="relative text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#f28b82] rounded-full border border-white dark:border-[#202124]"></span>
        </button>
        <Link href={currentOrgId ? `/${currentOrgId}/settings` : '/'} title="組織設定" className="text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] transition-colors">
          <Settings size={20} />
        </Link>
        {user ? (
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
              <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">経営管理部</span>
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
        ) : (
          <div className="flex items-center pl-3 md:pl-6 border-l border-slate-200 dark:border-[#3c4043]">
            <Link href="/login" className="text-[13px] font-medium text-primary-500 dark:text-[#8ab4f8]">ログイン</Link>
          </div>
        )}
      </div>
    </header>
  );
};
