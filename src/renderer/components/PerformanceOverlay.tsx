/**
 * Morrow Bot — Sidebar içinde duran mikro performans widget'ı (Compact Redesign)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PerformanceOverlay({ onClick }: { onClick?: () => void }) {
  const [perfStats, setPerfStats] = useState({ ramMB: 0, cpuPercent: 0 });

  useEffect(() => {
    const updateStats = async () => {
      const stats = await window.electronAPI?.system?.getPerformanceMetrics?.();
      if (stats) setPerfStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const ramGB = (perfStats.ramMB / 1024).toFixed(1);

  return (
    <motion.div
      whileHover={{ background: 'rgba(139, 92, 246, 0.1)', scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        width: '54px',
        padding: '10px 4px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        marginTop: '8px',
        marginBottom: '8px'
      }}
    >
      {/* Label */}
      <span style={{ 
        fontSize: '7px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', 
        textTransform: 'uppercase', letterSpacing: '0.8px'
      }}>BOT</span>

      {/* RAM */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>{ramGB}</span>
        <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>GB</span>
      </div>

      {/* Divider */}
      <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

      {/* CPU */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{perfStats.cpuPercent}%</span>
        <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>CPU</span>
      </div>

      {/* Pulse Dot */}
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ 
          width: '4px', height: '4px', borderRadius: '50%', 
          background: 'var(--accent)', boxShadow: '0 0 5px var(--accent-glow)' 
        }}
      />
    </motion.div>
  );
}
