import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface QueueEntry { id: string; ticketNo: string; patientName: string; mrn: string; age: number; sex: string; department: string; triageLevel: 1 | 2 | 3 | 4 | 5; chiefComplaint: string; waitTime: number; arrivedAt: string; calledAt?: string; status: 'Waiting' | 'In Triage' | 'With Doctor' | 'With Nurse' | 'Lab Pending' | 'Pharmacy' | 'Completed' | 'Left Without Seeing'; priority: string; vitalSigns?: { bp: string; hr: number; temp: number; spO2: number; pain: number }; }

const TRIAGE: Record<number, { label: string; color: string; bg: string; desc: string }> = {
  1: { label: 'Resuscitation', color: 'text-red-800', bg: 'bg-red-500', desc: 'Immediate life-threatening' },
  2: { label: 'Emergency', color: 'text-red-700', bg: 'bg-red-400', desc: 'High risk, confused/lethargic' },
  3: { label: 'Urgent', color: 'text-orange-700', bg: 'bg-orange-400', desc: 'Moderate severity' },
  4: { label: 'Semi-Urgent', color: 'text-yellow-700', bg: 'bg-yellow-400', desc: 'Non-urgent with discomfort' },
  5: { label: 'Non-Urgent', color: 'text-green-700', bg: 'bg-green-400', desc: 'Walk-in, minor complaint' },
};

const QUEUE: QueueEntry[] = [
  { id: 'Q-001', ticketNo: 'OUT-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', age: 45, sex: 'M', department: 'OPD', triageLevel: 2, chiefComplaint: 'Severe chest pain, radiating to left arm', waitTime: 45, arrivedAt: '08:15', calledAt: '09:00', status: 'With Doctor', priority: 'High', vitalSigns: { bp: '165/95', hr: 105, temp: 36.8, spO2: 94, pain: 8 } },
  { id: 'Q-002', ticketNo: 'OUT-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', age: 28, sex: 'F', department: 'OPD', triageLevel: 4, chiefComplaint: 'Lower back pain for 2 weeks', waitTime: 120, arrivedAt: '07:30', status: 'Waiting', priority: 'Low', vitalSigns: { bp: '120/78', hr: 72, temp: 36.5, spO2: 99, pain: 4 } },
  { id: 'Q-003', ticketNo: 'OUT-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', age: 62, sex: 'M', department: 'OPD', triageLevel: 1, chiefComplaint: 'Unconscious — found by family', waitTime: 5, arrivedAt: '09:10', calledAt: '09:10', status: 'With Doctor', priority: 'Critical', vitalSigns: { bp: '85/50', hr: 130, temp: 35.8, spO2: 88, pain: 0 } },
  { id: 'Q-004', ticketNo: 'OUT-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', age: 35, sex: 'F', department: 'OPD', triageLevel: 3, chiefComplaint: 'Persistent cough and fever for 5 days', waitTime: 60, arrivedAt: '08:30', calledAt: '09:15', status: 'Lab Pending', priority: 'Medium', vitalSigns: { bp: '128/82', hr: 95, temp: 38.7, spO2: 95, pain: 3 } },
  { id: 'Q-005', ticketNo: 'OUT-005', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0776', age: 8, sex: 'M', department: 'OPD', triageLevel: 3, chiefComplaint: 'High fever and headache', waitTime: 30, arrivedAt: '09:00', status: 'In Triage', priority: 'Medium' },
  { id: 'Q-006', ticketNo: 'OUT-006', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', age: 55, sex: 'F', department: 'OPD', triageLevel: 5, chiefComplaint: 'Routine prescription refill', waitTime: 90, arrivedAt: '08:00', calledAt: '09:30', status: 'Pharmacy', priority: 'Low' },
  { id: 'Q-007', ticketNo: 'OUT-007', patientName: 'Yaw Frimpong', mrn: 'MRN-2024-0445', age: 40, sex: 'M', department: 'OPD', triageLevel: 4, chiefComplaint: 'Skin rash on both arms', waitTime: 75, arrivedAt: '08:15', status: 'Waiting', priority: 'Low' },
  { id: 'Q-008', ticketNo: 'OUT-008', patientName: 'Akosua Darko', mrn: 'MRN-2024-0998', age: 22, sex: 'F', department: 'OPD', triageLevel: 2, chiefComplaint: 'Severe allergic reaction — facial swelling', waitTime: 10, arrivedAt: '09:05', calledAt: '09:12', status: 'With Doctor', priority: 'High', vitalSigns: { bp: '110/70', hr: 115, temp: 37.0, spO2: 96, pain: 5 } },
  { id: 'Q-009', ticketNo: 'OUT-009', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', age: 70, sex: 'M', department: 'OPD', triageLevel: 3, chiefComplaint: 'Difficulty breathing — chronic COPD', waitTime: 25, arrivedAt: '09:00', status: 'With Nurse', priority: 'Medium', vitalSigns: { bp: '135/85', hr: 88, temp: 37.2, spO2: 91, pain: 2 } },
  { id: 'Q-010', ticketNo: 'OUT-010', patientName: 'Esi Nyarko', mrn: 'MRN-2024-0667', age: 30, sex: 'F', department: 'OPD', triageLevel: 4, chiefComplaint: 'Routine antenatal checkup', waitTime: 50, arrivedAt: '08:45', status: 'Completed', priority: 'Low' },
];

const _STATUS_COLORS: Record<string, string> = { Waiting: 'bg-yellow-100 text-yellow-800', 'In Triage': 'bg-blue-100 text-blue-800', 'With Doctor': 'bg-green-100 text-green-800', 'With Nurse': 'bg-teal-100 text-teal-800', 'Lab Pending': 'bg-purple-100 text-purple-800', Pharmacy: 'bg-indigo-100 text-indigo-800', Completed: 'bg-gray-100 text-gray-600', 'Left Without Seeing': 'bg-red-100 text-red-800' };

export default function QueueEnhanced() {
  const [queue] = useState<QueueEntry[]>(QUEUE);
  const [filter, setFilter] = useState<string>('Active');
  const [selected, setSelected] = useState<QueueEntry | null>(null);
  const active = queue.filter(q => q.status !== 'Completed' && q.status !== 'Left Without Seeing');
  const filtered = filter === 'All' ? queue : filter === 'Active' ? active : queue.filter(q => q.status === filter);
  const avgWait = active.length ? Math.round(active.reduce((s, q) => s + q.waitTime, 0) / active.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OPD Queue Management</h1>
          <p className="text-slate-500 text-sm">Triage levels, wait time tracking, and patient flow</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Check In Patient</button>
      </div>

      {/* Triage Legend */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(TRIAGE).map(([level, t]) => (
          <div key={level} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white ${t.bg}`}>
            <span>T{level}</span>
            <span className="opacity-80">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">In Queue</p><p className="text-2xl font-bold">{active.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Avg Wait</p><p className={`text-2xl font-bold ${avgWait > 60 ? 'text-red-600' : avgWait > 30 ? 'text-orange-600' : 'text-green-600'}`}>{avgWait}m</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Critical (T1-T2)</p><p className="text-2xl font-bold text-red-600">{active.filter(q => q.triageLevel <= 2).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">With Doctor</p><p className="text-2xl font-bold text-green-600">{active.filter(q => q.status === 'With Doctor').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Completed Today</p><p className="text-2xl font-bold text-slate-600">{queue.filter(q => q.status === 'Completed').length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['Active', 'All', 'Waiting', 'In Triage', 'With Doctor', 'With Nurse', 'Lab Pending', 'Pharmacy', 'Completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filtered.sort((a, b) => a.triageLevel - b.triageLevel || b.waitTime - a.waitTime).map(q => (
            <Card key={q.id} className={`p-3 cursor-pointer hover:shadow transition ${selected?.id === q.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === q.id ? null : q)}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${TRIAGE[q.triageLevel].bg}`}>
                  T{q.triageLevel}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{q.patientName}</span>
                    <span className="text-xs text-slate-400">{q.age}{q.sex}</span>
                    <Badge tone={q.status === 'With Doctor' ? 'green' : q.status === 'Lab Pending' ? 'purple' : 'blue'}>{q.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{q.ticketNo} · {q.chiefComplaint}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${q.waitTime > 60 ? 'text-red-600' : q.waitTime > 30 ? 'text-orange-600' : 'text-slate-600'}`}>{q.waitTime}m</p>
                  <p className="text-xs text-slate-400">wait</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="p-6 h-fit sticky top-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${TRIAGE[selected.triageLevel].bg}`}>
                T{selected.triageLevel}
              </div>
              <div>
                <h2 className="text-lg font-bold">{selected.patientName}</h2>
                <p className="text-sm text-slate-500">{selected.mrn} · {selected.age}y {selected.sex}</p>
                <p className="text-xs text-slate-400">{TRIAGE[selected.triageLevel].label} — {TRIAGE[selected.triageLevel].desc}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-500">Chief Complaint</p>
                <p className="text-sm mt-1">{selected.chiefComplaint}</p>
              </div>

              {selected.vitalSigns && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Vital Signs</p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div><p className="text-xs text-slate-400">BP</p><p className="font-bold text-sm">{selected.vitalSigns.bp}</p></div>
                    <div><p className="text-xs text-slate-400">HR</p><p className={`font-bold text-sm ${selected.vitalSigns.hr > 100 ? 'text-red-600' : ''}`}>{selected.vitalSigns.hr}</p></div>
                    <div><p className="text-xs text-slate-400">Temp</p><p className={`font-bold text-sm ${selected.vitalSigns.temp > 37.5 ? 'text-orange-600' : ''}`}>{selected.vitalSigns.temp}°</p></div>
                    <div><p className="text-xs text-slate-400">SpO2</p><p className={`font-bold text-sm ${selected.vitalSigns.spO2 < 94 ? 'text-red-600' : ''}`}>{selected.vitalSigns.spO2}%</p></div>
                    <div><p className="text-xs text-slate-400">Pain</p><p className={`font-bold text-sm ${selected.vitalSigns.pain >= 7 ? 'text-red-600' : selected.vitalSigns.pain >= 4 ? 'text-orange-600' : 'text-green-600'}`}>{selected.vitalSigns.pain}/10</p></div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-500">Arrived:</span> {selected.arrivedAt}</div>
                  <div><span className="text-slate-500">Wait:</span> <strong>{selected.waitTime} min</strong></div>
                  <div><span className="text-slate-500">Status:</span> <Badge tone="blue">{selected.status}</Badge></div>
                  <div><span className="text-slate-500">Priority:</span> {selected.priority}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Call Next</button>
              <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Order Lab</button>
              <button onClick={() => {}} className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">Send to Pharmacy</button>
              <button onClick={() => {}} className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">Complete</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
