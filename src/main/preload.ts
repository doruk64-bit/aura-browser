/**
 * Preload Script — Güvenli IPC Köprüsü
 *
 * contextBridge ile renderer'a güvenli bir API sunar.
 * Node.js API'leri renderer'a ASLA doğrudan açılmaz.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';

/**
 * Renderer'a açılan güvenli API
 * window.electronAPI olarak erişilebilir
 */
const electronAPI = {
  // ─── Sekme Yönetimi ───
  tabs: {
    create: (url?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TAB_CREATE, url),
    close: (tabId: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.TAB_CLOSE, tabId),
    switchTo: (tabId: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.TAB_SWITCH, tabId),
    getList: () =>
      ipcRenderer.invoke(IPC_CHANNELS.TAB_LIST),
    reorder: (activeId: number, overId: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.TAB_REORDER, activeId, overId),
    showContextMenu: (tabId: number) =>
      ipcRenderer.invoke('tab:show-context-menu', tabId),
    onUpdate: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.TAB_UPDATE, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TAB_UPDATE, listener);
    },
  },

  // ─── Navigasyon ───
  nav: {
    go: (url: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.NAV_GO, url),
    back: () =>
      ipcRenderer.invoke(IPC_CHANNELS.NAV_BACK),
    forward: () =>
      ipcRenderer.invoke(IPC_CHANNELS.NAV_FORWARD),
    reload: () =>
      ipcRenderer.invoke(IPC_CHANNELS.NAV_RELOAD),
    stop: () =>
      ipcRenderer.invoke(IPC_CHANNELS.NAV_STOP),
    onUrlUpdated: (callback: (data: { tabId: number; url: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { tabId: number; url: string }) =>
        callback(data);
      ipcRenderer.on(IPC_CHANNELS.NAV_URL_UPDATED, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.NAV_URL_UPDATED, listener);
    },
    onLoading: (callback: (data: { tabId: number; isLoading: boolean }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { tabId: number; isLoading: boolean }) =>
        callback(data);
      ipcRenderer.on(IPC_CHANNELS.NAV_LOADING, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.NAV_LOADING, listener);
    },
    onTitleUpdated: (callback: (data: { tabId: number; title: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { tabId: number; title: string }) =>
        callback(data);
      ipcRenderer.on(IPC_CHANNELS.NAV_TITLE_UPDATED, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.NAV_TITLE_UPDATED, listener);
    },
  },

  // ─── Pencere Kontrolleri ───
  window: {
    minimize: () =>
      ipcRenderer.invoke(IPC_CHANNELS.WIN_MINIMIZE),
    maximize: () =>
      ipcRenderer.invoke(IPC_CHANNELS.WIN_MAXIMIZE),
    close: () =>
      ipcRenderer.invoke(IPC_CHANNELS.WIN_CLOSE),
    isMaximized: () =>
      ipcRenderer.invoke(IPC_CHANNELS.WIN_IS_MAXIMIZED),
    onStateChanged: (callback: (data: { isMaximized: boolean }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { isMaximized: boolean }) =>
        callback(data);
      ipcRenderer.on(IPC_CHANNELS.WIN_STATE_CHANGED, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WIN_STATE_CHANGED, listener);
    },
  },

  // ─── Geçmiş ───
  history: {
    get: (limit?: number) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET, limit),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
  },

  // ─── Yer İmleri ───
  bookmarks: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_GET),
    add: (url: string, title: string, folder?: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_ADD, url, title, folder),
    remove: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_REMOVE, id),
  },

  // ─── İndirmeler ───
  downloads: {
    get: (limit?: number) => ipcRenderer.invoke('downloads:get'),
    test: () => ipcRenderer.invoke('downloads:test'),
    onStart: (callback: (data: any) => void) => {
      const listener = (_e: any, d: any) => callback(d);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_START, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_START, listener);
    },
    onProgress: (callback: (data: any) => void) => {
      const listener = (_e: any, d: any) => callback(d);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_PROGRESS, listener);
    },
    onComplete: (callback: (data: any) => void) => {
      const listener = (_e: any, d: any) => callback(d);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_COMPLETE, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_COMPLETE, listener);
    },
  },

  // ─── Sayfa İçi Arama ───
  find: {
    inPage: (text: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_IN_PAGE, text),
    stop: () =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_STOP),
  },

  // ─── Dal 4: Gelişmiş Özellikler ───
  system: {
    newIncognitoWindow: () => ipcRenderer.invoke('app:new-incognito-window'),
  },
  adblock: {
    toggle: () => ipcRenderer.invoke('adblock:toggle'),
    getStatus: () => ipcRenderer.invoke('adblock:status'),
  },
  workspace: {
    getAll: () => ipcRenderer.invoke('workspace:get-all'),
    getActive: () => ipcRenderer.invoke('workspace:get-active'),
    setActive: (id: string) => ipcRenderer.invoke('workspace:set-active', id),
    add: (name: string, icon?: string) => ipcRenderer.invoke('workspace:add', name, icon),
    remove: (id: string) => ipcRenderer.invoke('workspace:remove', id),
  },
  sidebar: {
    setPanelWidth: (width: number) => ipcRenderer.invoke('sidebar:set-width', width),
  },

  // ─── Platform Bilgisi ───
  platform: process.platform as 'win32' | 'darwin' | 'linux',
};

// Güvenli köprü ile window.electronAPI olarak dışa aktar
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript tipi — renderer tarafında kullanılacak
export type ElectronAPI = typeof electronAPI;
