/**
 * Search — Sayfa içi arama (Ctrl+F / Cmd+F) modülü
 *
 * Electron webContents.findInPage API'sini kullanır.
 */

import type { WebContents } from 'electron';

export class FindInPage {
  private activeWebContents: WebContents | null = null;
  private lastSearchText: string = '';

  /**
   * Sayfa içinde metin arar
   */
  find(webContents: WebContents, text: string): void {
    if (!text) {
      this.stop(webContents);
      return;
    }

    this.activeWebContents = webContents;
    this.lastSearchText = text;

    webContents.findInPage(text, {
      forward: true,
      findNext: false,
    });
  }

  /**
   * Sonraki eşleşmeye git
   */
  findNext(webContents: WebContents): void {
    if (!this.lastSearchText) return;

    webContents.findInPage(this.lastSearchText, {
      forward: true,
      findNext: true,
    });
  }

  /**
   * Önceki eşleşmeye git
   */
  findPrevious(webContents: WebContents): void {
    if (!this.lastSearchText) return;

    webContents.findInPage(this.lastSearchText, {
      forward: false,
      findNext: true,
    });
  }

  /**
   * Aramayı durdurur ve vurgulamaları temizler
   */
  stop(webContents: WebContents): void {
    webContents.stopFindInPage('clearSelection');
    this.activeWebContents = null;
    this.lastSearchText = '';
  }
}
