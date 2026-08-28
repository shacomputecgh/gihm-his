import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface BirthRecord { id: string; babyName: string; motherName: string; fatherName: string; dob: string; timeOfBirth: string; sex: 'Male' | 'Female'; weight: string; length: string; apgar1: number; apgar5: number; deliveredBy: string; mode: 'Normal VD' | 'Assisted VD' | 'C-Section' | 'Breech'; complications: string; certificateIssued: boolean; }
interface DeathRecord { id: string; patientName: string; mrn: string; age: number; sex: string; dateOfDeath: string; timeOfDeath: string; causeOfDeath: string; underlyingCause: string; certifiedBy: string; postMortem: boolean; certificateIssued: boolean; burialPermit: boolean; }

const BIRTHS: BirthRecord[] = [
  { id: 'BR-001', babyName: 'Kwaku Asante', motherName: 'Akua Asante', fatherName: 'Kwame Asante', dob: '2026-08-26', timeOfBirth: '03:45', sex: 'Male', weight: '3.2kg', length: '50cm', apgar1: 8, apgar5: 9, deliveredBy: 'Dr. Ama Darko', mode: 'Normal VD', complications: 'None', certificateIssued: true },
  { id: 'BR-002', babyName: 'Ama Mensah', motherName: 'Esi Mensah', fatherName: 'Kofi Mensah', dob: '2026-08-26', timeOfBirth: '09:12', sex: 'Female', weight: '2.8kg', length: '48cm', apgar1: 9, apgar5: 10, deliveredBy: 'Midwife Abena', mode: 'Normal VD', complications: 'None', certificateIssued: true },
  { id: 'BR-003', babyName: 'Nana Osei Jr.', motherName: 'Akua Osei', fatherName: 'Nana Osei', dob: '2026-08-25', timeOfBirth: '15:30', sex: 'Male', weight: '3.8kg', length: '52cm', apgar1: 7, apgar5: 8, deliveredBy: 'Dr. Ama Darko', mode: 'C-Section', complications: 'Shoulder dystocia resolved', certificateIssued: false },
  { id: 'BR-004', babyName: 'Efua Darko', motherName: 'Abena Darko', fatherName: 'Yaw Darko', dob: '2026-08-25', timeOfBirth: '22:15', sex: 'Female', weight: '3.0kg', length: '49cm', apgar1: 8, apgar5: 9, deliveredBy: 'Midwife Abena', mode: 'Assisted VD', complications: 'Vacuum extraction', certificateIssued: false },
];

const DEATHS: DeathRecord[] = [
  { id: 'DR-001', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0334', age: 78, sex: 'M', dateOfDeath: '2026-08-25', timeOfDeath: '04:30', causeOfDeath: 'Cardiorespiratory arrest', underlyingCause: 'Metastatic lung cancer', certifiedBy: 'Dr. Yaw Boateng', postMortem: false, certificateIssued: true, burialPermit: true },
  { id: 'DR-002', patientName: 'Ama Boateng', mrn: 'MRN-2024-0667', age: 65, sex: 'F', dateOfDeath: '2026-08-24', timeOfDeath: '16:45', causeOfDeath: 'Multi-organ failure', underlyingCause: 'Severe sepsis', certifiedBy: 'Dr. Ama Darko', postMortem: true, certificateIssued: true, burialPermit: true },
];

export default function DeathBirthRecordsEnhanced() {
  const toast = useToast();
  const [tab, setTab] = useState<'births' | 'deaths'>('births');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Birth & Death Records</h1>
          <p className="text-slate-500 text-sm">Vital records management and certificate generation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('births')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'births' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>👶 Birth Records</button>
          <button onClick={() => setTab('deaths')} className className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'deaths' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>📋 Death Records</button>
          <button onClick={() => {}} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">+ New Record</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold">{BIRTHS.length}</p><p className="text-xs text-slate-500">Births Today</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-pink-600">{BIRTHS.filter(b => b.sex === 'Female').length}</p><p className="text-xs text-slate-500">Female</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{BIRTHS.filter(b => b.sex === 'Male').length}</p><p className="text-xs text-slate-500">Male</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-slate-600">{DEATHS.length}</p><p className="text-xs text-slate-500">Deaths (7 days)</p></Card>
      </div>

      {tab === 'births' ? (
        <div className="space-y-3">
          {BIRTHS.map(b => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{b.babyName}</span>
                    <Badge tone={b.sex === 'Male' ? 'blue' : 'pink'}>{b.sex}</Badge>
                    <Badge tone={b.certificateIssued ? 'green' : 'gold'}>{b.certificateIssued ? 'Certificate Issued' : 'Pending Certificate'}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-2 text-sm text-slate-600">
                    <div><span className="text-slate-400">Mother:</span> {b.motherName}</div>
                    <div><span className="text-slate-400">Father:</span> {b.fatherName}</div>
                    <div><span className="text-slate-400">Born:</span> {b.dob} {b.timeOfBirth}</div>
                    <div><span className="text-slate-400">Delivered by:</span> {b.deliveredBy}</div>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>⚖️ {b.weight}</span>
                    <span>📏 {b.length}</span>
                    <span>🫁 Apgar: {b.apgar1}/{b.apgar5}</span>
                    <span>🏥 {b.mode}</span>
                  </div>
                  {b.complications !== 'None' && <p className="text-xs text-orange-600 mt-1">⚠️ {b.complications}</p>}
                </div>
                <div className="flex gap-2">
                  {!b.certificateIssued && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Issue Certificate</button>}
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Print</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DEATHS.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{d.patientName}</span>
                    <Badge tone="red">Deceased</Badge>
                    <Badge tone={d.certificateIssued ? 'green' : 'gold'}>{d.certificateIssued ? 'Certificate Issued' : 'Pending Certificate'}</Badge>
                    {d.postMortem && <Badge tone="blue">Post-Mortem</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                    <div><span className="text-slate-400">MRN:</span> {d.mrn}</div>
                    <div><span className="text-slate-400">Age/Sex:</span> {d.age}y {d.sex}</div>
                    <div><span className="text-slate-400">Date/Time:</span> {d.dateOfDeath} {d.timeOfDeath}</div>
                  </div>
                  <div className="mt-2 text-sm"><span className="text-slate-400">Cause:</span> <strong>{d.causeOfDeath}</strong> — {d.underlyingCause}</div>
                  <div className="mt-1 text-sm text-slate-500">Certified by: {d.certifiedBy}</div>
                </div>
                <div className="flex gap-2">
                  {!d.certificateIssued && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Issue Certificate</button>}
                  {!d.burialPermit && <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Issue Burial Permit</button>}
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Print</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
