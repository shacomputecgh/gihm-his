import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Bed { id: string; ward: string; bedNumber: string; type: 'General' | 'HDU' | 'ICU' | 'Isolation' | 'Paediatric' | 'Maternity'; status: 'Occupied' | 'Available' | 'Cleaning' | 'Maintenance' | 'Reserved'; patientName?: string; mrn?: string; admitDate?: string; diagnosis?: string; cleaningStaff?: string; cleaningStarted?: string; expectedReady?: string; }

const BEDS: Bed[] = [
  { id: 'ICU-01', ward: 'ICU', bedNumber: '01', type: 'ICU', status: 'Occupied', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', admitDate: '2026-08-18', diagnosis: 'Severe pneumonia — ventilator' },
  { id: 'ICU-02', ward: 'ICU', bedNumber: '02', type: 'ICU', status: 'Occupied', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', admitDate: '2026-08-23', diagnosis: 'Cardiac failure' },
  { id: 'ICU-03', ward: 'ICU', bedNumber: '03', type: 'ICU', status: 'Cleaning', cleaningStaff: 'Mary', cleaningStarted: '09:15', expectedReady: '09:45' },
  { id: 'ICU-04', ward: 'ICU', bedNumber: '04', type: 'ICU', status: 'Available' },
  { id: 'ICU-05', ward: 'ICU', bedNumber: '05', type: 'ICU', status: 'Reserved', patientName: 'Pending transfer', mrn: '—', diagnosis: 'Awaiting from Emergency' },
  { id: 'SW-01', ward: 'Surgical Ward', bedNumber: '01', type: 'General', status: 'Occupied', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', admitDate: '2026-08-22', diagnosis: 'Post-appendectomy' },
  { id: 'SW-02', ward: 'Surgical Ward', bedNumber: '02', type: 'General', status: 'Occupied', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', admitDate: '2026-08-24', diagnosis: 'Caesarean section' },
  { id: 'SW-03', ward: 'Surgical Ward', bedNumber: '03', type: 'General', status: 'Available' },
  { id: 'SW-04', ward: 'Surgical Ward', bedNumber: '04', type: 'General', status: 'Maintenance', expectedReady: '2026-08-27' },
  { id: 'SW-ISO-1', ward: 'Surgical Ward', bedNumber: 'ISO-1', type: 'Isolation', status: 'Occupied', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', admitDate: '2026-08-25', diagnosis: 'MRSA — contact precautions' },
  { id: 'MWA-01', ward: 'Medical Ward A', bedNumber: '01', type: 'General', status: 'Occupied', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0776', admitDate: '2026-08-24', diagnosis: 'Diabetic ketoacidosis' },
  { id: 'MWA-02', ward: 'Medical Ward A', bedNumber: '02', type: 'General', status: 'Cleaning', cleaningStaff: 'Grace', cleaningStarted: '09:00', expectedReady: '09:30' },
  { id: 'MWA-03', ward: 'Medical Ward A', bedNumber: '03', type: 'General', status: 'Available' },
  { id: 'MAT-01', ward: 'Maternity', bedNumber: '01', type: 'Maternity', status: 'Occupied', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', admitDate: '2026-08-25', diagnosis: 'Post-partum day 1' },
  { id: 'MAT-02', ward: 'Maternity', bedNumber: '02', type: 'Maternity', status: 'Available' },
  { id: 'PED-01', ward: 'Paediatric', bedNumber: '01', type: 'Paediatric', status: 'Occupied', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', admitDate: '2026-08-26', diagnosis: 'Severe malaria' },
  { id: 'PED-02', ward: 'Paediatric', bedNumber: '02', type: 'Paediatric', status: 'Available' },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = { Occupied: { bg: 'bg-red-100', text: 'text-red-800', icon: '🛏️' }, Available: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' }, Cleaning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🧹' }, Maintenance: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🔧' }, Reserved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📌' } };
const TYPE_STYLE: Record<string, string> = { ICU: 'bg-red-50 text-red-700', HDU: 'bg-orange-50 text-orange-700', Isolation: 'bg-purple-50 text-purple-700', General: 'bg-slate-50 text-slate-700', Paediatric: 'bg-blue-50 text-blue-700', Maternity: 'bg-pink-50 text-pink-700' };

export default function BedManagementEnhanced() {
  const toast = useToast();
  const [selectedWard, setSelectedWard] = useState('All');
  const [selected, setSelected] = useState<Bed | null>(null);
  const wards = [...new Set(BEDS.map(b => b.ward))];
  const filtered = selectedWard === 'All' ? BEDS : BEDS.filter(b => b.ward === selectedWard);
  const totalBeds = BEDS.length;
  const occupied = BEDS.filter(b => b.status === 'Occupied').length;
  const available = BEDS.filter(b => b.status === 'Available').length;
  const cleaning = BEDS.filter(b => b.status === 'Cleaning').length;
  const occupancy = Math.round((occupied / totalBeds) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bed Management</h1>
          <p className="text-slate-500 text-sm">Real-time bed status, assignment, and cleaning tracking</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Reserve Bed</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Beds</p><p className="text-2xl font-bold">{totalBeds}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Occupied</p><p className="text-2xl font-bold text-red-600">{occupied} <span className="text-sm">({occupancy}%)</span></p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Available</p><p className="text-2xl font-bold text-green-600">{available}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Cleaning</p><p className="text-2xl font-bold text-yellow-600">{cleaning}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Maintenance</p><p className="text-2xl font-bold text-orange-600">{BEDS.filter(b => b.status === 'Maintenance').length}</p></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['All', ...wards].map(w => (
          <button key={w} onClick={() => setSelectedWard(w)} className={`px-3 py-1 rounded-lg text-xs font-medium ${selectedWard === w ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{w}</button>
        ))}
      </div>

      <div className="flex gap-4 text-xs">
        {Object.entries(STATUS_STYLE).map(([status, s]) => (
          <div key={status} className="flex items-center gap-1"><span className="text-lg">{s.icon}</span><span className="text-slate-600">{status}</span></div>
        ))}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {filtered.map(b => {
          const s = STATUS_STYLE[b.status];
          return (
            <div key={b.id} className={`${s.bg} ${s.text} rounded-lg p-3 cursor-pointer hover:shadow transition ${selected?.id === b.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === b.id ? null : b)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_STYLE[b.type]}`}>{b.type}</span>
              </div>
              <p className="font-bold text-sm">{b.bedNumber}</p>
              <p className="text-xs opacity-75">{b.ward}</p>
              {b.patientName && <p className="text-xs mt-1 truncate font-medium">{b.patientName}</p>}
              {b.status === 'Cleaning' && b.expectedReady && <p className="text-xs mt-1">Ready: {b.expectedReady}</p>}
            </div>
          );
        })}
      </div>

      {selected && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selected.ward} — Bed {selected.bedNumber}</h3>
              <p className="text-sm text-slate-500">Type: {selected.type} · Status: {selected.status}</p>
              {selected.patientName && (
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Patient:</strong> {selected.patientName} ({selected.mrn})</p>
                  <p><strong>Admitted:</strong> {selected.admitDate}</p>
                  <p><strong>Diagnosis:</strong> {selected.diagnosis}</p>
                </div>
              )}
              {selected.status === 'Cleaning' && (
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Cleaning Staff:</strong> {selected.cleaningStaff}</p>
                  <p><strong>Started:</strong> {selected.cleaningStarted}</p>
                  <p><strong>Expected Ready:</strong> {selected.expectedReady}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {selected.status === 'Available' && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Assign Patient</button>}
              {selected.status === 'Occupied' && <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Discharge</button>}
              {selected.status === 'Cleaning' && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Mark Ready</button>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
