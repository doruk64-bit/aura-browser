/**
 * ExtensionsPanel — Yüklü eklentileri listeleyen panel
 *
 * Kurulum artık tamamen Chrome Web Store üzerinden yapılır.
 * Kullanıcı chrome.google.com/webstore'a gidip eklenti kurar,
 * electron-chrome-web-store bunu otomatik yakalar.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  path: string;
}

export default function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExtensions = async () => {
    const list = await window.electronAPI?.extensions?.list();
    if (list) setExtensions(list);
  };

  useEffect(() => {
    loadExtensions();
  }, []);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI?.extensions?.load();
      if (result) await loadExtensions();
    } catch (err) {
      console.error('Eklenti yükleme hatası:', err);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    await window.electronAPI?.extensions?.remove(id);
    await loadExtensions();
  };

  const openWebStore = () => {
    window.electronAPI?.nav?.go('https://chrome.google.com/webstore/category/extensions');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Chrome Web Store'dan Kur */}
      <motion.button
        onClick={openWebStore}
        whileHover={{ scale: 1.02, background: 'rgba(99,102,241,0.18)' }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(99,102,241,0.10)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent)',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span style={{ fontSize: '18px' }}>🌐</span>
        Chrome Web Store'u Aç
      </motion.button>

      {/* Klasörden Unpacked Yükle */}
      <motion.button
        onClick={handleLoad}
        disabled={loading}
        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.12)' }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px dashed var(--border-active)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          cursor: loading ? 'wait' : 'pointer',
          width: '100%',
          textAlign: 'left',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span style={{ fontSize: '18px' }}>{loading ? '⏳' : '📂'}</span>
        {loading ? 'Yükleniyor...' : 'Klasörden Yükle (Geliştirici)'}
      </motion.button>

      {/* Yüklü Eklentiler */}
      {extensions.length === 0 ? (
        <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          <p style={{ fontSize: '32px', marginBottom: '10px' }}>🧩</p>
          <p style={{ fontWeight: 500, marginBottom: '6px' }}>Henüz eklenti yüklü değil</p>
          <p style={{ fontSize: '11px', opacity: 0.7, lineHeight: '1.6' }}>
            Chrome Web Store'a giderek<br />istediğin eklentiyi kurabilirsin.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {extensions.map((ext) => (
            <motion.div
              key={ext.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <img
                src={`chrome-extension://${ext.id}/icon128.png`}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ext.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  v{ext.version}
                </div>
              </div>
              <motion.button
                onClick={() => handleRemove(ext.id)}
                whileHover={{ color: 'var(--danger)', scale: 1.1 }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: '13px', padding: '4px', flexShrink: 0,
                }}
                title="Eklentiyi Kaldır"
              >
                ✕
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Bilgi */}
      <div style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.6' }}>
          💡 <strong>Chrome Web Store</strong>'a git, eklentini bul ve <strong>"Chrome'a Ekle"</strong> butonuna tıkla. Morrow otomatik olarak kurar.
        </p>
      </div>
    </div>
  );
}
