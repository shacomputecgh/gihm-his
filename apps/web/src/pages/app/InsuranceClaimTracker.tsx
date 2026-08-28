import { useState } from 'react';
import { Card } from '../../components/ui';

interface Claim { id: string; patientName: string; nhisNo: string; provider: string; amount: number; status: 'Submitted' | 'Processing' | 'Approved' | 'Rejected' | 'Paid'; submittedDate: string; serviceDate: string; department: string; diagnosis: string; }

const CLAIMS: Claim[] = [
  { id: 'CLM-001', patientName: 'Kwame Asante', nhisNo: 'NHIS-2024-0891', provider: 'NHIS', amount: 2450, status: 'Paid', submittedDate: '2026-08-10', serviceDate: '2026-08-08', department: 'Surgery', diagnosis: 'Appendectomy' },
  { id: 'CLM-002', patientName: 'Akua Mensah', nhisNo: 'NHIS-2024-1234', provider: 'NHIS', amount: 890, status: 'Approved', submittedDate: '2026-08-15', serviceDate: '2026-08-14', department: 'OPD', diagnosis: 'Malaria (P. falciparum)' },
  { id: 'CLM-003', patientName: 'Nana Osei', nhisNo: 'NHIS-2024-0567', provider: 'NIC', amount: 12500, status: 'Processing', submittedDate: '2026-08-20', serviceDate: '2026-08-18', department: 'Maternity', diagnosis: 'Caesarean Section' },
  { id: 'CLM-004', patientName: 'Efua Nyarko', nhisNo: 'NHIS-2024-0998', provider: 'NHIS', amount: 650, status: 'Rejected', submittedDate: '2026-08-12', serviceDate: '2026-08-11', department: 'Laboratory', diagnosis: 'Complete Blood Count' },
  { id: 'CLM-005', patientName: 'Kofi Amoako', nhisNo: 'NHIS-2024-0445', provider: 'NHIS', amount: 3200, status: 'Submitted', submittedDate: '2026-08-25', serviceDate: '2026-08-24', department: 'Radiology', diagnosis: 'Chest X-Ray + CT Scan' },
  { id: 'CLM-006', patientName: 'Ama Boateng', nhisNo: 'EXT-2024-0112', provider: 'Enterprise Insurance', amount: 5600, status: 'Approved', submittedDate: '2026-08-18', serviceDate: '2026-08-16', department: 'Theatre', diagnosis: 'Hernia Repair' },
  { id: 'CLM-007', patientName: 'Yaw Frimpong', nhisNo: 'NHIS-2024-0776', provider: 'NHIS', amount: 340, status: 'Paid', submittedDate: '2026-08-05', serviceDate: '2026-08-04', department: 'Pharmacy', diagnosis: 'Antimalarials + Antibiotics' },
];

const STATUS_STYLE: Record<string, string> = { Submitted: 'bg-yellow-100 text-yellow-800', Processing: 'bg-blue-100 text-blue-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Paid: 'bg-emerald-100 text-emerald-800' };

export default function InsuranceClaimTracker() {
  const [claims] = useState<Claim[]>(CLAIMS);
  const [filter, setFilter] = useState<string>('All');
  const filtered = filter === 'All' ? claims : claims.filter(c => c.status === filter);
  const totalValue = claims.reduce((s, c) => s + c.amount, 0);
  const paidValue = claims.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const pendingValue = claims.filter(c => ['Submitted', 'Processing', 'Approved'].includes(c.status)).reduce((s, c) => s + c.amount, 0);
  const rejectedValue = claims.filter(c => c.status === 'Rejected').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insurance Claim Tracker</h1>
        <p className="text-slate-500 text-sm">Track NHIS, NIC, and private insurance claims</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Claims</p><p className="text-xl font-bold">{claims.length}</p><p className="text-xs text-slate-400">GH₵ {totalValue.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Paid</p><p className="text-xl font-bold text-green-600">GH₵ {paidValue.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Pending</p><p className="text-xl font-bold text-blue-600">GH₵ {pendingValue.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Rejected</p><p className="text-xl font-bold text-red-600">GH₵ {rejectedValue.toLocaleString()}</p></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['All', 'Submitted', 'Processing', 'Approved', 'Rejected', 'Paid'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-left text-slate-500">
            <th className="p-3">Claim ID</th><th className="p-3">Patient</th><th className="p-3">Provider</th><th className="p-3">Department</th><th className="p-3">Diagnosis</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium">{c.id}</td>
                <td className="p-3">{c.patientName}<br /><span className="text-xs text-slate-400">{c.nhisNo}</span></td>
                <td className="p-3">{c.provider}</td>
                <td className="p-3">{c.department}</td>
                <td className="p-3">{c.diagnosis}</td>
                <td className="p-3 text-right font-medium">GH₵ {c.amount.toLocaleString()}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
