import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface Surgery {
  id: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  anaesthetist: string;
  theatre: string;
  date: string;
  scheduledTime: string;
  estimatedDuration: number; // minutes
  priority: 'Elective' | 'Urgent' | 'Emergency';
  anaesthesiaType: 'General' | 'Regional' | 'Spinal' | 'Local' | 'Sedation';
  laterality: 'Left' | 'Right' | 'Bilateral' | 'N/A';
  implantRequired: boolean;
  specialRequirements: string[];
  preOpChecklist: boolean;
  consentSigned: boolean;
  bloodTyped: boolean;
  fastingConfirmed: boolean;
  marksVerified: boolean;
  status: 'Scheduled' | 'Pre-Op' | 'In Theatre' | 'Recovery' | 'Completed' | 'Cancelled';
}

const SAMPLE: Surgery[] = [
  { id: 'SRG-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Appiah', anaesthetist: 'Dr. Kumah', theatre: 'Theatre 1', date: '2026-08-26', scheduledTime: '08:00', estimatedDuration: 90, priority: 'Elective', anaesthesiaType: 'General', laterality: 'N/A', implantRequired: false, specialRequirements: ['Lithotomy position', 'Video tower'], preOpChecklist: true, consentSigned: true, bloodTyped: true, fastingConfirmed: true, marksVerified: true, status: 'Scheduled' },
  { id: 'SRG-002', patientName: 'Ama Osei', mrn: 'MRN-12350', procedure: 'Caesarean Section', surgeon: 'Dr. Asantewaa', anaesthetist: 'Dr. Darko', theatre: 'Theatre 2', date: '2026-08-26', scheduledTime: '09:30', estimatedDuration: 60, priority: 'Urgent', anaesthesiaType: 'Spinal', laterality: 'N/A', implantRequired: false, specialRequirements: ['Neonatal team on standby', 'Blood bank alert'], preOpChecklist: true, consentSigned: true, bloodTyped: true, fastingConfirmed: true, marksVerified: false, status: 'Pre-Op' },
  { id: 'SRG-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', procedure: 'Coronary Angioplasty + Stent', surgeon: 'Dr. Asantewaa', anaesthetist: 'Dr. Kumah', theatre: 'Cath Lab', date: '2026-08-26', scheduledTime: '13:00', estimatedDuration: 120, priority: 'Urgent', anaesthesiaType: 'Sedation', laterality: 'N/A', implantRequired: true, specialRequirements: ['DES stent on standby', 'IABP on standby'], preOpChecklist: true, consentSigned: true, bloodTyped: true, fastingConfirmed: true, marksVerified: false, status: 'Scheduled' },
  { id: 'SRG-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', procedure: 'Right Total Hip Replacement', surgeon: 'Dr. Mensah', anaesthetist: 'Dr. Darko', theatre: 'Theatre 3', date: '2026-08-27', scheduledTime: '07:30', estimatedDuration: 150, priority: 'Elective', anaesthesiaType: 'General', laterality: 'Right', implantRequired: true, specialRequirements: ['Orthopaedic table', 'Image intensifier', 'CEMENTLESS implant'], preOpChecklist: true, consentSigned: true, bloodTyped: true, fastingConfirmed: true, marksVerified: true, status: 'Scheduled' },
  { id: 'SRG-005', patientName: 'Yaw Darko', mrn: 'MRN-12380', procedure: 'Emergency Appendicectomy', surgeon: 'Dr. Appiah', anaesthetist: 'Dr. Kumah', theatre: 'Theatre 1', date: '2026-08-25', scheduledTime: '16:00', estimatedDuration: 60, priority: 'Emergency', anaesthesiaType: 'General', laterality: 'Right', implantRequired: false, specialRequirements: ['Emergency tray', 'Laparoscopic set'], preOpChecklist: false, consentSigned: true, bloodTyped: false, fastingConfirmed: false, marksVerified: false, status: 'In Theatre' },
  { id: 'SRG-006', patientName: 'Esi Kumah', mrn: 'MRN-12390', procedure: 'Incisional Hernia Repair', surgeon: 'Dr. Mensah', anaesthetist: 'Dr. Darko', theatre: 'Theatre 2', date: '2026-08-25', scheduledTime: '09:00', estimatedDuration: 120, priority: 'Elective', anaesthesiaType: 'General', laterality: 'N/A', implantRequired: true, specialRequirements: ['Mesh implant', 'Antibiotic prophylaxis'], preOpChecklist: true, consentSigned: true, bloodTyped: true, fastingConfirmed: true, marksVerified: true, status: 'Recovery' },
];

const PRIORITY_COLORS: Record<string, string> = { Elective: 'bg-blue-100 text-blue-800', Urgent: 'bg-orange-100 text-orange-800', Emergency: 'bg-red-100 text-red-800' };
const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-gray-100 text-gray-800', 'Pre-Op': 'bg-yellow-100 text-yellow-800', 'In Theatre': 'bg-blue-100 text-blue-800', Recovery: 'bg-purple-100 text-purple-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' };

export default function SurgeryBooking() {
  const [tab, setTab] = useState<'overview' | 'schedule' | 'theatre' | 'safety'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Surgery Booking</h1>
          <p className="text-gray-600 mt-1">Theatre scheduling · Surgery booking · Safety checklists · Recovery tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today Surgeries', value: SAMPLE.length, icon: '🏥', color: 'text-blue-600' },
          { label: 'In Theatre', value: SAMPLE.filter(s => s.status === 'In Theatre').length, icon: '🔴', color: 'text-red-600' },
          { label: 'Scheduled', value: SAMPLE.filter(s => s.status === 'Scheduled').length, icon: '📅', color: 'text-gray-600' },
          { label: 'Recovery', value: SAMPLE.filter(s => s.status === 'Recovery').length, icon: '💤', color: 'text-purple-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'schedule', 'theatre', 'safety'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'schedule' ? '📅 Schedule' : t === 'theatre' ? '🏥 Theatre Map' : '✅ Safety'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Surgery by Priority</h3>
            <div className="space-y-3">
              {['Emergency', 'Urgent', 'Elective'].map(p => {
                const count = SAMPLE.filter(s => s.priority === p).length;
                return (
                  <div key={p} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <Badge className={PRIORITY_COLORS[p]}>{p}</Badge><span className="font-bold text-lg">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Anaesthesia Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, s) => { a[s.anaesthesiaType] = (a[s.anaesthesiaType] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{type}</span><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Procedure</th>
                <th className="px-4 py-3 text-left">Surgeon</th>
                <th className="px-4 py-3 text-left">Theatre</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{s.scheduledTime}</td>
                  <td className="px-4 py-3"><div className="font-medium">{s.patientName}</div><div className="text-xs text-gray-500">{s.mrn}</div></td>
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate">{s.procedure}</td>
                  <td className="px-4 py-3">{s.surgeon}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{s.theatre}</Badge></td>
                  <td className="px-4 py-3"><Badge className={PRIORITY_COLORS[s.priority]}>{s.priority}</Badge></td>
                  <td className="px-4 py-3">{s.estimatedDuration} min</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'theatre' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Theatre 1', 'Theatre 2', 'Theatre 3', 'Cath Lab'].map(t => {
            const case_in = SAMPLE.find(s => s.theatre === t && s.status === 'In Theatre');
            const next = SAMPLE.find(s => s.theatre === t && s.status === 'Scheduled');
            return (
              <Card key={t} className={`p-5 ${case_in ? 'ring-2 ring-red-500' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-900">{t}</h4>
                  <Badge className={case_in ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>{case_in ? '🔴 IN USE' : '🟢 Available'}</Badge>
                </div>
                {case_in && (
                  <div className="p-3 bg-red-50 rounded-lg mb-2">
                    <div className="text-sm font-bold text-red-800">{case_in.procedure}</div>
                    <div className="text-xs text-red-600">{case_in.patientName} · {case_in.surgeon} · Started {case_in.scheduledTime}</div>
                  </div>
                )}
                {next && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Next:</div>
                    <div className="text-sm font-medium">{next.procedure}</div>
                    <div className="text-xs text-gray-500">{next.patientName} · {next.scheduledTime}</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'safety' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">WHO Surgical Safety Checklist</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="font-bold text-yellow-800">⏱️ Sign In (Before Anaesthesia)</div>
                <div className="mt-2 space-y-1 text-sm">
                  {['Patient identity confirmed', 'Surgical site marked', 'Consent verified', 'Anaesthesia safety check', 'Allergy alert', 'Airway risk assessed', 'Blood loss risk assessed'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2"><span className="text-green-600">✅</span>{item}</div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-800">🔪 Time Out (Before Incision)</div>
                <div className="mt-2 space-y-1 text-sm">
                  {['Team introduced', 'Procedure confirmed', 'Critical events reviewed', 'Antibiotic prophylaxis given', 'Imaging displayed'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2"><span className="text-green-600">✅</span>{item}</div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-800">✔️ Sign Out (Before Leaving Theatre)</div>
                <div className="mt-2 space-y-1 text-sm">
                  {['Procedure recorded', 'Instrument count correct', 'Specimen labelled', 'Equipment issues noted', 'Recovery plan confirmed'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2"><span className="text-green-600">✅</span>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Pre-Op Checklist Status</h3>
            <div className="space-y-2">
              {SAMPLE.map(s => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div><div className="font-medium">{s.patientName}</div><div className="text-xs text-gray-500">{s.procedure}</div></div>
                    <Badge className={s.preOpChecklist && s.consentSigned && s.bloodTyped && s.fastingConfirmed && s.marksVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {s.preOpChecklist && s.consentSigned && s.bloodTyped && s.fastingConfirmed && s.marksVerified ? '✅ Ready' : '⏳ Incomplete'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-1 text-xs">
                    {[
                      { label: 'Consent', ok: s.consentSigned },
                      { label: 'Blood', ok: s.bloodTyped },
                      { label: 'Fasting', ok: s.fastingConfirmed },
                      { label: 'Marks', ok: s.marksVerified },
                      { label: 'Checklist', ok: s.preOpChecklist },
                    ].map(item => (
                      <span key={item.label} className={`px-2 py-0.5 rounded ${item.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
