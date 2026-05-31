"use client";

import { Bell, User, LogOut, Settings, Menu, Sparkles, LayoutDashboard, Database, Activity, CheckSquare, FolderGit2, Printer, Network, ChevronDown, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentProjectId, projects } = useProjectStore();
  const { currentOrgId, organizations } = useOrgStore();
  const { toggleMobileMenu } = useLayoutStore();

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentOrg = organizations.find(o => o.id === currentOrgId);

  return (
    <header className="h-14 bg-white/80 dark:bg-[#202124]/80 backdrop-blur-xl border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 transition-colors">
      
      {/* 1. Left Section: Breadcrumbs (Logo / Project Switcher) */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-1.5 text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#f1f3f4] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2">
          {/* Organization / Console Link */}
          <Link 
            href={currentOrgId ? `/${currentOrgId}/dashboard` : '/'} 
            className="flex items-center gap-2 group transition-colors hover:bg-slate-100 dark:hover:bg-[#3c4043] px-2 py-1.5 rounded-md"
            title="管理コンソールへ戻る"
          >
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[4px] p-0.5">
              <Network className="w-4 h-4" />
            </div>
            <span className="font-bold text-[14px] text-slate-800 dark:text-slate-200 group-hover:text-strategic-teal transition-colors">
              {currentOrg?.name || 'Gnu.Done'}
            </span>
          </Link>
          
          <span className="text-slate-300 dark:text-slate-600 font-light">/</span>

          {/* Custom Project Switcher Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3c4043] transition-colors max-w-[200px]"
            >
              <span className="truncate">{currentProject?.name || 'プロジェクトを選択'}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''} shrink-0`} />
            </button>

            {isProjectMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProjectMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#2d2f31] border border-slate-200 dark:border-[#3c4043] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider bg-slate-50 dark:bg-[#202124] border-b border-slate-100 dark:border-[#3c4043]">
                    Projects
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (currentOrgId && currentProjectId) {
                            const newPath = pathname.replace(`/${currentOrgId}/p/${currentProjectId}`, `/${currentOrgId}/p/${p.id}`);
                            router.push(newPath);
                          }
                          setIsProjectMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 text-[13px] rounded-md transition-colors flex items-center gap-2 ${p.id === currentProjectId ? 'text-strategic-teal dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#3c4043]'}`}
                      >
                        <FolderGit2 size={14} className={p.id === currentProjectId ? 'text-strategic-teal dark:text-primary-400' : 'text-slate-400'} />
                        <span className="truncate">{p.name}</span>
                        {p.id === currentProjectId && <Check size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Center Section: Floating Segmented Control (App Nav) - REMOVED */}
      <div className="hidden lg:flex flex-none mx-4">
      </div>

      {/* 3. Right Section: Avatar & Settings */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
        
        {/* AI Credits */}
        {currentOrg && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200/50 dark:border-amber-700/50 rounded-full" title="AI クレジット残高">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 font-poppins">
              {currentOrg.aiCreditBalance?.toLocaleString() || 1000}
            </span>
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification */}
        <button className="relative p-1.5 text-slate-500 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-full transition-colors mr-1">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#f28b82] rounded-full border-2 border-white dark:border-[#202124]"></span>
        </button>

        {/* User Avatar Dropdown */}
        {user ? (
          <div className="relative border-l border-slate-200 dark:border-[#3c4043] pl-2 sm:pl-3">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-primary-50 dark:bg-[#8ab4f8]/20 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-[#3c4043] hover:ring-2 hover:ring-slate-300 dark:hover:ring-[#5f6368] transition-all"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-primary-500 dark:text-[#8ab4f8]" />
              )}
            </button>
            
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#2d2f31] border border-slate-200 dark:border-[#3c4043] rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-[#3c4043] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-[#8ab4f8]/20 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-primary-500 dark:text-[#8ab4f8]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-bold text-slate-800 dark:text-[#e8eaed] truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6] truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link href={currentOrgId ? `/${currentOrgId}/settings` : '/'} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-md transition-colors">
                      <Settings size={16} className="text-slate-400" />
                      組織設定
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-[#3c4043] p-1.5">
                    <button 
                      onClick={async () => {
                        await logout();
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <LogOut size={16} />
                      ログアウト
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="border-l border-slate-200 dark:border-[#3c4043] pl-2 sm:pl-3">
            <Link href="/login" className="text-[13px] font-medium text-primary-500 dark:text-[#8ab4f8]">ログイン</Link>
          </div>
        )}
      </div>
    </header>
  );
};

