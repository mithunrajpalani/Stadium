// HeroBanner.tsx — Stadium silhouette hero with live badge + match mode toggle
import React, { useEffect, useState } from 'react';
import { crowdSim, type MatchMode, type SimulationState } from '../services/crowdSimulator';

const MODES: { key: MatchMode; label: string; icon: string }[] = [
  { key: 'pre-match',  label: 'Pre-Match',  icon: 'sports_soccer' },
  { key: 'live',       label: 'Live',        icon: 'radio_button_checked' },
  { key: 'half-time',  label: 'Half-Time',   icon: 'pause_circle' },
  { key: 'post-match', label: 'Post-Match',  icon: 'flag' },
];

export const HeroBanner: React.FC = () => {
  const [state, setState]  = useState<SimulationState>(crowdSim.getState());
  const [score, setScore]  = useState({ home: 1, away: 0 });
  const [elapsed, setElapsed] = useState(63);

  useEffect(() => {
    const unsub = crowdSim.subscribe(setState);
    // Simulate match clock ticking
    const clock = setInterval(() => {
      setElapsed(e => {
        if (state.matchMode === 'live') return Math.min(90, e + 1);
        if (state.matchMode === 'half-time') return 45;
        if (state.matchMode === 'post-match') return 90;
        return 0;
      });
    }, 60_000);
    return () => { unsub(); clearInterval(clock); };
  }, [state.matchMode]);

  const handleMode = (mode: MatchMode) => {
    crowdSim.setMatchMode(mode);
    if (mode === 'half-time') setElapsed(45);
    if (mode === 'post-match') { setElapsed(90); setScore({ home: 2, away: 1 }); }
    if (mode === 'pre-match')  { setElapsed(0);  setScore({ home: 0, away: 0 }); }
    if (mode === 'live')       { setElapsed(63); setScore({ home: 1, away: 0 }); }
  };

  const modeColor: Record<MatchMode, string> = {
    'pre-match':  'var(--primary)',
    'live':       'var(--status-critical)',
    'half-time':  'var(--status-mid)',
    'post-match': 'var(--text-secondary)',
  };

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--r-xl)',
      border: '1px solid var(--border)',
      background: 'linear-gradient(160deg, #0D1528 0%, #0A0F1E 60%, #0E1A2E 100%)',
      boxShadow: '0 0 60px rgba(0,212,255,0.08)',
      marginBottom: '1.5rem',
    }}>
      {/* Stadium silhouette SVG */}
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}>
        {/* Outer stadium shell */}
        <ellipse cx="600" cy="280" rx="560" ry="200" fill="none" stroke="#00D4FF" strokeWidth="3"/>
        <ellipse cx="600" cy="280" rx="420" ry="150" fill="none" stroke="#00D4FF" strokeWidth="2"/>
        {/* Roof trusses */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x1 = 600 + Math.cos(angle) * 420;
          const y1 = 280 + Math.sin(angle) * 150;
          const x2 = 600 + Math.cos(angle) * 560;
          const y2 = 280 + Math.sin(angle) * 200;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00D4FF" strokeWidth="1.5" opacity="0.6"/>;
        })}
        {/* Pitch outline */}
        <rect x="380" y="200" width="440" height="160" rx="4" fill="none" stroke="#00FF88" strokeWidth="2" opacity="0.8"/>
        <ellipse cx="600" cy="280" rx="55" ry="40" fill="none" stroke="#00FF88" strokeWidth="1.5" opacity="0.6"/>
        <line x1="380" y1="280" x2="820" y2="280" stroke="#00FF88" strokeWidth="1" opacity="0.6"/>
        {/* Goal boxes */}
        <rect x="380" y="248" width="55" height="64" fill="none" stroke="#00FF88" strokeWidth="1.5" opacity="0.5"/>
        <rect x="765" y="248" width="55" height="64" fill="none" stroke="#00FF88" strokeWidth="1.5" opacity="0.5"/>
        {/* Stands seating suggestion */}
        {[...Array(20)].map((_, i) => (
          <rect key={i} x={60 + i * 54} y={160} width={32} height={14} rx={2}
            fill="#1A4080" opacity={0.4 + Math.random() * 0.4} />
        ))}
      </svg>

      {/* Scan line animation overlay */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'var(--r-xl)',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(to right, transparent, rgba(0,212,255,0.4), transparent)',
          animation: 'scanLine 4s linear infinite',
        }}/>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '1.5rem 2rem' }}>

        {/* Top row: title + live badge */}
        <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 className="gradient-text" style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)' }}>
                StadiumIQ
              </h1>
              <span className="badge badge-live">LIVE</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              <span className="material-icons-round" style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle' }}>stadium</span>
              {state.eventName}
            </p>
          </div>

          {/* Scoreboard */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '0.6rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>City FC</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'Poppins', lineHeight: 1 }}>{score.home}</div>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>–</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>United FC</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'Poppins', lineHeight: 1 }}>{score.away}</div>
            </div>
            <div style={{
              fontSize: '0.75rem', color: modeColor[state.matchMode],
              fontWeight: 700, background: `${modeColor[state.matchMode]}18`,
              padding: '2px 8px', borderRadius: 'var(--r-sm)',
              border: `1px solid ${modeColor[state.matchMode]}44`,
            }}>
              {state.matchMode === 'live' ? `${elapsed}'` : state.matchMode.toUpperCase().replace('-', ' ')}
            </div>
          </div>
        </div>

        {/* Mode toggles */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MODES.map(({ key, label, icon }) => {
            const active = state.matchMode === key;
            return (
              <button key={key} onClick={() => handleMode(key)} className="btn btn-sm"
                id={`mode-btn-${key}`}
                style={{
                  background: active ? `${modeColor[key]}22` : 'rgba(0,0,0,0.25)',
                  color: active ? modeColor[key] : 'var(--text-muted)',
                  border: `1px solid ${active ? modeColor[key] : 'var(--border)'}`,
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s ease',
                }}>
                <span className="material-icons-round" style={{ fontSize: 15 }}>{icon}</span>
                {label}
              </button>
            );
          })}

          {/* Halftime countdown chip (only in live mode) */}
          {state.matchMode === 'live' && state.halftimeCountdownMin < 10 && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.4)',
              padding: '4px 12px', borderRadius: 'var(--r-full)',
              color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700,
              animation: 'fadeIn 0.3s ease',
            }}>
              <span className="material-icons-round" style={{ fontSize: 15 }}>timer</span>
              Halftime in {state.halftimeCountdownMin}m
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
