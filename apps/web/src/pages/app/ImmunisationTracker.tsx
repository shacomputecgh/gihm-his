import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Vaccine {
  id: string;
  name: string;
  category: string;
  schedule: string;
  targetAge: string;
  storageTemp: string;
  route: string;
}

interface Immunisation {
  id: string;
  patientName: string;
  mrn: string;
  age: string;
  vaccine: string;
  doseNumber: number;
  dateGiven: string;
  nextDue: string;
  batchNumber: string;
  site: string;
  administeredBy: string;
  reaction: string;
  status: string;
  ghanaCardNo: string;
}

const VACCINES: Vaccine[] = [
  { id: 'BCG', name: 'BCG', category: 'Tuberculosis', schedule: 'At birth', targetAge: 'At birth', storageTemp: '2-8°C', route: 'Intradermal' },
  { id: 'OPV0', name: 'OPV (Zero Dose)', category: 'Polio', schedule: 'At birth', targetAge: 'At birth', storageTemp: '2-8°C', route: 'Oral' },
  { id: 'PENTA1', name: 'Pentavalent (DPT-HepB-Hib)', category: 'Diphtheria/Pertussis/Tetanus', schedule: '6 weeks', targetAge: '6 weeks', storageTemp: '2-8°C', route: 'IM' },
  { id: 'OPV1', name: 'OPV (1st Dose)', category: 'Polio', schedule: '6 weeks', targetAge: '6 weeks', storageTemp: '2-8°C', route: 'Oral' },
  { id: 'PCV1', name: 'PCV (Pneumococcal)', category: 'Pneumococcal', schedule: '6 weeks', targetAge: '6 weeks', storageTemp: '2-8°C', route: 'IM' },
  { id: 'ROTA1', name: 'Rotavirus (1st Dose)', category: 'Rotavirus', schedule: '6 weeks', targetAge: '6 weeks', storageTemp: '2-8°C', route: 'Oral' },
  { id: 'PENTA2', name: 'Pentavalent (2nd Dose)', category: 'Diphtheria/Pertussis/Tetanus', schedule: '10 weeks', targetAge: '10 weeks', storageTemp: '2-8°C', route: 'IM' },
  { id: 'OPV2', name: 'OPV (2nd Dose)', category: 'Polio', schedule: '10 weeks', targetAge: '10 weeks', storageTemp: '2-8°C', route: 'Oral' },
  { id: 'PENTA3', name: 'Pentavalent (3rd Dose)', category: 'Diphtheria/Pertussis/Tetanus', schedule: '14 weeks', targetAge: '14 weeks', storageTemp: '2-8°C', route: 'IM' },
  { id: 'OPV3', name: 'OPV (3rd Dose)', category: 'Polio', schedule: '14 weeks', targetAge: '14 weeks', storageTemp: '2-8°C', route: 'Oral' },
  { id: 'IPV', name: 'IPV (Inactivated Polio)', category: 'Polio', schedule: '14 weeks', targetAge: '14 weeks', storageTemp: '2-8°C', route: 'IM' },
  { id: 'VITA_A1', name: 'Vitamin A (1st)', category: 'Vitamin A', schedule: '6 months', targetAge: '6 months', storageTemp: 'Room Temp', route: 'Oral' },
  { id: 'MEA1', name: 'Measles-Rubella (1st)', category: 'Measles', schedule: '9 months', targetAge: '9 months', storageTemp: '2-8°C', route: 'SC' },
  { id: 'YF', name: 'Yellow Fever', category: 'Yellow Fever', schedule: '9 months', targetAge: '9 months', storageTemp: '2-8°C', route: 'SC' },
  { id: 'MEN_A', name: 'Meningococcal A (MenA)', category: 'Meningitis', schedule: '9 months', targetAge: '9 months', storageTemp: '2-8°C', route: 'SC' },
  { id: 'MEA2', name: 'Measles-Rubella (2nd)', category: 'Measles', schedule: '18 months', targetAge: '18 months', storageTemp: '2-8°C', route: 'SC' },
  { id: 'DPT_B', name: 'DPT Booster', category: 'Diphtheria/Pertussis/Tetanus', schedule: '4 years', targetAge: '4 years', storageTemp: '2-8°C', route: 'IM' },
  { id: 'HPV1', name: 'HPV (1st Dose)', category: 'HPV', schedule: '9-14 years', targetAge: '9-14 years', storageTemp: '2-8°C', route: 'IM' },
  { id: 'HPV2', name: 'HPV (2nd Dose)', category: 'HPV', schedule: '9-14 years (6 mo after)', targetAge: '9-14 years', storageTemp: '2-8°C', route: 'IM' },
];

const SITES = ['Left Upper Arm', 'Right Upper Arm', 'Left Thigh', 'Right Thigh', 'Oral'];

export default function ImmunisationTracker() {
  const [records, setRecords] = useState<Immunisation[]>([
    { id: 'IM-001', patientName: 'Kofi Mensah', mrn: 'MRN-C001', age: '6 months', vaccine: 'Pentavalent (DPT-HepB-Hib)', doseNumber: 2, dateGiven: '2026-08-01', nextDue: '2026-09-01', batchNumber: 'BATCH-2026-012', site: 'Left Thigh (Anterolateral)', administeredBy: 'Nurse Ama', reaction: 'None', status: 'Completed', ghanaCardNo: 'GC-12345' },
    { id: 'IM-002', patientName: 'Ako Adjei', mrn: 'MRN-C002', age: '9 months', vaccine: 'Measles-Rubella (1st)', doseNumber: 1, dateGiven: '2026-08-15', nextDue: '2027-02-15', batchNumber: 'BATCH-2026-018', site: 'Left Deltoid', administeredBy: 'Nurse Kofi', reaction: 'Mild fever', status: 'Completed', ghanaCardNo: 'GC-23456' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'schedule' | 'vaccines'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Immunisation>({ id: '', patientName: '', mrn: '', age: '', vaccine: '', doseNumber: 1, dateGiven: '', nextDue: '', batchNumber: '', site: 'Left Thigh (Anterolateral)', administeredBy: '', reaction: 'None', status: 'Completed', ghanaCardNo: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Immunisation = { ...form, id: `IM-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', age: '', vaccine: '', doseNumber: 1, dateGiven: '', nextDue: '', batchNumber: '', site: 'Left Thigh (Anterolateral)', administeredBy: '', reaction: 'None', status: 'Completed', ghanaCardNo: '' });
  };

  const thisMonth = records.filter(r => r.dateGiven.startsWith('2026-08')).length;
  const reactions = records.filter(r => r.reaction !== 'None').length;
  const dueNow = records.filter(r => r.nextDue <= '2026-09-01').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💉 Immunisation Tracker</h1>
          <p className="text-gray-600">Ghana EPI programme — child and adult immunisations</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Record Immunisation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Immunisations</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">This Month</p><p className="text-2xl font-bold text-blue-600">{thisMonth}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Adverse Reactions</p><p className="text-2xl font-bold text-red-600">{reactions}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Due This Month</p><p className="text-2xl font-bold text-orange-600">{dueNow}</p></Card>
      </div>

      <div className="flex gap-2 border-b">
        {(['records', 'schedule', 'vaccines'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
        ))}
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Record New Immunisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.vaccine} onChange={e => setForm({ ...form, vaccine: e.target.value })}>
              <option value="">Select Vaccine</option>
              {VACCINES.map(v => <option key={v.id} value={v.name}>{v.name} ({v.schedule})</option>)}
            </select>
            <Input type="number" placeholder="Dose Number" value={String(form.doseNumber)} onChange={e => setForm({ ...form, doseNumber: Number(e.target.value) })} />
            <Input type="date" placeholder="Date Given" value={form.dateGiven} onChange={e => setForm({ ...form, dateGiven: e.target.value })} />
            <Input type="date" placeholder="Next Due" value={form.nextDue} onChange={e => setForm({ ...form, nextDue: e.target.value })} />
            <Input placeholder="Batch Number" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })}>
              {SITES.map(s => <option key={s}>{s}</option>)}
            </select>
            <Input placeholder="Administered By" value={form.administeredBy} onChange={e => setForm({ ...form, administeredBy: e.target.value })} />
            <Input placeholder="Ghana Card No." value={form.ghanaCardNo} onChange={e => setForm({ ...form, ghanaCardNo: e.target.value })} />
            <Input placeholder="Reaction (if any)" value={form.reaction} onChange={e => setForm({ ...form, reaction: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient name or MRN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {activeTab === 'records' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Age</th>
                  <th className="p-3 text-left">Vaccine</th>
                  <th className="p-3 text-left">Dose</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Batch</th>
                  <th className="p-3 text-left">Reaction</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{r.id}</td>
                    <td className="p-3 font-medium">{r.patientName}</td>
                    <td className="p-3">{r.age}</td>
                    <td className="p-3">{r.vaccine}</td>
                    <td className="p-3">{r.doseNumber}</td>
                    <td className="p-3">{r.dateGiven}</td>
                    <td className="p-3 font-mono text-xs">{r.batchNumber}</td>
                    <td className="p-3"><Badge className={r.reaction === 'None' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.reaction}</Badge></td>
                    <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'schedule' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Ghana EPI Immunisation Schedule</h3>
          <div className="space-y-3">
            {VACCINES.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-sm text-gray-500">{v.category}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800">{v.schedule}</Badge>
                  <p className="text-xs text-gray-400 mt-1">{v.route}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'vaccines' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Vaccine Reference</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Vaccine</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Schedule</th>
                  <th className="p-3 text-left">Storage</th>
                  <th className="p-3 text-left">Route</th>
                </tr>
              </thead>
              <tbody>
                {VACCINES.map(v => (
                  <tr key={v.id} className="border-t">
                    <td className="p-3 font-medium">{v.name}</td>
                    <td className="p-3">{v.category}</td>
                    <td className="p-3">{v.schedule}</td>
                    <td className="p-3">{v.storageTemp}</td>
                    <td className="p-3">{v.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
