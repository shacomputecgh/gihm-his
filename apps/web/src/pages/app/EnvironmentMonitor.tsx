import { useState, useEffect } from 'react';
import { Badge, Card, PageHeader } from '../../components/ui';

interface SensorReading {
  id: string;
  location: string;
  type: 'pharmacy' | 'blood_bank' | 'laboratory' | 'store';
  temperature: number;
  humidity: number;
  tempMin: number;
  tempMax: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
  alertHistory: { time: string; message: string }[];
}

const SENSORS: SensorReading[] = [
  { id: '1', location: 'Main Pharmacy', type: 'pharmacy', temperature: 24.5, humidity: 45, tempMin: 15, tempMax: 30, status: 'normal', lastUpdated: new Date().toISOString(), alertHistory: [] },
  { id: '2', location: 'Blood Bank - Fridge 1', type: 'blood_bank', temperature: 4.2, humidity: 60, tempMin: 2, tempMax: 6, status: 'normal', lastUpdated: new Date().toISOString(), alertHistory: [] },
  { id: '3', location: 'Blood Bank - Fridge 2', type: 'blood_bank', temperature: 7.8, humidity: 62, tempMin: 2, tempMax: 6, status: 'critical', lastUpdated: new Date().toISOString(), alertHistory: [{ time: '10 min ago', message: 'Temperature exceeded 6°C threshold' }] },
  { id: '4', location: 'Laboratory - Freezer', type: 'laboratory', temperature: -18.5, humidity: 30, tempMin: -25, tempMax: -15, status: 'normal', lastUpdated: new Date().toISOString(), alertHistory: [] },
  { id: '5', location: 'Vaccine Store', type: 'store', temperature: 3.8, humidity: 55, tempMin: 2, tempMax: 8, status: 'normal', lastUpdated: new Date().toISOString(), alertHistory: [] },
  { id: '6', location: 'Controlled Substance Safe', type: 'pharmacy', temperature: 22.1, humidity: 40, tempMin: 15, tempMax: 30, status: 'normal', lastUpdated: new Date().toISOString(), alertHistory: [] },
];

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  pharmacy: { icon: '💊', color: 'bg-indigo-100 text-indigo-700' },
  blood_bank: { icon: '🩸', color: 'bg-red-100 text-red-700' },
  laboratory: { icon: '🧪', color: 'bg-cyan-100 text-cyan-700' },
  store: { icon: '📦', color: 'bg-green-100 text-green-700' },
};

export default function EnvironmentMonitor() {
  const [sensors, setSensors] = useState(SENSORS);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => prev.map((s) => ({
        ...s,
        temperature: +(s.temperature + (Math.random() - 0.5) * 0.2).toFixed(1),
        humidity: Math.round(s.humidity + (Math.random() - 0.5) * 2),
        lastUpdated: new Date().toISOString(),
        status: s.temperature < s.tempMin || s.temperature > s.tempMax ? 'critical' : 'normal',
      })));
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const critical = sensors.filter((s) => s.status === 'critical');

  return (
    <div>
      <PageHeader
        title="🌡️ Environment Monitor"
        subtitle={`Live temperature & humidity monitoring · ${sensors.length} sensors · Auto-refresh 10s`}
        action={critical.length > 0 ? <Badge tone="red">🔴 {critical.length} CRITICAL ALERTS</Badge> : <Badge tone="green">✅ All Normal</Badge>}
      />

      {critical.length > 0 && (
        <div className="mb-5 rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">⚠️ CRITICAL TEMPERATURE ALERTS — IMMEDIATE ACTION REQUIRED</p>
          {critical.map((s) => (
            <div key={s.id} className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="font-semibold">{s.location}: {s.temperature}°C</span>
              <span className="text-xs">(range: {s.tempMin}–{s.tempMax}°C)</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sensors.map((s) => {
          const cfg = TYPE_CONFIG[s.type] ?? { icon: "📦", color: "bg-slate-100 text-slate-700" };
          const tempPercent = ((s.temperature - s.tempMin) / (s.tempMax - s.tempMin)) * 100;
          return (
            <Card key={s.id} className={`${s.status === 'critical' ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.location}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{s.type.replace('_', ' ')}</span>
                  </div>
                </div>
                <Badge tone={s.status === 'critical' ? 'red' : 'green'}>{s.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Temperature</p>
                  <p className={`text-2xl font-extrabold ${s.status === 'critical' ? 'text-red-600' : 'text-slate-800'}`}>{s.temperature}°C</p>
                  <p className="text-[10px] text-slate-400">Range: {s.tempMin}–{s.tempMax}°C</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Humidity</p>
                  <p className="text-2xl font-extrabold text-slate-800">{s.humidity}%</p>
                </div>
              </div>

              {/* Temperature bar */}
              <div className="mt-3">
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${s.status === 'critical' ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, tempPercent))}%` }}
                  />
                </div>
                <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                  <span>{s.tempMin}°C</span>
                  <span>{s.tempMax}°C</span>
                </div>
              </div>

              {s.alertHistory.length > 0 && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2">
                  {s.alertHistory.map((a, i) => (
                    <p key={i} className="text-[10px] text-red-600">⚠️ {a.message} ({a.time})</p>
                  ))}
                </div>
              )}

              <p className="mt-2 text-[10px] text-slate-400">Last updated: {new Date(s.lastUpdated).toLocaleTimeString()}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
