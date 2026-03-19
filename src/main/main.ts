/**
 * Main Process — Uygulamanın giriş noktası
 *
 * Electron uygulamasını başlatır, donanım optimizasyonlarını yapar,
 * pencereyi oluşturur ve IPC handler'larını kaydeder.
 */

import { app, BrowserWindow, session } from 'electron';
import { WindowManager } from './window/WindowManager';
import { registerIPCHandlers } from './ipc/handlers';
import { AdBlocker } from './engine/adblocker';

export let adBlocker: AdBlocker | null = null;
let windowManager: WindowManager;

// ─── Donanım Optimizasyonları ───

// GPU hızlandırma (WebGL, CSS animasyonları)
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

// Bellek optimizasyonu
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// Güvenlik: uzak içeriğin tehlikeli API'lere erişimini engelle
app.commandLine.appendSwitch('disable-remote-module');

// ─── Singleton kilidi (tek pencere) ───

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Kullanıcı ikinci bir örnek açmaya çalışırsa mevcut pencereyi öne getir
    const win = windowManager.getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  // ─── Uygulama Hazır ───

  app.whenReady().then(() => {
    adBlocker = new AdBlocker(session.defaultSession);
    
    windowManager = new WindowManager();
    const mainWindow = windowManager.createMainWindow();

    // IPC handler'larını kaydet
    registerIPCHandlers(windowManager, adBlocker);

    // Otomatik güncellemeleri başlat
    import('./updater').then(({ setupAutoUpdater }) => setupAutoUpdater());

    // Varsayılan sekme oluştur
    const tabManager = windowManager.getTabManager();
    if (tabManager) {
      tabManager.createTab('about:blank');
    }

    // macOS: dock ikonuna tıklanınca pencere yoksa yenisini oluştur
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createMainWindow();
      }
    });
  });

  // ─── Pencere Kapatma Davranışı ───

  app.on('window-all-closed', () => {
    // macOS'te dock'ta kalmaya devam et
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
