/**
 * useKeyboard — Global klavye kısayollarını dinler
 *
 * Örneğin: Ctrl+F (sayfa içi arama), Esc vb.
 */

import { useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';

interface UseKeyboardProps {
  onFind: () => void;
  onEscape: () => void;
}

export function useKeyboard({ onFind, onEscape }: UseKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F veya Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onFind();
      }
      
      // Escape
      if (e.key === 'Escape') {
        onEscape?.();
      }

      // Ctrl+T veya Cmd+T (Yeni Sekme)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        window.electronAPI?.tabs.create('about:blank');
      }

      // Ctrl+W veya Cmd+W (Aktif Sekmeyi Kapat)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        const activeId = useTabStore.getState().activeTabId;
        if (activeId !== null) {
          window.electronAPI?.tabs.close(activeId);
        }
      }

      // Ctrl+Tab / Ctrl+Shift+Tab (Sekmeler Arası Geçiş)
      if (e.ctrlKey && !e.metaKey && e.key === 'Tab') {
        e.preventDefault();
        const state = useTabStore.getState();
        if (state.tabs.length < 2) return;
        
        const currentIndex = state.tabs.findIndex(t => t.id === state.activeTabId);
        if (currentIndex === -1) return;

        let nextIndex;
        if (e.shiftKey) { // Geriye git
          nextIndex = currentIndex === 0 ? state.tabs.length - 1 : currentIndex - 1;
        } else { // İleriye git
          nextIndex = currentIndex === state.tabs.length - 1 ? 0 : currentIndex + 1;
        }
        
        window.electronAPI?.tabs.switchTo(state.tabs[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFind, onEscape]);
}
