// OccupancyDashboard.tsx — Real-time occupancy cards for all categories
import React, { useEffect, useState } from 'react';
import { crowdSim, type ZoneData, type ZoneCategory } from '../services/crowdSimulator';

const CATEGORY_META: Record<ZoneCategory, { icon: string; label: string; color: string }> = {
  parking:  { icon: 'local_parking', label: 'Parking Zones',  color: '#7B8EFF' },
  gate:     { icon: 'door_front',    label: 'Entry Gates',    color: 'var(--primary)' },
  canteen:  { icon: 'fastfood',      label: 'Canteen Stations', color: 'var(--accent)' },
  restroom: { icon: 'wc',            label: 'Restrooms',      color: '#C084FC' },
};

const statusColor = (s: string) => {
  if (s === 'critical') return 'var(--status-critical)';
  if (s === 'high')     return 'var(--status-high)';
  if (s === 'moderate') return 'var(--status-mid)';
  return 'var(--status-low)';
};

const statusBg = (s: string) => {
  if (s === 'critical') return 'var(--status-critical-dim)';
  if (s === 'high')     return 'var(--status-high-dim)';
  if (s === 'moderate') return 'var(--status-mid-dim)';
  return 'var(--status-low-dim)';
};

const trendIcon = (t: string) =>
  t === 'increasing' ? 'trending_up' :
  t === 'decreasing' ? 'trending_down' : 'trending_flat';

const trendColor = (t: string) =>
  t === 'increasing' ? 'var(--status-critical)' :
  t === 'decreasing' ? 'var(--status-low)' :
  'var(--text-muted)';

interface ZoneCardProps { zone: ZoneData; catColor: string; }

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, catColor }) => {
  const sc = statusColor(zone.status);
  const wait = zone.waitTimeMin === 999 ? null : zone.waitTimeMin;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 'var(--r-md)',
      padding: '0.85rem',
      border: `1px solid ${zone.status === 'critical' ? 'rgba(255,46,76,0.3)' : zone.status === 'high' ? 'rgba(255,107,53,0.2)' : 'var(--border-light)'}`,
      transition: 'all 0.4s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Critical pulse ring on background */}
      {zone.status === 'critical' && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--r-md)',
          background: 'radial-gradient(circle at center, rgba(255,46,76,0.08) 0%, transparent 70%)',
          animation: 'livePulse 1.5s infinite',
          pointerEvents: 'none',
        }}/>
      )}

      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {zone.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {!zone.isOpen && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)' }}>CLOSED</span>
          )}
          <span className="material-icons-round" style={{ fontSize: 15, color: trendColor(zone.trend) }}>
            {trendIcon(zone.trend)}
          </span>
        </div>
      </div>

      {/* Density meter */}
      <div style={{ marginBottom: '0.45rem' }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${zone.density}%`, background: `linear-gradient(to right, ${catColor}, ${sc})` }}/>
        </div>
      </div>

      <div className="flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Poppins', color: sc, lineHeight: 1,
            transition: 'color 0.5s',
          }}>
            {zone.density}%
          </span>
          <span className={`badge badge-${zone.status === 'moderate' ? 'mid' : zone.status === 'low' ? 'low' : zone.status}`}
            style={{ fontSize: '0.6rem' }}>
            {zone.status}
          </span>
        </div>

        {wait !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.75rem', color: wait > 15 ? 'var(--status-critical)' : wait > 8 ? 'var(--status-mid)' : 'var(--text-secondary)',
            fontWeight: 600,
          }}>
            <span className="material-icons-round" style={{ fontSize: 13 }}>schedule</span>
            {wait} min
          </div>
        )}
      </div>
    </div>
  );
};

export const OccupancyDashboard: React.FC = () => {
  const [zones, setZones] = useState<ZoneData[]>([]);

  useEffect(() => {
    const unsub = crowdSim.subscribe(s => setZones(s.zones));
    return () => unsub();
  }, []);

  const categories: ZoneCategory[] = ['parking', 'gate', 'canteen', 'restroom'];

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span className="material-icons-round" style={{ fontSize: 22, color: 'var(--primary)' }}>dashboard</span>
          Live Occupancy
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-low)', display: 'inline-block' }}/>Low
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-mid)', display: 'inline-block' }}/>Moderate
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-high)', display: 'inline-block' }}/>High
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-critical)', display: 'inline-block', animation: 'livePulse 1.2s infinite' }}/>Critical
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        {categories.map(cat => {
          const meta   = CATEGORY_META[cat];
          const catZones = zones.filter(z => z.category === cat);
          const avgDensity = catZones.length
            ? Math.round(catZones.reduce((s, z) => s + z.density, 0) / catZones.length)
            : 0;
          const worst = catZones.reduce((a, b) => (b.density > a.density ? b : a), catZones[0]);

          return (
            <div key={cat}>
              {/* Category header */}
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-icons-round" style={{ fontSize: 17, color: meta.color }}>{meta.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{meta.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg {avgDensity}% · {catZones.length} zones</div>
                  </div>
                </div>
                {worst && worst.status === 'critical' && (
                  <span style={{
                    fontSize: '0.65rem', color: 'var(--status-critical)',
                    background: 'var(--status-critical-dim)', padding: '2px 8px',
                    borderRadius: 'var(--r-full)', border: '1px solid rgba(255,46,76,0.3)',
                    fontWeight: 700, animation: 'livePulse 1.5s infinite',
                  }}>
                    ⚠ ALERT
                  </span>
                )}
              </div>

              {/* Zone cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: cat === 'gate' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '0.6rem' }}>
                {catZones.map(zone => (
                  <ZoneCard key={zone.id} zone={zone} catColor={meta.color} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
