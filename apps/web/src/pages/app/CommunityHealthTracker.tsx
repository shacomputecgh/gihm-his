import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Outreach {
  id: string;
  programme: string;
  date: string;
  location: string;
  communityName: string;
  district: string;
  region: string;
  teamLeader: string;
  teamMembers: string;
  targetGroup: string;
  populationServed: number;
  activities: string;
  findings: string;
  referrals: number;
  followUpRequired: boolean;
  followUpDate: string;
  status: string;
}

const PROGRAMMES = ['Immunisation Outreach', 'Maternal Health Outreach', 'Malaria Prevention', 'HIV Testing', 'NCD Screening', 'School Health', 'Community Eye Care', 'Sanitation & Hygiene', 'Nutrition Programme', 'Mental Health Outreach', 'TB Contact Tracing', 'Other'];

export default function CommunityHealthTracker() {
  const [records, setRecords] = useState<Outreach[]>([
    { id: 'CH-001', programme: 'Immunisation Outreach', date: '2026-08-20', location: 'Community Centre', communityName: 'Nima', district: 'Accra Metropolitan', region: 'Greater Accra', teamLeader: 'Dr. Mensah', teamMembers: 'Nurse Ama, CHW Kwame', targetGroup: 'Children 0-5 years', populationServed: 120, activities: 'BCG, OPV, Penta, Measles-Rubella immunisation', findings: '15 children defaulting on immunisation schedule', referrals: 8, followUpRequired: true, followUpDate: '2026-09-20', status: 'Completed' },
    { id: 'CH-002', programme: 'NCD Screening', date: '2026-08-22', location: 'CHPS Compound', communityName: 'Madina', district: 'La Nkwantanang', region: 'Greater Accra', teamLeader: 'Nurse Esi', teamMembers: 'Dr. Akosua, CHW Ama', targetGroup: 'Adults 40+ years', populationServed: 85, activities: 'Blood pressure, blood glucose, BMI screening', findings: '12 hypertensive, 8 diabetic, 15 pre-diabetic identified', referrals: 12, followUpRequired: true, followUpDate: '2026-09-05', status: 'Completed' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Outreach>({ id: '', programme: '', date: '', location: '', communityName: '', district: '', region: '', teamLeader: '', teamMembers: '', targetGroup: '', populationServed: 0, activities: '', findings: '', referrals: 0, followUpRequired: false, followUpDate: '', status: 'Planned' });

  const filtered = useMemo(() => records.filter(r =>
    r.communityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.programme.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Outreach = { ...form, id: `CH-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', programme: '', date: '', location: '', communityName: '', district: '', region: '', teamLeader: '', teamMembers: '', targetGroup: '', populationServed: 0, activities: '', findings: '', referrals: 0, followUpRequired: false, followUpDate: '', status: 'Planned' });
  };

  const totalServed = records.reduce((sum, r) => sum + r.populationServed, 0);
  const totalReferrals = records.reduce((sum, r) => sum + r.referrals, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏘️ Community Health Tracker</h1>
          <p className="text-gray-600">Outreach programmes, home visits, CHPS compound management</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ New Outreach</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Outreaches</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Population Served</p><p className="text-2xl font-bold text-blue-600">{totalServed.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Total Referrals</p><p className="text-2xl font-bold text-orange-600">{totalReferrals}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Pending Follow-ups</p><p className="text-2xl font-bold text-purple-600">{records.filter(r => r.followUpRequired).length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Outreach Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="border rounded-lg px-3 py-2" value={form.programme} onChange={e => setForm({ ...form, programme: e.target.value })}>
              <option value="">Programme</option>
              {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
            </select>
            <Input type="date" placeholder="Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <Input placeholder="Community Name" value={form.communityName} onChange={e => setForm({ ...form, communityName: e.target.value })} />
            <Input placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
            <Input placeholder="Region" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
            <Input placeholder="Team Leader" value={form.teamLeader} onChange={e => setForm({ ...form, teamLeader: e.target.value })} />
            <Input placeholder="Team Members" value={form.teamMembers} onChange={e => setForm({ ...form, teamMembers: e.target.value })} />
            <Input placeholder="Target Group" value={form.targetGroup} onChange={e => setForm({ ...form, targetGroup: e.target.value })} />
            <Input type="number" placeholder="Population Served" value={String(form.populationServed)} onChange={e => setForm({ ...form, populationServed: Number(e.target.value) })} />
            <Input type="number" placeholder="Referrals" value={String(form.referrals)} onChange={e => setForm({ ...form, referrals: Number(e.target.value) })} />
            <Input type="date" placeholder="Follow-up Date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
            <textarea placeholder="Activities" value={form.activities} onChange={e => setForm({ ...form, activities: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Key Findings" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by community or programme..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Programme</th>
                <th className="p-3 text-left">Community</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Served</th>
                <th className="p-3 text-left">Referrals</th>
                <th className="p-3 text-left">Follow-up</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.programme}</Badge></td>
                  <td className="p-3 font-medium">{r.communityName}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">{r.populationServed}</td>
                  <td className="p-3 text-orange-600 font-semibold">{r.referrals}</td>
                  <td className="p-3">{r.followUpRequired ? <Badge className="bg-yellow-100 text-yellow-800">{r.followUpDate}</Badge> : '-'}</td>
                  <td className="p-3"><Badge className={r.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
