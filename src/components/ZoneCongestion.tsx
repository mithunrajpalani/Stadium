// ZoneCongestion.tsx — Density bars sorted by congestion level
import React, { useEffect, useState } from 'react';
import { crowdSim, type ZoneData } from '../services/crowdSimulator';

const catIcon: Record<string, string> = {
  parking: 'local_parking', gate: 'door_front', canteen: 'fastfood', restroom: 'wc'
};

export const ZoneCongestion: React.FC = () => {
  const [zones, setZones] = useState<ZoneData[]>([]);

  useEffect(() => {
    const unsub = crowdSim.subscribe(s =>
      setZones([...s.zones].filter(z => z.isOpen).sort((a, b) => b.density - a.density).slice(0, 10))
    );
    return () => unsub();
  }, []);

  const barColor = (d: number) =>
    d >= 90 ? 'linear-gradient(to right, #FF2E4C, #CC0022)'
    : d >= 70 ? 'linear-gradient(to right, #FF6B35, #E05000)'
    : d >= 40 ? 'linear-gradient(to right, #FFB800, #E09000)'
    : 'linear-gradient(to right, #00FF88, #00CC66)';

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, marginBottom: '1rem' }}>
        <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary)' }}>bar_chart</span>
        Zone Density
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {zones.map((z, i) => (
          <div key={z.id} style={{ animation: `fadeSlideUp 0.3s ease ${i * 0.05}s both` }}>
            <div className="flex-between" style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span className="material-icons-round" style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {catIcon[z.category] ?? 'place'}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {z.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {z.waitTimeMin > 0 ? `${z.waitTimeMin}m` : '—'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'Poppins',
                  color: z.density >= 90 ? 'var(--status-critical)' : z.density >= 70 ? 'var(--status-high)' : z.density >= 40 ? 'var(--status-mid)' : 'var(--status-low)',
                }}>
                  {z.density}%
                </span>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${z.density}%`, background: barColor(z.density) }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
