/**
 * HistoryPanel — Tarayıcı geçmişini listeleyen yan panel
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function HistoryPanel() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // IPC üzerinden geçmişi yükle
    window.electronAPI?.history?.get?.()
      ?.then((data: any[]) => {
        setHistory(data || []);
      })
      ?.catch((err: any) => {
        setHistory([{ id: -1, title: 'Yükleme Hatası', url: err.message || 'Bilinmeyen hata' }]);
      });
  }, []);

  const handleOpen = (url: string) => {
    window.electronAPI?.nav.go(url);
  };

  const clearHistory = () => {
    window.electronAPI?.history?.clear?.();
    setHistory([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {history.length > 0 && (
        <button
          onClick={clearHistory}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '12px',
            marginBottom: '12px',
            alignSelf: 'flex-start',
          }}
        >
          Geçmişi Temizle
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {history.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Geçmiş kaydı yok.
          </div>
        ) : (
          history.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => handleOpen(item.url)}
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
                {item.title || item.url}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
                {item.url}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {new Date(item.last_visited_at).toLocaleString('tr-TR')}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
