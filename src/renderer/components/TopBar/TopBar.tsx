/**
 * TopBar — Üst çubuk bileşeni
 * İki satırdan oluşur:
 * 1. Sekme çubuğu (sürüklenebilir) + pencere kontrolleri
 * 2. Navigasyon butonları + Omnibox
 */

import TrafficLights from './TrafficLights';
import TabStrip from './TabStrip';
import WindowControls from './WindowControls';
import NavigationButtons from './NavigationButtons';
import Omnibox from './Omnibox';

export default function TopBar() {
  return (
    <div
      className="no-select"
      style={{
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Satır 1: Sekmeler + Pencere Kontrolleri */}
      <div
        className="drag"
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
        }}
      >
        <TrafficLights />
        <TabStrip />
        <WindowControls />
      </div>

      {/* Satır 2: Navigasyon + Omnibox */}
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
      </div>
    </div>
  );
}
