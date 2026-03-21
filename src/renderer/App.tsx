/**
 * App — Ana uygulama bileşeni
 * TopBar + Sidebar + WebViewArea yerleşimini oluşturur
 * ve IPC olaylarını dinlemeye başlar.
 * Routes: "/" (tarayıcı) ve "/settings" (ayarlar sayfası)
 */

import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import TopBar from './components/TopBar/TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import WebViewArea from './components/WebViewArea/WebViewArea';
import FindBar from './components/FindBar/FindBar';
import SettingsPage from './components/Settings/SettingsPage';
import ChromeMenuOverlay from './components/TopBar/ChromeMenuOverlay';
import { useIPC } from './hooks/useIPC';
import { useKeyboard } from './hooks/useKeyboard';
import { useTheme } from './hooks/useTheme';
import { useSettingsStore } from './store/useSettingsStore';
import { useEffect } from 'react';

function App() {
  const [findVisible, setFindVisible] = useState(false);

  // Temayı DOM'a senkronize et
  useTheme();

  // IPC olaylarını dinle ve store'a yansıt
  useIPC();

  // Klavye kısayolları (Ctrl+F)
  useKeyboard({
    onFind: () => setFindVisible(true),
    onEscape: () => setFindVisible(false),
  });

  const { adblockEnabled } = useSettingsStore();

  useEffect(() => {
    if (window.electronAPI?.adblock?.setStatus) {
      window.electronAPI.adblock.setStatus(adblockEnabled);
    }
  }, [adblockEnabled]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-primary)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <FindBar isVisible={findVisible} onClose={() => setFindVisible(false)} />

            {/* Üst çubuk: sekmeler + omnibox + navigasyon */}
            <TopBar />

            {/* Gövde: sidebar + web içerik */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
              <Sidebar />
              <WebViewArea />
            </div>
          </div>
        }
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/chromemenu-overlay" element={<ChromeMenuOverlay />} />
    </Routes>
  );
}

export default App;
