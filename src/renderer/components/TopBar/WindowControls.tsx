/**
 * WindowControls — Windows pencere kontrolleri (küçült/büyüt/kapat)
 * macOS'te gösterilmez (native trafik lambaları kullanılır).
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function WindowControls() {
  const platform = window.electronAPI?.platform ?? 'win32';
  const [isMaximized, setIsMaximized] = useState(false);

  if (platform === 'darwin') return null;

  // Pencere durumu değişikliklerini dinle
  window.electronAPI?.window.onStateChanged?.((data) => {
    setIsMaximized(data.isMaximized);
  });

  const btnBase: React.CSSProperties = {
    width: '46px',
    height: '100%',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    padding: 0,
    fontFamily: 'Segoe Fluent Icons, Segoe MDL2 Assets, sans-serif',
  };

  return (
    <div className="no-drag" style={{ display: 'flex', height: '100%' }}>
      {/* Küçült */}
      <motion.button
        onClick={() => window.electronAPI?.window.minimize()}
        whileHover={{ background: 'rgba(255,255,255,0.06)' }}
        style={btnBase}
        title="Küçült"
      >
        <svg width="10" height="1" viewBox="0 0 10 1">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </motion.button>

      {/* Büyüt / Geri Al */}
      <motion.button
        onClick={() => {
          window.electronAPI?.window.maximize();
          setIsMaximized(!isMaximized);
        }}
        whileHover={{ background: 'rgba(255,255,255,0.06)' }}
        style={btnBase}
        title={isMaximized ? 'Geri Al' : 'Büyüt'}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="2" y="0" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
            <rect x="0" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="var(--bg-secondary)" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </motion.button>

      {/* Kapat */}
      <motion.button
        onClick={() => window.electronAPI?.window.close()}
        whileHover={{ background: '#e81123', color: '#fff' }}
        style={btnBase}
        title="Kapat"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </motion.button>
    </div>
  );
}
