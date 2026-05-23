import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutStore {
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  actionPanelWidth: number;
  isActionPanelCollapsed: boolean;
  showStatusLegend: boolean;
  toggleStatusLegend: () => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setActionPanelWidth: (width: number) => void;
  toggleActionPanel: () => void;
  showMiniMap: boolean;
  toggleMiniMap: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  autoCenter: boolean;
  toggleAutoCenter: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  layoutDirection: 'TB' | 'LR';
  setLayoutDirection: (dir: 'TB' | 'LR') => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      sidebarWidth: 256, // default w-64 = 256px
      isSidebarCollapsed: true, // 初期状態を閉じる
      actionPanelWidth: 320, // default w-80 = 320px
      isActionPanelCollapsed: false,
      showMiniMap: true,
      showStatusLegend: true,
      isMobileMenuOpen: false,

      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(64, Math.min(width, 400)), isSidebarCollapsed: width < 100 }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      
      setActionPanelWidth: (width) => set({ actionPanelWidth: Math.max(0, Math.min(width, 600)), isActionPanelCollapsed: width < 100 }),
      toggleActionPanel: () => set((state) => ({ isActionPanelCollapsed: !state.isActionPanelCollapsed })),

      toggleMiniMap: () => set((state) => ({ showMiniMap: !state.showMiniMap })),
      toggleStatusLegend: () => set((state) => ({ showStatusLegend: !state.showStatusLegend })),
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      
      autoCenter: true,
      toggleAutoCenter: () => set((state) => ({ autoCenter: !state.autoCenter })),
      
      themeColor: 'indigo', // デフォルトテーマ
      setThemeColor: (color) => set({ themeColor: color }),

      layoutDirection: 'TB',
      setLayoutDirection: (dir) => set({ layoutDirection: dir }),
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({ 
        sidebarWidth: state.sidebarWidth, 
        isSidebarCollapsed: state.isSidebarCollapsed,
        actionPanelWidth: state.actionPanelWidth,
        isActionPanelCollapsed: state.isActionPanelCollapsed,
        showMiniMap: state.showMiniMap,
        autoCenter: state.autoCenter,
        themeColor: state.themeColor,
        layoutDirection: state.layoutDirection,
        showStatusLegend: state.showStatusLegend
      }),
    }
  )
);
