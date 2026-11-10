import { create } from 'zustand';

interface UIState {
  isQuickCaptureOpen: boolean;
  quickCaptureInitialValue: string;
  openQuickCapture: (initialValue?: string) => void;
  closeQuickCapture: () => void;
  toggleQuickCapture: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  isDockVisible: boolean;
  toggleDock: () => void;
  setDockVisible: (visible: boolean) => void;
  // Modal visibility states for layout shell synchronization
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  isCreateProjectOpen: boolean;
  setCreateProjectOpen: (open: boolean) => void;
  openCreateProject: () => void;
  closeCreateProject: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isQuickCaptureOpen: false,
  quickCaptureInitialValue: '',
  openQuickCapture: (initialValue = '') =>
    set({ isQuickCaptureOpen: true, quickCaptureInitialValue: initialValue }),
  closeQuickCapture: () => set({ isQuickCaptureOpen: false, quickCaptureInitialValue: '' }),
  toggleQuickCapture: () =>
    set((state) => ({ isQuickCaptureOpen: !state.isQuickCaptureOpen, quickCaptureInitialValue: '' })),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  isDockVisible: true,
  toggleDock: () =>
    set((state) => {
      const next = !state.isDockVisible;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lifeos_dock_visible', String(next));
        } catch {}
      }
      return { isDockVisible: next };
    }),
  setDockVisible: (visible: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lifeos_dock_visible', String(visible));
      } catch {}
    }
    set({ isDockVisible: visible });
  },
  isModalOpen: false,
  setModalOpen: (open: boolean) => set({ isModalOpen: open }),
  isCreateProjectOpen: false,
  setCreateProjectOpen: (open: boolean) => set({ isCreateProjectOpen: open }),
  openCreateProject: () => set({ isCreateProjectOpen: true, isModalOpen: true }),
  closeCreateProject: () => set({ isCreateProjectOpen: false, isModalOpen: false }),
}));
