import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface Prescription {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  prescriber: string;
  date: string;
  items: { drug: string; strength: string; dose: string; frequency: string; duration: string; quantity: number; dispensed: number }[];
  totalCost: number;
  paymentMethod: 'Cash' | 'NHIS' | 'Insurance' | 'Credit';
  status: 'Pending' | 'Verified' | 'Dispensing' | 'Dispensed' | 'Partial' | 'Cancelled';
  urgent: boolean;
}

const SAMPLE: Prescription[] = [
  { id: 'RX-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', ward: 'Medical', prescriber: 'Dr. Appiah', date: '2026-08-25', items: [
    { drug: 'Amoxicillin', strength: '500mg', dose: '1 capsule', frequency: 'TID', duration: '7 days', quantity: 21, dispensed: 21 },
    { drug: 'Paracetamol', strength: '500mg', dose: '2 tablets', frequency: 'QID', duration: '5 days', quantity: 40, dispensed: 40 },
  ], totalCost: 35.00, paymentMethod: 'NHIS', status: 'Dispensed', urgent: false },
  { id: 'RX-002', patientName: 'Ama Osei', mrn: 'MRN-12350', ward: 'Maternity', prescriber: 'Dr. Asantewaa', date: '2026-08-25', items: [
    { drug: 'Ferrous Sulfate', strength: '200mg', dose: '1 tablet', frequency: 'BID', duration: '30 days', quantity: 60, dispensed: 0 },
    { drug: 'Folic Acid', strength: '5mg', dose: '1 tablet', frequency: 'Daily', duration: '30 days', quantity: 30, dispensed: 0 },
  ], totalCost: 22.50, paymentMethod: 'Cash', status: 'Pending', urgent: false },
  { id: 'RX-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', ward: 'Cardiac', prescriber: 'Dr. Kumah', date: '2026-08-25', items: [
    { drug: 'Metoprolol', strength: '50mg', dose: '1 tablet', frequency: 'BID', duration: '30 days', quantity: 60, dispensed: 60 },
    { drug: 'Aspirin', strength: '75mg', dose: '1 tablet', frequency: 'Daily', duration: '30 days', quantity: 30, dispensed: 30 },
    { drug: 'Atorvastatin', strength: '20mg', dose: '1 tablet', frequency: 'Nightly', duration: '30 days', quantity: 30, dispensed: 30 },
  ], totalCost: 85.00, paymentMethod: 'Insurance', status: 'Dispensed', urgent: false },
  { id: 'RX-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', ward: 'Emergency', prescriber: 'Dr. Darko', date: '2026-08-25', items: [
    { drug: 'Morphine Sulfate', strength: '10mg/mL', dose: '5mg IV', frequency: 'Q4h PRN', duration: '24h', quantity: 6, dispensed: 6 },
    { drug: 'Ondansetron', strength: '4mg', dose: '1 tablet', frequency: 'TID PRN', duration: '3 days', quantity: 9, dispensed: 0 },
  ], totalCost: 45.00, paymentMethod: 'Cash', status: 'Verified', urgent: true },
  { id: 'RX-005', patientName: 'Yaw Darko', mrn: 'MRN-12380', ward: 'ICU', prescriber: 'Dr. Asantewaa', date: '2026-08-25', items: [
    { drug: 'Vancomycin', strength: '1g', dose: '1g IV', frequency: 'Q12h', duration: '14 days', quantity: 28, dispensed: 28 },
    { drug: 'Piperacillin-Tazobactam', strength: '4.5g', dose: '4.5g IV', frequency: 'Q8h', duration: '14 days', quantity: 42, dispensed: 42 },
  ], totalCost: 450.00, paymentMethod: 'Credit', status: 'Dispensed', urgent: true },
];

const STATUS_COLORS: Record<string, string> = { Pending: 'bg-gray-100 text-gray-800', Verified: 'bg-blue-100 text-blue-800', Dispensing: 'bg-yellow-100 text-yellow-800', Dispensed: 'bg-green-100 text-green-800', Partial: 'bg-orange-100 text-orange-800', Cancelled: 'bg-red-100 text-red-800' };

export default function PharmacyOrdering() {
  const [tab, setTab] = useState<'overview' | 'prescriptions' | 'dispensing' | 'controlled'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💊 Pharmacy Ordering</h1>
          <p className="text-gray-600 mt-1">Electronic prescriptions · Dispensing workflow · Medication tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rx', value: SAMPLE.length, icon: '📋', color: 'text-blue-600' },
          { label: 'Dispensed', value: SAMPLE.filter(r => r.status === 'Dispensed').length, icon: '✅', color: 'text-green-600' },
          { label: 'Pending', value: SAMPLE.filter(r => r.status === 'Pending' || r.status === 'Verified').length, icon: '⏳', color: 'text-yellow-600' },
          { label: 'Revenue', value: `GH₵${SAMPLE.reduce((s, r) => s + r.totalCost, 0).toFixed(0)}`, icon: '💰', color: 'text-purple-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'prescriptions', 'dispensing', 'controlled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'prescriptions' ? '📋 Prescriptions' : t === 'dispensing' ? '💊 Dispensing' : '🔒 Controlled'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Prescriptions by Payment Method</h3>
            <div className="space-y-3">
              {Object.entries(SAMPLE.reduce<Record<string, { count: number; cost: number }>>((a, r) => {
                if (!a[r.paymentMethod]) a[r.paymentMethod] = { count: 0, cost: 0 };
                a[r.paymentMethod].count++;
                a[r.paymentMethod].cost += r.totalCost;
                return a;
              }, {})).sort((a, b) => b[1].cost - a[1].cost).map(([method, data]) => (
                <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <Badge className="bg-gray-100 text-gray-800">{method}</Badge>
                  <div className="text-right text-sm"><div className="font-bold">GH₵{data.cost.toFixed(2)}</div><div className="text-gray-500">{data.count} Rx</div></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Dispensing Pipeline</h3>
            <div className="flex items-center justify-between gap-2">
              {['Pending', 'Verified', 'Dispensing', 'Dispensed'].map((step, i) => {
                const count = SAMPLE.filter(r => r.status === step).length;
                return (
                  <div key={step} className="flex-1 text-center">
                    <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white font-bold ${i < 3 ? 'bg-blue-500' : 'bg-green-500'}`}>{count}</div>
                    <div className="text-xs text-gray-600 mt-2">{step}</div>
                    {i < 3 && <div className="text-gray-400 text-lg">→</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-4">
          {SAMPLE.map(r => (
            <Card key={r.id} className={`p-5 ${r.urgent ? 'ring-2 ring-red-500' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.id}</span>
                    <span className="font-bold text-gray-900">{r.patientName}</span>
                    {r.urgent && <Badge className="bg-red-100 text-red-800">URGENT</Badge>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{r.mrn} · {r.ward} · Prescriber: {r.prescriber} · {r.date}</div>
                </div>
                <div className="text-right">
                  <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                  <div className="text-sm font-bold mt-1">GH₵{r.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{r.paymentMethod}</div>
                </div>
              </div>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500"><th className="text-left">Drug</th><th className="text-left">Dose</th><th className="text-left">Frequency</th><th className="text-left">Duration</th><th className="text-left">Qty</th><th className="text-left">Dispensed</th></tr></thead>
                  <tbody>
                    {r.items.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-1 font-medium">{item.drug} {item.strength}</td>
                        <td className="py-1">{item.dose}</td>
                        <td className="py-1">{item.frequency}</td>
                        <td className="py-1">{item.duration}</td>
                        <td className="py-1">{item.quantity}</td>
                        <td className="py-1"><span className={item.dispensed === item.quantity ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{item.dispensed}/{item.quantity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'dispensing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE.filter(r => r.status !== 'Dispensed' && r.status !== 'Cancelled').map(r => (
            <Card key={r.id} className="p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.id}</span>
                <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
              </div>
              <div className="font-bold">{r.patientName}</div>
              <div className="text-sm text-gray-500">{r.ward} · {r.prescriber}</div>
              <div className="mt-3 space-y-1">
                {r.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{item.drug} {item.strength} × {item.quantity}</span>
                    <span className={item.dispensed === item.quantity ? 'text-green-600' : 'text-red-600'}>{item.dispensed}/{item.quantity}</span>
                  </div>
                ))}
              </div>
              {r.status !== 'Dispensed' && <button onClick={() => {}} className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Dispense All</button>}
            </Card>
          ))}
        </div>
      )}

      {tab === 'controlled' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">🔒 Controlled Substance Register</h3>
          <div className="space-y-3">
            {[
              { drug: 'Morphine Sulfate 10mg/mL', category: 'Schedule II', stock: 45, dispensed: 12, lastAudit: '2026-08-25' },
              { drug: 'Fentanyl 100mcg/2mL', category: 'Schedule II', stock: 20, dispensed: 5, lastAudit: '2026-08-25' },
              { drug: 'Diazepam 10mg', category: 'Schedule IV', stock: 100, dispensed: 18, lastAudit: '2026-08-24' },
              { drug: 'Pethidine 50mg/mL', category: 'Schedule II', stock: 30, dispensed: 8, lastAudit: '2026-08-25' },
              { drug: 'Ketamine 50mg/mL', category: 'Schedule III', stock: 25, dispensed: 3, lastAudit: '2026-08-23' },
            ].map(c => (
              <div key={c.drug} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div><div className="font-bold">{c.drug}</div><div className="text-xs text-gray-500">{c.category} · Last audit: {c.lastAudit}</div></div>
                  <div className="text-right"><div className="text-lg font-bold">{c.stock}</div><div className="text-xs text-gray-500">units</div></div>
                </div>
                <div className="mt-2 flex justify-between text-sm"><span>Dispensed this period: <strong>{c.dispensed}</strong></span><span>Remaining: <strong>{c.stock - c.dispensed}</strong></span></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
