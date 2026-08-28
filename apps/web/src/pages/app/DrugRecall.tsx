import { useState } from 'react';
import { Badge } from '../../components/ui';

interface DrugRecallRecord {
  id: string; drugName: string; manufacturer: string; batchNumber: string;
  reason: string; severity: 'Class I' | 'Class II' | 'Class III';
  status: 'Active' | 'Monitoring' | 'Resolved' | 'Closed';
  dateIssued: string; affectedQuantity: number; recalledQuantity: number;
  fdaReference?: string;
}

const RECALLS: DrugRecallRecord[] = [
  { id: 'DR-001', drugName: 'Amoxicillin 500mg Capsules', manufacturer: 'Ernest Chemists', batchNumber: 'AMX-2026-B12', reason: 'Sub-potency — active ingredient below specification', severity: 'Class II', status: 'Active', dateIssued: '2026-08-20', affectedQuantity: 5000, recalledQuantity: 3200, fdaReference: 'FDA-GH-2026-089' },
  { id: 'DR-002', drugName: 'Metformin 850mg Tablets', manufacturer: 'PhytoRiker', batchNumber: 'MET-2026-A05', reason: 'Labeling error — dosage printed incorrectly', severity: 'Class II', status: 'Monitoring', dateIssued: '2026-08-15', affectedQuantity: 10000, recalledQuantity: 8500, fdaReference: 'FDA-GH-2026-082' },
  { id: 'DR-003', drugName: 'Paracetamol Syrup 120mg/5ml', manufacturer: 'Knowledge plastics', batchNumber: 'PCM-2026-C08', reason: 'Microbial contamination detected', severity: 'Class I', status: 'Active', dateIssued: '2026-08-22', affectedQuantity: 2000, recalledQuantity: 500, fdaReference: 'FDA-GH-2026-095' },
  { id: 'DR-004', drugName: 'Artemether-Lumefantrine 20/120mg', manufacturer: 'Bliss GVS', batchNumber: 'AL-2026-D03', reason: 'Dissolution failure', severity: 'Class III', status: 'Closed', dateIssued: '2026-07-10', affectedQuantity: 8000, recalledQuantity: 8000, fdaReference: 'FDA-GH-2026-067' },
];

const SEVERITY_COLORS: Record<string, string> = {
  'Class I': 'bg-red-100 text-red-800', 'Class II': 'bg-orange-100 text-orange-800', 'Class III': 'bg-yellow-100 text-yellow-800',
};
const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-red-100 text-red-800', Monitoring: 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800', Closed: 'bg-gray-100 text-gray-800',
};

export default function DrugRecall() {
  const [records] = useState<DrugRecallRecord[]>(RECALLS);
  const [filter, setFilter] = useState('');

  const filtered = records.filter((r) => !filter || r.status === filter || r.severity === filter);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Drug Recall Management</h1><p className="text-gray-500">Track and manage drug recalls, batch quarantines, and FDA notifications</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Active', 'Monitoring', 'Resolved', 'Closed'].map((s) => {
          const count = records.filter((r) => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={`p-3 rounded-lg border text-center transition ${filter === s ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="text-xl font-bold">{count}</div>
              <div className="text-xs text-slate-500">{s}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${r.severity === 'Class I' ? 'border-l-4 border-l-red-500' : r.severity === 'Class II' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-yellow-500'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{r.id}</span>
                  <span className="font-semibold">{r.drugName}</span>
                  <Badge className={SEVERITY_COLORS[r.severity]}>{r.severity}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-1">{r.reason}</p>
                <p className="text-xs text-slate-400 mt-1">Manufacturer: {r.manufacturer} · Batch: {r.batchNumber} · FDA: {r.fdaReference}</p>
              </div>
              <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <div className="bg-slate-50 rounded px-3 py-2">
                <span className="text-slate-400">Affected: </span>
                <span className="font-bold">{r.affectedQuantity.toLocaleString()}</span> units
              </div>
              <div className="bg-slate-50 rounded px-3 py-2">
                <span className="text-slate-400">Recalled: </span>
                <span className="font-bold">{r.recalledQuantity.toLocaleString()}</span> units
              </div>
              <div className="bg-slate-50 rounded px-3 py-2">
                <span className="text-slate-400">Issued: </span>
                <span className="font-bold">{r.dateIssued}</span>
              </div>
              <div className="bg-slate-50 rounded px-3 py-2">
                <span className="text-slate-400">Recovery: </span>
                <span className="font-bold text-green-600">{Math.round((r.recalledQuantity / r.affectedQuantity) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
