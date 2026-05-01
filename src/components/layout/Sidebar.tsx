"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Network, Settings, Building2, Utensils, ShoppingBag, ChefHat, Bath, Database, FolderKanban } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';

export const Sidebar = () => {
  const pathname = usePathname();
  const { currentProjectId, projects } = useProjectStore();
  const currentProject = projects.find(p => p.id === currentProjectId);

  const menuItems = [
    { name: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    { name: 'KPIツリー', icon: Network, path: '/tree' },
    { name: 'データ入力', icon: Database, path: '/data-entry' },
  ];

  const businessUnits = [
    { name: '宿泊', icon: Building2 },
    { name: '温浴', icon: Bath },
    { name: '飲食', icon: Utensils },
    { name: '物販', icon: ShoppingBag },
    { name: 'セントラルキッチン', icon: ChefHat },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wider mb-2">HHR-KPI MANAGER</h1>
        {currentProject && (
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center gap-2">
            <FolderKanban size={16} className="text-indigo-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-200 truncate" title={currentProject.name}>
              {currentProject.name}
            </span>
          </div>
        )}
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
        
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Business Units</p>
          {businessUnits.map((item) => (
            <button
              key={item.name}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <item.icon size={18} className="text-slate-400" />
              <span className="text-sm">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link href="/projects" className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left text-sm text-slate-400">
          <FolderKanban size={18} />
          <span>プロジェクトを切り替え</span>
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left">
          <Settings size={20} />
          <span>設定</span>
        </button>
      </div>
    </aside>
  );
};
