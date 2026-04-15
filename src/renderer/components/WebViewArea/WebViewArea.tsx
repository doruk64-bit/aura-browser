/**
 * WebViewArea — Web içeriğinin gösterildiği ana alan
 * V1.4.3: SortableJS integration for premium fluid reordering 
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sortable from 'sortablejs';
import { useTabStore } from '../../store/useTabStore';
import { useSettingsStore, SEARCH_ENGINES } from '../../store/useSettingsStore';
import GestureOverlay from './GestureOverlay';

// Discover images removed as per focus mode implementation

const DEFAULT_FAVORITES = [
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '📺', color: '#ff0000' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#8b5cf6' },
  { name: 'Twitter', url: 'https://x.com', icon: '🐦', color: '#1da1f2' },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: '🤖', color: '#ff4500' },
  { name: 'Discord', url: 'https://discord.com', icon: '💬', color: '#5865f2' },
  { name: 'Spotify', url: 'https://open.spotify.com', icon: '🎵', color: '#1db954' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🧠', color: '#10a37f' },
  { name: 'Netflix', url: 'https://www.netflix.com', icon: '🎬', color: '#e50914' },
];

function ShortcutItem({ site, index, handleFavoriteContextMenu, removeShortcut, getFaviconUrl }: any) {
  if (!site) return null;
  return (
    <motion.div
      data-id={site.url}
      className="favorite-item"
      whileHover={{ scale: 1.08, y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => window.electronAPI?.nav.go(site.url)}
      onContextMenu={(e) => handleFavoriteContextMenu(e, index)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '6px', 
        cursor: 'grab',
        position: 'relative', 
        padding: '6px 2px',
        touchAction: 'none',
      }}
    >
      <div style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '10px', 
        background: site.color ? `${site.color}20` : 'rgba(255,255,255,0.06)', 
        border: `1px solid ${site.color ? `${site.color}40` : 'rgba(255,255,255,0.1)'}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexShrink: 0 
      }}>
        {getFaviconUrl(site.url) ? (
          <img 
            src={getFaviconUrl(site.url)} 
            alt="" 
            style={{ width: '22px', height: '22px', borderRadius: '4px' }} 
            onError={(e: any) => { e.target.style.display = 'none'; }} 
          />
        ) : (
          <span style={{ fontSize: '18px' }}>{site.icon || '🌐'}</span>
        )}
      </div>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>{site.name}</span>
    </motion.div>
  );
}

export default function WebViewArea() {
  const { tabs, activeTabId, activeWorkspaceId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const currentEngine = useSettingsStore((state) => state.searchEngine);
  const engineConfig = SEARCH_ENGINES.find(e => e.value === currentEngine) || SEARCH_ENGINES[0];

  const [searchValue, setSearchValue] = useState('');
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');
  
  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, inputId?: string, targetIndex?: number, type: 'input' | 'favorite' } | null>(null);

  const workspaceId = activeWorkspaceId || 'default';
  const storageKey = `morrow_shortcuts_${workspaceId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setShortcuts(JSON.parse(saved));
    } else {
      setShortcuts(DEFAULT_FAVORITES);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_FAVORITES));
    }
  }, [workspaceId]);

  useEffect(() => {
    if (gridRef.current && shortcuts.length > 0) {
      // SortableJS instance creation
      sortableRef.current = new Sortable(gridRef.current, {
        animation: 200,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        delay: 50,
        delayOnTouchOnly: true,
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            setShortcuts((prev) => {
              const updated = [...prev];
              const [movedItem] = updated.splice(oldIndex, 1);
              updated.splice(newIndex, 0, movedItem);
              localStorage.setItem(storageKey, JSON.stringify(updated));
              return updated;
            });
          }
        },
      });
    }

    return () => {
      sortableRef.current?.destroy();
    };
  }, [shortcuts.length, workspaceId]); // Refresh if shortcuts count or workspace changes

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6) setGreeting('İyi Geceler');
    else if (h < 12) setGreeting('Günaydın');
    else if (h < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
  }, []);

  const handleHomeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const text = searchValue.trim();
    if (!text) return;
    const urlPattern = /^(https?:\/\/)?localhost(:\d+)?(\/.*)?$|^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/[\w-./?%&=]*)?$/i;
    let target = text;
    if (target !== 'about:blank' && !target.startsWith('chrome://') && !target.startsWith('morrow://') && !target.startsWith('file://')) {
      if (urlPattern.test(target) && !target.includes(' ')) {
        target = target.startsWith('http') ? target : `https://${target}`;
      } else {
        target = `${engineConfig.url}${encodeURIComponent(text)}`;
      }
    }
    window.electronAPI?.nav.go(target);
    setSearchValue('');
  };

  const saveShortcut = () => {
    if (!newSiteName.trim() || !newSiteUrl.trim()) return;
    let formattedUrl = newSiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    let updated;
    if (editingIndex !== null) {
      // Düzenleme modu
      updated = [...shortcuts];
      updated[editingIndex] = { 
        ...updated[editingIndex], 
        name: newSiteName, 
        url: formattedUrl 
      };
    } else {
      // Yeni ekleme modu
      updated = [...shortcuts, { name: newSiteName, url: formattedUrl, icon: '🌐', color: '#6366f1' }];
    }

    setShortcuts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setIsModalOpen(false);
    setNewSiteName('');
    setNewSiteUrl('');
    setEditingIndex(null);
  };

  const openEditModal = (index: number) => {
    const site = shortcuts[index];
    if (site) {
      setNewSiteName(site.name);
      setNewSiteUrl(site.url);
      setEditingIndex(index);
      setIsModalOpen(true);
      setContextMenu(null);
    }
  };

  const removeShortcut = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = shortcuts.filter((_, i) => i !== index);
    setShortcuts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleContextMenu = (e: React.MouseEvent, inputId: 'name' | 'url') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, inputId, type: 'input' });
  };

  const handleFavoriteContextMenu = (e: React.MouseEvent, targetIndex: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetIndex, type: 'favorite' });
  };

  const handleCopy = () => {
    if (!contextMenu) return;
    if (contextMenu.inputId === 'name') {
      navigator.clipboard.writeText(newSiteName);
    } else if (contextMenu.inputId === 'url') {
      navigator.clipboard.writeText(newSiteUrl);
    }
    setContextMenu(null);
  };

  const handlePaste = async () => {
    if (!contextMenu) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (contextMenu.inputId === 'name') {
          setNewSiteName((prev) => prev + text);
        } else if (contextMenu.inputId === 'url') {
          setNewSiteUrl((prev) => prev + text);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
    setContextMenu(null);
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch {
      return '';
    }
  };

  const webviewAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = webviewAreaRef.current;
    if (!element) return;

    const reportBounds = () => {
      const rect = element.getBoundingClientRect();
      const bounds = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      
      if (bounds.width > 0 && bounds.height > 0) {
        window.electronAPI?.tabs.reportBounds(bounds);
      }
    };

    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure the DOM is stable before reporting
      requestAnimationFrame(reportBounds);
    });

    observer.observe(element);
    
    // Listen for manual bounds requests from main process
    const unlisten = window.electronAPI?.system?.on('system:request-bounds-report', () => {
      reportBounds();
    });
    
    // Initial report
    reportBounds();

    return () => {
      observer.disconnect();
      unlisten?.();
    };
  }, [activeTabId, activeTab?.url]); // Re-observe if tab or URL changes (e.g. from about:blank to a site)

  if (activeTab && activeTab.url !== 'about:blank' && activeTab.url !== '') {
    return (
      <div 
        id="webview-area" 
        ref={webviewAreaRef}
        style={{ 
          width: '100%',
          height: '100%',
          background: 'var(--bg-primary)', 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <GestureOverlay />
      </div>
    );
  }

  if (activeTab?.isIncognito) {
    return (
      <div id="webview-area" style={{ flex: 1, background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕶️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#e4e6eb', marginBottom: '8px' }}>Gizli Tarama</h1>
          <p style={{ color: '#888', fontSize: '13px' }}>Bu sekmede yaptığınız aramalar geçmişe kaydedilmez.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      id="webview-area"
      style={{
        flex: 1,
        background: 'var(--app-bg)',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hafif Ortam Işığı */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          width: '100%', 
          maxWidth: '640px',
          padding: '0 24px'
        }}
      >
        {/* Odak Logosu & Karşılama */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '18px', 
            background: 'linear-gradient(135deg, var(--accent) 0%, #ec4899 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 8px 32px var(--accent-glow)',
            marginBottom: '20px'
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={{ 
            fontSize: '32px', fontWeight: 800, letterSpacing: '4px', 
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-hover) 100%)', 
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
            textTransform: 'uppercase', margin: 0 
          }}>
            Morrow
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '1px' }}>
            {greeting}
          </p>
        </div>

        {/* Merkezi Arama */}
        <form onSubmit={handleHomeSearch} style={{ position: 'relative', width: '100%', marginBottom: '40px' }}>
          <input 
            value={searchValue} 
            onChange={(e) => setSearchValue(e.target.value)} 
            type="text" 
            placeholder="Düşüncelerini Ara..." 
            spellCheck={false}
            autoComplete="off"
            style={{ 
               width: '100%', padding: '16px 24px 16px 52px', borderRadius: '24px', 
               background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
               border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', 
               outline: 'none', fontSize: '15px', fontFamily: "'Inter', sans-serif", 
               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }} 
            onFocus={(e) => { 
               e.target.style.borderColor = 'var(--accent)'; 
               e.target.style.boxShadow = '0 0 30px var(--accent-glow)'; 
               e.target.style.background = 'var(--bg-glass)';
            }} 
            onBlur={(e) => { 
               e.target.style.borderColor = 'var(--border-subtle)'; 
               e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; 
            }} 
          />
          <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '18px' }}>🔍</span>
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: 0.6 }}>✨</motion.div>
        </form>

        {/* Favoriler Grip */}
        <div style={{ width: '100%' }}>
           <div ref={gridRef} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
              {shortcuts.map((site, index) => (
                <ShortcutItem 
                  key={site.url} 
                  site={site} 
                  index={index} 
                  handleFavoriteContextMenu={handleFavoriteContextMenu} 
                  removeShortcut={removeShortcut} 
                  getFaviconUrl={getFaviconUrl} 
                />
              ))}
              <motion.div 
                 whileHover={{ scale: 1.08, y: -3 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => { setEditingIndex(null); setNewSiteName(''); setNewSiteUrl(''); setIsModalOpen(true); }}
                 style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', 
                    cursor: 'pointer', position: 'relative', padding: '6px 2px' 
                 }}
              >
                 <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px', 
                    background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'var(--text-muted)', fontSize: '20px' 
                 }}>
                    +
                 </div>
                 <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>Ekle</span>
              </motion.div>
           </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => { setIsModalOpen(false); setEditingIndex(null); setContextMenu(null); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} style={{ background: 'rgba(20,20,30,0.95)', backdropFilter: 'blur(20px)', padding: '28px', borderRadius: '16px', width: '340px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: '16px', color: '#e0e0ff', fontWeight: 600, margin: 0 }}>{editingIndex !== null ? '✨ Kısayol Düzenle' : '✨ Kısayol Ekle'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Site Adı</label>
                <input value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} type="text" placeholder="Örn: YouTube" onContextMenu={(e) => handleContextMenu(e, 'name')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', color: 'white', outline: 'none', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.5)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>URL</label>
                <input value={newSiteUrl} onChange={(e) => setNewSiteUrl(e.target.value)} type="text" placeholder="Örn: youtube.com" onContextMenu={(e) => handleContextMenu(e, 'url')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', color: 'white', outline: 'none', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.5)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button onClick={() => { setIsModalOpen(false); setEditingIndex(null); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', padding: '8px 16px', borderRadius: '10px', fontFamily: "'Inter', sans-serif" }}>İptal</button>
                <button onClick={saveShortcut} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', padding: '8px 20px', fontWeight: 600, fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>{editingIndex !== null ? 'Kaydet' : 'Ekle'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 199 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu(null); }} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 200, minWidth: '160px' }} onClick={(e) => e.stopPropagation()}>
              {contextMenu.type === 'input' && (
                <>
                  <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e0e0ff', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>Kopyala</button>
                  <button onClick={handlePaste} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e0e0ff', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>Yapıştır</button>
                </>
              )}
              {contextMenu.type === 'favorite' && (
                <>
                  <button onClick={() => { if (contextMenu.targetIndex !== undefined) openEditModal(contextMenu.targetIndex); }} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e0e0ff', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>Düzenle</button>
                  <button onClick={(e) => { if (contextMenu.targetIndex !== undefined) removeShortcut(contextMenu.targetIndex, e as any); setContextMenu(null); }} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => e.currentTarget.style.background='rgba(239,68,68,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>Kaldır (Sil)</button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
