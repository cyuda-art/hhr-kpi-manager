"use client";

import { useState } from 'react';
import { Bell, User, LogOut, Settings as SettingsIcon, FolderGit2, Check, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export const FloatingUserControls = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentOrgId, organizations } = useOrgStore();
  const { currentProjectId, projects } = useProjectStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  return (
    <div className="flex items-center gap-2 bg-white/20 dark:bg-black/30 backdrop-blur-xl p-1.5 rounded-full border border-white/40 dark:border-white/10 shadow-2xl pointer-events-auto">
      {/* AI Credits */}
      {currentOrg && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/30 dark:bg-black/30 rounded-full" title="AI クレジット残高">
          <Sparkles size={12} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 font-poppins">
            {currentOrg.aiCreditBalance?.toLocaleString() || 1000}
          </span>
        </div>
      )}

      <ThemeToggle />

      <button className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-black/40 rounded-full transition-colors">
        <Bell size={16} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-400 rounded-full border-2 border-white/20 dark:border-black/20"></span>
      </button>

      {user && (
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border border-white/40 dark:border-white/10 hover:ring-2 hover:ring-white/50 transition-all"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-blue-500 dark:text-blue-400" />
            )}
          </button>
          
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute top-full right-0 mt-3 w-64 bg-white/90 dark:bg-[#2d2f31]/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200/50 dark:border-[#3c4043]/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/40 dark:border-white/10">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-blue-500 dark:text-blue-400" />
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

                <div className="p-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</div>
                  <div className="max-h-[150px] overflow-y-auto custom-scrollbar mb-2">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (currentOrgId && currentProjectId) {
                            const newPath = pathname.replace(`/${currentOrgId}/p/${currentProjectId}`, `/${currentOrgId}/p/${p.id}`);
                            router.push(newPath);
                          }
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] rounded-xl transition-colors flex items-center gap-2 ${p.id === currentProjectId ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-black/20'}`}
                      >
                        <FolderGit2 size={14} className={p.id === currentProjectId ? 'text-blue-500' : 'text-slate-400'} />
                        <span className="truncate">{p.name}</span>
                        {p.id === currentProjectId && <Check size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-slate-200/50 dark:bg-[#3c4043]/50 my-1"></div>

                  <Link href={currentOrgId ? `/${currentOrgId}/settings` : '/'} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-black/20 rounded-xl transition-colors mt-1">
                    <SettingsIcon size={14} className="text-slate-400" />
                    組織設定
                  </Link>
                  <button 
                    onClick={async () => {
                      await logout();
                      window.location.href = '/';
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 rounded-xl transition-colors mt-1"
                  >
                    <LogOut size={14} />
                    ログアウト
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
