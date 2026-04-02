/**
 * History — Tarayıcı geçmişi yönetimi (JSON Storage)
 */

import { getDatabase } from '../database/db';

export interface HistoryEntry {
  id: number;
  url: string;
  title: string;
  visit_count: number;
  last_visited_at: string;
  created_at: string;
}

export class HistoryManager {
  addVisit(url: string, title: string): void {
    const path = require('path');
    const { app } = require('electron');
    const logPath = path.join(app.getPath('userData'), 'nav_log.txt');
    try {
      require('fs').appendFileSync(logPath, `[${new Date().toISOString()}] addVisit: url="${url}" title="${title}"\n`);
    } catch {}

    if (!url || url === 'about:blank') return;
    
    // Geçmiş izleme ayarını kontrol et
    const db = getDatabase();
    if (!db.getSettings().isHistoryEnabled) {
      return;
    }
 
    const history = db.getHistory();
    const existingIndex = history.findIndex((h) => h.url === url);

    if (existingIndex >= 0) {
      history[existingIndex].title = title;
      history[existingIndex].visit_count += 1;
      history[existingIndex].last_visited_at = new Date().toISOString();
    } else {
      history.push({
        id: Date.now(),
        url,
        title,
        visit_count: 1,
        last_visited_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    db.setHistory(history);
  }

  getHistory(limit: number = 100, offset: number = 0): HistoryEntry[] {
    const db = getDatabase();
    return db.getHistory()
      .sort((a, b) => new Date(b.last_visited_at).getTime() - new Date(a.last_visited_at).getTime())
      .slice(offset, offset + limit);
  }

  search(query: string, limit: number = 20): HistoryEntry[] {
    const db = getDatabase();
    const lowerQuery = query.toLowerCase();
    
    return db.getHistory()
      .filter((h) => h.url.toLowerCase().includes(lowerQuery) || h.title.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        if (b.visit_count !== a.visit_count) return b.visit_count - a.visit_count;
        return new Date(b.last_visited_at).getTime() - new Date(a.last_visited_at).getTime();
      })
      .slice(0, limit);
  }

  deleteEntry(id: number): void {
    const db = getDatabase();
    db.setHistory(db.getHistory().filter((h) => h.id !== id));
  }

  clearAll(): void {
    getDatabase().setHistory([]);
  }
}
