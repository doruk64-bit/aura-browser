import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GestureOverlay() {
  const [activeGesture, setActiveGesture] = useState<any | null>(null);

  useEffect(() => {
    const handleGesture = (data: any) => {
      setActiveGesture(data);
      
      // Auto-hide after animation
      const timeout = data.type === 'pinch' && data.state === 'begin' ? 0 : 1500;
      if (timeout > 0) {
        setTimeout(() => setActiveGesture(null), timeout);
      }
    };

    const cleanup = window.electronAPI?.system.onGestureFeedback(handleGesture);
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <AnimatePresence>
        {activeGesture?.type === 'swipe' && (
          <motion.div
            initial={{ opacity: 0, x: activeGesture.direction === 'right' ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeGesture.direction === 'right' ? 100 : -100 }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '30px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: activeGesture.direction === 'right' ? '40px' : 'auto',
              right: activeGesture.direction === 'left' ? '40px' : 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <span style={{ fontSize: '24px', color: 'white' }}>
              {activeGesture.direction === 'right' ? '←' : '→'}
            </span>
          </motion.div>
        )}

        {activeGesture?.type === 'edge' && activeGesture.position === 'top' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 40 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'absolute',
              top: 0,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
               style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
             />
             <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>Yenileniyor</span>
          </motion.div>
        )}

        {(activeGesture?.type === 'zoom' || (activeGesture?.type === 'pinch' && activeGesture.state === 'end')) && (
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             style={{
               padding: '8px 16px',
               borderRadius: '12px',
               background: 'rgba(0, 0, 0, 0.4)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
               color: 'white',
               fontSize: '14px',
               fontWeight: 600,
               boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
             }}
           >
             Zoom: {Math.round((activeGesture.value || activeGesture.zoom || 1) * 100)}%
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
