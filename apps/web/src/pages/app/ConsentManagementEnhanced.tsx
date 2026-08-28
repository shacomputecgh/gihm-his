import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Consent {
  id: string;
  patientName: string;
  mrn: string;
  type: string;
  procedure: string;
  dateGiven: string;
  consentedBy: string;
  witnessedBy: string;
  interpreter: string;
  languageUsed: string;
  risksExplained: string;
  alternativesExplained: string;
  status: string;
  withdrawnDate: string;
  reasonForWithdrawal: string;
}

const CONSENT_TYPES = ['General Surgical Consent', 'Anaesthesia Consent', 'Blood Transfusion Consent', 'Procedure Consent', 'Research Consent', 'Refusal of Treatment', 'Advance Directive', 'DNACPR', 'Organ Donation', 'Discharge Against Medical Advice'];

export default function ConsentManagementEnhanced() {
  const [records, setRecords] = useState<Consent[]>([
    { id: 'CON-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', type: 'General Surgical Consent', procedure: 'Appendicectomy', dateGiven: '2026-08-24', consentedBy: 'Dr. Osei', witnessedBy: 'Nurse Ama', interpreter: '', languageUsed: 'English', risksExplained: 'Bleeding, infection, anaesthetic risk, injury to surrounding organs', alternativesExplained: 'Conservative management with antibiotics', status: 'Active', withdrawnDate: '', reasonForWithdrawal: '' },
    { id: 'CON-002', patientName: 'Ama Darko', mrn: 'MRN-002', type: 'Blood Transfusion Consent', procedure: 'Blood transfusion - 2 units Packed RBC', dateGiven: '2026-08-23', consentedBy: 'Dr. Akosua', witnessedBy: 'Nurse Kofi', interpreter: '', languageUsed: 'Twi', risksExplained: 'Allergic reaction, infection, transfusion reaction, iron overload', alternativesExplained: 'Iron supplementation, erythropoietin', status: 'Active', withdrawnDate: '', reasonForWithdrawal: '' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Consent>({ id: '', patientName: '', mrn: '', type: '', procedure: '', dateGiven: '', consentedBy: '', witnessedBy: '', interpreter: '', languageUsed: 'English', risksExplained: '', alternativesExplained: '', status: 'Active', withdrawnDate: '', reasonForWithdrawal: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Consent = { ...form, id: `CON-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', type: '', procedure: '', dateGiven: '', consentedBy: '', witnessedBy: '', interpreter: '', languageUsed: 'English', risksExplained: '', alternativesExplained: '', status: 'Active', withdrawnDate: '', reasonForWithdrawal: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✍️ Consent Management</h1>
          <p className="text-gray-600">Informed consent tracking — surgical, transfusion, research, advance directives</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Record Consent</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Consents</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Active').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Withdrawn</p><p className="text-2xl font-bold text-red-600">{records.filter(r => r.status === 'Withdrawn').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">With Interpreter</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.interpreter).length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Record Consent</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="">Consent Type</option>
              {CONSENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <Input placeholder="Procedure / Description" value={form.procedure} onChange={e => setForm({ ...form, procedure: e.target.value })} />
            <Input type="date" placeholder="Date Given" value={form.dateGiven} onChange={e => setForm({ ...form, dateGiven: e.target.value })} />
            <Input placeholder="Consented By (Doctor)" value={form.consentedBy} onChange={e => setForm({ ...form, consentedBy: e.target.value })} />
            <Input placeholder="Witnessed By" value={form.witnessedBy} onChange={e => setForm({ ...form, witnessedBy: e.target.value })} />
            <Input placeholder="Interpreter (if any)" value={form.interpreter} onChange={e => setForm({ ...form, interpreter: e.target.value })} />
            <Input placeholder="Language Used" value={form.languageUsed} onChange={e => setForm({ ...form, languageUsed: e.target.value })} />
            <textarea placeholder="Risks Explained" value={form.risksExplained} onChange={e => setForm({ ...form, risksExplained: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Alternatives Explained" value={form.alternativesExplained} onChange={e => setForm({ ...form, alternativesExplained: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Consent</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient name, MRN, or consent type..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Procedure</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Consented By</th>
                <th className="p-3 text-left">Language</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.type}</Badge></td>
                  <td className="p-3">{r.procedure}</td>
                  <td className="p-3">{r.dateGiven}</td>
                  <td className="p-3">{r.consentedBy}</td>
                  <td className="p-3">{r.languageUsed}{r.interpreter && <span className="text-xs text-gray-400"> (via {r.interpreter})</span>}</td>
                  <td className="p-3"><Badge className={r.status === 'Active' ? 'bg-green-100 text-green-800' : r.status === 'Withdrawn' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
