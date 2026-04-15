// =============================================================
// crowdSimulator.ts — Simulates real-time venue crowd data
// Covers: Parking (A-D), Gates (1-6), Canteen, Restrooms
// Supports match modes: pre-match | live | half-time | post-match
// =============================================================

export type ZoneCategory = 'parking' | 'gate' | 'canteen' | 'restroom';
export type ZoneStatus   = 'low' | 'moderate' | 'high' | 'critical';
export type MatchMode    = 'pre-match' | 'live' | 'half-time' | 'post-match';

export interface ZoneData {
  id: string;
  name: string;
  category: ZoneCategory;
  density: number;       // 0–100
  status: ZoneStatus;
  trend: 'increasing' | 'decreasing' | 'stable';
  waitTimeMin: number;
  capacity: number;      // total capacity units
  occupied: number;
  isOpen: boolean;
}

export interface VenueTelemetry {
  capacityPercent: number;
  averageWaitTime: number;
  exitsPerMin: number;
  staffReadiness: number;
  totalAttendees: number;
  alertCount: number;
}

export interface SimulationState {
  zones: ZoneData[];
  telemetry: VenueTelemetry;
  matchMode: MatchMode;
  eventName: string;
  halftimeCountdownMin: number;
  eventTime: string;
}

// Baseline density patterns per match mode
const MODE_BASELINE: Record<MatchMode, Record<ZoneCategory, number>> = {
  'pre-match':  { parking: 60, gate: 80, canteen: 30, restroom: 20 },
  'live':       { parking: 95, gate: 20, canteen: 40, restroom: 50 },
  'half-time':  { parking: 98, gate: 10, canteen: 95, restroom: 90 },
  'post-match': { parking: 80, gate: 85, canteen: 20, restroom: 35 },
};

const INITIAL_ZONES: Omit<ZoneData, 'status' | 'trend' | 'waitTimeMin' | 'occupied'>[] = [
  // --- PARKING ---
  { id: 'park-a', name: 'Parking Zone A', category: 'parking', density: 72, capacity: 500, isOpen: true },
  { id: 'park-b', name: 'Parking Zone B', category: 'parking', density: 45, capacity: 500, isOpen: true },
  { id: 'park-c', name: 'Parking Zone C', category: 'parking', density: 88, capacity: 400, isOpen: true },
  { id: 'park-d', name: 'Parking Zone D', category: 'parking', density: 30, capacity: 300, isOpen: true },
  // --- GATES ---
  { id: 'gate-1', name: 'Gate 1 — North', category: 'gate', density: 85, capacity: 200, isOpen: true },
  { id: 'gate-2', name: 'Gate 2 — North', category: 'gate', density: 30, capacity: 200, isOpen: true },
  { id: 'gate-3', name: 'Gate 3 — East',  category: 'gate', density: 60, capacity: 200, isOpen: true },
  { id: 'gate-4', name: 'Gate 4 — East',  category: 'gate', density: 20, capacity: 200, isOpen: true },
  { id: 'gate-5', name: 'Gate 5 — South', category: 'gate', density: 75, capacity: 200, isOpen: true },
  { id: 'gate-6', name: 'Gate 6 — West',  category: 'gate', density: 40, capacity: 200, isOpen: false },
  // --- CANTEEN ---
  { id: 'canteen-food',  name: 'Food Court',   category: 'canteen', density: 55, capacity: 300, isOpen: true },
  { id: 'canteen-bbq',   name: 'BBQ Zone',     category: 'canteen', density: 70, capacity: 150, isOpen: true },
  { id: 'canteen-drinks',name: 'Beverages Bar', category: 'canteen', density: 40, capacity: 200, isOpen: true },
  // --- RESTROOMS ---
  { id: 'rest-l1', name: 'Restrooms L1', category: 'restroom', density: 45, capacity: 80, isOpen: true },
  { id: 'rest-l2', name: 'Restrooms L2', category: 'restroom', density: 70, capacity: 80, isOpen: true },
  { id: 'rest-l3', name: 'Restrooms L3', category: 'restroom', density: 25, capacity: 80, isOpen: true },
];

function deriveStatus(density: number): ZoneStatus {
  if (density >= 90) return 'critical';
  if (density >= 70) return 'high';
  if (density >= 40) return 'moderate';
  return 'low';
}

function deriveWait(zone: ZoneData): number {
  if (!zone.isOpen) return 999;
  if (zone.category === 'parking') return Math.floor((zone.density / 100) * 20);
  if (zone.category === 'gate')    return Math.floor((zone.density / 100) * 15);
  if (zone.category === 'canteen') return Math.floor((zone.density / 100) * 40);
  if (zone.category === 'restroom')return Math.floor((zone.density / 100) * 12);
  return 0;
}

class CrowdSimulator {
  private listeners: ((state: SimulationState) => void)[] = [];
  private zones: ZoneData[];
  private matchMode: MatchMode = 'live';
  private halftimeCountdownMin = 22;
  private telemetry: VenueTelemetry;
  private ticker: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Build initial zone data with derived fields
    this.zones = INITIAL_ZONES.map(z => {
      const base = { ...z, status: deriveStatus(z.density), trend: 'stable' as const, waitTimeMin: 0, occupied: Math.floor(z.density / 100 * z.capacity) };
      return { ...base, waitTimeMin: deriveWait(base) };
    });
    this.telemetry = this.computeTelemetry();
    // Tick every 3 seconds for smooth real-time feel
    this.ticker = setInterval(() => this.simulateTick(), 3000);
  }

  // ---- Core simulation logic ----
  private simulateTick() {
    const modeBase = MODE_BASELINE[this.matchMode];

    this.zones = this.zones.map(zone => {
      if (!zone.isOpen) return zone;

      const base = modeBase[zone.category];
      // Fluctuate ±8%, biased toward baseline
      const pull   = (base - zone.density) * 0.08; // gentle pull toward baseline
      const noise  = (Math.random() * 16) - 8;
      const newDensity = Math.max(0, Math.min(100, zone.density + pull + noise));

      const prevDensity = zone.density;
      const trend: ZoneData['trend'] =
        newDensity > prevDensity + 2 ? 'increasing' :
        newDensity < prevDensity - 2 ? 'decreasing' : 'stable';

      const updated: ZoneData = {
        ...zone,
        density: Math.round(newDensity),
        status: deriveStatus(newDensity),
        trend,
        occupied: Math.floor(newDensity / 100 * zone.capacity),
      };
      updated.waitTimeMin = deriveWait(updated);
      return updated;
    });

    // Countdown halftime
    if (this.matchMode === 'live') {
      this.halftimeCountdownMin = Math.max(0, this.halftimeCountdownMin - (3 / 60));
    }

    this.telemetry = this.computeTelemetry();
    this.notifyListeners();
  }

  private computeTelemetry(): VenueTelemetry {
    const openZones = this.zones.filter(z => z.isOpen);
    const avgDensity = openZones.reduce((s, z) => s + z.density, 0) / (openZones.length || 1);
    const avgWait    = openZones.reduce((s, z) => s + z.waitTimeMin, 0) / (openZones.length || 1);
    const critical   = this.zones.filter(z => z.status === 'critical' || z.status === 'high');
    return {
      capacityPercent: Math.round(avgDensity),
      averageWaitTime: Math.round(avgWait),
      exitsPerMin: Math.floor(30 + Math.random() * 30),
      staffReadiness: Math.max(88, Math.min(100, 95 + Math.floor(Math.random() * 6) - 3)),
      totalAttendees: 52_400 + Math.floor(Math.random() * 200 - 100),
      alertCount: critical.length,
    };
  }

  private notifyListeners() {
    const state = this.buildState();
    this.listeners.forEach(fn => fn(state));
  }

  private buildState(): SimulationState {
    return {
      zones: this.zones,
      telemetry: this.telemetry,
      matchMode: this.matchMode,
      eventName: 'City FC vs United FC — Premier League',
      halftimeCountdownMin: Math.floor(this.halftimeCountdownMin),
      eventTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // ---- Public API ----
  public subscribe(callback: (state: SimulationState) => void): () => void {
    this.listeners.push(callback);
    callback(this.buildState()); // Immediate initial push
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  public getState(): SimulationState {
    return this.buildState();
  }

  public setMatchMode(mode: MatchMode) {
    this.matchMode = mode;
    if (mode === 'live') this.halftimeCountdownMin = 22;
    // Immediate notification so UI snaps to new mode
    this.notifyListeners();
  }

  public getMatchMode(): MatchMode {
    return this.matchMode;
  }

  /** Build a formatted text summary of venue state for AI context injection */
  public getVenueContextString(): string {
    const s = this.buildState();
    const fmt = (z: ZoneData) =>
      `  • ${z.name}: ${z.density}% density, ${z.status} status, ${z.waitTimeMin === 999 ? 'CLOSED' : z.waitTimeMin + ' min wait'}, trend ${z.trend}`;

    const parking  = s.zones.filter(z => z.category === 'parking').map(fmt).join('\n');
    const gates    = s.zones.filter(z => z.category === 'gate').map(fmt).join('\n');
    const canteen  = s.zones.filter(z => z.category === 'canteen').map(fmt).join('\n');
    const restrooms= s.zones.filter(z => z.category === 'restroom').map(fmt).join('\n');

    return `
EVENT: ${s.eventName}
MATCH MODE: ${s.matchMode.toUpperCase()}
CURRENT TIME: ${s.eventTime}
HALFTIME COUNTDOWN: ${s.halftimeCountdownMin} minutes

VENUE TELEMETRY:
  Overall Capacity: ${s.telemetry.capacityPercent}%
  Average Wait Time: ${s.telemetry.averageWaitTime} min
  Total Attendees: ${s.telemetry.totalAttendees.toLocaleString()}
  Staff Readiness: ${s.telemetry.staffReadiness}%
  Active Alerts: ${s.telemetry.alertCount}

PARKING ZONES:
${parking}

ENTRY GATES:
${gates}

CANTEEN / FOOD:
${canteen}

RESTROOMS:
${restrooms}
`.trim();
  }
}

// Singleton instance shared across components
export const crowdSim = new CrowdSimulator();
