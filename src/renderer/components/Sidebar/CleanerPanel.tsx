/**
 * CleanerPanel — Sistem temizleme ve performans paneli (Premium Redesign)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CleanerPanel() {
  const [cleanLevel, setCleanLevel] = useState<'MIN' | 'MED' | 'MAX'>('MED');
  const [stats, setStats] = useState({ cacheSize: 0, cookieCount: 0, downloadCount: 0 });
  const [isCleaning, setIsCleaning] = useState(false);
  const [toggles, setToggles] = useState({
    cache: true,
    cookies: true,
    tabs: false,
    history: false,
    downloads: false,
  });

  const fetchStats = async () => {
    const api = (window as any).electronAPI;
    if (!api) return;
    try {
      const cacheBytes = await api.system.getCacheSize();
      const cookies = await api.system.getCookiesCount();
      const downloadsStr = await api.downloads.get();
      setStats({
        cacheSize: Math.floor((cacheBytes || 0) / (1024 * 1024)),
        cookieCount: cookies || 0,
        downloadCount: downloadsStr ? downloadsStr.length : 0,
      });
    } catch (e) {
      console.error('fetchStats error:', e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const startCleaning = async () => {
    const api = (window as any).electronAPI;
    if (!api || isCleaning) return;
    
    setIsCleaning(true);
    try {
      if (toggles.cache) await api.system.clearCache();
      if (toggles.cookies) await api.system.clearCookies();
      if (toggles.history) await api.history.clear();
      // Wait for a bit to show animation
      await new Promise(r => setTimeout(r, 2000));
      await fetchStats();
    } catch (e) {
      console.error('Cleaning error:', e);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 12px' }}>
      
      {/* ─── Header: Storage Gauge ─── */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 24px' }}>
         <div style={{ 
           width: '180px', height: '180px', borderRadius: '50%', 
           border: '2px solid rgba(139, 92, 246, 0.1)', 
           display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
           position: 'relative',
           background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)'
         }}>
           <motion.div 
             animate={isCleaning ? { rotate: 360 } : { rotate: 0 }}
             transition={isCleaning ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
             style={{ 
               position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, 
               borderRadius: '50%', border: '2px solid transparent',
               borderTop: isCleaning ? '2px solid #a78bfa' : '2px solid rgba(139, 92, 246, 0.3)',
               opacity: isCleaning ? 1 : 0.5
             }} 
           />
           
           <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', marginBottom: '8px' }}>
             SİSTEM YÜKÜ
           </span>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
             <span style={{ fontSize: '42px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
               {stats.cacheSize}
             </span>
             <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>MB</span>
           </div>
           <span style={{ fontSize: '11px', color: '#a78bfa', marginTop: '10px', fontWeight: 600 }}>
             {isCleaning ? 'TEMİZLENİYOR...' : 'OPTIMIZE EDİLDİ'}
           </span>
         </div>
      </div>

      {/* ─── Level Select ─── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['MIN', 'MED', 'MAX'] as const).map(lvl => (
          <button
            key={lvl}
            onClick={() => setCleanLevel(lvl)}
            style={{
              flex: 1, padding: '10px', borderRadius: '12px',
              background: cleanLevel === lvl ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
              border: '1px solid ' + (cleanLevel === lvl ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'),
              color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* ─── Settings Area ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', marginBottom: '4px' }}>
          GELİŞMİŞ KURULUM
        </h4>
        
        {[
          { id: 'cache', label: 'Önbellek (Cache)', val: `${stats.cacheSize} MB` },
          { id: 'cookies', label: 'Çerezler', val: `${stats.cookieCount} Adet` },
          { id: 'history', label: 'Tarama Geçmişi', val: 'Tümü' },
          { id: 'tabs', label: 'Bütün Sekmeler', val: 'Kapat' },
        ].map(item => (
          <motion.div
            key={item.id}
            whileHover={{ background: 'rgba(255,255,255,0.03)' }}
            style={{
              padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{item.label}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{item.val}</span>
            </div>
            <div 
              onClick={() => setToggles(p => ({ ...p, [item.id]: !p[item.id as keyof typeof toggles] }))}
              style={{
                width: '36px', height: '20px', borderRadius: '10px',
                background: toggles[item.id as keyof typeof toggles] ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                border: '1px solid ' + (toggles[item.id as keyof typeof toggles] ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.1)')
              }}
            >
              <motion.div 
                animate={{ x: toggles[item.id as keyof typeof toggles] ? 18 : 2 }}
                style={{ width: '14px', height: '14px', borderRadius: '7px', background: '#fff', position: 'absolute', top: '2px' }} 
              />
            </div>
          </motion.div>
        ))}

        <button
          onClick={startCleaning}
          disabled={isCleaning}
          style={{
            marginTop: '12px', padding: '14px', borderRadius: '16px',
            background: isCleaning ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
            color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: isCleaning ? 'default' : 'pointer'
          }}
        >
          {isCleaning ? 'Temizleniyor...' : 'Şimdi Optimize Et'}
        </button>
      </div>
    </div>
  );
}
