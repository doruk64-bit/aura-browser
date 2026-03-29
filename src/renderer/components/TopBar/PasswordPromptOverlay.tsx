import { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PasswordPromptOverlay() {
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState<{ origin: string, username: string, password: string } | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const cleanup = window.electronAPI?.system?.onPasswordPromptData?.((promptData: any) => {
      setData(promptData);
      setUsername(promptData?.username || '');
      setShowPassword(false);
    });
    return () => { cleanup?.(); };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0',
        padding: '0',
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          html, body, #root {
            background: transparent !important;
            background-color: transparent !important;
          }
        `}
      </style>
      
      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              width: '280px',
              background: 'rgba(15, 13, 25, 0.97)',
              backdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(139, 92, 246, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={16} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Şifre kaydedilsin mi?</h3>
              </div>
              <motion.button
                whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.electronAPI?.system?.closePasswordPrompt()}
                style={{ 
                  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', 
                  cursor: 'pointer', padding: '4px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' 
                }}
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, paddingLeft: '2px' }}>Kullanıcı adı</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ 
                    width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', 
                    color: '#ffffff', fontSize: '12px', outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(139, 92, 246, 0.25)')}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, paddingLeft: '2px' }}>Şifre</span>
                <div 
                  style={{ 
                    display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)')}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={data.password || ''}
                    readOnly
                    style={{ 
                      flex: 1, padding: '8px 12px', background: 'transparent', 
                      border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '12px', outline: 'none',
                      width: '0' // flex-1 handles width
                    }}
                  />
                  <motion.button
                    whileHover={{ color: '#ffffff' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                    style={{ 
                      background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', 
                      cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </motion.button>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              <motion.button
                whileHover={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  await window.electronAPI?.system?.confirmSavePassword(data.origin, username, data.password);
                  window.electronAPI?.system?.closePasswordPrompt(true);
                }}
                style={{ 
                  flex: 1.2, padding: '8px 0', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
                  border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '12px', 
                  cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                }}
              >
                Kaydet
              </motion.button>
              <motion.button
                whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  window.electronAPI?.system?.closePasswordPrompt(true);
                }}
                style={{ 
                  flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', 
                  color: '#ffffff', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                İptal
              </motion.button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
