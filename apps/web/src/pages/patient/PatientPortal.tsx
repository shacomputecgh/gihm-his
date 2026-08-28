import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { Badge, Card, Spinner } from '../../components/ui';

type Tab = 'overview' | 'records' | 'appointments' | 'lab' | 'prescriptions' | 'billing';

interface PatientRecord {
  date: string;
  type: string;
  doctor: string;
  department: string;
  notes: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

interface LabResult {
  id: string;
  testName: string;
  date: string;
  result: string;
  normalRange: string;
  status: 'Ready' | 'Pending';
}

interface Prescription {
  id: string;
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  date: string;
}

const DEMO_RECORDS: PatientRecord[] = [
  { date: '2024-01-15', type: 'Consultation', doctor: 'Dr. Kwame Asante', department: 'Internal Medicine', notes: 'Routine checkup. Blood pressure normal. Follow up in 3 months.' },
  { date: '2024-01-10', type: 'Lab Test', doctor: 'Dr. Akosua Boateng', department: 'Laboratory', notes: 'Complete blood count — all values within normal range.' },
  { date: '2023-12-20', type: 'Vaccination', doctor: 'Nurse Ama Darko', department: 'Immunization', notes: 'COVID-19 booster dose administered. No adverse reactions.' },
];

const DEMO_APPOINTMENTS: Appointment[] = [
  { id: '1', date: '2024-02-15', time: '10:00 AM', doctor: 'Dr. Kwame Asante', department: 'Internal Medicine', status: 'Scheduled' },
  { id: '2', date: '2024-01-15', time: '02:30 PM', doctor: 'Dr. Yaw Frimpong', department: 'Surgery', status: 'Completed' },
  { id: '3', date: '2024-01-05', time: '09:00 AM', doctor: 'Dr. Akosua Boateng', department: 'Pediatrics', status: 'Completed' },
];

const DEMO_LAB: LabResult[] = [
  { id: '1', testName: 'Complete Blood Count (CBC)', date: '2024-01-10', result: 'Normal', normalRange: 'WBC 4.5-11.0, RBC 4.5-5.5', status: 'Ready' },
  { id: '2', testName: 'Fasting Blood Sugar', date: '2024-01-10', result: '95 mg/dL', normalRange: '70-100 mg/dL', status: 'Ready' },
  { id: '3', testName: 'Lipid Profile', date: '2024-01-10', result: 'Pending', normalRange: 'Total Cholesterol < 200', status: 'Pending' },
];

const DEMO_RX: Prescription[] = [
  { id: '1', drug: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '7 days', prescribedBy: 'Dr. Kwame Asante', date: '2024-01-15' },
  { id: '2', drug: 'Amoxicillin 250mg', dosage: '1 capsule', frequency: 'Three times daily', duration: '5 days', prescribedBy: 'Dr. Kwame Asante', date: '2024-01-15' },
];

export default function PatientPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner label="Loading your records..." /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
              {user?.fullName?.charAt(0) ?? 'P'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.fullName ?? 'Patient'}</h1>
              <p className="text-sm text-blue-100">Patient Portal · MRN-00142</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {([
            { value: 'overview', label: '📋 Overview' },
            { value: 'records', label: '📝 Medical Records' },
            { value: 'appointments', label: '📅 Appointments' },
            { value: 'lab', label: '🧪 Lab Results' },
            { value: 'prescriptions', label: '💊 Prescriptions' },
            { value: 'billing', label: '💳 Billing' },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                tab === t.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><p className="text-xs font-bold text-slate-400">Total Visits</p><p className="text-2xl font-bold text-slate-800">12</p></Card>
              <Card><p className="text-xs font-bold text-slate-400">Lab Tests</p><p className="text-2xl font-bold text-slate-800">8</p></Card>
              <Card><p className="text-xs font-bold text-slate-400">Prescriptions</p><p className="text-2xl font-bold text-slate-800">15</p></Card>
              <Card><p className="text-xs font-bold text-slate-400">Next Appointment</p><p className="text-2xl font-bold text-blue-600">Feb 15</p></Card>
            </div>

            <Card title="Upcoming Appointments">
              {DEMO_APPOINTMENTS.filter((a) => a.status === 'Scheduled').map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.department}</p>
                    <p className="text-xs text-slate-500">{a.doctor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{a.date}</p>
                    <p className="text-xs text-slate-500">{a.time}</p>
                  </div>
                </div>
              ))}
            </Card>

            <Card title="Recent Lab Results">
              {DEMO_LAB.filter((l) => l.status === 'Ready').map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{l.testName}</p>
                    <p className="text-xs text-slate-500">{l.date}</p>
                  </div>
                  <Badge tone="green">{l.result}</Badge>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 'records' && (
          <div className="space-y-3">
            {DEMO_RECORDS.map((r, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.type}</p>
                    <p className="text-xs text-slate-500">{r.doctor} · {r.department}</p>
                    <p className="mt-2 text-sm text-slate-600">{r.notes}</p>
                  </div>
                  <span className="text-xs text-slate-400">{r.date}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'appointments' && (
          <Card pad={false}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {DEMO_APPOINTMENTS.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><p className="font-semibold">{a.date}</p><p className="text-xs text-slate-400">{a.time}</p></td>
                    <td className="px-5 py-3">{a.doctor}</td>
                    <td className="px-5 py-3">{a.department}</td>
                    <td className="px-5 py-3"><Badge tone={a.status === 'Completed' ? 'green' : a.status === 'Scheduled' ? 'blue' : 'red'}>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'lab' && (
          <div className="space-y-3">
            {DEMO_LAB.map((l) => (
              <Card key={l.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{l.testName}</p>
                    <p className="text-xs text-slate-500">Normal Range: {l.normalRange}</p>
                    <p className="mt-1 text-lg font-bold text-slate-800">{l.result}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={l.status === 'Ready' ? 'green' : 'gold'}>{l.status}</Badge>
                    <p className="mt-1 text-xs text-slate-400">{l.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'prescriptions' && (
          <Card pad={false}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="px-5 py-3">Drug</th>
                  <th className="px-5 py-3">Dosage</th>
                  <th className="px-5 py-3">Frequency</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Prescribed By</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {DEMO_RX.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold">{rx.drug}</td>
                    <td className="px-5 py-3">{rx.dosage}</td>
                    <td className="px-5 py-3">{rx.frequency}</td>
                    <td className="px-5 py-3">{rx.duration}</td>
                    <td className="px-5 py-3">{rx.prescribedBy}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{rx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'billing' && (
          <Card title="Billing Summary">
            <div className="space-y-3">
              <div className="flex justify-between rounded-lg border border-slate-100 p-3">
                <span className="text-sm text-slate-600">Consultation — Jan 15, 2024</span>
                <span className="font-bold text-slate-800">GH₵ 50.00</span>
              </div>
              <div className="flex justify-between rounded-lg border border-slate-100 p-3">
                <span className="text-sm text-slate-600">Lab Tests — Jan 10, 2024</span>
                <span className="font-bold text-slate-800">GH₵ 120.00</span>
              </div>
              <div className="flex justify-between rounded-lg border border-slate-100 p-3">
                <span className="text-sm text-slate-600">Prescriptions — Jan 15, 2024</span>
                <span className="font-bold text-slate-800">GH₵ 35.00</span>
              </div>
              <div className="flex justify-between rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-xl font-extrabold text-blue-600">GH₵ 205.00</span>
              </div>
              <div className="flex justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                <span className="text-sm text-green-700">Paid</span>
                <span className="font-bold text-green-700">GH₵ 205.00</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
