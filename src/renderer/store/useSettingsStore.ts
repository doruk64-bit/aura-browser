/**
 * useSettingsStore — Uygulama ayarları için Zustand store
 * Persist middleware ile ayarlar localStorage'a kaydedilir.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const ACCENT_PRESETS = [
  { name: 'İndigo', value: '#6366f1' },
  { name: 'Mavi', value: '#3b82f6' },
  { name: 'Camgöbeği', value: '#06b6d4' },
  { name: 'Yeşil', value: '#22c55e' },
  { name: 'Turuncu', value: '#f97316' },
  { name: 'Pembe', value: '#ec4899' },
  { name: 'Kırmızı', value: '#ef4444' },
  { name: 'Mor', value: '#a855f7' },
] as const;

// Opera GX tarzı tam temalar (Kullanıcı İsteği)
export const GX_THEMES = [
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '✨',
    accent: '#a78bfa',
    bg: '#0a0a1a',
    bgSecondary: '#12122b',
    preview: 'linear-gradient(135deg, #4f46e5 0%, #a78bfa 50%, #34d399 100%)',
    bgGradient: 'radial-gradient(circle at 15% 35%, rgba(52, 211, 153, 0.25), transparent 50%), radial-gradient(circle at 85% 65%, rgba(167, 139, 250, 0.25), transparent 50%), radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15), transparent 80%), #0a0a1a',
  },
  {
    id: 'horizon',
    name: 'Horizon',
    emoji: '🌌',
    accent: '#fbbf24',
    bg: '#050510',
    bgSecondary: '#0d0d26',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #fbbf24 100%)',
    bgGradient: 'radial-gradient(circle at bottom, rgba(251, 191, 36, 0.12), transparent 70%), radial-gradient(circle at 75% 15%, rgba(49, 46, 129, 0.4), transparent 80%), #050510',
  },
  {
    id: 'flow',
    name: 'Flow',
    emoji: '🌊',
    accent: '#f43f5e',
    bg: '#0d0216',
    bgSecondary: '#1a052e',
    preview: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #f97316 100%)',
    bgGradient: 'radial-gradient(circle at 10% 20%, rgba(244, 63, 94, 0.3), transparent 60%), radial-gradient(circle at 90% 80%, rgba(249, 115, 22, 0.2), transparent 60%), radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 80%), #0d0216',
  },
  {
    id: 'mystic',
    name: 'Mystic',
    emoji: '🌲',
    accent: '#10b981',
    bg: '#08100a',
    bgSecondary: '#121c15',
    preview: 'linear-gradient(135deg, #064e3b 0%, #10b981 60%, #a7f3d0 100%)',
    bgGradient: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.12), transparent 80%), radial-gradient(circle at 25% 75%, rgba(4, 120, 87, 0.2), transparent 60%), #08100a',
  },
] as const;

export type GXThemeId = typeof GX_THEMES[number]['id'];

export const SEARCH_ENGINES = [
  { name: 'Google', value: 'google', url: 'https://www.google.com/search?q=' },
  { name: 'Bing', value: 'bing', url: 'https://www.bing.com/search?q=' },
  { name: 'DuckDuckGo', value: 'duckduckgo', url: 'https://duckduckgo.com/?q=' },
  { name: 'Yandex', value: 'yandex', url: 'https://yandex.com/search/?text=' },
] as const;

interface SettingsState {
  // Görünüm
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  theme: 'dark' | 'light';
  accentColor: string;
  gxTheme: GXThemeId | ''; // GX tema id, boşsa GX tema uygulanmaz

  // Arama & Başlangıç
  searchEngine: string;
  homepage: string;
  adblockEnabled: boolean;
  tabGroupingEnabled: boolean;
  sidebarPerformanceEnabled: boolean;
  sidebarCleanerEnabled: boolean;

  // Performans
  ramSnoozeTime: number; // 0 = Kapalı, dakika cinsinden
  networkSpeedLimit: number; // 0 = Sınırsız, Mbps cinsinden
  networkLimiterEnabled: boolean;
  maxRamLimit: number; // 0 = Sınırsız, MB cinsinden
  ramLimiterEnabled: boolean;
  ramHardLimit: boolean;
  panicShortcut: string; // "Control+Shift+X"
  panicUrl: string; // Panic anında açılacak URL
  touchpadGesturesEnabled: boolean;


  // Aksiyonlar
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAccentColor: (color: string) => void;
  setGxTheme: (id: GXThemeId | '') => void;
  setSearchEngine: (engine: string) => void;
  setHomepage: (url: string) => void;
  setAdblockEnabled: (enabled: boolean) => void;
  setTabGroupingEnabled: (enabled: boolean) => void;
  setSidebarPerformanceEnabled: (enabled: boolean) => void;
  setSidebarCleanerEnabled: (enabled: boolean) => void;
  setRamSnoozeTime: (time: number) => void;
  setNetworkSpeedLimit: (limit: number) => void;
  setNetworkLimiterEnabled: (enabled: boolean) => void;
  setMaxRamLimit: (limit: number) => void;
  setRamLimiterEnabled: (enabled: boolean) => void;
  setRamHardLimit: (hard: boolean) => void;
  setPanicShortcut: (shortcut: string) => void;
  setPanicUrl: (url: string) => void;
  setTouchpadGesturesEnabled: (enabled: boolean) => void;
}


export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 52,
      theme: 'dark',
      accentColor: '#6366f1',
      gxTheme: '',
      searchEngine: 'google',
      homepage: 'about:blank',
      adblockEnabled: true,
      tabGroupingEnabled: true,
      sidebarPerformanceEnabled: true,
      sidebarCleanerEnabled: false,
      ramSnoozeTime: 0,
      networkSpeedLimit: 0,
      networkLimiterEnabled: false,
      maxRamLimit: 0,
      ramLimiterEnabled: false,
      ramHardLimit: false,
      panicShortcut: 'Control+Shift+X',
      panicUrl: 'https://www.google.com',
      touchpadGesturesEnabled: true,


      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarWidth: (width) =>
        set({ sidebarWidth: width }),

      setTheme: (theme) =>
        set({ theme }),

      setAccentColor: (color) =>
        set({ accentColor: color }),

      setGxTheme: (id) => set({ gxTheme: id }),

      setSearchEngine: (engine) => {
        set({ searchEngine: engine });
        const engineConfig = SEARCH_ENGINES.find(e => e.value === engine) || SEARCH_ENGINES[0];
        (window as any).electronAPI?.system?.setSearchEngineUrl?.(engineConfig.url);
      },

      setHomepage: (url) =>
        set({ homepage: url }),

      setAdblockEnabled: (enabled) =>
        set({ adblockEnabled: enabled }),
      setTabGroupingEnabled: (enabled) =>
        set({ tabGroupingEnabled: enabled }),
      setSidebarPerformanceEnabled: (enabled) =>
        set({ sidebarPerformanceEnabled: enabled }),
      setSidebarCleanerEnabled: (enabled) =>
        set({ sidebarCleanerEnabled: enabled }),

      setRamSnoozeTime: (time) => {
        set({ ramSnoozeTime: time });
        (window as any).electronAPI?.system?.setRamSnoozeTime?.(time);
      },

      setNetworkSpeedLimit: (limit) => {
        set({ networkSpeedLimit: limit });
        (window as any).electronAPI?.system?.setNetworkLimit?.(limit);
      },

      setNetworkLimiterEnabled: (enabled) => {
        set({ networkLimiterEnabled: enabled });
        // Eğer devre dışı bırakılıyorsa hızı 0 yapıp gönder
        const { networkSpeedLimit } = useSettingsStore.getState();
        (window as any).electronAPI?.system?.setNetworkLimit?.(enabled ? networkSpeedLimit : 0);
      },

      setMaxRamLimit: (limit) => {
        set({ maxRamLimit: limit });
        (window as any).electronAPI?.system?.setMaxRamLimit?.(limit);
      },

      setRamLimiterEnabled: (enabled) => {
        set({ ramLimiterEnabled: enabled });
        (window as any).electronAPI?.system?.setRamLimiterEnabled?.(enabled);
      },

      setRamHardLimit: (hard) => {
        set({ ramHardLimit: hard });
        (window as any).electronAPI?.system?.setRamHardLimit?.(hard);
      },

      setPanicShortcut: (shortcut) => {
        set({ panicShortcut: shortcut });
        const { panicUrl } = useSettingsStore.getState();
        (window as any).electronAPI?.system?.setPanicSettings?.(shortcut, panicUrl);
      },
      setPanicUrl: (url) => {
        set({ panicUrl: url });
        const { panicShortcut } = useSettingsStore.getState();
        (window as any).electronAPI?.system?.setPanicSettings?.(panicShortcut, url);
      },
      setTouchpadGesturesEnabled: (enabled) => {
        set({ touchpadGesturesEnabled: enabled });
        (window as any).electronAPI?.system?.setTouchpadGesturesEnabled?.(enabled);
      },
    }),

    {
      name: 'morrow-settings',
      // Sadece kalıcı olması gereken alanları seç
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        gxTheme: state.gxTheme,
        searchEngine: state.searchEngine,
        homepage: state.homepage,
        sidebarCollapsed: state.sidebarCollapsed,
        adblockEnabled: state.adblockEnabled,
        tabGroupingEnabled: state.tabGroupingEnabled,
        sidebarPerformanceEnabled: state.sidebarPerformanceEnabled,
        sidebarCleanerEnabled: state.sidebarCleanerEnabled,
        ramSnoozeTime: state.ramSnoozeTime,
        networkSpeedLimit: state.networkSpeedLimit,
        networkLimiterEnabled: state.networkLimiterEnabled,
        maxRamLimit: state.maxRamLimit,
        ramLimiterEnabled: state.ramLimiterEnabled,
        ramHardLimit: state.ramHardLimit,
        panicShortcut: state.panicShortcut,
        panicUrl: state.panicUrl,
        touchpadGesturesEnabled: state.touchpadGesturesEnabled,
      }),

    }
  )
);
