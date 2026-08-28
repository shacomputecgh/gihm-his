import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Visitor {
  id: string; visitorName: string; phone: string; idType: string; idNumber: string;
  patientName: string; patientWard: string; relationship: string;
  checkIn: string; checkOut?: string; status: 'In Hospital' | 'Checked Out' | 'Restricted';
}

const VISITORS: Visitor[] = [
  { id: 'VIS-001', visitorName: 'Akua Mensah', phone: '+233241234567', idType: 'Ghana Card', idNumber: 'GHA-123456789-0', patientName: 'Kwame Asante', patientWard: 'Medical Ward A', relationship: 'Wife', checkIn: '2026-08-23 10:00', status: 'In Hospital' },
  { id: 'VIS-002', visitorName: 'Kofi Osei', phone: '+233209876543', idType: 'Voter ID', idNumber: 'VTC-98765', patientName: 'Nana Osei', patientWard: 'Surgical Ward', relationship: 'Brother', checkIn: '2026-08-23 11:30', status: 'In Hospital' },
  { id: 'VIS-003', visitorName: 'Esi Darko', phone: '+233261234567', idType: 'Ghana Card', idNumber: 'GHA-876543210-1', patientName: 'Akua Mensah', patientWard: 'Maternity Ward', relationship: 'Mother', checkIn: '2026-08-23 09:00', checkOut: '2026-08-23 11:00', status: 'Checked Out' },
  { id: 'VIS-004', visitorName: 'Yaw Boateng', phone: '+233201234567', idType: 'Driver License', idNumber: 'DL-567890', patientName: 'Efua Nyarko', patientWard: 'ICU', relationship: 'Husband', checkIn: '2026-08-23 14:00', status: 'Restricted' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Hospital': 'bg-blue-100 text-blue-800', 'Checked Out': 'bg-green-100 text-green-800',
  Restricted: 'bg-red-100 text-red-800',
};

export default function VisitorManagement() {
  const [visitors] = useState<Visitor[]>(VISITORS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const filtered = visitors.filter((v) => {
    if (filter && v.status !== filter) return false;
    if (search && !v.visitorName.toLowerCase().includes(search.toLowerCase()) && !v.patientName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Visitor Management</h1><p className="text-gray-500">Track hospital visitors, check-in/out, and restricted access</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{visitors.filter((v) => v.status === 'In Hospital').length}</div><div className="text-xs text-slate-500">Currently In Hospital</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{visitors.filter((v) => v.status === 'Checked Out').length}</div><div className="text-xs text-slate-500">Checked Out Today</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{visitors.filter((v) => v.status === 'Restricted').length}</div><div className="text-xs text-slate-500">Restricted</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{visitors.length}</div><div className="text-xs text-slate-500">Total Visitors Today</div></div>
      </div>

      <div className="flex gap-3 items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search visitor or patient..." className="flex-1 max-w-md border rounded-lg px-3 py-2 text-sm" />
        {['', 'In Hospital', 'Checked Out', 'Restricted'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Visitor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient / Ward</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Relationship</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Check-in</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><div className="text-sm font-medium">{v.visitorName}</div><div className="text-xs text-slate-400">{v.phone}</div></td>
                <td className="px-4 py-3 text-xs"><div>{v.idType}</div><div className="text-slate-400">{v.idNumber}</div></td>
                <td className="px-4 py-3 text-sm"><div>{v.patientName}</div><div className="text-xs text-slate-400">{v.patientWard}</div></td>
                <td className="px-4 py-3 text-sm">{v.relationship}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{v.checkIn}{v.checkOut ? ` → ${v.checkOut}` : ''}</td>
                <td className="px-4 py-3"><Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {v.status === 'In Hospital' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Check Out</button>}
                    {v.status === 'Checked Out' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Re-Check In</button>}
                    {v.status !== 'Restricted' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Restrict</button>}
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
