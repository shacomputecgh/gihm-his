import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface HygieneAudit {
  id: string; department: string; auditor: string; date: string;
  totalOpportunities: number; moments: Record<string, { observed: number; performed: number }>;
  complianceRate: number;
}

const MOMENTS = ['Before Patient Contact', 'Before Aseptic Procedure', 'After Body Fluid Exposure', 'After Patient Contact', 'After Contact with Patient Surroundings'];

const INITIAL: HygieneAudit[] = [
  { id: 'HA-001', department: 'Emergency', auditor: 'Dr. Asante', date: '2026-08-25', totalOpportunities: 45, moments: { 'Before Patient Contact': { observed: 10, performed: 7 }, 'Before Aseptic Procedure': { observed: 8, performed: 8 }, 'After Body Fluid Exposure': { observed: 5, performed: 3 }, 'After Patient Contact': { observed: 12, performed: 10 }, 'After Contact with Patient Surroundings': { observed: 10, performed: 6 } }, complianceRate: 73 },
  { id: 'HA-002', department: 'ICU', auditor: 'Nurse Abena', date: '2026-08-25', totalOpportunities: 60, moments: { 'Before Patient Contact': { observed: 12, performed: 12 }, 'Before Aseptic Procedure': { observed: 15, performed: 15 }, 'After Body Fluid Exposure': { observed: 8, performed: 7 }, 'After Patient Contact': { observed: 15, performed: 14 }, 'After Contact with Patient Surroundings': { observed: 10, performed: 9 } }, complianceRate: 93 },
  { id: 'HA-003', department: 'Surgical Ward', auditor: 'Nurse Kofi', date: '2026-08-24', totalOpportunities: 40, moments: { 'Before Patient Contact': { observed: 8, performed: 7 }, 'Before Aseptic Procedure': { observed: 10, performed: 10 }, 'After Body Fluid Exposure': { observed: 5, performed: 4 }, 'After Patient Contact': { observed: 10, performed: 8 }, 'After Contact with Patient Surroundings': { observed: 7, performed: 5 } }, complianceRate: 83 },
  { id: 'HA-004', department: 'Maternity', auditor: 'Nurse Efua', date: '2026-08-24', totalOpportunities: 35, moments: { 'Before Patient Contact': { observed: 7, performed: 7 }, 'Before Aseptic Procedure': { observed: 8, performed: 8 }, 'After Body Fluid Exposure': { observed: 5, performed: 5 }, 'After Patient Contact': { observed: 8, performed: 7 }, 'After Contact with Patient Surroundings': { observed: 7, performed: 5 } }, complianceRate: 90 },
];

const COMPLIANCE_LEVELS = [
  { min: 90, label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' },
  { min: 80, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { min: 70, label: 'Needs Improvement', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  { min: 0, label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700' },
];

export default function HandHygieneCompliance() {
  const [audits] = useState<HygieneAudit[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const avgCompliance = Math.round(audits.reduce((s, a) => s + a.complianceRate, 0) / audits.length);
  const level = COMPLIANCE_LEVELS.find((l) => avgCompliance >= l.min);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Hand Hygiene Compliance</h1><p className="text-gray-500">WHO 5 Moments audit, compliance tracking, and improvement targets</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Audit</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center"><div className={`text-2xl font-bold ${level?.textColor}`}>{avgCompliance}%</div><div className="text-xs text-gray-500">Avg Compliance</div><Badge tone={avgCompliance >= 80 ? 'green' : 'red'}>{level?.label}</Badge></Card>
        <Card className="p-4 text-center"><div className="text-xl font-bold text-blue-600">{audits.length}</div><div className="text-xs text-gray-500">Total Audits</div></Card>
        <Card className="p-4 text-center"><div className="text-xl font-bold text-green-600">{audits.filter((a) => a.complianceRate >= 90).length}</div><div className="text-xs text-gray-500">{'>'}90% Compliance</div></Card>
        <Card className="p-4 text-center"><div className="text-xl font-bold text-red-600">{audits.filter((a) => a.complianceRate < 80).length}</div><div className="text-xs text-gray-500">Below Target</div></Card>
      </div>
      <Card className="p-4">
        <h3 className="font-semibold mb-3">WHO 5 Moments — Overall Performance</h3>
        <div className="space-y-3">
          {MOMENTS.map((m) => {
            const totalObs = audits.reduce((s, a) => s + (a.moments[m]?.observed || 0), 0);
            const totalPerf = audits.reduce((s, a) => s + (a.moments[m]?.performed || 0), 0);
            const rate = totalObs > 0 ? Math.round((totalPerf / totalObs) * 100) : 0;
            return (
              <div key={m} className="flex items-center gap-3">
                <span className="text-sm w-56">{m}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className={`h-4 rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 80 ? 'bg-blue-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                </div>
                <span className="text-sm font-bold w-12">{rate}%</span>
                <span className="text-xs text-gray-400 w-20">{totalPerf}/{totalObs}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="space-y-3">
        {audits.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div><h3 className="font-semibold">{a.department}</h3><p className="text-sm text-gray-500">{a.auditor} · {a.date} · {a.totalOpportunities} opportunities</p></div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${a.complianceRate >= 90 ? 'text-green-600' : a.complianceRate >= 80 ? 'text-blue-600' : 'text-red-600'}`}>{a.complianceRate}%</div>
                <Badge tone={a.complianceRate >= 90 ? 'green' : a.complianceRate >= 80 ? 'blue' : 'red'}>{a.complianceRate >= 90 ? 'Excellent' : a.complianceRate >= 80 ? 'Good' : 'Needs Improvement'}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {MOMENTS.map((m) => {
                const obs = a.moments[m]?.observed || 0;
                const perf = a.moments[m]?.performed || 0;
                const rate = obs > 0 ? Math.round((perf / obs) * 100) : 0;
                return (
                  <div key={m} className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold">{rate}%</div>
                    <div className="text-gray-500">{perf}/{obs}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{m.split(' ').slice(0, 2).join(' ')}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Hand Hygiene Audit</h2>
            <div className="space-y-3">
              <div><label className="block text-sm mb-1">Department *</label><Input placeholder="Department name" /></div>
              <div><label className="block text-sm mb-1">Auditor Name *</label><Input placeholder="Your name" /></div>
              {MOMENTS.map((m) => (
                <div key={m} className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs mb-1">{m}</label></div>
                  <div className="grid grid-cols-2 gap-1">
                    <Input type="number" placeholder="Observed" />
                    <Input type="number" placeholder="Performed" />
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Audit saved'); }}>Save Audit</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
