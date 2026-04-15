import React from 'react';
import { VenueMap } from './VenueMap';
import { Concessions } from './Concessions';
import { EventSchedule } from './EventSchedule';
import { Ticket } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto', paddingRight: '0.5rem' }}>
      
      {/* Header Profile / Ticket info */}
      <div className="flex-between">
        <div>
          <h1 style={{ background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StadiumIQ
          </h1>
          <p className="text-muted text-sm">Welcome back, Alex. Sec 102, Row G.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Ticket size={20} color="var(--color-primary)" />
          <span style={{ fontWeight: 600 }}>VIP Pass</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
         <VenueMap />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
         <Concessions />
         <EventSchedule />
      </div>

    </div>
  );
};
