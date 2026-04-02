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

  updateWorkspace(id: string, name: string, icon: string) {
    console.log('[WorkspaceManager] Updating:', id, name, icon);
    const db = getDatabase();
    const list = db.getWorkspaces();
    
    let found = false;
    const updatedList = list.map((w: any) => {
      if (w.id.toString() === id.toString()) {
        found = true;
        return { ...w, name, icon };
      }
      return w;
    });
    
    if (found) {
      db.setWorkspaces(updatedList);
      console.log('[WorkspaceManager] Updated successfully');
      return true;
    }
    
    console.log('[WorkspaceManager] ID not found:', id);
    return false;
  }

  reorderWorkspaces(newOrder: any[]) {
    getDatabase().setWorkspaces(newOrder);
  }
}

// Global Singleton
export const workspaceManager = new WorkspaceManager();
