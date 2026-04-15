// HeatmapCanvas.tsx — SVG crowd-flow heatmap with animated density overlays
import React, { useEffect, useRef, useState } from 'react';
import { crowdSim, type ZoneData, type SimulationState } from '../services/crowdSimulator';

// Heatmap zone definitions with SVG positions (normalized 0-100 coordinate space)
const HEATMAP_ZONES: { id: string; cx: number; cy: number; r: number; label: string }[] = [
  // Parking (outer ring)
  { id: 'park-a', cx: 50,  cy: 5,  r: 9,  label: 'Park A' },
  { id: 'park-b', cx: 88,  cy: 22, r: 9,  label: 'Park B' },
  { id: 'park-c', cx: 12,  cy: 22, r: 9,  label: 'Park C' },
  { id: 'park-d', cx: 88,  cy: 75, r: 9,  label: 'Park D' },
  // Gates (mid ring)
  { id: 'gate-1', cx: 50,  cy: 14, r: 6,  label: 'G1' },
  { id: 'gate-2', cx: 70,  cy: 20, r: 6,  label: 'G2' },
  { id: 'gate-3', cx: 84,  cy: 42, r: 6,  label: 'G3' },
  { id: 'gate-4', cx: 84,  cy: 58, r: 6,  label: 'G4' },
  { id: 'gate-5', cx: 50,  cy: 86, r: 6,  label: 'G5' },
  { id: 'gate-6', cx: 16,  cy: 42, r: 6,  label: 'G6' },
  // Canteen (inside)
  { id: 'canteen-food',   cx: 28, cy: 38, r: 8, label: 'Food' },
  { id: 'canteen-bbq',    cx: 72, cy: 38, r: 8, label: 'BBQ'  },
  { id: 'canteen-drinks', cx: 50, cy: 72, r: 8, label: 'Bar'  },
  // Restrooms
  { id: 'rest-l1', cx: 30, cy: 60, r: 6,  label: 'WC L1' },
  { id: 'rest-l2', cx: 50, cy: 62, r: 6,  label: 'WC L2' },
  { id: 'rest-l3', cx: 70, cy: 60, r: 6,  label: 'WC L3' },
];

function densityToFill(density: number, status: string): string {
  if (status === 'critical') return `rgba(255,46,76,${0.3 + density / 250})`;
  if (status === 'high')     return `rgba(255,107,53,${0.25 + density / 320})`;
  if (status === 'moderate') return `rgba(255,184,0,${0.2 + density / 400})`;
  return `rgba(0,255,136,${0.15 + density / 500})`;
}

function densityToStroke(status: string): string {
  if (status === 'critical') return 'rgba(255,46,76,0.9)';
  if (status === 'high')     return 'rgba(255,107,53,0.8)';
  if (status === 'moderate') return 'rgba(255,184,0,0.7)';
  return 'rgba(0,255,136,0.6)';
}

export const HeatmapCanvas: React.FC = () => {
  const [state, setState] = useState<SimulationState>(crowdSim.getState());
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const unsub = crowdSim.subscribe(setState);
    return () => unsub();
  }, []);

  const zoneMap = new Map<string, ZoneData>(state.zones.map(z => [z.id, z]));

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span className="material-icons-round" style={{ fontSize: 22, color: 'var(--primary)' }}>
            blur_on
          </span>
          Crowd-Flow Heatmap
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'livePulse 1.2s infinite' }}/>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>REAL-TIME SYNC</span>
        </div>
      </div>

      {/* Hovered zone info panel */}
      {hovered && (() => {
        const z = zoneMap.get(hovered);
        if (!z) return null;
        return (
          <div style={{
            position: 'absolute', zIndex: 10, top: '1rem', right: '1rem',
            background: 'rgba(10,15,30,0.92)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '0.7rem 1rem',
            fontSize: '0.8rem', animation: 'fadeIn 0.2s ease',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{z.name}</div>
            <div style={{ color: densityToStroke(z.status) }}>{z.density}% density · {z.waitTimeMin} min wait</div>
            <div style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{z.status} · {z.trend}</div>
          </div>
        );
      })()}

      <div style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          style={{ width: '100%', height: 'auto', maxHeight: 340, display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ambient glow gradient defs */}
          <defs>
            <radialGradient id="stadiumGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0D1E40" stopOpacity="1"/>
              <stop offset="100%" stopColor="#0A0F1E" stopOpacity="1"/>
            </radialGradient>
            <filter id="blur-sm">
              <feGaussianBlur stdDeviation="0.8"/>
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width="100" height="100" fill="url(#stadiumGrad)" rx="2"/>

          {/* Stadium outer ellipse */}
          <ellipse cx="50" cy="50" rx="46" ry="44"
            fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" strokeDasharray="2 1"/>
          <ellipse cx="50" cy="50" rx="38" ry="36"
            fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="0.5"/>

          {/* Pitch */}
          <rect x="28" y="32" width="44" height="36" rx="1"
            fill="rgba(0,40,20,0.5)" stroke="rgba(0,255,136,0.3)" strokeWidth="0.5"/>
          <ellipse cx="50" cy="50" rx="8" ry="6"
            fill="none" stroke="rgba(0,255,136,0.2)" strokeWidth="0.4"/>
          <line x1="50" y1="32" x2="50" y2="68" stroke="rgba(0,255,136,0.2)" strokeWidth="0.3"/>
          {/* Goals */}
          <rect x="28" y="44" width="4" height="12" fill="none" stroke="rgba(0,255,136,0.3)" strokeWidth="0.4"/>
          <rect x="68" y="44" width="4" height="12" fill="none" stroke="rgba(0,255,136,0.3)" strokeWidth="0.4"/>

          {/* Flow lines between zones */}
          {HEATMAP_ZONES.filter(z => z.id.startsWith('gate')).map(gate => {
            const nearest = HEATMAP_ZONES.find(z =>
              (z.id.startsWith('canteen') || z.id.startsWith('rest')) &&
              Math.abs(z.cx - gate.cx) < 40 && Math.abs(z.cy - gate.cy) < 40
            );
            if (!nearest) return null;
            const zData = zoneMap.get(gate.id);
            if (!zData || zData.density < 40) return null;
            return (
              <line key={`flow-${gate.id}`}
                x1={gate.cx} y1={gate.cy} x2={nearest.cx} y2={nearest.cy}
                stroke={densityToStroke(zData.status)}
                strokeWidth="0.25"
                strokeDasharray="1 1"
                opacity={zData.density / 200}
              />
            );
          })}

          {/* Heatmap blobs (glow beneath the dots) */}
          {HEATMAP_ZONES.map(hz => {
            const z = zoneMap.get(hz.id);
            if (!z) return null;
            return (
              <circle key={`heat-${hz.id}`}
                cx={hz.cx} cy={hz.cy} r={hz.r * 2.5}
                fill={densityToFill(z.density, z.status)}
                filter="url(#blur-sm)"
                style={{ transition: 'all 1s ease' }}
              />
            );
          })}

          {/* Zone circles */}
          {HEATMAP_ZONES.map(hz => {
            const z = zoneMap.get(hz.id);
            if (!z) return null;
            const isHov = hovered === hz.id;
            const sc    = densityToStroke(z.status);
            return (
              <g key={hz.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(hz.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Pulse ring for critical zones */}
                {z.status === 'critical' && (
                  <circle cx={hz.cx} cy={hz.cy} r={hz.r + 2}
                    fill="none" stroke={sc} strokeWidth="0.5"
                    opacity="0.5"
                    style={{ animation: 'livePulse 1.5s infinite' }}
                  />
                )}
                {/* Main dot */}
                <circle cx={hz.cx} cy={hz.cy} r={isHov ? hz.r + 1 : hz.r}
                  fill={densityToFill(z.density, z.status)}
                  stroke={sc}
                  strokeWidth={isHov ? "0.8" : "0.5"}
                  filter="url(#glow)"
                  style={{ transition: 'all 0.4s ease' }}
                />
                {/* Density text */}
                <text cx={hz.cx} cy={hz.cy - 0.5}
                  fontSize={hz.r > 7 ? "2.8" : "2.2"}
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="700"
                  fontFamily="Inter, sans-serif"
                >
                  {z.density}%
                </text>
                {/* Label below */}
                <text cx={hz.cx} cy={hz.cy + hz.r + 2.5}
                  fontSize="2"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  {hz.label}
                </text>
              </g>
            );
          })}

          {/* User location marker */}
          <g>
            <circle cx="50" cy="50" r="2.5" fill="var(--primary)" opacity="0.9"/>
            <circle cx="50" cy="50" r="4"   fill="none" stroke="var(--primary)" strokeWidth="0.5"
              style={{ animation: 'pulseRing 2s infinite' }}/>
            <text cx="50" cy="46" fontSize="2" fill="var(--primary)" textAnchor="middle" fontWeight="700" fontFamily="Inter">YOU</text>
          </g>
        </svg>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: '1rem', justifyContent: 'center',
          marginTop: '0.75rem', flexWrap: 'wrap',
        }}>
          {[
            { color: 'var(--status-low)',      label: '● Parking' },
            { color: 'var(--primary)',          label: '● Gate' },
            { color: 'var(--accent)',           label: '● Canteen' },
            { color: '#C084FC',                 label: '● Restroom' },
          ].map(({ color, label }) => (
            <span key={label} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color }}>{label}</span>
            </span>
          ))}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>· Size = density · Hover for details</span>
        </div>
      </div>
    </div>
  );
};
