/**
 * DownloadsPanel — İndirme listesi yan paneli (Premium Redesign)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DownloadsPanel() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.downloads?.get?.()?.then((data: any[]) => {
      setDownloads(data || []);
    });

    const unsubStart = api.downloads.onStart?.((data: any) => {
      setDownloads((prev) => [data, ...prev]);
    });

    const unsubProgress = api.downloads.onProgress?.((data: any) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });

    const unsubComplete = api.downloads.onComplete?.((data: any) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });

    return () => {
      unsubStart?.();
      unsubProgress?.();
      unsubComplete?.();
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filteredDownloads = downloads.filter(item => 
    item.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 12px' }}>
      
      {/* ─── Arama ─── */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="İndirmelerde ara..." 
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

      {/* ─── İndirme Listesi ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', paddingBottom: '20px' }}>
        <AnimatePresence>
          {filteredDownloads.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
              İndirme bulunamadı.
            </div>
          ) : (
            filteredDownloads.map((item) => {
              const progress = item.totalBytes > 0 ? (item.receivedBytes / item.totalBytes) * 100 : 0;
              const isFinished = item.state === 'completed' || item.state === 'cancelled';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    if (item.state === 'completed' && item.savePath) {
                      window.electronAPI?.downloads?.open(item.savePath);
                    }
                  }}
                  whileHover={item.state === 'completed' ? { background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' } : {}}
                  layout
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: item.state === 'completed' ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Header: State Label + Title + Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: '#fff', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      flex: 1,
                      marginRight: '10px'
                    }} title={item.filename}>
                      {item.filename || 'Dosya'}
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: item.state === 'completed' ? '#34d399' : 'rgba(255,255,255,0.4)', 
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {item.state === 'progressing' ? `${Math.round(progress)}%` : item.state}
                    </span>
                  </div>

                  {/* Progress Bar Area */}
                  {item.state === 'progressing' && (
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{ height: '100%', background: 'var(--accent)' }} 
                      />
                    </div>
                  )}

                  {/* Icon + Meta Info Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', 
                      background: 'rgba(255,255,255,0.03)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                       {item.icon ? (
                         <img src={item.icon} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                       ) : (
                         <span style={{ fontSize: '18px' }}>📂</span>
                       )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                       <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                         {item.state === 'progressing' ? `${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes)}` : formatBytes(item.totalBytes)}
                       </span>
                       <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                         {new Date(item.startedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>

                  {/* Controls Drawer */}
                  {!isFinished && (
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.electronAPI?.downloads?.action(item.id, item.state === 'progressing' ? 'pause' : 'resume'); }}
                        style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        {item.state === 'progressing' ? '⏸ Duraklat' : '▶️ Devam Et'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.electronAPI?.downloads?.action(item.id, 'cancel'); }}
                        style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#f87171', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        ✕ İptal
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
