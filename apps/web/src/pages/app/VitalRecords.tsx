import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type VitalTab = 'births' | 'deaths' | 'analytics';

interface BirthRecord {
  id: string;
  date: string;
  time: string;
  babyName: string;
  sex: 'male' | 'female';
  weight: number;
  length: number;
  apgar1: number;
  apgar5: number;
  motherName: string;
  motherAge: number;
  fatherName: string;
  deliveryType: 'normal' | 'caesarean' | 'assisted';
  gestationalAge: string;
  complications: string[];
  attendant: string;
  registeredBy: string;
  certificateIssued: boolean;
}

interface DeathRecord {
  id: string;
  date: string;
  time: string;
  patientName: string;
  age: number;
  gender: string;
  mrn: string;
  causeOfDeath: string;
  underlyingCause: string;
  contributingFactors: string[];
  timeOfDeath: string;
  pronouncedBy: string;
  department: string;
  postMortemRequired: boolean;
  postMortemDone: boolean;
  certificateIssued: boolean;
  nextOfKin: string;
  relationship: string;
  burialPermit: boolean;
}

const MOCK_BIRTHS: BirthRecord[] = [
  { id: 'BIRTH001', date: '2026-05-23', time: '02:15', babyName: 'Baby Boy Osei', sex: 'male', weight: 3.5, length: 50, apgar1: 9, apgar5: 10, motherName: 'Akua Osei', motherAge: 28, fatherName: 'Kwaku Osei', deliveryType: 'normal', gestationalAge: '40 weeks', complications: [], attendant: 'Dr. Nana Agyeman', registeredBy: 'Midwife Abena', certificateIssued: true },
  { id: 'BIRTH002', date: '2026-05-22', time: '15:30', babyName: 'Baby Girl Mensah', sex: 'female', weight: 3.2, length: 49, apgar1: 8, apgar5: 9, motherName: 'Efua Mensah', motherAge: 32, fatherName: 'Yaw Mensah', deliveryType: 'normal', gestationalAge: '39 weeks', complications: [], attendant: 'Dr. Nana Agyeman', registeredBy: 'Midwife Abena', certificateIssued: true },
  { id: 'BIRTH003', date: '2026-05-22', time: '08:45', babyName: 'Baby Boy Koomson', sex: 'male', weight: 2.8, length: 47, apgar1: 7, apgar5: 8, motherName: 'Ama Koomson', motherAge: 35, fatherName: 'Samuel Koomson', deliveryType: 'caesarean', gestationalAge: '37 weeks', complications: ['Prematurity', 'Low birth weight'], attendant: 'Dr. Boateng', registeredBy: 'Midwife Abena', certificateIssued: true },
  { id: 'BIRTH004', date: '2026-05-21', time: '22:00', babyName: 'Baby Girl Amoah', sex: 'female', weight: 3.8, length: 51, apgar1: 6, apgar5: 8, motherName: 'Adwoa Amoah', motherAge: 25, fatherName: 'Kofi Amoah', deliveryType: 'assisted', gestationalAge: '41 weeks', complications: ['Meconium-stained liquor', 'Fetal distress', 'Assisted delivery (vacuum)'], attendant: 'Dr. Nana Agyeman', registeredBy: 'Midwife Abena', certificateIssued: true },
];

const MOCK_DEATHS: DeathRecord[] = [
  { id: 'DEATH001', date: '2026-05-22', time: '14:30', patientName: 'Nana Akua', age: 78, gender: 'Female', mrn: 'MRN-007890', causeOfDeath: 'Cardiorespiratory arrest', underlyingCause: 'Severe pneumonia with multi-organ failure', contributingFactors: ['Type 2 Diabetes', 'Chronic Kidney Disease', 'Hypertension'], timeOfDeath: '14:25', pronouncedBy: 'Dr. Mensah', department: 'ICU', postMortemRequired: false, postMortemDone: false, certificateIssued: true, nextOfKin: 'Kwame Akua', relationship: 'Son', burialPermit: true },
  { id: 'DEATH002', date: '2026-05-20', time: '03:15', patientName: 'Kofi Mensah', age: 45, gender: 'Male', mrn: 'MRN-006543', causeOfDeath: 'Massive pulmonary embolism', underlyingCause: 'Post-surgical complication — bilateral leg fractures', contributingFactors: ['Immobility', 'Obesity', 'Smoking history'], timeOfDeath: '03:10', pronouncedBy: 'Dr. Boateng', department: 'Surgical Ward', postMortemRequired: true, postMortemDone: true, certificateIssued: true, nextOfKin: 'Abena Mensah', relationship: 'Wife', burialPermit: true },
  { id: 'DEATH003', date: '2026-05-18', time: '22:45', patientName: 'Baby Boy Tetteh', age: 0, gender: 'Male', mrn: 'MRN-009012', causeOfDeath: 'Severe respiratory distress syndrome', underlyingCause: 'Extreme prematurity (26 weeks)', contributingFactors: ['Low birth weight', 'Intraventricular haemorrhage', 'Necrotising enterocolitis'], timeOfDeath: '22:40', pronouncedBy: 'Dr. Osei', department: 'NICU', postMortemRequired: true, postMortemDone: false, certificateIssued: true, nextOfKin: 'Ama Tetteh', relationship: 'Mother', burialPermit: true },
];

export default function VitalRecords() {
  const [tab, setTab] = useState<VitalTab>('births');

  const todayBirths = MOCK_BIRTHS.filter(b => b.date === '2026-05-23').length;
  const todayDeaths = MOCK_DEATHS.filter(d => d.date === '2026-05-23').length;

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
          title="Add New Vital Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Birth & Death Records" subtitle="Vital records registration, certificates, and mortality tracking" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-pink-600">{MOCK_BIRTHS.length}</div><div className="text-xs text-slate-500">Total Births</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{todayBirths}</div><div className="text-xs text-slate-500">Today's Births</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_DEATHS.length}</div><div className="text-xs text-slate-500">Total Deaths</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-slate-600">{todayDeaths}</div><div className="text-xs text-slate-500">Today's Deaths</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['births', 'deaths', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'births' ? `👶 Births (${MOCK_BIRTHS.length})` : t === 'deaths' ? `🕊️ Deaths (${MOCK_DEATHS.length})` : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Births Tab */}
      {tab === 'births' && (
        <div className="space-y-3">
          {MOCK_BIRTHS.map(b => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{b.sex === 'male' ? '👦' : '👧'}</span>
                    <h3 className="font-bold text-slate-800">{b.babyName}</h3>
                    <Badge tone={b.sex === 'male' ? 'blue' : 'gold'}>{b.sex.toUpperCase()}</Badge>
                    {b.certificateIssued && <Badge tone="green">📋 Certificate</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>📅 {b.date} {b.time}</span>
                    <span>⚖️ {b.weight} kg</span>
                    <span>📏 {b.length} cm</span>
                    <span>🫀 APGAR: {b.apgar1}/{b.apgar5}</span>
                    <span>🕐 GA: {b.gestationalAge}</span>
                    <span>👶 {b.deliveryType}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Mother: <strong>{b.motherName}</strong> ({b.motherAge} yrs) · Father: <strong>{b.fatherName}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400">Attendant: {b.attendant} · Registered by: {b.registeredBy}</div>
                  {b.complications.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.complications.map(c => <span key={c} className="rounded bg-red-50 px-1.5 text-[10px] font-medium text-red-600">⚠️ {c}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          <Button className="bg-pink-600 hover:bg-pink-700">➕ Register New Birth</Button>
        </div>
      )}

      {/* Deaths Tab */}
      {tab === 'deaths' && (
        <div className="space-y-3">
          {MOCK_DEATHS.map(d => (
            <Card key={d.id} className="p-4 border-l-4 border-red-400">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕊️</span>
                  <h3 className="font-bold text-slate-800">{d.patientName}</h3>
                  <Badge tone="red">DECEASED</Badge>
                  {d.certificateIssued && <Badge tone="green">📋 Certificate</Badge>}
                  {d.postMortemRequired && <Badge tone={d.postMortemDone ? 'green' : 'gold'}>{d.postMortemDone ? '🔬 PM Done' : '🔬 PM Required'}</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>📅 {d.date}</span>
                  <span>🕐 Time of death: {d.timeOfDeath}</span>
                  <span>👤 {d.age} yrs · {d.gender}</span>
                  <span>🏥 {d.department}</span>
                  <span>📋 MRN: {d.mrn}</span>
                </div>
                <div className="mt-2 rounded-lg bg-red-50 p-2">
                  <div className="text-xs"><span className="font-bold text-red-700">Cause of Death:</span> <span className="text-red-600">{d.causeOfDeath}</span></div>
                  <div className="text-xs mt-1"><span className="font-bold text-slate-600">Underlying:</span> {d.underlyingCause}</div>
                  {d.contributingFactors.length > 0 && (
                    <div className="text-xs mt-1"><span className="font-bold text-slate-600">Contributing:</span> {d.contributingFactors.join(', ')}</div>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Pronounced by: <strong>{d.pronouncedBy}</strong> · Next of Kin: <strong>{d.nextOfKin}</strong> ({d.relationship})
                  {d.burialPermit && <span className="ml-2 text-green-600">✅ Burial Permit Issued</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Mortality Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Total Deaths (This Period)</span><span className="font-bold text-red-600">{MOCK_DEATHS.length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Male Deaths</span><span className="font-bold">{MOCK_DEATHS.filter(d => d.gender === 'Male').length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Female Deaths</span><span className="font-bold">{MOCK_DEATHS.filter(d => d.gender === 'Female').length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slace-600">Neonatal Deaths</span><span className="font-bold">{MOCK_DEATHS.filter(d => d.age === 0).length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Post-Mortem Required</span><span className="font-bold">{MOCK_DEATHS.filter(d => d.postMortemRequired).length}</span></div>
              <div className="flex justify-between text-xs py-1"><span className="text-slate-600">Certificates Issued</span><span className="font-bold text-green-600">{MOCK_DEATHS.filter(d => d.certificateIssued).length}</span></div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Birth Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Total Births (This Period)</span><span className="font-bold text-pink-600">{MOCK_BIRTHS.length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Male</span><span className="font-bold">{MOCK_BIRTHS.filter(b => b.sex === 'male').length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Female</span><span className="font-bold">{MOCK_BIRTHS.filter(b => b.sex === 'female').length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Normal Delivery</span><span className="font-bold">{MOCK_BIRTHS.filter(b => b.deliveryType === 'normal').length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Caesarean Section</span><span className="font-bold">{MOCK_BIRTHS.filter(b => b.deliveryType === 'caesarean').length}</span></div>
              <div className="flex justify-between text-xs py-1 border-b"><span className="text-slate-600">Average Birth Weight</span><span className="font-bold">{(MOCK_BIRTHS.reduce((s, b) => s + b.weight, 0) / MOCK_BIRTHS.length).toFixed(2)} kg</span></div>
              <div className="flex justify-between text-xs py-1"><span className="text-slate-600">Certificates Issued</span><span className="font-bold text-green-600">{MOCK_BIRTHS.filter(b => b.certificateIssued).length}</span></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
