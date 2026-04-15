// EventSchedule.tsx — Match timeline with live mode awareness
import React from 'react';
import { crowdSim, type MatchMode } from '../services/crowdSimulator';

interface Event { time: string; title: string; mode: MatchMode; icon: string; }

const EVENTS: Event[] = [
  { time: '18:00', title: 'Car Park Opens',      mode: 'pre-match',  icon: 'local_parking' },
  { time: '19:00', title: 'Gates Open',           mode: 'pre-match',  icon: 'door_front' },
  { time: '19:45', title: 'Pre-Match Warm-Up',    mode: 'pre-match',  icon: 'sports_soccer' },
  { time: '20:00', title: 'Kick Off',              mode: 'live',       icon: 'sports' },
  { time: '20:45', title: 'Half Time',             mode: 'half-time',  icon: 'pause_circle' },
  { time: '21:00', title: 'Second Half',           mode: 'live',       icon: 'play_circle' },
  { time: '21:45', title: 'Full Time',             mode: 'post-match', icon: 'flag' },
];

const ACTIVE_MODE = crowdSim.getMatchMode();
const modeOrder: MatchMode[] = ['pre-match', 'live', 'half-time', 'post-match'];

export const EventSchedule: React.FC = () => {
  const [currentMode, setCurrentMode] = React.useState<MatchMode>(crowdSim.getMatchMode());

  React.useEffect(() => {
    const unsub = crowdSim.subscribe(s => setCurrentMode(s.matchMode));
    return () => unsub();
  }, []);

  const modeIdx = modeOrder.indexOf(currentMode);

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--accent)' }}>event</span>
          Match Schedule
        </h2>
        <a href="#" onClick={e => e.preventDefault()} style={{
          fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none',
        }}>
          <span className="material-icons-round" style={{ fontSize: 13 }}>add_alert</span>
          Set Reminders
        </a>
      </div>

      <div style={{ position: 'relative', paddingLeft: '1.4rem' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 8, top: 8, bottom: 8,
          width: 2,
          background: 'linear-gradient(to bottom, var(--primary) 0%, rgba(0,212,255,0.1) 100%)',
          borderRadius: 2,
        }}/>

        {EVENTS.map((ev, i) => {
          const evModeIdx  = modeOrder.indexOf(ev.mode);
          const isPast     = evModeIdx < modeIdx;
          const isActive   = ev.mode === currentMode;

          return (
            <div key={i} style={{
              position: 'relative',
              paddingBottom: i < EVENTS.length - 1 ? '1rem' : 0,
              opacity: isPast ? 0.45 : 1,
              transition: 'opacity 0.4s ease',
            }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-1.4rem',
                top: 2, width: 16, height: 16, borderRadius: '50%',
                background: isActive ? 'var(--primary)' : isPast ? 'rgba(255,255,255,0.15)' : 'var(--bg-base)',
                border: `2px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive ? '0 0 10px rgba(0,212,255,0.6)' : 'none',
                zIndex: 1,
                animation: isActive ? 'pulseRing 2s infinite' : 'none',
              }}>
                {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white'}}/>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="material-icons-round" style={{ fontSize: 14, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {ev.icon}
                  </span>
                  <span style={{ fontSize: '0.83rem', fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {ev.title}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: '0.62rem', background: 'var(--primary-dim)', color: 'var(--primary)',
                      border: '1px solid var(--border-primary)', padding: '1px 6px', borderRadius: 'var(--r-full)', fontWeight: 700 }}>
                      NOW
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ev.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
