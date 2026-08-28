import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Card, PageHeader, useToast } from '../../components/ui';

interface Bed {
  id: string;
  ward: string;
  bedNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  patient?: string;
  admissionDate?: string;
  diagnosis?: string;
}

const WARDS = ['Emergency', 'ICU', 'Surgery', 'Medicine', 'Pediatrics', 'Maternity', 'Isolation'];

function generateBeds(): Bed[] {
  const beds: Bed[] = [];
  const patients = ['Kwame A.', 'Ama D.', 'Kofi M.', 'Akua B.', 'Yaw F.', 'Nana K.', 'Efua A.', 'Abena O.', 'Yaa P.', 'Kojo S.'];
  const diagnoses = ['Malaria', 'Pneumonia', 'Fracture', 'Typhoid', 'Appendicitis', 'Diabetes', 'Hypertension', 'Asthma'];
  let id = 1;
  for (const ward of WARDS) {
    const count = ward === 'ICU' ? 10 : ward === 'Emergency' ? 20 : ward === 'Isolation' ? 6 : 15;
    for (let i = 1; i <= count; i++) {
      const r = Math.random();
      const status: Bed['status'] = r < 0.55 ? 'occupied' : r < 0.65 ? 'reserved' : r < 0.7 ? 'maintenance' : 'available';
      beds.push({
        id: String(id++),
        ward,
        bedNumber: `${ward.slice(0, 3).toUpperCase()}-${String(i).padStart(2, '0')}`,
        status,
        patient: status === 'occupied' ? patients[Math.floor(Math.random() * patients.length)] : undefined,
        admissionDate: status === 'occupied' ? '2024-01-15' : undefined,
        diagnosis: status === 'occupied' ? diagnoses[Math.floor(Math.random() * diagnoses.length)] : undefined,
      });
    }
  }
  return beds;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  available: { color: 'text-green-700', bg: 'bg-green-500', label: 'Available' },
  occupied: { color: 'text-red-700', bg: 'bg-red-500', label: 'Occupied' },
  reserved: { color: 'text-amber-700', bg: 'bg-amber-500', label: 'Reserved' },
  maintenance: { color: 'text-slate-700', bg: 'bg-slate-400', label: 'Maintenance' },
};

export default function BedManagement() {
  const toast = useToast();
  const [beds, setBeds] = useState<Bed[]>(generateBeds);
  const [wardFilter, setWardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = beds.filter((b) => {
    if (wardFilter !== 'All' && b.ward !== wardFilter) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const wardStats = WARDS.map((w) => {
    const wb = beds.filter((b) => b.ward === w);
    return {
      ward: w,
      total: wb.length,
      available: wb.filter((b) => b.status === 'available').length,
      occupied: wb.filter((b) => b.status === 'occupied').length,
      reserved: wb.filter((b) => b.status === 'reserved').length,
      maintenance: wb.filter((b) => b.status === 'maintenance').length,
    };
  });

  const totalBeds = beds.length;
  const totalAvailable = beds.filter((b) => b.status === 'available').length;
  const totalOccupied = beds.filter((b) => b.status === 'occupied').length;
  const occupancyRate = Math.round(((totalBeds - totalAvailable) / totalBeds) * 100);

  function dischargeBed(id: string) {
    setBeds((prev) => prev.map((b) => b.id === id ? { ...b, status: 'available', patient: undefined, diagnosis: undefined } : b));
    toast('Patient discharged, bed freed', 'success');
  }

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Bed Allocation"
          fields={[{"name":"ward","label":"Ward","type":"select","options":["Medical Ward A","Medical Ward B","Surgical Ward","ICU","NICU","Maternity","Paediatric","Isolation","Psychiatric"]},{"name":"bedNumber","label":"Bed Number","type":"text","required":true},{"name":"bedType","label":"Bed Type","type":"select","options":["Standard","HDU","ICU","Isolation","Paediatric","Bariatric"]},{"name":"status","label":"Status","type":"select","options":["Available","Occupied","Maintenance","Reserved"]},{"name":"patientName","label":"Patient Name","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="🛏️ Bed Management"
        subtitle={`${totalBeds} beds · ${occupancyRate}% occupancy · ${totalAvailable} available`}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs font-bold text-slate-400">Total Beds</p><p className="text-2xl font-bold text-slate-800">{totalBeds}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Available</p><p className="text-2xl font-bold text-green-600">{totalAvailable}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Occupied</p><p className="text-2xl font-bold text-red-600">{totalOccupied}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Occupancy Rate</p><p className="text-2xl font-bold text-amber-600">{occupancyRate}%</p></Card>
      </div>

      {/* Ward Overview */}
      <Card title="Ward Overview" subtitle="Bed availability by ward">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {wardStats.map((w) => (
            <div key={w.ward} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-bold text-slate-800">{w.ward}</p>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: w.total }).map((_, i) => (
                  <div key={i} className={`h-3 w-3 rounded-sm ${
                    i < w.occupied ? 'bg-red-500' : i < w.occupied + w.reserved ? 'bg-amber-400' : i < w.total - w.maintenance ? 'bg-green-400' : 'bg-slate-300'
                  }`} />
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">{w.available} available / {w.total} total</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="mb-4 mt-5 flex flex-wrap gap-2">
        <button onClick={() => setWardFilter('All')} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${wardFilter === 'All' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All Wards</button>
        {WARDS.map((w) => <button key={w} onClick={() => setWardFilter(w)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${wardFilter === w ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{w}</button>)}
        <span className="mx-2 border-l border-slate-200" />
        {Object.entries(STATUS_CONFIG).map(([k, v]) => <button key={k} onClick={() => setStatusFilter(k)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${statusFilter === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{v.label}</button>)}
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {filtered.map((b) => {
          const cfg = STATUS_CONFIG[b.status] || { color: 'text-green-700', bg: 'bg-green-500', label: 'Available' };
          return (
            <div key={b.id} title={`${b.bedNumber}\n${b.patient ?? 'Empty'}\n${b.diagnosis ?? ''}`} onClick={() => b.status === 'occupied' && dischargeBed(b.id)}
              className={`relative flex h-12 w-full cursor-pointer items-center justify-center rounded-lg text-[10px] font-bold transition hover:scale-105 hover:shadow-md ${cfg.bg} text-white`}>
              <span>{b.bedNumber.split('-')[1]}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1"><span className={`h-3 w-3 rounded-sm ${v.bg}`} /> {v.label}</span>
        ))}
        <span className="text-slate-400">· Click occupied bed to discharge</span>
      </div>
    </div>
  );
}
