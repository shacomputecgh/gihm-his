import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface Study { id: string; title: string; principalInvestigator: string; phase: string; status: 'Planning' | 'Enrolling' | 'Active' | 'Completed' | 'Suspended'; enrolled: number; target: number; startDate: string; endDate: string; ethicsApproval: string; }

const STUDIES: Study[] = [
  { id: 'CR-001', title: 'Efficacy of Artemether-Lumefantrine in Uncomplicated Malaria', principalInvestigator: 'Dr. Sarah Johnson', phase: 'Phase III', status: 'Active', enrolled: 150, target: 200, startDate: '2026-06-01', endDate: '2027-06-01', ethicsApproval: 'GHS-ERC-2026-012' },
  { id: 'CR-002', title: 'Hypertension Management in Rural Ghana', principalInvestigator: 'Dr. James Mensah', phase: 'Observational', status: 'Enrolling', enrolled: 85, target: 300, startDate: '2026-07-01', endDate: '2027-07-01', ethicsApproval: 'GHS-ERC-2026-018' },
  { id: 'CR-003', title: 'Maternal Mortality Risk Factors', principalInvestigator: 'Dr. Ama Darko', phase: 'Observational', status: 'Active', enrolled: 200, target: 200, startDate: '2026-03-01', endDate: '2026-12-01', ethicsApproval: 'GHS-ERC-2026-008' },
  { id: 'CR-004', title: 'Paediatric Vaccine Efficacy Study', principalInvestigator: 'Dr. Kofi Appiah', phase: 'Phase IV', status: 'Planning', enrolled: 0, target: 500, startDate: '2026-09-01', endDate: '2028-09-01', ethicsApproval: 'Pending' },
];

const STATUS_COLORS: Record<string, string> = { Planning: 'bg-slate-100 text-slate-800', Enrolling: 'bg-blue-100 text-blue-800', Active: 'bg-green-100 text-green-800', Completed: 'bg-emerald-100 text-emerald-800', Suspended: 'bg-red-100 text-red-800' };

export default function ClinicalResearchEnhanced() {
  const toast = useToast();
  const [studies] = useState<Study[]>(STUDIES);
  const [selected, setSelected] = useState<Study | null>(STUDIES[0] ?? null);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Clinical Research</h1><p className="text-gray-500">Clinical trials management, research studies, ethics approvals, and enrolment tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Planning', 'Enrolling', 'Active', 'Completed'].map((s) => <div key={s} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{studies.filter((st) => st.status === s).length}</div><div className="text-xs text-slate-500">{s}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {studies.map((s) => (
            <div key={s.id} onClick={() => setSelected(s)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === s.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge><span className="text-xs text-slate-400">{s.phase}</span></div>
              <div className="font-semibold text-sm">{s.title}</div>
              <div className="text-xs text-slate-500 mt-1">{s.principalInvestigator}</div>
              <div className="mt-2 flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.round((s.enrolled / s.target) * 100)}%` }} /></div><span className="text-[10px] text-slate-400">{s.enrolled}/{s.target}</span></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.title}</h3><p className="text-sm text-gray-500">{selected.principalInvestigator} · {selected.phase}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded p-3"><strong>Enrolment:</strong> {selected.enrolled}/{selected.target} ({Math.round((selected.enrolled / selected.target) * 100)}%)</div>
              <div className="bg-slate-50 rounded p-3"><strong>Ethics Approval:</strong> {selected.ethicsApproval}</div>
              <div className="bg-slate-50 rounded p-3"><strong>Start:</strong> {selected.startDate}</div>
              <div className="bg-slate-50 rounded p-3"><strong>End:</strong> {selected.endDate}</div>
            </div>
            <div className="flex gap-2"><button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Enrol Patient</button><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">View Protocol</button><button className="border px-4 py-2 rounded-lg text-sm font-medium">Generate Report</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
