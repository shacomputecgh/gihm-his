import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';
import { printPDF, table, today, type PDFDocument } from '../../lib/pdfGenerator';

interface TriageEntry {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  arrivalTime: string; chiefComplaint: string;
  esiLevel: 1 | 2 | 3 | 4 | 5;
  vitals: { bp: string; hr: number; temp: number; spO2: number; rr: number; pain: number };
  waitTime: string; assignedTo: string;
  status: 'Waiting' | 'In Triage' | 'In Treatment' | 'Admitted' | 'Discharged' | 'Left Without Treatment';
}

const INITIAL: TriageEntry[] = [
  { id: 'ET-001', patientName: 'Kwaku Mensah', mrn: 'MRN-2026-200', age: 55, sex: 'M', arrivalTime: '08:15', chiefComplaint: 'Crushing chest pain, radiating to left arm', esiLevel: 1, vitals: { bp: '165/95', hr: 110, temp: 36.8, spO2: 94, rr: 24, pain: 9 }, waitTime: '0 min', assignedTo: 'Dr. Asante', status: 'In Treatment' },
  { id: 'ET-002', patientName: 'Ama Darko', mrn: 'MRN-2026-201', age: 28, sex: 'F', arrivalTime: '08:30', chiefComplaint: 'Severe abdominal pain, 8 months pregnant', esiLevel: 2, vitals: { bp: '110/70', hr: 95, temp: 37.2, spO2: 98, rr: 20, pain: 7 }, waitTime: '15 min', assignedTo: 'Dr. Afriyie', status: 'In Triage' },
  { id: 'ET-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-202', age: 35, sex: 'M', arrivalTime: '09:00', chiefComplaint: 'High fever, headache, stiff neck', esiLevel: 2, vitals: { bp: '125/80', hr: 98, temp: 39.2, spO2: 97, rr: 20, pain: 6 }, waitTime: '30 min', assignedTo: '', status: 'Waiting' },
  { id: 'ET-004', patientName: 'Efua Ansah', mrn: 'MRN-2026-203', age: 42, sex: 'F', arrivalTime: '09:15', chiefComplaint: 'Sprained ankle — weight bearing', esiLevel: 4, vitals: { bp: '118/72', hr: 72, temp: 36.6, spO2: 99, rr: 16, pain: 4 }, waitTime: '45 min', assignedTo: '', status: 'Waiting' },
  { id: 'ET-005', patientName: 'Kofi Amoako', mrn: 'MRN-2026-204', age: 8, sex: 'M', arrivalTime: '09:30', chiefComplaint: 'Runny nose, mild cough, afebrile', esiLevel: 5, vitals: { bp: '95/60', hr: 88, temp: 36.7, spO2: 99, rr: 18, pain: 1 }, waitTime: '60 min', assignedTo: '', status: 'Waiting' },
];

const ESI_CONFIG: Record<number, { label: string; color: string; tone: 'red' | 'gold' | 'blue' | 'green'; maxWait: string }> = {
  1: { label: 'Resuscitation', color: 'bg-red-600 text-white', tone: 'red', maxWait: '0 min' },
  2: { label: 'Emergent', color: 'bg-red-100 text-red-800', tone: 'red', maxWait: '<14 min' },
  3: { label: 'Urgent', color: 'bg-orange-100 text-orange-800', tone: 'gold', maxWait: '<60 min' },
  4: { label: 'Less Urgent', color: 'bg-yellow-100 text-yellow-800', tone: 'gold', maxWait: '<120 min' },
  5: { label: 'Non-Urgent', color: 'bg-green-100 text-green-800', tone: 'green', maxWait: '<240 min' },
};

export default function EmergencyTriageEnhanced() {
  const [entries] = useState<TriageEntry[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const toast = useToast();
  const waiting = entries.filter((e) => e.status === 'Waiting').length;
  const critical = entries.filter((e) => e.esiLevel <= 2).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Emergency Department Triage</h1><p className="text-gray-500">ESI scoring, real-time queue, waiting time tracking, and rapid triage</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const doc: PDFDocument = { title: 'EMERGENCY DEPARTMENT TRIAGE REPORT', subtitle: `Generated ${today()}` ,
              content: table(['Patient', 'ESI', 'Complaint', 'Wait', 'Status'], entries.map((e) => [e.patientName, `ESI ${e.esiLevel}`, e.chiefComplaint.substring(0, 30) + '...', e.waitTime, e.status])),
              footer: `Generated on ${today()} · Greater Accra Regional Hospital`
            }; printPDF(doc);
          }}>🖨 Print</Button>
          <Button onClick={() => setShowForm(true)}>+ New Triage</Button>
        </div>
      </div>
      {critical > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 font-bold">🚨 {critical} critical/emergent patient(s) in ED</div>}
      <div className="grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as const).map((level) => (
          <button key={level} onClick={() => setFilter(filter === `ESI-${level}` ? '' : `ESI-${level}`)} className={`p-3 rounded-lg text-center transition ${ESI_CONFIG[level]?.color ?? ""} ${filter === `ESI-${level}` ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}>
            <div className="text-lg font-bold">ESI {level}</div>
            <div className="text-xs opacity-80">{ESI_CONFIG[level]?.label}</div>
            <div className="text-xl font-bold mt-1">{entries.filter((e) => e.esiLevel === level).length}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{waiting}</div><div className="text-xs text-gray-500">Waiting</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{entries.filter((e) => e.status === 'In Treatment').length}</div><div className="text-xs text-gray-500">In Treatment</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{entries.filter((e) => e.status === 'Discharged').length}</div><div className="text-xs text-gray-500">Discharged</div></Card>
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">ESI</th><th className="p-2">Patient</th><th className="p-2">Age/Sex</th><th className="p-2">Chief Complaint</th><th className="p-2">Vitals</th><th className="p-2">Wait</th><th className="p-2">Status</th></tr></thead>
            <tbody>{entries.filter((e) => !filter || `ESI-${e.esiLevel}` === filter).sort((a, b) => a.esiLevel - b.esiLevel).map((e) => (
              <tr key={e.id} className={`border-b ${e.esiLevel <= 2 ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${ESI_CONFIG[e.esiLevel]?.color}`}>{e.esiLevel}</span></td>
                <td className="p-2 font-medium">{e.patientName}<br /><span className="text-xs text-gray-400">{e.mrn}</span></td>
                <td className="p-2">{e.age}{e.sex}</td>
                <td className="p-2 text-xs max-w-[200px]">{e.chiefComplaint}</td>
                <td className="p-2 text-xs">BP {e.vitals.bp} · HR {e.vitals.hr} · T {e.vitals.temp}°C · SpO₂ {e.vitals.spO2}% · Pain {e.vitals.pain}/10</td>
                <td className="p-2"><span className={e.waitTime.includes('min') && parseInt(e.waitTime) > 60 ? 'text-red-600 font-bold' : ''}>{e.waitTime}</span></td>
                <td className="p-2"><Badge tone={e.status === 'In Treatment' ? 'green' : e.status === 'Waiting' ? 'gold' : 'blue'}>{e.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Emergency Triage</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Chief Complaint *</label><Input placeholder="Main complaint" /></div>
                <div><label className="block text-sm mb-1">ESI Level *</label><select className="w-full border rounded-lg p-2 text-sm"><option>1 — Resuscitation</option><option>2 — Emergent</option><option>3 — Urgent</option><option>4 — Less Urgent</option><option>5 — Non-Urgent</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm mb-1">BP</label><Input placeholder="120/80" /></div>
                <div><label className="block text-sm mb-1">HR</label><Input type="number" placeholder="80" /></div>
                <div><label className="block text-sm mb-1">Temp °C</label><Input type="number" step="0.1" placeholder="37.0" /></div>
                <div><label className="block text-sm mb-1">SpO₂ %</label><Input type="number" placeholder="98" /></div>
                <div><label className="block text-sm mb-1">RR</label><Input type="number" placeholder="16" /></div>
                <div><label className="block text-sm mb-1">Pain (0-10)</label><Input type="number" min="0" max="10" placeholder="0" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Patient triaged'); }}>Triage Patient</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
