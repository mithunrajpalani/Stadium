// JourneyPlanner.tsx — Seat section picker + Parking → Gate → Seat route planner
import React, { useState } from 'react';
import { crowdSim } from '../services/crowdSimulator';

const SECTIONS = [
  'North Stand', 'North Block A', 'North Block B',
  'South Stand', 'South Block A', 'South Block B',
  'East Lower',  'East Upper',
  'West Lower',  'West Upper',
  'VIP Box',     'Family Zone',
];

interface Step { icon: string; label: string; detail: string; duration: number; status: 'done'|'active'|'pending'; }

function buildRoute(section: string): Step[] {
  // Derive best parking + gate from current crowd sim data
  const state = crowdSim.getState();
  const parkZones = state.zones.filter(z => z.category === 'parking' && z.isOpen);
  const gateZones = state.zones.filter(z => z.category === 'gate' && z.isOpen);

  const bestPark = [...parkZones].sort((a, b) => a.density - b.density)[0];
  const bestGate = [...gateZones].sort((a, b) => a.density - b.density)[0];

  const walkMin = section.toLowerCase().includes('north') || section.toLowerCase().includes('south')
    ? 6 : section.toLowerCase().includes('vip') ? 3 : 8;

  return [
    {
      icon: 'local_parking',
      label: bestPark?.name ?? 'Parking Zone B',
      detail: `${bestPark?.density ?? 45}% full · ${bestPark?.waitTimeMin ?? 3} min wait`,
      duration: bestPark?.waitTimeMin ?? 3,
      status: 'done',
    },
    {
      icon: 'directions_walk',
      label: 'Walk to Entry',
      detail: `~3 min walk via East Concourse`,
      duration: 3,
      status: 'active',
    },
    {
      icon: 'door_front',
      label: bestGate?.name ?? 'Gate 2 — North',
      detail: `${bestGate?.density ?? 30}% density · ${bestGate?.waitTimeMin ?? 2} min queue`,
      duration: bestGate?.waitTimeMin ?? 2,
      status: 'active',
    },
    {
      icon: 'elevator',
      label: 'To Concourse Level',
      detail: `Take Lift 2 or Stairwell B`,
      duration: 2,
      status: 'pending',
    },
    {
      icon: 'event_seat',
      label: section,
      detail: `Walk time ~${walkMin} min`,
      duration: walkMin,
      status: 'pending',
    },
  ];
}

export const JourneyPlanner: React.FC = () => {
  const [selected, setSelected] = useState<string>('');
  const [route, setRoute]       = useState<Step[] | null>(null);
  const [totalMin, setTotalMin] = useState(0);

  const handlePlan = () => {
    if (!selected) return;
    const steps = buildRoute(selected);
    const total = steps.reduce((s, st) => s + st.duration, 0);
    setRoute(steps);
    setTotalMin(total);
  };

  const statusDot = (s: Step['status']) => {
    if (s === 'done')    return { bg: 'var(--status-low)', border: 'var(--status-low)' };
    if (s === 'active')  return { bg: 'var(--primary)',    border: 'var(--primary)' };
    return { bg: 'var(--bg-elevated)', border: 'var(--border)' };
  };

  return (
    <div className="glass-card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
        <span className="material-icons-round" style={{ fontSize: 22, color: 'var(--primary)' }}>route</span>
        Personal Journey Planner
      </h2>

      {/* Seat picker */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          SELECT YOUR SEAT SECTION
        </label>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {SECTIONS.map(sec => (
            <button
              key={sec}
              onClick={() => { setSelected(sec); setRoute(null); }}
              className={`chip ${selected === sec ? 'active' : ''}`}
              id={`section-${sec.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginBottom: '1.25rem' }}
        onClick={handlePlan}
        disabled={!selected}
        id="btn-plan-route"
      >
        <span className="material-icons-round" style={{ fontSize: 18 }}>alt_route</span>
        Plan My Route
      </button>

      {route && (
        <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
          {/* Total time banner */}
          <div style={{
            background: 'var(--primary-dim)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--r-md)',
            padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary)' }}>timer</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED JOURNEY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Poppins' }}>
                  ~{totalMin} minutes total
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-low)', fontWeight: 600 }}>
              Optimal route selected ✓
            </div>
          </div>

          {/* Timeline steps */}
          <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: '10px', top: '8px', bottom: '8px',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--primary), rgba(0,212,255,0.1))',
              borderRadius: 2,
            }}/>

            {route.map((step, i) => {
              const dot = statusDot(step.status);
              return (
                <div key={i} style={{
                  position: 'relative', paddingBottom: i < route.length - 1 ? '1.1rem' : 0,
                  animation: `fadeSlideUp 0.3s ease ${i * 0.08}s both`,
                }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: '-1.75rem',
                    top: 4,
                    width: 20, height: 20, borderRadius: '50%',
                    background: dot.bg,
                    border: `2px solid ${dot.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: step.status !== 'pending' ? `0 0 8px ${dot.bg}66` : 'none',
                    zIndex: 1,
                  }}>
                    <span className="material-icons-round" style={{ fontSize: 11, color: step.status === 'pending' ? 'var(--text-muted)' : 'white' }}>
                      {step.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{
                    background: step.status === 'active'
                      ? 'var(--primary-dim)'
                      : step.status === 'done' ? 'rgba(0,255,136,0.05)' : 'rgba(0,0,0,0.15)',
                    border: `1px solid ${step.status === 'active' ? 'var(--border-primary)' : step.status === 'done' ? 'rgba(0,255,136,0.2)' : 'var(--border-light)'}`,
                    borderRadius: 'var(--r-sm)',
                    padding: '0.7rem 0.9rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{step.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.detail}</div>
                    </div>
                    <div style={{
                      flexShrink: 0, fontSize: '0.8rem', fontWeight: 800,
                      color: step.status === 'active' ? 'var(--primary)' : step.status === 'done' ? 'var(--status-low)' : 'var(--text-muted)',
                      fontFamily: 'Poppins',
                    }}>
                      +{step.duration}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!route && selected && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span className="material-icons-round" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: 'var(--primary)', opacity: 0.5 }}>
            route
          </span>
          Click "Plan My Route" to get your optimal journey
        </div>
      )}

      {!selected && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Select your seat section above to begin
        </div>
      )}
    </div>
  );
};
