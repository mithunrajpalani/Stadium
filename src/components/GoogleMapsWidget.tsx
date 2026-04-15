// GoogleMapsWidget.tsx — Google Maps iframe embed showing stadium + parking zones
import React from 'react';

// Using the legacy Google Maps embed format (no API key required for basic embeds)
const MAP_EMBED_URL =
  'https://maps.google.com/maps?q=Wembley+Stadium,+London,+UK&hl=en&t=k&z=15&ie=UTF8&iwloc=B&output=embed';

export const GoogleMapsWidget: React.FC = () => {
  return (
    <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--status-low)' }}>
            map
          </span>
          Venue Map
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['🅿️ Parking', '🚪 Gates', '📍 You'].map(label => (
            <span key={label} style={{
              fontSize: '0.68rem', color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              padding: '2px 8px', borderRadius: 'var(--r-full)',
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
        height: 240,
      }}>
        <iframe
          id="venue-google-map"
          title="Stadium Venue Map"
          src={MAP_EMBED_URL}
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block', filter: 'saturate(0.7) brightness(0.9)' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        {/* Overlay badge */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          padding: '4px 10px',
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--primary)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'livePulse 1.2s infinite' }}/>
          Live Tracking
        </div>
      </div>
    </div>
  );
};
