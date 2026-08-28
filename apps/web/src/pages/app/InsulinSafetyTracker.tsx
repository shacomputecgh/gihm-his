import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface InsulinRecord {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  insulinType: string;
  dose: string;
  route: string;
  timeGiven: string;
  givenBy: string;
  bloodGlucoseBefore: string;
  bloodGlucoseAfter: string;
  mealStatus: string;
  hypoglycaemia: boolean;
  hypoEpisode: string;
  dualCheck: boolean;
  status: string;
  comments: string;
}

const INSULIN_TYPES = ['Rapid-Acting (NovoRapid/NovoLog)', 'Short-Acting (Actrapid/Regular)', 'Intermediate (NPH/Protaphane)', 'Long-Acting (Glargine/Lantus)', 'Premixed (Mixtard 30/70)', 'Insulin Pump (CSII)', 'Other'];
const ROUTES = ['Subcutaneous', 'Intravenous (IV)', 'Insulin Pump', 'Intramuscular'];
const MEAL_STATUS = ['Pre-breakfast', 'Pre-lunch', 'Pre-dinner', 'Bedtime', 'Post-prandial', 'Sliding Scale', 'Not Applicable'];
const HYPO_LEVELS = ['None', 'Level 1 (<3.9 mmol/L)', 'Level 2 (<3.0 mmol/L)', 'Severe (requiring assistance)'];

export default function InsulinSafetyTracker() {
  const [records, setRecords] = useState<InsulinRecord[]>([
    { id: 'IS-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', ward: 'Medical Ward', insulinType: 'Rapid-Acting (NovoRapid/NovoLog)', dose: '8 units', route: 'Subcutaneous', timeGiven: '2026-08-24 07:45', givenBy: 'Nurse Ama', bloodGlucoseBefore: '12.4 mmol/L', bloodGlucoseAfter: '8.2 mmol/L', mealStatus: 'Pre-breakfast', hypoglycaemia: false, hypoEpisode: 'None', dualCheck: true, status: 'Completed', comments: 'Blood glucose log maintained' },
    { id: 'IS-002', patientName: 'Ama Darko', mrn: 'MRN-002', ward: 'ICU', insulinType: 'Short-Acting (Actrapid/Regular)', dose: '5 units IV', route: 'Intravenous (IV)', timeGiven: '2026-08-24 12:00', givenBy: 'ICU Nurse Kofi', bloodGlucoseBefore: '15.8 mmol/L', bloodGlucoseAfter: '10.1 mmol/L', mealStatus: 'Not Applicable', hypoglycaemia: false, hypoEpisode: 'None', dualCheck: true, status: 'Completed', comments: 'Insulin sliding scale, BG monitored 2-hourly' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<InsulinRecord>({ id: '', patientName: '', mrn: '', ward: '', insulinType: '', dose: '', route: 'Subcutaneous', timeGiven: '', givenBy: '', bloodGlucoseBefore: '', bloodGlucoseAfter: '', mealStatus: '', hypoglycaemia: false, hypoEpisode: 'None', dualCheck: false, status: 'Pending', comments: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ward.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: InsulinRecord = { ...form, id: `IS-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', ward: '', insulinType: '', dose: '', route: 'Subcutaneous', timeGiven: '', givenBy: '', bloodGlucoseBefore: '', bloodGlucoseAfter: '', mealStatus: '', hypoglycaemia: false, hypoEpisode: 'None', dualCheck: false, status: 'Pending', comments: '' });
  };

  const hypos = records.filter(r => r.hypoglycaemia).length;
  const noDualCheck = records.filter(r => !r.dualCheck).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💉 Insulin Safety Tracker</h1>
          <p className="text-gray-600">Insulin administration safety — blood glucose, dual-check, hypoglycaemia tracking</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Record Insulin Dose</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Doses</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Hypoglycaemia Episodes</p><p className="text-2xl font-bold text-red-600">{hypos}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Missing Dual Check</p><p className="text-2xl font-bold text-orange-600">{noDualCheck}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">IV Insulin</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.route === 'Intravenous (IV)').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Record Insulin Administration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Ward" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.insulinType} onChange={e => setForm({ ...form, insulinType: e.target.value })}>
              <option value="">Insulin Type</option>
              {INSULIN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <Input placeholder="Dose (units)" value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}>
              {ROUTES.map(r => <option key={r}>{r}</option>)}
            </select>
            <Input type="datetime-local" placeholder="Time Given" value={form.timeGiven} onChange={e => setForm({ ...form, timeGiven: e.target.value })} />
            <Input placeholder="Given By" value={form.givenBy} onChange={e => setForm({ ...form, givenBy: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.mealStatus} onChange={e => setForm({ ...form, mealStatus: e.target.value })}>
              <option value="">Meal Status</option>
              {MEAL_STATUS.map(m => <option key={m}>{m}</option>)}
            </select>
            <Input placeholder="Blood Glucose Before (mmol/L)" value={form.bloodGlucoseBefore} onChange={e => setForm({ ...form, bloodGlucoseBefore: e.target.value })} />
            <Input placeholder="Blood Glucose After (mmol/L)" value={form.bloodGlucoseAfter} onChange={e => setForm({ ...form, bloodGlucoseAfter: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.hypoEpisode} onChange={e => setForm({ ...form, hypoEpisode: e.target.value })}>
              {HYPO_LEVELS.map(h => <option key={h}>{h}</option>)}
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.hypoglycaemia} onChange={e => setForm({ ...form, hypoglycaemia: e.target.checked })} className="rounded" />
              <span>Hypoglycaemia Occurred</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.dualCheck} onChange={e => setForm({ ...form, dualCheck: e.target.checked })} className="rounded" />
              <span>Dual Check Completed</span>
            </label>
            <textarea placeholder="Comments" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient or ward..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Ward</th>
                <th className="p-3 text-left">Insulin</th>
                <th className="p-3 text-left">Dose</th>
                <th className="p-3 text-left">BG Before</th>
                <th className="p-3 text-left">BG After</th>
                <th className="p-3 text-left">Dual Check</th>
                <th className="p-3 text-left">Hypo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.ward}</td>
                  <td className="p-3 text-xs max-w-[150px] truncate">{r.insulinType}</td>
                  <td className="p-3 font-semibold">{r.dose}</td>
                  <td className="p-3">{r.bloodGlucoseBefore}</td>
                  <td className="p-3">{r.bloodGlucoseAfter}</td>
                  <td className="p-3">{r.dualCheck ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <Badge className="bg-red-100 text-red-800">No</Badge>}</td>
                  <td className="p-3">{r.hypoglycaemia ? <Badge className="bg-red-100 text-red-800">{r.hypoEpisode}</Badge> : <span className="text-green-600">None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
