import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function PerformancePanel() {
  const {
    maxRamLimit,
    ramLimiterEnabled,
    ramHardLimit,
    setMaxRamLimit,
    setRamLimiterEnabled,
    setRamHardLimit,
    
    networkSpeedLimit,
    networkLimiterEnabled,
    setNetworkSpeedLimit,
    setNetworkLimiterEnabled,

    ramSnoozeTime,
    setRamSnoozeTime,
  } = useSettingsStore();

  const [currentUsageMB, setCurrentUsageMB] = useState(0);
  const [currentSpeedMbps, setCurrentSpeedMbps] = useState(0);

  useEffect(() => {
    // Canlı RAM ve İnternet tüketimini periyodik olarak çek
    const fetchData = async () => {
      if (window.electronAPI?.system?.getRamUsage) {
        const mb = await window.electronAPI.system.getRamUsage();
        setCurrentUsageMB(mb);
      }
      if (window.electronAPI?.system?.getNetworkUsage) {
        const mbps = await window.electronAPI.system.getNetworkUsage();
        setCurrentSpeedMbps(mbps);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1500); // 1.5 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  // ─── 1. RAM Hesaplamaları ───
  const currentGB = (currentUsageMB / 1024).toFixed(1);
  const limitGB = maxRamLimit > 0 ? (maxRamLimit / 1024).toFixed(1) : 'Sınırsız';
  const percentageRam = maxRamLimit > 0 ? Math.min((currentUsageMB / maxRamLimit) * 100, 100) : 0;
  
  const radius = 60; // 70'ten ufak yaptık ki sığsın
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetRam = circumference - (percentageRam / 100) * circumference;
  const gaugeColorRam = percentageRam > 90 ? '#ef4444' : percentageRam > 75 ? '#f59e0b' : '#ef4444';

  // ─── 2. Internet Hesaplamaları ───
  const limitMbps = networkSpeedLimit > 0 ? networkSpeedLimit : 'Sınırsız';
  const percentageNet = networkSpeedLimit > 0 ? Math.min((currentSpeedMbps / networkSpeedLimit) * 100, 100) : 0;
  const strokeDashoffsetNet = circumference - (percentageNet / 100) * circumference;
  const gaugeColorNet = percentageNet > 90 ? '#3b82f6' : '#3b82f6'; // Mavi/Neon Opera tarzı

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-primary)', paddingBottom: '20px' }}>
      
      {/* 💻 RAM SINIRLAYICI BLOK 💻 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📟</span>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>RAM SINIRLAYICI</span>
          </div>
          <div 
            onClick={() => setRamLimiterEnabled(!ramLimiterEnabled)}
            style={{
              width: '32px', height: '18px',
              background: ramLimiterEnabled ? '#ef4444' : 'rgba(255,255,255,0.1)',
              borderRadius: '9px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <motion.div
              animate={{ x: ramLimiterEnabled ? 15 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '1px' }}
            />
          </div>
        </div>

        {/* Dairesel Sayaç (Gauge) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" />
              <motion.circle
                cx="65" cy="65" r={radius} fill="transparent"
                stroke={ramLimiterEnabled ? gaugeColorRam : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffsetRam}
                strokeLinecap="round" transform="rotate(-90 65 65)" transition={{ duration: 0.5 }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'monospace' }}>{currentGB}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>GB</span>
            </div>
          </div>
        </div>

        {/* Kaydırıcı (Slider) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Bellek Sınırı</span>
            <span style={{ fontWeight: 600, color: '#ef4444' }}>{limitGB} GB</span>
          </div>
          <input
            type="range" min="1536" max="16384" step="512"
            value={maxRamLimit >= 1536 ? maxRamLimit : 1536}
            disabled={!ramLimiterEnabled}
            onChange={(e) => setMaxRamLimit(Number(e.target.value))}
            style={{ cursor: ramLimiterEnabled ? 'pointer' : 'not-allowed', accentColor: '#ef4444', opacity: ramLimiterEnabled ? 1 : 0.4 }}
          />
        </div>

        {/* KESİN SINIR */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', opacity: ramLimiterEnabled ? 1 : 0.5 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>KESİN SINIR</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Bellek sınırı aşılamaz.</span>
          </div>
          <div 
            onClick={() => ramLimiterEnabled && setRamHardLimit(!ramHardLimit)}
            style={{
              width: '32px', height: '18px',
              background: ramHardLimit && ramLimiterEnabled ? '#ef4444' : 'rgba(255,255,255,0.1)',
              borderRadius: '9px', position: 'relative', cursor: ramLimiterEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            <motion.div
              animate={{ x: ramHardLimit && ramLimiterEnabled ? 15 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '1px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

      {/* 🌍 İNTERNET SINIRLAYICI BLOK 🌍 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌐</span>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>İNTERNET SINIRLAYICI</span>
          </div>
          <div 
            onClick={() => {
              const next = !networkLimiterEnabled;
              setNetworkLimiterEnabled(next);
              if (!next) {
                setNetworkSpeedLimit(0); // Sınırsız yap (Disable)
              } else {
                setNetworkSpeedLimit(networkSpeedLimit > 0 ? networkSpeedLimit : 5); // Varsayılan 5 Mbps
              }
            }}
            style={{
              width: '32px', height: '18px',
              background: networkLimiterEnabled ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              borderRadius: '9px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <motion.div
              animate={{ x: networkLimiterEnabled ? 15 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '1px' }}
            />
          </div>
        </div>

        {/* Dairesel Sayaç (Gauge) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" />
              <motion.circle
                cx="65" cy="65" r={radius} fill="transparent"
                stroke={networkLimiterEnabled ? gaugeColorNet : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffsetNet}
                strokeLinecap="round" transform="rotate(-90 65 65)" transition={{ duration: 0.5 }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>{currentSpeedMbps.toFixed(1)}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>Mbps</span>
            </div>
          </div>
        </div>

        {/* Kaydırıcı (Slider) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Hız Sınırı</span>
            <span style={{ fontWeight: 600, color: '#3b82f6' }}>{limitMbps} Mbps</span>
          </div>
          <input
            type="range" min="1" max="100" step="1"
            value={networkSpeedLimit || 1}
            disabled={!networkLimiterEnabled}
            onChange={(e) => setNetworkSpeedLimit(Number(e.target.value))}
            style={{ cursor: networkLimiterEnabled ? 'pointer' : 'not-allowed', accentColor: '#3b82f6', opacity: networkLimiterEnabled ? 1 : 0.3 }}
          />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

      {/* 💤 SEKME UYUTMA BLOK 💤 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>💤</span>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>SEKME UYUTMA</span>
          </div>
          <div 
            onClick={() => setRamSnoozeTime(ramSnoozeTime > 0 ? 0 : 5)} // Kapat ya da 5 dk yap
            style={{
              width: '32px', height: '18px',
              background: ramSnoozeTime > 0 ? '#10b981' : 'rgba(255,255,255,0.1)',
              borderRadius: '9px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <motion.div
              animate={{ x: ramSnoozeTime > 0 ? 15 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '1px' }}
            />
          </div>
        </div>

        {/* Bilgilendirme ve Kaydırıcı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>İnaktiflik Süresi</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>{ramSnoozeTime > 0 ? `${ramSnoozeTime} dk` : 'Kapalı'}</span>
          </div>
          <input
            type="range" min="5" max="60" step="5"
            value={ramSnoozeTime || 5}
            disabled={ramSnoozeTime === 0}
            onChange={(e) => setRamSnoozeTime(Number(e.target.value))}
            style={{ cursor: ramSnoozeTime > 0 ? 'pointer' : 'not-allowed', accentColor: '#10b981', opacity: ramSnoozeTime > 0 ? 1 : 0.3 }}
          />
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Uzun süre dokunmadığın sekmeler otomatik uyutularak bellek boşaltılır.
        </div>
      </div>

    </div>
  );
}
