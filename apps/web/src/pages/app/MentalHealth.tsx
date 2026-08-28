import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type MentalTab = 'patients' | 'assessments' | 'treatment' | 'analytics';

interface PsychPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  diagnosis: string[];
  admissionDate: string;
  status: 'inpatient' | 'outpatient' | 'crisis' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high' | 'imminent';
  psychiatrist: string;
  currentMedications: string[];
  treatmentPlan: string;
  lastAssessment: string;
  nextAppointment: string;
  notes: string;
  assessmentScores: { phq9: number; gad7: number; mmse: number; };
  history: string[];
}

const MOCK_PATIENTS: PsychPatient[] = [
  { id: 'MH001', name: 'Abena Mensah', age: 34, gender: 'Female', mrn: 'MRN-201', diagnosis: ['Major Depressive Disorder', 'Generalized Anxiety Disorder'], admissionDate: '2026-05-10', status: 'inpatient', riskLevel: 'moderate', psychiatrist: 'Dr. Psych Kwame', currentMedications: ['Sertraline 100mg OD', 'Lorazepam 0.5mg PRN'], treatmentPlan: 'CBT + Medication. Group therapy daily. Discharge target: 2026-05-30.', lastAssessment: '2026-05-22', nextAppointment: '2026-05-25', notes: 'Patient improving. Engaging in therapy. Sleep improved. Appetite returning.', assessmentScores: { phq9: 14, gad7: 12, mmse: 30 }, history: ['Depression onset at 28', 'Previous suicide attempt 2024', 'Two prior admissions'] },
  { id: 'MH002', name: 'Kofi Adjei', age: 45, gender: 'Male', mrn: 'MRN-202', diagnosis: ['Schizophrenia', 'Type 2 Diabetes'], admissionDate: '2026-05-15', status: 'inpatient', riskLevel: 'high', psychiatrist: 'Dr. Psych Kwame', currentMedications: ['Olanzapine 15mg BD', 'Metformin 500mg BD', 'Trihexyphenidyl 2mg BD'], treatmentPlan: 'Antipsychotic stabilization. Monitor blood sugar. Family psychoeducation.', lastAssessment: '2026-05-23', nextAppointment: '2026-05-26', notes: ' auditory hallucinations decreasing. Paranoid ideation persisting. Needs close monitoring.', assessmentScores: { phq9: 18, gad7: 15, mmse: 28 }, history: ['First episode 2015', 'Multiple admissions', 'Medication non-compliance'] },
  { id: 'MH003', name: 'Akua Osei', age: 22, gender: 'Female', mrn: 'MRN-203', diagnosis: ['Bipolar I Disorder', 'Substance Use Disorder (Alcohol)'], admissionDate: '2026-05-20', status: 'crisis', riskLevel: 'imminent', psychiatrist: 'Dr. Psych Kwame', currentMedications: ['Lithium 600mg BD', 'Valproate 500mg BD', 'Lorazepam 1mg TDS'], treatmentPlan: 'Acute stabilization. Detox protocol. Suicide precautions. 1:1 nursing.', lastAssessment: '2026-05-23', nextAppointment: '2026-05-24', notes: 'In manic episode with psychotic features. Agitated. Refusing medication. On 1:1 observation.', assessmentScores: { phq9: 24, gad7: 18, mmse: 26 }, history: ['First manic episode 2023', '3 hospitalizations', 'Self-harm history'] },
  { id: 'MH004', name: 'Nana Ama', age: 55, gender: 'Female', mrn: 'MRN-204', diagnosis: ['Dementia (Alzheimer\'s Type)', 'Late-life Depression'], admissionDate: '2026-05-01', status: 'outpatient', riskLevel: 'low', psychiatrist: 'Dr. Psych Kwame', currentMedications: ['Donepezil 10mg OD', 'Sertraline 50mg OD'], treatmentPlan: 'Cognitive stimulation. Caregiver support. Medication review monthly.', lastAssessment: '2026-05-15', nextAppointment: '2026-06-15', notes: 'Stable on current medications. Caregiver managing well at home.', assessmentScores: { phq9: 8, gad7: 6, mmse: 18 }, history: ['Diagnosed 2024', 'Progressive cognitive decline'] },
  { id: 'MH005', name: 'Samuel Tetteh', age: 28, gender: 'Male', mrn: 'MRN-205', diagnosis: ['PTSD', 'Alcohol Use Disorder'], admissionDate: '2026-05-22', status: 'outpatient', riskLevel: 'moderate', psychiatrist: 'Dr. Psych Kwame', currentMedications: ['Prazosin 2mg HS', 'Sertraline 150mg OD'], treatmentPlan: 'EMDR therapy. Trauma-focused CBT. AA referral. Relapse prevention.', lastAssessment: '2026-05-22', nextAppointment: '2026-05-29', notes: 'New patient. Veteran. Flashbacks and nightmares. Drinking reduced.', assessmentScores: { phq9: 16, gad7: 14, mmse: 30 }, history: ['Military trauma 2020', 'Self-medication with alcohol'] },
];

export default function MentalHealth() {
  const [tab, setTab] = useState<MentalTab>('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const statusConfig = { inpatient: { label: 'Inpatient', tone: 'blue' as const, icon: '🏥' }, outpatient: { label: 'Outpatient', tone: 'green' as const, icon: '🏠' }, crisis: { label: 'Crisis', tone: 'red' as const, icon: '🚨' }, stable: { label: 'Stable', tone: 'green' as const, icon: '✅' } };
  const riskConfig = { low: { label: 'Low Risk', tone: 'green' as const, color: 'bg-green-50 text-green-700' }, moderate: { label: 'Moderate Risk', tone: 'gold' as const, color: 'bg-amber-50 text-amber-700' }, high: { label: 'High Risk', tone: 'red' as const, color: 'bg-red-50 text-red-700' }, imminent: { label: 'Imminent Danger', tone: 'red' as const, color: 'bg-red-600 text-white' } };

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
          title="Add New Mental Health Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"diagnosis","label":"Diagnosis","type":"select","options":["Depression","Anxiety","Bipolar","Schizophrenia","PTSD","Substance Abuse","Personality Disorder","Other"]},{"name":"phq9Score","label":"PHQ-9 Score","type":"number"},{"name":"gad7Score","label":"GAD-7 Score","type":"number"},{"name":"riskLevel","label":"Risk Level","type":"select","options":["Low","Medium","High","Critical"]},{"name":"treatmentPlan","label":"Treatment Plan","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Mental Health" subtitle="Psychiatric assessments, treatment plans, and progress tracking" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_PATIENTS.length}</div><div className="text-xs text-slate-500">Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_PATIENTS.filter(p => p.riskLevel === 'imminent' || p.riskLevel === 'high').length}</div><div className="text-xs text-slate-500">High Risk</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_PATIENTS.filter(p => p.status === 'crisis').length}</div><div className="text-xs text-slate-500">In Crisis</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_PATIENTS.filter(p => p.status === 'outpatient').length}</div><div className="text-xs text-slate-500">Outpatient</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['patients', 'assessments', 'treatment', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'patients' ? '👥 Patients' : t === 'assessments' ? '📊 Assessments' : t === 'treatment' ? '💊 Treatment' : '📈 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'patients' && (
        <div className="space-y-3">
          {MOCK_PATIENTS.map(p => {
            const sCfg = statusConfig[p.status];
            const rCfg = riskConfig[p.riskLevel];
            const isExpanded = selectedPatient === p.id;
            return (
              <Card key={p.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-purple-200' : ''} ${p.riskLevel === 'imminent' ? 'border-l-4 border-red-500' : p.riskLevel === 'high' ? 'border-l-4 border-amber-500' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedPatient(isExpanded ? null : p.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{p.name}</h3>
                      <Badge tone={sCfg.tone}>{sCfg.icon} {sCfg.label}</Badge>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rCfg.color}`}>{rCfg.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{p.age} yrs · {p.gender} · {p.mrn}</div>
                    <div className="mt-1 flex flex-wrap gap-1">{p.diagnosis.map(d => <span key={d} className="rounded bg-purple-50 px-1.5 text-[10px] font-medium text-purple-700">{d}</span>)}</div>
                    <div className="mt-1 flex gap-3 text-[10px] text-slate-400">
                      <span>PHQ-9: <strong className={p.assessmentScores.phq9 >= 20 ? 'text-red-600' : p.assessmentScores.phq9 >= 10 ? 'text-amber-600' : 'text-green-600'}>{p.assessmentScores.phq9}</strong></span>
                      <span>GAD-7: <strong className={p.assessmentScores.gad7 >= 15 ? 'text-red-600' : p.assessmentScores.gad7 >= 10 ? 'text-amber-600' : 'text-green-600'}>{p.assessmentScores.gad7}</strong></span>
                      <span>MMSE: <strong className={p.assessmentScores.mmse <= 20 ? 'text-red-600' : p.assessmentScores.mmse <= 24 ? 'text-amber-600' : 'text-green-600'}>{p.assessmentScores.mmse}/30</strong></span>
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">💊 Current Medications</h4><ul className="list-disc list-inside text-xs text-slate-700">{p.currentMedications.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
                    <div className="rounded-lg bg-blue-50 p-3"><h4 className="font-bold text-xs text-blue-700 mb-1">📋 Treatment Plan</h4><p className="text-xs text-blue-600">{p.treatmentPlan}</p></div>
                    <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📝 Clinical Notes</h4><p className="text-xs text-slate-600">{p.notes}</p></div>
                    {p.history.length > 0 && <div><h4 className="font-bold text-xs text-slate-600 mb-1">📜 History</h4><ul className="list-disc list-inside text-xs text-slate-500">{p.history.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
                    <div className="flex gap-2">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-xs">📝 New Assessment</Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs">💊 Medication Review</Button>
                      <Button className="bg-green-600 hover:bg-green-700 text-xs">📅 Schedule Follow-up</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'assessments' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 PHQ-9 (Depression)</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-green-600">0-4: Minimal</span><span>0-4</span></div>
              <div className="flex justify-between"><span className="text-green-600">5-9: Mild</span><span>5-9</span></div>
              <div className="flex justify-between"><span className="text-amber-600">10-14: Moderate</span><span>10-14</span></div>
              <div className="flex justify-between"><span className="text-red-600">15-19: Moderately Severe</span><span>15-19</span></div>
              <div className="flex justify-between"><span className="text-red-700">20-27: Severe</span><span>20-27</span></div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 GAD-7 (Anxiety)</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-green-600">0-4: Minimal</span><span>0-4</span></div>
              <div className="flex justify-between"><span className="text-amber-600">5-9: Mild</span><span>5-9</span></div>
              <div className="flex justify-between"><span className="text-amber-600">10-14: Moderate</span><span>10-14</span></div>
              <div className="flex justify-between"><span className="text-red-600">15-21: Severe</span><span>15-21</span></div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 MMSE (Cognitive)</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-green-600">25-30: Normal</span><span>25-30</span></div>
              <div className="flex justify-between"><span className="text-amber-600">18-24: Mild Impairment</span><span>18-24</span></div>
              <div className="flex justify-between"><span className="text-red-600">0-17: Severe Impairment</span><span>0-17</span></div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'treatment' && (
        <div className="space-y-3">
          {MOCK_PATIENTS.map(p => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-3 py-2 text-lg font-bold ${riskConfig[p.riskLevel].color}`}>{riskConfig[p.riskLevel].label.split(' ')[0]}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-800">{p.name} — {p.diagnosis[0]}</div>
                  <div className="text-xs text-slate-500">Medications: {p.currentMedications.join(' · ')}</div>
                  <div className="text-[10px] text-slate-400">Last: {p.lastAssessment} · Next: {p.nextAppointment}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Risk Distribution</h3>
            {(['imminent', 'high', 'moderate', 'low'] as const).map(r => {
              const count = MOCK_PATIENTS.filter(p => p.riskLevel === r).length;
              const pct = (count / MOCK_PATIENTS.length) * 100;
              return (<div key={r} className="mb-2"><div className="flex justify-between text-xs"><span>{riskConfig[r].label}</span><span className="font-bold">{count}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} /></div></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📋 Diagnosis Breakdown</h3>
            {[...new Set(MOCK_PATIENTS.flatMap(p => p.diagnosis))].map(dx => {
              const count = MOCK_PATIENTS.filter(p => p.diagnosis.includes(dx)).length;
              return (<div key={dx} className="flex justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600">{dx}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
