// MetricsBar.tsx — Live telemetry strip above the main dashboard
import React, { useEffect, useState } from 'react';
import { crowdSim, type VenueTelemetry } from '../services/crowdSimulator';

interface Metric { icon: string; label: string; value: string; sub?: string; color?: string; pulse?: boolean; }

export const MetricsBar: React.FC = () => {
  const [tel, setTel] = useState<VenueTelemetry>(crowdSim.getState().telemetry);

  useEffect(() => {
    const unsub = crowdSim.subscribe(s => setTel(s.telemetry));
    return () => unsub();
  }, []);

  const capColor =
    tel.capacityPercent > 85 ? 'var(--status-critical)' :
    tel.capacityPercent > 70 ? 'var(--status-high)' :
    tel.capacityPercent > 50 ? 'var(--status-mid)' :
    'var(--status-low)';

  const waitColor =
    tel.averageWaitTime > 20 ? 'var(--status-critical)' :
    tel.averageWaitTime > 12 ? 'var(--status-high)' :
    tel.averageWaitTime > 6  ? 'var(--status-mid)' :
    'var(--status-low)';

  const metrics: Metric[] = [
    {
      icon: 'groups',
      label: 'Attendees',
      value: tel.totalAttendees.toLocaleString(),
      color: 'var(--primary)',
    },
    {
      icon: 'speed',
      label: 'Capacity',
      value: `${tel.capacityPercent}%`,
      color: capColor,
      pulse: tel.capacityPercent > 85,
    },
    {
      icon: 'schedule',
      label: 'Avg Wait',
      value: `${tel.averageWaitTime}`,
      sub: 'min',
      color: waitColor,
    },
    {
      icon: 'trending_down',
      label: 'Flow Out',
      value: `${tel.exitsPerMin}`,
      sub: '/min',
      color: 'var(--primary)',
    },
    {
      icon: 'shield_check',
      label: 'Staff Ready',
      value: `${tel.staffReadiness}%`,
      color: 'var(--status-low)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      {metrics.map((m, i) => (
        <div key={i} className="glass-card" style={{
          padding: '1rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: `fadeSlideUp 0.4s ease ${i * 0.07}s both`,
          borderColor: m.pulse ? m.color + '44' : undefined,
          boxShadow: m.pulse ? `0 0 20px ${m.color}22` : undefined,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r-sm)',
            background: `${m.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            animation: m.pulse ? 'pulseRing 2s infinite' : undefined,
          }}>
            <span className="material-icons-round" style={{ fontSize: 20, color: m.color }}>{m.icon}</span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {m.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: m.color, fontFamily: 'Poppins', lineHeight: 1, transition: 'color 0.5s' }}>
                {m.value}
              </span>
              {m.sub && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.sub}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
