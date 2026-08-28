import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type PortalTab = 'dashboard' | 'appointments' | 'records' | 'billing' | 'messages';

interface PatientAppointment { id: string; date: string; time: string; doctor: string; department: string; type: string; status: 'upcoming' | 'completed' | 'cancelled'; }
interface PatientRecord { id: string; date: string; type: string; title: string; doctor: string; department: string; }
interface PatientBill { id: string; date: string; description: string; amount: number; paid: number; status: 'pending' | 'paid' | 'partial'; }

const MOCK_APPTS: PatientAppointment[] = [
  { id: 'PA001', date: '2026-06-07', time: '10:00', doctor: 'Dr. Mensah', department: 'Cardiology', type: 'Follow-up', status: 'upcoming' },
  { id: 'PA002', date: '2026-06-07', time: '14:00', doctor: 'Dr. Osei', department: 'OPD', type: 'HbA1c Check', status: 'upcoming' },
  { id: 'PA003', date: '2026-05-23', time: '09:00', doctor: 'Dr. Mensah', department: 'Medical', type: 'Ward Round', status: 'completed' },
];
const MOCK_RECORDS: PatientRecord[] = [
  { id: 'PR001', date: '2026-05-22', type: 'Lab Result', title: 'FBC, U&E, Lipid Profile', doctor: 'Dr. Mensah', department: 'Laboratory' },
  { id: 'PR002', date: '2026-05-20', type: 'Admission', title: 'Hypertensive Urgency Admission', doctor: 'Dr. Mensah', department: 'Emergency' },
  { id: 'PR003', date: '2024-09-10', type: 'ECG', title: 'Normal Sinus Rhythm', doctor: 'Dr. Mensah', department: 'Cardiology' },
];
const MOCK_BILLS: PatientBill[] = [
  { id: 'PB001', date: '2026-05-23', description: 'Admission Package (3 days)', amount: 2450, paid: 1800, status: 'partial' },
  { id: 'PB002', date: '2026-05-22', description: 'Blood Investigations', amount: 150, paid: 150, status: 'paid' },
  { id: 'PB003', date: '2026-05-22', description: 'Medications', amount: 120, paid: 0, status: 'pending' },
];

export default function EnhancedPatientPortal() {
  const [tab, setTab] = useState<PortalTab>('dashboard');
  const totalBilled = MOCK_BILLS.reduce((s, b) => s + b.amount, 0);
  const totalPaid = MOCK_BILLS.reduce((s, b) => s + b.paid, 0);

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
          title="Add New Portal Entry"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Patient Portal" subtitle="Your personal health dashboard — appointments, records, and billing" />

      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <h2 className="text-xl font-bold">Welcome back, Kwame Asante</h2>
        <p className="text-sm text-blue-100">MRN: MRN-001234 · Blood: O+ (AS) · Insurance: NHIS</p>
        <div className="mt-3 flex gap-4">
          <div className="text-center"><div className="text-2xl font-bold">{MOCK_APPTS.filter(a => a.status === 'upcoming').length}</div><div className="text-xs text-blue-200">Upcoming</div></div>
          <div className="text-center"><div className="text-2xl font-bold">{MOCK_RECORDS.length}</div><div className="text-xs text-blue-200">Records</div></div>
          <div className="text-center"><div className="text-2xl font-bold">GH₵ {totalBilled - totalPaid}</div><div className="text-xs text-blue-200">Balance</div></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['dashboard', 'appointments', 'records', 'billing', 'messages'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'dashboard' ? '🏠 Dashboard' : t === 'appointments' ? '📅 Appointments' : t === 'records' ? '📋 Records' : t === 'billing' ? '💰 Billing' : '💬 Messages'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-2">📅 Next Appointment</h3>
            <div className="text-lg font-bold text-blue-600">{MOCK_APPTS[0]?.date}</div>
            <div className="text-xs text-slate-500">{MOCK_APPTS[0]?.time} — {MOCK_APPTS[0]?.doctor} ({MOCK_APPTS[0]?.department})</div>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-2">💊 Current Medications</h3>
            <ul className="text-xs text-slate-600 space-y-1"><li>Amlodipine 5mg OD</li><li>Metformin 500mg BD</li><li>Enalapril 10mg OD</li></ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-2">⚠️ Allergies</h3>
            <div className="flex flex-wrap gap-1"><span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Penicillin</span><span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Sulfa drugs</span></div>
          </Card>
        </div>
      )}

      {tab === 'appointments' && (
        <div className="space-y-3">
          {MOCK_APPTS.map(a => (
            <Card key={a.id} className="p-3">
              <div className="flex items-center justify-between">
                <div><div className="font-bold text-sm">{a.date} {a.time}</div><div className="text-xs text-slate-500">{a.doctor} — {a.department} · {a.type}</div></div>
                <Badge tone={a.status === 'upcoming' ? 'blue' : 'green'}>{a.status}</Badge>
              </div>
            </Card>
          ))}
          <Button className="bg-blue-600 hover:bg-blue-700">📅 Book New Appointment</Button>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-3">
          {MOCK_RECORDS.map(r => (
            <Card key={r.id} className="p-3">
              <div className="flex items-center justify-between">
                <div><div className="font-bold text-sm">{r.title}</div><div className="text-xs text-slate-500">{r.type} · {r.department} · {r.doctor} · {r.date}</div></div>
                <Button className="bg-slate-100 text-slate-700 text-xs">📥 Download</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-700">Billing Summary</h3>
              <span className="text-lg font-bold text-red-600">Balance: GH₵ {totalBilled - totalPaid}</span>
            </div>
            {MOCK_BILLS.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0 text-xs">
                <div><div className="font-medium">{b.description}</div><div className="text-slate-400">{b.date}</div></div>
                <div className="text-right"><div className="font-bold">GH₵ {b.amount}</div><Badge tone={b.status === 'paid' ? 'green' : b.status === 'partial' ? 'gold' : 'red'}>{b.status}</Badge></div>
              </div>
            ))}
          </Card>
          <Button className="bg-green-600 hover:bg-green-700">💳 Pay Online</Button>
        </div>
      )}

      {tab === 'messages' && (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-bold text-lg text-slate-800">Messages</h3>
          <p className="mt-2 text-sm text-slate-500">Communicate with your care team securely.</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">📝 New Message</Button>
        </Card>
      )}
    </div>
  );
}
