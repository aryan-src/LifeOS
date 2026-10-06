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
}));
