import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface POCTRecord {
  id: string; patientName: string; mrn: string; ward: string;
  testName: string; device: string; result: string; unit: string;
  referenceRange: string; normal: boolean;
  testedBy: string; testedAt: string; QCStatus: 'Pass' | 'Fail' | 'Pending';
}

const INITIAL: POCTRecord[] = [
  { id: 'POCT-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', testName: 'Blood Glucose', device: 'Accu-Chek Inform II', result: '8.2', unit: 'mmol/L', referenceRange: '3.9-6.1', normal: false, testedBy: 'Nurse Ama', testedAt: '2026-08-25 08:00', QCStatus: 'Pass' },
  { id: 'POCT-002', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', testName: 'Blood Glucose', device: 'Accu-Chek Inform II', result: '12.5', unit: 'mmol/L', referenceRange: '3.9-6.1', normal: false, testedBy: 'Nurse Abena', testedAt: '2026-08-25 06:00', QCStatus: 'Pass' },
  { id: 'POCT-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', ward: 'Surgical Ward', testName: 'INR', device: 'CoaguChek XS', result: '1.2', unit: '', referenceRange: '0.8-1.2', normal: true, testedBy: 'Nurse Kofi', testedAt: '2026-08-25 07:30', QCStatus: 'Pass' },
  { id: 'POCT-004', patientName: 'Ama Darko', mrn: 'MRN-2026-041', ward: 'Maternity Ward', testName: 'Urine Dipstick', device: 'Combur 10 Test', result: 'Protein +1, Glucose negative', unit: '', referenceRange: 'Negative', normal: false, testedBy: 'Nurse Efua', testedAt: '2026-08-25 09:00', QCStatus: 'Pass' },
  { id: 'POCT-005', patientName: 'Kofi Amoako', mrn: 'MRN-2026-044', ward: 'Surgical Ward', testName: 'Haemoglobin', device: 'HemoCue Hb 201+', result: '9.8', unit: 'g/dL', referenceRange: '13.0-17.0', normal: false, testedBy: 'Nurse Kofi', testedAt: '2026-08-25 07:00', QCStatus: 'Fail' },
];

const TESTS = ['Blood Glucose', 'INR/PT', 'Urine Dipstick', 'Haemoglobin', 'Ketones', 'Lactate', 'Troponin', 'D-Dimer', 'HbA1c', 'COVID-19 Antigen'];
const DEVICES = ['Accu-Chek Inform II', 'CoaguChek XS', 'Combur 10 Test', 'HemoCue Hb 201+', 'i-STAT Alinity', 'QuikRead go'];

export default function PointOfCareTesting() {
  const [records] = useState<POCTRecord[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.testName === filter);
  const abnormal = records.filter((r) => !r.normal).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Point-of-Care Testing (POCT)</h1><p className="text-gray-500">Bedside testing, rapid diagnostics, and quality control tracking</p></div>
        <Button onClick={() => setShowForm(true)}>+ Record Test</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{records.length}</div><div className="text-sm text-gray-500">Total Tests</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{records.length - abnormal}</div><div className="text-sm text-gray-500">Normal</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{abnormal}</div><div className="text-sm text-gray-500">Abnormal</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{records.filter((r) => r.QCStatus === 'Fail').length}</div><div className="text-sm text-gray-500">QC Failures</div></Card>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TESTS.map((t) => (
          <button key={t} onClick={() => setFilter(filter === t ? '' : t)} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filter === t ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Time</th><th className="p-2">Patient</th><th className="p-2">Test</th><th className="p-2">Result</th><th className="p-2">Range</th><th className="p-2">Device</th><th className="p-2">QC</th><th className="p-2">Status</th></tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className={`border-b ${!r.normal ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="p-2 text-xs">{r.testedAt}<br />{r.testedBy}</td>
                <td className="p-2 font-medium">{r.patientName}<br /><span className="text-xs text-gray-400">{r.ward}</span></td>
                <td className="p-2">{r.testName}</td>
                <td className="p-2"><span className={`font-bold ${!r.normal ? 'text-red-600' : 'text-green-600'}`}>{r.result}</span> {r.unit}</td>
                <td className="p-2 text-xs text-gray-500">{r.referenceRange}</td>
                <td className="p-2 text-xs">{r.device}</td>
                <td className="p-2"><Badge tone={r.QCStatus === 'Pass' ? 'green' : r.QCStatus === 'Fail' ? 'red' : 'gold'}>{r.QCStatus}</Badge></td>
                <td className="p-2"><Badge tone={r.normal ? 'green' : 'red'}>{r.normal ? 'Normal' : 'Abnormal'}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Record POCT Result</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient *</label><Input placeholder="Patient name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Test *</label><Select>{TESTS.map((t) => <option key={t}>{t}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Device *</label><Select>{DEVICES.map((d) => <option key={d}>{d}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Result *</label><Input placeholder="Result value" /></div>
                <div><label className="block text-sm mb-1">Unit</label><Input placeholder="e.g. mmol/L" /></div>
                <div><label className="block text-sm mb-1">Ward</label><Input placeholder="Ward" /></div>
                <div><label className="block text-sm mb-1">Tested By *</label><Input placeholder="Name and role" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('POCT result recorded'); }}>Record Result</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
