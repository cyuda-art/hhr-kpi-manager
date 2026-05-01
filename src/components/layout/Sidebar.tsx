"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Network, Settings, Building2, Utensils, ShoppingBag, ChefHat, Bath, Database, FolderKanban } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';

export const Sidebar = () => {
  const pathname = usePathname();
  const { currentProjectId, projects } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
  
  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentOrg = organizations.find(org => org.id === currentOrgId);

  const menuItems = [
    { name: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    // KPIツリーはダッシュボードに統合されたため削除、代わりにレポートなどのメニューを想定
    { name: 'データ入力', icon: Database, path: '/data-entry' },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-slate-300 h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 dark:border-slate-900 transition-colors z-40 shadow-2xl shadow-indigo-900/20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">H</span>
          </div>
          <h1 className="text-lg font-black text-white tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">HHR-KPI</h1>
        </div>
        
        <div className="space-y-3">
          {/* 組織情報 */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {currentOrg?.name || '組織未設定'}
            </span>
          </div>

          {/* プロジェクト情報 */}
          {currentProject && (
            <div className="bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 dark:border-slate-800/50 flex items-center gap-3 transition-colors shadow-inner group cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-900">
              <div className="p-1.5 bg-indigo-500/20 rounded-md group-hover:bg-indigo-500/30 transition-colors">
                <FolderKanban size={16} className="text-indigo-400 flex-shrink-0" />
              </div>
              <span className="text-sm font-medium text-slate-200 truncate" title={currentProject.name}>
                {currentProject.name}
              </span>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link href="/projects" className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left text-sm text-slate-400">
          <FolderKanban size={18} />
          <span>プロジェクト切替</span>
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left text-sm text-slate-400">
          <Settings size={18} />
          <span>組織設定</span>
        </Link>
      </div>
    </aside>
  );
};
