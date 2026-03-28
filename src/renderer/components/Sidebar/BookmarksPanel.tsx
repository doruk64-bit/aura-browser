/**
 * BookmarksPanel — Yer imlerini listeleyen yan panel (Premium Redesign)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.electronAPI?.bookmarks?.get?.()?.then((data: any[]) => {
      setBookmarks(data || []);
    });
  }, []);

  const handleOpen = (url: string) => {
    window.electronAPI?.nav.go(url);
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 12px' }}>
      
      {/* ─── Arama ─── */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Yer imlerinde ara..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            padding: '10px 12px', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '8px', 
            color: '#fff', 
            fontSize: '12px', 
            width: '100%', 
            outline: 'none', 
            boxSizing: 'border-box' 
          }}
        />
      </div>

      {/* ─── Liste ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', paddingBottom: '20px' }}>
        <AnimatePresence>
          {filteredBookmarks.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
              {bookmarks.length === 0 ? 'Henüz yer imi eklenmemiş.' : 'Sonuç bulunamadı.'}
            </div>
          ) : (
            filteredBookmarks.map((b) => (
              <motion.div
                key={b.id}
                onClick={() => handleOpen(b.url)}
                whileHover={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                layout
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                 {/* Header Row */}
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                   <span style={{ 
                     fontSize: '13px', 
                     fontWeight: 600, 
                     color: '#fff', 
                     flex: 1,
                     lineHeight: 1.3,
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden',
                   }}>
                    {b.title || b.url}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* delete logic would go here */ }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '2px' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Content Row */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.03)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=64`} 
                      style={{ width: '18px', height: '18px', borderRadius: '2px' }} 
                      alt="" 
                    />
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    color: 'rgba(255,255,255,0.4)', 
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-all'
                  }}>
                    {b.url}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
