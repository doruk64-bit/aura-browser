/**
 * WorkspaceManager — Çalışma Alanları Yönetimi
 *
 * Sekmeleri belirli gruplar halinde soyutlamaya yarayan mimari.
 * Yan çubuktan çalışma alanı değiştirildiğinde aktif sekmeler gizlenir.
 */

import { getDatabase } from '../database/db';

class WorkspaceManager {
  private activeWorkspaceId: string = 'default';

  getWorkspaces() {
    return getDatabase().getWorkspaces();
  }

  addWorkspace(name: string, icon: string = '📂') {
    const db = getDatabase();
    const list = db.getWorkspaces();
    const id = 'ws_' + Date.now();
    list.push({ id, name, icon });
    db.setWorkspaces(list);
    return id;
  }

  removeWorkspace(id: string) {
    if (id === 'default') return; // Varsayılan silinemez
    const db = getDatabase();
    const list = db.getWorkspaces().filter((w: any) => w.id !== id);
    db.setWorkspaces(list);
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = 'default';
    }
  }

  getActiveWorkspace() {
    return this.activeWorkspaceId;
  }

  setActiveWorkspace(id: string) {
    this.activeWorkspaceId = id;
  }
}

// Global Singleton
export const workspaceManager = new WorkspaceManager();
