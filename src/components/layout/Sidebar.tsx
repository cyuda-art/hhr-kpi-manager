"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, FolderKanban, Activity, ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, Settings, Network } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useKpiStore } from '@/store/useKpiStore';
import { useEffect, useRef, useState, useMemo } from 'react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { currentProjectId, projects } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
  const { sidebarWidth, isSidebarCollapsed, setSidebarWidth, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useLayoutStore();
  const { kpiData, selectedNodeId, setSelectedNodeId } = useKpiStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [explorerCollapsed, setExplorerCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      setSidebarWidth(Math.max(200, Math.min(e.clientX, 400)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentOrg = organizations.find(org => org.id === currentOrgId);

  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    { id: 'data-entry', label: 'シートエディタ', icon: Database, path: '/data-entry' },
  ];

  const rootNodes = useMemo(() => {
    return Object.values(kpiData).filter(node => !node.parentId);
  }, [kpiData]);

  const toggleExplorerNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExplorerCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderExplorerNode = (node: any, depth: number = 0) => {
    const children = Object.values(kpiData).filter(n => n.parentId === node.id);
    const hasChildren = children.length > 0;
    const isCollapsed = explorerCollapsed.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isWarning = node.targetValue > 0 && (node.actualValue / node.targetValue) < 0.5;

    return (
      <div key={node.id} className="w-full">
        <button
          onClick={() => setSelectedNodeId(node.id)}
          className={`w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-md transition-colors text-left ${
            isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div 
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={(e) => hasChildren && toggleExplorerNode(node.id, e)}
          >
            {hasChildren && (
              isCollapsed ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className={`text-xs truncate ${isSelected ? 'font-bold text-indigo-300' : 'font-medium'}`}>
              {node.name}
            </span>
          </div>
          {isWarning && <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-auto flex-shrink-0"></div>}
        </button>
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {children.map(child => renderExplorerNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        style={{ width: isSidebarCollapsed ? 80 : sidebarWidth }}
        className={`h-screen bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800 dark:border-slate-900 transition-all duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isResizing ? 'select-none' : ''}`}
      >
      <div 
        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 z-50 transition-colors"
        onMouseDown={() => setIsResizing(true)}
        onDoubleClick={() => setSidebarWidth(256)}
      />

      <div className="p-6 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">H</span>
            </div>
            <h1 className="text-lg font-black text-white tracking-wider truncate">HHR-KPI</h1>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">H</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 overflow-y-auto">
        <div className="mb-6">
          {!isSidebarCollapsed && <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider px-2">組織・プロジェクト</p>}
          <div className={`flex ${isSidebarCollapsed ? 'justify-center' : 'items-center justify-between'} p-3 rounded-xl bg-slate-800/50 border border-slate-700/50`}>
            {isSidebarCollapsed ? (
              <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                {currentOrg?.name?.charAt(0) || 'O'}
              </div>
            ) : (
              <>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{currentOrg?.name || '組織未設定'}</span>
                  <span className="text-sm font-bold text-white truncate">{currentProject?.name || 'プロジェクトを選択'}</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </>
            )}
          </div>
        </div>

        <nav className="space-y-1 mb-8">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <item.icon size={20} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!isSidebarCollapsed && rootNodes.length > 0 && (
          <div className="mt-6 mb-4">
            <div className="px-2 mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Network size={14} />
              <span>KPI エクスプローラー</span>
            </div>
            <div className="flex flex-col space-y-0.5 overflow-x-hidden">
              {rootNodes.map(node => renderExplorerNode(node, 0))}
            </div>
          </div>
        )}

        {isSidebarCollapsed && rootNodes.length > 0 && (
          <div className="mt-6 flex justify-center text-slate-500" title="KPI エクスプローラー">
            <Network size={20} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link href="/projects" className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left text-sm text-slate-400`} title={isSidebarCollapsed ? "プロジェクト切替" : undefined}>
          <FolderKanban size={18} />
          {!isSidebarCollapsed && <span>プロジェクト切替</span>}
        </Link>
        <Link href="/settings" className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left text-sm text-slate-400`} title={isSidebarCollapsed ? "組織設定" : undefined}>
          <Settings size={18} />
          {!isSidebarCollapsed && <span>組織設定</span>}
        </Link>
        <button 
          onClick={toggleSidebar}
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white mt-2`}
          title={isSidebarCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={18} />}
          {!isSidebarCollapsed && <span className="text-sm">折りたたむ</span>}
        </button>
      </div>
    </aside>
    </>
  );
};
