import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface HomeVisit {
  id: string; patientName: string; address: string; condition: string;
  visitType: string; assignedTo: string; scheduledDate: string; scheduledTime: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low';
  lastVisit: string; nextVisit: string;
  vitals: { bp: string; hr: number; temp: number; weight: number; bloodGlucose?: number };
  notes: string;
}

const HOME_VISITS: HomeVisit[] = [
  { id: 'HV-001', patientName: 'Abena Koomson', address: '12 Nima Road, Accra', condition: 'Post-stroke rehabilitation', visitType: 'Physiotherapy', assignedTo: 'Nurse Ama Mensah', scheduledDate: '2026-08-25', scheduledTime: '09:00', status: 'Scheduled', priority: 'High', lastVisit: '2026-08-18', nextVisit: '2026-08-25', vitals: { bp: '140/90', hr: 78, temp: 36.6, weight: 72 }, notes: 'Patient making slow progress. Needs daily exercises. Family trained on basic physio.' },
  { id: 'HV-002', patientName: 'Kwaku Frimpong', address: '54 Osu Oxford St, Accra', condition: 'Diabetic wound care', visitType: 'Wound Dressing', assignedTo: 'Nurse Kofi Appiah', scheduledDate: '2026-08-24', scheduledTime: '10:30', status: 'In Progress', priority: 'High', lastVisit: '2026-08-24', nextVisit: '2026-08-27', vitals: { bp: '130/80', hr: 82, temp: 36.8, weight: 85, bloodGlucose: 11.2 }, notes: 'Diabetic foot ulcer — Wagner Grade 2. Wound improving. Continue hydrofiber dressing.' },
  { id: 'HV-003', patientName: 'Akua Mensah', address: '23 East Legon, Accra', condition: 'Palliative care — metastatic breast cancer', visitType: 'Palliative Review', assignedTo: 'Dr. Sarah Johnson', scheduledDate: '2026-08-26', scheduledTime: '14:00', status: 'Scheduled', priority: 'High', lastVisit: '2026-08-19', nextVisit: '2026-08-26', vitals: { bp: '100/60', hr: 95, temp: 37.2, weight: 52 }, notes: 'Pain well controlled on oral morphine. Family coping. Review advance care plan.' },
  { id: 'HV-004', patientName: 'Nana Agyeman', address: '8 Tema Community 7', condition: 'Hypertension management', visitType: 'BP Monitoring', assignedTo: 'Nurse Efua Owusu', scheduledDate: '2026-08-24', scheduledTime: '11:00', status: 'Completed', priority: 'Medium', lastVisit: '2026-08-24', nextVisit: '2026-09-07', vitals: { bp: '128/82', hr: 72, temp: 36.5, weight: 78 }, notes: 'BP well controlled. Continue Amlodipine 5mg. Diet compliance good.' },
  { id: 'HV-005', patientName: 'Adwoa Serwaa', address: '31 Madina Estate, Accra', condition: 'Pregnancy — 36 weeks', visitType: 'Antenatal', assignedTo: 'Midwife Grace Amoah', scheduledDate: '2026-08-28', scheduledTime: '08:30', status: 'Scheduled', priority: 'Medium', lastVisit: '2026-08-21', nextVisit: '2026-08-28', vitals: { bp: '115/70', hr: 88, temp: 36.7, weight: 68 }, notes: 'Baby in cephalic presentation. FH 34cm. Fetal heart 144bpm. No oedema.' },
  { id: 'HV-006', patientName: 'Yaw Boateng', address: '67 Spintex Road, Tema', condition: 'Elderly care — Dementia', visitType: 'Caregiver Support', assignedTo: 'Social Worker Esi Darko', scheduledDate: '2026-08-27', scheduledTime: '15:00', status: 'Scheduled', priority: 'Low', lastVisit: '2026-08-13', nextVisit: '2026-08-27', vitals: { bp: '145/85', hr: 76, temp: 36.4, weight: 65 }, notes: 'MMSE 18/30. Caregiver burnout assessed — referred to support group. Medication review needed.' },
];

const PRIORITY_COLORS: Record<string, string> = { High: 'bg-red-100 text-red-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };
const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'In Progress': 'bg-orange-100 text-orange-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-gray-100 text-gray-800' };

const PROGRAMMES = [
  { name: 'Chronic Disease Home Monitoring', enrolled: 45, active: 38, icon: '🩺' },
  { name: 'Post-Surgical Follow-up', enrolled: 22, active: 18, icon: '🏥' },
  { name: 'Maternal & Child Health', enrolled: 35, active: 30, icon: '👶' },
  { name: 'Elderly & Dementia Care', enrolled: 18, active: 15, icon: '🧓' },
  { name: 'Palliative Care at Home', enrolled: 12, active: 10, icon: '🕊️' },
  { name: 'TB DOTS Community', enrolled: 28, active: 25, icon: '💊' },
  { name: 'HIV Community Support', enrolled: 32, active: 28, icon: '🎗️' },
];

export default function CommunityHealthHomeCare() {
  const [selected, setSelected] = useState<HomeVisit | null>(HOME_VISITS[0] ?? null);
  const [tab, setTab] = useState<'visits' | 'programmes' | 'stats'>('visits');
  const totalEnrolled = PROGRAMMES.reduce((s, p) => s + p.enrolled, 0);
  const totalActive = PROGRAMMES.reduce((s, p) => s + p.active, 0);

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
          title="Add New Home Care Visit"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Community Health & Home Care</h1><p className="text-gray-500">Home visit scheduling, community outreach programmes, chronic disease management, and patient follow-up</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Scheduled Visits', value: HOME_VISITS.filter(v => v.status === 'Scheduled').length, color: 'text-blue-600' }, { label: 'In Progress', value: HOME_VISITS.filter(v => v.status === 'In Progress').length, color: 'text-orange-600' }, { label: 'Total Enrolled', value: totalEnrolled, color: 'text-green-600' }, { label: 'Active Patients', value: totalActive, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['visits', 'programmes', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'visits' ? 'Home Visits' : t === 'programmes' ? 'Programmes' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'visits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {HOME_VISITS.map(v => (
              <div key={v.id} onClick={() => setSelected(v)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === v.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{v.patientName}</span>
                  <Badge className={PRIORITY_COLORS[v.priority]}>{v.priority}</Badge>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>{v.condition}</div>
                  <div className="flex justify-between"><span>{v.visitType}</span><Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge></div>
                  <div>Scheduled: {v.scheduledDate} at {v.scheduledTime}</div>
                </div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.address}</p></div>
                <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Condition</div><div className="font-bold text-sm">{selected.condition}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Visit Type</div><div className="font-bold text-sm">{selected.visitType}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Assigned To</div><div className="font-bold text-sm">{selected.assignedTo}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Priority</div><div className="font-bold text-sm"><Badge className={PRIORITY_COLORS[selected.priority]}>{selected.priority}</Badge></div></div>
              </div>
              <div><h4 className="font-semibold text-sm mb-2">Vital Signs</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitals.bp}</div><div className="text-xs text-gray-500">BP</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitals.hr}</div><div className="text-xs text-gray-500">HR</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitals.temp}°C</div><div className="text-xs text-gray-500">Temp</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitals.weight}kg</div><div className="text-xs text-gray-500">Weight</div></div>
                  {selected.vitals.bloodGlucose && <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitals.bloodGlucose}</div><div className="text-xs text-gray-500">BG (mmol/L)</div></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Last Visit:</span> <span className="font-medium">{selected.lastVisit}</span></div>
                <div><span className="text-gray-500">Next Visit:</span> <span className="font-medium">{selected.nextVisit}</span></div>
              </div>
              <div><h4 className="font-semibold text-sm mb-1">Clinical Notes</h4><p className="text-sm bg-blue-50 border border-blue-200 rounded p-2">{selected.notes}</p></div>
            </div>
          )}
        </div>
      )}

      {tab === 'programmes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROGRAMMES.map(p => (
            <div key={p.name} className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3"><span className="text-2xl">{p.icon}</span><h3 className="font-semibold text-sm">{p.name}</h3></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Enrolled</span><span className="font-bold">{p.enrolled}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Active</span><span className="font-bold text-green-600">{p.active}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${(p.active/p.enrolled)*100}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Visit Status Distribution</h3>
            {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(s => (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0">
                <Badge className={STATUS_COLORS[s]}>{s}</Badge>
                <span className="font-bold">{HOME_VISITS.filter(v => v.status === s).length}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Priority Distribution</h3>
            {['High', 'Medium', 'Low'].map(p => (
              <div key={p} className="flex items-center justify-between py-2 border-b last:border-0">
                <Badge className={PRIORITY_COLORS[p]}>{p} Priority</Badge>
                <span className="font-bold">{HOME_VISITS.filter(v => v.priority === p).length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
