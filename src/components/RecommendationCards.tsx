// RecommendationCards.tsx — Auto-surfaced smart suggestions updating every 30s
import React, { useEffect, useState, useRef } from 'react';
import { crowdSim }                              from '../services/crowdSimulator';
import { generateRecommendations, type Recommendation, type RecommendationSeverity }
  from '../services/recommendationEngine';

const SEV_STYLE: Record<RecommendationSeverity, { border: string; bg: string; iconColor: string }> = {
  urgent:  { border: 'rgba(255,46,76,0.4)',  bg: 'rgba(255,46,76,0.08)',  iconColor: 'var(--status-critical)' },
  warning: { border: 'rgba(255,184,0,0.4)',  bg: 'rgba(255,184,0,0.08)',  iconColor: 'var(--accent)' },
  tip:     { border: 'rgba(0,212,255,0.3)',  bg: 'rgba(0,212,255,0.07)',  iconColor: 'var(--primary)' },
  info:    { border: 'rgba(255,255,255,0.1)',bg: 'rgba(255,255,255,0.04)',iconColor: 'var(--text-secondary)' },
};

export const RecommendationCards: React.FC = () => {
  const [recs, setRecs]     = useState<Recommendation[]>([]);
  const [tick, setTick]     = useState(30);
  const [lastUpd, setLastUpd] = useState('Just now');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Derive initial recommendations immediately
    const update = () => {
      const s = crowdSim.getState();
      setRecs(generateRecommendations(s));
      setTick(30);
      setLastUpd(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    update();

    // Re-generate every 30 seconds
    const regen = setInterval(update, 30_000);

    // Countdown ticker every second
    timerRef.current = setInterval(() => setTick(t => Math.max(0, t - 1)), 1_000);

    return () => { clearInterval(regen); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span className="material-icons-round" style={{ fontSize: 22, color: 'var(--accent)' }}>auto_awesome</span>
          Smart Recommendations
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Updated {lastUpd} · refreshes in {tick}s
          </span>
          {/* Progress ring */}
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2"/>
            <circle cx="11" cy="11" r="9" fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 9}`}
              strokeDashoffset={`${2 * Math.PI * 9 * (1 - tick / 30)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </div>
      </div>

      {recs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <span className="material-icons-round" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>check_circle</span>
          All zones operating normally
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {recs.map((rec, i) => {
            const sty = SEV_STYLE[rec.severity];
            return (
              <div key={rec.id}
                style={{
                  background: sty.bg,
                  border: `1px solid ${sty.border}`,
                  borderRadius: 'var(--r-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  animation: `fadeSlideUp 0.4s ease ${i * 0.08}s both`,
                  transition: 'transform 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 'var(--r-sm)',
                    background: `${sty.iconColor}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-icons-round" style={{ fontSize: 17, color: sty.iconColor }}>{rec.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 2 }}>{rec.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rec.category}</div>
                  </div>
                  {rec.severity === 'urgent' && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700,
                      color: 'var(--status-critical)', background: 'var(--status-critical-dim)',
                      padding: '2px 6px', borderRadius: 'var(--r-full)',
                      border: '1px solid rgba(255,46,76,0.3)',
                      animation: 'livePulse 1.5s infinite',
                    }}>URGENT</span>
                  )}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {rec.body}
                </p>

                {rec.ctaLabel && (
                  <button className="btn btn-sm btn-ghost"
                    style={{ alignSelf: 'flex-start', color: sty.iconColor, borderColor: sty.border }}
                    id={`rec-cta-${rec.id}`}
                  >
                    <span className="material-icons-round" style={{ fontSize: 13 }}>arrow_forward</span>
                    {rec.ctaLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
