"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, FolderKanban, Activity, ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, Settings, Network, CheckSquare } from 'lucide-react';
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
    { id: 'trend-report', label: '時系列レポート', icon: Activity, path: '/trend-report' },
    { id: 'my-tasks', label: '私のタスク', icon: CheckSquare, path: '/my-tasks' },
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
          className={`w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-[4px] transition-colors text-left ${
            isSelected ? 'bg-[#8ab4f8]/10 text-[#8ab4f8]' : 'hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div 
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={(e) => hasChildren && toggleExplorerNode(node.id, e)}
          >
            {hasChildren && (
              isCollapsed ? <ChevronRight size={14} className={isSelected ? 'text-[#8ab4f8]' : 'text-[#9aa0a6]'} /> : <ChevronDown size={14} className={isSelected ? 'text-[#8ab4f8]' : 'text-[#9aa0a6]'} />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className={`text-[12px] truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
              {node.name}
            </span>
          </div>
          {isWarning && <div className="w-1.5 h-1.5 rounded-full bg-[#f28b82] ml-auto flex-shrink-0"></div>}
        </button>
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col mt-0.5">
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
          className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        style={{ width: isSidebarCollapsed ? 80 : sidebarWidth }}
        className={`h-screen bg-[#202124] text-[#9aa0a6] flex flex-col fixed left-0 top-0 border-r border-[#3c4043] transition-all duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isResizing ? 'select-none' : ''}`}
      >
      <div 
        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-[#8ab4f8] active:bg-[#8ab4f8] z-50 transition-colors"
        onMouseDown={() => setIsResizing(true)}
        onDoubleClick={() => setSidebarWidth(256)}
      />

      <div className="h-16 flex items-center px-4 md:px-6 border-b border-[#3c4043]">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-6 h-6 bg-[#fbbc04] rounded-[4px] flex items-center justify-center flex-shrink-0">
              <span className="text-[#202124] font-bold text-[12px]">H</span>
            </div>
            <h1 className="text-[16px] font-medium text-[#e8eaed] truncate">HHR-KPI</h1>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-6 h-6 bg-[#fbbc04] rounded-[4px] flex items-center justify-center">
              <span className="text-[#202124] font-bold text-[12px]">H</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-6">
          {!isSidebarCollapsed && <p className="text-[11px] font-medium text-[#9aa0a6] mb-2 uppercase tracking-wider px-3">組織・プロジェクト</p>}
          <div className={`flex ${isSidebarCollapsed ? 'justify-center' : 'items-center justify-between'} p-2 rounded-[4px] bg-[#2d2f31] border border-[#3c4043]`}>
            {isSidebarCollapsed ? (
              <div className="w-8 h-8 rounded-[4px] bg-[#3c4043] flex items-center justify-center font-bold text-[#e8eaed] text-[12px]">
                {currentOrg?.name?.charAt(0) || 'O'}
              </div>
            ) : (
              <>
                <div className="flex flex-col overflow-hidden px-1">
                  <span className="text-[10px] text-[#9aa0a6] font-medium uppercase truncate">{currentOrg?.name || '組織未設定'}</span>
                  <span className="text-[13px] font-medium text-[#e8eaed] truncate">{currentProject?.name || 'プロジェクトを選択'}</span>
                </div>
                <ChevronRight size={16} className="text-[#9aa0a6]" />
              </>
            )}
          </div>
        </div>

        <nav className="space-y-0.5 mb-8">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-[4px] transition-colors text-[13px] font-medium ${
                  isActive ? 'bg-[#8ab4f8]/10 text-[#8ab4f8]' : 'hover:bg-[#3c4043] hover:text-[#e8eaed] text-[#9aa0a6]'
                }`}
              >
                <item.icon size={18} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!isSidebarCollapsed && rootNodes.length > 0 && (
          <div className="mt-6 mb-4">
            <div className="px-3 mb-2 flex items-center gap-2 text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider">
              <Network size={14} />
              <span>KPI エクスプローラー</span>
            </div>
            <div className="flex flex-col space-y-0.5 px-1 overflow-x-hidden">
              {rootNodes.map(node => renderExplorerNode(node, 0))}
            </div>
          </div>
        )}

        {isSidebarCollapsed && rootNodes.length > 0 && (
          <div className="mt-6 flex justify-center text-[#9aa0a6]" title="KPI エクスプローラー">
            <Network size={18} />
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#3c4043] space-y-0.5">
        <Link href="/projects" className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 w-full rounded-[4px] hover:bg-[#3c4043] hover:text-[#e8eaed] transition-colors text-left text-[13px] font-medium text-[#9aa0a6]`} title={isSidebarCollapsed ? "プロジェクト切替" : undefined}>
          <FolderKanban size={16} />
          {!isSidebarCollapsed && <span>プロジェクト切替</span>}
        </Link>
        <Link href="/settings" className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 w-full rounded-[4px] hover:bg-[#3c4043] hover:text-[#e8eaed] transition-colors text-left text-[13px] font-medium text-[#9aa0a6]`} title={isSidebarCollapsed ? "組織設定" : undefined}>
          <Settings size={16} />
          {!isSidebarCollapsed && <span>組織設定</span>}
        </Link>
        <button 
          onClick={toggleSidebar}
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-[4px] hover:bg-[#3c4043] transition-colors text-[#9aa0a6] hover:text-[#e8eaed] mt-2`}
          title={isSidebarCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={16} />}
          {!isSidebarCollapsed && <span className="text-[13px] font-medium">折りたたむ</span>}
        </button>
      </div>
    </aside>
    </>
  );
};
