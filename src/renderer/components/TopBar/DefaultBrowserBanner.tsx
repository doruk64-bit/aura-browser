import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Star } from 'lucide-react';

export default function DefaultBrowserBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDefault, setIsDefault] = useState<boolean | null>(null);

  const checkDefault = async () => {
    if (window.electronAPI?.system?.isDefaultBrowser) {
      const result = await window.electronAPI.system.isDefaultBrowser();
      setIsDefault(result);
      
      // Eğer varsayılan değilse ve bu oturumda kapatılmadıysa göster
      const isDismissed = sessionStorage.getItem('default-browser-banner-dismissed');
      if (result === false && !isDismissed) {
        setIsVisible(true);
      } else if (result === true) {
        setIsVisible(false);
      }
    }
  };

  useEffect(() => {
    checkDefault();

    // Pencereye geri gelince veya her 30 saniyede bir kontrol et
    window.addEventListener('focus', checkDefault);
    const interval = setInterval(checkDefault, 30000);

    return () => {
      window.removeEventListener('focus', checkDefault);
      clearInterval(interval);
    };
  }, []);

  const handleSetDefault = async () => {
    if (window.electronAPI?.system?.setAsDefaultBrowser) {
      await window.electronAPI.system.setAsDefaultBrowser();
      // Kullanıcı ayarları yapmış olabilir, 5 saniye sonra tekrar kontrol et
      setTimeout(async () => {
        const result = await window.electronAPI.system.isDefaultBrowser();
        if (result) {
          setIsVisible(false);
          setIsDefault(true);
        }
      }, 5000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('default-browser-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '36px', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: 'rgba(139, 92, 246, 0.12)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '0 12px',
            gap: '12px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} className="text-purple-400" style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Morrow henüz varsayılan tarayıcınız değil.
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, background: 'var(--accent)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSetDefault}
            style={{
              background: 'rgba(139, 92, 246, 0.8)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <Star size={12} fill="currentColor" />
            Varsayılan Yap
          </motion.button>

          <button
            onClick={checkDefault}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            Tekrar Kontrol Et
          </button>

          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
