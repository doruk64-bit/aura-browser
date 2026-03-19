/**
 * AdBlocker — Basit ancak etkili reklam engelleme modülü
 *
 * Electron webRequest API'si ile bilinen reklam/analitik
 * domain'lerini ağ aşamasında engeller.
 */

import { session } from 'electron';

export class AdBlocker {
  private enabled: boolean = true;
  private blockedDomains = [
    '*://*.doubleclick.net/*',
    '*://partner.googleadservices.com/*',
    '*://*.googlesyndication.com/*',
    '*://*.google-analytics.com/*',
    '*://creative.ak.fbcdn.net/*',
    '*://*.adbrite.com/*',
    '*://*.exponential.com/*',
    '*://*.quantserve.com/*',
    '*://*.scorecardresearch.com/*',
    '*://*.zedo.com/*',
    '*://*.taboola.com/*',
    '*://*.outbrain.com/*',
    '*://*.moatads.com/*',
  ];

  constructor(targetSession: Electron.Session = session.defaultSession) {
    this.setup(targetSession);
  }

  private setup(targetSession: Electron.Session): void {
    targetSession.webRequest.onBeforeRequest(
      { urls: this.blockedDomains },
      (details, callback) => {
        if (this.enabled) {
          // Reklam isteği engellendi
          callback({ cancel: true });
        } else {
          callback({ cancel: false });
        }
      }
    );
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
