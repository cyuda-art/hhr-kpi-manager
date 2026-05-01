import { create } from 'zustand';

interface LayoutStore {
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  actionPanelWidth: number;
  isActionPanelCollapsed: boolean;
  showMiniMap: boolean;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setActionPanelWidth: (width: number) => void;
  toggleActionPanel: () => void;
  toggleMiniMap: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarWidth: 256, // default w-64 = 256px
  isSidebarCollapsed: false,
  actionPanelWidth: 320, // default w-80 = 320px
  isActionPanelCollapsed: false,
  showMiniMap: true,

  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(64, Math.min(width, 400)), isSidebarCollapsed: width < 100 }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  
  setActionPanelWidth: (width) => set({ actionPanelWidth: Math.max(0, Math.min(width, 600)), isActionPanelCollapsed: width < 100 }),
  toggleActionPanel: () => set((state) => ({ isActionPanelCollapsed: !state.isActionPanelCollapsed })),

  toggleMiniMap: () => set((state) => ({ showMiniMap: !state.showMiniMap })),
}));
