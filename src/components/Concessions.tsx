import React, { useState, useEffect } from 'react';
import { CreditCard, Coffee, Pizza, Leaf, Zap, MapPin } from 'lucide-react';
import { crowdSim } from '../services/crowdSimulator';

interface Stall {
  id: string;
  name: string;
  zoneId: string;
  items: string;
  price: string;
  plantBased: boolean;
  distanceWeight: number; // 0 to 1 scale (1 is closest)
  icon: React.ReactNode;
}

const mockStalls: Stall[] = [
  { id: '1', name: 'North End Eats', zoneId: 'concession-north', items: 'Hot Dogs & Beer', price: '$12', plantBased: false, distanceWeight: 0.3, icon: <Pizza /> },
  { id: '2', name: 'South Grill', zoneId: 'concession-south', items: 'Burgers & Fries', price: '$15', plantBased: false, distanceWeight: 0.8, icon: <Pizza /> },
  { id: '3', name: 'Green Bowl', zoneId: 'concession-south', items: 'Salads & Wraps', price: '$14', plantBased: true, distanceWeight: 0.6, icon: <Leaf /> },
  { id: '4', name: 'Gate A Snacks', zoneId: 'gate-a', items: 'Pretzels & Soda', price: '$8', plantBased: true, distanceWeight: 0.9, icon: <Coffee /> },
];

export const Concessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'near' | 'quick' | 'plant'>('quick');
  const [waitTimes, setWaitTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = crowdSim.subscribe((state) => {
      const times: Record<string, number> = {};
      state.zones.forEach(z => { times[z.id] = z.waitTimeMin; });
      setWaitTimes(times);
    });
    return () => unsubscribe();
  }, []);

  // Scoring logic: (1/wait_time) * distance_weight * preference_match
  const getRankedStalls = () => {
    return mockStalls.map(stall => {
      const waitTime = Math.max(1, waitTimes[stall.zoneId] || 5); // Avoid division by 0
      let preferenceMatch = 1;
      
      if (activeTab === 'plant' && !stall.plantBased) preferenceMatch = 0;
      if (activeTab === 'near') {
        // Distance is heavily weighted
        preferenceMatch = stall.distanceWeight > 0.5 ? 1.5 : 0.5;
      }
      
      const score = (1 / waitTime) * stall.distanceWeight * preferenceMatch;
      return { ...stall, waitTime, score };
    })
    .filter(stall => stall.score > 0) // Remove non-matches
    .sort((a, b) => b.score - a.score); // Highest score first
  };

  const rankedStalls = getRankedStalls();

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Coffee /> Concessions
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('near')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'near' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <MapPin size={14} /> Near Me
        </button>
        <button 
          onClick={() => setActiveTab('quick')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'quick' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Zap size={14} /> Quickest
        </button>
        <button 
          onClick={() => setActiveTab('plant')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'plant' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Leaf size={14} /> Plant-based
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '8px' }}>
        {rankedStalls.map(stall => (
          <div key={stall.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: stall.plantBased ? 'var(--color-accent)' : 'var(--color-warning)' }}>
                        {stall.icon}
                      </div>
                      <div>
                         <div style={{ fontWeight: 600 }}>{stall.name}</div>
                         <div className="text-sm text-muted">{stall.items}</div>
                      </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{stall.price}</div>
              </div>
              <div className="flex-between" style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                 <div style={{ fontSize: '0.8rem', color: stall.waitTime > 15 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                    Wait: {stall.waitTime} mins
                 </div>
                 <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#000', backgroundImage: 'none', border: '1px solid #333' }}>
                    <CreditCard size={14} /> Order
                 </button>
              </div>
          </div>
        ))}
        {rankedStalls.length === 0 && (
          <div className="text-muted text-center" style={{ marginTop: '2rem' }}>No matching stalls found.</div>
        )}
      </div>
    </div>
  );
};
