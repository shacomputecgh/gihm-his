import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DeathRecord {
  id: string; patientName: string; age: number; gender: string;
  dateOfDeath: string; timeOfDeath: string; causeOfDeath: string;
  certifiedBy: string; ward: string;
  status: 'Body in Morgue' | 'Claimed' | 'Autopsy Ordered' | 'Burial Arranged' | 'Cremated';
  nextOfKin: string; contactPhone: string;
  autopsyRequired: boolean; deathCertificateIssued: boolean;
}

const DEATH_RECORDS: DeathRecord[] = [
  { id: 'DC-001', patientName: 'Kwadwo Mensah', age: 78, gender: 'M', dateOfDeath: '2026-08-22', timeOfDeath: '03:45', causeOfDeath: 'Severe pneumonia with septic shock', certifiedBy: 'Dr. Sarah Johnson', ward: 'ICU', status: 'Claimed', nextOfKin: 'Abena Mensah (Daughter)', contactPhone: '+233241234567', autopsyRequired: false, deathCertificateIssued: true },
  { id: 'DC-002', patientName: 'Akua Asare', age: 65, gender: 'F', dateOfDeath: '2026-08-23', timeOfDeath: '14:20', causeOfDeath: 'Stroke with massive intracerebral haemorrhage', certifiedBy: 'Dr. Kofi Appiah', ward: 'Neurology', status: 'Body in Morgue', nextOfKin: 'Yaw Asare (Son)', contactPhone: '+233209876543', autopsyRequired: true, deathCertificateIssued: false },
  { id: 'DC-003', patientName: 'Nana Agyeman', age: 45, gender: 'M', dateOfDeath: '2026-08-21', timeOfDeath: '18:30', causeOfDeath: 'Road traffic accident — polytrauma', certifiedBy: 'Dr. Emmanuel Darko', ward: 'Emergency', status: 'Autopsy Ordered', nextOfKin: 'Efua Agyeman (Wife)', contactPhone: '+233261234567', autopsyRequired: true, deathCertificateIssued: false },
  { id: 'DC-004', patientName: 'Adwoa Nyarko', age: 82, gender: 'F', dateOfDeath: '2026-08-20', timeOfDeath: '22:15', causeOfDeath: 'End-stage heart failure', certifiedBy: 'Dr. Sarah Johnson', ward: 'Cardiology', status: 'Burial Arranged', nextOfKin: 'Kofi Nyarko (Son)', contactPhone: '+233249876543', autopsyRequired: false, deathCertificateIssued: true },
];

const STATUS_COLORS: Record<string, string> = {
  'Body in Morgue': 'bg-blue-100 text-blue-800', 'Claimed': 'bg-green-100 text-green-800',
  'Autopsy Ordered': 'bg-yellow-100 text-yellow-800', 'Burial Arranged': 'bg-purple-100 text-purple-800',
  'Cremated': 'bg-gray-100 text-gray-800',
};

const MORGUE_BEDS = [
  { id: 'MB-01', status: 'Occupied', patient: 'Akua Asare', since: '2026-08-23' },
  { id: 'MB-02', status: 'Occupied', patient: 'Nana Agyeman', since: '2026-08-21' },
  { id: 'MB-03', status: 'Vacant', patient: '', since: '' },
  { id: 'MB-04', status: 'Vacant', patient: '', since: '' },
  { id: 'MB-05', status: 'Occupied', patient: 'Kwaku Boakye', since: '2026-08-19' },
  { id: 'MB-06', status: 'Vacant', patient: '', since: '' },
];

export default function MortuaryManagement() {
  const [selected, setSelected] = useState<DeathRecord | null>(DEATH_RECORDS[0] ?? null);
  const [tab, setTab] = useState<'records' | 'morgue' | 'stats'>('records');
  const occupiedBeds = MORGUE_BEDS.filter(b => b.status === 'Occupied').length;
  const pendingCerts = DEATH_RECORDS.filter(r => !r.deathCertificateIssued).length;

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
          title="Add New Mortuary Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Mortuary Management</h1><p className="text-gray-500">Death records, morgue bed tracking, autopsy coordination, death certificates, and funeral arrangements</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Deaths (This Month)', value: DEATH_RECORDS.length, color: 'text-red-600' }, { label: 'Morgue Occupied', value: `${occupiedBeds}/${MORGUE_BEDS.length}`, color: 'text-blue-600' }, { label: 'Pending Certificates', value: pendingCerts, color: 'text-yellow-600' }, { label: 'Autopsies Ordered', value: DEATH_RECORDS.filter(r => r.autopsyRequired).length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['records', 'morgue', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'records' ? 'Death Records' : t === 'morgue' ? 'Morgue Beds' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'records' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {DEATH_RECORDS.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === r.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{r.patientName}</span>
                  <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>{r.age}/{r.gender === 'M' ? 'Male' : 'Female'} | Ward: {r.ward}</div>
                  <div>Died: {r.dateOfDeath} at {r.timeOfDeath}</div>
                  <div className="text-red-600">{r.causeOfDeath}</div>
                </div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">ID: {selected.id} | {selected.age}/{selected.gender === 'M' ? 'Male' : 'Female'}</p></div>
                <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Date of Death</div><div className="font-bold">{selected.dateOfDeath}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Time of Death</div><div className="font-bold">{selected.timeOfDeath}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Ward</div><div className="font-bold">{selected.ward}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Certified By</div><div className="font-bold text-sm">{selected.certifiedBy}</div></div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3"><div className="text-xs text-red-600 font-semibold mb-1">Cause of Death</div><div className="text-sm">{selected.causeOfDeath}</div></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Next of Kin</div><div className="font-bold text-sm">{selected.nextOfKin}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Contact</div><div className="font-bold text-sm">{selected.contactPhone}</div></div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${selected.autopsyRequired ? 'bg-yellow-500' : 'bg-green-500'}`} /> Autopsy: {selected.autopsyRequired ? 'Required' : 'Not Required'}</div>
                <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${selected.deathCertificateIssued ? 'bg-green-500' : 'bg-red-500'}`} /> Certificate: {selected.deathCertificateIssued ? 'Issued' : 'Pending'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'morgue' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MORGUE_BEDS.map(b => (
            <div key={b.id} className={`rounded-lg border p-4 ${b.status === 'Occupied' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Bed {b.id}</span>
                <Badge className={b.status === 'Occupied' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>{b.status}</Badge>
              </div>
              {b.patient && <div className="text-sm"><div className="font-medium">{b.patient}</div><div className="text-xs text-gray-500">Since: {b.since}</div></div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Status Distribution</h3>
            {Object.keys(STATUS_COLORS).map(s => (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{DEATH_RECORDS.filter(r => r.status === s).length}</span></div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Morgue Capacity</h3>
            <div className="text-center"><div className="text-4xl font-bold text-blue-600">{occupiedBeds}/{MORGUE_BEDS.length}</div><div className="text-sm text-gray-500">beds occupied ({Math.round((occupiedBeds/MORGUE_BEDS.length)*100)}%)</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
