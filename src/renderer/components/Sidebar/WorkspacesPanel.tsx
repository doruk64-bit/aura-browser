/**
 * WorkspacesPanel — Çalışma alanlarını listeleyen ve yöneten panel
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspacesPanel() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWait, setActiveWait] = useState<string>('default');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const loadWorkspaces = () => {
    const api = window.electronAPI;
    if (!api) return;

    api.workspace.getAll().then(setWorkspaces);
    api.workspace.getActive().then(setActiveWait);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleSelect = async (id: string) => {
    await window.electronAPI?.workspace.setActive(id);
    setActiveWait(id);
  };

  const handleAdd = async () => {
    if (!newWorkspaceName.trim()) return;
    await window.electronAPI?.workspace.add(newWorkspaceName.trim(), '📂');
    setNewWorkspaceName('');
    loadWorkspaces();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'default') return;
    await window.electronAPI?.workspace.remove(id);
    loadWorkspaces();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AnimatePresence>
        {workspaces.map((ws) => (
          <motion.div
            key={ws.id}
            onClick={() => handleSelect(ws.id)}
            whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: activeWait === ws.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: activeWait === ws.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '18px' }}>{ws.icon}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: activeWait === ws.id ? 600 : 400 }}>
              {ws.name}
            </span>

            {/* Silme Butonu */}
            {ws.id !== 'default' && (
              <motion.span
                whileHover={{ scale: 1.2, color: 'var(--danger)' }}
                onClick={(e) => handleDelete(ws.id, e)}
                style={{ marginLeft: 'auto', padding: '4px', fontSize: '12px', opacity: 0.6, cursor: 'pointer' }}
                title="Çalışma Alanını Sil"
              >
                ✕
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Çalışma Alanı Ekleme Formu */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
        <input
          value={newWorkspaceName}
          onChange={(e) => setNewWorkspaceName(e.target.value)}
          type="text"
          placeholder="+ Yeni Çalışma Alanı"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            color: 'white',
            outline: 'none',
            fontSize: '12px'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '0 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Ekle
        </button>
      </div>

      <div style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
          Bilgi: Seçtiğiniz çalışma alanı, açtığınız sekmelerin, yer imlerinizin ve kısayollarınızın ait olduğu grubu belirler.
        </p>
      </div>
    </div>
  );
}
