/**
 * TabStrip — Sekme çubuğu (sürüklenebilir bölgenin içinde)
 * Açık sekmeleri listeler + yeni sekme butonu
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useTabStore } from '../../store/useTabStore';
import Tab from './Tab';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

export default function TabStrip() {
  const { tabs, activeTabId, reorderTabs } = useTabStore();

  const handleCreate = () => {
    window.electronAPI?.tabs.create('about:blank');
  };

  const handleClose = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    window.electronAPI?.tabs.close(tabId);
  };

  const handleSelect = (tabId: number) => {
    window.electronAPI?.tabs.switchTo(tabId);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = active.id as number;
      const overId = over.id as number;
      // Zustand state güncellemesi
      reorderTabs(activeId, overId);
      // Electron main process güncellemesi
      window.electronAPI?.tabs.reorder(activeId, overId);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        padding: '0 4px',
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                onSelect={() => handleSelect(tab.id)}
                onClose={(e) => handleClose(e, tab.id)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

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
    </div>
  );
}
