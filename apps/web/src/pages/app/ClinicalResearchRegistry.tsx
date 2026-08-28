import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Study {
  id: string;
  title: string;
  protocolNumber: string;
  principalInvestigator: string;
  sponsor: string;
  startDate: string;
  endDate: string;
  status: string;
  phase: string;
  participantsEnrolled: number;
  participantsTarget: number;
  irbApprovalDate: string;
  irbExpiryDate: string;
  indication: string;
  studyType: string;
 budget: string;
  siteStatus: string;
}

const STUDY_TYPES = ['Interventional (RCT)', 'Observational (Cohort)', 'Case-Control', 'Cross-Sectional', 'Case Series', 'Qualitative', 'Registry Study', 'Meta-Analysis'];
const STATUSES = ['Not Yet Recruiting', 'Recruiting', 'Enrolling by Invitation', 'Active/Not Recruiting', 'Completed', 'Suspended', 'Terminated', 'Withdrawn'];
const PHASES = ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'N/A'];

export default function ClinicalResearchRegistry() {
  const [records, setRecords] = useState<Study[]>([
    { id: 'CR-001', title: 'Efficacy of Artemether-Lumefantrine vs Artesunate-Amodiaquine in uncomplicated malaria', protocolNumber: 'GH-MAL-2026-001', principalInvestigator: 'Prof. Kwame Mensah', sponsor: 'Korle Bu Teaching Hospital', startDate: '2026-01-15', endDate: '2026-12-31', status: 'Recruiting', phase: 'Phase III', participantsEnrolled: 120, participantsTarget: 300, irbApprovalDate: '2025-12-01', irbExpiryDate: '2026-12-01', indication: 'Uncomplicated P. falciparum malaria', studyType: 'Interventional (RCT)',budget: 'GHS 450,000', siteStatus: 'Active' },
    { id: 'CR-002', title: 'Prevalence of Diabetes Mellitus in Accra Metropolitan Area', protocolNumber: 'GH-DM-2026-002', principalInvestigator: 'Dr. Akosua Osei', sponsor: 'Ghana Health Service', startDate: '2026-03-01', endDate: '2027-03-01', status: 'Recruiting', phase: 'N/A', participantsEnrolled: 250, participantsTarget: 500, irbApprovalDate: '2026-02-15', irbExpiryDate: '2027-02-15', indication: 'Type 2 Diabetes Mellitus prevalence', studyType: 'Observational (Cohort)',budget: 'GHS 200,000', siteStatus: 'Active' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Study>({ id: '', title: '', protocolNumber: '', principalInvestigator: '', sponsor: '', startDate: '', endDate: '', status: 'Recruiting', phase: 'Phase III', participantsEnrolled: 0, participantsTarget: 0, irbApprovalDate: '', irbExpiryDate: '', indication: '', studyType: '',budget: '', siteStatus: 'Active' });

  const filtered = useMemo(() => records.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.principalInvestigator.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Study = { ...form, id: `CR-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', title: '', protocolNumber: '', principalInvestigator: '', sponsor: '', startDate: '', endDate: '', status: 'Recruiting', phase: 'Phase III', participantsEnrolled: 0, participantsTarget: 0, irbApprovalDate: '', irbExpiryDate: '', indication: '', studyType: '',budget: '', siteStatus: 'Active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Clinical Research Registry</h1>
          <p className="text-gray-600">Research studies, participant tracking, IRB approvals, protocol management</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Register Study</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Studies</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Recruiting</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'Recruiting').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Total Enrolled</p><p className="text-2xl font-bold text-green-600">{records.reduce((s, r) => s + r.participantsEnrolled, 0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Total Target</p><p className="text-2xl font-bold">{records.reduce((s, r) => s + r.participantsTarget, 0)}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Register New Study</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea placeholder="Study Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <Input placeholder="Protocol Number" value={form.protocolNumber} onChange={e => setForm({ ...form, protocolNumber: e.target.value })} />
            <Input placeholder="Principal Investigator" value={form.principalInvestigator} onChange={e => setForm({ ...form, principalInvestigator: e.target.value })} />
            <Input placeholder="Sponsor" value={form.sponsor} onChange={e => setForm({ ...form, sponsor: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.studyType} onChange={e => setForm({ ...form, studyType: e.target.value })}>
              <option value="">Study Type</option>
              {STUDY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
              {PHASES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <Input type="date" placeholder="Start Date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <Input type="date" placeholder="End Date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            <Input type="number" placeholder="Target Enrollment" value={String(form.participantsTarget)} onChange={e => setForm({ ...form, participantsTarget: Number(e.target.value) })} />
            <Input type="date" placeholder="IRB Approval Date" value={form.irbApprovalDate} onChange={e => setForm({ ...form, irbApprovalDate: e.target.value })} />
            <Input type="date" placeholder="IRB Expiry Date" value={form.irbExpiryDate} onChange={e => setForm({ ...form, irbExpiryDate: e.target.value })} />
            <Input placeholder="Indication" value={form.indication} onChange={e => setForm({ ...form, indication: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by title, protocol, or investigator..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Protocol</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">PI</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Phase</th>
                <th className="p-3 text-left">Enrolled</th>
                <th className="p-3 text-left">Progress</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const pct = r.participantsTarget > 0 ? Math.round((r.participantsEnrolled / r.participantsTarget) * 100) : 0;
                return (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{r.protocolNumber}</td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{r.title}</td>
                    <td className="p-3">{r.principalInvestigator}</td>
                    <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.studyType}</Badge></td>
                    <td className="p-3">{r.phase}</td>
                    <td className="p-3">{r.participantsEnrolled}/{r.participantsTarget}</td>
                    <td className="p-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </td>
                    <td className="p-3"><Badge className={r.status === 'Recruiting' ? 'bg-blue-100 text-blue-800' : r.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{r.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
