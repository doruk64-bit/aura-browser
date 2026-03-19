/**
 * IPC Handlers — Main process tarafındaki IPC dinleyicileri
 *
 * Renderer'dan gelen istekleri (invoke) karşılar ve
 * uygun TabManager/WindowManager/Engine metodlarını çağırır.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { WindowManager } from '../window/WindowManager';
import { HistoryManager } from '../engine/history';
import { BookmarkManager } from '../engine/bookmarks';
import { FindInPage } from '../engine/search';
import { AdBlocker } from '../engine/adblocker';
import { DownloadManager } from '../engine/downloads';
import { workspaceManager } from '../engine/workspace';
import { app } from 'electron';

const windowManagers = new Map<number, any>();
let activeWindowManager: any = null;

export function registerIPCHandlers(windowManager: WindowManager, adBlocker: AdBlocker | null): void {
  activeWindowManager = windowManager;
  const win = windowManager.getMainWindow();
  if (win) {
    windowManagers.set(win.id, windowManager);
  }

  app.on('browser-window-focus', (_event, focusWin) => {
    const wm = windowManagers.get(focusWin.id);
    if (wm) activeWindowManager = wm;
  });

  const getTabManager = () => activeWindowManager?.getTabManager() ?? windowManager.getTabManager();
  const historyManager = new HistoryManager();
  const bookmarkManager = new BookmarkManager();
  const findInPage = new FindInPage();
  const downloadManager = new DownloadManager(windowManager.getMainWindow()!);

  // ─── Geçmiş Kaydı Entegrasyonu ───
  const tm = getTabManager();
  const fs = require('fs');
  const logPath = 'C:\\Users\\bseester\\tarayıcı\\nav_log.txt';
  try {
    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] registerIPCHandlers: tmExists=${!!tm}\n`);
  } catch {}

  if (tm) {
    tm.setOnNavigate((url: string, title: string) => {
      const fs = require('fs');
      const logPath = 'C:\\Users\\bseester\\tarayıcı\\nav_log.txt';
      try {
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] tm.onNavigate: url="${url}" title="${title}"\n`);
      } catch {}
      historyManager.addVisit(url, title || 'Yeni Sekme');
    });
  }

  // ─── Sekme Yönetimi ───

  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, url?: string) => {
    const tabManager = getTabManager();
    if (!tabManager) return null;
    const tabId = tabManager.createTab(url || 'about:blank');
    return tabId;
  });

  ipcMain.handle(IPC_CHANNELS.TAB_CLOSE, (_event, tabId: number) => {
    const tabManager = getTabManager();
    if (!tabManager) return;
    tabManager.closeTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_SWITCH, (_event, tabId: number) => {
    const tabManager = getTabManager();
    if (!tabManager) return;
    tabManager.switchToTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_LIST, () => {
    const tabManager = getTabManager();
    if (!tabManager) return { tabs: [], activeTabId: null };
    return {
      tabs: tabManager.getTabList(),
      activeTabId: tabManager.getActiveTabId(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.TAB_REORDER, (_event, activeId: number, overId: number) => {
    getTabManager()?.reorderTabs(activeId, overId);
  });

  ipcMain.handle('tab:show-context-menu', (_event, tabId: number) => {
    const tabManager = getTabManager();
    const win = windowManager.getMainWindow();
    if (!tabManager || !win) return;

    const { Menu } = require('electron');
    const template = [
      {
        label: 'Yeni Sekme',
        click: () => tabManager.createTab('about:blank')
      },
      { type: 'separator' },
      {
        label: 'Diğerlerini Kapat',
        click: () => tabManager.closeOtherTabs(tabId)
      },
      {
        label: 'Sağdaki Sekmeleri Kapat',
        click: () => tabManager.closeTabsToRight(tabId)
      },
      { type: 'separator' },
      {
        label: 'Kapat',
        click: () => tabManager.closeTab(tabId)
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: win });
  });

  // ─── Navigasyon ───

  ipcMain.handle(IPC_CHANNELS.NAV_GO, (_event, url: string) => {
    console.log('[DEBUG] IPC_CHANNELS.NAV_GO handler triggered with URL:', url);
    const tabManager = getTabManager();
    tabManager?.goToUrl(url);
  });

  ipcMain.handle(IPC_CHANNELS.NAV_BACK, () => {
    getTabManager()?.goBack();
  });

  ipcMain.handle(IPC_CHANNELS.NAV_FORWARD, () => {
    getTabManager()?.goForward();
  });

  ipcMain.handle(IPC_CHANNELS.NAV_RELOAD, () => {
    getTabManager()?.reload();
  });

  ipcMain.handle(IPC_CHANNELS.NAV_STOP, () => {
    getTabManager()?.stop();
  });

  // ─── Pencere Kontrolleri ───

  ipcMain.handle(IPC_CHANNELS.WIN_MINIMIZE, () => {
    windowManager.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WIN_MAXIMIZE, () => {
    windowManager.maximize();
  });

  ipcMain.handle(IPC_CHANNELS.WIN_CLOSE, () => {
    windowManager.close();
  });

  ipcMain.handle(IPC_CHANNELS.WIN_IS_MAXIMIZED, () => {
    return windowManager.isMaximized();
  });

  // ─── Geçmiş ───

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, (_event, limit?: number) => {
    const fs = require('fs');
    const logPath = 'C:\\Users\\bseester\\tarayıcı\\nav_log.txt';
    const items = historyManager.getHistory(limit || 100);
    try {
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] HISTORY_GET: count=${items.length}\n`);
    } catch {}
    return items;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    historyManager.clearAll();
  });

  // ─── İndirmeler ───
  ipcMain.handle('downloads:get', (_event, limit?: number) => {
    return downloadManager.getDownloads(limit || 50);
  });

  ipcMain.handle('downloads:test', () => {
    const win = windowManager.getMainWindow();
    if (win) {
      win.webContents.downloadURL('https://raw.githubusercontent.com/electron/electron/main/README.md');
    }
    return true;
  });

  // ─── Yer İmleri ───

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET, () => {
    const workspaceId = getTabManager()?.activeWorkspace || 'default';
    return bookmarkManager.getAll(workspaceId);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_ADD, (_event, url: string, title: string, folder?: string) => {
    const workspaceId = getTabManager()?.activeWorkspace || 'default';
    return bookmarkManager.add(url, title, workspaceId, folder);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_REMOVE, (_event, id: number) => {
    bookmarkManager.remove(id);
  });

  // ─── Sayfa İçi Arama ───

  ipcMain.handle(IPC_CHANNELS.FIND_IN_PAGE, (_event, text: string) => {
    const wc = getTabManager()?.getActiveWebContents();
    if (wc && text) {
      findInPage.find(wc, text);
    }
  });

  ipcMain.handle(IPC_CHANNELS.FIND_STOP, () => {
    const wc = getTabManager()?.getActiveWebContents();
    if (wc) findInPage.stop(wc);
  });

  // ─── Sidebar Genişliği Yönetimi ───
  ipcMain.handle('sidebar:set-width', (_event, width: number) => {
    getTabManager()?.setSidebarPanelWidth(width);
  });

  // ─── Dal 4: Gelişmiş Özellikler ───

  ipcMain.handle('app:new-incognito-window', () => {
    // Yeni bir gizli WindowManager başlat
    const incognitoWin = new WindowManager(true);
    const win = incognitoWin.createMainWindow();
    windowManagers.set(win.id, incognitoWin);
  });

  ipcMain.handle('adblock:toggle', () => {
    return adBlocker?.toggle() ?? false;
  });

  ipcMain.handle('adblock:status', () => {
    return adBlocker?.isEnabled() ?? false;
  });

  ipcMain.handle('workspace:get-all', () => {
    return workspaceManager.getWorkspaces();
  });

  ipcMain.handle('workspace:get-active', () => {
    return workspaceManager.getActiveWorkspace();
  });

  ipcMain.handle('workspace:set-active', (_event, id: string) => {
    workspaceManager.setActiveWorkspace(id);
    const tm = getTabManager();
    if (tm) {
      tm.activeWorkspace = id;
      const workspaceTabs = tm.getTabList();
      if (workspaceTabs.length > 0) {
        tm.switchToTab(workspaceTabs[0].id);
      } else {
        tm.createTab('about:blank');
      }
    }
  });

  ipcMain.handle('workspace:add', (_event, name: string, icon?: string) => {
    return workspaceManager.addWorkspace(name, icon);
  });

  ipcMain.handle('workspace:remove', (_event, id: string) => {
    workspaceManager.removeWorkspace(id);
  });
}
