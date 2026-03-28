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
import { getExtensionManager } from '../engine/extensions';
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
  
  // ─── 1. Performans & Sistem Limitleri (ÖNCELİKLİ) ───
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PERFORMANCE_METRICS, () => {
    try {
      const metrics = app.getAppMetrics();
      const tm = getTabManager();
      if (!tm) return { ramMB: 0, cpuPercent: 0, tabMetrics: [] };

      const activeTabs = tm.getTabList();
      const tabMetrics: { pid: number, name: string, cpu: number, ramMB: number }[] = [];
      
      let totalRamKB = 0;
      let totalCpu = 0;

      // Tüm süreçler için hızlı bir PID haritası çıkar
      const metricsMap = new Map<number, any>();
      for (const m of metrics) {
        metricsMap.set(m.pid, m);
        totalCpu += m.cpu.percentCPUUsage;
        const pMem = m.memory.privateBytes || m.memory.workingSetSize || 0;
        totalRamKB += pMem;
      }

      // Sadece aktif sekmeler için detaylı veri topla
      for (const tab of activeTabs) {
        const view = tm.getTab(tab.id);
        if (!view) continue;

        const pid = view.webContents.getOSProcessId();
        const foundMetric = metricsMap.get(pid);
        
        if (foundMetric) {
          const ramKB = foundMetric.memory.privateBytes || foundMetric.memory.workingSetSize || 0;
          tabMetrics.push({
            pid,
            name: tab.title || new URL(tab.url).hostname || 'Sekme',
            cpu: Math.floor(foundMetric.cpu.percentCPUUsage),
            ramMB: Math.floor(ramKB / 1024)
          });
        }
      }

      return {
        ramMB: Math.floor(totalRamKB / 1024),
        cpuPercent: Math.floor(totalCpu),
        tabMetrics
      };
    } catch (e) {
      console.error('[Performance] Metric collection error:', e);
      return { ramMB: 0, cpuPercent: 0, tabMetrics: [] };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_KILL_PROCESS, (_event, pid: number) => {
    try {
      if (pid) process.kill(pid);
      return true;
    } catch (e) {
      console.error('Failed to kill process', pid, e);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_RAM_LIMITER_ENABLED, (_event, enabled: boolean) => {
    getTabManager()?.setRamLimiterEnabled(enabled);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_RAM_HARD_LIMIT, (_event, hard: boolean) => {
    getTabManager()?.setRamHardLimit(hard);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_MAX_RAM_LIMIT, (_event, limitMb: number) => {
    getTabManager()?.setMaxRamLimit(limitMb);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_RAM_SNOOZE_TIME, (_event, minutes: number) => {
    getTabManager()?.setRamSnoozeTime(minutes);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_TURBO_MODE, (_event, enabled: boolean) => {
    getTabManager()?.setTurboModeEnabled(enabled);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_DEEP_CLEAN, async () => {
    try {
      const { session } = require('electron');
      // 1. Cache temizliği
      await session.defaultSession.clearCache();
      await session.defaultSession.clearHostResolverCache();
      await session.defaultSession.clearStorageData({
        storages: ['shader_cache', 'filesystem', 'indexdb', 'websql']
      });
      
      // 2. TabManager'a tüm sekmeleri optimize etmesini söyle
      getTabManager()?.setTurboModeEnabled(true); // Temizlik sonrası kısa süreli boost
      setTimeout(() => getTabManager()?.setTurboModeEnabled(false), 2000); // 2 saniye sonra normale dön
      
      return { success: true, message: 'Morrow Engine: Derin temizlik tamamlandı!' };
    } catch (e) {
      console.error('Deep clean failed:', e);
      return { success: false, message: 'Temizlik sırasında hata oluştu.' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_NETWORK_LIMIT, (_event, limitMbps: number) => {
    try {
      console.log(`[IPC] SYSTEM_SET_NETWORK_LIMIT: ${limitMbps}`);
      const tm = getTabManager();
      if (!tm) {
        console.warn('[IPC] TabManager is NOT initialized yet!');
        return;
      }
      tm.setNetworkSpeedLimit(limitMbps);
    } catch (e) {
      console.error('[IPC] Network limit error:', e);
    }
  });

  ipcMain.handle('system:set-search-engine-url', (_event, url: string) => {
    getTabManager()?.setSearchEngineUrl(url);
  });

  // ─── 2. İndirme Yönetimi (ÖNCELİKLİ) ───
  const activeDownloads = new Map<string, Electron.DownloadItem>();
  const { session } = require('electron');
  const { getDatabase } = require('../database/db');

  session.defaultSession.on('will-download', (event: any, item: Electron.DownloadItem, wc: any) => {
    const id = Date.now().toString();
    const filename = item.getFilename();
    const url = item.getURL();
    const totalBytes = item.getTotalBytes();
    const startedAt = new Date().toISOString();

    activeDownloads.set(id, item);

    const data: any = {
      id,
      filename,
      url,
      totalBytes,
      receivedBytes: 0,
      state: 'progressing',
      startedAt,
      savePath: '',
    };

    // DB'ye kaydet
    const db = getDatabase();
    const dbDownloads = db.getDownloads();
    dbDownloads.unshift(data);
    db.setDownloads(dbDownloads);

    windowManager.getMainWindow()?.webContents.send('downloads:start', data);

    item.on('updated', (_e: any, state: 'progressing' | 'interrupted') => {
      if (state === 'interrupted') {
        data.state = 'interrupted';
      } else if (state === 'progressing') {
        data.receivedBytes = item.getReceivedBytes();
        data.state = 'progressing';
        const ratio = totalBytes > 0 ? data.receivedBytes / totalBytes : -1;
        windowManager.getMainWindow()?.setProgressBar(ratio);
      }
      windowManager.getMainWindow()?.webContents.send('downloads:progress', data);
    });

    item.once('done', (_e: any, state: 'completed' | 'cancelled' | 'interrupted') => {
      activeDownloads.delete(id);
      data.state = state;
      if (state === 'completed') {
        data.receivedBytes = totalBytes;
        data.savePath = item.getSavePath();
      }
      // DB'yi güncelle
      const db2 = getDatabase();
      const all = db2.getDownloads();
      const idx = all.findIndex((d: any) => d.id === id);
      if (idx >= 0) { all[idx] = data; db2.setDownloads(all); }

      windowManager.getMainWindow()?.setProgressBar(-1);
      windowManager.getMainWindow()?.webContents.send('downloads:complete', data);
    });
  });

  // DB'den geçmiş indirmeleri ve aktif oturum indirmelerini döndür
  ipcMain.handle('downloads:get', () => {
    const db = getDatabase();
    return db.getDownloads().slice(0, 100); // Son 100 indirme
  });

  ipcMain.handle('downloads:action', (_event, { id, action }: { id: string, action: 'pause' | 'resume' | 'cancel' }) => {
    const item = activeDownloads.get(id);
    if (!item) return false;
    if (action === 'pause') item.pause();
    else if (action === 'resume') item.resume();
    else if (action === 'cancel') item.cancel();
    return true;
  });

  ipcMain.handle('downloads:open', async (_event, filePath: string) => {
    const { shell } = require('electron');
    if (!filePath) return 'Dosya yolu bulunamadı.';
    return shell.openPath(filePath);
  });

  ipcMain.handle('downloads:test', () => {
    const mainWin = windowManager.getMainWindow();
    if (mainWin) {
      mainWin.webContents.downloadURL('https://raw.githubusercontent.com/electron/electron/master/README.md');
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_INFO, () => {
    return { version: app.getVersion() };
  });

  ipcMain.handle(IPC_CHANNELS.APP_CHECK_UPDATE, async () => {
    const { handleCheckUpdate } = await import('../updater');
    return handleCheckUpdate();
  });

  const historyManager = new HistoryManager();
  const bookmarkManager = new BookmarkManager();
  const findInPage = new FindInPage();

  // Ana pencerenin TabManager'ına geçmiş kaydetme olayını bağla
  windowManager.getTabManager()?.setOnNavigate((url, title) => {
    historyManager.addVisit(url, title);
  });
  
  // ─── Sekme Yönetimi ───

  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, url?: string) => {
    console.log('[DEBUG] TAB_CREATE called from sender:', _event.sender.getURL());
    const tabManager = getTabManager();
    if (!tabManager) {
      console.log('[DEBUG] TAB_CREATE ABORT: tabManager is null');
      return null;
    }
    const tabId = tabManager.createTab(url || 'about:blank');
    return tabId;
  });

  ipcMain.handle(IPC_CHANNELS.TAB_TOGGLE_PIP, async () => {
    const wc = getTabManager()?.getActiveWebContents();
    if (!wc) return false;
    
    // Find first playing video or any video and trigger PiP
    try {
      await wc.executeJavaScript(`
        (async () => {
          const videos = Array.from(document.querySelectorAll('video'));
          const playingVideo = videos.find(v => !v.paused && v.readyState >= 2) || videos[0];
          if (playingVideo) {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            } else {
              await playingVideo.requestPictureInPicture();
            }
            return true;
          }
          return false;
        })()
      `);
      return true;
    } catch (e) {
      console.error('PiP error:', e);
      return false;
    }
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

  ipcMain.handle(IPC_CHANNELS.TAB_GET_ZOOM_LEVEL, (_event, tabId?: number) => {
    return getTabManager()?.getZoomFactor(tabId || 0) || 1.0;
  });

  ipcMain.handle(IPC_CHANNELS.TAB_SET_ZOOM_LEVEL, (_event, factor: number, tabId?: number) => {
    getTabManager()?.setZoomFactor(tabId || 0, factor);
  });

  // ─── Sekme Grupları (Yeni Özellik) ───
  ipcMain.handle(IPC_CHANNELS.TAB_GROUP_CREATE, (_event, tabIds: number[], title?: string, color?: string) => {
    getTabManager()?.createTabGroup(tabIds, title, color);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_GROUP_ADD, (_event, tabId: number, groupId: string) => {
    getTabManager()?.addTabToGroup(tabId, groupId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_GROUP_REMOVE, (_event, tabId: number) => {
    getTabManager()?.removeTabFromGroup(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_GROUP_COLLAPSE, (_event, groupId: string) => {
    getTabManager()?.toggleGroupCollapse(groupId);
  });

  ipcMain.handle('tab:show-context-menu', (_event, tabId: number, isPinned: boolean) => {
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
        label: isPinned ? '📌 Sabitlemeyi Kaldır' : '📌 Sabitle',
        click: () => tabManager.togglePinTab(tabId)
      },
      { type: 'separator' },
      {
        label: 'Sağdaki ile Grupla',
        click: () => {
          const tabs = tabManager.getTabList();
          const index = tabs.findIndex((t: any) => t.id === tabId);
          if (index !== -1 && index < tabs.length - 1) {
            const rightTab = tabs[index + 1];
            tabManager.createTabGroup([tabId, rightTab.id], 'Yeni Grup');
          }
        }
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

  ipcMain.handle('tabs:close-all', () => {
    getTabManager()?.closeAllTabs();
  });

  ipcMain.handle('tabs:panic', () => {
    getTabManager()?.panic();
  });

  // ─── Navigasyon ───

  ipcMain.handle(IPC_CHANNELS.NAV_GO, (_event, url: string) => {
    const tabManager = getTabManager();
    if (tabManager) {
      if (tabManager.getActiveTabId() === null) {
        tabManager.createTab(url);
      } else {
        tabManager.goToUrl(url);
      }
    }
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

  ipcMain.handle(IPC_CHANNELS.NAV_PRINT, () => {
    const wc = getTabManager()?.getActiveWebContents();
    if (wc) wc.print();
  });

  ipcMain.handle(IPC_CHANNELS.NAV_PRINT_PDF, async () => {
    const wc = getTabManager()?.getActiveWebContents();
    if (!wc) return;
    try {
      const pdf = await wc.printToPDF({});
      const { dialog } = require('electron');
      const { filePath } = await dialog.showSaveDialog(windowManager.getMainWindow()!, {
        defaultPath: 'sayfa.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (filePath) {
        require('fs').writeFileSync(filePath, pdf);
      }
    } catch (e) {
      console.error(e);
    }
  });

  // ─── Pencere Kontrolleri ───

  ipcMain.handle(IPC_CHANNELS.WIN_MINIMIZE, () => {
    activeWindowManager?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WIN_MAXIMIZE, () => {
    activeWindowManager?.maximize();
  });

  ipcMain.handle(IPC_CHANNELS.WIN_CLOSE, () => {
    activeWindowManager?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WIN_IS_MAXIMIZED, () => {
    return activeWindowManager?.isMaximized() ?? false;
  });

  // ─── Geçmiş ───

  ipcMain.handle('history:search', (_event, query: string, limit?: number) => {
    return historyManager.search(query, limit);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, (_event, limit?: number) => {
    const path = require('path');
    const logPath = path.join(app.getPath('userData'), 'nav_log.txt');
    const items = historyManager.getHistory(limit || 100);
    try {
      require('fs').appendFileSync(logPath, `\n[${new Date().toISOString()}] HISTORY_GET: count=${items.length}\n`);
    } catch {}
    return items;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    historyManager.clearAll();
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

  // ─── Çoklu Pencere Sync (Overlay -> Main) ───
  ipcMain.handle('sidebar:toggle-panel', (_event, panel: string) => {
    const mainWin = windowManager.getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('sidebar:on-toggle-panel', panel);
    }
  });

  ipcMain.handle('system:navigate-router', (_event, path: string) => {
    const mainWin = windowManager.getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('system:on-navigate-router', path);
    }
  });

  ipcMain.handle('system:set-route-state', (_event, route: string) => {
    getTabManager()?.setRendererRoute(route);
  });

  // ─── Çalışma Alanları (Workspaces) ───
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
      tm.setActiveWorkspace(id);
    }
  });

  ipcMain.handle('workspace:add', (_event, name: string, icon?: string) => {
    return workspaceManager.addWorkspace(name, icon);
  });

  ipcMain.handle('workspace:remove', (_event, id: string) => {
    workspaceManager.removeWorkspace(id);
  });

  // ─── Dal 4: Gelişmiş Özellikler ───

  let menuOverlayWin: Electron.BrowserWindow | null = null;

  ipcMain.handle('app:toggle-chrome-menu', (_event, bounds: { x: number, y: number }) => {
    const x = Math.floor(bounds.x);
    const y = Math.floor(bounds.y);
    
    if (menuOverlayWin && !menuOverlayWin.isDestroyed()) {
      if (menuOverlayWin.isVisible()) {
        menuOverlayWin.hide();
      } else {
        menuOverlayWin.setOpacity(0);
        menuOverlayWin.setPosition(x, y);
        menuOverlayWin.show();
        setTimeout(() => {
          if (menuOverlayWin && !menuOverlayWin.isDestroyed()) {
            menuOverlayWin.setOpacity(1);
          }
        }, 30);
      }
      return;
    }

    const { BrowserWindow } = require('electron');
    const path = require('path');
    
    const win = new BrowserWindow({
      width: 330,
      height: 610,
      x: x,
      y: y,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false, 
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: true,
      thickFrame: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    menuOverlayWin = win;
    win.setBackgroundColor('#00000000');

    const { app: electronApp } = require('electron');
    const isDev = process.env.NODE_ENV === 'development' || !electronApp.isPackaged;
    
    const url = isDev 
      ? 'http://localhost:5173/#/chromemenu-overlay' 
      : `file://${path.join(__dirname, '..', '..', 'renderer', 'index.html')}#/chromemenu-overlay`;
    
    win.loadURL(url);

    win.once('ready-to-show', () => {
      if (!win.isDestroyed()) {
        win.setOpacity(0);
        win.show();
        setTimeout(() => {
          if (!win.isDestroyed()) win.setOpacity(1);
        }, 50);
      }
    });

    win.on('blur', () => {
      if (!win.isDestroyed()) {
        win.hide();
      }
    });
  });

  ipcMain.handle('app:close-chrome-menu', () => {
    console.log('[DEBUG] app:close-chrome-menu called');
    if (menuOverlayWin && !menuOverlayWin.isDestroyed()) {
      menuOverlayWin.hide();
    }
  });

  ipcMain.handle('app:get-suggestions', async (_event, query: string) => {
    try {
      const response = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`);
      const data = await response.json() as any;
      return data[1] || [];
    } catch (e) {
      return [];
    }
  });


  ipcMain.handle('app:show-main-menu', () => {
    const { Menu, app } = require('electron');
    const win = windowManager.getMainWindow();
    if (!win) return;
    
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Yeni Sekme',
        accelerator: 'CmdOrCtrl+T',
        click: () => getTabManager()?.createTab('about:blank')
      },
      {
        label: 'Yeni Pencere',
        accelerator: 'CmdOrCtrl+N',
        click: () => getTabManager()?.createTab('about:blank')
      },
      {
        label: 'Yeni Gizli Pencere',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          const incognitoWin = new WindowManager(true);
          const newWin = incognitoWin.createMainWindow();
          windowManagers.set(newWin.id, incognitoWin);
        }
      },
      { type: 'separator' },
      { label: 'Yer İmleri' },
      { label: 'Geçmiş', accelerator: 'CmdOrCtrl+H' },
      { label: 'İndirmeler', accelerator: 'CmdOrCtrl+J' },
      { type: 'separator' },
      {
        label: 'Büyüt / Küçült (Zoom)',
        submenu: [
          { label: 'Yakınlaştır', role: 'zoomIn' },
          { label: 'Uzaklaştır', role: 'zoomOut' },
          { label: 'Sıfırla', role: 'resetZoom' }
        ]
      },
      { type: 'separator' },
      {
        label: 'Yazdır...',
        accelerator: 'CmdOrCtrl+P',
        click: () => getTabManager()?.getActiveWebContents()?.print()
      },
      { type: 'separator' },
      {
        label: 'Ayarlar',
        click: () => {
           // Ayarları şimdilik yeni sekmede yerel dosya olarak açabilir veya React'a sinyal gönderebiliriz.
           getTabManager()?.createTab('http://localhost:5173/#/settings');
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => app.quit()
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: win });
  });

  ipcMain.handle('app:new-incognito-window', () => {
    // Yeni bir gizli WindowManager başlat
    const incognitoWin = new WindowManager(true);
    const win = incognitoWin.createMainWindow();
    windowManagers.set(win.id, incognitoWin);

    win.on('closed', () => {
      windowManagers.delete(win.id);
      if (activeWindowManager === incognitoWin) {
        activeWindowManager = windowManager; // Geri ana pencereye dön
      }
    });
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

  // ─── Eklentiler ───

  const extensionManager = getExtensionManager();

  // Uygulama başlangıcında eklentileri geri yükle
  extensionManager.restoreExtensions().then(() => {
    // uBlock Origin Entegrasyonu (Başlangıçta otomatik yükle)
    const ublockId = 'cjpalhdlnbpafiamejdnhcphjbkeiagm';
    extensionManager.installCrx(ublockId).catch((err) => {
      console.error('[AdBlock] uBlock Origin yükleme hatası:', err);
    });
  }).catch((err) => {
    console.error('[IPC] Eklenti geri yükleme hatası:', err);
  });

  ipcMain.handle(IPC_CHANNELS.EXTENSION_LOAD, async () => {
    return extensionManager.loadFromDialog();
  });

  ipcMain.handle(IPC_CHANNELS.EXTENSION_REMOVE, async (_event, extensionId: string) => {
    return extensionManager.removeExtension(extensionId);
  });

  ipcMain.handle(IPC_CHANNELS.EXTENSION_LIST, () => {
    return extensionManager.getLoadedExtensions();
  });

  ipcMain.handle(IPC_CHANNELS.EXTENSION_INSTALL_CRX, async (_event, extensionId: string) => {
    return extensionManager.installCrx(extensionId);
  });



  // ─── Custom HTML ContextMenu Click Forwards ───
  ipcMain.on('context-menu:click', (_event, id: string) => {
    const tm = getTabManager();
    if (!tm) return;
    const callback = tm.contextMenuCallbacks.get(id);
    if (callback) callback();
  });

  // ─── Temizleyici (Cleaner) Handlers ───
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_CACHE_SIZE, async () => {
    const { session } = require('electron');
    try {
      return await session.defaultSession.getCacheSize();
    } catch (e) {
      console.error('getCacheSize error:', e);
      return 0;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_CLEAR_CACHE, async () => {
    const { session } = require('electron');
    try {
      await session.defaultSession.clearCache();
      return true;
    } catch (e) {
      console.error('clearCache error:', e);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_COOKIES_COUNT, async () => {
    const { session } = require('electron');
    try {
      const cookies = await session.defaultSession.cookies.get({});
      return cookies.length;
    } catch (e) {
      console.error('getCookiesCount error:', e);
      return 0;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_CLEAR_COOKIES, async () => {
    const { session } = require('electron');
    try {
      await session.defaultSession.clearStorageData({ storages: ['cookies'] });
      return true;
    } catch (e) {
      console.error('clearCookies error:', e);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOADS_CLEAR_HISTORY, () => {
    try {
      const { getDatabase } = require('../database/db');
      const db = getDatabase();
      if (db) {
        db.setDownloads([]);
        return true;
      }
      return false;
    } catch (e) {
      console.error('clearDownloads error:', e);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.TAB_EXECUTE_JS, async (_event, script: string, tabId?: number) => {
    const tm = getTabManager();
    const id = tabId || tm.getActiveTabId();
    const view = tm.getTab(id);
    if (view) {
      return await view.webContents.executeJavaScript(script);
    }
    return null;
  });
}
