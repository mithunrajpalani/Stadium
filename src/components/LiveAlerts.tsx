// LiveAlerts.tsx — Real-time alert feed generated from crowd simulation
import React, { useEffect, useState } from 'react';
import { crowdSim } from '../services/crowdSimulator';

interface Alert { id: string; message: string; severity: 'critical'|'warning'|'ok'; time: string; }

const iconFor = (sev: Alert['severity']) => ({
  critical: { icon: 'warning', color: 'var(--status-critical)' },
  warning:  { icon: 'info',    color: 'var(--accent)' },
  ok:       { icon: 'check_circle', color: 'var(--status-low)' },
}[sev]);

export const LiveAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 'init', message: 'All systems operational. Monitoring 16 zones.', severity: 'ok', time: 'now' }
  ]);

  useEffect(() => {
    let htPushed = false;
    const unsub = crowdSim.subscribe(state => {
      const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const fresh: Alert[] = [];

      state.zones.filter(z => z.status === 'critical').forEach(z => {
        fresh.push({ id: `crit-${z.id}`, severity: 'critical',
          message: `${z.name} at ${z.density}% capacity — avoid this area`, time: now });
      });
      state.zones.filter(z => z.status === 'high' && z.category !== 'parking').forEach(z => {
        fresh.push({ id: `high-${z.id}`, severity: 'warning',
          message: `${z.name} congested — ${z.waitTimeMin} min wait`, time: now });
      });
      if (state.matchMode === 'half-time') {
        fresh.push({ id: 'ht-rush', severity: 'warning',
          message: 'Halftime surge active — canteens & restrooms at peak', time: now });
      }
      if (state.matchMode === 'post-match') {
        fresh.push({ id: 'post-exit', severity: 'warning',
          message: 'Post-match crowd dispersal in progress — use alternate exits', time: now });
      }
      if (state.halftimeCountdownMin <= 5 && state.halftimeCountdownMin > 0 && !htPushed) {
        htPushed = true;
        fresh.push({ id: 'ht-warn', severity: 'warning',
          message: `Halftime in ${state.halftimeCountdownMin} min — order food now to skip the rush`, time: now });
      }
      if (fresh.length === 0) {
        fresh.push({ id: `ok-${Date.now()}`, severity: 'ok',
          message: 'All zones within normal parameters', time: now });
      }

      setAlerts(prev => {
        const combined = [...fresh, ...prev.filter(a => new Date().getTime() - new Date().setHours(
          parseInt(a.time.split(':')[0]), parseInt(a.time.split(':')[1])) < 120_000)];
        return combined.slice(0, 5);
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--status-critical)' }}>notifications_active</span>
          Live Alerts
        </h2>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-critical)',
          background: 'var(--status-critical-dim)', borderRadius: 'var(--r-full)',
          padding: '2px 8px', border: '1px solid rgba(255,46,76,0.3)',
          display: alerts.some(a => a.severity === 'critical') ? 'block' : 'none',
          animation: 'livePulse 1.5s infinite',
        }}>CRITICAL</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {alerts.map((a, i) => {
          const { icon, color } = iconFor(a.severity);
          return (
            <div key={a.id} style={{
              display: 'flex', gap: 10, padding: '0.7rem',
              background: a.severity === 'critical' ? 'rgba(255,46,76,0.07)'
                : a.severity === 'warning' ? 'rgba(255,184,0,0.07)' : 'rgba(0,255,136,0.05)',
              borderRadius: 'var(--r-sm)',
              borderLeft: `3px solid ${color}`,
              animation: `fadeSlideUp 0.3s ease ${i * 0.06}s both`,
            }}>
              <span className="material-icons-round" style={{ fontSize: 17, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{a.message}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
