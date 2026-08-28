import { useState, useMemo } from 'react';
import { Card, Badge, Input } from '../../components/ui';

interface PostOpPatient {
  id: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  anaesthetist: string;
  theatre: string;
  theatreOutTime: string;
  aldreteScore: number;
  painScore: number;
  temperature: string;
  bp: string;
  hr: string;
  rr: string;
  spo2: string;
  consciousness: string;
  ambulation: string;
  nausea: string;
  surgeonVisit: boolean;
  analgesiaGiven: string;
  complications: string;
  dischargeCriteria: string;
  dischargeTime: string;
  dischargedBy: string;
  destination: string;
  status: string;
}

export default function PostOpRecovery() {
  const [records] = useState<PostOpPatient[]>([
    { id: 'PR-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', procedure: 'Appendicectomy', surgeon: 'Dr. Osei', anaesthetist: 'Dr. Anane', theatre: 'Theatre 3 (Minor)', theatreOutTime: '2026-08-24 09:45', aldreteScore: 9, painScore: 3, temperature: '36.8', bp: '125/78', hr: '82', rr: '16', spo2: '98%', consciousness: 'Alert', ambulation: 'With Assistance', nausea: 'None', surgeonVisit: true, analgesiaGiven: 'Paracetamol 1g IV + Tramadol 50mg IV', complications: 'None', dischargeCriteria: 'Aldrete >= 9, Pain < 4, No nausea', dischargeTime: '', dischargedBy: '', destination: '', status: 'Recovering' },
    { id: 'PR-002', patientName: 'Ama Darko', mrn: 'MRN-002', procedure: 'Caesarean Section', surgeon: 'Dr. Akosua', anaesthetist: 'Dr. Kwesi', theatre: 'Theatre 5 (Obstetric)', theatreOutTime: '2026-08-24 10:30', aldreteScore: 10, painScore: 4, temperature: '37.0', bp: '118/72', hr: '88', rr: '18', spo2: '99%', consciousness: 'Alert', ambulation: 'In Bed', nausea: 'None', surgeonVisit: true, analgesiaGiven: 'Paracetamol 1g IV + Ibuprofen 400mg + Morphine PCA', complications: 'None', dischargeCriteria: 'Aldrete >= 9, Vital signs stable', dischargeTime: '2026-08-24 12:00', dischargedBy: 'Nurse Esi', destination: 'Maternity Ward', status: 'Discharged to Ward' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.procedure.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const inPACU = records.filter(r => r.status === 'Recovering').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Post-Operative Recovery (PACU)</h1>
          <p className="text-gray-600">Post-anaesthesia care — Aldrete scoring, vital signs, discharge criteria</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Cases Today</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4 border-l-4 border-blue-500"><p className="text-sm text-gray-500">In PACU (Recovering)</p><p className="text-2xl font-bold text-blue-600">{inPACU}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Discharged to Ward</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Discharged to Ward').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Avg Aldrete Score</p><p className="text-2xl font-bold">{records.length > 0 ? (records.reduce((sum, r) => sum + r.aldreteScore, 0) / records.length).toFixed(1) : '-'}</p></Card>
      </div>

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient or procedure..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filtered.map(r => (
          <Card key={r.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{r.patientName}</h3>
                <p className="text-sm text-gray-500">{r.mrn} | {r.procedure} | {r.theatre}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={r.status === 'Recovering' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>{r.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Aldrete Score</p>
                <p className={`text-xl font-bold ${r.aldreteScore >= 9 ? 'text-green-600' : r.aldreteScore >= 7 ? 'text-yellow-600' : 'text-red-600'}`}>{r.aldreteScore}/10</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Pain (NRS)</p>
                <p className={`text-xl font-bold ${r.painScore <= 3 ? 'text-green-600' : r.painScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>{r.painScore}/10</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">BP</p>
                <p className="text-lg font-bold">{r.bp}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">HR</p>
                <p className="text-lg font-bold">{r.hr}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">SpO2</p>
                <p className="text-lg font-bold">{r.spo2}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-lg font-bold">{r.temperature}°C</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500">Consciousness:</span> <span className="font-medium">{r.consciousness}</span></div>
              <div><span className="text-gray-500">Ambulation:</span> <span className="font-medium">{r.ambulation}</span></div>
              <div><span className="text-gray-500">Nausea/Vomiting:</span> <span className="font-medium">{r.nausea}</span></div>
              <div><span className="text-gray-500">Surgeon Visit:</span> {r.surgeonVisit ? <Badge className="bg-green-100 text-green-800">Done</Badge> : <Badge className="bg-red-100 text-red-800">Pending</Badge>}</div>
            </div>

            <div className="mt-3 text-sm">
              <p><span className="text-gray-500">Analgesia Given:</span> <span className="font-medium">{r.analgesiaGiven}</span></p>
              {r.dischargeTime && <p><span className="text-gray-500">Discharged:</span> <span className="font-medium">{r.dischargeTime} to {r.destination}</span></p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
