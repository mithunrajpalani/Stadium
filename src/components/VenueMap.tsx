import React, { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { crowdSim, type ZoneData } from '../services/crowdSimulator';

export const VenueMap: React.FC = () => {
  const [zones, setZones] = useState<ZoneData[]>([]);

  useEffect(() => {
    // Subscribe to simulated Pub/Sub stream
    const unsubscribe = crowdSim.subscribe((state) => {
      setZones(state.zones);
    });
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'rgba(16, 185, 129, 0.6)'; // Green
      case 'moderate': return 'rgba(245, 158, 11, 0.6)'; // Yellow
      case 'high': return 'rgba(239, 68, 68, 0.6)'; // Red
      case 'critical': return 'rgba(220, 38, 38, 0.9)'; // Dark Red
      default: return 'rgba(255,255,255,0.2)';
    }
  };

  return (
    <div className="glass-panel" style={{ position: 'relative', height: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2><MapPin /> Venue Map</h2>
        <span className="text-sm text-muted animate-pulse-glow" style={{ padding: '4px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
          Real-time Sync Active
        </span>
      </div>

      <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 'var(--border-radius-md)', position: 'relative' }}>
        {/* Mock Stadium Outline */}
        <div style={{
           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
           width: '80%', height: '70%', border: '4px solid rgba(255,255,255,0.1)', borderRadius: '50% 50% 20% 20%',
        }}></div>
        <div style={{
           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
           width: '40%', height: '30%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', 
           display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span className="text-muted">Pitch / Field</span>
        </div>

        {/* Dynamic Heatmap Nodes */}
        {zones.map((zone, i) => {
          // Hardcoded positions for visual mockup
          const positions = [
            { top: '10%', left: '50%' },
            { top: '40%', left: '15%' },
            { top: '40%', left: '85%' },
            { top: '80%', left: '30%' },
            { top: '80%', left: '70%' },
          ];
          const pos = positions[i % positions.length];

          return (
            <div key={zone.id} style={{
              position: 'absolute',
              ...pos,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: getStatusColor(zone.status),
                boxShadow: `0 0 15px ${getStatusColor(zone.status)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.5s ease'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{zone.density}%</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                {zone.name}
              </div>
            </div>
          );
        })}

        {/* User Location Marker */}
        <div style={{ position: 'absolute', top: '65%', left: '45%', color: 'var(--color-primary)' }}>
          <Navigation className="animate-float" size={24} fill="currentColor" />
        </div>
      </div>
    </div>
  );
};
