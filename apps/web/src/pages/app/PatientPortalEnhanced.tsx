import { useState } from 'react';
import { Badge } from '../../components/ui';

interface PortalAppointment { id: string; doctor: string; specialty: string; date: string; time: string; status: 'Upcoming' | 'Completed' | 'Cancelled'; reason: string; }
interface PortalMessage { id: string; from: string; subject: string; date: string; read: boolean; preview: string; }
interface PortalRecord { id: string; date: string; type: string; doctor: string; facility: string; }

const APPOINTMENTS: PortalAppointment[] = [
  { id: 'APT-001', doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', date: '2026-08-25', time: '10:00', status: 'Upcoming', reason: 'Follow-up — blood pressure check' },
  { id: 'APT-002', doctor: 'Dr. James Mensah', specialty: 'General Practice', date: '2026-08-20', time: '09:00', status: 'Completed', reason: 'Annual check-up' },
];

const MESSAGES: PortalMessage[] = [
  { id: 'MSG-001', from: 'Dr. Sarah Johnson', subject: 'Your lab results are ready', date: '2026-08-22', read: false, preview: 'Your recent blood work results have been reviewed...' },
  { id: 'MSG-002', from: 'Pharmacy', subject: 'Prescription ready for collection', date: '2026-08-21', read: true, preview: 'Your prescription for Amlodipine 5mg is ready...' },
  { id: 'MSG-003', from: 'GIHM-HIS', subject: 'Appointment reminder', date: '2026-08-23', read: false, preview: 'You have an appointment with Dr. Johnson on Aug 25...' },
];

const RECORDS: PortalRecord[] = [
  { id: 'REC-001', date: '2026-08-22', type: 'Lab Result', doctor: 'Dr. Sarah Johnson', facility: 'Korle-Bu Teaching Hospital' },
  { id: 'REC-002', date: '2026-08-20', type: 'Consultation', doctor: 'Dr. James Mensah', facility: 'Korle-Bu Teaching Hospital' },
  { id: 'REC-003', date: '2026-08-15', type: 'Prescription', doctor: 'Dr. Sarah Johnson', facility: 'Korle-Bu Teaching Hospital' },
  { id: 'REC-004', date: '2026-08-10', type: 'X-Ray Report', doctor: 'Dr. Ama Darko', facility: 'Korle-Bu Teaching Hospital' },
];

type Tab = 'appointments' | 'messages' | 'records' | 'prescriptions' | 'profile';

export default function PatientPortalEnhanced() {
  const [tab, setTab] = useState<Tab>('appointments');
  const [showBooking, setShowBooking] = useState(false);

  const unreadCount = MESSAGES.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Health Portal</h1><p className="text-gray-500">View your health records, book appointments, and communicate with your care team</p></div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-1">
        {([
          { key: 'appointments', label: '📅 Appointments', count: APPOINTMENTS.filter((a) => a.status === 'Upcoming').length },
          { key: 'messages', label: '💬 Messages', count: unreadCount },
          { key: 'records', label: '📋 Health Records', count: RECORDS.length },
          { key: 'prescriptions', label: '💊 Prescriptions' },
          { key: 'profile', label: '👤 My Profile' },
        ] as { key: Tab; label: string; count?: number }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 px-3 py-2 text-xs font-medium rounded-t-lg transition ${tab === t.key ? 'bg-white border border-b-0 border-slate-200 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            {t.label} {t.count !== undefined && t.count > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowBooking(!showBooking)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">{showBooking ? '✕ Cancel' : '+ Book Appointment'}</button></div>
          {showBooking && (
            <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
              <h3 className="font-bold text-green-800">Book New Appointment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Specialty *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>General Practice</option><option>Cardiology</option><option>Dermatology</option><option>ENT</option><option>Endocrinology</option><option>Gastroenterology</option><option>Neurology</option><option>Ophthalmology</option><option>Orthopaedics</option><option>Other</option></select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Preferred Date *</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Preferred Time</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Morning (8am-12pm)</option><option>Afternoon (12pm-5pm)</option></select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason for Visit *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Brief reason..." /></div>
              </div>
              <button onClick={() => {}} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Book Appointment</button>
            </div>
          )}
          <div className="space-y-3">
            {APPOINTMENTS.map((a) => (
              <div key={a.id} className="bg-white rounded-lg border p-4 flex items-center justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold text-sm">{a.doctor}</span><Badge className="bg-slate-100 text-slate-600">{a.specialty}</Badge></div>
                  <div className="text-xs text-slate-500 mt-1">📅 {a.date} at {a.time} · {a.reason}</div>
                </div>
                <Badge className={a.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-3">
          {MESSAGES.map((m) => (
            <div key={m.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${!m.read ? 'border-l-4 border-l-blue-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!m.read ? 'font-bold' : 'font-medium'}`}>{m.from}</span>
                  {!m.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="text-xs text-slate-400">{m.date}</span>
              </div>
              <div className="text-sm font-medium mt-1">{m.subject}</div>
              <div className="text-xs text-slate-500 mt-1">{m.preview}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'records' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Facility</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {RECORDS.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm">{r.date}</td>
                  <td className="px-4 py-2 text-sm">{r.type}</td>
                  <td className="px-4 py-2 text-sm text-slate-600">{r.doctor}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{r.facility}</td>
                  <td className="px-4 py-2"><button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="bg-white rounded-lg border p-6 text-center text-slate-500">
          <p className="text-lg mb-2">💊 Your Prescriptions</p>
          <p className="text-sm">Active and past prescriptions will appear here.</p>
          <div className="mt-4 bg-green-50 rounded-lg p-4 text-left max-w-md mx-auto">
            <div className="font-semibold text-sm text-green-800">Amlodipine 5mg</div>
            <div className="text-xs text-green-700 mt-1">1 tablet once daily · 30 days · Dr. Sarah Johnson</div>
            <div className="text-xs text-slate-400 mt-1">Status: Active · Next refill: 2026-09-15</div>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold">My Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Name:</span> <span className="font-medium">Kwame Asante</span></div>
            <div><span className="text-slate-400">MRN:</span> <span className="font-mono">MRN-2024-0891</span></div>
            <div><span className="text-slate-400">Date of Birth:</span> <span className="font-medium">1985-03-15</span></div>
            <div><span className="text-slate-400">Sex:</span> <span className="font-medium">Male</span></div>
            <div><span className="text-slate-400">Blood Group:</span> <span className="font-medium">O+</span></div>
            <div><span className="text-slate-400">Phone:</span> <span className="font-medium">+233 24 123 4567</span></div>
            <div><span className="text-slate-400">Email:</span> <span className="font-medium">kwame.asante@email.com</span></div>
            <div><span className="text-slate-400">Insurance:</span> <span className="font-medium">NHIS (NHIS-2024-5678)</span></div>
          </div>
          <div><span className="text-slate-400 text-sm">Allergies:</span><div className="mt-1 inline-block border border-red-500 text-red-600 text-xs font-bold px-2 py-0.5 rounded">⚠ Penicillin</div></div>
        </div>
      )}
    </div>
  );
}
