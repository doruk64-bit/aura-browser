import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Trash2, ChevronDown, Wand2, MessageSquare } from 'lucide-react';
import { useTabStore } from '../../store/useTabStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIPanel() {
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const settings = useSettingsStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const saved = localStorage.getItem('ai-chat-history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Merhaba! Ben Morrow AI. Size nasıl yardımcı olabilirim? Sayfayı özetleyebilir, tarayıcı ayarlarını değiştirebilir veya herhangi bir konuda sohbet edebiliriz.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  const saveHistory = (msgs: Message[]) => {
    localStorage.setItem('ai-chat-history', JSON.stringify(msgs));
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const newMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveHistory(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const lowerInput = input.toLowerCase();
      let aiPrompt = input;
      
      const systemPrompt = `Sen Morrow Tarayıcı'nın akıllı asistanısın. 
      Kullanıcının tarayıcıyı kontrol etmesine yardımcı olabilirsin.
      Eğer kullanıcı bir ayar değişikliği veya navigasyon isterse, yanıtının en sonunda şu formatta bir komut ekle:
      [COMMAND: KOMUT_ADI, DATA: VERİ]

      Desteklenen Komutlar:
      - SET_THEME (DATA: 'light' veya 'dark')
      - SET_ACCENT (DATA: hex renk)
      - NAVIGATE (DATA: url)
      - NEW_TAB (DATA: url)
      - TOGGLE_SIDEBAR (DATA: yok)
      - TOGGLE_PIP (DATA: yok)
      - CLEAR_HISTORY (DATA: yok)
      
      Yanıtın doğal olsun ama komutu en sona ekle.`;

      if (lowerInput.includes('özetle') || lowerInput.includes('bu sayfa') || lowerInput.includes('incele')) {
        let pageContent = '';
        try {
          const contentPromise = window.electronAPI.tabs.executeJavaScript(`document.body.innerText.substring(0, 3500)`);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
          pageContent = await Promise.race([contentPromise, timeoutPromise]) as string;
        } catch (e) {
          pageContent = 'Sayfa içeriği alınamadı.';
        }

        aiPrompt = `${systemPrompt}\n\nSayfa Analizi Talebi.\nSayfa Başlığı: ${activeTab?.title}\nİçerik: ${pageContent}\n\nSoru: ${input}`;
      } else {
        aiPrompt = `${systemPrompt}\n\nKullanıcı: ${input}`;
      }

      const assistantMsgId = Date.now();
      const initialAssistantMsg: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, initialAssistantMsg]);

      // @ts-ignore
      const response = await window.puter.ai.chat(aiPrompt, {
        model: 'gpt-4o-mini',
        stream: true
      });

      let fullContent = '';
      
      // @ts-ignore
      if (response && typeof response[Symbol.asyncIterator] === 'function') {
        // @ts-ignore
        for await (const part of response) {
          const text = part?.text || part?.delta?.content || (typeof part === 'string' ? part : '');
          if (text) {
            fullContent += text;
            const displayContent = fullContent.replace(/\[COMMAND:.*?\]/g, '').trim();
            setMessages(prev => {
              const last = [...prev];
              last[last.length - 1] = { ...last[last.length - 1], content: displayContent || '...' };
              return last;
            });
          }
        }
      }

      const commandMatch = fullContent.match(/\[COMMAND:\s*(\w+)(?:,\s*DATA:\s*'?(.*?)'?)?\]/);
      if (commandMatch) {
          const cmd = commandMatch[1];
          const data = commandMatch[2]?.replace(/'/g, '');
          
          switch (cmd) {
              case 'SET_THEME': if (data === 'light' || data === 'dark') settings.setTheme(data); break;
              case 'SET_ACCENT': if (data) settings.setAccentColor(data); break;
              case 'NAVIGATE': if (data) window.electronAPI.nav.go(data); break;
              case 'NEW_TAB': window.electronAPI.tabs.create(data || 'https://google.com'); break;
              case 'TOGGLE_SIDEBAR': settings.toggleSidebar(); break;
              case 'TOGGLE_PIP': window.electronAPI.tabs.togglePip(); break;
              case 'CLEAR_HISTORY': window.electronAPI.history.clear(); break;
          }
      }
      
      const finalDisplay = fullContent.replace(/\[COMMAND:.*?\]/g, '').trim();
      const finalMsgs: Message[] = [...updatedMessages, { role: 'assistant' as const, content: finalDisplay, timestamp: initialAssistantMsg.timestamp }];
      saveHistory(finalMsgs);
      setMessages(finalMsgs);

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev.slice(0, -1), { 
        role: 'assistant' as const, 
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    const defaultMsg: Message[] = [{
      role: 'assistant' as const,
      content: 'Sohbet temizlendi. Size nasıl yardımcı olabilirim?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(defaultMsg);
    saveHistory(defaultMsg);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'transparent',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ─── Header ─── */}
      <div style={{
        padding: '20px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Morrow AI</h2>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Premium Assistant</span>
          </div>
        </div>
        <button 
          onClick={clearChat}
          style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', 
            borderRadius: '8px', padding: '6px', color: 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          className="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
          title="Temizle"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* ─── Messages ─── */}
      <div 
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          scrollBehavior: 'smooth'
        }}
        className="custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
                padding: '0 4px'
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={12} color="var(--accent)" />
                  </div>
                )}
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {msg.role === 'user' ? 'Siz' : 'Morrow AI'} • {msg.timestamp}
                </span>
                {msg.role === 'user' && (
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={12} color="var(--text-secondary)" />
                  </div>
                )}
              </div>

              <div style={{
                maxWidth: '92%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' 
                  ? 'linear-gradient(135deg, var(--accent), #7c3aed)' 
                  : 'var(--bg-tertiary)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                fontSize: '13.5px',
                lineHeight: '1.6',
                border: '1px solid ' + (msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--border-subtle)'),
                boxShadow: msg.role === 'user' 
                  ? '0 8px 20px -8px var(--accent)' 
                  : '0 4px 12px rgba(0,0,0,0.1)',
                backdropFilter: msg.role === 'assistant' ? 'blur(12px)' : 'none',
                position: 'relative',
                wordBreak: 'break-word'
              }}>
                {msg.content === '' ? (
                  <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                    {[0,1,2].map(d => (
                      <motion.div 
                        key={d}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}
                      />
                    ))}
                  </div>
                ) : msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Input Area ─── */}
      <div style={{
        padding: '20px 16px 24px',
        background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--bg-glass)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          padding: '6px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} className="focus-within:border-[var(--accent)] focus-within:shadow-[0_0_20px_var(--accent-glow)]">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Fikirlerinizi buraya yazın..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                padding: '12px 4px',
                maxHeight: '120px'
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px var(--accent-glow)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                background: input.trim() ? 'var(--accent)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '16px',
                width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
            >
              {isTyping ? (
                <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={18} />
              )}
            </motion.button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
           <div style={{ 
             display: 'flex', alignItems: 'center', gap: '6px', 
             padding: '4px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
             border: '1px solid var(--border-subtle)'
           }}>
             <Wand2 size={12} color="var(--accent)" />
             <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Morrow AI v1.2 • Enhanced Experience</span>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
