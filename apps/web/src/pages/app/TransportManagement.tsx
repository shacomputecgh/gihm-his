import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Ambulance {
  id: string; plateNumber: string; type: string;
  status: 'Available' | 'On Call' | 'In Service' | 'Maintenance';
  currentLocation: string; lastService: string; nextService: string;
}

interface Transfer {
  id: string; patientName: string; from: string; to: string;
  type: string; requestedBy: string; date: string;
  status: 'Pending' | 'En Route' | 'Completed' | 'Cancelled';
  ambulanceId?: string;
}

const AMBULANCES: Ambulance[] = [
  { id: 'AMB-001', plateNumber: 'GR-1234-20', type: 'ALS (Advanced Life Support)', status: 'In Service', currentLocation: 'Emergency — En route to Community 5', lastService: '2026-08-15', nextService: '2026-09-15' },
  { id: 'AMB-002', plateNumber: 'GR-5678-20', type: 'BLS (Basic Life Support)', status: 'Available', currentLocation: 'Hospital Garage', lastService: '2026-08-20', nextService: '2026-09-20' },
  { id: 'AMB-003', plateNumber: 'GR-9012-20', type: 'MICU (Mobile ICU)', status: 'On Call', currentLocation: 'Hospital Garage', lastService: '2026-08-10', nextService: '2026-09-10' },
  { id: 'AMB-004', plateNumber: 'GR-3456-20', type: 'BLS (Basic Life Support)', status: 'Maintenance', currentLocation: 'Workshop', lastService: '2026-08-22', nextService: '2026-08-25' },
];

const TRANSFERS: Transfer[] = [
  { id: 'TR-001', patientName: 'Kwame Asante', from: 'Hospital A — Accra', to: 'Korle Bu Teaching Hospital', type: 'Inter-facility Transfer', requestedBy: 'Dr. Sarah Johnson', date: '2026-08-24', status: 'En Route', ambulanceId: 'AMB-001' },
  { id: 'TR-002', patientName: 'Akua Mensah', from: 'Ward C12', to: 'Radiology (MRI)', type: 'Internal Transfer', requestedBy: 'Nurse Abena', date: '2026-08-24', status: 'Pending' },
  { id: 'TR-003', patientName: 'Yaw Boateng', from: 'Emergency', to: 'Theatre 1', type: 'Emergency Transfer', requestedBy: 'Dr. Kofi Appiah', date: '2026-08-24', status: 'Completed', ambulanceId: 'AMB-003' },
];

const STATUS_COLORS: Record<string, string> = { Available: 'bg-green-100 text-green-800', 'On Call': 'bg-yellow-100 text-yellow-800', 'In Service': 'bg-blue-100 text-blue-800', Maintenance: 'bg-red-100 text-red-800', Pending: 'bg-gray-100 text-gray-800', 'En Route': 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' };

export default function TransportManagement() {
  const [tab, setTab] = useState<'fleet' | 'transfers' | 'stats'>('fleet');

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
          title="Add New Transport Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Transport Management</h1><p className="text-gray-500">Ambulance fleet management, patient transfers, and vehicle maintenance tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Fleet Size', value: AMBULANCES.length, color: 'text-blue-600' }, { label: 'Available', value: AMBULANCES.filter(a => a.status === 'Available').length, color: 'text-green-600' }, { label: 'Active Transfers', value: TRANSFERS.filter(t => t.status === 'En Route' || t.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'In Maintenance', value: AMBULANCES.filter(a => a.status === 'Maintenance').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['fleet', 'transfers', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'fleet' ? 'Ambulance Fleet' : t === 'transfers' ? 'Patient Transfers' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AMBULANCES.map(a => (
            <div key={a.id} className={`bg-white rounded-lg border p-4 ${a.status === 'Available' ? 'border-green-200' : a.status === 'Maintenance' ? 'border-red-200' : 'border-blue-200'}`}>
              <div className="flex items-center justify-between mb-2"><span className="font-bold">🚑 {a.plateNumber}</span><Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge></div>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-500">Type:</span> {a.type}</div>
                <div><span className="text-gray-500">Location:</span> {a.currentLocation}</div>
                <div className="flex gap-4"><span className="text-xs text-gray-500">Last Service: {a.lastService}</span><span className="text-xs text-gray-500">Next: {a.nextService}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'transfers' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Patient</th><th className="p-3">From</th><th className="p-3">To</th><th className="p-3">Type</th><th className="p-3">Ambulance</th><th className="p-3">Status</th></tr></thead>
            <tbody>{TRANSFERS.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{t.id}</td><td className="p-3 font-medium">{t.patientName}</td><td className="p-3 text-xs">{t.from}</td><td className="p-3 text-xs">{t.to}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{t.type}</Badge></td><td className="p-3 font-mono text-xs">{t.ambulanceId || '—'}</td><td className="p-3"><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">Fleet Status</h3>{['Available', 'On Call', 'In Service', 'Maintenance'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{AMBULANCES.filter(a => a.status === s).length}</span></div>)}</div>
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">Transfer Status</h3>{['Pending', 'En Route', 'Completed', 'Cancelled'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{TRANSFERS.filter(t => t.status === s).length}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
