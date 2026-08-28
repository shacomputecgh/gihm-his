import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Screening { id: string; programmeName: string; type: string; date: string; location: string; targetPopulation: string; screened: number; positive: number; referred: number; status: 'Upcoming' | 'Active' | 'Completed'; }

const SCREENINGS: Screening[] = [
  { id: 'HS-001', programmeName: 'Hypertension Screening Drive', type: 'NCD Screening', date: '2026-08-25', location: 'Community Centre - Accra', targetPopulation: 'Adults 30+', screened: 0, positive: 0, referred: 0, status: 'Upcoming' },
  { id: 'HS-002', programmeName: 'Cervical Cancer Screening', type: 'Cancer Screening', date: '2026-08-20', location: 'Korle-Bu Teaching Hospital', targetPopulation: 'Women 25-65', screened: 45, positive: 3, referred: 3, status: 'Completed' },
  { id: 'HS-003', programmeName: 'Malaria Rapid Test Campaign', type: 'Infectious Disease', date: '2026-08-22', location: 'Osu Community', targetPopulation: 'All ages', screened: 120, positive: 18, referred: 5, status: 'Completed' },
  { id: 'HS-004', programmeName: 'Diabetes Screening Day', type: 'NCD Screening', date: '2026-08-18', location: 'Tema Metropolitan Hospital', targetPopulation: 'Adults 40+', screened: 85, positive: 12, referred: 8, status: 'Completed' },
  { id: 'HS-005', programmeName: 'TB Contact Tracing', type: 'Infectious Disease', date: '2026-08-24', location: 'Ashiedu Keteke District', targetPopulation: 'Contacts of TB patients', screened: 30, positive: 2, referred: 2, status: 'Active' },
];

const TYPE_COLORS: Record<string, string> = { 'NCD Screening': 'bg-blue-100 text-blue-800', 'Cancer Screening': 'bg-purple-100 text-purple-800', 'Infectious Disease': 'bg-orange-100 text-orange-800' };
const STATUS_COLORS: Record<string, string> = { Upcoming: 'bg-blue-100 text-blue-800', Active: 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800' };

export default function HealthScreeningProgramme() {
  const [screenings] = useState<Screening[]>(SCREENINGS);

  const totalScreened = screenings.reduce((s, r) => s + r.screened, 0);
  const totalPositive = screenings.reduce((s, r) => s + r.positive, 0);
  const totalReferred = screenings.reduce((s, r) => s + r.referred, 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Health Screening Programme</h1><p className="text-gray-500">Community health screening management, outreach tracking, and referral follow-up</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{screenings.length}</div><div className="text-xs text-slate-500">Programmes</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{totalScreened}</div><div className="text-xs text-slate-500">Total Screened</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">{totalPositive}</div><div className="text-xs text-slate-500">Positive</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{totalReferred}</div><div className="text-xs text-slate-500">Referred</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{totalScreened > 0 ? Math.round((totalPositive / totalScreened) * 100) : 0}%</div><div className="text-xs text-slate-500">Positivity Rate</div></div>
      </div>
      <div className="space-y-3">
        {screenings.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{s.id}</span><Badge className={TYPE_COLORS[s.type]}>{s.type}</Badge></div>
                <h3 className="font-semibold text-sm mt-1">{s.programmeName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">📍 {s.location} · 📅 {s.date} · 🎯 {s.targetPopulation}</p>
              </div>
              <Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <div className="bg-slate-50 rounded px-3 py-1.5"><span className="text-slate-400">Screened: </span><strong>{s.screened}</strong></div>
              <div className="bg-yellow-50 rounded px-3 py-1.5"><span className="text-slate-400">Positive: </span><strong className="text-yellow-700">{s.positive}</strong></div>
              <div className="bg-red-50 rounded px-3 py-1.5"><span className="text-slate-400">Referred: </span><strong className="text-red-700">{s.referred}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
