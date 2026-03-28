/**
 * TopBar — Üst çubuk bileşeni (Reference-matched premium design)
 * Satır 1: Morrow Browser logo + Sekmeler + Pencere kontrolleri
 * Satır 2: Navigasyon butonları + Omnibox + Chrome Menü
 */

import TrafficLights from './TrafficLights';
import TabStrip from './TabStrip';
import WindowControls from './WindowControls';
import NavigationButtons from './NavigationButtons';
import Omnibox from './Omnibox';
import ChromeMenu from './ChromeMenu';

export default function TopBar() {
  const platform = window.electronAPI?.platform ?? 'win32';

  const LogoIcon = () => (
    <div style={{
      width: '18px', height: '18px', borderRadius: '5px',
      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
      </svg>
    </div>
  );

  const LogoText = () => (
    <span style={{
      fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
      letterSpacing: '0.5px', whiteSpace: 'nowrap',
    }}>
      Morrow Browser
    </span>
  );

  return (
    <div
      className="no-select"
      style={{
        flexShrink: 0,
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Satır 1: Logo + Sekmeler + Pencere Kontrolleri */}
      <div
        className="drag"
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', // Her iki uca yay
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', flex: 1, overflow: 'hidden' }}>
          <TrafficLights />
          
          {/* Logo + Title (Windows: Left) */}
          {platform !== 'darwin' && (
            <div className="no-drag" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginLeft: '12px', marginRight: '8px', flexShrink: 0,
            }}>
              <LogoIcon />
              <LogoText />
            </div>
          )}

          <TabStrip />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', height: '100%', flexShrink: 0 }}>
          {/* Logo + Title (Mac: Right) */}
          {platform === 'darwin' && (
            <div className="no-drag" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginRight: '12px', flexShrink: 0,
            }}>
              <LogoIcon />
              <LogoText />
            </div>
          )}
          <WindowControls />
        </div>
      </div>

      {/* Satır 2: Navigasyon + Omnibox + Menü */}
      <div
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 12px',
        }}
      >
        <NavigationButtons />
        <Omnibox />
        <ChromeMenu />
      </div>
    </div>
  );
}
