/**
 * BookmarksPanel — Yer imlerini listeleyen yan panel
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTabStore } from '../../store/useTabStore';

export default function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const workspaceId = activeTab?.workspaceId || 'default';

  useEffect(() => {
    // IPC üzerinden yer imlerini yükle
    window.electronAPI?.bookmarks?.get?.()?.then((data: any[]) => {
      setBookmarks(data || []);
    });
  }, [workspaceId]);

  const handleOpen = (url: string) => {
    window.electronAPI?.nav.go(url);
  };

  if (bookmarks.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        Henüz yer imi eklenmemiş.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {bookmarks.map((b) => (
        <motion.div
          key={b.id}
          onClick={() => handleOpen(b.url)}
          whileHover={{ background: 'rgba(255,255,255,0.08)' }}
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {b.title || b.url}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {b.url}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
