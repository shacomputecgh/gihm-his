import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface WardData { name: string; totalBeds: number; occupied: number; cleaners: number; nurses: number; doctors: number; pendingDischarges: number; newAdmissions: number; transfers: number; criticalAlerts: string[]; }

const WARDS: WardData[] = [
  { name: 'ICU', totalBeds: 12, occupied: 10, cleaners: 2, nurses: 4, doctors: 2, pendingDischarges: 1, newAdmissions: 2, transfers: 0, criticalAlerts: ['Bed 8 — ventilator dependent', 'Bed 11 — isolation required'] },
  { name: 'Emergency', totalBeds: 15, occupied: 14, cleaners: 3, nurses: 5, doctors: 3, pendingDischarges: 5, newAdmissions: 8, transfers: 1, criticalAlerts: ['Overcrowded — 93% capacity'] },
  { name: 'Surgical Ward', totalBeds: 30, occupied: 24, cleaners: 4, nurses: 6, doctors: 2, pendingDischarges: 4, newAdmissions: 3, transfers: 1, criticalAlerts: [] },
  { name: 'Medical Ward A', totalBeds: 25, occupied: 20, cleaners: 3, nurses: 5, doctors: 2, pendingDischarges: 3, newAdmissions: 2, transfers: 0, criticalAlerts: [] },
  { name: 'Medical Ward B', totalBeds: 25, occupied: 18, cleaners: 3, nurses: 5, doctors: 2, pendingDischarges: 2, newAdmissions: 1, transfers: 0, criticalAlerts: [] },
  { name: 'Maternity', totalBeds: 25, occupied: 18, cleaners: 3, nurses: 6, doctors: 1, pendingDischarges: 3, newAdmissions: 4, transfers: 0, criticalAlerts: ['2 deliveries expected tonight'] },
  { name: 'Paediatric', totalBeds: 20, occupied: 12, cleaners: 2, nurses: 4, doctors: 1, pendingDischarges: 2, newAdmissions: 1, transfers: 0, criticalAlerts: [] },
  { name: 'Oncology', totalBeds: 18, occupied: 14, cleaners: 2, nurses: 4, doctors: 1, pendingDischarges: 1, newAdmissions: 1, transfers: 0, criticalAlerts: [] },
  { name: 'Orthopaedics', totalBeds: 20, occupied: 15, cleaners: 2, nurses: 4, doctors: 1, pendingDischarges: 3, newAdmissions: 2, transfers: 0, criticalAlerts: [] },
  { name: 'Psychiatric', totalBeds: 15, occupied: 8, cleaners: 2, nurses: 3, doctors: 1, pendingDischarges: 1, newAdmissions: 0, transfers: 0, criticalAlerts: [] },
  { name: 'NICU', totalBeds: 10, occupied: 7, cleaners: 1, nurses: 4, doctors: 1, pendingDischarges: 0, newAdmissions: 1, transfers: 0, criticalAlerts: ['Bed 3 — incubator, low birth weight'] },
];

const getOccupancyColor = (pct: number) => pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-orange-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-green-400';
const getOccupancyText = (pct: number) => pct >= 90 ? 'Critical' : pct >= 75 ? 'High' : pct >= 50 ? 'Moderate' : 'Low';
const getOccupancyBadge = (pct: number): 'red' | 'gold' | 'green' => pct >= 90 ? 'red' : pct >= 75 ? 'gold' : 'green';

export default function WardCensusEnhanced() {
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null);
  const totalBeds = WARDS.reduce((s, w) => s + w.totalBeds, 0);
  const totalOccupied = WARDS.reduce((s, w) => s + w.occupied, 0);
  const totalAvailable = totalBeds - totalOccupied;
  const totalPending = WARDS.reduce((s, w) => s + w.pendingDischarges, 0);
  const totalNurses = WARDS.reduce((s, w) => s + w.nurses, 0);
  const totalDoctors = WARDS.reduce((s, w) => s + w.doctors, 0);
  const overallPct = Math.round((totalOccupied / totalBeds) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ward Census Dashboard</h1>
        <p className="text-slate-500 text-sm">Real-time bed occupancy and staffing across all wards</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Overall Occupancy</p>
          <p className="text-3xl font-bold">{overallPct}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div className={`h-2 rounded-full ${getOccupancyColor(overallPct)}`} style={{ width: `${overallPct}%` }} />
          </div>
        </Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Total Beds</p><p className="text-3xl font-bold">{totalBeds}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Occupied</p><p className="text-3xl font-bold text-orange-600">{totalOccupied}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Available</p><p className="text-3xl font-bold text-green-600">{totalAvailable}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Pending Discharge</p><p className="text-3xl font-bold text-blue-600">{totalPending}</p></Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold">{totalNurses}</p><p className="text-xs text-slate-500">Nurses on Duty</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold">{totalDoctors}</p><p className="text-xs text-slate-500">Doctors on Duty</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{WARDS.filter(w => (w.occupied / w.totalBeds) >= 0.9).length}</p><p className="text-xs text-slate-500">Critical Wards</p></Card>
      </div>

      {/* Ward Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WARDS.map(w => {
          const pct = Math.round((w.occupied / w.totalBeds) * 100);
          const available = w.totalBeds - w.occupied;
          return (
            <Card key={w.name} className={`p-4 cursor-pointer hover:shadow-lg transition ${selectedWard?.name === w.name ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedWard(selectedWard?.name === w.name ? null : w)}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{w.name}</h3>
                <Badge tone={getOccupancyBadge(pct)}>{getOccupancyText(pct)}</Badge>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{w.occupied}/{w.totalBeds} occupied</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className={`h-3 rounded-full ${getOccupancyColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                <div className="text-center"><p className="font-bold text-green-600">{available}</p>Available</div>
                <div className="text-center"><p className="font-bold text-blue-600">{w.pendingDischarges}</p>Discharges</div>
                <div className="text-center"><p className="font-bold text-orange-600">{w.newAdmissions}</p>New Admits</div>
              </div>
              {w.criticalAlerts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {w.criticalAlerts.map((a, i) => (
                    <p key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">⚠️ {a}</p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Selected Ward Detail */}
      {selectedWard && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">{selectedWard.name} — Detailed View</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xl font-bold">{selectedWard.totalBeds}</p><p className="text-xs text-slate-500">Total Beds</p></div>
            <div className="text-center p-3 bg-orange-50 rounded-lg"><p className="text-xl font-bold text-orange-600">{selectedWard.occupied}</p><p className="text-xs text-slate-500">Occupied</p></div>
            <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-xl font-bold text-green-600">{selectedWard.totalBeds - selectedWard.occupied}</p><p className="text-xs text-slate-500">Available</p></div>
            <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-xl font-bold text-blue-600">{selectedWard.transfers}</p><p className="text-xs text-slate-500">Transfers</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-sm font-medium">Nurses: {selectedWard.nurses}</p><p className="text-sm font-medium">Doctors: {selectedWard.doctors}</p><p className="text-sm font-medium">Cleaners: {selectedWard.cleaners}</p></div>
            <div><p className="text-sm font-medium">Pending Discharges: {selectedWard.pendingDischarges}</p><p className="text-sm font-medium">New Admissions Today: {selectedWard.newAdmissions}</p></div>
            <div>{selectedWard.criticalAlerts.length > 0 ? selectedWard.criticalAlerts.map((a, i) => <p key={i} className="text-sm text-red-600">⚠️ {a}</p>) : <p className="text-sm text-green-600">✅ No critical alerts</p>}</div>
          </div>
        </Card>
      )}
    </div>
  );
}
