import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

const PATIENTS = [
  { id: 'PT001', name: 'Kwame Asante', mrn: 'MRN-001234', dob: '1990-03-15', age: 36, gender: 'Male', bloodGroup: 'O+', genotype: 'AS', phone: '024-123-4567', insurance: 'NHIS', allergies: ['Penicillin', 'Sulfa drugs'], conditions: ['Essential Hypertension', 'Type 2 Diabetes'], lastVisit: '2026-05-23', visits: 12, admissions: 1, surgeries: 0, prescriptions: 8, labTests: 15, imaging: 3, medications: ['Amlodipine 5mg OD', 'Metformin 500mg BD', 'Enalapril 10mg BD'], recentLabs: [{ test: 'FBC', date: '2026-05-22', result: 'Hb 12.8, WBC 6.5', status: 'normal' }, { test: 'FBS', date: '2026-05-22', result: '8.2 mmol/L', status: 'elevated' }], recentEncounters: [{ date: '2026-05-23', type: 'Ward Round', dept: 'Medical', doctor: 'Dr. Mensah', notes: 'BP 142/88 improving.' }, { date: '2026-05-20', type: 'Admission', dept: 'Emergency', doctor: 'Dr. Mensah', notes: 'Admitted with severe headache.' }] },
  { id: 'PT002', name: 'Ama Darko', mrn: 'MRN-002345', dob: '1985-07-22', age: 40, gender: 'Female', bloodGroup: 'A+', genotype: 'AA', phone: '020-987-6543', insurance: 'Private', allergies: ['Aspirin'], conditions: [], lastVisit: '2026-05-23', visits: 3, admissions: 1, surgeries: 1, prescriptions: 5, labTests: 8, imaging: 2, medications: ['Paracetamol 1g QDS PRN', 'Omeprazole 20mg OD'], recentLabs: [{ test: 'FBC', date: '2026-05-23', result: 'Hb 10.2, WBC 12.5', status: 'elevated' }], recentEncounters: [{ date: '2026-05-23', type: 'Post-Op', dept: 'Surgical', doctor: 'Dr. Boateng', notes: 'Day 0 post lap appendectomy.' }] },
];

export default function MedicalRecordsSummary() {
  const [sel, setSel] = useState(PATIENTS[0]!.id);
  const [tab, setTab] = useState<'overview' | 'encounters' | 'labs' | 'medications'>('overview');
  const p = PATIENTS.find(x => x.id === sel);

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
          title="Add New Medical Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Medical Records Summary" subtitle="Comprehensive patient record — all clinical data in one view" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-2">
          {PATIENTS.map(pt => (
            <div key={pt.id} className={`cursor-pointer rounded-xl border p-3 transition-all ${sel === pt.id ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setSel(pt.id)}>
              <h3 className="font-bold text-sm">{pt.name}</h3>
              <div className="text-[10px] text-slate-500">{pt.mrn} · {pt.gender} · {pt.age}yrs</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-3 space-y-4">
          {p && (
            <>
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{p.name}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>MRN: <strong>{p.mrn}</strong></span><span>DOB: {p.dob}</span><span>{p.gender}</span><span>Blood: {p.bloodGroup} ({p.genotype})</span><span>Insurance: {p.insurance}</span>
                    </div>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-xs">🖨️ Print</Button>
                </div>
                <div className="mt-2 flex gap-4">
                  {([{ label: 'Visits', val: p.visits, color: 'text-blue-600' }, { label: 'Admissions', val: p.admissions, color: 'text-amber-600' }, { label: 'Surgeries', val: p.surgeries, color: 'text-purple-600' }, { label: 'Labs', val: p.labTests, color: 'text-cyan-600' }].map((x, i) => (
                    <div key={i} className="text-center"><div className={`text-2xl font-bold ${x.color}`}>{x.val}</div><div className="text-[10px] text-slate-400">{x.label}</div></div>
                  )))}
                </div>
              </Card>
              <div className="flex gap-2">
                {(['overview', 'encounters', 'labs', 'medications'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
              {tab === 'overview' && (
                <div className="space-y-3">
                  {p.conditions.length > 0 && <div className="rounded-lg bg-amber-50 p-3"><h4 className="font-bold text-xs text-amber-700">📋 Conditions</h4><div className="flex flex-wrap gap-1 mt-1">{p.conditions.map(c => <span key={c} className="rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700">{c}</span>)}</div></div>}
                  <div className="rounded-lg bg-blue-50 p-3"><h4 className="font-bold text-xs text-blue-700">💊 Medications</h4><ul className="list-disc list-inside text-xs text-blue-600 mt-1">{p.medications.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
                  <div className="rounded-lg bg-red-50 p-3"><h4 className="font-bold text-xs text-red-700">⚠️ Allergies</h4><ul className="list-disc list-inside text-xs text-red-600 mt-1">{p.allergies.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                </div>
              )}
              {tab === 'encounters' && (
                <div className="space-y-2">{p.recentEncounters.map((e, i) => (
                  <Card key={i} className="p-3"><div className="flex items-center gap-2"><Badge tone="blue">{e.type}</Badge><span className="text-xs text-slate-400">{e.date}</span></div><div className="text-xs text-slate-600 mt-1">{e.dept} · {e.doctor} — {e.notes}</div></Card>
                ))}</div>
              )}
              {tab === 'labs' && (
                <div className="space-y-2">{p.recentLabs.map((l, i) => (
                  <Card key={i} className="p-3"><div className="flex items-center justify-between"><span className="font-bold text-sm">{l.test}</span><Badge tone={l.status === 'normal' ? 'green' : 'gold'}>{l.status}</Badge></div><div className="text-xs text-slate-500">{l.date} · {l.result}</div></Card>
                ))}</div>
              )}
              {tab === 'medications' && (
                <Card className="p-4"><h4 className="font-bold text-sm text-slate-700 mb-2">💊 Current Medications</h4>{p.medications.map((m, i) => <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-xs"><span className="font-medium">{m}</span><Button className="bg-slate-100 text-slate-700 text-[10px]">Modify</Button></div>)}</Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
