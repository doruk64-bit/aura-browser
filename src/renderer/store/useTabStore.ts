/**
 * useTabStore — Sekme yönetimi için Zustand store
 *
 * Açık sekmeler, aktif sekme, yükleme durumları ve
 * navigasyon bilgilerini tutar.
 */

import { create } from 'zustand';

export interface Tab {
  id: number;
  title: string;
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  favicon?: string;
  isIncognito?: boolean;
  workspaceId?: string;
  isPinned?: boolean;
}

interface TabState {
  tabs: Tab[];
  activeTabId: number | null;
  activeWorkspaceId: string; // Added
  setTabs: (tabs: Tab[], activeTabId: number | null, activeWorkspaceId?: string) => void;
  updateTabUrl: (tabId: number, url: string) => void;
  updateTabTitle: (tabId: number, title: string) => void;
  updateTabLoading: (tabId: number, isLoading: boolean) => void;
  reorderTabs: (activeId: number, overId: number) => void;
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [],
  activeTabId: null,
  activeWorkspaceId: 'default', // Added

  setTabs: (tabs, activeTabId, activeWorkspaceId) =>
    set((state) => ({ 
      tabs, 
      activeTabId, 
      activeWorkspaceId: activeWorkspaceId || state.activeWorkspaceId 
    })),

  updateTabUrl: (tabId, url) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, url } : tab
      ),
    })),

  updateTabTitle: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, title } : tab
      ),
    })),

  updateTabLoading: (tabId, isLoading) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, isLoading } : tab
      ),
    })),

  reorderTabs: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.tabs.findIndex((t) => t.id === activeId);
      const newIndex = state.tabs.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;

      const newTabs = [...state.tabs];
      const [movedTab] = newTabs.splice(oldIndex, 1);
      newTabs.splice(newIndex, 0, movedTab);

      return { tabs: newTabs };
    }),
}));
