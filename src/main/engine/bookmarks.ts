/**
 * Bookmarks — Yer imleri yönetimi (JSON Storage)
 */

import { getDatabase } from '../database/db';

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  folder: string;
  favicon: string;
  created_at: string;
  workspaceId?: string;
}

export class BookmarkManager {
  add(url: string, title: string, workspaceId: string = 'default', folder: string = 'Genel'): number {
    const db = getDatabase();
    const bookmarks = db.getBookmarks();
    const id = Date.now();
    
    bookmarks.push({
      id,
      url,
      title,
      folder,
      favicon: '',
      created_at: new Date().toISOString(),
      workspaceId,
    });
    
    db.setBookmarks(bookmarks);
    return id;
  }

  remove(id: number): void {
    const db = getDatabase();
    db.setBookmarks(db.getBookmarks().filter((b) => b.id !== id));
  }

  removeByUrl(url: string): void {
    const db = getDatabase();
    db.setBookmarks(db.getBookmarks().filter((b) => b.url !== url));
  }

  getAll(workspaceId?: string): Bookmark[] {
    let list = getDatabase().getBookmarks();
    if (workspaceId) {
      list = list.filter((b) => b.workspaceId === workspaceId || !b.workspaceId);
    }
    return list.sort((a, b) => {
      if (a.folder !== b.folder) return a.folder.localeCompare(b.folder);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  getByFolder(folder: string): Bookmark[] {
    return getDatabase().getBookmarks()
      .filter((b) => b.folder === folder)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  isBookmarked(url: string): boolean {
    return getDatabase().getBookmarks().some((b) => b.url === url);
  }

  search(query: string, limit: number = 20): Bookmark[] {
    const lowerQuery = query.toLowerCase();
    return getDatabase().getBookmarks()
      .filter((b) => b.url.toLowerCase().includes(lowerQuery) || b.title.toLowerCase().includes(lowerQuery))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  getFolders(): string[] {
    const folders = new Set(getDatabase().getBookmarks().map((b) => b.folder));
    return Array.from(folders).sort();
  }
}
