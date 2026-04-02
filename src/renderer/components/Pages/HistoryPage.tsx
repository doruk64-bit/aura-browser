import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trash2, Search, Settings } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.electronAPI?.history?.get?.()
      ?.then((data: any[]) => {
        setHistory(data && data.length > 0 ? data : []);
      })
      ?.catch(() => {
        setHistory([]);
      });
  }, []);

  const handleOpen = (url: string) => {
    window.electronAPI?.nav.go(url);
    // After navigating, should we go back to '/'?
    window.electronAPI?.system?.navigateMainRouter('/');
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    window.electronAPI?.history?.clear?.();
    setHistory([]);
  };

  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);

  useEffect(() => {
    window.electronAPI?.history?.getStatus()?.then((enabled: boolean) => {
      setIsHistoryEnabled(enabled);
    });
  }, []);

  const toggleHistory = async () => {
    const newState = !isHistoryEnabled;
    setIsHistoryEnabled(newState);
    await window.electronAPI?.history?.setStatus(newState);
  };

  const filteredHistory = history.filter(item => {
    return (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.url?.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Group by date
  const groups: { [key: string]: typeof history } = {};
  filteredHistory.forEach(item => {
    const d = new Date(item.last_visited_at);
    d.setHours(0, 0, 0, 0);
    const time = d.getTime();
    if (!groups[time]) groups[time] = [];
    groups[time].push(item);
  });
  const sortedDates = Object.keys(groups).map(Number).sort((a, b) => b - a);

  const getDateLabel = (timestamp: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (timestamp === today.getTime()) return 'Bugün';
    if (timestamp === yesterday.getTime()) return 'Dün';
    return new Date(timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'visible' }}>
      
      {/* ─── Top Bar ─── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', padding: '16px 24px', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(12, 10, 24, 0.45)', backdropFilter: 'blur(30px)'
      }}>
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ x: -2, background: 'rgba(255,255,255,0.08)' }}
          style={{
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '20px', fontFamily: 'Inter, sans-serif', border: '1px solid rgba(255,255,255,0.05)',
            marginRight: '32px'
          }}
        >
          <ChevronLeft size={16} /> Geri Dön
        </motion.button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </motion.svg>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Geçmiş</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginRight: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: isHistoryEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
              Geçmişi İzle
            </span>
            <div 
              onClick={toggleHistory}
              style={{ 
                width: '40px', height: '22px', borderRadius: '11px', 
                background: isHistoryEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer', position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <motion.div 
                animate={{ x: isHistoryEnabled ? 20 : 2 }}
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ 
                  width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '2px', left: '0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <button
          onClick={clearHistory}
          style={{
            background: 'transparent',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Tarama verilerini temizle
        </button>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, padding: '32px 0' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="text" 
              placeholder="Geçmişte arayın" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '16px 20px 16px 48px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '30px', color: '#fff', fontSize: '15px', fontFamily: 'Inter, sans-serif',
                outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; e.target.style.boxShadow = '0 0 20px rgba(139,92,246,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {sortedDates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>
                Gösterilecek geçmiş öğesi yok.
              </div>
            ) : (
              sortedDates.map(date => (
                <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px 12px' }}>
                    {getDateLabel(date)}
                  </h3>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '16px', overflow: 'hidden' 
                  }}>
                    {groups[date].map((item, index) => (
                      <motion.div
                        key={item.id}
                        onClick={() => handleOpen(item.url)}
                        whileHover={{ background: 'rgba(255, 255, 255, 0.04)' }}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '16px',
                          cursor: 'pointer', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                        }}
                      >
                         <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, minWidth: '45px' }}>
                           {new Date(item.last_visited_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         
                         <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                           <img src={`https://www.google.com/s2/favicons?domain=${new URL(item.url || 'https://google.com').hostname}&sz=64`} style={{ width: '16px', height: '16px', borderRadius: '3px' }} alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                         </div>

                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title || item.url}
                            </span>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.url}
                            </span>
                         </div>
                         
                         <button
                           onClick={(e) => handleDelete(e, item.id)}
                           style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
                           onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                           onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
                         >
                           <Trash2 size={16} />
                         </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
