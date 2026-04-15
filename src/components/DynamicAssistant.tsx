import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Navigation, CreditCard, ArrowUpCircle, BellRing } from 'lucide-react';
import { generateAIResponse, type ChatMessage } from '../services/vertexAiMock';
import { crowdSim, type SimulationState } from '../services/crowdSimulator';

export const DynamicAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1', sender: 'assistant', text: "Hi! I'm StadiumIQ. How can I assist you today? (Try asking about food, restrooms, or crowds)", timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [venueState, setVenueState] = useState<SimulationState>(crowdSim.getState());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = crowdSim.subscribe((state) => setVenueState(state));
    return () => unsub();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(), sender: 'user', text: textToSend, timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await generateAIResponse(userMsg.text, venueState);
    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
  };

  const quickPrompts = [
    { label: 'Alerts', text: 'What are the current alerts?' },
    { label: 'Exit timing', text: 'When is the best time to leave?' },
    { label: 'Accessible route', text: 'Find me an accessible route to the bathroom' },
    { label: 'Upgrade seat', text: 'Can I upgrade my seat?' }
  ];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot color="var(--color-secondary)" /> AI Venue Assistant
        </h2>
        <Sparkles size={18} color="var(--color-secondary)" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            display: 'flex',
            gap: '8px'
          }}>
            {msg.sender === 'assistant' && <div style={{ marginTop: '4px' }}><Bot size={16} color="var(--color-secondary)"/></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className="animate-slide-up" style={{
                backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                padding: '12px 16px',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.9rem'
              }}>
                {msg.text}
              </div>
              
              {/* Contextual Action Chips */}
              {msg.actionType && msg.sender === 'assistant' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {msg.actionType === 'order' && (
                    <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#000', border: '1px solid #333' }}>
                      <CreditCard size={14} /> Buy via GPay
                    </button>
                  )}
                  {msg.actionType === 'route' && (
                    <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                      <Navigation size={14} /> Show Route
                    </button>
                  )}
                  {msg.actionType === 'alerts' && (
                    <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--color-danger)' }}>
                      <BellRing size={14} /> Open Alerts
                    </button>
                  )}
                  {msg.actionType === 'upgrade' && (
                    <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--color-warning)', color: '#000' }}>
                      <ArrowUpCircle size={14} /> Pay $45 Setup
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px' }}>
             <Bot size={16} color="var(--color-secondary)"/>
             <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', gap: '4px' }}>
                <span style={{ animation: 'float 1s infinite' }}>.</span>
                <span style={{ animation: 'float 1s infinite 0.2s' }}>.</span>
                <span style={{ animation: 'float 1s infinite 0.4s' }}>.</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
           {quickPrompts.map((p, i) => (
             <button key={i} onClick={() => handleSend(p.text)} style={{
               whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem',
               background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main)', border: '1px solid rgba(255,255,255,0.1)',
               cursor: 'pointer'
             }}>
               {p.label}
             </button>
           ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI anything..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none'
            }}
          />
          <button onClick={() => handleSend()} style={{
            background: 'var(--color-primary)', border: 'none', borderRadius: '50%',
            width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'white'
          }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
