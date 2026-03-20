/**
 * Database — JSON tabanlı yerel veritabanı
 *
 * better-sqlite3 native build sorunlarını önlemek için
 * fs tabanlı asenkron JSON storage (lowdb benzeri) kullanır.
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface DatabaseSchema {
  history: any[];
  bookmarks: any[];
  downloads: any[];
  workspaces: any[];
  pinnedTabs: any[];
}

const defaultSchema: DatabaseSchema = {
  history: [],
  bookmarks: [],
  downloads: [],
  workspaces: [
    { id: 'default', name: 'Kişisel', icon: '👤' },
    { id: 'work', name: 'İş', icon: '💼' },
    { id: 'dev', name: 'Yazılım', icon: '💻' },
  ],
  pinnedTabs: [],
};

class JSONDatabase {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'bseester-browser-db.json');
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf8');
        return { ...defaultSchema, ...JSON.parse(fileContent) };
      }
    } catch (e) {
      console.error('Veritabanı okuma hatası:', e);
    }
    return defaultSchema;
  }

  private saveData(): void {
    try {
      const tempPath = this.dbPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (e) {
      console.error('Veritabanı yazma hatası:', e);
    }
  }

  // --- API ---

  getHistory() {
    return this.data.history;
  }

  setHistory(history: any[]) {
    this.data.history = history;
    this.saveData();
  }

  getBookmarks() {
    return this.data.bookmarks;
  }

  setBookmarks(bookmarks: any[]) {
    this.data.bookmarks = bookmarks;
    this.saveData();
  }

  getDownloads() {
    return this.data.downloads;
  }

  setDownloads(downloads: any[]) {
    this.data.downloads = downloads;
    this.saveData();
  }

  getWorkspaces() {
    return this.data.workspaces || [];
  }

  setWorkspaces(workspaces: any[]) {
    this.data.workspaces = workspaces;
    this.saveData();
  }

  getPinnedTabs() {
    return this.data.pinnedTabs || [];
  }

  setPinnedTabs(tabs: any[]) {
    this.data.pinnedTabs = tabs;
    this.saveData();
  }
}

let dbInstance: JSONDatabase | null = null;

export function getDatabase(): JSONDatabase {
  if (!dbInstance) {
    dbInstance = new JSONDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  dbInstance = null;
}
