import React, { useState, useEffect } from 'react';
import { useTabStore } from '../../store/useTabStore';

export default function NotesPanel() {
  const [note, setNote] = useState('');
  const { activeWorkspaceId } = useTabStore();
  const storageKey = `sidebar-quick-note-${activeWorkspaceId}`;

  // Load note from local storage when workspace changes
  useEffect(() => {
    let savedNote = localStorage.getItem(storageKey);
    
    // Migration: If workspace note is empty, check for old global note
    if (!savedNote) {
      const oldNote = localStorage.getItem('sidebar-quick-note');
      if (oldNote) {
        savedNote = oldNote;
        // Optionally save to the new key immediately? Let's wait for user input or just do it.
        // For now, only show it. If they edit, it saves to the new key.
      }
    }

    setNote(savedNote || '');
  }, [activeWorkspaceId, storageKey]);

  // Save note to local storage when changed
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    localStorage.setItem(storageKey, newNote);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '0 16px 16px 16px',
      boxSizing: 'border-box'
    }}>
      <textarea
        value={note}
        onChange={handleChange}
        placeholder="Not almak veya kod yapıştırmak için burayı kullanın..."
        style={{
          flex: 1,
          width: '100%',
          resize: 'none',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.5',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
}
