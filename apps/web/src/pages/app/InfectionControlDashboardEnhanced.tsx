import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface HAIDefinition { id: string; organism: string; site: string; patient: string; mrn: string; ward: string; dateIdentified: string; riskFactor: string; status: 'Active' | 'Treated' | 'Resolved' | 'Colonisation'; contactPrecautions: boolean; alertSent: boolean; }

interface HandHygiene { month: string; opportunities: number; compliance: number; doctors: number; nurses: number; ancillary: number; }

const HAIS: HAIDefinition[] = [
  { id: 'HAI-001', organism: 'MRSA', site: 'Bloodstream', patient: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'ICU', dateIdentified: '2026-08-25', riskFactor: 'Central line, prolonged ICU stay', status: 'Active', contactPrecautions: true, alertSent: true },
  { id: 'HAI-002', organism: 'ESBL E. coli', site: 'Urinary', patient: 'Akua Mensah', mrn: 'MRN-2024-1234', ward: 'Medical Ward A', dateIdentified: '2026-08-24', riskFactor: 'Indwelling catheter, prior antibiotics', status: 'Treated', contactPrecautions: true, alertSent: true },
  { id: 'HAI-003', organism: 'Candida albicans', site: 'Bloodstream', patient: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', dateIdentified: '2026-08-23', riskFactor: 'TPN, central line, immunosuppressed', status: 'Treated', contactPrecautions: false, alertSent: true },
  { id: 'HAI-004', organism: 'Pseudomonas aeruginosa', site: 'Respiratory', patient: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', dateIdentified: '2026-08-26', riskFactor: 'Ventilator, recent surgery', status: 'Active', contactPrecautions: true, alertSent: false },
  { id: 'HAI-005', organism: 'VRE', site: 'Gastrointestinal', patient: 'Kofi Amoako', mrn: 'MRN-2024-0776', ward: 'Oncology', dateIdentified: '2026-08-22', riskFactor: 'Prior vancomycin use, immunosuppressed', status: 'Colonisation', contactPrecautions: true, alertSent: true },
];

const HAND_HYGIENE: HandHygiene[] = [
  { month: 'Mar', opportunities: 1200, compliance: 72, doctors: 65, nurses: 82, ancillary: 60 },
  { month: 'Apr', opportunities: 1350, compliance: 75, doctors: 68, nurses: 85, ancillary: 62 },
  { month: 'May', opportunities: 1420, compliance: 78, doctors: 72, nurses: 87, ancillary: 65 },
  { month: 'Jun', opportunities: 1500, compliance: 80, doctors: 74, nurses: 88, ancillary: 68 },
  { month: 'Jul', opportunities: 1480, compliance: 82, doctors: 76, nurses: 90, ancillary: 70 },
  { month: 'Aug', opportunities: 1550, compliance: 84, doctors: 78, nurses: 91, ancillary: 72 },
];

const SURVEILLANCE_DATA = [
  { month: 'Aug', clabsi: 2, cauti: 3, ssii: 1, vapi: 2, cdi: 0 },
  { month: 'Jul', clabsi: 1, cauti: 4, ssii: 2, vapi: 1, cdi: 1 },
  { month: 'Jun', clabsi: 3, cauti: 2, ssii: 1, vapi: 3, cdi: 0 },
];

export default function InfectionControlDashboardEnhanced() {
  const [tab, setTab] = useState<'overview' | 'hai' | 'handhygiene' | 'surveillance'>('overview');
  const activeHAIs = HAIS.filter(h => h.status === 'Active');
  const totalHAIs = HAIS.length;
  const latestHH = HAND_HYGIENE[HAND_HYGIENE.length - 1] ?? HAND_HYGIENE[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Infection Control Dashboard</h1>
          <p className="text-slate-500 text-sm">HAI surveillance, hand hygiene compliance, and outbreak monitoring</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Report HAI</button>
      </div>

      <div className="flex gap-2">
        {(['overview', 'hai', 'handhygiene', 'surveillance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t === 'handhygiene' ? 'Hand Hygiene' : t === 'hai' ? 'HAI Register' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4"><p className="text-xs text-slate-500">Active HAIs</p><p className="text-2xl font-bold text-red-600">{activeHAIs.length}</p></Card>
            <Card className="p-4"><p className="text-xs text-slate-500">Total HAIs (30d)</p><p className="text-2xl font-bold">{totalHAIs}</p></Card>
            <Card className="p-4"><p className="text-xs text-slate-500">Hand Hygiene</p><p className="text-2xl font-bold text-green-600">{latestHH.compliance}%</p></Card>
            <Card className="p-4"><p className="text-xs text-slate-500">Contact Precautions</p><p className="text-2xl font-bold text-orange-600">{HAIS.filter(h => h.contactPrecautions && h.status === 'Active').length}</p></Card>
            <Card className="p-4"><p className="text-xs text-slate-500">Alerts Pending</p><p className="text-2xl font-bold text-yellow-600">{HAIS.filter(h => !h.alertSent).length}</p></Card>
          </div>
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Hand Hygiene Trend</h2>
            <div className="space-y-2">
              {HAND_HYGIENE.map(h => (
                <div key={h.month} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-slate-500">{h.month}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                    <div className={`h-4 rounded ${h.compliance >= 80 ? 'bg-green-400' : h.compliance >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${h.compliance}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-medium">{h.compliance}%</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div><p className="text-lg font-bold">{latestHH.doctors}%</p><p className="text-xs text-slate-500">Doctors</p></div>
              <div><p className="text-lg font-bold">{latestHH.nurses}%</p><p className="text-xs text-slate-500">Nurses</p></div>
              <div><p className="text-lg font-bold">{latestHH.ancillary}%</p><p className="text-xs text-slate-500">Ancillary</p></div>
            </div>
          </Card>
        </>
      )}

      {tab === 'hai' && (
        <div className="space-y-3">
          {HAIS.map(h => (
            <Card key={h.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{h.organism}</span>
                    <Badge tone={h.status === 'Active' ? 'red' : h.status === 'Treated' ? 'green' : 'blue'}>{h.status}</Badge>
                    {h.contactPrecautions && <Badge tone="orange">Contact Precautions</Badge>}
                    {!h.alertSent && <Badge tone="red">Alert Pending</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{h.site} infection · {h.patient} ({h.mrn})</p>
                  <p className="text-xs text-slate-500 mt-1">Ward: {h.ward} · Identified: {h.dateIdentified}</p>
                  <p className="text-xs text-slate-500">Risk factors: {h.riskFactor}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">View Details</button>
                  {!h.alertSent && <button onClick={() => {}} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Send Alert</button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'surveillance' && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">HAI Surveillance — Device-Associated Rates</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="p-2">Month</th><th className="p-2">CLABSI</th><th className="p-2">CAUTI</th><th className="p-2">SSI</th><th className="p-2">VAP</th><th className="p-2">CDI</th><th className="p-2">Total</th>
            </tr></thead>
            <tbody>
              {SURVEILLANCE_DATA.map(s => (
                <tr key={s.month} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{s.month} 2026</td>
                  <td className="p-2">{s.clabsi}</td><td className="p-2">{s.cauti}</td><td className="p-2">{s.ssii}</td><td className="p-2">{s.vapi}</td><td className="p-2">{s.cdi}</td>
                  <td className="p-2 font-bold">{s.clabsi + s.cauti + s.ssii + s.vapi + s.cdi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
