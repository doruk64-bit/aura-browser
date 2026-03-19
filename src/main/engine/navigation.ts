/**
 * Navigation — Navigasyon olaylarına geçmiş kaydı ekleme
 *
 * TabManager'daki navigasyon olaylarına bağlanarak
 * otomatik geçmiş kaydı yapar.
 */

import { HistoryManager } from './history';
import type { WebContents } from 'electron';

export class NavigationTracker {
  private historyManager: HistoryManager;

  constructor() {
    this.historyManager = new HistoryManager();
  }

  /**
   * WebContents'in navigasyon olaylarını dinleyerek geçmiş kaydı yapar
   */
  trackWebContents(webContents: WebContents): void {
    webContents.on('did-navigate', (_event, url) => {
      const title = webContents.getTitle();
      this.historyManager.addVisit(url, title);
    });

    // Sayfa başlığı güncellendiğinde geçmişteki kaydı güncelle
    webContents.on('page-title-updated', (_event, title) => {
      const url = webContents.getURL();
      if (url && url !== 'about:blank') {
        this.historyManager.addVisit(url, title);
      }
    });
  }

  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }
}
