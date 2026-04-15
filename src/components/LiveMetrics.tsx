import React, { useEffect, useState } from 'react';
import { Users, Clock, LogOut, ShieldCheck } from 'lucide-react';
import { crowdSim, type VenueTelemetry } from '../services/crowdSimulator';

export const LiveMetrics: React.FC = () => {
  const [telemetry, setTelemetry] = useState<VenueTelemetry | null>(null);

  useEffect(() => {
    const unsubscribe = crowdSim.subscribe((state) => {
      setTelemetry(state.telemetry);
    });
    return () => unsubscribe();
  }, []);

  if (!telemetry) return null;

  const MetricCard = ({ title, value, icon, unit }: any) => (
    <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--color-primary)' }}>
        {icon}
      </div>
      <div>
        <div className="text-muted text-sm">{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {value} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
      <MetricCard title="Capacity" value={telemetry.capacityPercent} unit="%" icon={<Users size={20} />} />
      <MetricCard title="Avg Wait" value={telemetry.averageWaitTime} unit="min" icon={<Clock size={20} />} />
      <MetricCard title="Flow Out" value={telemetry.exitsPerMin} unit="/min" icon={<LogOut size={20} />} />
      <MetricCard title="Readiness" value={telemetry.staffReadiness} unit="%" icon={<ShieldCheck size={20} />} />
    </div>
  );
};
