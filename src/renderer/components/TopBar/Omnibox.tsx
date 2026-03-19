/**
 * Omnibox — Birleşik adres çubuğu ve arama
 * URL girişi ve arama sorgularını tek input'ta birleştirir.
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTabStore } from '../../store/useTabStore';

export default function Omnibox() {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { tabs, activeTabId } = useTabStore();

  // Aktif sekmenin URL'ini göster
  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (!isFocused && activeTab) {
      setInputValue(activeTab.url === 'about:blank' ? '' : activeTab.url);
    }
  }, [activeTab?.url, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    window.electronAPI?.nav.go(inputValue.trim());
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!inputValue.trim()) return;
      window.electronAPI?.nav.go(inputValue.trim());
      inputRef.current?.blur();
    }
  };

  // Aktif sekme yükleniyor mu?
  const isLoading = activeTab?.isLoading ?? false;

  return (
    <form
      onSubmit={handleSubmit}
      className="no-drag"
      style={{
        flex: 1,
        position: 'relative',
      }}
    >
      <motion.div
        animate={{
          borderColor: isFocused ? 'var(--accent)' : 'var(--border-subtle)',
          boxShadow: isFocused ? '0 0 0 3px var(--accent-glow)' : '0 0 0 0 transparent',
        }}
        transition={{ duration: 0.15 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '36px',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.04)',
          padding: '0 14px',
          transition: 'background var(--transition-fast)',
        }}
      >
        {/* Güvenlik/Arama ikonu */}
        <div style={{
          color: isFocused ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '13px',
          flexShrink: 0,
          transition: 'color var(--transition-fast)',
        }}>
          {isLoading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block' }}
            >
              ◐
            </motion.span>
          ) : isFocused ? '⌕' : '🔒'}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Ara veya URL gir..."
          spellCheck={false}
          autoComplete="off"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.01em',
          }}
        />

        {/* Yükleme durumunu durdur butonu */}
        {isLoading && (
          <motion.button
            type="button"
            onClick={() => window.electronAPI?.nav.stop()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ color: 'var(--danger)' }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✕
          </motion.button>
        )}

        {/* Yer İmi Ekleme Butonu */}
        {!isLoading && activeTab && activeTab.url !== 'about:blank' && activeTab.url !== '' && (
          <motion.button
            type="button"
            onClick={() => {
              window.electronAPI?.bookmarks?.add?.(activeTab.url, activeTab.title || 'Yeni Yer İmi');
            }}
            whileHover={{ scale: 1.2, color: '#f59e0b' }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '15px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Yer imlerine ekle"
          >
            ★
          </motion.button>
        )}
      </motion.div>
    </form>
  );
}
