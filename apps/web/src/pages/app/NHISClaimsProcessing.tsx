import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, useToast } from '../../components/ui';

interface NHISClaim {
  id: string; patientName: string; nhisNumber: string; service: string;
  amount: number; claimDate: string; submissionDate: string;
  status: 'Submitted' | 'Processing' | 'Approved' | 'Rejected' | 'Paid';
  processedDate?: string; paidAmount?: number; rejectionReason?: string;
  facilityCode: string; providerNumber: string; diagnosisCode: string;
  visitType: 'OPD' | 'IPD' | 'Emergency' | 'Maternity' | 'Surgical';
  insuranceType: 'NHIS' | 'NIC' | 'Enterprise' | 'Private';
}

const CLAIMS: NHISClaim[] = [
  { id: 'NC-001', patientName: 'Kwame Asante', nhisNumber: 'NHIS-GH-2024-001', service: 'OPD Consultation + Lab Tests', amount: 500, claimDate: '2026-08-20', submissionDate: '2026-08-22', status: 'Paid', processedDate: '2026-08-25', paidAmount: 500, facilityCode: 'FA-001', providerNumber: 'PN-2024-001', diagnosisCode: 'J06.9', visitType: 'OPD', insuranceType: 'NHIS' },
  { id: 'NC-002', patientName: 'Akua Mensah', nhisNumber: 'NHIS-GH-2024-002', service: 'Chest X-Ray + Sputum AFB', amount: 850, claimDate: '2026-08-22', submissionDate: '2026-08-23', status: 'Approved', processedDate: '2026-08-25', facilityCode: 'FA-001', providerNumber: 'PN-2024-002', diagnosisCode: 'A15.0', visitType: 'OPD', insuranceType: 'NHIS' },
  { id: 'NC-003', patientName: 'Nana Osei', nhisNumber: 'NHIS-GH-2024-003', service: 'Appendectomy (Surgical)', amount: 5000, claimDate: '2026-08-15', submissionDate: '2026-08-18', status: 'Paid', processedDate: '2026-08-22', paidAmount: 5000, facilityCode: 'FA-001', providerNumber: 'PN-2024-003', diagnosisCode: 'K35.80', visitType: 'Surgical', insuranceType: 'NHIS' },
  { id: 'NC-004', patientName: 'Efua Nyarko', nhisNumber: 'NHIS-GH-2024-004', service: 'Diabetes Management (3 months)', amount: 1200, claimDate: '2026-08-24', submissionDate: '2026-08-24', status: 'Submitted', facilityCode: 'FA-001', providerNumber: 'PN-2024-004', diagnosisCode: 'E11.9', visitType: 'OPD', insuranceType: 'NHIS' },
  { id: 'NC-005', patientName: 'Yaw Boateng', nhisNumber: 'NHIS-GH-2024-005', service: 'MRI Brain with Contrast', amount: 3500, claimDate: '2026-08-20', submissionDate: '2026-08-21', status: 'Rejected', processedDate: '2026-08-24', rejectionReason: 'Prior authorization not obtained', facilityCode: 'FA-001', providerNumber: 'PN-2024-005', diagnosisCode: 'R51.9', visitType: 'OPD', insuranceType: 'NIC' },
  { id: 'NC-006', patientName: 'Kofi Asante', nhisNumber: 'NHIS-GH-2024-006', service: 'Caesarean Section', amount: 8000, claimDate: '2026-08-18', submissionDate: '2026-08-20', status: 'Paid', processedDate: '2026-08-26', paidAmount: 8000, facilityCode: 'FA-001', providerNumber: 'PN-2024-006', diagnosisCode: 'O82.0', visitType: 'Maternity', insuranceType: 'NHIS' },
  { id: 'NC-007', patientName: 'Ama Darko', nhisNumber: 'NHIS-GH-2024-007', service: 'Emergency Trauma Care', amount: 2500, claimDate: '2026-08-25', submissionDate: '2026-08-25', status: 'Processing', facilityCode: 'FA-001', providerNumber: 'PN-2024-007', diagnosisCode: 'S06.0X0A', visitType: 'Emergency', insuranceType: 'Enterprise' },
  { id: 'NC-008', patientName: 'Kwadwo Mensah', nhisNumber: 'NHIS-GH-2024-008', service: 'Dental Extraction + Medication', amount: 350, claimDate: '2026-08-23', submissionDate: '2026-08-24', status: 'Approved', processedDate: '2026-08-26', facilityCode: 'FA-001', providerNumber: 'PN-2024-008', diagnosisCode: 'K07.3', visitType: 'OPD', insuranceType: 'NHIS' },
];

const STATUS_COLORS: Record<string, string> = { Submitted: 'bg-blue-100 text-blue-800', Processing: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Paid: 'bg-purple-100 text-purple-800' };
const VISIT_COLORS: Record<string, string> = { OPD: 'bg-blue-100 text-blue-800', IPD: 'bg-purple-100 text-purple-800', Emergency: 'bg-red-100 text-red-800', Maternity: 'bg-pink-100 text-pink-800', Surgical: 'bg-orange-100 text-orange-800' };

export default function NHISClaimsProcessing() {
  const [tab, setTab] = useState<'overview' | 'claims' | 'analytics' | 'rejected'>('overview');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const toast = useToast();
  const totalSubmitted = CLAIMS.reduce((s, c) => s + c.amount, 0);
  const totalPaid = CLAIMS.filter(c => c.paidAmount).reduce((s, c) => s + (c.paidAmount || 0), 0);
  const approvalRate = ((CLAIMS.filter(c => c.status === 'Approved' || c.status === 'Paid').length / CLAIMS.length) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 NHIS Claims Processing</h1>
          <p className="text-gray-600 mt-1">Claims submission · Processing · Payment reconciliation · Denial management</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "✕ Cancel" : "+ New Claim"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Submit New NHIS Claim"
          fields={[
            { name: "patientName", label: "Patient Name", type: "text", required: true },
            { name: "nhisNumber", label: "NHIS Number", type: "text", required: true },
            { name: "visitType", label: "Visit Type", type: "select", options: ["OPD", "IPD", "Emergency", "Maternity", "Surgical"], required: true },
            { name: "serviceType", label: "Service Type", type: "select", options: ["OPD Consultation", "Lab Tests", "Imaging", "Surgical", "Maternity", "Emergency", "Dental", "Eye", "Pharmacy"] },
            { name: "diagnosisCode", label: "ICD-10 Diagnosis Code", type: "text" },
            { name: "amount", label: "Amount (GH₵)", type: "number" },
            { name: "claimDate", label: "Service Date", type: "date" }
          ]}
          onSave={(_data) => { toast('Claim submitted successfully', 'success'); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Claims', value: CLAIMS.length, icon: '📋', color: 'text-blue-600' },
          { label: 'Submitted Value', value: `GH₵${totalSubmitted.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
          { label: 'Paid', value: `GH₵${totalPaid.toLocaleString()}`, icon: '✅', color: 'text-purple-600' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: '📊', color: 'text-teal-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'claims', 'analytics', 'rejected'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'claims' ? '📋 All Claims' : t === 'analytics' ? '📈 Analytics' : '❌ Rejected'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Claims Pipeline</h3>
            <div className="space-y-3">
              {['Submitted', 'Processing', 'Approved', 'Rejected', 'Paid'].map(status => {
                const count = CLAIMS.filter(c => c.status === status).length;
                const pct = CLAIMS.length > 0 ? (count / CLAIMS.length * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={STATUS_COLORS[status]}>{status}</Badge><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${status === 'Paid' ? 'bg-green-500' : status === 'Rejected' ? 'bg-red-500' : status === 'Approved' ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Claims by Insurance Type</h3>
            <div className="space-y-2">
              {Object.entries(CLAIMS.reduce<Record<string, { count: number; amount: number }>>((a, c) => {
                if (!a[c.insuranceType]) a[c.insuranceType] = { count: 0, amount: 0 };
                a[c.insuranceType].count++;
                a[c.insuranceType].amount += c.amount;
                return a;
              }, {})).sort((a, b) => b[1].amount - a[1].amount).map(([type, data]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className="bg-gray-100 text-gray-800">{type}</Badge>
                  <div className="text-right text-sm"><div className="font-bold">GH₵{data.amount.toLocaleString()}</div><div className="text-gray-500">{data.count} claims</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'claims' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Claim ID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">NHIS No.</th>
                <th className="px-4 py-3 text-left">Visit</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">ICD-10</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Insurance</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {CLAIMS.map(c => (
                <tr key={c.id} className={`border-b hover:bg-gray-50 ${c.status === 'Rejected' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-3 font-medium">{c.patientName}</td>
                  <td className="px-4 py-3 text-xs">{c.nhisNumber}</td>
                  <td className="px-4 py-3"><Badge className={VISIT_COLORS[c.visitType]}>{c.visitType}</Badge></td>
                  <td className="px-4 py-3 text-xs max-w-[150px] truncate">{c.service}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.diagnosisCode}</td>
                  <td className="px-4 py-3 font-bold">GH₵{c.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{c.submissionDate}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{c.insuranceType}</Badge></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Claims by Visit Type</h3>
            <div className="space-y-3">
              {Object.entries(CLAIMS.reduce<Record<string, { count: number; amount: number }>>((a, c) => {
                if (!a[c.visitType]) a[c.visitType] = { count: 0, amount: 0 };
                a[c.visitType].count++;
                a[c.visitType].amount += c.amount;
                return a;
              }, {})).sort((a, b) => b[1].amount - a[1].amount).map(([type, data]) => {
                const pct = totalSubmitted > 0 ? (data.amount / totalSubmitted * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={VISIT_COLORS[type]}>{type}</Badge><span className="font-bold">GH₵{data.amount.toLocaleString()} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">GH₵{totalPaid.toLocaleString()}</div><div className="text-sm text-green-800">Total Paid</div></div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-600">GH₵{(totalSubmitted - totalPaid).toLocaleString()}</div><div className="text-sm text-yellow-800">Pending/Paid</div></div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium text-blue-800">Recovery Rate: {((totalPaid / totalSubmitted) * 100).toFixed(0)}%</div>
                <div className="text-blue-600 mt-1">Average processing time: 5 days</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'rejected' && (
        <div className="space-y-4">
          {CLAIMS.filter(c => c.status === 'Rejected').map(c => (
            <Card key={c.id} className="p-5 ring-2 ring-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-red-800">{c.id} — {c.patientName}</div>
                  <div className="text-sm text-gray-600 mt-1">{c.service} · GH₵{c.amount.toLocaleString()}</div>
                </div>
                <Badge className="bg-red-100 text-red-800">Rejected</Badge>
              </div>
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-800">Rejection Reason:</div>
                <div className="text-sm text-red-600 mt-1">{c.rejectionReason}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">📝 Appeal</button>
                <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">🔄 Resubmit</button>
              </div>
            </Card>
          ))}
          {CLAIMS.filter(c => c.status === 'Rejected').length === 0 && <Card className="p-6 text-center text-gray-500">✅ No rejected claims</Card>}
        </div>
      )}
    </div>
  );
}