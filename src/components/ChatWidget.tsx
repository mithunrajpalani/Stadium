// ChatWidget.tsx — Floating Claude-powered AI assistant
// Calls Anthropic API (claude-sonnet-4-20250514) with live venue context injected
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { crowdSim }                      from '../services/crowdSimulator';
import { askClaude, isValidApiKeyFormat, type Message } from '../services/anthropicService';

interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string; ts: Date; isError?: boolean; }

const QUICK_PROMPTS = [
  { label: '🅿️ Best parking?',     text: 'Which parking zone should I use right now?' },
  { label: '🚪 Least busy gate?',   text: 'Which entry gate has the shortest queue?' },
  { label: '🍔 Fastest food?',      text: 'Where can I get food fastest with the shortest wait?' },
  { label: '🚻 Nearest restroom?',  text: 'Which restroom has the lowest wait time right now?' },
  { label: '⚠️ Any alerts?',        text: 'Are there any critical crowd alerts I should know about?' },
  { label: '🏟️ Exit strategy?',     text: 'What is the best exit strategy after the match?' },
];

export const ChatWidget: React.FC = () => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init', role: 'assistant', ts: new Date(),
    text: "👋 Hi! I'm **StadiumIQ**, your AI venue assistant powered by Claude.\n\nAsk me anything — parking, gate queues, food, restrooms, or match updates. I have live data on all zones right now!",
  }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [apiKey, setApiKey]     = useState<string>(() => localStorage.getItem('sq_api_key') ?? '');
  const [keyPanel, setKeyPanel] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [hasKey, setHasKey]     = useState(() => isValidApiKeyFormat(localStorage.getItem('sq_api_key') ?? ''));
  const history = useRef<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  const saveKey = () => {
    const trimmed = keyInput.trim();
    if (!isValidApiKeyFormat(trimmed)) {
      setKeyError('Key must start with "sk-ant-" and be valid');
      return;
    }
    localStorage.setItem('sq_api_key', trimmed);
    setApiKey(trimmed);
    setHasKey(true);
    setKeyPanel(false);
    setKeyError('');
    setKeyInput('');
  };

  const clearKey = () => {
    localStorage.removeItem('sq_api_key');
    setApiKey('');
    setHasKey(false);
    history.current = [];
  };

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', ts: new Date(), text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build Anthropic history
    history.current.push({ role: 'user', content: trimmed });

    try {
      const venueCtx = crowdSim.getVenueContextString();
      const reply = await askClaude(trimmed, venueCtx, apiKey, history.current.slice(0, -1));
      history.current.push({ role: 'assistant', content: reply });

      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', ts: new Date(), text: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant', ts: new Date(), isError: true,
        text: `⚠️ Error: ${e.message ?? 'Could not reach Claude'}. Check your API key or network.`,
      };
      // Remove the failed user message from history
      history.current.pop();
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Render markdown-like bold (**text**) and line breaks
  const renderText = (txt: string) => {
    return txt.split('\n').map((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={li}>
          {parts.map((p, pi) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={pi} style={{ color: 'var(--primary)' }}>{p.slice(2, -2)}</strong>
              : <span key={pi}>{p}</span>
          )}
          {li < txt.split('\n').length - 1 && <br/>}
        </span>
      );
    });
  };

  // Unread badge count (messages since last open)
  const urgentCount = messages.filter(m => m.role === 'assistant' && !m.isError).length;

  return (
    <>
      {/* ---- Floating trigger button ---- */}
      <button
        id="chat-widget-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Assistant"
        style={{
          position: 'fixed', bottom: '1.75rem', right: '1.75rem',
          zIndex: 1000,
          width: 60, height: 60, borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #FF2E4C, #CC0022)'
            : 'linear-gradient(135deg, #00D4FF, #0094CC)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open
            ? '0 4px 24px rgba(255,46,76,0.5)'
            : '0 4px 24px rgba(0,212,255,0.5)',
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'scale(1.05) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }}
      >
        <span className="material-icons-round" style={{ fontSize: 26, color: open ? 'white' : '#0A0F1E' }}>
          {open ? 'close' : 'smart_toy'}
        </span>
        {!open && urgentCount > 1 && (
          <div style={{
            position: 'absolute', top: 0, right: 2,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--accent)', color: '#0A0F1E',
            fontSize: '0.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-base)',
          }}>
            {Math.min(9, urgentCount - 1)}
          </div>
        )}
      </button>

      {/* ---- Chat panel ---- */}
      <div style={{
        position: 'fixed', bottom: '5.5rem', right: '1.75rem',
        width: 380, maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 600,
        zIndex: 999,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(10,15,30,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.1)',
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ---- Header ---- */}
        <div style={{
          padding: '1rem 1.2rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0,212,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D4FF22, #00D4FF44)',
            border: '1.5px solid var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary)' }}>smart_toy</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Poppins' }}>StadiumIQ AI</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasKey ? 'var(--status-low)' : 'var(--status-mid)', display: 'inline-block' }}/>
              {hasKey ? 'Claude claude-sonnet-4-20250514 · Live data ready' : 'API key required'}
            </div>
          </div>
          {/* API key icon */}
          <button
            onClick={() => setKeyPanel(k => !k)}
            title="Configure API Key"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: hasKey ? 'var(--status-low)' : 'var(--accent)', padding: 4 }}
          >
            <span className="material-icons-round" style={{ fontSize: 20 }}>
              {hasKey ? 'key' : 'key_off'}
            </span>
          </button>
        </div>

        {/* ---- API Key panel ---- */}
        {keyPanel && (
          <div style={{
            padding: '1rem 1.2rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255,184,0,0.06)',
            animation: 'fadeSlideUp 0.2s ease',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, color: 'var(--accent)' }}>
              {hasKey ? '✓ API Key Configured' : '⚙ Enter Anthropic API Key'}
            </div>
            {hasKey ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  sk-ant-••••••••{apiKey.slice(-6)}
                </div>
                <button className="btn btn-sm btn-danger" onClick={clearKey}>
                  Remove
                </button>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  className="input"
                  style={{ borderRadius: 'var(--r-sm)', fontSize: '0.85rem', marginBottom: 6 }}
                  placeholder="sk-ant-api03-..."
                  value={keyInput}
                  onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
                  onKeyDown={e => e.key === 'Enter' && saveKey()}
                  id="api-key-input"
                />
                {keyError && <div style={{ fontSize: '0.72rem', color: 'var(--status-critical)', marginBottom: 6 }}>{keyError}</div>}
                <button className="btn btn-accent btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={saveKey} id="btn-save-api-key">
                  Save API Key
                </button>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Key stored in localStorage. Never sent to any server other than Anthropic.
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- Messages ---- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeSlideUp 0.25s ease',
            }}>
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <span className="material-icons-round" style={{ fontSize: 13, color: msg.isError ? 'var(--status-high)' : 'var(--primary)' }}>
                    {msg.isError ? 'error' : 'smart_toy'}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    STADIUMIQ AI · {msg.ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div style={{
                maxWidth: '88%',
                padding: '0.65rem 0.9rem',
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #00D4FF22, #00D4FF11)'
                  : msg.isError
                  ? 'rgba(255,107,53,0.1)'
                  : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user'
                  ? '1px solid var(--border-primary)'
                  : msg.isError
                  ? '1px solid rgba(255,107,53,0.3)'
                  : '1px solid var(--border)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: msg.role === 'user' ? 'var(--primary)' : 'var(--text-primary)',
                wordBreak: 'break-word',
              }}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease' }}>
              <span className="material-icons-round" style={{ fontSize: 13, color: 'var(--primary)' }}>smart_toy</span>
              <div style={{ padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--border)' }}>
                <div className="typing-dots">
                  <span/><span/><span/>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* ---- Quick Prompts ---- */}
        {messages.length <= 2 && (
          <div style={{
            padding: '0 1rem 0.5rem',
            display: 'flex', gap: 6, overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p.text)} className="chip"
                id={`quick-prompt-${i}`}
                style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* ---- Input bar ---- */}
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            className="input"
            id="chat-input"
            style={{ flex: 1, borderRadius: 'var(--r-full)', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            placeholder={hasKey ? 'Ask anything about the venue...' : 'Enter API key above to chat with AI...'}
            value={input}
            disabled={loading || !hasKey}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && send(input)}
          />
          <button
            id="chat-send-btn"
            onClick={() => send(input)}
            disabled={loading || !input.trim() || !hasKey}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: input.trim() && hasKey ? 'linear-gradient(135deg, #00D4FF, #0094CC)' : 'rgba(255,255,255,0.07)',
              border: 'none', cursor: input.trim() && hasKey ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: input.trim() && hasKey ? '0 4px 16px rgba(0,212,255,0.3)' : 'none',
            }}
          >
            <span className="material-icons-round" style={{ fontSize: 18, color: input.trim() && hasKey ? '#0A0F1E' : 'var(--text-muted)' }}>
              {loading ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
