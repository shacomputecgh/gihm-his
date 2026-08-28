import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface STPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; assessment: string; target: string;
  status: 'Assessment' | 'Active Therapy' | 'Discharged' | 'Review';
  sessions: number; totalPlanned: number; therapist: string; followUp: string; notes: string;
}

const PATIENTS: STPatient[] = [
  { id: 'ST-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1080',
    condition: 'Post-Stroke Dysphagia + Expressive Aphasia',
    assessment: 'WALS score 8/21 (moderate-severe). Videofluoroscopy: aspiration on thin liquids. Modified diet IDDSI Level 4.',
    target: 'Restore safe oral intake. Improve word-finding to conversational level.',
    status: 'Active Therapy', sessions: 12, totalPlanned: 24, therapist: 'Sr. Akosua Mensah',
    followUp: '2026-09-07 (2 weeks)', notes: 'Swallowing improving — tolerating IDDSI 5 now. Word-finding exercises progressing. Family trained in communication strategies.'
  },
  { id: 'ST-002', name: 'Ama Serwaa', age: 8, gender: 'Female', mrn: 'MRN-2026-1082',
    condition: 'Childhood Speech Sound Disorder',
    assessment: 'AGEQ: 75th percentile. Articulation: /s/, /z/, /r/ distortions. Phonological process: cluster reduction.',
    target: 'Achieve age-appropriate speech sounds by age 10.',
    status: 'Active Therapy', sessions: 8, totalPlanned: 20, therapist: 'Sr. Akosua Mensah',
    followUp: '2026-09-14 (3 weeks)', notes: 'Making good progress with /s/ sound. /r/ still needs work. Home practice programme established with parents.'
  },
  { id: 'ST-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1084',
    condition: 'Head and Neck Cancer — Post Laryngectomy',
    assessment: 'Total laryngectomy. Tracheoesophageal puncture (TEP) in situ. Using Electrolarynx. Earning TE voice.',
    target: 'Develop functional TE speech for daily communication.',
    status: 'Active Therapy', sessions: 6, totalPlanned: 16, therapist: 'Sr. Akosua Mensah',
    followUp: '2026-09-07 (2 weeks)', notes: 'TEP voicing improving. Producing 3-4 word phrases. Anterior tracheoesophageal prosthesis fitted. Mucus management ongoing.'
  },
  { id: 'ST-004', name: 'Efua Nyarko', age: 45, gender: 'Female', mrn: 'MRN-2026-1086',
    condition: 'Voice Disorder — Vocal Cord Paresis',
    assessment: 'VHI-30: 78/120 (severe impact). Laryngoscopy: right vocal cord paresis. Breathiness grade 3/5.',
    target: 'Optimize voice quality. Reduce vocal strain.',
    status: 'Review', sessions: 4, totalPlanned: 8, therapist: 'Sr. Akosua Mensah',
    followUp: '2026-09-14 (3 weeks)', notes: 'Voice improving with therapy. Semi-occluded vocal tract exercises effective. Reassess laryngoscopy in 6 weeks.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Active Therapy': 'bg-green-100 text-green-800',
  'Discharged': 'bg-gray-100 text-gray-800', 'Review': 'bg-yellow-100 text-yellow-800',
};

export default function SpeechTherapy() {
  const [selected, setSelected] = useState<STPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Speech Therapy Session"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Condition","type":"select","options":["Dysphagia","Aphonia","Stuttering","Voice Disorder","Aphasia","Paediatric Speech Delay","Other"]},{"name":"sessionType","label":"Session Type","type":"select","options":["Assessment","Treatment","Swallowing","Voice","Articulation"]},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Speech & Language Therapy</h1><p className="text-gray-500">Communication disorders, dysphagia, aphasia, and voice rehabilitation</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Active Therapy', value: PATIENTS.filter(p=>p.status==='Active Therapy').length, color: 'text-green-600' },
          { label: 'Swallowing', value: PATIENTS.filter(p=>p.condition.includes('Dysphagia')||p.condition.includes('Laryngectomy')).length, color: 'text-orange-600' },
          { label: 'Total Sessions', value: PATIENTS.reduce((s,p)=>s+p.sessions,0), color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                </div>
                <div className="text-right"><div className="text-sm font-medium">{p.sessions}/{p.totalPlanned}</div><div className="text-[10px] text-gray-400">Sessions</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className="bg-purple-50 rounded-lg p-3 text-center"><div className="text-2xl font-black text-purple-600">{selected.sessions}/{selected.totalPlanned}</div><div className="text-xs text-purple-600">Sessions Completed</div><div className="w-full bg-purple-200 rounded-full h-2 mt-2"><div className="bg-purple-600 h-full rounded-full" style={{width:`${(selected.sessions/selected.totalPlanned)*100}%`}}/></div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Assessment</div><div className="bg-blue-50 rounded p-2 text-xs">{selected.assessment}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Target</div><div className="text-sm">{selected.target}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
