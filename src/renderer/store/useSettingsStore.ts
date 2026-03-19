/**
 * useSettingsStore — Uygulama ayarları için Zustand store
 */

import { create } from 'zustand';

interface SettingsState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarCollapsed: false,
  sidebarWidth: 52,
  theme: 'dark',

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarWidth: (width) =>
    set({ sidebarWidth: width }),

  setTheme: (theme) =>
    set({ theme }),
}));
