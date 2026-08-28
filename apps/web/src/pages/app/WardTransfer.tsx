import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Transfer {
  id: string; patientName: string; mrn: string; fromWard: string; toWard: string;
  reason: string; requestedBy: string; approvedBy?: string;
  status: 'Requested' | 'Approved' | 'In Transit' | 'Completed' | 'Cancelled';
  dateRequested: string; dateCompleted?: string;
}

const TRANSFERS: Transfer[] = [
  { id: 'TRF-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', fromWard: 'Medical Ward A', toWard: 'ICU', reason: 'Deteriorating vitals — needs ICU monitoring', requestedBy: 'Dr. Sarah Johnson', approvedBy: 'Dr. James Mensah', status: 'Completed', dateRequested: '2026-08-22 08:30', dateCompleted: '2026-08-22 09:15' },
  { id: 'TRF-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', fromWard: 'Surgical Ward', toWard: 'Maternity Ward', reason: 'Pregnancy confirmed — transfer to maternity', requestedBy: 'Dr. Ama Darko', status: 'Requested', dateRequested: '2026-08-23 10:00' },
  { id: 'TRF-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', fromWard: 'Emergency', toWard: 'Surgical Ward', reason: 'Appendicitis — post-op recovery', requestedBy: 'Dr. Kofi Appiah', approvedBy: 'Dr. James Mensah', status: 'In Transit', dateRequested: '2026-08-23 11:20' },
  { id: 'TRF-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', fromWard: 'Paediatric Ward', toWard: 'NICU', reason: 'Neonatal complication — requires NICU care', requestedBy: 'Dr. Ama Darko', approvedBy: 'Dr. James Mensah', status: 'Completed', dateRequested: '2026-08-21 14:00', dateCompleted: '2026-08-21 14:30' },
];

const STATUS_COLORS: Record<string, string> = {
  Requested: 'bg-yellow-100 text-yellow-800', Approved: 'bg-blue-100 text-blue-800',
  'In Transit': 'bg-purple-100 text-purple-800', Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function WardTransfer() {
  const [records] = useState<Transfer[]>(TRANSFERS);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = records.filter((r) => !filter || r.status === filter);
  const wards = ['Emergency', 'Medical Ward A', 'Medical Ward B', 'Surgical Ward', 'ICU', 'NICU', 'Paediatric Ward', 'Maternity Ward', 'Psychiatric Unit', 'Isolation Ward'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Ward Transfer Management</h1><p className="text-gray-500">Patient transfers between wards, approvals, and tracking</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? '✕ Cancel' : '+ New Transfer'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Request Ward Transfer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Kwame Asante" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">MRN *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="MRN-2024-XXXX" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">From Ward *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select ward</option>{wards.map((w) => <option key={w}>{w}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">To Ward *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select ward</option>{wards.map((w) => <option key={w}>{w}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Reason for transfer" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Requested By *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Dr. Name" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => {}} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Submit Transfer Request</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['Requested', 'Approved', 'In Transit', 'Completed', 'Cancelled'].map((s) => {
          const count = records.filter((r) => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={`p-3 rounded-lg border text-center transition ${filter === s ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className={`text-xl font-bold ${STATUS_COLORS[s]?.split(' ')[1] || 'text-slate-700'}`}>{count}</div>
              <div className="text-xs text-slate-500">{s}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">From → To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{t.id}</td>
                <td className="px-4 py-3"><div className="text-sm font-medium">{t.patientName}</div><div className="text-xs text-slate-400">{t.mrn}</div></td>
                <td className="px-4 py-3 text-sm"><span className="text-slate-500">{t.fromWard}</span> <span className="text-green-600 mx-1">→</span> <span className="font-medium">{t.toWard}</span></td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{t.reason}</td>
                <td className="px-4 py-3"><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-400">{t.dateRequested}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {t.status === 'Requested' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Approve</button>}
                    {t.status === 'Approved' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">Transit</button>}
                    {t.status === 'In Transit' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Complete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
