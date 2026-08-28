import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface BirthRecord {
  id: string; babyName: string; motherName: string; fatherName: string;
  dateOfBirth: string; timeOfBirth: string; sex: string;
  birthWeight: string; apgarScore: string; deliveredBy: string;
  modeOfDelivery: string; certificateIssued: boolean;
}

interface VitalStats {
  month: string; births: number; deaths: number; maleRatio: number;
  liveBirths: number; stillBirths: number;
}

const BIRTH_RECORDS: BirthRecord[] = [
  { id: 'BR-001', babyName: 'Kofi Asante', motherName: 'Akua Asante', fatherName: 'Kwame Asante', dateOfBirth: '2026-08-22', timeOfBirth: '06:30', sex: 'M', birthWeight: '3.2 kg', apgarScore: '9/10', deliveredBy: 'Midwife Grace Amoah', modeOfDelivery: 'Normal Vaginal Delivery', certificateIssued: true },
  { id: 'BR-002', babyName: 'Ama Mensah', motherName: 'Efua Mensah', fatherName: 'Yaw Mensah', dateOfBirth: '2026-08-23', timeOfBirth: '14:15', sex: 'F', birthWeight: '2.8 kg', apgarScore: '8/10', deliveredBy: 'Dr. Sarah Johnson', modeOfDelivery: 'Emergency Caesarean', certificateIssued: false },
  { id: 'BR-003', babyName: 'Kwaku Osei', motherName: 'Ama Osei', fatherName: 'Nana Osei', dateOfBirth: '2026-08-24', timeOfBirth: '02:45', sex: 'M', birthWeight: '3.5 kg', apgarScore: '9/10', deliveredBy: 'Midwife Grace Amoah', modeOfDelivery: 'Normal Vaginal Delivery', certificateIssued: false },
];

const MONTHLY_STATS: VitalStats[] = [
  { month: 'August 2026', births: 45, deaths: 3, maleRatio: 51, liveBirths: 43, stillBirths: 2 },
  { month: 'July 2026', births: 52, deaths: 5, maleRatio: 48, liveBirths: 50, stillBirths: 2 },
  { month: 'June 2026', births: 48, deaths: 4, maleRatio: 52, liveBirths: 46, stillBirths: 2 },
];

export default function DeathBirthRecords() {
  const [tab, setTab] = useState<'births' | 'stats' | 'monthly'>('births');
  const totalBirths = BIRTH_RECORDS.length;
  const pendingCerts = BIRTH_RECORDS.filter(r => !r.certificateIssued).length;

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
          title="Add New Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Death & Birth Records</h1><p className="text-gray-500">Birth certificate management, vital statistics, death records, and civil registration</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Births (This Month)', value: totalBirths, color: 'text-blue-600' }, { label: 'Pending Certificates', value: pendingCerts, color: 'text-yellow-600' }, { label: 'Male', value: BIRTH_RECORDS.filter(r => r.sex === 'M').length, color: 'text-green-600' }, { label: 'Female', value: BIRTH_RECORDS.filter(r => r.sex === 'F').length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['births', 'monthly', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'births' ? 'Recent Births' : t === 'monthly' ? 'Monthly Stats' : 'Overview'}</button>
        ))}
      </div>

      {tab === 'births' && (
        <div className="space-y-3">
          {BIRTH_RECORDS.map(r => (
            <div key={r.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.babyName}</span><Badge className={r.sex === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}>{r.sex === 'M' ? 'Male' : 'Female'}</Badge></div>
                <Badge className={r.certificateIssued ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.certificateIssued ? 'Certificate Issued' : 'Certificate Pending'}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><span className="text-gray-500">Mother:</span> {r.motherName}</div>
                <div><span className="text-gray-500">Father:</span> {r.fatherName}</div>
                <div><span className="text-gray-500">Born:</span> {r.dateOfBirth} at {r.timeOfBirth}</div>
                <div><span className="text-gray-500">Weight:</span> {r.birthWeight}</div>
                <div><span className="text-gray-500">APGAR:</span> {r.apgarScore}</div>
                <div><span className="text-gray-500">Delivery:</span> {r.modeOfDelivery}</div>
                <div><span className="text-gray-500">Delivered By:</span> {r.deliveredBy}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'monthly' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Month</th><th className="p-3">Births</th><th className="p-3">Deaths</th><th className="p-3">Live Births</th><th className="p-3">Still Births</th><th className="p-3">Male %</th></tr></thead>
            <tbody>{MONTHLY_STATS.map(s => (
              <tr key={s.month} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{s.month}</td><td className="p-3 text-blue-600 font-bold">{s.births}</td><td className="p-3 text-red-600 font-bold">{s.deaths}</td><td className="p-3">{s.liveBirths}</td><td className="p-3">{s.stillBirths}</td><td className="p-3">{s.maleRatio}%</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">This Month Summary</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Total Births</span><span className="font-bold text-blue-600">{MONTHLY_STATS[0]?.births ?? 0}</span></div><div className="flex justify-between"><span>Live Births</span><span className="font-bold text-green-600">{MONTHLY_STATS[0]?.liveBirths ?? 0}</span></div><div className="flex justify-between"><span>Still Births</span><span className="font-bold text-red-600">{MONTHLY_STATS[0]?.stillBirths ?? 0}</span></div><div className="flex justify-between"><span>Deaths</span><span className="font-bold text-red-600">{MONTHLY_STATS[0]?.deaths ?? 0}</span></div></div></div>
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">Delivery Modes</h3><div className="space-y-2 text-sm">{['Normal Vaginal Delivery', 'Emergency Caesarean', 'Elective Caesarean'].map(m => <div key={m} className="flex justify-between"><span>{m}</span><span className="font-bold">{BIRTH_RECORDS.filter(r => r.modeOfDelivery === m).length}</span></div>)}</div></div>
        </div>
      )}
    </div>
  );
}
