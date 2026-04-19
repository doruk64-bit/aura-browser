/**
 * ExtensionManager — Chrome eklentisi yönetim motoru
 *
 * electron-chrome-extensions ile tam entegrasyon.
 * Kurulum tamamen electron-chrome-web-store üzerinden yapılır.
 * Manuel CRX indirici kaldırıldı.
 */

import { session, dialog, app } from 'electron';
import { ElectronChromeExtensions, setSessionPartitionResolver } from 'electron-chrome-extensions';
import path from 'path';
import fs from 'fs';

export interface LoadedExtension {
  id: string;
  name: string;
  version: string;
  path: string;
  iconUrl: string;
}

let extensionManagerInstance: ExtensionManager | null = null;

/**
 * crx:// protokolünü ve oturum çözümleyicisini kur.
 * main.ts'de app.whenReady() içinde çağrılmalı.
 */
export function setupCrxProtocol() {
  setSessionPartitionResolver((partition: string) => {
    return session.fromPartition(partition);
  });
  ElectronChromeExtensions.handleCRXProtocol(session.fromPartition('persist:bseester'));
}

export class ExtensionManager {
  public extensionsState: ElectronChromeExtensions;
  private extensionsPath: string;
  private loadedMap = new Map<string, LoadedExtension>();

  constructor(private profileSession: Electron.Session) {
    this.extensionsPath = path.join(app.getPath('userData'), 'extensions');
    fs.mkdirSync(this.extensionsPath, { recursive: true });

    this.extensionsState = new ElectronChromeExtensions({
      license: 'GPL-3.0',
      session: profileSession,
      createTab: async (details) => {
        const { shell } = await import('electron');
        if (details.url) shell.openExternal(details.url);
        return [null as any, null as any];
      },
      selectTab: (_tab, _window) => {},
      removeTab: (_tab, _window) => {},
      createWindow: async (_details) => null as any,
    });
  }

  // ─── Tab Lifecycle Hooks ───

  addTab(webContents: Electron.WebContents, window: Electron.BrowserWindow) {
    this.extensionsState.addTab(webContents, window);
  }

  removeTab(webContents: Electron.WebContents) {
    this.extensionsState.removeTab(webContents);
  }

  selectTab(webContents: Electron.WebContents) {
    this.extensionsState.selectTab(webContents);
  }

  // ─── Extension Management ───

  private getIconUrl(ext: Electron.Extension): string {
    let iconRelativePath = 'icon.png';
    try {
      const manifestPath = path.join(ext.path, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const icons = manifest.icons || {};
        iconRelativePath = icons['128'] || icons['48'] || icons['16'] || Object.values(icons)[0] || 'icon.png';
      }

      const fullPath = path.join(ext.path, iconRelativePath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const extname = path.extname(fullPath).toLowerCase().replace('.', '');
        const mimeType = extname === 'svg' ? 'image/svg+xml' : `image/${extname || 'png'}`;
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.error(`[ExtensionManager] Icon loading error (${ext.id}):`, e);
    }
    // Fallback to protocol
    return `chrome-extension://${ext.id}/${iconRelativePath}`;
  }

  /** Yüklü eklentileri döndür (UI için) */
  getLoadedExtensions(): LoadedExtension[] {
    return this.profileSession.getAllExtensions().map(ext => ({
      id: ext.id,
      name: ext.name,
      version: ext.version,
      path: ext.path,
      iconUrl: this.getIconUrl(ext),
    }));
  }

  /** Klasörden unpacked eklenti yükle (geliştirici modu) */
  async loadFromDialog(): Promise<LoadedExtension | null> {
    const result = await dialog.showOpenDialog({
      title: 'Eklenti Klasörü Seç',
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return this.loadUnpackedExtension(result.filePaths[0]);
  }

  async loadUnpackedExtension(extensionPath: string): Promise<LoadedExtension | null> {
    try {
      const ext = await this.profileSession.loadExtension(extensionPath, { allowFileAccess: true });
      console.log(`[ExtensionManager] Eklenti yüklendi: ${ext.name}`);
      return { 
        id: ext.id, 
        name: ext.name, 
        version: ext.version, 
        path: ext.path,
        iconUrl: this.getIconUrl(ext)
      };
    } catch (e) {
      console.error('[ExtensionManager] Eklenti yükleme hatası:', e);
      return null;
    }
  }

  /** Eklentiyi kaldır */
  async removeExtension(extensionId: string): Promise<boolean> {
    try {
      await this.profileSession.removeExtension(extensionId);
      console.log('[ExtensionManager] Eklenti kaldırıldı:', extensionId);
      return true;
    } catch (e) {
      console.error('[ExtensionManager] Eklenti kaldırma hatası:', e);
      return false;
    }
  }

  /**
   * Uygulama başlangıcında önceden yüklenmiş eklentileri geri yükle.
   * electron-chrome-web-store session'a yüklenen eklentileri persist:bseester altında saklar — otomatik.
   */
  async restoreExtensions(): Promise<void> {
    const all = this.profileSession.getAllExtensions();
    console.log(`[ExtensionManager] ${all.length} eklenti geri yüklendi`);
  }
}

export function getExtensionManager(): ExtensionManager {
  if (!extensionManagerInstance) {
    extensionManagerInstance = new ExtensionManager(session.fromPartition('persist:bseester'));
  }
  return extensionManagerInstance;
}
