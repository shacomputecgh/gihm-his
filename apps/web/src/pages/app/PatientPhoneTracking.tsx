import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface TrackedPatient { id: string; name: string; phone: string; mrn: string; lastSeen: string; reason: string; status: 'Active' | 'Contacted' | 'Located' | 'Closed'; ward: string; dischargeType: string; lastLocation: string; assignedTo: string; notes: string; }

const TRACKED: TrackedPatient[] = [
  { id: 'TRK-001', name: 'Kofi Mensah', phone: '+233 24 567 8901', mrn: 'MRN-2024-0891', lastSeen: '2026-08-25 14:30', reason: 'Left without discharge', status: 'Active', ward: 'Medical Ward A', dischargeType: 'AMA (Against Medical Advice)', lastLocation: 'Hospital gate', assignedTo: 'Social Worker', notes: 'Patient has uncontrolled diabetes, refused insulin. Family notified.' },
  { id: 'TRK-002', name: 'Ama Boateng', phone: '+233 50 123 4567', mrn: 'MRN-2024-1234', lastSeen: '2026-08-24 09:15', reason: 'Missed follow-up appointment', status: 'Contacted', ward: 'Maternity', dischargeType: 'Routine discharge', lastLocation: 'N/A', assignedTo: 'Midwife', notes: 'Called — patient reports baby is well. Rescheduled appointment for Friday.' },
  { id: 'TRK-003', name: 'Yaw Frimpong', phone: '+233 20 987 6543', mrn: 'MRN-2024-0567', lastSeen: '2026-08-20 18:45', reason: 'Elopement risk — psychiatric', status: 'Located', ward: 'Psychiatric Unit', dischargeType: 'Elopement', lastLocation: 'At home — family confirmed', assignedTo: 'Psychiatric Nurse', notes: 'Patient found at home by family. Medication adherence poor. Home visit scheduled.' },
  { id: 'TRK-004', name: 'Akosua Mensah', phone: '+233 26 456 7890', mrn: 'MRN-2024-0998', lastSeen: '2026-08-23 11:00', reason: 'Did not collect test results', status: 'Active', ward: 'OPD', dischargeType: 'N/A', lastLocation: 'Unknown', assignedTo: 'Receptionist', notes: 'Multiple calls — phone unreachable. WhatsApp message sent.' },
  { id: 'TRK-005', name: 'Nana Agyeman', phone: '+233 27 321 6549', mrn: 'MRN-2024-0776', lastSeen: '2026-08-26 08:00', reason: 'Insurance claim verification', status: 'Active', ward: 'Billing', dischargeType: 'N/A', lastLocation: 'N/A', assignedTo: 'Insurance Officer', notes: 'NHIS card expired. Need updated card for claim processing.' },
];

const _STATUS_STYLE: Record<string, string> = { Active: 'bg-red-100 text-red-800', Contacted: 'bg-yellow-100 text-yellow-800', Located: 'bg-green-100 text-green-800', Closed: 'bg-slate-100 text-slate-600' };

export default function PatientPhoneTracking() {
  const [tracked] = useState<TrackedPatient[]>(TRACKED);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? tracked : tracked.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patient Phone Tracking</h1>
        <p className="text-slate-500 text-sm">Track patients who leave AMA, miss appointments, or are difficult to reach</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Active Tracking</p><p className="text-2xl font-bold text-red-600">{tracked.filter(t => t.status === 'Active').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Contacted</p><p className="text-2xl font-bold text-yellow-600">{tracked.filter(t => t.status === 'Contacted').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Located</p><p className="text-2xl font-bold text-green-600">{tracked.filter(t => t.status === 'Located').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Total Tracked</p><p className="text-2xl font-bold">{tracked.length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Active', 'Contacted', 'Located', 'Closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(t => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{t.name}</h3>
                  <Badge tone={t.status === 'Active' ? 'red' : t.status === 'Contacted' ? 'gold' : 'green'}>{t.status}</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">📞 {t.phone} · MRN: {t.mrn}</p>
                <p className="text-sm mt-2"><span className="font-medium">Reason:</span> {t.reason}</p>
                <p className="text-sm text-slate-500">Ward: {t.ward} · Last seen: {t.lastSeen} · Assigned: {t.assignedTo}</p>
                {t.lastLocation !== 'N/A' && <p className="text-sm text-slate-500">📍 Last known location: {t.lastLocation}</p>}
                <p className="text-sm mt-2 text-slate-600 italic">📝 {t.notes}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {}} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600">📞 Call</button>
                <button onClick={() => {}} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600">💬 WhatsApp</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
