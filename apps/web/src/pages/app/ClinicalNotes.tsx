import { useState } from 'react';

import { Badge, Button, Card, Input, PageHeader } from '../../components/ui';

type NotesTab = 'list' | 'new' | 'view';

interface ClinicalNote {
  id: string;
  patientName: string;
  mrn: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  type: 'progress' | 'admission' | 'discharge' | 'consultation' | 'procedure' | 'operative';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitals: { bp: string; pulse: number; temp: number; rr: number; spo2: number; weight: number };
  diagnosis: string[];
  orders: string[];
  followUp?: string;
  status: 'draft' | 'signed' | 'amended';
}

const MOCK_NOTES: ClinicalNote[] = [
  {
    id: 'CN001', patientName: 'Kwame Asante', mrn: 'MRN-001234', date: '2026-05-23', time: '09:30',
    doctor: 'Dr. Akua Mensah', department: 'Internal Medicine', type: 'progress',
    subjective: 'Patient complains of persistent headache for 3 days, rated 7/10 severity. Associated with nausea and blurred vision. No fever, no neck stiffness. Previous history of hypertension.',
    objective: 'BP: 158/95 mmHg (elevated), Pulse: 88/min, Temp: 36.8°C, RR: 16/min, SpO2: 98%. Alert and oriented. Fundoscopy: bilateral papilloedema grade 1. Neurological examination: no focal deficits. No meningeal signs.',
    assessment: '1. Hypertensive urgency with headache\n2. Essential hypertension — poorly controlled\n3. Rule out secondary causes',
    plan: '1. Start Amlodipine 5mg OD\n2. Continue existing Enalapril 10mg BD\n3. Urgent fundoscopy referral\n4. Blood investigations: FBC, U&E, creatinine, lipid profile\n5. BP monitoring q4h for 24 hours\n6. Neurology review if symptoms worsen',
    vitals: { bp: '158/95', pulse: 88, temp: 36.8, rr: 16, spo2: 98, weight: 82 },
    diagnosis: ['Hypertensive urgency', 'Essential hypertension', 'Papilloedema'],
    orders: ['FBC', 'U&E', 'Creatinine', 'Lipid Profile', 'Fundoscopy referral', 'BP monitoring q4h'],
    followUp: '2026-05-25',
    status: 'signed',
  },
  {
    id: 'CN002', patientName: 'Ama Darko', mrn: 'MRN-002345', date: '2026-05-23', time: '11:15',
    doctor: 'Dr. Kofi Boateng', department: 'Surgery', type: 'admission',
    subjective: 'Patient presents with right lower abdominal pain for 12 hours, initially periumbilical, now localized to the right iliac fossa. Associated with nausea, vomiting once, and low-grade fever. Last menstrual period 2 weeks ago. No urinary symptoms.',
    objective: 'BP: 118/76 mmHg, Pulse: 96/min, Temp: 37.8°C, RR: 18/min, SpO2: 99%. Abdominal examination: tenderness and guarding in RIF, positive Rovsing\'s sign, positive McBurney\'s point tenderness. WBC: 14.2 (elevated). Urine pregnancy test: Negative.',
    assessment: '1. Acute appendicitis\n2. Differential: ovarian pathology, renal colic',
    plan: '1. NPO (nil per os)\n2. IV fluids: Ringer\'s Lactate 1L @ 125ml/hr\n3. IV Cefuroxime 750mg TDS + Metronidazole 500mg TDS\n4. IV Paracetamol 1g QDS for pain\n5. Urgent surgical consultation for appendectomy\n6. Pre-operative bloods: FBC, U&E, Group & Save, Cross-match\n7. Consent for surgery',
    vitals: { bp: '118/76', pulse: 96, temp: 37.8, rr: 18, spo2: 99, weight: 68 },
    diagnosis: ['Acute appendicitis'],
    orders: ['FBC', 'U&E', 'Group & Save', 'Cross-match', 'CT abdomen', 'Surgical consult', 'IV antibiotics'],
    followUp: '2026-05-24',
    status: 'signed',
  },
  {
    id: 'CN003', patientName: 'Kofi Asante', mrn: 'MRN-003456', date: '2026-05-23', time: '14:45',
    doctor: 'Dr. Abena Osei', department: 'Paediatrics', type: 'progress',
    subjective: 'Mother reports 3-year-old boy with cough for 5 days, fever for 3 days, and difficulty breathing for 1 day. Not feeding well. No convulsions. Fully immunized.',
    objective: 'BP: 95/60 mmHg, Pulse: 130/min, Temp: 39.2°C, RR: 44/min, SpO2: 91%. Alert but irritable. Subcostal and intercostal retractions. Crackles in right lower lobe. No wheeze. Capillary refill: 2 seconds.',
    assessment: '1. Community-acquired pneumonia (right lower lobe)\n2. Mild respiratory distress\n3. Febrile illness',
    plan: '1. Oxygen therapy via nasal prongs 2L/min\n2. IV Amoxicillin-Clavulanate 50mg/kg/day\n3. IV Paracetamol 15mg/kg QDS\n4. IV fluids to maintain hydration\n5. Monitor SpO2 hourly\n6. Chest X-ray\n7. Review in 24 hours',
    vitals: { bp: '95/60', pulse: 130, temp: 39.2, rr: 44, spo2: 91, weight: 14 },
    diagnosis: ['Community-acquired pneumonia', 'Respiratory distress', 'Febrile illness'],
    orders: ['Chest X-ray', 'FBC', 'CRP', 'Blood culture', 'IV antibiotics', 'Oxygen therapy'],
    followUp: '2026-05-24',
    status: 'signed',
  },
  {
    id: 'CN004', patientName: 'Efua Mensah', mrn: 'MRN-004567', date: '2026-05-22', time: '16:00',
    doctor: 'Dr. Nana Agyeman', department: 'Obstetrics', type: 'discharge',
    subjective: 'Patient being discharged after normal vaginal delivery 24 hours ago. Baby doing well, feeding well. No complications during delivery or postpartum period.',
    objective: 'Mother: BP 118/76, Pulse 82, Temp 37.0°C. Fundal height 2cm below umbilicus. Lochia normal. No episiotomy. Baby: Weight 3.2kg, feeding well, no jaundice, cord dry.',
    assessment: '1. Post normal vaginal delivery — uncomplicated\n2. Healthy neonate',
    plan: '1. Discharge medications: Iron supplementation, Paracetamol PRN\n2. Follow-up in 6 weeks\n3. Baby immunizations: BCG, OPV0, HepB0 given\n4. Breastfeeding education provided\n5. Danger signs counselling given\n6. Next ANC visit for 6-week postnatal',
    vitals: { bp: '118/76', pulse: 82, temp: 37.0, rr: 16, spo2: 99, weight: 72 },
    diagnosis: ['Normal vaginal delivery', 'Healthy neonate'],
    orders: ['Iron supplements', 'Paracetamol PRN', '6-week follow-up', 'Immunizations given'],
    followUp: '2026-07-03',
    status: 'signed',
  },
];

const NOTE_TYPES = [
  { value: 'progress', label: '📝 Progress Note', color: 'blue' },
  { value: 'admission', label: '🏥 Admission Note', color: 'purple' },
  { value: 'discharge', label: '✅ Discharge Summary', color: 'green' },
  { value: 'consultation', label: '🩺 Consultation Note', color: 'cyan' },
  { value: 'procedure', label: '🔬 Procedure Note', color: 'orange' },
  { value: 'operative', label: '🏥 Operative Note', color: 'red' },
];

export default function ClinicalNotes() {
  
  const [tab, setTab] = useState<NotesTab>('list');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>('all');

  const filteredNotes = MOCK_NOTES.filter((n) => {
    const matchSearch = n.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || n.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = noteTypeFilter === 'all' || n.type === noteTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clinical Notes (EMR)" subtitle="SOAP-format progress notes and encounter documentation" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_NOTES.length}</div><div className="text-xs text-slate-500">Total Notes</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_NOTES.filter(n => n.status === 'signed').length}</div><div className="text-xs text-slate-500">Signed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-yellow-600">{MOCK_NOTES.filter(n => n.status === 'draft').length}</div><div className="text-xs text-slate-500">Drafts</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_NOTES.filter(n => n.type === 'admission').length}</div><div className="text-xs text-slate-500">Admissions</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-emerald-600">{MOCK_NOTES.filter(n => n.type === 'discharge').length}</div><div className="text-xs text-slate-500">Discharges</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab('list')} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>📋 All Notes</button>
        <button onClick={() => setTab('new')} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'new' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>✍️ New Note</button>
      </div>

      {/* Filters */}
      {tab === 'list' && (
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Search by patient name or MRN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
          <select value={noteTypeFilter} onChange={(e) => setNoteTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
            <option value="all">All Types</option>
            {NOTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* Notes List */}
      {tab === 'list' && (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const isSelected = selectedNote === note.id;
            return (
              <Card key={note.id} className={`p-4 transition-all ${isSelected ? 'ring-2 ring-blue-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedNote(isSelected ? null : note.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{note.patientName}</h3>
                      <Badge tone="blue">{note.mrn}</Badge>
                      <Badge tone={note.type === 'discharge' ? 'green' : note.type === 'admission' ? 'navy' : 'blue'}>
                        {NOTE_TYPES.find(t => t.value === note.type)?.label}
                      </Badge>
                      <Badge tone={note.status === 'signed' ? 'green' : 'gold'}>{note.status.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>📅 {note.date} {note.time}</span>
                      <span>👨‍⚕️ {note.doctor}</span>
                      <span>🏥 {note.department}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      <span className="font-medium">Assessment:</span> {note.assessment.split('\n')[0]}
                    </div>
                    {note.diagnosis.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.diagnosis.map((d) => <span key={d} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{d}</span>)}
                      </div>
                    )}
                  </div>
                  <span className={`text-slate-400 transition-transform ${isSelected ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isSelected && (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    {/* SOAP Format */}
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="font-bold text-sm text-blue-800 mb-2">📋 SOAP Clinical Note</h4>

                      <div className="mb-3">
                        <h5 className="font-bold text-xs text-blue-700">S — Subjective</h5>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed bg-white rounded p-2">{note.subjective}</p>
                      </div>

                      <div className="mb-3">
                        <h5 className="font-bold text-xs text-blue-700">O — Objective</h5>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed bg-white rounded p-2">{note.objective}</p>
                      </div>

                      <div className="mb-3">
                        <h5 className="font-bold text-xs text-blue-700">A — Assessment</h5>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed bg-white rounded p-2 whitespace-pre-line">{note.assessment}</p>
                      </div>

                      <div>
                        <h5 className="font-bold text-xs text-blue-700">P — Plan</h5>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed bg-white rounded p-2 whitespace-pre-line">{note.plan}</p>
                      </div>
                    </div>

                    {/* Vitals */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-600 mb-1">📊 Vital Signs</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded bg-red-50 px-2 py-1 text-xs">BP: {note.vitals.bp} mmHg</span>
                        <span className="rounded bg-pink-50 px-2 py-1 text-xs">Pulse: {note.vitals.pulse}/min</span>
                        <span className="rounded bg-orange-50 px-2 py-1 text-xs">Temp: {note.vitals.temp}°C</span>
                        <span className="rounded bg-blue-50 px-2 py-1 text-xs">RR: {note.vitals.rr}/min</span>
                        <span className="rounded bg-cyan-50 px-2 py-1 text-xs">SpO2: {note.vitals.spo2}%</span>
                        <span className="rounded bg-green-50 px-2 py-1 text-xs">Weight: {note.vitals.weight}kg</span>
                      </div>
                    </div>

                    {/* Orders */}
                    {note.orders.length > 0 && (
                      <div>
                        <h4 className="font-bold text-xs text-slate-600 mb-1">📋 Orders</h4>
                        <div className="flex flex-wrap gap-1">
                          {note.orders.map((o) => <span key={o} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{o}</span>)}
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    {note.followUp && (
                      <div className="rounded-lg bg-green-50 p-2 text-xs">
                        <span className="font-bold text-green-700">📅 Follow-up:</span> <span className="text-green-600">{note.followUp}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700">🖨️ Print Note</Button>
                      <Button className="bg-slate-100 text-slate-700 hover:bg-slate-200">📤 Export PDF</Button>
                      {note.status === 'draft' && <Button className="bg-green-600 hover:bg-green-700">✅ Sign Note</Button>}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Note Form */}
      {tab === 'new' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-4">✍️ New Clinical Note</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
            <Input placeholder="Patient Name" />
            <Input placeholder="MRN" />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Note Type</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {NOTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Vital Signs */}
          <h4 className="font-bold text-sm text-slate-700 mb-2">📊 Vital Signs</h4>
          <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-6">
            <Input placeholder="BP" />
            <Input placeholder="Pulse" type="number" />
            <Input placeholder="Temp" type="number" step="0.1" />
            <Input placeholder="RR" type="number" />
            <Input placeholder="SpO2" type="number" />
            <Input placeholder="Weight" type="number" />
          </div>

          {/* SOAP Fields */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-blue-700">S — Subjective (Patient's complaints and history)</label>
              <textarea className="w-full rounded-lg border border-slate-200 p-3 text-sm min-h-[80px]" placeholder="Patient presents with..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-blue-700">O — Objective (Physical examination and investigation findings)</label>
              <textarea className="w-full rounded-lg border border-slate-200 p-3 text-sm min-h-[80px]" placeholder="On examination..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-blue-700">A — Assessment (Diagnosis and differential)</label>
              <textarea className="w-full rounded-lg border border-slate-200 p-3 text-sm min-h-[80px]" placeholder="1. Primary diagnosis" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-blue-700">P — Plan (Treatment and management plan)</label>
              <textarea className="w-full rounded-lg border border-slate-200 p-3 text-sm min-h-[80px]" placeholder="1. Investigation ordered" />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">💾 Save as Draft</Button>
            <Button className="bg-green-600 hover:bg-green-700">✅ Save & Sign</Button>
            <Button className="bg-slate-100 text-slate-700 hover:bg-slate-200">🖨️ Preview & Print</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
