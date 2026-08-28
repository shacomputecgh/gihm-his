import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Screened {
  id: string;
  babyName: string;
  motherName: string;
  mrn: string;
  dateOfBirth: string;
  gestationalAge: string;
  birthWeight: string;
  screeningDate: string;
  metabolicScreen: string;
  hearingScreen: string;
  congenitalHeartScreen: string;
  sickleCellScreen: string;
  ghanaCardNo: string;
  outcome: string;
  followUpRequired: boolean;
  followUpDate: string;
  comments: string;
}

const METABOLIC_OPTIONS = ['Normal', 'Abnormal - Pending Review', 'Abnormal - Confirmed', 'Sample Insufficient'];
const HEARING_OPTIONS = ['Pass', 'Refer', 'Not Done', 'Pending'];
const CHD_OPTIONS = ['Normal', 'Abnormal - Refer', 'Not Done'];
const SICKLE_OPTIONS = ['AA (Normal)', 'AS (Sickle Cell Trait)', 'SS (Sickle Cell Disease)', 'AC', 'Other', 'Pending'];
const OUTCOME_OPTIONS = ['Normal', 'Abnormal - Follow-up Required', 'Abnormal - Urgent Referral', 'Pending'];

export default function NeonatalScreening() {
  const [records, setRecords] = useState<Screened[]>([
    { id: 'NS-001', babyName: 'Kofi Mensah', motherName: 'Ama Mensah', mrn: 'MRN-N001', dateOfBirth: '2026-08-20', gestationalAge: '38 weeks', birthWeight: '3.2 kg', screeningDate: '2026-08-22', metabolicScreen: 'Normal', hearingScreen: 'Pass', congenitalHeartScreen: 'Normal', sickleCellScreen: 'AA (Normal)', ghanaCardNo: 'GC-12345', outcome: 'Normal', followUpRequired: false, followUpDate: '', comments: 'All screening tests within normal limits' },
    { id: 'NS-002', babyName: 'Ako Adjei', motherName: 'Efua Adjei', mrn: 'MRN-N002', dateOfBirth: '2026-08-19', gestationalAge: '36 weeks', birthWeight: '2.8 kg', screeningDate: '2026-08-21', metabolicScreen: 'Abnormal - Pending Review', hearingScreen: 'Refer', congenitalHeartScreen: 'Normal', sickleCellScreen: 'AS (Sickle Cell Trait)', ghanaCardNo: 'GC-23456', outcome: 'Abnormal - Follow-up Required', followUpRequired: true, followUpDate: '2026-09-05', comments: 'Referred for repeat hearing test and metabolic panel review' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Screened>({ id: '', babyName: '', motherName: '', mrn: '', dateOfBirth: '', gestationalAge: '', birthWeight: '', screeningDate: '', metabolicScreen: 'Normal', hearingScreen: 'Pass', congenitalHeartScreen: 'Normal', sickleCellScreen: 'Pending', ghanaCardNo: '', outcome: 'Normal', followUpRequired: false, followUpDate: '', comments: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.babyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const newRecord: Screened = { ...form, id: `NS-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([newRecord, ...records]);
    setShowAdd(false);
    setForm({ id: '', babyName: '', motherName: '', mrn: '', dateOfBirth: '', gestationalAge: '', birthWeight: '', screeningDate: '', metabolicScreen: 'Normal', hearingScreen: 'Pass', congenitalHeartScreen: 'Normal', sickleCellScreen: 'Pending', ghanaCardNo: '', outcome: 'Normal', followUpRequired: false, followUpDate: '', comments: '' });
  };

  const abnormal = records.filter(r => r.outcome !== 'Normal').length;
  const followUps = records.filter(r => r.followUpRequired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🩺 Neonatal Screening</h1>
          <p className="text-gray-600">Newborn screening — metabolic, hearing, CHD, sickle cell</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">
          + New Screening
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Screened</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Abnormal Results</p><p className="text-2xl font-bold text-red-600">{abnormal}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Pending Follow-up</p><p className="text-2xl font-bold text-orange-600">{followUps}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Normal Results</p><p className="text-2xl font-bold text-green-600">{records.length - abnormal}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Neonatal Screening Record</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Baby Name" value={form.babyName} onChange={e => setForm({ ...form, babyName: e.target.value })} />
            <Input placeholder="Mother Name" value={form.motherName} onChange={e => setForm({ ...form, motherName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input type="date" placeholder="Date of Birth" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            <Input placeholder="Gestational Age (weeks)" value={form.gestationalAge} onChange={e => setForm({ ...form, gestationalAge: e.target.value })} />
            <Input placeholder="Birth Weight (kg)" value={form.birthWeight} onChange={e => setForm({ ...form, birthWeight: e.target.value })} />
            <Input type="date" placeholder="Screening Date" value={form.screeningDate} onChange={e => setForm({ ...form, screeningDate: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.metabolicScreen} onChange={e => setForm({ ...form, metabolicScreen: e.target.value })}>
              {METABOLIC_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.hearingScreen} onChange={e => setForm({ ...form, hearingScreen: e.target.value })}>
              {HEARING_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.congenitalHeartScreen} onChange={e => setForm({ ...form, congenitalHeartScreen: e.target.value })}>
              {CHD_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.sickleCellScreen} onChange={e => setForm({ ...form, sickleCellScreen: e.target.value })}>
              {SICKLE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
              {OUTCOME_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <Input placeholder="Ghana Card No." value={form.ghanaCardNo} onChange={e => setForm({ ...form, ghanaCardNo: e.target.value })} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.followUpRequired} onChange={e => setForm({ ...form, followUpRequired: e.target.checked })} className="rounded" />
              <span>Follow-up Required</span>
            </label>
            {form.followUpRequired && <Input type="date" placeholder="Follow-up Date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />}
            <textarea placeholder="Comments" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Screening</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by baby name, mother name, or MRN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Baby</th>
                <th className="p-3 text-left">Mother</th>
                <th className="p-3 text-left">DOB</th>
                <th className="p-3 text-left">Metabolic</th>
                <th className="p-3 text-left">Hearing</th>
                <th className="p-3 text-left">CHD</th>
                <th className="p-3 text-left">Sickle Cell</th>
                <th className="p-3 text-left">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.babyName}</td>
                  <td className="p-3">{r.motherName}</td>
                  <td className="p-3">{r.dateOfBirth}</td>
                  <td className="p-3"><Badge className={r.metabolicScreen === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{r.metabolicScreen}</Badge></td>
                  <td className="p-3"><Badge className={r.hearingScreen === 'Pass' ? 'bg-green-100 text-green-800' : r.hearingScreen === 'Refer' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>{r.hearingScreen}</Badge></td>
                  <td className="p-3"><Badge className={r.congenitalHeartScreen === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{r.congenitalHeartScreen}</Badge></td>
                  <td className="p-3"><Badge className={r.sickleCellScreen.startsWith('AA') ? 'bg-green-100 text-green-800' : r.sickleCellScreen === 'SS (Sickle Cell Disease)' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{r.sickleCellScreen}</Badge></td>
                  <td className="p-3"><Badge className={r.outcome === 'Normal' ? 'bg-green-100 text-green-800' : r.outcome.includes('Urgent') ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>{r.outcome}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
