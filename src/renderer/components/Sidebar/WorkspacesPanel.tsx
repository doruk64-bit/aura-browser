/**
 * WorkspacesPanel — Çalışma alanlarını listeleyen ve yöneten panel (Premium Redesign)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Layout, Info, Check, Edit2 } from 'lucide-react';

export default function WorkspacesPanel() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWait, setActiveWait] = useState<string>('default');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📂');
  const emojis = ['📂', '💼', '🏠', '🎮', '💡', '🎨', '🎵', '✨'];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadWorkspaces = () => {
    const api = window.electronAPI;
    if (!api) return;

    api.workspace.getAll().then(setWorkspaces);
    api.workspace.getActive().then(setActiveWait);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Native React Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Drop'a izin vermek için gerekli
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...workspaces];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setWorkspaces(updated);
    await window.electronAPI?.workspace.reorder(updated);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSelect = async (id: string) => {
    await window.electronAPI?.workspace.setActive(id);
    setActiveWait(id);
  };

  const handleSave = async () => {
    const name = newWorkspaceName.trim();
    if (!name) return;

    const currentEditingId = editingId;
    const currentEmoji = selectedEmoji;

    // Optimistik güncelleme (HIZLI TEPKİ: Saniyelerce bekleme, anında göster)
    if (currentEditingId) {
      setWorkspaces(prev => prev.map(w => 
        w.id === currentEditingId ? { ...w, name, icon: currentEmoji } : w
      ));
    }

    try {
      if (currentEditingId) {
        await window.electronAPI?.workspace.update(currentEditingId, name, currentEmoji);
      } else {
        await window.electronAPI?.workspace.add(name, currentEmoji);
      }
      
      // Kayıt başarılıysa formu temizle
      setEditingId(null);
      setNewWorkspaceName('');
      setSelectedEmoji('📂');
    } catch (err) {
      console.error("Workspace save error:", err);
      // Hata durumunda listeyi tekrar yükle (geri al)
      loadWorkspaces();
    } finally {
      // 200ms bekle (Ana işlemin veritabanını diske yazıp stabil hale gelmesi için)
      setTimeout(() => loadWorkspaces(), 200);
    }
  };

  const handleEditStart = (ws: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ws.id);
    setNewWorkspaceName(ws.name);
    setSelectedEmoji(ws.icon || '📂');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewWorkspaceName('');
    setSelectedEmoji('📂');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'default') return;
    await window.electronAPI?.workspace.remove(id);
    loadWorkspaces();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '10px', 
          background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px var(--accent-glow)'
        }}>
          <Layout size={18} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Çalışma Alanları</h2>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>WORKSPACE GROUPS</span>
        </div>
      </div>

      {/* ─── Workspace List ─── */}
      <div 
        style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto', padding: '2px' }} 
        className="custom-scrollbar"
      >
        {workspaces.map((ws, i) => (
          <div
            key={ws.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => handleSelect(ws.id)}
            className={`workspace-item ${draggedIndex === i ? 'is-dragging' : ''} ${dragOverIndex === i && draggedIndex !== i ? 'is-drag-over' : ''}`}
            style={{
              padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: activeWait === ws.id ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                border: activeWait === ws.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeWait === ws.id ? '0 4px 15px var(--accent-glow)' : 'none'
              }}
            >
              {/* Left: Icon Box (Downloads Style) */}
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '8px', 
                background: activeWait === ws.id ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                 <span style={{ fontSize: '18px' }}>{ws.icon}</span>
              </div>
              
              {/* Center: Info Column */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ 
                  fontSize: '13px', 
                  color: '#fff', 
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {ws.name}
                </span>
                <span style={{ 
                    fontSize: '10px', 
                    color: activeWait === ws.id ? 'rgba(167, 139, 250, 0.8)' : 'rgba(255,255,255,0.3)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px'
                  }}>
                  {activeWait === ws.id ? 'Şu An Aktif' : 'Tıkla ve Geç'}
                </span>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {activeWait === ws.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: 'var(--accent)' }}>
                    <Check size={14} strokeWidth={3} />
                  </motion.div>
                )}

                {ws.id !== 'default' && (
                  <button
                    onClick={(e) => handleEditStart(ws, e)}
                    style={{ 
                      background: 'none', border: 'none', color: editingId === ws.id ? 'var(--accent)' : 'rgba(255,255,255,0.2)', 
                      cursor: 'pointer', padding: '4px', opacity: 0.5, transition: 'all 0.2s'
                    }}
                    className="hover:opacity-100"
                  >
                    <Edit2 size={13} />
                  </button>
                )}

                {ws.id !== 'default' && (
                  <button
                    onClick={(e) => handleDelete(ws.id, e)}
                    style={{ 
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', 
                      cursor: 'pointer', padding: '4px', opacity: 0.5, transition: 'all 0.2s'
                    }}
                    className="hover:opacity-100 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* ─── Footer Section (Add New) ─── */}
      <div style={{ 
        marginTop: 'auto', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        
        {/* Emoji Selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {emojis.map((emoji) => (
            <motion.div
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              whileHover={{ scale: 1.2, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: '32px', height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                background: selectedEmoji === emoji ? 'var(--accent-glow)' : 'transparent',
                border: selectedEmoji === emoji ? '1px solid var(--accent)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* New Workspace Input */}
        <div style={{ 
          display: 'flex', gap: '8px', background: 'var(--bg-glass)', 
          borderRadius: '20px', border: '1px solid var(--border-subtle)',
          padding: '6px 6px 6px 16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }} className="focus-within:border-[var(--accent)] focus-within:shadow-[0_0_15px_var(--accent-glow)] transition-all">
          <input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            type="text"
            placeholder="Alan adını yazın..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '6px 0',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '13px'
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          
          {editingId && (
            <button 
              onClick={handleCancelEdit}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                fontSize: '11px', cursor: 'pointer', padding: '0 8px', fontWeight: 600
              }}
            >
              İptal
            </button>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            style={{
              width: '32px', height: '32px', borderRadius: '14px',
              background: 'var(--accent)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {editingId ? <Check size={18} /> : <Plus size={18} />}
          </motion.div>
        </div>

        {/* Info Box */}
        <div style={{ 
          padding: '12px 14px', borderRadius: '16px', 
          background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)',
          display: 'flex', gap: '10px', alignItems: 'flex-start'
        }}>
          <Info size={14} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '10.5px', lineHeight: '1.5', margin: 0 }}>
            Her çalışma alanı sekmeleriniz ve yer imleriniz için ayrı bir profil oluşturur.
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .workspace-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }
        .workspace-item:hover {
          background: rgba(139, 92, 246, 0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
          transform: translateY(-1px);
        }
        .workspace-item:active {
          scale: 0.98;
        }
        .workspace-item.is-dragging {
          opacity: 0.4;
          background: rgba(139, 92, 246, 0.1) !important;
          border: 1px dashed var(--accent) !important;
        }
        .workspace-item.is-drag-over {
          border-color: var(--accent) !important;
          background: rgba(139, 92, 246, 0.1) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}
