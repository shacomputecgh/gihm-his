import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface HBOTPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  indication: string; protocol: string; sessionsCompleted: number; totalSessions: number;
  pressure: string; duration: string; chamber: string;
  status: 'Assessment' | 'Active Treatment' | 'Completed' | 'Contraindicated';
  doctor: string; followUp: string; notes: string;
}

const PATIENTS: HBOTPatient[] = [
  { id: 'HBOT-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1160',
    indication: 'Diabetic Foot Ulcer — Wagner Grade 3', protocol: '2.4 ATA for 90 min x 30 sessions',
    sessionsCompleted: 18, totalSessions: 30, pressure: '2.4 ATA', duration: '90 min', chamber: 'Multiplace',
    status: 'Active Treatment', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-25 (session 19)',
    notes: 'Diabetic foot ulcer healing well. Granulation tissue improving. Continue HBO therapy. Blood glucose monitoring pre/post session.'
  },
  { id: 'HBOT-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1162',
    indication: 'Carbon Monoxide Poisoning — severe', protocol: '2.8 ATA for 60 min x 4 sessions',
    sessionsCompleted: 4, totalSessions: 4, pressure: '2.8 ATA', duration: '60 min', chamber: 'Monoplace',
    status: 'Completed', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (neuropsych review)',
    notes: 'CO poisoning from house fire. COHb 35% on presentation. 4 sessions of HBO completed. Neuropsychological assessment needed. COHb now <3%.'
  },
  { id: 'HBOT-003', name: 'Kofi Asare', age: 42, gender: 'Male', mrn: 'MRN-2026-1164',
    indication: 'Osteoradionecrosis of Mandible', protocol: '2.4 ATA for 90 min x 20 sessions',
    sessionsCompleted: 8, totalSessions: 20, pressure: '2.4 ATA', duration: '90 min', chamber: 'Multiplace',
    status: 'Active Treatment', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-25 (session 9)',
    notes: 'Post-radiotherapy osteonecrosis of mandible. HBO promoting angiogenesis. Dental assessment ongoing. Surgical debridement may be needed post-HBO.'
  },
  { id: 'HBOT-004', name: 'Efua Nyarko', age: 28, gender: 'Female', mrn: 'MRN-2026-1166',
    indication: 'Complicated Radiation Injury — Post-radiotherapy', protocol: '2.4 ATA for 90 min x 30 sessions',
    sessionsCompleted: 12, totalSessions: 30, pressure: '2.4 ATA', duration: '90 min', chamber: 'Multiplace',
    status: 'Active Treatment', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-25 (session 13)',
    notes: 'Radiation proctitis — pelvic radiation injury. HBO reducing inflammation. Symptoms improving. Continue treatment.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Active Treatment': 'bg-green-100 text-green-800',
  'Completed': 'bg-gray-100 text-gray-800', 'Contraindicated': 'bg-red-100 text-red-800',
};

export default function HyperbaricMedicine() {
  const [selected, setSelected] = useState<HBOTPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Hyperbaric Session"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Hyperbaric Medicine</h1><p className="text-gray-500">Hyperbaric oxygen therapy, wound healing chambers, and treatment protocols</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Active Treatment', value: PATIENTS.filter(p=>p.status==='Active Treatment').length, color: 'text-green-600' },
          { label: 'Completed', value: PATIENTS.filter(p=>p.status==='Completed').length, color: 'text-gray-600' },
          { label: 'Total Sessions', value: PATIENTS.reduce((s,p)=>s+p.totalSessions,0), color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.indication}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.pressure} | {p.duration} | {p.chamber} chamber</div>
                </div>
                <div className="text-right"><div className="text-lg font-bold text-blue-600">{p.sessionsCompleted}/{p.totalSessions}</div><div className="text-[10px] text-gray-400">Sessions</div></div>
              </div>
              {p.status==='Active Treatment' && <div className="mt-2"><div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{Math.round((p.sessionsCompleted/p.totalSessions)*100)}%</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-full rounded-full" style={{width:`${(p.sessionsCompleted/p.totalSessions)*100}%`}}/></div></div>}
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.indication}</p></div>
              {selected.status==='Active Treatment' && <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-4xl font-black text-blue-600">{selected.sessionsCompleted}/{selected.totalSessions}</div><div className="text-xs text-blue-600">Sessions Completed ({Math.round((selected.sessionsCompleted/selected.totalSessions)*100)}%)</div></div>}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Protocol:</span> {selected.protocol}</div><div><span className="text-gray-500">Pressure:</span> {selected.pressure}</div><div><span className="text-gray-500">Duration:</span> {selected.duration}</div><div><span className="text-gray-500">Chamber:</span> {selected.chamber}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div></div>
              <div className="bg-purple-50 rounded-lg p-3"><div className="text-sm font-medium text-purple-700">HBO Treatment Protocol</div><div className="text-xs text-purple-600 mt-1">{selected.protocol}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
