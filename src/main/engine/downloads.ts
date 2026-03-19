/**
 * Downloads — İndirme yöneticisi (JSON Storage)
 */

import { BrowserWindow, session, type DownloadItem } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';
import { getDatabase } from '../database/db';

export interface DownloadInfo {
  id: number;
  url: string;
  filename: string;
  savePath: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  mimeType: string;
  startedAt: string;
  completedAt?: string;
}

export class DownloadManager {
  private mainWindow: BrowserWindow;
  private activeDownloads: Map<string, DownloadItem> = new Map();

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupDownloadHandler();
  }

  private setupDownloadHandler(): void {
    const fs = require('fs');
    const logPath = 'C:\\Users\\bseester\\tarayıcı\\nav_log.txt';
    const handler = (_event: any, item: DownloadItem) => {
      try {
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] will-download fired: url=${item.getURL()} name=${item.getFilename()}\n`);
      } catch {}
      this.handleDownload(item);
    };

    // Dinlenecek tüm oturumlar
    session.defaultSession.on('will-download', handler);
    session.fromPartition('persist:bseester').on('will-download', handler);
    session.fromPartition('in-memory:incognito').on('will-download', handler);
  }

  private handleDownload(item: DownloadItem): void {
    const url = item.getURL();
    const filename = item.getFilename();
    const downloadIdStr = `${Date.now()}-${filename}`;
    const id = Date.now();

    this.activeDownloads.set(downloadIdStr, item);

    const db = getDatabase();
    const downloads = db.getDownloads();
    
    downloads.push({
      id,
      url,
      filename,
      savePath: item.getSavePath() || '',
      totalBytes: item.getTotalBytes(),
      receivedBytes: 0,
      state: 'progressing',
      mimeType: item.getMimeType(),
      startedAt: new Date().toISOString(),
    });
    db.setDownloads(downloads);

    item.on('updated', (_event, state) => {
      const dbDownloads = db.getDownloads();
      const index = dbDownloads.findIndex((d) => d.id === id);
      
      if (index >= 0) {
        dbDownloads[index].receivedBytes = item.getReceivedBytes();
        dbDownloads[index].totalBytes = item.getTotalBytes();
        dbDownloads[index].state = state === 'progressing' ? 'progressing' : 'interrupted';
        dbDownloads[index].savePath = item.getSavePath() || dbDownloads[index].savePath;
        db.setDownloads(dbDownloads);

        this.sendToRenderer(IPC_CHANNELS.DOWNLOAD_PROGRESS, dbDownloads[index]);
      }
    });

    item.once('done', (_event, state) => {
      const finalState = state === 'completed' ? 'completed' : 'cancelled';
      const dbDownloads = db.getDownloads();
      const index = dbDownloads.findIndex((d) => d.id === id);

      if (index >= 0) {
        dbDownloads[index].state = finalState;
        dbDownloads[index].receivedBytes = item.getReceivedBytes();
        dbDownloads[index].completedAt = new Date().toISOString();
        db.setDownloads(dbDownloads);

        this.sendToRenderer(IPC_CHANNELS.DOWNLOAD_COMPLETE, dbDownloads[index]);
      }
      this.activeDownloads.delete(downloadIdStr);
    });

    this.sendToRenderer(IPC_CHANNELS.DOWNLOAD_START, {
      id,
      url,
      filename,
      totalBytes: item.getTotalBytes(),
      mimeType: item.getMimeType(),
    });
  }

  getDownloads(limit: number = 50): DownloadInfo[] {
    return getDatabase().getDownloads()
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  private sendToRenderer(channel: string, data: unknown): void {
    try {
      this.mainWindow.webContents.send(channel, data);
    } catch {
      // Pencere kapatılmış olabilir
    }
  }
}
