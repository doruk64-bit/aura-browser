/**
 * WindowManager — BrowserWindow yaşam döngüsü yönetimi
 *
 * Pencere oluşturma, native kontroller (minimize/maximize/close),
 * donanım hızlandırma ve pencere boyut olaylarını yönetir.
 */

import { BrowserWindow, app, screen } from 'electron';
import path from 'path';
import { TabManager } from './tab-manager';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private tabManager: TabManager | null = null;
  public readonly isIncognito: boolean;

  constructor(isIncognito: boolean = false) {
    this.isIncognito = isIncognito;
  }

  /**
   * Ana tarayıcı penceresini oluşturur
   */
  createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: Math.min(1400, width),
      height: Math.min(900, height),
      minWidth: 800,
      minHeight: 600,
      frame: false,                // Özel başlık çubuğu kullanılacak
      titleBarStyle: 'hidden',     // macOS native trafik lambaları
      trafficLightPosition: { x: 12, y: 12 },
      backgroundColor: this.isIncognito ? '#111827' : '#0a0a0f',
      show: false,                 // Hazır olunca göster (flicker önle)
      icon: path.join(__dirname, '..', '..', '..', 'resources', 'icons', 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,            // Preload script için sandbox kapalı
        webviewTag: false,
      },
    });

    // Pencere hazır olduğunda göster (beyaz ekran flash'ını önle)
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // TabManager'ı başlat
    this.tabManager = new TabManager(this.mainWindow, this.isIncognito);

    // Pencere boyut değişikliğinde sekmeleri yeniden boyutlandır
    this.mainWindow.on('resize', () => {
      this.tabManager?.resizeActiveTab();
    });

    // Pencere kapatıldığında temizle
    this.mainWindow.on('closed', () => {
      this.tabManager?.destroyAll();
      this.tabManager = null;
      this.mainWindow = null;
    });

    // Dev modda Vite dev server'ı, prod'da build edilmiş dosyaları yükle
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(
        path.join(__dirname, '..', '..', 'renderer', 'index.html')
      );
    }

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  getTabManager(): TabManager | null {
    return this.tabManager;
  }

  // ─── Pencere Kontrolleri ───

  minimize(): void {
    this.mainWindow?.minimize();
  }

  maximize(): void {
    if (this.mainWindow?.isMaximized()) {
      this.mainWindow.unmaximize();
    } else {
      this.mainWindow?.maximize();
    }
  }

  close(): void {
    this.mainWindow?.close();
  }

  isMaximized(): boolean {
    return this.mainWindow?.isMaximized() ?? false;
  }
}
