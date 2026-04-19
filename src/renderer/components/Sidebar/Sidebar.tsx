/**
 * Sidebar — Reference-matched premium design (Polished)
 * Temiz SVG ikonlar + düzgün spacing + premium glassmorphism
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BookmarksPanel from './BookmarksPanel';
import HistoryPanel from './HistoryPanel';
import DownloadsPanel from './DownloadsPanel';
import WorkspacesPanel from './WorkspacesPanel';
import PerformancePanel from './PerformancePanel';
import CleanerPanel from './CleanerPanel';
import SettingsPanel from './SettingsPanel';
import NotesPanel from './NotesPanel';
import AIPanel from './AIPanel';
import PerformanceOverlay from '../PerformanceOverlay';
import { useTabStore } from '../../store/useTabStore';
import { useSettingsStore } from '../../store/useSettingsStore';

type PanelType = 'none' | 'bookmarks' | 'history' | 'downloads' | 'workspaces' | 'performance' | 'cleaner' | 'notes' | 'ai';

// SVG Icon Components
const icons = {
  focus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
      <path d="M12 16a4 4 0 100-8 4 4 0 000 8z"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
    </svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
    </svg>
  ),
  tabs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 3v6"/>
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  notes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  bolt: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

function SidebarBtn({ icon, label, isActive, onClick, accent }: {
  icon: React.ReactNode; label: string; isActive?: boolean; onClick?: () => void; accent?: string;
}) {
  const activeColor = accent || '#a78bfa';
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ background: 'rgba(139, 92, 246, 0.1)' }}
      whileTap={{ scale: 0.93 }}
      title={label}
      style={{
        width: '100%',
        padding: '8px 4px',
        borderRadius: '10px',
        border: 'none',
        background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        position: 'relative',
        transition: 'all 150ms ease',
        color: isActive ? activeColor : 'rgba(255,255,255,0.45)',
      }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          style={{
            position: 'absolute', left: '-4px', width: '3px', height: '22px',
            borderRadius: '0 3px 3px 0',
            background: 'linear-gradient(180deg, #8b5cf6, #ec4899)',
            boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <div style={{ lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <span style={{
        fontSize: '8px', fontWeight: 600, letterSpacing: '0.2px',
        color: isActive ? activeColor : 'rgba(255,255,255,0.3)',
        textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap',
        fontFamily: "'Inter', sans-serif",
      }}>{label}</span>
    </motion.button>
  );
}

// Divider
function Divider() {
  return <div style={{ width: '32px', height: '1px', background: 'rgba(139, 92, 246, 0.1)', margin: '3px 0' }} />;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const { sidebarPerformanceEnabled, sidebarCleanerEnabled } = useSettingsStore();
  const [perfStats, setPerfStats] = useState({ ramMB: 0, cpuPercent: 0 });

  useEffect(() => {
    const width = activePanel === 'none' ? 0 : 320;
    window.electronAPI?.sidebar?.setPanelWidth(width);
  }, [activePanel]);

  useEffect(() => {
    const unsub = window.electronAPI?.sidebar?.onTogglePanel((panel: any) => {
      setActivePanel((prev) => (prev === panel ? 'none' : panel));
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const unsubNav = window.electronAPI?.system?.onNavigateMainRouter((path: string) => {
      navigate(path);
    });
    return () => unsubNav?.();
  }, [navigate]);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const m = await window.electronAPI?.system?.getPerformanceMetrics();
        if (m) setPerfStats({ ramMB: m.ramMB || 0, cpuPercent: m.cpuPercent || 0 });
      } catch {}
    };
    fetchPerf();
    const iv = setInterval(fetchPerf, 3000);
    return () => clearInterval(iv);
  }, []);

  const toggle = (p: PanelType) => setActivePanel((prev) => (prev === p ? 'none' : p));

  return (
    <div
      className="no-select"
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* ─── Left Icon Strip ─── */}
      <div
        style={{
          width: '64px',
          height: '100%',
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          borderRight: '1px solid rgba(139, 92, 246, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 5px',
          gap: '1px',
          flexShrink: 0,
        }}
      >
        {/* ─── Primary Actions ─── */}
        <SidebarBtn icon={icons.focus} label="Focus" accent="#f472b6" onClick={() => window.electronAPI?.nav.go('about:blank')} />
        <Divider />
        <SidebarBtn icon={icons.ai} label="AI Bot" accent="#fbbf24" isActive={activePanel === 'ai'} onClick={() => toggle('ai')} />
        <SidebarBtn icon={icons.tabs} label="Yer İmleri" isActive={activePanel === 'bookmarks'} onClick={() => toggle('bookmarks')} />
        <Divider />

        {/* ─── Secondary Actions ─── */}
        <SidebarBtn icon={icons.history} label="Geçmiş" isActive={activePanel === 'history'} onClick={() => toggle('history')} />
        <SidebarBtn icon={icons.download} label="İndirme" isActive={activePanel === 'downloads'} onClick={() => toggle('downloads')} />
        <SidebarBtn icon={icons.folder} label="Alanlar" isActive={activePanel === 'workspaces'} onClick={() => toggle('workspaces')} />
        <SidebarBtn icon={icons.notes} label="Notlar" isActive={activePanel === 'notes'} onClick={() => toggle('notes')} />

        {sidebarPerformanceEnabled && (
          <SidebarBtn icon={icons.bolt} label="Panel" isActive={activePanel === 'performance'} onClick={() => toggle('performance')} />
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />
        
        {/* Morrow Bot Micro-Widget */}
        <PerformanceOverlay onClick={() => toggle('performance')} />

        <Divider />
        <SidebarBtn icon={icons.settings} label="Ayarlar" onClick={() => navigate('/settings')} />

        {/* Sparkle */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{ marginTop: '4px', marginBottom: '2px',
            fontSize: '12px', opacity: 0.4,
          }}
        >✦</motion.div>
      </div>

      {/* ─── Side Panel (Flex child, pushes content) ─── */}
      {activePanel !== 'none' && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 320 }}
          transition={{ duration: 0.25 }}
          style={{
            height: '100%',
            background: '#0d0a19',
            borderRight: '1px solid rgba(139, 92, 246, 0.15)',
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ padding: '16px', paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', minWidth: '320px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
              {activePanel === 'bookmarks' && '📑 Yer İmleri'}
              {activePanel === 'history' && '🕐 Geçmiş'}
              {activePanel === 'downloads' && '📥 İndirmeler'}
              {activePanel === 'workspaces' && '📂 Çalışma Alanları'}
              {activePanel === 'notes' && '📝 Not Defteri'}
              {activePanel === 'ai' && '✨ Morrow AI'}
              {activePanel === 'performance' && '⚡️ Performans'}
              {activePanel === 'cleaner' && '🧹 Araçlar'}
            </h3>
            <motion.button
              onClick={() => setActivePanel('none')}
              whileHover={{ background: 'rgba(255,255,255,0.08)' }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
              }}
            >✕</motion.button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)', minWidth: '320px' }}>
            {activePanel === 'history' && <HistoryPanel />}
            {activePanel === 'bookmarks' && <BookmarksPanel />}
            {activePanel === 'downloads' && <DownloadsPanel />}
            {activePanel === 'workspaces' && <WorkspacesPanel />}
            {activePanel === 'notes' && <NotesPanel />}
            {activePanel === 'ai' && <AIPanel />}
            {activePanel === 'performance' && <PerformancePanel />}
            {activePanel === 'cleaner' && <CleanerPanel />}
          </div>
        </motion.div>
      )}
    </div>
  );
}
