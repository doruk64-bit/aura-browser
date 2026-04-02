import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Download } from 'lucide-react';

export default function DownloadsPage() {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.downloads?.get?.()?.then((data: any[]) => {
      setDownloads(data || []);
    });

    const unsubStart = api.downloads.onStart?.((data: any) => {
      setDownloads((prev) => [data, ...prev]);
    });

    const unsubProgress = api.downloads.onProgress?.((data: any) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });

    const unsubComplete = api.downloads.onComplete?.((data: any) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });

    return () => {
      unsubStart?.();
      unsubProgress?.();
      unsubComplete?.();
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filteredDownloads = downloads.filter(item => 
    item.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date
  const groups: { [key: string]: typeof downloads } = {};
  filteredDownloads.forEach(item => {
    const d = new Date(item.startedAt);
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
            <Download size={18} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>İndirmeler</h1>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, padding: '32px 0' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="text" 
              placeholder="İndirme geçmişinde arayın" 
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
                Gösterilecek indirme yok.
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
                    {groups[date].map((item, index) => {
                      const progress = item.totalBytes > 0 ? (item.receivedBytes / item.totalBytes) * 100 : 0;
                      const isFinished = item.state === 'completed' || item.state === 'cancelled';

                      return (
                        <motion.div
                          key={item.id}
                          onClick={() => {
                            if (item.state === 'completed' && item.savePath) {
                              window.electronAPI?.downloads?.open(item.savePath);
                            }
                          }}
                          whileHover={item.state === 'completed' ? { background: 'rgba(255, 255, 255, 0.04)' } : undefined}
                          style={{
                            display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '20px',
                            cursor: item.state === 'completed' ? 'pointer' : 'default', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            position: 'relative', overflow: 'hidden'
                          }}
                        >
                          {/* Progress bar background overlay */}
                          {item.state === 'progressing' && (
                             <motion.div 
                               initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                               style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'rgba(139, 92, 246, 0.08)', zIndex: 0 }}
                             />
                          )}

                          <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {item.icon ? (
                                <img src={item.icon} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                              ) : (
                                <span style={{ fontSize: '24px' }}>📂</span>
                              )}
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                               <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                 {item.filename || 'Dosya'}
                               </span>
                               <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 {item.url}
                               </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: '120px' }}>
                               <span style={{ fontSize: '13px', color: item.state === 'completed' ? '#34d399' : 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                 {item.state === 'progressing' ? `${Math.round(progress)}%` : item.state}
                               </span>
                               <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                  {item.state === 'progressing' ? `${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes)}` : formatBytes(item.totalBytes)}
                               </span>
                            </div>

                            {!isFinished && (
                              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', zIndex: 2 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.electronAPI?.downloads?.action(item.id, item.state === 'progressing' ? 'pause' : 'resume'); }}
                                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  {item.state === 'progressing' ? 'Duraklat' : 'Devam'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.electronAPI?.downloads?.action(item.id, 'cancel'); }}
                                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  İptal
                                </button>
                              </div>
                            )}

                          </div>
                        </motion.div>
                      );
                    })}
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
