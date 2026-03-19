/**
 * SidebarItem — Kenar çubuğu tek öğe bileşeni
 */

import { motion } from 'framer-motion';

interface SidebarItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: number;
}

export default function SidebarItem({ icon, label, isActive, onClick, badge }: SidebarItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ background: 'rgba(255,255,255,0.06)' }}
      whileTap={{ scale: 0.92 }}
      title={label}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        color: isActive ? 'var(--accent-hover)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        padding: 0,
        position: 'relative',
        transition: 'color var(--transition-fast)',
      }}
    >
      {/* Aktif çizgi göstergesi */}
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          style={{
            position: 'absolute',
            left: '-2px',
            width: '3px',
            height: '20px',
            borderRadius: '2px',
            background: 'var(--accent)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      <span>{icon}</span>

      {/* Bildirim rozeti */}
      {badge !== undefined && badge > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--danger)',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </motion.button>
  );
}
