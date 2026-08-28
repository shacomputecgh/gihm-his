import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface O2Patient { id: string; patientName: string; ward: string; condition: string; device: string; flowRate: string; spo2: number; target: string; status: 'Stable' | 'Improving' | 'Needs Adjustment' | 'Critical'; notes: string; }

const PATIENTS: O2Patient[] = [
  { id: 'O2-001', patientName: 'Kwame Asante', ward: 'ICU', condition: 'ARDS', device: 'Ventilator', flowRate: 'FiO2 60%', spo2: 92, target: '> 94%', status: 'Needs Adjustment', notes: 'SpO2 trending down. Consider increasing FiO2.' },
  { id: 'O2-002', patientName: 'Akua Mensah', ward: 'Medical Ward A', condition: 'COPD Exacerbation', device: 'Nasal Cannula', flowRate: '2 L/min', spo2: 96, target: '88-92%', status: 'Stable', notes: 'Target 88-92% for COPD. On track.' },
  { id: 'O2-003', patientName: 'Nana Osei', ward: 'Surgical Ward', condition: 'Post-Thoracotomy', device: 'Face Mask', flowRate: '6 L/min', spo2: 97, target: '> 95%', status: 'Improving', notes: 'Weaning from O2. Plan to switch to nasal cannula.' },
  { id: 'O2-004', patientName: 'Efua Nyarko', ward: 'NICU', condition: 'RDS', device: 'CPAP', flowRate: '6 cmH2O', spo2: 94, target: '90-95%', status: 'Stable', notes: 'Premature — maintaining well on CPAP.' },
];

const STATUS_COLORS: Record<string, string> = { Stable: 'bg-green-100 text-green-800', Improving: 'bg-blue-100 text-blue-800', 'Needs Adjustment': 'bg-yellow-100 text-yellow-800', Critical: 'bg-red-100 text-red-800' };

export default function OxygenTherapyMonitor() {
  const [patients] = useState<O2Patient[]>(PATIENTS);
  const [selected, setSelected] = useState<O2Patient | null>(PATIENTS[0] ?? null);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Oxygen Therapy Monitor</h1><p className="text-gray-500">Real-time oxygen therapy monitoring, device management, and weaning protocols</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{patients.length}</div><div className="text-xs text-slate-500">On Oxygen</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{patients.filter((p) => p.status === 'Stable').length}</div><div className="text-xs text-slate-500">Stable</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">{patients.filter((p) => p.status === 'Needs Adjustment').length}</div><div className="text-xs text-slate-500">Needs Adjustment</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{patients.filter((p) => p.status === 'Critical').length}</div><div className="text-xs text-slate-500">Critical</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{p.patientName}</span><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></div>
              <div className="text-xs text-slate-500"><div>{p.device} · {p.flowRate}</div><div>SpO2: <span className={`font-bold ${p.spo2 < 90 ? 'text-red-600' : 'text-green-600'}`}>{p.spo2}%</span> (Target: {p.target})</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.ward} · {selected.condition}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-lg font-bold">{selected.device}</div><div className="text-[10px] text-slate-400">Device</div></div>
              <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-lg font-bold">{selected.flowRate}</div><div className="text-[10px] text-slate-400">Flow Rate</div></div>
              <div className="bg-slate-50 rounded-lg p-3 text-center"><div className={`text-lg font-bold ${selected.spo2 < 90 ? 'text-red-600' : 'text-green-600'}`}>{selected.spo2}%</div><div className="text-[10px] text-slate-400">SpO2</div></div>
              <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-lg font-bold text-slate-600">{selected.target}</div><div className="text-[10px] text-slate-400">Target</div></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3"><div className="text-xs text-blue-600 font-semibold mb-1">Clinical Notes</div><div className="text-sm">{selected.notes}</div></div>
            <div className="flex gap-2"><button onClick={() => toast(`${selected.patientName}: Flow rate adjusted`, 'success')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Adjust Flow</button><button onClick={() => toast(`${selected.patientName}: O2 weaning protocol initiated`, 'info')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Wean O2</button><button onClick={() => toast(`${selected.patientName}: Device change requested`, 'info')} className="border px-4 py-2 rounded-lg text-sm font-medium">Change Device</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
