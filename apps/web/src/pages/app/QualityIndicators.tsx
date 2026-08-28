import { useState } from 'react';

interface Indicator { name: string; category: string; target: number; actual: number; unit: string; trend: 'up' | 'down' | 'stable'; }

const INDICATORS: Indicator[] = [
  { name: 'Patient Mortality Rate', category: 'Clinical', target: 2.0, actual: 1.8, unit: '%', trend: 'down' },
  { name: 'Surgical Site Infection Rate', category: 'Infection Control', target: 1.5, actual: 1.2, unit: '%', trend: 'down' },
  { name: 'Hospital-Acquired Pressure Ulcer Rate', category: 'Patient Safety', target: 1.0, actual: 0.8, unit: '%', trend: 'stable' },
  { name: 'Hand Hygiene Compliance', category: 'Infection Control', target: 90, actual: 92, unit: '%', trend: 'up' },
  { name: 'Medication Error Rate', category: 'Medication Safety', target: 0.5, actual: 0.3, unit: '%', trend: 'down' },
  { name: 'Average ER Wait Time', category: 'Access', target: 60, actual: 45, unit: 'min', trend: 'down' },
  { name: 'Bed Turnaround Time', category: 'Operations', target: 120, actual: 95, unit: 'min', trend: 'down' },
  { name: 'Patient Complaint Resolution', category: 'Patient Experience', target: 95, actual: 88, unit: '%', trend: 'up' },
  { name: 'Staff Training Compliance', category: 'Staff', target: 100, actual: 85, unit: '%', trend: 'up' },
  { name: 'Readmission Rate (30-day)', category: 'Clinical', target: 5, actual: 4.2, unit: '%', trend: 'down' },
  { name: 'VTE Prophylaxis Compliance', category: 'Patient Safety', target: 95, actual: 90, unit: '%', trend: 'stable' },
  { name: 'Antibiotic Stewardship Compliance', category: 'Antimicrobial', target: 90, actual: 82, unit: '%', trend: 'up' },
];

const TREND_ICONS: Record<string, string> = { up: '📈', down: '📉', stable: '➡️' };

export default function QualityIndicators() {
  const [filter, setFilter] = useState('');
  const categories = [...new Set(INDICATORS.map((i) => i.category))];
  const filtered = INDICATORS.filter((i) => !filter || i.category === filter);
  const metTarget = filtered.filter((i) => (i.unit === '%' && i.name.includes('Compliance') ? i.actual >= i.target : i.actual <= i.target)).length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Quality Indicators</h1><p className="text-gray-500">Hospital quality metrics, KPIs, and performance benchmarks</p></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{filtered.length}</div><div className="text-xs text-slate-500">Indicators</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{metTarget}</div><div className="text-xs text-slate-500">Met Target</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{filtered.length - metTarget}</div><div className="text-xs text-slate-500">Below Target</div></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === '' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
        {categories.map((c) => (<button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === c ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>))}
      </div>
      <div className="space-y-2">
        {filtered.map((ind, i) => {
          const isCompliance = ind.name.includes('Compliance') || ind.name.includes('Rate') && ind.unit === '%';
          const met = isCompliance ? ind.actual >= ind.target : ind.actual <= ind.target;
          return (
            <div key={i} className="bg-white rounded-lg border p-4 flex items-center gap-4 hover:shadow-sm transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-semibold text-sm">{ind.name}</span><span className="text-xs text-slate-400">{ind.category}</span></div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-slate-500">Target: <strong>{ind.target}{ind.unit}</strong></span>
                  <span className={`text-xs font-bold ${met ? 'text-green-600' : 'text-red-600'}`}>Actual: {ind.actual}{ind.unit}</span>
                  <span className="text-xs">{TREND_ICONS[ind.trend]}</span>
                </div>
              </div>
              <div className="w-24 bg-slate-100 rounded-full h-2"><div className={`h-2 rounded-full ${met ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.round((ind.actual / ind.target) * 100))}%` }} /></div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${met ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{met ? '✓ Met' : '✗ Below'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
