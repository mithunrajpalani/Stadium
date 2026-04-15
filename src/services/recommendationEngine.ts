// =============================================================
// recommendationEngine.ts — Auto-surfaces smart suggestions
// Updates every 30 seconds with context-aware recommendations.
// =============================================================

import { type SimulationState, type ZoneData } from './crowdSimulator';

export type RecommendationSeverity = 'info' | 'tip' | 'warning' | 'urgent';

export interface Recommendation {
  id: string;
  icon: string;          // Material Icon name
  title: string;
  body: string;
  severity: RecommendationSeverity;
  category: string;
  ctaLabel?: string;
  updatedAt: Date;
}

/** Generate context-aware recommendations from current simulation state */
export function generateRecommendations(state: SimulationState): Recommendation[] {
  const recs: Recommendation[] = [];
  const { zones, telemetry, matchMode, halftimeCountdownMin } = state;

  const byCategory = (cat: string) => zones.filter(z => z.category === cat);
  const bestZone   = (list: ZoneData[]) => [...list].filter(z => z.isOpen).sort((a, b) => a.density - b.density)[0];
  const worstZone  = (list: ZoneData[]) => [...list].filter(z => z.isOpen).sort((a, b) => b.density - a.density)[0];

  // ---- PARKING ----
  const parkZones = byCategory('parking');
  const bestPark  = bestZone(parkZones);
  const worstPark = worstZone(parkZones);
  if (bestPark && worstPark && bestPark.id !== worstPark.id && worstPark.density > 80) {
    recs.push({
      id: 'park-swap',
      icon: 'local_parking',
      title: `Switch to ${bestPark.name}`,
      body: `${worstPark.name} is ${worstPark.density}% full. ${bestPark.name} has only ${bestPark.density}% occupancy — save up to ${worstPark.waitTimeMin - bestPark.waitTimeMin} minutes.`,
      severity: worstPark.density > 90 ? 'urgent' : 'warning',
      category: 'Parking',
      ctaLabel: 'Navigate',
      updatedAt: new Date(),
    });
  }

  // ---- GATES ----
  const gateZones = byCategory('gate');
  const bestGate  = bestZone(gateZones);
  const worstGate = worstZone(gateZones);
  if (bestGate && worstGate && worstGate.density > 70) {
    recs.push({
      id: 'gate-switch',
      icon: 'door_front',
      title: `${bestGate.name} is clear`,
      body: `${worstGate.name} has a ${worstGate.waitTimeMin} min queue. Head to ${bestGate.name} (${bestGate.density}% density, ~${bestGate.waitTimeMin} min wait) instead.`,
      severity: worstGate.density > 85 ? 'urgent' : 'tip',
      category: 'Entry Gates',
      ctaLabel: 'Show Route',
      updatedAt: new Date(),
    });
  } else if (bestGate && bestGate.density < 30) {
    recs.push({
      id: 'gate-clear',
      icon: 'check_circle',
      title: `${bestGate.name} almost empty`,
      body: `Walk right in — ${bestGate.density}% density with no significant wait.`,
      severity: 'info',
      category: 'Entry Gates',
      updatedAt: new Date(),
    });
  }

  // ---- CANTEEN ----
  const canteenZones = byCategory('canteen');
  const bestCanteen  = bestZone(canteenZones);
  if (matchMode === 'half-time') {
    const worstC = worstZone(canteenZones);
    recs.push({
      id: 'ht-food',
      icon: 'fastfood',
      title: 'Halftime rush — order ahead!',
      body: `${worstC?.name ?? 'Food Court'} is ${worstC?.density ?? 95}% full. Try ${bestCanteen?.name ?? 'Beverages Bar'} (${bestCanteen?.density ?? 50}% capacity, ${bestCanteen?.waitTimeMin ?? 8} min wait) for the fastest service.`,
      severity: 'urgent',
      category: 'Canteen',
      ctaLabel: 'Order Now',
      updatedAt: new Date(),
    });
  } else if (bestCanteen && bestCanteen.density < 40) {
    recs.push({
      id: 'food-clear',
      icon: 'restaurant',
      title: `${bestCanteen.name} — quick grab!`,
      body: `Only ${bestCanteen.density}% capacity with a ${bestCanteen.waitTimeMin} min wait. Perfect time to beat the rush.`,
      severity: 'tip',
      category: 'Canteen',
      updatedAt: new Date(),
    });
  }

  // ---- RESTROOMS ----
  const restrooms  = byCategory('restroom');
  const bestRest   = bestZone(restrooms);
  const worstRest  = worstZone(restrooms);
  if (bestRest && worstRest && worstRest.density > 65) {
    recs.push({
      id: 'rest-alt',
      icon: 'wc',
      title: `${bestRest.name} is your best bet`,
      body: `${worstRest.name} is ${worstRest.density}% full (${worstRest.waitTimeMin} min wait). ${bestRest.name} is at only ${bestRest.density}% — no real queue.`,
      severity: worstRest.density > 85 ? 'warning' : 'info',
      category: 'Restrooms',
      ctaLabel: 'Get Directions',
      updatedAt: new Date(),
    });
  }

  // ---- HALFTIME COUNTDOWN ----
  if (matchMode === 'live' && halftimeCountdownMin <= 8 && halftimeCountdownMin > 0) {
    recs.push({
      id: 'ht-countdown',
      icon: 'timer',
      title: `Halftime in ${halftimeCountdownMin} min — plan ahead`,
      body: 'Expect surges at canteens and restrooms. Pre-order food now or head to a less popular station early.',
      severity: halftimeCountdownMin <= 3 ? 'urgent' : 'warning',
      category: 'Event Alert',
      ctaLabel: 'Order Food',
      updatedAt: new Date(),
    });
  }

  // ---- OVERALL CAPACITY ----
  if (telemetry.capacityPercent > 85) {
    recs.push({
      id: 'overcap',
      icon: 'groups',
      title: 'Venue nearing capacity',
      body: `Overall fill rate is ${telemetry.capacityPercent}%. Avg wait times elevated to ${telemetry.averageWaitTime} min. Consider staying seated during busy periods.`,
      severity: 'warning',
      category: 'Venue Status',
      updatedAt: new Date(),
    });
  }

  // ---- POST MATCH ----
  if (matchMode === 'post-match') {
    const exitGate = bestZone(gateZones);
    recs.push({
      id: 'post-exit',
      icon: 'exit_to_app',
      title: `Fastest exit: ${exitGate?.name ?? 'Gate 4 — East'}`,
      body: `Head to ${exitGate?.name ?? 'Gate 4 — East'} now — only ${exitGate?.density ?? 30}% occupancy. Avoid main gates for the next 20 minutes.`,
      severity: 'tip',
      category: 'Post-Match',
      ctaLabel: 'Navigate Exit',
      updatedAt: new Date(),
    });
  }

  // Cap at 4 recommendations, prioritize by severity
  const severityOrder: Record<RecommendationSeverity, number> = { urgent: 0, warning: 1, tip: 2, info: 3 };
  return recs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 4);
}
