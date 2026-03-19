/**
 * TabManager — WebContentsView tabanlı sekme izolasyonu
 *
 * Her sekme bağımsız bir WebContentsView içinde çalışır.
 * Bu sayede bir sekmedeki çökme diğerlerini etkilemez.
 */

import {
  BrowserWindow,
  WebContentsView,
  session,
  type WebContents,
} from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';

export interface TabInfo {
  id: number;
  title: string;
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  favicon?: string;
  workspaceId?: string;
  isIncognito?: boolean;
}

export class TabManager {
  private tabs: Map<number, WebContentsView> = new Map();
  private tabWorkspaces: Map<number, string> = new Map();
  private tabOrder: number[] = [];
  private activeTabId: number | null = null;
  private mainWindow: BrowserWindow;
  private tabCounter = 0;
  private isIncognito: boolean;
  public activeWorkspace: string = 'default';
  private sidebarPanelWidth: number = 0;
  private onNavigateCallback?: (url: string, title: string) => void;

  constructor(mainWindow: BrowserWindow, isIncognito: boolean = false) {
    this.mainWindow = mainWindow;
    this.isIncognito = isIncognito;
  }

  /**
   * Yeni sekme oluşturur ve WebContentsView'ı pencereye ekler
   */
  createTab(url: string = 'about:blank', workspaceId: string = this.activeWorkspace): number {
    const tabId = ++this.tabCounter;

    // Dal 4: Gizli sekme veya standart partition
    const partition = this.isIncognito ? 'in-memory:incognito' : 'persist:bseester';

    const view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webviewTag: false,
        partition,
      },
    });

    this.tabs.set(tabId, view);
    this.tabWorkspaces.set(tabId, workspaceId);
    this.tabOrder.push(tabId);

    // Navigasyon olaylarını dinle
    this.attachWebContentsListeners(tabId, view.webContents);

    // Pencereye ekle (henüz görünmez)
    this.mainWindow.contentView.addChildView(view);

    // URL'ye git
    if (url !== 'about:blank') {
      view.webContents.loadURL(url);
    }

    // Bu sekmeyi aktif yap
    this.switchToTab(tabId);

    // Renderer'a bildir
    this.notifyTabUpdate();

    return tabId;
  }

  /**
   * Sekmeyi kapatır ve kaynaklarını temizler
   */
  closeTab(tabId: number): void {
    const view = this.tabs.get(tabId);
    if (!view) return;

    // Pencereden kaldır
    try {
      if (!this.mainWindow.isDestroyed()) {
        this.mainWindow.contentView.removeChildView(view);
      }
    } catch (e) {
      // Pencere kapanırken nesne yok edilmiş olabilir
    }

    // WebContents'i destroy et (bellek sızıntısını önle)
    try {
      view.webContents.close();
    } catch (e) {
      // ignore
    }
    this.tabs.delete(tabId);
    this.tabWorkspaces.delete(tabId);
    this.tabOrder = this.tabOrder.filter(id => id !== tabId);

    // Aktif sekme kapatıldıysa mevcut workspace'de başka sekme bul
    if (this.activeTabId === tabId) {
      const workspaceTabs = this.tabOrder.filter(id => this.tabWorkspaces.get(id) === this.activeWorkspace);
      if (workspaceTabs.length > 0) {
        this.switchToTab(workspaceTabs[workspaceTabs.length - 1]);
      } else {
        this.activeTabId = null;
        // Optionally create new blank tab
      }
    }

    this.notifyTabUpdate();
  }

  closeOtherTabs(keepTabId: number): void {
    const ids = Array.from(this.tabs.keys());
    for (const id of ids) {
      if (id !== keepTabId) {
        this.closeTab(id);
      }
    }
  }

  closeTabsToRight(tabId: number): void {
    const index = this.tabOrder.indexOf(tabId);
    if (index === -1) return;
    
    // Sağdaki tüm tabId'leri al (index'ten sonrakiler)
    const idsToClose = this.tabOrder.slice(index + 1);
    for (const id of idsToClose) {
      this.closeTab(id);
    }
  }

  /**
   * Aktif sekmeyi değiştirir
   */
  switchToTab(tabId: number): void {
    if (!this.tabs.has(tabId)) return;

    // Önceki aktif sekmeyi gizle
    if (this.activeTabId !== null && this.activeTabId !== tabId) {
      const prevView = this.tabs.get(this.activeTabId);
      if (prevView) {
        prevView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    }

    this.activeTabId = tabId;
    this.activeWorkspace = this.tabWorkspaces.get(tabId) || this.activeWorkspace;
    
    // Yalnızca aktif olan (workspace'e uyan) sekmeyi göster, diğerlerini gizle
    for (const [id, view] of this.tabs) {
      if (id !== tabId) {
        view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    }

    this.resizeActiveTab();
    this.notifyTabUpdate();
  }

  /**
   * Aktif sekmeyi pencere boyutuna göre yeniden boyutlandırır.
   * Top bar yüksekliği (80px) ve sidebar genişliği (52px) düşülür.
   */
  resizeActiveTab(): void {
    if (this.activeTabId === null) return;

    const view = this.tabs.get(this.activeTabId);
    if (!view) return;

    const bounds = this.mainWindow.getContentBounds();
    const TOP_BAR_HEIGHT = 80;
    const SIDEBAR_WIDTH = 52 + this.sidebarPanelWidth;

    const url = view.webContents.getURL();
    if (url === 'about:blank' || url === '') {
      // React tabanlı Hızlı Erişim / Yeni Sekme ekranının görünmesi ve tıklanabilmesi için gizle
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    console.log('[DEBUG] resizeActiveTab invoked. bounds:', { x: SIDEBAR_WIDTH, width: bounds.width - SIDEBAR_WIDTH });

    view.setBounds({
      x: SIDEBAR_WIDTH,
      y: TOP_BAR_HEIGHT,
      width: bounds.width - SIDEBAR_WIDTH,
      height: bounds.height - TOP_BAR_HEIGHT,
    });
  }

  setSidebarPanelWidth(width: number): void {
    this.sidebarPanelWidth = width;
    this.resizeActiveTab();
  }

  setOnNavigate(callback: (url: string, title: string) => void): void {
    this.onNavigateCallback = callback;
  }

  // ─── Navigasyon İşlevleri ───

  goToUrl(url: string): void {
    const wc = this.getActiveWebContents();
    const fs = require('fs');
    const logPath = 'C:\\Users\\bseester\\tarayıcı\\nav_log.txt';
    
    try {
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] goToUrl: url="${url}" activeTabId=${this.activeTabId} wcExists=${!!wc}\n`);
    } catch (err) {
      // ignore
    }

    if (!wc) {
      try {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] wc is null, returning\n`);
      } catch {}
      return;
    }

    let normalizedUrl = url;
    if (!/^https?:\/\//i.test(url) && !/^file:\/\//i.test(url) && !/^about:/i.test(url)) {
      if (url.includes('.') && !url.includes(' ')) {
        normalizedUrl = `https://${url}`;
      } else {
        normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] loading URL: "${normalizedUrl}"\n`);
    } catch {}

    wc.loadURL(normalizedUrl);
    
    // Asenkron race-condition'ı önlemek için burada doğrudan genişletiyoruz
    const bounds = this.mainWindow.getContentBounds();
    const TOP_BAR_HEIGHT = 80;
    const SIDEBAR_WIDTH = 52 + this.sidebarPanelWidth;

    const view = this.tabs.get(this.activeTabId!);
    if (view) {
      view.setBounds({
        x: SIDEBAR_WIDTH,
        y: TOP_BAR_HEIGHT,
        width: bounds.width - SIDEBAR_WIDTH,
        height: bounds.height - TOP_BAR_HEIGHT,
      });
    }
  }

  goBack(): void {
    const wc = this.getActiveWebContents();
    if (wc?.canGoBack()) wc.goBack();
  }

  goForward(): void {
    const wc = this.getActiveWebContents();
    if (wc?.canGoForward()) wc.goForward();
  }

  reload(): void {
    const wc = this.getActiveWebContents();
    wc?.reload();
  }

  stop(): void {
    const wc = this.getActiveWebContents();
    wc?.stop();
  }

  // ─── Yardımcılar ───

  getActiveWebContents(): WebContents | null {
    if (this.activeTabId === null) return null;
    return this.tabs.get(this.activeTabId)?.webContents ?? null;
  }

  getActiveTabId(): number | null {
    return this.activeTabId;
  }

  getTabList(): TabInfo[] {
    const list: TabInfo[] = [];
    for (const id of this.tabOrder) {
      const wsId = this.tabWorkspaces.get(id);
      if (wsId !== this.activeWorkspace) continue; // Sadece aktif workspace

      const view = this.tabs.get(id);
      if (!view) continue;
      const wc = view.webContents;
      list.push({
        id,
        title: wc.getTitle() || 'Yeni Sekme',
        url: wc.getURL(),
        isLoading: wc.isLoading(),
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
        workspaceId: wsId,
        isIncognito: this.isIncognito,
      });
    }
    return list;
  }

  reorderTabs(activeId: number, overId: number): void {
    const oldIndex = this.tabOrder.indexOf(activeId);
    const newIndex = this.tabOrder.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // Dizide yer değiştirme (Splice)
    const [movedTab] = this.tabOrder.splice(oldIndex, 1);
    this.tabOrder.splice(newIndex, 0, movedTab);

    this.notifyTabUpdate();
  }

  getTabCount(): number {
    return this.tabs.size;
  }

  /**
   * WebContents olaylarını dinler ve Renderer'a bildirim gönderir
   */
  private attachWebContentsListeners(tabId: number, wc: WebContents): void {
    wc.on('did-start-loading', () => {
      this.sendToRenderer(IPC_CHANNELS.NAV_LOADING, { tabId, isLoading: true });
    });

    wc.on('did-stop-loading', () => {
      this.sendToRenderer(IPC_CHANNELS.NAV_LOADING, { tabId, isLoading: false });
      this.notifyTabUpdate();
    });

    wc.on('did-navigate', (_event, url) => {
      this.sendToRenderer(IPC_CHANNELS.NAV_URL_UPDATED, { tabId, url });
      this.notifyTabUpdate();
      if (tabId === this.activeTabId) this.resizeActiveTab();

      const fs = require('fs');
      const logPath = 'C:\\Users\\bseester\\tarayıcı\\nav_log.txt';
      try {
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] did-navigate: callbackExists=${!!this.onNavigateCallback} isIncognito=${this.isIncognito}\n`);
      } catch {}

      if (!this.isIncognito) {
        this.onNavigateCallback?.(url, wc.getTitle());
      }
    });

    wc.on('did-navigate-in-page', (_event, url) => {
      this.sendToRenderer(IPC_CHANNELS.NAV_URL_UPDATED, { tabId, url });
      if (tabId === this.activeTabId) this.resizeActiveTab();
    });

    wc.on('page-title-updated', (_event, title) => {
      this.sendToRenderer(IPC_CHANNELS.NAV_TITLE_UPDATED, { tabId, title });
      this.notifyTabUpdate();
      if (!this.isIncognito) {
        this.onNavigateCallback?.(wc.getURL(), title);
      }
    });

    // Yeni pencere açma isteklerini yakala → yeni sekmede aç
    wc.setWindowOpenHandler(({ url }) => {
      this.createTab(url);
      return { action: 'deny' };
    });
  }

  /**
   * Renderer process'e IPC mesajı gönderir
   */
  private sendToRenderer(channel: string, data: unknown): void {
    try {
      this.mainWindow.webContents.send(channel, data);
    } catch {
      // Pencere kapatılmış olabilir
    }
  }

  /**
   * Tüm sekme listesini Renderer'a bildirir
   */
  notifyTabUpdate(): void {
    this.sendToRenderer(IPC_CHANNELS.TAB_UPDATE, {
      tabs: this.getTabList(),
      activeTabId: this.activeTabId,
    });
  }

  /**
   * Tüm sekmeleri temizler (uygulama kapanırken)
   */
  destroyAll(): void {
    for (const [id] of this.tabs) {
      this.closeTab(id);
    }
  }
}
