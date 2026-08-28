import { useState } from 'react';
import { Badge } from '../../components/ui';

interface LabVisit { id: string; patientName: string; mrn: string; tests: string[]; status: 'Checked In' | 'Sample Collection' | 'Completed' | 'Cancelled'; date: string; paymentStatus: 'Paid' | 'Pending' | 'NHIS' | 'Insurance'; }

const VISITS: LabVisit[] = [
  { id: 'LR-101', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', tests: ['FBC', 'Blood Glucose', 'Malaria Test'], status: 'Sample Collection', date: '2026-08-23 08:30', paymentStatus: 'Paid' },
  { id: 'LR-102', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', tests: ['LFTs', 'RFTs', 'Electrolytes'], status: 'Completed', date: '2026-08-23 09:00', paymentStatus: 'NHIS' },
  { id: 'LR-103', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', tests: ['Blood Culture', 'Wound Swab'], status: 'Checked In', date: '2026-08-23 09:15', paymentStatus: 'Pending' },
  { id: 'LR-104', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', tests: ['HIV Test', 'Hepatitis B'], status: 'Completed', date: '2026-08-23 07:30', paymentStatus: 'Insurance' },
];

const STATUS_COLORS: Record<string, string> = { 'Checked In': 'bg-blue-100 text-blue-800', 'Sample Collection': 'bg-yellow-100 text-yellow-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-gray-100 text-gray-800' };
const PAYMENT_COLORS: Record<string, string> = { Paid: 'bg-green-100 text-green-800', Pending: 'bg-red-100 text-red-800', NHIS: 'bg-blue-100 text-blue-800', Insurance: 'bg-purple-100 text-purple-800' };

export default function LabReception() {
  const [visits] = useState<LabVisit[]>(VISITS);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = visits.filter((v) => !search || v.patientName.toLowerCase().includes(search.toLowerCase()) || v.mrn.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Lab Reception</h1><p className="text-gray-500">Patient check-in, sample collection, and barcode generation</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ New Check-in'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Patient Check-In</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name / MRN *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Search patient..." /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Requesting Doctor</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Dr. Name" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Cash</option><option>NHIS</option><option>Insurance</option><option>Credit</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Tests Requested *</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="e.g. FBC, Blood Glucose, Malaria Test (comma separated)" /></div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">✓ Check In & Generate Barcode</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient name or MRN..." className="flex-1 max-w-md border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Patient</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Tests</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Payment</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs font-mono text-slate-500">{v.id}</td>
                <td className="px-4 py-2"><div className="text-sm font-medium">{v.patientName}</div><div className="text-[10px] text-slate-400">{v.mrn}</div></td>
                <td className="px-4 py-2 text-xs text-slate-600 max-w-[200px]">{v.tests.join(', ')}</td>
                <td className="px-4 py-2"><Badge className={PAYMENT_COLORS[v.paymentStatus]}>{v.paymentStatus}</Badge></td>
                <td className="px-4 py-2"><Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge></td>
                <td className="px-4 py-2"><div className="flex gap-1">
                  {v.status === 'Checked In' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded">Collect</button>}
                  {v.status === 'Sample Collection' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">Complete</button>}
                  <button onClick={() => {}} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded">Print Barcode</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
