import { useState, useEffect } from 'react';
import { Badge } from '../../components/ui';

interface WardBeds { name: string; total: number; occupied: number; type: string; } 

const WARD_DATA: WardBeds[] = [
  { name: 'Medical Ward A', total: 40, occupied: 35, type: 'General' },
  { name: 'Medical Ward B', total: 40, occupied: 28, type: 'General' },
  { name: 'Surgical Ward', total: 35, occupied: 30, type: 'General' },
  { name: 'ICU', total: 12, occupied: 10, type: 'Critical' },
  { name: 'NICU', total: 10, occupied: 6, type: 'Critical' },
  { name: 'Maternity Ward', total: 30, occupied: 22, type: 'Specialty' },
  { name: 'Paediatric Ward', total: 25, occupied: 18, type: 'Specialty' },
  { name: 'Isolation Ward', total: 8, occupied: 3, type: 'Isolation' },
  { name: 'Psychiatric Unit', total: 15, occupied: 9, type: 'Specialty' },
  { name: 'Day Surgery', total: 6, occupied: 4, type: 'Day Case' },
];

export default function BedOccupancyRealTime() {
  const [wards] = useState<WardBeds[]>(WARD_DATA);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setLastUpdated(new Date()), 30000); return () => clearInterval(t); }, []);

  const totalBeds = wards.reduce((s, w) => s + w.total, 0);
  const totalOccupied = wards.reduce((s, w) => s + w.occupied, 0);
  const occupancyRate = Math.round((totalOccupied / totalBeds) * 100);
  const criticalWards = wards.filter((w) => w.type === 'Critical');
  const criticalOccupied = criticalWards.reduce((s, w) => s + w.occupied, 0);
  const criticalTotal = criticalWards.reduce((s, w) => s + w.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Bed Occupancy — Real Time</h1><p className="text-gray-500">Live bed occupancy across all wards and departments</p></div>
        <div className="flex items-center gap-2 text-xs text-slate-400"><span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />Live · {lastUpdated.toLocaleTimeString()}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-4 text-center"><div className="text-2xl font-bold text-slate-700">{totalBeds}</div><div className="text-xs text-slate-500">Total Beds</div></div>
        <div className="bg-white rounded-lg border p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalOccupied}</div><div className="text-xs text-slate-500">Occupied</div></div>
        <div className="bg-white rounded-lg border p-4 text-center"><div className="text-2xl font-bold text-green-600">{totalBeds - totalOccupied}</div><div className="text-xs text-slate-500">Available</div></div>
        <div className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${occupancyRate > 90 ? 'text-red-600' : occupancyRate > 75 ? 'text-yellow-600' : 'text-green-600'}`}>{occupancyRate}%</div><div className="text-xs text-slate-500">Overall Rate</div></div>
        <div className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${criticalOccupied / criticalTotal > 0.85 ? 'text-red-600' : 'text-green-600'}`}>{Math.round((criticalOccupied / criticalTotal) * 100)}%</div><div className="text-xs text-slate-500">Critical Care</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wards.map((w) => {
          const pct = Math.round((w.occupied / w.total) * 100);
          const color = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-green-500';
          return (
            <div key={w.name} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{w.name}</span>
                <Badge className={w.type === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}>{w.type}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>{w.occupied}/{w.total} beds</span>
                <span className={`font-bold ${pct > 90 ? 'text-red-600' : pct > 75 ? 'text-yellow-600' : 'text-green-600'}`}>{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              {pct > 90 && <p className="text-[10px] text-red-600 mt-1 font-medium">⚠ Near capacity</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
