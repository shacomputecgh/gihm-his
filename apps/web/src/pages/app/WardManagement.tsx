import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, PageHeader } from '../../components/ui';

interface Ward {
  id: string; name: string; capacity: number; occupied: number; nurseInCharge: string;
  beds: BedInfo[]; patients: WardPatient[];
}

interface BedInfo { bed: string; status: 'occupied' | 'available' | 'reserved' | 'maintenance'; patient?: string; diagnosis?: string; }
interface WardPatient { name: string; bed: string; diagnosis: string; admitDate: string; doctor: string; status: string; }

const MOCK_WARDS: Ward[] = [
  { id: 'W001', name: 'Medical Ward', capacity: 30, occupied: 22, nurseInCharge: 'Nurse Manager Ama',
    beds: Array.from({ length: 30 }, (_, i) => ({ bed: `M-${(i + 1).toString().padStart(2, '0')}`, status: i < 22 ? 'occupied' : i < 25 ? 'available' : i < 28 ? 'reserved' : 'maintenance' })),
    patients: [{ name: 'Kwame Asante', bed: 'M-12', diagnosis: 'Hypertension', admitDate: '2026-05-20', doctor: 'Dr. Mensah', status: 'Stable' }, { name: 'Akua Mensah', bed: 'M-08', diagnosis: 'Gestational HTN', admitDate: '2026-05-15', doctor: 'Dr. Mensah', status: 'Monitoring' }] },
  { id: 'W002', name: 'Surgical Ward', capacity: 25, occupied: 18, nurseInCharge: 'Nurse Manager Kofi',
    beds: Array.from({ length: 25 }, (_, i) => ({ bed: `S-${(i + 1).toString().padStart(2, '0')}`, status: i < 18 ? 'occupied' : i < 22 ? 'available' : i < 24 ? 'reserved' : 'maintenance' })),
    patients: [{ name: 'Ama Darko', bed: 'S-05', diagnosis: 'Post-appendectomy', admitDate: '2026-05-23', doctor: 'Dr. Boateng', status: 'Recovery' }] },
  { id: 'W003', name: 'Paediatric Ward', capacity: 20, occupied: 14, nurseInCharge: 'Nurse Manager Abena',
    beds: Array.from({ length: 20 }, (_, i) => ({ bed: `P-${(i + 1).toString().padStart(2, '0')}`, status: i < 14 ? 'occupied' : i < 18 ? 'available' : 'available' })),
    patients: [{ name: 'Kofi Asante Jr.', bed: 'P-03', diagnosis: 'Pneumonia', admitDate: '2026-05-23', doctor: 'Dr. Osei', status: 'Febrile' }] },
  { id: 'W004', name: 'Maternity Ward', capacity: 15, occupied: 8, nurseInCharge: 'Midwife Manager',
    beds: Array.from({ length: 15 }, (_, i) => ({ bed: `MT-${(i + 1).toString().padStart(2, '0')}`, status: i < 8 ? 'occupied' : i < 12 ? 'available' : 'available' })),
    patients: [{ name: 'Adwoa Boateng', bed: 'MT-02', diagnosis: 'Post-NVD Day 1', admitDate: '2026-05-22', doctor: 'Dr. Agyeman', status: 'Discharge ready' }] },
  { id: 'W005', name: 'ICU', capacity: 10, occupied: 7, nurseInCharge: 'ICU Nurse Manager',
    beds: Array.from({ length: 10 }, (_, i) => ({ bed: `ICU-${(i + 1).toString().padStart(2, '0')}`, status: i < 7 ? 'occupied' : i < 9 ? 'available' : 'maintenance' })),
    patients: [] },
];

const BED_COLORS = { occupied: 'bg-red-400', available: 'bg-green-400', reserved: 'bg-amber-400', maintenance: 'bg-slate-300' };

export default function WardManagement() {
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const ward = MOCK_WARDS.find(w => w.id === selectedWard);
  const totalCapacity = MOCK_WARDS.reduce((s, w) => s + w.capacity, 0);
  const totalOccupied = MOCK_WARDS.reduce((s, w) => s + w.occupied, 0);

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Ward Record"
          fields={[{"name":"wardName","label":"Ward Name","type":"text","required":true},{"name":"wardType","label":"Ward Type","type":"select","options":["Medical","Surgical","Paediatric","Maternity","ICU","NICU","Psychiatric","Isolation","General"]},{"name":"beds","label":"Total Beds","type":"number","required":true},{"name":"nurseInCharge","label":"Nurse in Charge","type":"text"},{"name":"floor","label":"Floor","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Ward Management" subtitle="Ward overview, bed allocation, and patient flow" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_WARDS.length}</div><div className="text-xs text-slate-500">Wards</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{totalCapacity - totalOccupied}</div><div className="text-xs text-slate-500">Available Beds</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{totalOccupied}</div><div className="text-xs text-slate-500">Occupied</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{((totalOccupied / totalCapacity) * 100).toFixed(0)}%</div><div className="text-xs text-slate-500">Occupancy Rate</div></Card>
      </div>

      {/* Ward Overview Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {MOCK_WARDS.map(w => {
          const occRate = (w.occupied / w.capacity) * 100;
          const isSelected = selectedWard === w.id;
          return (
            <div key={w.id} className={`rounded-xl border border-slate-200 p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-400' : 'hover:shadow-md'}`} onClick={() => setSelectedWard(isSelected ? null : w.id)}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-800">{w.name}</h3>
                <Badge tone={occRate >= 90 ? 'red' : occRate >= 70 ? 'gold' : 'green'}>{occRate.toFixed(0)}% Full</Badge>
              </div>
              <div className="text-xs text-slate-500 mb-2">👨‍⚕️ {w.nurseInCharge}</div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${occRate >= 90 ? 'bg-red-500' : occRate >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${occRate}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{w.occupied}/{w.capacity} beds</span>
                <span>{w.capacity - w.occupied} available</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Ward Details */}
      {ward && (
        <Card className="p-4">
          <h3 className="font-bold text-lg text-slate-800 mb-3">🏥 {ward.name} — Bed Grid</h3>
          <div className="flex flex-wrap gap-1 mb-4">
            {Object.entries(BED_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1 text-xs">
                <span className={`h-4 w-4 rounded ${color}`}></span>
                <span className="text-slate-500 capitalize">{status}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 md:grid-cols-10 mb-4">
            {ward.beds.map(b => (
              <div key={b.bed} className={`h-8 w-full rounded flex items-center justify-center text-[10px] font-bold text-white ${BED_COLORS[b.status]} ${b.status === 'occupied' ? 'ring-2 ring-red-300' : ''} cursor-pointer transition hover:scale-110`} title={`${b.bed}: ${b.status}${b.patient ? ` (${b.patient})` : ''}`}>
                {b.bed.replace(ward.name.substring(0, 1).toUpperCase(), '')}
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 mb-3">📋 Patients in Ward ({ward.patients.length})</div>
          {ward.patients.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-xs">
              <div>
                <span className="font-medium">{p.name}</span>
                <span className="text-slate-400 ml-2">{p.bed}</span>
                <span className="text-slate-500 ml-2">{p.diagnosis}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{p.doctor}</span>
                <Badge tone={p.status.includes('Discharge') ? 'green' : p.status.includes('Febrile') || p.status.includes('Monitoring') ? 'gold' : 'blue'}>{p.status}</Badge>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
