import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Monitor, 
  ShieldAlert, 
  Star, 
  History, 
  Download, 
  Key, 
  Printer, 
  Trash2, 
  Settings, 
  LogOut,
  Maximize,
  Minus,
  User,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useTabStore } from '../../store/useTabStore';

export default function ChromeMenuOverlay() {
  const [zoom, setZoom] = useState(100);
  const [turboEnabled, setTurboEnabled] = useState(false);
  const [deepCleaning, setDeepCleaning] = useState(false);

  useEffect(() => {
    window.electronAPI.tabs.getZoomFactor().then((factor: number) => {
      setZoom(Math.round(factor * 100));
    });
  }, []);

  const closeMenu = () => {
    window.electronAPI?.system?.closeChromeMenu();
  };

  const handleNewTab = () => {
    window.electronAPI?.tabs.create('about:blank');
    closeMenu();
  };

  const handleNewWindow = () => {
    window.electronAPI?.tabs.create('about:blank');
    closeMenu();
  };

  const handleNewIncognito = () => {
    window.electronAPI?.system?.newIncognitoWindow();
    closeMenu();
  };

  const handleHistory = () => {
    window.electronAPI?.sidebar?.togglePanel('history');
    closeMenu();
  };

  const handleDownloads = () => {
    window.electronAPI?.sidebar?.togglePanel('downloads');
    closeMenu();
  };

  const handleBookmarks = () => {
    window.electronAPI?.sidebar?.togglePanel('bookmarks');
    closeMenu();
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    setZoom(newZoom);
    window.electronAPI.tabs.setZoomFactor(newZoom / 100);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50);
    setZoom(newZoom);
    window.electronAPI.tabs.setZoomFactor(newZoom / 100);
  };

  const handleZoomReset = () => {
    setZoom(100);
    window.electronAPI.tabs.setZoomFactor(1.0);
  };

  const handleFullScreen = () => {
    window.electronAPI?.window.maximize();
    closeMenu();
  };

  const handlePrint = () => {
    window.electronAPI?.nav.print();
    closeMenu();
  };

  const handleClearData = () => {
    window.electronAPI?.history?.clear();
    closeMenu();
  };

  const handleSettings = () => {
    window.electronAPI?.system?.navigateMainRouter('/settings');
    closeMenu();
  };

  const handleTurboToggle = async () => {
    const newState = !turboEnabled;
    setTurboEnabled(newState);
    await window.electronAPI?.system?.setTurboMode?.(newState);
  };

  const handleDeepClean = async () => {
    setDeepCleaning(true);
    const res = await window.electronAPI?.system?.deepClean?.();
    setTimeout(() => {
      setDeepCleaning(false);
      if (res?.success) {
        // İsteğe bağlı: UI'da bir bildirim gösterilebilir
      }
    }, 1500);
  };

  const handleQuit = () => {
    window.electronAPI?.window.close();
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: '4px', backgroundColor: 'transparent' }}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '18px',
            padding: '12px 0',
            boxShadow: '0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(139, 92, 246, 0.35)',
            overflowY: 'auto',
            background: 'rgba(12, 10, 24, 0.82)', 
            backdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ─── Profil Kartı ─── */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.18)',
              background: 'linear-gradient(to right, rgba(139, 92, 246, 0.12), transparent)',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.45)',
              }}
            >
              <User color="#fff" size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 500 }}>Morrow Engine v1.4.1</div>
            </div>
          </div>

          {/* ─── MORROW ENGINE PRO ─── */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(139, 92, 246, 0.12)' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.04)', 
              borderRadius: '14px', 
              padding: '10px 14px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color={turboEnabled ? "#8b5cf6" : "rgba(255,255,255,0.4)"} />
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Turbo Şarj</span>
                </div>
                <div 
                  onClick={handleTurboToggle}
                  style={{
                    width: '36px', height: '18px', borderRadius: '10px',
                    background: turboEnabled ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                  }}
                >
                  <motion.div 
                    animate={{ x: turboEnabled ? 18 : 2 }}
                    style={{ 
                      width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} 
                  />
                </div>
              </div>
              
              <motion.button
                onClick={handleDeepClean}
                disabled={deepCleaning}
                whileHover={{ background: 'rgba(139, 92, 246, 0.18)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                  padding: '8px', background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px',
                  color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <RefreshCw size={14} className={deepCleaning ? "animate-spin" : ""} style={{ animation: deepCleaning ? 'spin 1.5s linear infinite' : 'none' }} />
                {deepCleaning ? 'Temizleniyor...' : 'Derin Bellek Temizliği'}
              </motion.button>
            </div>
          </div>

          <MenuItem icon={<Plus size={16} />} label="Yeni Sekme" shortcut="Ctrl+T" onClick={handleNewTab} />
          <MenuItem icon={<Monitor size={16} />} label="Yeni Pencere" shortcut="Ctrl+N" onClick={handleNewWindow} />
          <MenuItem icon={<ShieldAlert size={16} />} label="Yeni Gizli Pencere" shortcut="Ctrl+Shift+N" onClick={handleNewIncognito} />

          <MenuDivider />

          <MenuItem icon={<Star size={16} />} label="Yer İmleri" onClick={handleBookmarks} />
          <MenuItem icon={<History size={16} />} label="Geçmiş" shortcut="Ctrl+H" onClick={handleHistory} />
          <MenuItem icon={<Download size={16} />} label="İndirmeler" shortcut="Ctrl+J" onClick={handleDownloads} />
          <MenuItem icon={<Key size={16} />} label="Şifreler" onClick={closeMenu} />

          <MenuDivider />

          {/* ─── Zoom Kontrolleri ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <span style={{ fontSize: '13px', marginRight: 'auto', color: 'rgba(255,255,255,0.45)', paddingLeft: '8px', fontWeight: 500 }}>
              Yakınlaştır
            </span>
            <ZoomButton icon={<Minus size={15} />} onClick={handleZoomOut} />
            <span
              style={{
                fontSize: '12px',
                color: '#fff',
                minWidth: '42px',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              {zoom}%
            </span>
            <ZoomButton icon={<Plus size={15} />} onClick={handleZoomIn} />
            <motion.button
              onClick={handleFullScreen}
              whileHover={{ background: 'rgba(255,255,255,0.08)' }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}
              title="Tam Ekran"
            >
              <Maximize size={15} />
            </motion.button>
          </div>

          <MenuDivider />

          <MenuItem icon={<Printer size={16} />} label="Yazdır" shortcut="Ctrl+P" onClick={handlePrint} />
          <MenuItem icon={<Trash2 size={16} />} label="Verileri Temizle" shortcut="Ctrl+Shift+Del" onClick={handleClearData} />

          <MenuDivider />

          <MenuItem icon={<Settings size={16} />} label="Ayarlar" onClick={handleSettings} />
          <MenuItem icon={<LogOut size={16} />} label="Çıkış" danger onClick={handleQuit} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, label, shortcut, onClick, danger }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ background: 'rgba(139, 92, 246, 0.1)', x: 4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: 'calc(100% - 24px)',
        margin: '3px 12px',
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontSize: '13.5px',
        color: danger ? 'var(--danger)' : 'rgba(255,255,255,0.9)',
        textAlign: 'left',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <span style={{ color: danger ? 'var(--danger)' : 'var(--accent)', opacity: 0.95, display: 'flex' }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      {shortcut && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}
        >
          {shortcut}
        </span>
      )}
    </motion.button>
  );
}

function MenuDivider() {
  return (
    <div
      style={{
        height: '1px',
        background: 'rgba(139, 92, 246, 0.18)',
        margin: '8px 20px',
      }}
    />
  );
}

function ZoomButton({ icon, onClick }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ background: 'rgba(139, 92, 246, 0.18)', scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '10px',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {icon}
    </motion.button>
  );
}
