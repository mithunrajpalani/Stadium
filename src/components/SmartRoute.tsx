import React, { useState } from 'react';
import { Route, Accessibility, ArrowRight, CornerUpRight, MapPin } from 'lucide-react';

export const SmartRoute: React.FC = () => {
  const [accessible, setAccessible] = useState(false);

  const stairsRoute = [
    { instruction: 'Head North from Sec 102', icon: <ArrowRight size={16} /> },
    { instruction: 'Take Stairwell B down', icon: <CornerUpRight size={16} /> },
    { instruction: 'Turn left at Concourse', icon: <ArrowRight size={16} /> },
    { instruction: 'Arrive at East Restrooms', icon: <MapPin size={16} /> }
  ];

  const liftRoute = [
    { instruction: 'Head South from Sec 102', icon: <ArrowRight size={16} /> },
    { instruction: 'Take Lift 4 to Level 1', icon: <Accessibility size={16} /> },
    { instruction: 'Follow blue path to East', icon: <ArrowRight size={16} /> },
    { instruction: 'Arrive at East Restrooms', icon: <MapPin size={16} /> }
  ];

  const activeRoute = accessible ? liftRoute : stairsRoute;

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Route /> Smart Routing
        </h2>
        <button 
          onClick={() => setAccessible(!accessible)}
          style={{
            background: accessible ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
            border: 'none', padding: '6px 12px', borderRadius: '16px', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem'
          }}
        >
          <Accessibility size={14} /> Lifts Only
        </button>
      </div>

      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-accent)', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Saves 4 minutes</span> compared to standard route due to congestion at Gate A.
      </div>

      <div style={{ flex: 1, position: 'relative', paddingLeft: '16px' }}>
        <div style={{ position: 'absolute', left: '23px', top: '10px', bottom: '20px', width: '2px', backgroundColor: 'var(--color-primary)', opacity: 0.5 }}></div>
        {activeRoute.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '1rem', position: 'relative' }}>
            <div style={{ 
              width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: '4px' 
            }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-bg-base)', borderRadius: '50%' }}></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>{step.icon}</div>
              <div>{step.instruction}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
