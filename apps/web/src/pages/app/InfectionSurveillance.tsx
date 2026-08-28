import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface HAIRecord {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  infectionType: 'CAUTI' | 'CLABSI' | 'SSI' | 'VAP' | 'CDI' | 'MRSA' | 'Other';
  organism: string;
  dateOnset: string;
  dateReported: string;
  deviceDays: number;
  deviceAssociations: number;
  reportedBy: string;
  action: 'Isolation' | 'Antibiotic Review' | 'Source Control' | 'Contact Precautions' | 'Education';
  status: 'Active' | 'Resolved' | 'Under Treatment';
}

const HAI_DATA: HAIRecord[] = [
  { id: 'HAI-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', ward: 'ICU', infectionType: 'CLABSI', organism: 'MRSA', dateOnset: '2026-08-22', dateReported: '2026-08-23', deviceDays: 15, deviceAssociations: 2, reportedBy: 'Infection Control', action: 'Antibiotic Review', status: 'Active' },
  { id: 'HAI-002', patientName: 'Ama Osei', mrn: 'MRN-12350', ward: 'Surgical', infectionType: 'SSI', organism: 'E. coli', dateOnset: '2026-08-20', dateReported: '2026-08-21', deviceDays: 0, deviceAssociations: 0, reportedBy: 'Ward Nurse', action: 'Source Control', status: 'Under Treatment' },
  { id: 'HAI-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', ward: 'ICU', infectionType: 'VAP', organism: 'Pseudomonas aeruginosa', dateOnset: '2026-08-18', dateReported: '2026-08-19', deviceDays: 12, deviceAssociations: 1, reportedBy: 'Infection Control', action: 'Isolation', status: 'Resolved' },
  { id: 'HAI-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', ward: 'Medical', infectionType: 'CAUTI', organism: 'Klebsiella pneumoniae', dateOnset: '2026-08-24', dateReported: '2026-08-25', deviceDays: 8, deviceAssociations: 1, reportedBy: 'Infection Control', action: 'Contact Precautions', status: 'Active' },
];

const HAND_HYGIENE_DATA = [
  { month: 'Aug 2026', moments: { beforePatient: 85, afterPatient: 78, beforeProcedure: 92, afterProcedure: 88, afterContact: 72 }, total: 83 },
  { month: 'Jul 2026', moments: { beforePatient: 80, afterPatient: 74, beforeProcedure: 88, afterProcedure: 84, afterContact: 68 }, total: 79 },
  { month: 'Jun 2026', moments: { beforePatient: 78, afterPatient: 72, beforeProcedure: 85, afterProcedure: 80, afterContact: 65 }, total: 76 },
];

const INFECTION_COLORS: Record<string, string> = { CAUTI: 'bg-blue-100 text-blue-800', CLABSI: 'bg-purple-100 text-purple-800', SSI: 'bg-orange-100 text-orange-800', VAP: 'bg-red-100 text-red-800', CDI: 'bg-yellow-100 text-yellow-800', MRSA: 'bg-pink-100 text-pink-800', Other: 'bg-gray-100 text-gray-800' };

export default function InfectionSurveillance() {
  const [tab, setTab] = useState<'overview' | 'hai' | 'hygiene' | 'amr'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🦠 Infection Surveillance</h1>
          <p className="text-gray-600 mt-1">HAI tracking · Hand hygiene monitoring · AMR surveillance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active HAIs', value: HAI_DATA.filter(h => h.status === 'Active').length, icon: '🦠', color: 'text-red-600' },
          { label: 'This Month', value: HAI_DATA.length, icon: '📊', color: 'text-blue-600' },
          { label: 'Hand Hygiene', value: '83%', icon: '🧼', color: 'text-green-600' },
          { label: 'MDR Organisms', value: HAI_DATA.filter(h => h.organism.includes('MRSA') || h.organism.includes('ESBL')).length, icon: '⚠️', color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'hai', 'hygiene', 'amr'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'hai' ? '🦠 HAI Registry' : t === 'hygiene' ? '🧼 Hand Hygiene' : '💊 AMR Surveillance'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">HAI by Type</h3>
            <div className="space-y-2">
              {Object.entries(HAI_DATA.reduce<Record<string, number>>((a, h) => { a[h.infectionType] = (a[h.infectionType] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={INFECTION_COLORS[type]}>{type}</Badge><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Hand Hygiene Trend</h3>
            <div className="space-y-3">
              {HAND_HYGIENE_DATA.map(h => (
                <div key={h.month}>
                  <div className="flex justify-between text-sm mb-1"><span>{h.month}</span><span className="font-bold">{h.total}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${h.total >= 80 ? 'bg-green-500' : h.total >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${h.total}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'hai' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Ward</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Organism</th>
                <th className="px-4 py-3 text-left">Onset</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {HAI_DATA.map(h => (
                <tr key={h.id} className={`border-b hover:bg-gray-50 ${h.status === 'Active' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3"><div className="font-medium">{h.patientName}</div><div className="text-xs text-gray-500">{h.mrn}</div></td>
                  <td className="px-4 py-3">{h.ward}</td>
                  <td className="px-4 py-3"><Badge className={INFECTION_COLORS[h.infectionType]}>{h.infectionType}</Badge></td>
                  <td className="px-4 py-3 text-sm font-medium">{h.organism}</td>
                  <td className="px-4 py-3">{h.dateOnset}</td>
                  <td className="px-4 py-3 text-sm">{h.action}</td>
                  <td className="px-4 py-3"><Badge className={h.status === 'Active' ? 'bg-red-100 text-red-800' : h.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{h.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'hygiene' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">5 Moments of Hand Hygiene</h3>
            <div className="space-y-3">
              {[
                { moment: 'Before Patient Contact', current: 85, target: 90 },
                { moment: 'After Patient Contact', current: 78, target: 90 },
                { moment: 'Before Procedure', current: 92, target: 95 },
                { moment: 'After Procedure', current: 88, target: 90 },
                { moment: 'After Contact with Body Fluids', current: 72, target: 90 },
              ].map(m => (
                <div key={m.moment}>
                  <div className="flex justify-between text-sm mb-1"><span>{m.moment}</span><span className={`font-bold ${m.current >= m.target ? 'text-green-600' : 'text-red-600'}`}>{m.current}% (target: {m.target}%)</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2 relative">
                    <div className={`h-2 rounded-full ${m.current >= m.target ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${m.current}%` }} />
                    <div className="absolute right-0 top-0 h-full border-l-2 border-dashed border-red-500" style={{ left: `${m.target}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Compliance by Ward</h3>
            <div className="space-y-2">
              {[
                { ward: 'ICU', rate: 88 },
                { ward: 'Theatre', rate: 95 },
                { ward: 'Emergency', rate: 78 },
                { ward: 'Maternity', rate: 85 },
                { ward: 'Ward A', rate: 82 },
                { ward: 'Ward B', rate: 76 },
                { ward: 'OPD', rate: 70 },
              ].sort((a, b) => b.rate - a.rate).map(w => (
                <div key={w.ward}>
                  <div className="flex justify-between text-sm mb-1"><span>{w.ward}</span><span className={`font-bold ${w.rate >= 85 ? 'text-green-600' : w.rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{w.rate}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${w.rate >= 85 ? 'bg-green-500' : w.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${w.rate}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'amr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">MDR Organism Alerts</h3>
            <div className="space-y-2">
              {[
                { organism: 'MRSA', cases: 3, trend: 'Stable', color: 'text-red-600' },
                { organism: 'ESBL-producing E. coli', cases: 2, trend: 'Increasing', color: 'text-orange-600' },
                { organism: 'VRE', cases: 1, trend: 'Decreasing', color: 'text-green-600' },
                { organism: 'CRE', cases: 0, trend: 'None', color: 'text-gray-600' },
              ].map(a => (
                <div key={a.organism} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div><div className="font-bold">{a.organism}</div><div className="text-xs text-gray-500">{a.trend}</div></div>
                  <span className={`text-2xl font-bold ${a.color}`}>{a.cases}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Antibiotic Resistance Patterns</h3>
            <div className="space-y-3">
              {[
                { drug: 'Methicillin (MRSA)', resistance: 35 },
                { drug: 'Gentamicin', resistance: 12 },
                { drug: 'Ciprofloxacin', resistance: 28 },
                { drug: 'Meropenem', resistance: 5 },
                { drug: 'Vancomycin', resistance: 2 },
              ].map(d => (
                <div key={d.drug}>
                  <div className="flex justify-between text-sm mb-1"><span>{d.drug}</span><span className={`font-bold ${d.resistance > 30 ? 'text-red-600' : d.resistance > 15 ? 'text-yellow-600' : 'text-green-600'}`}>{d.resistance}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${d.resistance > 30 ? 'bg-red-500' : d.resistance > 15 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${d.resistance}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
