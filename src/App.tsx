// App.tsx — StadiumIQ root layout
// Assembles all panels: Hero → Metrics → Main Grid (Dashboard + Sidebar) → Floating Chat
import './index.css';
import './App.css';

import React from 'react';
import { HeroBanner }          from './components/HeroBanner';
import { MetricsBar }          from './components/MetricsBar';
import { OccupancyDashboard }  from './components/OccupancyDashboard';
import { HeatmapCanvas }       from './components/HeatmapCanvas';
import { RecommendationCards } from './components/RecommendationCards';
import { JourneyPlanner }      from './components/JourneyPlanner';
import { LiveAlerts }          from './components/LiveAlerts';
import { ZoneCongestion }      from './components/ZoneCongestion';
import { EventSchedule }       from './components/EventSchedule';
import { GoogleMapsWidget }    from './components/GoogleMapsWidget';
import { ChatWidget }          from './components/ChatWidget';

function App() {
  return (
    <div className="page-wrap" id="app-root">

      {/* ── Hero Banner ── */}
      <HeroBanner />

      {/* ── Telemetry Strip ── */}
      <MetricsBar />

      {/* ── Main Two-Panel Grid ── */}
      <div className="main-grid">

        {/* ━━ Left Column: Dashboard ━━ */}
        <div>
          {/* Live crowd-flow heatmap */}
          <HeatmapCanvas />

          {/* Occupancy cards for all zone categories */}
          <OccupancyDashboard />

          {/* Smart recommendations engine */}
          <RecommendationCards />

          {/* Personal journey planner */}
          <JourneyPlanner />
        </div>

        {/* ━━ Right Sidebar ━━ */}
        <div className="sidebar-col">
          <LiveAlerts />
          <ZoneCongestion />
          <GoogleMapsWidget />
          <EventSchedule />
        </div>

      </div>

      {/* ── Floating Claude-Powered Chat Widget ── */}
      <ChatWidget />

      {/* ── Footer ── */}
      <footer style={{
        marginTop: '3rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary)' }}>stadium</span>
          <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem' }}>StadiumIQ</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-Powered Crowd Management</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-icons-round" style={{ fontSize: 13 }}>smart_toy</span>
            Powered by Claude AI
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-icons-round" style={{ fontSize: 13 }}>map</span>
            Google Maps
          </span>
          <span>© 2026 StadiumIQ</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
