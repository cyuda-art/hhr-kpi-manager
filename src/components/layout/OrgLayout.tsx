"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Hexagon, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { ThemeToggle } from './ThemeToggle';
import { AmbientSky } from './AmbientSky';
import { FloatingUserControls } from './FloatingUserControls';


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

      {/* 画面右上：全画面共通のフローティングコントロール */}
      <div className="fixed top-6 right-6 z-[60] pointer-events-auto">
        <FloatingUserControls />
      </div>

      {/* 画面左上：フローティングロゴ */}
      <div className="fixed top-6 left-6 z-[60] pointer-events-auto">
        <Link href={currentOrgId ? `/${currentOrgId}/dashboard` : '/'} className="flex items-center gap-2 bg-white/20 dark:bg-black/30 backdrop-blur-xl px-3 py-2 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl hover:bg-white/30 dark:hover:bg-black/40 transition-all">
          <div className="w-6 h-6 bg-strategic-teal rounded flex items-center justify-center">
            <Hexagon className="text-white" size={14} />
          </div>
          <span className="font-bold text-oxford-navy dark:text-slate-200 tracking-tight text-[14px]">
            {currentOrg ? currentOrg.name : 'Gnu.'}
          </span>
        </Link>
      </div>
      <main className="flex-1 relative z-10 overflow-auto">
        {children}
      </main>
    </div>
  );
};
