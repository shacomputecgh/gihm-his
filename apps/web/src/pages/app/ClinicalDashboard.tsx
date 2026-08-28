import { useState, useEffect } from 'react';
import { Button, Card, PageHeader } from '../../components/ui';

interface Department {
  name: string;
  icon: string;
  patients: number;
  staff: number;
  beds: { total: number; occupied: number };
  waitTime: number;
  alerts: number;
  status: 'normal' | 'busy' | 'critical';
}

interface Vital {
  patient: string;
  hr: number;
  bp: string;
  temp: number;
  spo2: number;
  rr: number;
  trend: 'up' | 'down' | 'stable';
}

const DEPARTMENTS: Department[] = [
  { name: 'Emergency', icon: '🚨', patients: 12, staff: 8, beds: { total: 20, occupied: 18 }, waitTime: 45, alerts: 3, status: 'critical' },
  { name: 'ICU', icon: '❤️', patients: 8, staff: 6, beds: { total: 10, occupied: 9 }, waitTime: 0, alerts: 2, status: 'critical' },
  { name: 'Surgery', icon: '🔪', patients: 5, staff: 12, beds: { total: 8, occupied: 5 }, waitTime: 0, alerts: 0, status: 'normal' },
  { name: 'Maternity', icon: '👶', patients: 15, staff: 6, beds: { total: 20, occupied: 14 }, waitTime: 15, alerts: 1, status: 'busy' },
  { name: 'Pediatrics', icon: '🧒', patients: 10, staff: 5, beds: { total: 15, occupied: 10 }, waitTime: 20, alerts: 0, status: 'normal' },
  { name: 'Internal Medicine', icon: '🩺', patients: 22, staff: 7, beds: { total: 30, occupied: 22 }, waitTime: 30, alerts: 1, status: 'busy' },
  { name: 'Laboratory', icon: '🧪', patients: 18, staff: 4, beds: { total: 0, occupied: 0 }, waitTime: 25, alerts: 0, status: 'normal' },
  { name: 'Pharmacy', icon: '💊', patients: 0, staff: 3, beds: { total: 0, occupied: 0 }, waitTime: 10, alerts: 2, status: 'normal' },
];

const VITALS: Vital[] = [
  { patient: 'Kwame A. (ICU-03)', hr: 112, bp: '160/95', temp: 38.7, spo2: 91, rr: 24, trend: 'up' },
  { patient: 'Ama D. (ER-08)', hr: 88, bp: '120/78', temp: 37.2, spo2: 98, rr: 16, trend: 'stable' },
  { patient: 'Kofi M. (ICU-01)', hr: 65, bp: '100/60', temp: 36.8, spo2: 95, rr: 14, trend: 'down' },
  { patient: 'Akua B. (MAT-12)', hr: 95, bp: '130/85', temp: 37.0, spo2: 99, rr: 18, trend: 'stable' },
  { patient: 'Yaw F. (MED-07)', hr: 78, bp: '125/82', temp: 37.5, spo2: 96, rr: 15, trend: 'stable' },
];

export default function ClinicalDashboard() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPatients = DEPARTMENTS.reduce((s, d) => s + d.patients, 0);
  const totalBeds = DEPARTMENTS.reduce((s, d) => s + d.beds.total, 0);
  const occupiedBeds = DEPARTMENTS.reduce((s, d) => s + d.beds.occupied, 0);
  const totalAlerts = DEPARTMENTS.reduce((s, d) => s + d.alerts, 0);

  const statusColor: Record<string, string> = {
    normal: 'bg-green-100 text-green-700 border-green-200',
    busy: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };

  const trendIcon: Record<string, string> = { up: '📈', down: '📉', stable: '➡️' };

  return (
    <div>
      <PageHeader
        title="Clinical Dashboard"
        subtitle={`Live department monitoring · Updated ${new Date().toLocaleTimeString()} · Auto-refresh 5s`}
        action={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)}>🔄 Refresh Now</Button>
        }
      />

      {/* Summary Stats */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs font-bold text-slate-400">Total Patients</p><p className="text-3xl font-extrabold text-slate-800">{totalPatients}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Bed Occupancy</p><p className="text-3xl font-extrabold text-blue-600">{occupiedBeds}/{totalBeds}</p><p className="text-xs text-slate-400">{Math.round((occupiedBeds / totalBeds) * 100)}% occupied</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Active Alerts</p><p className="text-3xl font-extrabold text-red-600">{totalAlerts}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Avg Wait Time</p><p className="text-3xl font-extrabold text-amber-600">{Math.round(DEPARTMENTS.filter((d) => d.waitTime > 0).reduce((s, d) => s + d.waitTime, 0) / DEPARTMENTS.filter((d) => d.waitTime > 0).length)} min</p></Card>
      </div>

      {/* Department Grid */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEPARTMENTS.map((d) => (
          <div key={d.name} className={`rounded-xl border-2 p-4 transition hover:shadow-lg ${statusColor[d.status]}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{d.icon}</span>
              {d.alerts > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{d.alerts}</span>}
            </div>
            <p className="mt-2 text-sm font-bold">{d.name}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <p>👥 {d.patients} patients</p>
              <p>🩺 {d.staff} staff</p>
              {d.beds.total > 0 && <p>🛏️ {d.beds.occupied}/{d.beds.total} beds</p>}
              {d.waitTime > 0 && <p>⏱️ {d.waitTime}min wait</p>}
            </div>
            {d.beds.total > 0 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/50">
                <div className="h-full rounded-full bg-current" style={{ width: `${(d.beds.occupied / d.beds.total) * 100}%`, opacity: 0.6 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live Vitals */}
      <Card title="🔴 Live Patient Vitals" subtitle="Real-time vital signs monitoring — critical values highlighted">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2 text-center">❤️ HR</th>
                <th className="px-3 py-2 text-center">🩸 BP</th>
                <th className="px-3 py-2 text-center">🌡️ Temp</th>
                <th className="px-3 py-2 text-center">💨 SpO2</th>
                <th className="px-3 py-2 text-center">🫁 RR</th>
                <th className="px-3 py-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {VITALS.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-semibold text-slate-800">{v.patient}</td>
                  <td className={`px-3 py-2 text-center font-bold ${v.hr > 100 ? 'text-red-600' : v.hr < 60 ? 'text-amber-600' : 'text-green-600'}`}>{v.hr}</td>
                  <td className={`px-3 py-2 text-center font-bold ${parseInt(v.bp) > 140 ? 'text-red-600' : 'text-green-600'}`}>{v.bp}</td>
                  <td className={`px-3 py-2 text-center font-bold ${v.temp > 38 ? 'text-red-600' : 'text-green-600'}`}>{v.temp}°C</td>
                  <td className={`px-3 py-2 text-center font-bold ${v.spo2 < 94 ? 'text-red-600' : 'text-green-600'}`}>{v.spo2}%</td>
                  <td className={`px-3 py-2 text-center font-bold ${v.rr > 20 ? 'text-red-600' : 'text-green-600'}`}>{v.rr}</td>
                  <td className="px-3 py-2 text-center">{trendIcon[v.trend]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
