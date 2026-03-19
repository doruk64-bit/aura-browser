/**
 * App — Ana uygulama bileşeni
 * TopBar + Sidebar + WebViewArea yerleşimini oluşturur
 * ve IPC olaylarını dinlemeye başlar.
 */

import { useState } from 'react';
import TopBar from './components/TopBar/TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import WebViewArea from './components/WebViewArea/WebViewArea';
import FindBar from './components/FindBar/FindBar';
import { useIPC } from './hooks/useIPC';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const [findVisible, setFindVisible] = useState(false);

  // IPC olaylarını dinle ve store'a yansıt
  useIPC();

  // Klavye kısayolları (Ctrl+F)
  useKeyboard({
    onFind: () => setFindVisible(true),
    onEscape: () => setFindVisible(false),
  });

  return (
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
  );
}

export default App;
