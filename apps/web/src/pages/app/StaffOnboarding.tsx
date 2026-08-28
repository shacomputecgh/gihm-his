import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface StaffRecord {
  id: string;
  name: string;
  department: string;
  role: string;
  startDate: string;
  onboardingStatus: 'Pending' | 'In Progress' | 'Complete';
  items: { name: string; done: boolean }[];
  supervisor: string;
  probationEnd: string;
  docsSubmitted: boolean;
  idCardIssued: boolean;
  systemAccess: boolean;
}

const SAMPLE_STAFF: StaffRecord[] = [
  { id: 'STF-101', name: 'Nana Ama Mensah', department: 'Nursing', role: 'Staff Nurse', startDate: '2026-08-20', onboardingStatus: 'In Progress', supervisor: 'Sister Abena Osei', probationEnd: '2026-11-20', docsSubmitted: true, idCardIssued: false, systemAccess: true, items: [
    { name: 'Employment contract signed', done: true }, { name: 'HR orientation completed', done: true }, { name: 'Department induction', done: true }, { name: 'Fire safety training', done: false }, { name: 'Infection control training', done: false },
    { name: 'System access granted', done: true }, { name: 'ID card issued', done: false }, { name: 'Uniform issued', done: true }, { name: 'Locker assigned', done: true }, { name: 'Mentor assigned', done: true },
  ]},
  { id: 'STF-102', name: 'Kwesi Appiah', department: 'Laboratory', role: 'Lab Technologist', startDate: '2026-08-15', onboardingStatus: 'In Progress', supervisor: 'Dr. Esi Kumah', probationEnd: '2026-11-15', docsSubmitted: true, idCardIssued: true, systemAccess: false, items: [
    { name: 'Employment contract signed', done: true }, { name: 'HR orientation completed', done: true }, { name: 'Department induction', done: true }, { name: 'Safety briefing', done: true }, { name: 'Biosafety training', done: false },
    { name: 'System access granted', done: false }, { name: 'ID card issued', done: true }, { name: 'PPE training', done: true }, { name: 'Equipment training', done: false }, { name: 'Mentor assigned', done: true },
  ]},
  { id: 'STF-103', name: 'Abena Pokua', department: 'Pharmacy', role: 'Pharmacist', startDate: '2026-07-01', onboardingStatus: 'Complete', supervisor: 'Pharm. Kwadwo Mensah', probationEnd: '2026-10-01', docsSubmitted: true, idCardIssued: true, systemAccess: true, items: [
    { name: 'Employment contract signed', done: true }, { name: 'HR orientation completed', done: true }, { name: 'Department induction', done: true }, { name: 'Controlled substances training', done: true }, { name: 'Pharmacy system training', done: true },
    { name: 'System access granted', done: true }, { name: 'ID card issued', done: true }, { name: 'Uniform issued', done: true }, { name: 'Locker assigned', done: true }, { name: 'Mentor assigned', done: true },
  ]},
];

export default function StaffOnboarding() {
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Staff Onboarding</h1>
          <p className="text-gray-600 mt-1">New hire orientation · Training tracking · Document management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total New Hires', value: SAMPLE_STAFF.length, icon: '👥', color: 'text-blue-600' },
          { label: 'Onboarding Complete', value: SAMPLE_STAFF.filter(s => s.onboardingStatus === 'Complete').length, icon: '✅', color: 'text-green-600' },
          { label: 'In Progress', value: SAMPLE_STAFF.filter(s => s.onboardingStatus === 'In Progress').length, icon: '🔄', color: 'text-orange-600' },
          { label: 'Pending', value: SAMPLE_STAFF.filter(s => s.onboardingStatus === 'Pending').length, icon: '⏳', color: 'text-gray-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_STAFF.map(s => {
          const completed = s.items.filter(i => i.done).length;
          const pct = Math.round((completed / s.items.length) * 100);
          return (
            <Card key={s.id} className="p-5 cursor-pointer hover:ring-2 hover:ring-blue-500" onClick={() => setSelectedStaff(s)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.role} · {s.department}</div>
                </div>
                <Badge className={s.onboardingStatus === 'Complete' ? 'bg-green-100 text-green-800' : s.onboardingStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>{s.onboardingStatus}</Badge>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1"><span>Progress</span><span className="font-bold">{completed}/{s.items.length} ({pct}%)</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className={`p-1 rounded ${s.docsSubmitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>📄 Docs {s.docsSubmitted ? '✓' : '✗'}</div>
                <div className={`p-1 rounded ${s.idCardIssued ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>🪪 ID {s.idCardIssued ? '✓' : '✗'}</div>
                <div className={`p-1 rounded ${s.systemAccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>💻 System {s.systemAccess ? '✓' : '✗'}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Supervisor: {s.supervisor} · Probation ends: {s.probationEnd}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{selectedStaff.name} — Onboarding Checklist</h3>
              <button onClick={() => setSelectedStaff(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="text-sm text-gray-500 mb-4">{selectedStaff.role} · {selectedStaff.department} · Started: {selectedStaff.startDate}</div>
            <div className="space-y-2">
              {selectedStaff.items.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <span className={`text-lg ${item.done ? 'text-green-600' : 'text-gray-400'}`}>{item.done ? '✅' : '⬜'}</span>
                  <span className={`text-sm ${item.done ? 'text-green-800' : 'text-gray-700'}`}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
