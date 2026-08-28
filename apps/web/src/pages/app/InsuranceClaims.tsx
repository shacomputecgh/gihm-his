import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Input, PageHeader } from '../../components/ui';

type ClaimsTab = 'pending' | 'submitted' | 'reconciled' | 'analytics';

interface InsuranceClaim {
  id: string;
  patientName: string;
  mrn: string;
  nhisNumber: string;
  providerType: 'NHIS' | 'private' | 'corporate';
  providerName: string;
  dateOfService: string;
  admissionDate?: string;
  dischargeDate?: string;
  diagnosis: string[];
  procedures: ClaimProcedure[];
  totalAmount: number;
  nhisCovered: number;
  patientPortion: number;
  status: 'draft' | 'ready' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid';
  submittedDate?: string;
  approvedDate?: string;
  paidDate?: string;
  rejectionReason?: string;
  claimReference?: string;
}

interface ClaimProcedure {
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const MOCK_CLAIMS: InsuranceClaim[] = [
  { id: 'CLM001', patientName: 'Kwame Asante', mrn: 'MRN-001', nhisNumber: 'NHIS-1234567890', providerType: 'NHIS', providerName: 'National Health Insurance', dateOfService: '2026-05-20', admissionDate: '2026-05-20', dischargeDate: '2026-05-23', diagnosis: ['Essential Hypertension', 'Hypertensive Urgency', 'Papilloedema'],
    procedures: [
      { name: 'Consultation (Specialist)', code: 'C001', quantity: 3, unitPrice: 50, total: 150 },
      { name: 'Bed (General Ward)', code: 'B001', quantity: 3, unitPrice: 30, total: 90 },
      { name: 'Blood Investigation (FBC)', code: 'L001', quantity: 2, unitPrice: 25, total: 50 },
      { name: 'Blood Investigation (U&E)', code: 'L002', quantity: 2, unitPrice: 30, total: 60 },
      { name: 'ECG', code: 'L005', quantity: 1, unitPrice: 40, total: 40 },
      { name: 'Medication (Amlodipine)', code: 'M001', quantity: 4, unitPrice: 8, total: 32 },
      { name: 'Medication (Enalapril)', code: 'M002', quantity: 4, unitPrice: 10, total: 40 },
    ],
    totalAmount: 462, nhisCovered: 370, patientPortion: 92, status: 'submitted', submittedDate: '2026-05-23', claimReference: 'NHIS-2026-05-001' },
  { id: 'CLM002', patientName: 'Ama Darko', mrn: 'MRN-002', nhisNumber: 'NHIS-9876543210', providerType: 'NHIS', providerName: 'National Health Insurance', dateOfService: '2026-05-23', diagnosis: ['Acute Appendicitis'],
    procedures: [
      { name: 'Emergency Consultation', code: 'C002', quantity: 1, unitPrice: 80, total: 80 },
      { name: 'CT Abdomen', code: 'I001', quantity: 1, unitPrice: 150, total: 150 },
      { name: 'Laparoscopic Appendectomy', code: 'S001', quantity: 1, unitPrice: 800, total: 800 },
      { name: 'General Anaesthesia', code: 'A001', quantity: 1, unitPrice: 200, total: 200 },
      { name: 'Bed (Surgical Ward)', code: 'B002', quantity: 1, unitPrice: 35, total: 35 },
      { name: 'Medications', code: 'M000', quantity: 1, unitPrice: 120, total: 120 },
    ],
    totalAmount: 1385, nhisCovered: 1108, patientPortion: 277, status: 'draft' },
  { id: 'CLM003', patientName: 'Efua Mensah', mrn: 'MRN-004', nhisNumber: 'N/A', providerType: 'private', providerName: 'Enterprise Insurance', dateOfService: '2026-05-22', diagnosis: ['Normal Vaginal Delivery'],
    procedures: [
      { name: 'Consultation (OB)', code: 'C001', quantity: 2, unitPrice: 50, total: 100 },
      { name: 'Normal Delivery', code: 'S002', quantity: 1, unitPrice: 300, total: 300 },
      { name: 'Bed (Maternity)', code: 'B003', quantity: 2, unitPrice: 25, total: 50 },
      { name: 'Newborn Care', code: 'P001', quantity: 1, unitPrice: 50, total: 50 },
      { name: 'Immunizations (BCG, OPV0, HepB0)', code: 'V001', quantity: 1, unitPrice: 30, total: 30 },
    ],
    totalAmount: 530, nhisCovered: 450, patientPortion: 80, status: 'paid', submittedDate: '2026-05-22', approvedDate: '2026-05-23', paidDate: '2026-05-23', claimReference: 'ENT-2026-05-001' },
  { id: 'CLM004', patientName: 'Kofi Asante Jr.', mrn: 'MRN-003', nhisNumber: 'NHIS-5555555555', providerType: 'NHIS', providerName: 'National Health Insurance', dateOfService: '2026-05-23', diagnosis: ['Community-acquired Pneumonia'],
    procedures: [
      { name: 'Emergency Consultation', code: 'C002', quantity: 1, unitPrice: 60, total: 60 },
      { name: 'Oxygen Therapy', code: 'T001', quantity: 1, unitPrice: 40, total: 40 },
      { name: 'IV Medications', code: 'M003', quantity: 1, unitPrice: 80, total: 80 },
      { name: 'Chest X-Ray', code: 'I002', quantity: 1, unitPrice: 50, total: 50 },
      { name: 'Blood Investigation', code: 'L001', quantity: 1, unitPrice: 25, total: 25 },
    ],
    totalAmount: 255, nhisCovered: 204, patientPortion: 51, status: 'processing', submittedDate: '2026-05-23', claimReference: 'NHIS-2026-05-002' },
  { id: 'CLM005', patientName: 'Nana Akua', mrn: 'MRN-008', nhisNumber: 'N/A', providerType: 'corporate', providerName: 'MT Ghana Staff Insurance', dateOfService: '2026-05-15', diagnosis: ['Severe Osteoarthritis — Left Hip'],
    procedures: [
      { name: 'Consultation (Orthopaedic)', code: 'C001', quantity: 4, unitPrice: 50, total: 200 },
      { name: 'X-Ray Hip', code: 'I003', quantity: 2, unitPrice: 40, total: 80 },
      { name: 'Total Hip Replacement', code: 'S003', quantity: 1, unitPrice: 5000, total: 5000 },
      { name: 'Anaesthesia', code: 'A001', quantity: 1, unitPrice: 200, total: 200 },
      { name: 'Implant (Hip Prosthesis)', code: 'IM01', quantity: 1, unitPrice: 8000, total: 8000 },
      { name: 'Bed (Surgical Ward)', code: 'B002', quantity: 5, unitPrice: 35, total: 175 },
    ],
    totalAmount: 13655, nhisCovered: 10000, patientPortion: 3655, status: 'rejected', submittedDate: '2026-05-18', rejectionReason: 'Implant cost exceeds approved tariff. Resubmit with prior authorization.' },
];

const STATUS_CONFIG: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'gray' }> = {
  draft: { label: 'Draft', tone: 'gray' },
  ready: { label: 'Ready', tone: 'blue' },
  submitted: { label: 'Submitted', tone: 'blue' },
  processing: { label: 'Processing', tone: 'gold' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  paid: { label: 'Paid', tone: 'green' },
};

export default function InsuranceClaims() {
  const [tab, setTab] = useState<ClaimsTab>('pending');
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClaims = MOCK_CLAIMS.filter(c => c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.mrn.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPaid = MOCK_CLAIMS.filter(c => c.status === 'paid').reduce((s, c) => s + c.nhisCovered, 0);
  const pendingClaims = MOCK_CLAIMS.filter(c => ['draft', 'ready'].includes(c.status)).length;
  const rejectedClaims = MOCK_CLAIMS.filter(c => c.status === 'rejected').length;

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
          title="Add New Insurance Claim"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"insuranceProvider","label":"Insurance Provider","type":"select","options":["NHIS","Enterprise","SIC","Vital","Star","Other"],"required":true},{"name":"claimAmount","label":"Claim Amount (GH₵)","type":"number","required":true},{"name":"diagnosis","label":"Diagnosis","type":"text"},{"name":"serviceDate","label":"Service Date","type":"date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Insurance Claims" subtitle="NHIS, private, and corporate insurance claim management" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_CLAIMS.length}</div><div className="text-xs text-slate-500">Total Claims</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{pendingClaims}</div><div className="text-xs text-slate-500">Pending</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">GH₵ {totalPaid.toLocaleString()}</div><div className="text-xs text-slate-500">Collected</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{rejectedClaims}</div><div className="text-xs text-slate-500">Rejected</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['pending', 'submitted', 'reconciled', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'pending' ? '📝 Pending' : t === 'submitted' ? '📤 Submitted' : t === 'reconciled' ? '✅ Reconciled' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        <Input placeholder="Search by patient name or MRN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        {filteredClaims.map(c => {
          const statusCfg = STATUS_CONFIG[c.status]!;
          const isExpanded = selectedClaim === c.id;
          return (
            <Card key={c.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''} ${c.status === 'rejected' ? 'border-l-4 border-red-400' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedClaim(isExpanded ? null : c.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{c.patientName}</h3>
                    <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                    <Badge tone={c.providerType === 'NHIS' ? 'blue' : c.providerType === 'private' ? 'navy' : 'gold'}>{c.providerType}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>📋 {c.claimReference ?? c.id}</span>
                    <span>🏭 {c.providerName}</span>
                    <span>📅 {c.dateOfService}</span>
                    <span className="font-bold text-green-600">GH₵ {c.totalAmount.toLocaleString()}</span>
                    <span className="text-blue-600">Covered: GH₵ {c.nhisCovered.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Diagnosis: {c.diagnosis.join(', ')}</div>
                  {c.rejectionReason && <div className="mt-1 text-xs text-red-600 font-bold">❌ {c.rejectionReason}</div>}
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-600">📋 Claim Items</h4>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b text-left text-slate-500">
                      <th className="p-1">Procedure</th><th className="p-1">Code</th><th className="p-1">Qty</th><th className="p-1">Unit Price</th><th className="p-1">Total</th>
                    </tr></thead>
                    <tbody>
                      {c.procedures.map((p, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-1 font-medium">{p.name}</td><td className="p-1 text-slate-400">{p.code}</td>
                          <td className="p-1">{p.quantity}</td><td className="p-1">GH₵ {p.unitPrice}</td>
                          <td className="p-1 font-bold">GH₵ {p.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between text-xs font-bold border-t pt-2">
                    <span>Total: GH₵ {c.totalAmount.toLocaleString()}</span>
                    <span className="text-blue-600">NHIS Cover: GH₵ {c.nhisCovered.toLocaleString()}</span>
                    <span className="text-amber-600">Patient Pay: GH₵ {c.patientPortion.toLocaleString()}</span>
                  </div>
                  {c.submittedDate && <div className="text-[10px] text-slate-400">Submitted: {c.submittedDate}</div>}
                  {c.approvedDate && <div className="text-[10px] text-green-600">Approved: {c.approvedDate}</div>}
                  {c.paidDate && <div className="text-[10px] text-green-600">Paid: {c.paidDate}</div>}
                  <div className="flex gap-2">
                    {c.status === 'draft' && <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📤 Submit Claim</Button>}
                    {c.status === 'rejected' && <Button className="bg-amber-600 hover:bg-amber-700 text-xs">🔄 Resubmit</Button>}
                    <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print Claim</Button>
                    <Button className="bg-slate-100 text-slate-700 text-xs">📄 Generate Invoice</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
