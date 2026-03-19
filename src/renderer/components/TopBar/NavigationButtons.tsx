/**
 * NavigationButtons — Geri/İleri/Yenile butonları
 */

import { motion } from 'framer-motion';
import { useTabStore } from '../../store/useTabStore';

export default function NavigationButtons() {
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const buttonStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    padding: 0,
  };

  const disabledStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.3,
    cursor: 'default',
  };

  return (
    <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {/* Geri */}
      <motion.button
        onClick={() => window.electronAPI?.nav.back()}
        disabled={!activeTab?.canGoBack}
        whileHover={activeTab?.canGoBack ? { background: 'rgba(255,255,255,0.06)' } : {}}
        whileTap={activeTab?.canGoBack ? { scale: 0.9 } : {}}
        style={activeTab?.canGoBack ? buttonStyle : disabledStyle}
        title="Geri"
      >
        ←
      </motion.button>

      {/* İleri */}
      <motion.button
        onClick={() => window.electronAPI?.nav.forward()}
        disabled={!activeTab?.canGoForward}
        whileHover={activeTab?.canGoForward ? { background: 'rgba(255,255,255,0.06)' } : {}}
        whileTap={activeTab?.canGoForward ? { scale: 0.9 } : {}}
        style={activeTab?.canGoForward ? buttonStyle : disabledStyle}
        title="İleri"
      >
        →
      </motion.button>

      {/* Yenile / Durdur */}
      <motion.button
        onClick={() => {
          if (activeTab?.isLoading) {
            window.electronAPI?.nav.stop();
          } else {
            window.electronAPI?.nav.reload();
          }
        }}
        whileHover={{ background: 'rgba(255,255,255,0.06)' }}
        whileTap={{ scale: 0.9 }}
        style={buttonStyle}
        title={activeTab?.isLoading ? 'Durdur' : 'Yenile'}
      >
        {activeTab?.isLoading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block' }}
          >
            ◐
          </motion.span>
        ) : (
          '↻'
        )}
      </motion.button>
    </div>
  );
}
