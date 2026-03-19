/**
 * Global tip tanımları — Renderer process için
 */

import type { ElectronAPI as OriginalElectronAPI } from '@main/preload';

declare global {
  interface Window {
    electronAPI: OriginalElectronAPI & {
      tabs: OriginalElectronAPI['tabs'] & {
        reorder: (activeId: number, overId: number) => Promise<void>;
        showContextMenu: (tabId: number) => Promise<void>;
      };
    };
  }
}

export {};
