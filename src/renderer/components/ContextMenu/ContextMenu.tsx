import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContextMenu() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [items, setItems] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.electronAPI?.contextMenu) return;

    const unsubscribe = window.electronAPI.contextMenu.onShow((data: any) => {
      console.log('[React ContextMenu] Data received:', data);
      setPos({ x: data.x, y: data.y }); // Konumu HEMEN ayarla (Sol üstte açılmasını önler)
      setItems(data.items || []);
      setVisible(true);
      
      // Menünün ekrandan taşmasını önlemek için koordinat düzenlemesi
      setTimeout(() => {
        if (menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect();
          let nextX = data.x;
          let nextY = data.y;

          if (nextX + rect.width > window.innerWidth) {
            nextX = window.innerWidth - rect.width - 10;
          }
          if (nextY + rect.height > window.innerHeight) {
            nextY = window.innerHeight - rect.height - 10;
          }

          setPos({ x: Math.max(0, nextX), y: Math.max(0, nextY) });
        }
      }, 0);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (e.button === 2) return; // Sağ tık (ContextMenu açan tık) mousedown'u kapatmasın
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', () => setVisible(false));

    return () => {
      unsubscribe();
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = (id: string) => {
    setVisible(false);
    window.electronAPI?.contextMenu.click(id);
  };

  if (!visible || items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 99999,
        background: 'rgba(28, 28, 30, 0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        minWidth: '180px',
      }}
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />;
        }
        const isEnabled = item.enabled !== false;
        return (
          <div
            key={item.id || index}
            onClick={() => isEnabled && handleItemClick(item.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              color: isEnabled ? '#f5f5f7' : 'rgba(255,255,255,0.3)',
              fontSize: '13px',
              cursor: isEnabled ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => isEnabled && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => isEnabled && (e.currentTarget.style.background = 'transparent')}
          >
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
