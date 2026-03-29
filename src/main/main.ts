/**
 * Main Process — Uygulamanın giriş noktası
 *
 * Electron uygulamasını başlatır, donanım optimizasyonlarını yapar,
 * pencereyi oluşturur ve IPC handler'larını kaydeder.
 */

import { app, BrowserWindow, session, desktopCapturer, dialog } from 'electron';
import path from 'path';
import { WindowManager } from './window/WindowManager';
import { registerIPCHandlers } from './ipc/handlers';
import { AdBlocker } from './engine/adblocker';

export let adBlocker: AdBlocker | null = null;
let windowManager: WindowManager;

if (process.platform === 'win32') {
  app.setAppUserModelId('com.morrow.browser');
}

// ─── Donanım Optimizasyonları ───

// GPU hızlandırma (WebGL, CSS animasyonları) ve Performans Bayrakları
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-smooth-scrolling');
app.commandLine.appendSwitch('enable-oop-rasterization');
app.commandLine.appendSwitch('disable-quic');

// Ekstra GPU ve Video Optimizasyonları
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
app.commandLine.appendSwitch('ignore-gpu-blocklist'); // Eski GPU'larda bile donanım hızlandırmayı zorlar
app.commandLine.appendSwitch('enable-vulkan'); // Desteklenen donanımlarda Vulkan rendering

// Global Medya Kontrolleri ve Donanım Video Kod Çözücü
app.commandLine.appendSwitch('enable-features', 'HardwareMediaKeyHandling,VaapiVideoDecoder,CanvasOopRasterization');

// Widevine CDM DRM (Netflix, Spotify vb. için)
// Not: Gerçek dağıtımda Widevine dosyalarının proje ile paketlenmesi veya indirilmesi gerekir.
const widevinePath = process.platform === 'win32' 
  ? path.join(app.getAppPath(), '..', 'widevine', 'widevinecdm.dll')
  : path.join(app.getAppPath(), '..', 'widevine', 'libwidevinecdm.dylib');
app.commandLine.appendSwitch('widevine-cdm-path', widevinePath);
app.commandLine.appendSwitch('widevine-cdm-version', '4.10.2710.0');

// Bellek optimizasyonu
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// Güvenlik: uzak içeriğin tehlikeli API'lere erişimini engelle
app.commandLine.appendSwitch('disable-remote-module');

// ─── Singleton kilidi (tek pencere) ───

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  // macOS: Protokol üzerinden URL açıldığında
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleArgv([url]);
  });

  app.on('second-instance', (event, argv) => {
    // Kullanıcı ikinci bir örnek açmaya çalışırsa (örneğin bir linke tıklayarak)
    // mevcut pencereyi öne getir ve URL'yi işle
    const win = windowManager?.getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      handleArgv(argv);
    }
  });

  // ─── Uygulama Hazır ───

  app.whenReady().then(() => {
    adBlocker = new AdBlocker(session.defaultSession);
    
    windowManager = new WindowManager();
    const mainWindow = windowManager.createMainWindow();

    // IPC handler'larını kaydet
    registerIPCHandlers(windowManager, adBlocker);

    // Pencere görünür olduktan sonra güncelleme kontrolü başlat
    const win = windowManager.getMainWindow();
    if (win) {
      win.once('ready-to-show', () => {
        import('./updater').then(({ setupAutoUpdater }) => setupAutoUpdater());
      });
      // Pencere zaten gösterildiyse fallback
      if (win.isVisible()) {
        import('./updater').then(({ setupAutoUpdater }) => setupAutoUpdater());
      }
    } else {
      import('./updater').then(({ setupAutoUpdater }) => setupAutoUpdater());
    }

    // ─── Chrome Web Store Spoofing (Global System User Agent) ───
    const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    app.userAgentFallback = CHROME_USER_AGENT;
    
    // Oturum Bazlı User Agent ve Kalıcılık Zorlaması
    const persistentSession = session.fromPartition('persist:bseester');
    persistentSession.setUserAgent(CHROME_USER_AGENT);
    session.defaultSession.setUserAgent(CHROME_USER_AGENT);

    // Uygulama kapanırken verileri diske yazmayı zorla (Giriş bilgilerinin korunması için kritik)
    app.on('before-quit', async () => {
      try {
        await Promise.all([
          persistentSession.flushStorageData(),
          session.defaultSession.flushStorageData()
        ]);
      } catch (e) {
        console.error('Session flush error:', e);
      }
    });

    // ─── Yerleşik Yazım Denetimi (Native Spellchecker) ───
    session.defaultSession.setSpellCheckerEnabled(true);
    // Dil tercihlerini işletim sisteminden kalıtımla alacak, genelde tr-TR vb.

    // ─── WebRTC & Ekran Paylaşımı (Screen Sharing) ───
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
        // Native Dialog ile kullanıcıya hangi ekranı paylaşacağını sor
        const options = sources.map(s => s.name);
        const win = windowManager.getMainWindow();
        if (!win) {
          callback({ video: sources[0] });
          return;
        }

        dialog.showMessageBox(win, {
          type: 'question',
          buttons: [...options, 'İptal'],
          title: 'Ekran veya Pencere Paylaşımı',
          message: 'Hangi ekranı veya pencereyi paylaşmak istersiniz?',
          detail: 'Web sitesi ekranınızı paylaşabilmek için izin istiyor.'
        }).then(result => {
          const index = result.response;
          if (index < sources.length) {
            callback({ video: sources[index] });
          } else {
            callback({ video: undefined, audio: undefined }); // Kullanıcı iptal etti
          }
        }).catch(() => {
          callback({ video: undefined, audio: undefined });
        });
      });
    });



    // Varsayılan sekme oluştur
    const tabManager = windowManager.getTabManager();
    if (tabManager) {
      tabManager.loadPinnedTabs();
    }

    // macOS: dock ikonuna tıklanınca pencere yoksa yenisini oluştur
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createMainWindow();
      }
    });

    // Ana pencere yüklenince başlangıç argümanlarını işle (Örn: Link tıklanarak açıldıysa)
    const mw = windowManager.getMainWindow();
    if (mw) {
      if (mw.webContents.isLoading()) {
        mw.webContents.once('did-finish-load', () => {
          handleArgv(process.argv);
        });
      } else {
        handleArgv(process.argv);
      }
    }
  });

  // ─── Pencere Kapatma Davranışı ───

  app.on('window-all-closed', () => {
    // macOS'te dock'ta kalmaya devam et
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

/**
 * Komut satırı argümanlarını (argv) tarayarak URL'leri bulur ve yeni sekmede açar.
 * Windows'ta link tıklanınca veya bir dosyaya çift tıklanınca tetiklenir.
 */
function handleArgv(argv: string[]) {
  // Eğer windowManager henüz hazır değilse işlemi erteleyebiliriz
  if (!windowManager) return;
  
  const tabManager = windowManager.getTabManager();
  if (!tabManager) return;

  // 1. URL'leri bul (http:// veya https:// ile başlayan)
  let url = argv.find(arg => arg.startsWith('http://') || arg.startsWith('https://'));
  
  // 2. Eğer URL yoksa, yerel bir .html dosyası mı diye bak
  if (!url) {
    const filePath = argv.find(arg => 
      arg.toLowerCase().endsWith('.html') || 
      arg.toLowerCase().endsWith('.htm') || 
      arg.toLowerCase().endsWith('.shtml')
    );
    
    if (filePath) {
      // Dosya yolunu file:// protokolüne çevir
      url = filePath.startsWith('file://') ? filePath : `file:///${path.resolve(filePath).replace(/\\/g, '/')}`;
    }
  }

  if (url) {
    console.log(`[Main] Opening argument: ${url}`);
    
    // Eğer ana pencere zaten açıksa onu öne getir
    const win = windowManager.getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }

    // Yeni sekmede aç
    tabManager.createTab(url);
  }
}
