import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface InsuranceRecord {
  id: string; patientName: string; nhisNumber: string; insuranceType: string;
  provider: string; coverAmount: number; usedAmount: number;
  policyExpiry: string; status: 'Active' | 'Expired' | 'Suspended' | 'Pending';
  claims: { id: string; service: string; amount: number; date: string; status: 'Approved' | 'Pending' | 'Rejected' }[];
  dependents: string[];
}

const INSURANCE_RECORDS: InsuranceRecord[] = [
  { id: 'INS-001', patientName: 'Kwame Asante', nhisNumber: 'NHIS-GH-2024-001', insuranceType: 'NHIS', provider: 'National Health Insurance Authority', coverAmount: 50000, usedAmount: 12500, policyExpiry: '2026-12-31', status: 'Active', claims: [{ id: 'CLM-001', service: 'OPD Consultation', amount: 150, date: '2026-08-10', status: 'Approved' }, { id: 'CLM-002', service: 'Lab Tests (Full Blood Count)', amount: 350, date: '2026-08-10', status: 'Approved' }, { id: 'CLM-003', service: 'Chest X-Ray', amount: 500, date: '2026-08-12', status: 'Pending' }], dependents: ['Akua Asante (Spouse)', 'Kofi Asante (Son)'] },
  { id: 'INS-002', patientName: 'Akua Mensah', nhisNumber: 'PRV-SSL-2024-002', insuranceType: 'Private', provider: 'Star Assurance', coverAmount: 200000, usedAmount: 45000, policyExpiry: '2027-06-30', status: 'Active', claims: [{ id: 'CLM-004', service: 'Surgery (Appendectomy)', amount: 15000, date: '2026-07-20', status: 'Approved' }, { id: 'CLM-005', service: 'Post-Op Medications', amount: 2500, date: '2026-07-22', status: 'Approved' }], dependents: ['Yaw Mensah (Husband)', 'Esi Mensah (Daughter)'] },
  { id: 'INS-003', patientName: 'Kofi Appiah', nhisNumber: 'NHIS-GH-2024-003', insuranceType: 'NHIS', provider: 'National Health Insurance Authority', coverAmount: 50000, usedAmount: 48000, policyExpiry: '2025-12-31', status: 'Expired', claims: [{ id: 'CLM-006', service: 'Diabetes Management', amount: 8000, date: '2025-11-15', status: 'Approved' }], dependents: [] },
  { id: 'INS-004', patientName: 'Ama Osei', nhisNumber: 'PRV-ALL-2024-004', insuranceType: 'Corporate', provider: 'Allianz Life Insurance', coverAmount: 500000, usedAmount: 75000, policyExpiry: '2027-03-31', status: 'Active', claims: [{ id: 'CLM-007', service: 'Maternity Package', amount: 25000, date: '2026-06-15', status: 'Approved' }, { id: 'CLM-008', service: 'Paediatric Care', amount: 3500, date: '2026-08-01', status: 'Pending' }], dependents: ['Kojo Osei (Son)', 'Adwoa Osei (Daughter)', 'Nana Osei (Mother)'] },
  { id: 'INS-005', patientName: 'Yaw Boateng', nhisNumber: 'NHIS-GH-2024-005', insuranceType: 'NHIS', provider: 'National Health Insurance Authority', coverAmount: 50000, usedAmount: 0, policyExpiry: '2026-12-31', status: 'Suspended', claims: [], dependents: ['Abena Boateng (Wife)'] },
];

const TYPE_COLORS: Record<string, string> = { NHIS: 'bg-blue-100 text-blue-800', Private: 'bg-purple-100 text-purple-800', Corporate: 'bg-green-100 text-green-800', HMO: 'bg-orange-100 text-orange-800' };
const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Expired: 'bg-red-100 text-red-800', Suspended: 'bg-yellow-100 text-yellow-800', Pending: 'bg-blue-100 text-blue-800' };
const CLAIM_STATUS: Record<string, string> = { Approved: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Rejected: 'bg-red-100 text-red-800' };

export default function HealthInsuranceManagement() {
  const [selected, setSelected] = useState<InsuranceRecord | null>(INSURANCE_RECORDS[0] ?? null);
  const [tab, setTab] = useState<'records' | 'claims' | 'stats'>('records');
  const totalCover = INSURANCE_RECORDS.reduce((s, r) => s + r.coverAmount, 0);
  const totalUsed = INSURANCE_RECORDS.reduce((s, r) => s + r.usedAmount, 0);
  const activeCount = INSURANCE_RECORDS.filter(r => r.status === 'Active').length;
  const totalClaims = INSURANCE_RECORDS.reduce((s, r) => s + r.claims.length, 0);

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Insurance Record"
          fields={[{"name":"providerName","label":"Provider Name","type":"text","required":true},{"name":"policyNumber","label":"Policy Number","type":"text","required":true},{"name":"coverageType","label":"Coverage Type","type":"select","options":["Basic","Standard","Premium","Corporate"]},{"name":"validFrom","label":"Valid From","type":"date"},{"name":"validTo","label":"Valid To","type":"date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Health Insurance & NHIS Management</h1><p className="text-gray-500">Insurance verification, NHIS claims processing, coverage tracking, and billing integration</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Cover', value: `GH₵ ${(totalCover/1000).toFixed(0)}K`, color: 'text-blue-600' }, { label: 'Used', value: `GH₵ ${(totalUsed/1000).toFixed(0)}K`, color: 'text-orange-600' }, { label: 'Active Policies', value: activeCount, color: 'text-green-600' }, { label: 'Claims', value: totalClaims, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['records', 'claims', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'records' ? 'Insurance Records' : t === 'claims' ? 'Claims Management' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'records' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {INSURANCE_RECORDS.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === r.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{r.patientName}</span>
                  <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>{r.nhisNumber}</span><Badge className={TYPE_COLORS[r.insuranceType]}>{r.insuranceType}</Badge></div>
                  <div className="flex justify-between"><span>Cover: GH₵ {r.coverAmount.toLocaleString()}</span><span>Used: GH₵ {r.usedAmount.toLocaleString()}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(r.usedAmount / r.coverAmount) * 100}%` }} /></div>
                  <div>Provider: {r.provider}</div>
                </div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.nhisNumber}</p></div>
                <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Insurance Type</div><div className="font-bold"><Badge className={TYPE_COLORS[selected.insuranceType]}>{selected.insuranceType}</Badge></div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Provider</div><div className="font-bold text-sm">{selected.provider}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Coverage</div><div className="font-bold text-blue-600">GH₵ {selected.coverAmount.toLocaleString()}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Used</div><div className="font-bold text-orange-600">GH₵ {selected.usedAmount.toLocaleString()}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Balance</div><div className="font-bold text-green-600">GH₵ {(selected.coverAmount - selected.usedAmount).toLocaleString()}</div></div>
                <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Policy Expiry</div><div className="font-bold text-sm">{selected.policyExpiry}</div></div>
              </div>
              {selected.dependents.length > 0 && (
                <div><h4 className="font-semibold text-sm mb-1">Dependents</h4><div className="flex flex-wrap gap-2">{selected.dependents.map((d, i) => <span key={i} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs">{d}</span>)}</div></div>
              )}
              {selected.claims.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recent Claims</h4>
                  <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs"><th className="pb-1">ID</th><th className="pb-1">Service</th><th className="pb-1">Amount</th><th className="pb-1">Date</th><th className="pb-1">Status</th></tr></thead>
                    <tbody>{selected.claims.map(c => <tr key={c.id} className="border-t"><td className="py-1.5 font-mono text-xs">{c.id}</td><td className="py-1.5">{c.service}</td><td className="py-1.5">GH₵ {c.amount.toLocaleString()}</td><td className="py-1.5 text-xs">{c.date}</td><td className="py-1.5"><Badge className={CLAIM_STATUS[c.status]}>{c.status}</Badge></td></tr>)}</tbody></table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'claims' && (
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-4">All Claims Across Policies</h3>
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs border-b"><th className="pb-2">Claim ID</th><th className="pb-2">Patient</th><th className="pb-2">Service</th><th className="pb-2">Amount</th><th className="pb-2">Date</th><th className="pb-2">Status</th></tr></thead>
            <tbody>{INSURANCE_RECORDS.flatMap(r => r.claims.map(c => ({ ...c, patient: r.patientName, insuranceType: r.insuranceType }))).sort((a, b) => b.date.localeCompare(a.date)).map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50"><td className="py-2 font-mono text-xs">{c.id}</td><td className="py-2">{c.patient}</td><td className="py-2">{c.service}</td><td className="py-2">GH₵ {c.amount.toLocaleString()}</td><td className="py-2 text-xs">{c.date}</td><td className="py-2"><Badge className={CLAIM_STATUS[c.status]}>{c.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Coverage Utilisation</h3>
            {INSURANCE_RECORDS.map(r => (
              <div key={r.id} className="mb-3">
                <div className="flex justify-between text-xs mb-1"><span>{r.patientName}</span><span>{Math.round((r.usedAmount/r.coverAmount)*100)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(r.usedAmount/r.coverAmount)*100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Claims by Status</h3>
            {['Approved', 'Pending', 'Rejected'].map(status => {
              const count = INSURANCE_RECORDS.flatMap(r => r.claims).filter(c => c.status === status).length;
              return <div key={status} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={CLAIM_STATUS[status]}>{status}</Badge><span className="font-bold">{count}</span></div>;
            })}
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">By Insurance Type</h4>
              {['NHIS', 'Private', 'Corporate'].map(type => {
                const count = INSURANCE_RECORDS.filter(r => r.insuranceType === type).length;
                return <div key={type} className="flex items-center justify-between py-1 text-sm"><Badge className={TYPE_COLORS[type]}>{type}</Badge><span>{count} policies</span></div>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
