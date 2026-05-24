// ================================================
// FAYL: src/components/AIChatBot.jsx
// QAYERGA QO'SHISH:
// 1. Shu faylni frontend/src/components/ papkasiga qo'shing
// 2. HR, Manager, Employee layoutlarida import qiling:
//    import AIChatBot from '../components/AIChatBot';
// 3. Layout return() ichida, oxirida qo'shing:
//    <AIChatBot role={user?.role} userName={user?.fullName} />
// ================================================

import { useState, useRef, useEffect } from 'react';

const GEMINI_API_KEY = 'AIzaSyAGOCo7CIo_G6wWZI_mvHRTVfMKUHMGg-o';

const SYSTEM_PROMPT = `Sen SkillPath Bank LMS tizimining AI yordamchisisans. 
Sening vazifang bank xodimlariga ish bo'yicha savollarga javob berish.

Quyidagi mavzularda yordam berasan:
- Career track va daraja ko'tarish (promotion) jarayoni
- Traininglar va ularni bajarish tartibi
- KYC, AML, Compliance qoidalari
- Bank operatsiyalari va standartlar
- Ko'nikmalarni rivojlantirish
- Feedback olish va berish
- Ish muhiti va HR siyosatlari

Qoidalar:
- Faqat ish bilan bog'liq savollarga javob ber
- Javoblarni qisqa va aniq yoz (3-5 jumladan oshirma)
- O'zbek tilida javob ber
- Do'stona va professional ohangda bo'l
- Bank sirlarini oshkor qilma
- Ish bilan bog'liq bo'lmagan savollarga: "Bu savolga javob bera olmayman, faqat ish mavzularida yordam bera olaman" de`;

const QUICK_QUESTIONS = [
  "Promotion uchun qanday talablar bor?",
  "KYC nima va qanday bajariladi?",
  "Traininglarni qanday tugataman?",
  "Career track qanday ishlaydi?",
  "AML compliance nima?",
  "Ko'nikmalarimni qanday oshiraman?"
];

export default function AIChatBot({ role, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: `Salom, ${userName || 'xodim'}! 👋 Men SkillPath AI yordamchisiman.\n\nIsh bo'yicha har qanday savolga javob bera olaman. Nima so'rasangiz bo'ladi!`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: userText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              ...history,
              { role: 'user', parts: [{ text: userText }] }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          })
        }
      );

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Kechirasiz, javob bera olmadim.';

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: aiText,
        time: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
        time: new Date()
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.floatBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0"/>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
          </svg>
          <span style={styles.floatBtnBadge}>AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{ ...styles.chatWindow, height: isMinimized ? 'auto' : 520 }}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.aiAvatar}>
                <span style={{ fontSize: 18 }}>🤖</span>
              </div>
              <div>
                <div style={styles.headerTitle}>SkillPath AI</div>
                <div style={styles.headerStatus}>
                  <span style={styles.statusDot} />
                  Faol
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setIsMinimized(!isMinimized)} style={styles.iconBtn}>
                {isMinimized ? '▲' : '▼'}
              </button>
              <button onClick={() => setIsOpen(false)} style={styles.iconBtn}>✕</button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={styles.messages}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    ...styles.msgRow,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={styles.msgAvatar}>🤖</div>
                    )}
                    <div style={{
                      ...styles.msgBubble,
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                        : 'white',
                      color: msg.role === 'user' ? 'white' : '#1E293B',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: msg.role === 'user' ? '0 2px 8px rgba(37,99,235,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      <div style={styles.msgText}>{msg.text}</div>
                      <div style={{
                        ...styles.msgTime,
                        color: msg.role === 'user' ? 'rgba(255,255,255,0.65)' : '#94A3B8'
                      }}>
                        {formatTime(msg.time)}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div style={{ ...styles.msgAvatar, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white' }}>
                        {userName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                    <div style={styles.msgAvatar}>🤖</div>
                    <div style={{ ...styles.msgBubble, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <div style={styles.typing}>
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 2 && (
                <div style={styles.quickWrap}>
                  <div style={styles.quickLabel}>Tez savollar:</div>
                  <div style={styles.quickList}>
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => sendMessage(q)} style={styles.quickBtn}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={styles.inputArea}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Savolingizni yozing..."
                  rows={1}
                  style={styles.input}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{
                    ...styles.sendBtn,
                    opacity: !input.trim() || loading ? 0.5 : 1
                  }}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}

const styles = {
  floatBtn: {
    position: 'fixed',
    bottom: 28,
    right: 28,
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
    zIndex: 1000,
    animation: 'pulse 2s infinite',
    position: 'fixed'
  },
  floatBtnBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: '#10B981',
    color: 'white',
    fontSize: 9,
    fontWeight: 800,
    padding: '2px 5px',
    borderRadius: 8,
    letterSpacing: 0.5
  },
  chatWindow: {
    position: 'fixed',
    bottom: 28,
    right: 28,
    width: 360,
    background: '#F8FAFC',
    borderRadius: 20,
    boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1001,
    animation: 'chatIn 0.3s ease',
    border: '1px solid rgba(226,232,240,0.8)'
  },
  header: {
    background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  aiAvatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.3)'
  },
  headerTitle: { color: 'white', fontWeight: 700, fontSize: 14 },
  headerStatus: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#10B981',
    display: 'inline-block'
  },
  iconBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'white',
    width: 28,
    height: 28,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 6 },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0
  },
  msgBubble: {
    maxWidth: '78%',
    padding: '10px 13px',
    border: '1px solid rgba(226,232,240,0.5)'
  },
  msgText: { fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  typing: {
    display: 'flex',
    gap: 4,
    padding: '2px 4px',
    alignItems: 'center',
    height: 20
  },
  quickWrap: {
    padding: '8px 12px',
    borderTop: '1px solid #E2E8F0',
    background: 'white',
    flexShrink: 0
  },
  quickLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickList: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  quickBtn: {
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    color: '#1D4ED8',
    fontSize: 11.5,
    padding: '4px 10px',
    borderRadius: 20,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.15s'
  },
  inputArea: {
    padding: '10px 12px',
    borderTop: '1px solid #E2E8F0',
    background: 'white',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    flexShrink: 0
  },
  input: {
    flex: 1,
    border: '1.5px solid #E2E8F0',
    borderRadius: 12,
    padding: '9px 13px',
    fontSize: 13.5,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    maxHeight: 100,
    background: '#F8FAFC'
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    border: 'none',
    color: 'white',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
};
