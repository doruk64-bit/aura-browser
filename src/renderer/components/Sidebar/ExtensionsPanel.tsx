/**
 * ExtensionsPanel — Premium Vault Design (Engine Pro Style)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Globe, FolderPlus, Trash2, Search, Puzzle } from 'lucide-react';

interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  path: string;
  iconUrl: string;
}

export default function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadExtensions = async () => {
    const list = await window.electronAPI?.extensions?.list?.();
    if (list) setExtensions(list);
  };

  useEffect(() => {
    loadExtensions();
  }, []);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI?.extensions?.load?.();
      if (result) await loadExtensions();
    } catch (err) {
      console.error('Eklenti yükleme hatası:', err);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    await window.electronAPI?.extensions?.remove?.(id);
    await loadExtensions();
  };

  const openWebStore = () => {
    window.electronAPI?.nav?.go('https://chrome.google.com/webstore/category/extensions');
  };

  const filteredExtensions = extensions.filter(ext => 
    ext.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 12px' }}>
      
      {/* ─── Web Store Card ─── */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={openWebStore}
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
          borderRadius: '20px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '60px', opacity: 0.1 }}>🌐</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={20} color="#a78bfa" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Chrome Web Store</span>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
          Milyonlarca eklentiyi keşfet ve tarayıcına anında entegre et.
        </p>
      </motion.div>

      {/* ─── Action Bar ─── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input 
            type="text" 
            placeholder="Ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 10px 10px 32px', 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <motion.button
          whileHover={{ background: 'rgba(139, 92, 246, 0.2)' }}
          onClick={handleLoad}
          style={{
            width: '40px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Fiziksel Eklenti Yükle"
        >
          <FolderPlus size={18} />
        </motion.button>
      </div>

      {/* ─── Vault List ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', paddingBottom: '30px' }}>
        <AnimatePresence>
          {filteredExtensions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.2 }}>🧩</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Eklenti bulunamadı</p>
            </div>
          ) : (
            filteredExtensions.map((ext) => (
              <motion.div
                key={ext.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '18px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
                whileHover={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
              >
                {/* Icon Box */}
                <div style={{ 
                  width: '42px', height: '42px', borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.04)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <img src={ext.iconUrl} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt="" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '13px', fontWeight: 600, color: '#fff', 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                  }}>
                    {ext.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Shield size={10} color="rgba(139, 92, 246, 0.6)" />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>v{ext.version}</span>
                  </div>
                </div>

                {/* Remove Btn */}
                <motion.button
                  whileHover={{ color: '#ef4444', scale: 1.1 }}
                  onClick={() => handleRemove(ext.id)}
                  style={{ 
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', 
                    cursor: 'pointer', padding: '6px' 
                  }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
