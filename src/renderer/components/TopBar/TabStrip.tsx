/**
 * TabStrip — Sekme çubuğu (sürüklenebilir bölgenin içinde)
 * Açık sekmeleri listeler + yeni sekme butonu
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTabStore } from '../../store/useTabStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import Tab from './Tab';
import Sortable from 'sortablejs';

export default function TabStrip() {
  const { tabs, activeTabId, reorderTabs, groupTabs, groups, toggleGroupCollapse, updateGroup } = useTabStore();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupTitle, setEditGroupTitle] = useState<string>('');
  const { tabGroupingEnabled } = useSettingsStore();

  const handleCreate = () => {
    window.electronAPI?.tabs.create('about:blank');
  };

  const handleCloseAll = () => {
    window.electronAPI?.tabs.closeAll();
  };

  const handleClose = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    window.electronAPI?.tabs.close(tabId);
  };

  const handleSelect = (tabId: number) => {
    window.electronAPI?.tabs.switchTo(tabId);
  };

  const sortableRef = useRef<Sortable | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gridRef.current) {
      sortableRef.current = new Sortable(gridRef.current, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        draggable: '.tab-item',
        filter: '.no-drag',
        direction: 'horizontal',
        forceFallback: true,
        fallbackTolerance: 3,
        fallbackOnBody: true,
        onStart: () => {
          const dragEl = document.querySelector('.sortable-drag') as HTMLElement;
          if (dragEl) {
            // Başlangıçtaki dikey (Y) konumunu kaydet
            const lockedY = dragEl.getBoundingClientRect().top;
            
            const lockY = () => {
              const currentDragEl = document.querySelector('.sortable-drag') as HTMLElement;
              if (currentDragEl) {
                currentDragEl.style.setProperty('top', `${lockedY}px`, 'important');
                (window as any)._dragLockFrame = requestAnimationFrame(lockY);
              }
            };
            lockY();
          }
        },
        onEnd: (evt) => {
          if ((window as any)._dragLockFrame) {
            cancelAnimationFrame((window as any)._dragLockFrame);
          }
          const itemEl = evt.item;
          const activeId = Number(itemEl.getAttribute('data-id'));
          const newIndex = evt.newIndex;
          const oldIndex = evt.oldIndex;
          
          if (activeId && newIndex !== undefined && oldIndex !== undefined && newIndex !== oldIndex) {
            // Find what was at the new index visually
            // SortableJS mutates the DOM directly. We should use the DOM array to find the overId
            const nodes = Array.from(gridRef.current!.querySelectorAll('.tab-item'));
            // React hasn't updated yet, so nodes in the DOM currently represent the new state
            // The item has already been inserted at 'newIndex'
            // To sync with React state without causing hydration issues, we need to find the node that it swapped with
            // Actually, if we just find the data-id of the element that we dropped on:
            // But an easier way: we know oldIndex and newIndex relative to draggable items
             
            // We can just get the new order from the DOM
            const newOrderIds = nodes.map(node => Number(node.getAttribute('data-id')));
            const overId = newOrderIds[newIndex === newOrderIds.length - 1 ? newIndex - 1 : newIndex + 1] || newOrderIds[newIndex];
            
            // Reorder functionally using our store logic
            if (activeId !== overId) {
                reorderTabs(activeId, overId);
                window.electronAPI?.tabs.reorder(activeId, overId);
            }
          }
        }
      });
    }

    return () => {
      sortableRef.current?.destroy();
    };
  }, [tabs.length]); // re-init or bind slightly, though Sortable handles DOM updates well natively

  return (
    <div
      className="tab-strip-scroll"
      style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0 4px',
        }}
      >
      <style>{`
        .tab-strip-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div ref={gridRef} style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {tabs.map((tab, index) => {
              const previousTab = index > 0 ? tabs[index - 1] : null;
              const isFirstInGroup = tab.groupId && (!previousTab || previousTab.groupId !== tab.groupId);
              const hasSeparator = index < tabs.length - 1 && tab.groupId !== tabs[index + 1]?.groupId;
              
              const group = tab.groupId ? groups.find(g => g.id === tab.groupId) : null;
              
              // Sadece sekmeyi gizle, grup etiketini (pill) her halükarda çiz
              const isTabHidden = group?.collapsed && tab.id !== activeTabId;

              return (
                <React.Fragment key={`frag-${tab.id}`}>
                  {isFirstInGroup && group && (
                    <motion.div
                      className="no-drag"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (editingGroupId !== group.id) toggleGroupCollapse(group.id); 
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingGroupId(group.id);
                        setEditGroupTitle(group.title);
                      }}
                      whileHover={{ filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.95 }}
                      title={group.collapsed ? 'Grubu Genişlet' : 'Grubu Daralt'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '24px',
                        padding: '0 8px',
                        borderRadius: '12px',
                        background: group.color,
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginRight: '6px',
                        marginLeft: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        WebkitAppRegion: 'no-drag',
                      } as any}
                    >
                      {editingGroupId === group.id ? (
                        <input
                          autoFocus
                          value={editGroupTitle}
                          onChange={(e) => setEditGroupTitle(e.target.value)}
                          onBlur={() => {
                            updateGroup(group.id, editGroupTitle.trim() || 'Grup');
                            setEditingGroupId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateGroup(group.id, editGroupTitle.trim() || 'Grup');
                              setEditingGroupId(null);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            font: 'inherit',
                            outline: 'none',
                            width: `${Math.max(40, editGroupTitle.length * 7)}px`,
                            textAlign: 'center',
                          }}
                        />
                      ) : (
                        group.title
                      )}
                    </motion.div>
                  )}
                  {!isTabHidden && (
                    <Tab
                      key={tab.id}
                      tab={tab}
                      isActive={tab.id === activeTabId}
                      hasSeparator={hasSeparator}
                      onSelect={() => handleSelect(tab.id)}
                      onClose={(e) => handleClose(e, tab.id)}
                    />
                  )}
                </React.Fragment>
              );
            })}
      </div>

      {/* Yeni Sekme Butonu */}
      <motion.button
        onClick={handleCreate}
        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.9 }}
        className="no-drag"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
          padding: 0,
          marginLeft: '4px',
        }}
      >
        +
      </motion.button>

      {/* Tüm Sekmeleri Kapat */}
      <motion.button
        onClick={handleCloseAll}
        whileHover={{ scale: 1.1, background: 'rgba(255,100,100,0.1)' }}
        whileTap={{ scale: 0.9 }}
        className="no-drag"
        title="Tüm Sekmeleri Kapat"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: 'transparent',
          color: '#ff4d4f',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          flexShrink: 0,
          padding: 0,
          marginLeft: '2px',
        }}
      >
        ✕
      </motion.button>
    </div>
  );
}
