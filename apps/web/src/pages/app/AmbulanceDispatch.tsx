import { useState } from 'react';
import { Badge, Card, useToast } from '../../components/ui';

interface AmbulanceRecord {
  id: string; vehicleId: string; crewLeader: string; crew: string[];
  status: 'Available' | 'Dispatched' | 'On Scene' | 'Transporting' | 'At Hospital' | 'Out of Service';
  currentLocation: string; lastDispatch?: string; patientName?: string;
  destination?: string; dispatchTime?: string; equipment: string[];
}

const INITIAL: AmbulanceRecord[] = [
  { id: 'AMB-001', vehicleId: 'EMS-01', crewLeader: 'EMT Kwame', crew: ['EMT Kwame', 'Nurse Ama'], status: 'Available', currentLocation: 'Hospital Bay', equipment: ['Defibrillator', 'Oxygen', 'IV Kit', 'Spinal Board'] },
  { id: 'AMB-002', vehicleId: 'EMS-02', crewLeader: 'EMT Kofi', crew: ['EMT Kofi', 'Dr. Asante', 'Nurse Esi'], status: 'Dispatched', currentLocation: 'En route to Tema', lastDispatch: 'Cardiac Emergency', patientName: 'Unknown Male', destination: 'Korle-Bu Teaching Hospital', dispatchTime: '2026-08-25 10:30', equipment: ['Advanced Life Support', '12-lead ECG', 'IV Fluids', 'Rapid Infuser'] },
  { id: 'AMB-003', vehicleId: 'EMS-03', crewLeader: 'EMT Abena', crew: ['EMT Abena', 'EMT Yaw'], status: 'Out of Service', currentLocation: 'Workshop — Brake repair', equipment: ['Basic Life Support', 'Oxygen', 'Stretcher'] },
  { id: 'AMB-004', vehicleId: 'AED-01', crewLeader: 'EMT Efua', crew: ['EMT Efua', 'Nurse Kofi'], status: 'Available', currentLocation: 'Hospital Bay', equipment: ['AED', 'First Aid Kit', 'Splints'] },
];

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-800', Dispatched: 'bg-blue-100 text-blue-800',
  'On Scene': 'bg-yellow-100 text-yellow-800', Transporting: 'bg-orange-100 text-orange-800',
  'At Hospital': 'bg-purple-100 text-purple-800', 'Out of Service': 'bg-red-100 text-red-800',
};
const STATUSES = ['Available', 'Dispatched', 'On Scene', 'Transporting', 'At Hospital', 'Out of Service'];

export default function AmbulanceDispatch() {
  const [records, setRecords] = useState<AmbulanceRecord[]>(INITIAL);
  const [filter, setFilter] = useState('');
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.status === filter);
  const available = records.filter((r) => r.status === 'Available').length;

  const updateStatus = (id: string, status: AmbulanceRecord['status']) => {
    setRecords(records.map((r) => r.id === id ? { ...r, status, currentLocation: status === 'Available' ? 'Hospital Bay' : r.currentLocation } : r));
    toast(`Ambulance status updated to ${status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Ambulance Dispatch</h1><p className="text-gray-500">Ambulance fleet management, dispatch tracking, and crew management</p></div>
        <div className="flex items-center gap-3">
          <Badge tone={available > 1 ? 'green' : available > 0 ? 'gold' : 'red'}>{available} Available</Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={`p-2 rounded-lg border text-center text-xs transition ${filter === s ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}>
            <div className="text-lg font-bold">{records.filter((r) => r.status === s).length}</div><div className="text-gray-500">{s}</div>
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div><h3 className="font-semibold text-lg">{r.vehicleId}</h3><p className="text-sm text-gray-500">Crew: {r.crew.join(', ')}</p></div>
              <Badge tone={STATUS_COLORS[r.status]?.includes('green') ? 'green' : STATUS_COLORS[r.status]?.includes('red') ? 'red' : STATUS_COLORS[r.status]?.includes('blue') ? 'blue' : 'gold'}>{r.status}</Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📍 {r.currentLocation}</div>
              {r.lastDispatch && <div>🚑 {r.lastDispatch} — Patient: {r.patientName}</div>}
              {r.dispatchTime && <div>🕐 Dispatched: {r.dispatchTime}</div>}
              <div className="flex flex-wrap gap-1 mt-1">{r.equipment.map((e) => <span key={e} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{e}</span>)}</div>
            </div>
            <div className="flex gap-1 mt-3">
              {r.status === 'Available' && <button onClick={() => updateStatus(r.id, 'Dispatched')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Dispatch</button>}
              {r.status === 'Dispatched' && <button onClick={() => updateStatus(r.id, 'On Scene')} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">On Scene</button>}
              {r.status === 'On Scene' && <button onClick={() => updateStatus(r.id, 'Transporting')} className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200">Transport</button>}
              {r.status === 'Transporting' && <button onClick={() => updateStatus(r.id, 'At Hospital')} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Arrived</button>}
              {r.status !== 'Available' && r.status !== 'Out of Service' && <button onClick={() => updateStatus(r.id, 'Available')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Clear</button>}
              {r.status !== 'Out of Service' && <button onClick={() => updateStatus(r.id, 'Out of Service')} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Out of Service</button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
