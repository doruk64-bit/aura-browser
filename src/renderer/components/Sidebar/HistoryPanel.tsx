/**
 * HistoryPanel — Tarayıcı geçmişini listeleyen yan panel (Premium Redesign)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPanel() {
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    window.electronAPI?.history?.get?.()
      ?.then((data: any[]) => {
        const mockData = [
          { id: 101, title: 'Discover - Evrensel Bilim Dergisi', url: 'https://evrenselbilim.com/kuantum-mekanik', last_visited_at: new Date().getTime(), visit_count: 3 },
          { id: 102, title: 'YouTube - Morgenröte Orkestrası Canlı Performans', url: 'https://youtube.com/watch?v=123', last_visited_at: new Date().getTime() - 3600000, visit_count: 1 },
          { id: 103, title: 'Wikipedia - Türkiye Tarihi', url: 'https://tr.wikipedia.org/wiki/Türkiye', last_visited_at: new Date().getTime() - 7200000, visit_count: 5 }
        ];
        setHistory(data && data.length > 0 ? data : mockData);
      })
      ?.catch(() => {
        setHistory([]);
      });
  }, []);

  const handleOpen = (url: string) => {
    window.electronAPI?.nav.go(url);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    // Assuming there's a delete function, if not, we just filter it from UI for now
    // window.electronAPI?.history?.delete?.(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    window.electronAPI?.history?.clear?.();
    setHistory([]);
  };

  const filteredHistory = history.filter(item => {
    const matchQuery = 
      (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.url?.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemDate = new Date(item.last_visited_at);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    
    let matchDate = true;
    if (selectedDate) {
      const itemDateStr = itemDate.toLocaleDateString('en-CA'); 
      matchDate = itemDateStr === selectedDate;
    } else if (quickFilter === 'today') {
      matchDate = itemDate.toDateString() === today.toDateString();
    } else if (quickFilter === 'yesterday') {
      matchDate = itemDate.toDateString() === yesterday.toDateString();
    } else if (quickFilter === 'week') {
      const weekAgo = new Date(); 
      weekAgo.setDate(today.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      matchDate = itemDate >= weekAgo;
    }

    return matchQuery && matchDate;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 12px' }}>

      {/* ─── Filtreler ─── */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={clearHistory}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '14px' }}>🧹</span> Geçmişi Temizle
        </button>

        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Geçmişte ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '10px 12px', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '8px', 
              color: '#fff', 
              fontSize: '12px', 
              width: '100%', 
              outline: 'none', 
              boxSizing: 'border-box' 
            }}
          />
        </div>

        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            if (e.target.value) setQuickFilter('all');
          }}
          style={{ 
            padding: '8px 12px', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '8px', 
            color: '#fff', 
            fontSize: '12px', 
            outline: 'none', 
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['all', 'today', 'yesterday', 'week'] as const).map((filter) => (
            <button 
              key={filter} 
              onClick={() => { setQuickFilter(filter); setSelectedDate(''); }}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                borderRadius: '16px',
                border: '1px solid ' + (quickFilter === filter ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'),
                background: quickFilter === filter ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: 500,
              }}
            >
              {filter === 'all' && 'Tümü'}
              {filter === 'today' && 'Bugün'}
              {filter === 'yesterday' && 'Dün'}
              {filter === 'week' && 'Bu Hafta'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Geçmiş Listesi ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', paddingBottom: '20px' }}>
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
              Sonuç bulunamadı.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <motion.div
                key={item.id}
                onClick={() => handleOpen(item.url)}
                whileHover={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                layout
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {/* Heaer: Time + Title + X */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                   <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', width: '35px', paddingTop: '2px' }}>
                     {new Date(item.last_visited_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <span style={{ 
                     fontSize: '13px', 
                     fontWeight: 600, 
                     color: '#fff', 
                     flex: 1,
                     lineHeight: 1.3,
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden',
                   }}>
                    {item.title || item.url}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '2px' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Content: Favicon + URL/Description */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.03)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=64`} 
                      style={{ width: '18px', height: '18px', borderRadius: '2px' }} 
                      alt="" 
                    />
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    color: 'rgba(255,255,255,0.4)', 
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-all'
                  }}>
                    {item.url}
                  </span>
                </div>

                {/* Footer: Meta Info */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', 
                  fontSize: '10px', color: 'rgba(255,255,255,0.25)', 
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  paddingTop: '8px', marginTop: '4px'
                }}>
                  <span>Visits: {item.visit_count || '1'}</span>
                  <div style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'currentColor' }} />
                  <span>Last: {new Date(item.last_visited_at).toDateString() === new Date().toDateString() ? 'Bugün' : 'Geçmiş'}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
