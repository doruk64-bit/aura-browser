/**
 * FindBar — Sayfa içi arama çubuğu (Ctrl+F)
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FindBarProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function FindBar({ isVisible, onClose }: FindBarProps) {
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      window.electronAPI?.find.stop();
      setSearchText('');
    }
  }, [isVisible]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    window.electronAPI?.find.inPage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      // API'da findNext tanımlanmadıysa aynı metni tekrar arayarak ilerletilebilir
      // veya main.ts'de gelişmiş findNext eklenebilir. Basitlik için sadece arıyoruz.
      window.electronAPI?.find.inPage(searchText);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glass-strong"
          style={{
            position: 'absolute',
            top: '16px',
            right: '32px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-glass)',
            border: '1px solid var(--border-active)',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⌕</span>
          
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            placeholder="Sayfada bul..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              width: '180px',
            }}
          />

          <div style={{ width: '1px', height: '16px', background: 'var(--border-active)', margin: '0 4px' }} />

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
