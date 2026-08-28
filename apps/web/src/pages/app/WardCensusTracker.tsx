import { useState, useMemo } from 'react';
import { Card, Badge, Input } from '../../components/ui';

interface WardCensus {
  id: string;
  wardName: string;
  totalBeds: number;
  occupied: number;
  available: number;
  admissions: number;
  discharges: number;
  transfers: number;
  deaths: number;
  awaitingAdmission: number;
  cleanersRequired: number;
  tidying: number;
  lastUpdated: string;
  updatedBy: string;
  comments: string;
}

const DEFAULT_WARDS: WardCensus[] = [
  { id: 'WC-001', wardName: 'Medical Ward A', totalBeds: 30, occupied: 26, available: 4, admissions: 5, discharges: 3, transfers: 1, deaths: 0, awaitingAdmission: 3, cleanersRequired: 4, tidying: 2, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: '4 beds pending cleaning' },
  { id: 'WC-002', wardName: 'Medical Ward B', totalBeds: 30, occupied: 28, available: 2, admissions: 4, discharges: 2, transfers: 0, deaths: 1, awaitingAdmission: 5, cleanersRequired: 2, tidying: 1, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: 'Overcrowded, mattresses on floor in bay 3' },
  { id: 'WC-003', wardName: 'Surgical Ward A', totalBeds: 25, occupied: 22, available: 3, admissions: 3, discharges: 4, transfers: 0, deaths: 0, awaitingAdmission: 1, cleanersRequired: 3, tidying: 2, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: '' },
  { id: 'WC-004', wardName: 'Surgical Ward B', totalBeds: 25, occupied: 20, available: 5, admissions: 2, discharges: 3, transfers: 1, deaths: 0, awaitingAdmission: 0, cleanersRequired: 5, tidying: 3, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: '' },
  { id: 'WC-005', wardName: 'Paediatric Ward', totalBeds: 25, occupied: 18, available: 7, admissions: 3, discharges: 2, transfers: 0, deaths: 0, awaitingAdmission: 1, cleanersRequired: 7, tidying: 4, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: '' },
  { id: 'WC-006', wardName: 'Maternity Ward', totalBeds: 30, occupied: 24, available: 6, admissions: 6, discharges: 4, transfers: 0, deaths: 0, awaitingAdmission: 2, cleanersRequired: 6, tidying: 3, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: '3 deliveries expected tonight' },
  { id: 'WC-007', wardName: 'ICU', totalBeds: 10, occupied: 9, available: 1, admissions: 1, discharges: 0, transfers: 0, deaths: 0, awaitingAdmission: 2, cleanersRequired: 1, tidying: 0, lastUpdated: '2026-08-24 14:00', updatedBy: 'ICU Manager', comments: 'Critical - 2 patients awaiting ICU admission' },
  { id: 'WC-008', wardName: 'NICU', totalBeds: 8, occupied: 6, available: 2, admissions: 1, discharges: 0, transfers: 0, deaths: 0, awaitingAdmission: 0, cleanersRequired: 2, tidying: 1, lastUpdated: '2026-08-24 14:00', updatedBy: 'NICU Manager', comments: '' },
  { id: 'WC-009', wardName: 'Emergency Department', totalBeds: 20, occupied: 18, available: 2, admissions: 8, discharges: 5, transfers: 2, deaths: 1, awaitingAdmission: 6, cleanersRequired: 2, tidying: 1, lastUpdated: '2026-08-24 14:00', updatedBy: 'ED Manager', comments: 'High volume, ambulance stacking' },
  { id: 'WC-010', wardName: 'Oncology Ward', totalBeds: 15, occupied: 12, available: 3, admissions: 2, discharges: 1, transfers: 0, deaths: 0, awaitingAdmission: 0, cleanersRequired: 3, tidying: 2, lastUpdated: '2026-08-24 14:00', updatedBy: 'Ward Manager', comments: '' },
];

export default function WardCensusTracker() {
  const [wards, setWards] = useState<WardCensus[]>(DEFAULT_WARDS);
  const [searchTerm, setSearchTerm] = useState('');
  

  const filtered = useMemo(() => wards.filter(w =>
    w.wardName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [wards, searchTerm]);

  const totalBeds = wards.reduce((s, w) => s + w.totalBeds, 0);
  const totalOccupied = wards.reduce((s, w) => s + w.occupied, 0);
  const totalAdmissions = wards.reduce((s, w) => s + w.admissions, 0);
  const totalDischarges = wards.reduce((s, w) => s + w.discharges, 0);
  const totalAwaiting = wards.reduce((s, w) => s + w.awaitingAdmission, 0);
  const occupancyPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  const updateOccupied = (wardId: string, change: number) => {
    setWards(wards.map(w => {
      if (w.id === wardId) {
        const newOccupied = Math.max(0, Math.min(w.totalBeds, w.occupied + change));
        return { ...w, occupied: newOccupied, available: w.totalBeds - newOccupied, lastUpdated: new Date().toLocaleString() };
      }
      return w;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛏️ Ward Census Tracker</h1>
          <p className="text-gray-600">Real-time bed occupancy — admissions, discharges, transfers across all wards</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Beds</p><p className="text-2xl font-bold">{totalBeds}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Occupied</p><p className="text-2xl font-bold text-blue-600">{totalOccupied}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Occupancy</p><p className={`text-2xl font-bold ${occupancyPct >= 90 ? 'text-red-600' : occupancyPct >= 75 ? 'text-orange-600' : 'text-green-600'}`}>{occupancyPct}%</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Admissions Today</p><p className="text-2xl font-bold text-green-600">{totalAdmissions}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Discharges Today</p><p className="text-2xl font-bold text-purple-600">{totalDischarges}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Awaiting Admission</p><p className="text-2xl font-bold text-red-600">{totalAwaiting}</p></Card>
      </div>

      <div className="mb-4">
        <Input placeholder="🔍 Search wards..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(w => {
          const occPct = w.totalBeds > 0 ? Math.round((w.occupied / w.totalBeds) * 100) : 0;
          return (
            <Card key={w.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{w.wardName}</h3>
                <Badge className={occPct >= 95 ? 'bg-red-100 text-red-800' : occPct >= 80 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>{occPct}% Full</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div className={`h-3 rounded-full transition-all ${occPct >= 95 ? 'bg-red-500' : occPct >= 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${occPct}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm mb-2">
                <div className="bg-blue-50 rounded p-2"><p className="text-xs text-gray-500">Occupied</p><p className="font-bold">{w.occupied}</p></div>
                <div className="bg-green-50 rounded p-2"><p className="text-xs text-gray-500">Available</p><p className="font-bold text-green-600">{w.available}</p></div>
                <div className="bg-yellow-50 rounded p-2"><p className="text-xs text-gray-500">Admits</p><p className="font-bold text-yellow-600">{w.admissions}</p></div>
                <div className="bg-purple-50 rounded p-2"><p className="text-xs text-gray-500">Discharges</p><p className="font-bold text-purple-600">{w.discharges}</p></div>
              </div>
              {w.awaitingAdmission > 0 && <p className="text-sm text-red-600 font-medium">⚠️ {w.awaitingAdmission} patients awaiting admission</p>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => updateOccupied(w.id, 1)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">+ Admission</button>
                <button onClick={() => updateOccupied(w.id, -1)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">+ Discharge</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
