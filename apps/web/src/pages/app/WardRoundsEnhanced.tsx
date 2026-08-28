import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface RoundEntry { id: string; patientName: string; mrn: string; ward: string; bed: string; doctor: string; time: string; notes: string; vitals: { bp: string; hr: number; temp: number; spO2: number; pain: number }; plan: string; status: 'Completed' | 'In Progress' | 'Pending'; actions: string[]; }

const ROUNDS: RoundEntry[] = [
  { id: 'RN-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', bed: 'B-12', doctor: 'Dr. Yaw Boateng', time: '08:30', notes: 'Post-op Day 2. Wound clean, no signs of infection. Tolerating oral diet. Mobilising with assistance.', vitals: { bp: '128/82', hr: 78, temp: 36.8, spO2: 98, pain: 3 }, plan: 'Continue current management. Physio referral for mobilisation. Review tomorrow.', status: 'Completed', actions: ['Physio referral', 'Bloods in AM'] },
  { id: 'RN-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', ward: 'Maternity', bed: 'M-05', doctor: 'Dr. Ama Darko', time: '09:00', notes: 'Day 1 post Caesarean. Lochia normal. Baby feeding well. Scar site clean and dry.', vitals: { bp: '120/76', hr: 82, temp: 37.0, spO2: 99, pain: 2 }, plan: 'Remove catheter today. Encourage early mobilisation. Discharge planning for tomorrow.', status: 'Completed', actions: ['Remove catheter', 'Discharge planning'] },
  { id: 'RN-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', bed: 'ICU-08', doctor: 'Dr. Ama Darko', time: '09:30', notes: 'Ventilator weaning trial — tolerated 2 hours on CPAP. Oxygen requirement low. Conscious and communicating via writing.', vitals: { bp: '135/88', hr: 92, temp: 37.2, spO2: 96, pain: 2 }, plan: 'Continue weaning. Extubation assessment in 4 hours. Family meeting at 14:00.', status: 'In Progress', actions: ['Extubation assessment', 'Family meeting'] },
  { id: 'RN-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward A', bed: 'A-07', doctor: 'Dr. Kofi Asante', time: '10:00', notes: 'Diabetic patient — blood sugars poorly controlled. HbA1c 9.2%. Insulin regimen reviewed. Dietitian referral made.', vitals: { bp: '142/90', hr: 88, temp: 36.5, spO2: 97, pain: 0 }, plan: 'Increase insulin glargine. Repeat sugars QDS. Dietitian review. Diabetic education.', status: 'In Progress', actions: ['Increase insulin', 'Dietitian referral', 'Education session'] },
  { id: 'RN-005', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0776', ward: 'Paediatric', bed: 'P-03', doctor: 'Dr. Nana Agyeman', time: '10:30', notes: 'Child with severe malaria — improving on IV artesunate. Fever settled. Eating well. Haemoglobin stable at 8.5g/dL.', vitals: { bp: '95/60', hr: 110, temp: 37.1, spO2: 98, pain: 1 }, plan: 'Switch to oral ACT tomorrow if afebrile for 24h. Discharge planning if oral tolerance maintained.', status: 'Pending', actions: ['Oral tolerance test', 'Discharge planning'] },
  { id: 'RN-006', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', ward: 'Oncology', bed: 'ONC-12', doctor: 'Dr. Yaw Boateng', time: '11:00', notes: 'Cycle 3 chemotherapy — day 5. Nausea controlled with ondansetron. Neutrophils borderline at 1.2.', vitals: { bp: '118/72', hr: 95, temp: 37.8, spO2: 97, pain: 2 }, plan: 'Monitor temperature Q4H. Repeat FBC tomorrow. If neutropenic, start G-CSF.', status: 'Pending', actions: ['FBC in AM', 'Temp monitoring'] },
];

const _STATUS_COLORS: Record<string, string> = { Completed: 'bg-green-100 text-green-800', 'In Progress': 'bg-blue-100 text-blue-800', Pending: 'bg-yellow-100 text-yellow-800' };

export default function WardRoundsEnhanced() {
  const [rounds] = useState<RoundEntry[]>(ROUNDS);
  const [selected, setSelected] = useState<RoundEntry | null>(null);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? rounds : rounds.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ward Rounds</h1>
          <p className="text-slate-500 text-sm">Bedside documentation and clinical progress notes</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Round</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{rounds.filter(r => r.status === 'Completed').length}</p><p className="text-xs text-slate-500">Completed</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{rounds.filter(r => r.status === 'In Progress').length}</p><p className="text-xs text-slate-500">In Progress</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{rounds.filter(r => r.status === 'Pending').length}</p><p className="text-xs text-slate-500">Pending</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Completed', 'In Progress', 'Pending'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className={`p-4 cursor-pointer hover:shadow transition ${selected?.id === r.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.patientName}</span>
                    <Badge tone={r.status === 'Completed' ? 'green' : r.status === 'In Progress' ? 'blue' : 'gold'}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.mrn} · {r.ward} Bed {r.bed} · {r.time}</p>
                  <p className="text-sm mt-2 text-slate-600">{r.notes.slice(0, 100)}...</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="p-6 h-fit sticky top-4">
            <h2 className="text-lg font-bold mb-2">{selected.patientName} — {selected.ward} Bed {selected.bed}</h2>
            <p className="text-xs text-slate-500 mb-4">{selected.mrn} · {selected.doctor} · {selected.time}</p>

            <div className="grid grid-cols-5 gap-2 mb-4">
              <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-500">BP</p><p className="font-bold text-sm">{selected.vitals.bp}</p></div>
              <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-500">HR</p><p className="font-bold text-sm">{selected.vitals.hr}</p></div>
              <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-500">Temp</p><p className="font-bold text-sm">{selected.vitals.temp}°</p></div>
              <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-500">SpO2</p><p className="font-bold text-sm">{selected.vitals.spO2}%</p></div>
              <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-500">Pain</p><p className="font-bold text-sm">{selected.vitals.pain}/10</p></div>
            </div>

            <div className="space-y-3">
              <div><p className="text-xs font-semibold text-slate-500 uppercase">Clinical Notes</p><p className="text-sm mt-1">{selected.notes}</p></div>
              <div><p className="text-xs font-semibold text-slate-500 uppercase">Plan</p><p className="text-sm mt-1">{selected.plan}</p></div>
              <div><p className="text-xs font-semibold text-slate-500 uppercase">Actions Required</p>
                <ul className="mt-1 space-y-1">{selected.actions.map((a, i) => <li key={i} className="text-sm flex items-center gap-2"><input type="checkbox" className="rounded" />{a}</li>)}</ul>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Edit Notes</button>
              <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Export PDF</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
