import { useState } from 'react';
import { Badge } from '../../components/ui';

// ─── Types ──────────────────────────────────────────────
type LabSection = 'dashboard' | 'requests' | 'samples' | 'hematology' | 'chemistry' | 'microbiology' | 'parasitology' | 'serology' | 'bloodbank' | 'histopathology' | 'results' | 'qc' | 'equipment' | 'billing' | 'statistics';

interface LabRequest {
  id: string; patientName: string; mrn: string; doctor: string; department: string;
  tests: string[]; status: 'Pending Payment' | 'Sample Collection' | 'In Progress' | 'Verification' | 'Completed' | 'Critical';
  dateOrdered: string; priority: 'Routine' | 'Urgent' | 'STAT';
  section: string;
}

interface Sample { id: string; requestId: string; type: string; barcode: string; status: 'Collected' | 'In Transit' | 'Received' | 'Processing' | 'Completed'; collectedBy: string; dateCollected: string; section: string; }

// ─── Sample Data ────────────────────────────────────────
const REQUESTS: LabRequest[] = [
  { id: 'LR-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', doctor: 'Dr. Sarah Johnson', department: 'Emergency', tests: ['FBC', 'Blood Glucose', 'Malaria Test'], status: 'In Progress', dateOrdered: '2026-08-23 08:00', priority: 'STAT', section: 'Hematology' },
  { id: 'LR-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', doctor: 'Dr. James Mensah', department: 'Medical Ward A', tests: ['LFTs', 'RFTs', 'Electrolytes', 'Lipid Profile'], status: 'Verification', dateOrdered: '2026-08-23 07:30', priority: 'Urgent', section: 'Chemistry' },
  { id: 'LR-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', doctor: 'Dr. Ama Darko', department: 'Surgical Ward', tests: ['Blood Culture', 'Wound Swab C&S', 'Urine Culture'], status: 'In Progress', dateOrdered: '2026-08-22 16:00', priority: 'Urgent', section: 'Microbiology' },
  { id: 'LR-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', doctor: 'Dr. Kofi Appiah', department: 'OPD', tests: ['HIV Test', 'Hepatitis B', 'VDRL'], status: 'Completed', dateOrdered: '2026-08-22 10:00', priority: 'Routine', section: 'Serology' },
  { id: 'LR-005', patientName: 'Yaw Boateng', mrn: 'MRN-2024-0678', doctor: 'Dr. Sarah Johnson', department: 'ICU', tests: ['Blood Grouping', 'Crossmatch', 'PT/INR'], status: 'Critical', dateOrdered: '2026-08-23 09:00', priority: 'STAT', section: 'Blood Bank' },
  { id: 'LR-006', patientName: 'Ama Serwaa', mrn: 'MRN-2024-0812', doctor: 'Dr. James Mensah', department: 'Maternity', tests: ['FBC', 'Blood Grouping', 'Urinalysis', 'HIV Test'], status: 'Sample Collection', dateOrdered: '2026-08-23 06:30', priority: 'Routine', section: 'Hematology' },
  { id: 'LR-007', patientName: 'Kofi Mensah', mrn: 'MRN-2024-0901', doctor: 'Dr. Ama Darko', department: 'OPD', tests: ['Stool O&P', 'Stool Culture'], status: 'In Progress', dateOrdered: '2026-08-23 08:30', priority: 'Routine', section: 'Parasitology' },
  { id: 'LR-008', patientName: 'Esi Darko', mrn: 'MRN-2024-0876', doctor: 'Dr. Kofi Appiah', department: 'Surgical Ward', tests: ['Biopsy - Breast', 'HPV Test', 'Pap Smear'], status: 'Pending Payment', dateOrdered: '2026-08-23 10:00', priority: 'Urgent', section: 'Histopathology' },
];

const SAMPLES: Sample[] = [
  { id: 'SP-001', requestId: 'LR-001', type: 'Blood (EDTA)', barcode: 'LAB-B-2026-001', status: 'Processing', collectedBy: 'Phlebotomist Akua', dateCollected: '2026-08-23 08:15', section: 'Hematology' },
  { id: 'SP-002', requestId: 'LR-002', type: 'Blood (Serum)', barcode: 'LAB-S-2026-001', status: 'Completed', collectedBy: 'Phlebotomist Akua', dateCollected: '2026-08-23 07:45', section: 'Chemistry' },
  { id: 'SP-003', requestId: 'LR-003', type: 'Wound Swab', barcode: 'LAB-W-2026-001', status: 'In Transit', collectedBy: 'Nurse Kofi', dateCollected: '2026-08-22 16:30', section: 'Microbiology' },
  { id: 'SP-004', requestId: 'LR-004', type: 'Blood (Serum)', barcode: 'LAB-S-2026-002', status: 'Completed', collectedBy: 'Phlebotomist Esi', dateCollected: '2026-08-22 10:30', section: 'Serology' },
  { id: 'SP-005', requestId: 'LR-005', type: 'Blood (EDTA + Citrate)', barcode: 'LAB-B-2026-002', status: 'Processing', collectedBy: 'Phlebotomist Akua', dateCollected: '2026-08-23 09:10', section: 'Blood Bank' },
];

const SECTIONS = [
  { key: 'dashboard', label: '📊 Dashboard', count: REQUESTS.length },
  { key: 'requests', label: '📋 Test Requests', count: REQUESTS.filter((r) => r.status !== 'Completed').length },
  { key: 'samples', label: '🧪 Sample Tracking', count: SAMPLES.filter((s) => s.status !== 'Completed').length },
  { key: 'hematology', label: '🩸 Hematology', count: 0 },
  { key: 'chemistry', label: '⚗️ Clinical Chemistry', count: 0 },
  { key: 'microbiology', label: '🦠 Microbiology', count: 0 },
  { key: 'parasitology', label: '🔬 Parasitology', count: 0 },
  { key: 'serology', label: '🧬 Serology/Immunology', count: 0 },
  { key: 'bloodbank', label: '🩸 Blood Bank', count: 0 },
  { key: 'histopathology', label: '🔎 Histopathology', count: 0 },
  { key: 'results', label: '📄 Results & Reporting', count: REQUESTS.filter((r) => r.status === 'Verification' || r.status === 'Critical').length },
  { key: 'qc', label: '✅ Quality Control', count: 0 },
  { key: 'equipment', label: '🔧 Equipment', count: 0 },
  { key: 'billing', label: '💰 Lab Billing', count: 0 },
  { key: 'statistics', label: '📈 Statistics', count: 0 },
];

const STATUS_COLORS: Record<string, string> = {
  'Pending Payment': 'bg-yellow-100 text-yellow-800', 'Sample Collection': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-indigo-100 text-indigo-800', Verification: 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800', Critical: 'bg-red-100 text-red-800',
  Collected: 'bg-blue-100 text-blue-800', 'In Transit': 'bg-orange-100 text-orange-800',
  Received: 'bg-indigo-100 text-indigo-800', Processing: 'bg-purple-100 text-purple-800',
};

// ─── Hematology Tests Data ──────────────────────────────
const HEMATOLOGY_TESTS = [
  { name: 'Full Blood Count (FBC/CBC)', sample: 'EDTA Blood', turnaround: '1 hour', price: 50 },
  { name: 'Haemoglobin', sample: 'EDTA Blood', turnaround: '30 min', price: 20 },
  { name: 'Blood Grouping & Rh', sample: 'EDTA Blood', turnaround: '30 min', price: 25 },
  { name: 'ESR', sample: 'EDTA Blood', turnaround: '1 hour', price: 15 },
  { name: 'Sickling Test', sample: 'EDTA Blood', turnaround: '1 hour', price: 20 },
  { name: 'PT/INR', sample: 'Citrate Blood', turnaround: '2 hours', price: 40 },
  { name: 'APTT', sample: 'Citrate Blood', turnaround: '2 hours', price: 40 },
  { name: 'Malaria Parasite (RDT)', sample: 'Blood', turnaround: '15 min', price: 15 },
  { name: 'Malaria Parasite (Microscopy)', sample: 'Blood', turnaround: '1 hour', price: 30 },
  { name: 'Reticulocyte Count', sample: 'EDTA Blood', turnaround: '2 hours', price: 35 },
  { name: 'Peripheral Blood Film', sample: 'EDTA Blood', turnaround: '2 hours', price: 30 },
  { name: 'Platelet Count', sample: 'EDTA Blood', turnaround: '30 min', price: 20 },
];

const CHEMISTRY_TESTS = [
  { name: 'Fasting Blood Glucose', sample: 'Serum', turnaround: '30 min', price: 15 },
  { name: 'Random Blood Glucose', sample: 'Serum/Whole Blood', turnaround: '15 min', price: 10 },
  { name: 'HbA1c', sample: 'EDTA Blood', turnaround: '2 hours', price: 80 },
  { name: 'Urea', sample: 'Serum', turnaround: '1 hour', price: 15 },
  { name: 'Creatinine', sample: 'Serum', turnaround: '1 hour', price: 15 },
  { name: 'Sodium (Na+)', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Potassium (K+)', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Chloride (Cl-)', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Total Protein', sample: 'Serum', turnaround: '1 hour', price: 15 },
  { name: 'Albumin', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Bilirubin (Total & Direct)', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'AST (SGOT)', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'ALT (SGPT)', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'ALP', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'GGT', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'Total Cholesterol', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Triglycerides', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'LDL Cholesterol', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'HDL Cholesterol', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'Uric Acid', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Calcium', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'Magnesium', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'Phosphate', sample: 'Serum', turnaround: '1 hour', price: 20 },
  { name: 'LDH', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'Amylase', sample: 'Serum', turnaround: '1 hour', price: 30 },
  { name: 'Lipase', sample: 'Serum', turnaround: '1 hour', price: 35 },
  { name: 'CK (Creatine Kinase)', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'Troponin I', sample: 'Serum', turnaround: '30 min', price: 80 },
  { name: 'BNP/NT-proBNP', sample: 'Serum', turnaround: '1 hour', price: 120 },
  { name: 'CRP', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'HbA1c (Repeat)', sample: 'EDTA Blood', turnaround: '2 hours', price: 80 },
];

const MICRO_TESTS = [
  { name: 'Urine Culture & Sensitivity', sample: 'Urine', turnaround: '48-72 hours', price: 60 },
  { name: 'Blood Culture', sample: 'Blood (aerobic + anaerobic)', turnaround: '5-7 days', price: 120 },
  { name: 'Stool Culture', sample: 'Stool', turnaround: '48 hours', price: 50 },
  { name: 'Wound Swab C&S', sample: 'Swab', turnaround: '48 hours', price: 50 },
  { name: 'Sputum AFB', sample: 'Sputum', turnaround: '24 hours', price: 40 },
  { name: 'Sputum Culture', sample: 'Sputum', turnaround: '48 hours', price: 50 },
  { name: 'Urine AFB', sample: 'Urine', turnaround: '24 hours', price: 40 },
  { name: 'CSF Analysis', sample: 'CSF', turnaround: '2 hours', price: 80 },
  { name: 'Gram Stain', sample: 'Various', turnaround: '1 hour', price: 20 },
  { name: 'AFB Smear', sample: 'Sputum/Urine', turnaround: '2 hours', price: 20 },
  { name: 'Fungal Culture', sample: 'Various', turnaround: '7-14 days', price: 80 },
];

const SEROLOGY_TESTS = [
  { name: 'HIV 1&2 Rapid', sample: 'Blood', turnaround: '20 min', price: 20 },
  { name: 'HIV 1&2 ELISA', sample: 'Serum', turnaround: '4 hours', price: 40 },
  { name: 'Hepatitis B Surface Antigen', sample: 'Serum', turnaround: '4 hours', price: 30 },
  { name: 'Hepatitis B Core Antibody', sample: 'Serum', turnaround: '4 hours', price: 35 },
  { name: 'Hepatitis C Antibody', sample: 'Serum', turnaround: '4 hours', price: 40 },
  { name: 'VDRL', sample: 'Serum', turnaround: '1 hour', price: 25 },
  { name: 'TPHA', sample: 'Serum', turnaround: '2 hours', price: 40 },
  { name: 'Typhoid IgG/IgM', sample: 'Serum', turnaround: '2 hours', price: 30 },
  { name: 'Pregnancy Test (β-hCG)', sample: 'Urine/Serum', turnaround: '15 min', price: 10 },
  { name: 'ANA (Antinuclear Antibody)', sample: 'Serum', turnaround: '24 hours', price: 60 },
  { name: 'ASO Titre', sample: 'Serum', turnaround: '24 hours', price: 40 },
  { name: 'RF (Rheumatoid Factor)', sample: 'Serum', turnaround: '4 hours', price: 35 },
  { name: 'Anti-dsDNA', sample: 'Serum', turnaround: '24 hours', price: 80 },
  { name: 'Dengue NS1 Antigen', sample: 'Serum', turnaround: '2 hours', price: 60 },
];

// ─── Dashboard Component ────────────────────────────────
function LabDashboard() {
  const today = REQUESTS.length;
  const pending = REQUESTS.filter((r) => r.status === 'Pending Payment' || r.status === 'Sample Collection').length;
  const inProgress = REQUESTS.filter((r) => r.status === 'In Progress').length;
  const verification = REQUESTS.filter((r) => r.status === 'Verification').length;
  const critical = REQUESTS.filter((r) => r.status === 'Critical').length;
  const completed = REQUESTS.filter((r) => r.status === 'Completed').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Today's Requests", value: today, color: 'text-slate-700' },
          { label: 'Pending', value: pending, color: 'text-yellow-600' },
          { label: 'In Progress', value: inProgress, color: 'text-indigo-600' },
          { label: 'Verification', value: verification, color: 'text-purple-600' },
          { label: 'Critical', value: critical, color: 'text-red-600' },
          { label: 'Completed', value: completed, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3">Lab Workflow</h3>
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-2">
          {['Doctor Orders Test', 'Patient Payment/Insurance', 'Sample Collection', 'Barcode Generated', 'Sample to Lab Section', 'Test Performed', 'Result Entered', 'Verification', 'Critical Alert?', 'Doctor Reviews', 'Report Generated'].map((step, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center min-w-[100px]">
                <div className="font-medium text-blue-800">{step}</div>
              </div>
              {i < 10 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SECTIONS.slice(3, 12).map((s) => (
          <div key={s.key} className="bg-white rounded-lg border p-3 hover:shadow-md transition cursor-pointer">
            <div className="text-sm font-semibold">{s.label}</div>
            <div className="text-xs text-slate-500 mt-1">Click to view section</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Test Catalog Component ─────────────────────────────
function TestCatalog({ title, tests }: { title: string; tests: { name: string; sample: string; turnaround: string; price: number }[] }) {
  const [search, setSearch] = useState('');
  const filtered = tests.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = tests.reduce((s, t) => s + t.price, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title} ({filtered.length} tests)</h3>
        <div className="flex gap-3 items-center">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests..." className="border rounded-lg px-3 py-1.5 text-sm w-64" />
          <span className="text-xs text-slate-500">Total: GH₵ {totalRevenue.toLocaleString()}</span>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Test Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Sample Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Turnaround</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Price (GH₵)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-medium">{t.name}</td>
                <td className="px-4 py-2 text-sm text-slate-600">{t.sample}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{t.turnaround}</td>
                <td className="px-4 py-2 text-sm text-right font-bold text-green-700">GH₵ {t.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function LaboratoryInfoSystem() {
  const [activeSection, setActiveSection] = useState<LabSection>('dashboard');
  const [requestFilter, setRequestFilter] = useState('');
  const [showNewRequest, setShowNewRequest] = useState(false);

  const filteredRequests = REQUESTS.filter((r) => !requestFilter || r.status === requestFilter);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <LabDashboard />;
      case 'requests': return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Laboratory Test Requests</h3>
            <button onClick={() => setShowNewRequest(!showNewRequest)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">{showNewRequest ? '✕ Cancel' : '+ New Request'}</button>
          </div>
          {showNewRequest && (
            <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
              <h4 className="font-bold text-green-800">New Laboratory Request</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Kwame Asante" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">MRN *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="MRN-2024-XXXX" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Requesting Doctor *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Dr. Name" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm"><option>OPD</option><option>Emergency</option><option>Medical Ward</option><option>Surgical Ward</option><option>ICU</option><option>Maternity</option><option>Paediatric</option></select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Priority *</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Routine</option><option>Urgent</option><option>STAT</option></select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Lab Section *</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Hematology</option><option>Clinical Chemistry</option><option>Microbiology</option><option>Parasitology</option><option>Serology/Immunology</option><option>Blood Bank</option><option>Histopathology</option></select></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tests Required *</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="e.g. FBC, Blood Glucose, Malaria Test (comma separated)" /></div>
              <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Submit Request</button><button onClick={() => setShowNewRequest(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {['', 'Pending Payment', 'Sample Collection', 'In Progress', 'Verification', 'Completed', 'Critical'].map((f) => (
              <button key={f} onClick={() => setRequestFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${requestFilter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f || 'All'}</button>
            ))}
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Patient</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Tests</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Section</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs font-mono text-slate-500">{r.id}</td>
                    <td className="px-4 py-2"><div className="text-sm font-medium">{r.patientName}</div><div className="text-[10px] text-slate-400">{r.mrn} · {r.department}</div></td>
                    <td className="px-4 py-2 text-xs text-slate-600 max-w-[200px]">{r.tests.join(', ')}</td>
                    <td className="px-4 py-2 text-xs">{r.section}</td>
                    <td className="px-4 py-2"><Badge className={r.priority === 'STAT' ? 'bg-red-100 text-red-800' : r.priority === 'Urgent' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}>{r.priority}</Badge></td>
                    <td className="px-4 py-2"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                    <td className="px-4 py-2"><div className="flex gap-1">
                      {r.status === 'Pending Payment' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded">Pay</button>}
                      {r.status === 'Sample Collection' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">Collect</button>}
                      {r.status === 'In Progress' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded">Result</button>}
                      {r.status === 'Verification' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">Verify</button>}
                      {r.status === 'Critical' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded font-bold">Alert</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'samples': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Specimen Tracking</h3>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Sample ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Request</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Barcode</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Section</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Collected By</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {SAMPLES.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs font-mono">{s.id}</td>
                    <td className="px-4 py-2 text-xs">{s.requestId}</td>
                    <td className="px-4 py-2 text-sm">{s.type}</td>
                    <td className="px-4 py-2"><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{s.barcode}</code></td>
                    <td className="px-4 py-2 text-xs">{s.section}</td>
                    <td className="px-4 py-2"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                    <td className="px-4 py-2 text-xs text-slate-500">{s.collectedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'hematology': return <TestCatalog title="Hematology Tests" tests={HEMATOLOGY_TESTS} />;
      case 'chemistry': return <TestCatalog title="Clinical Chemistry / Biochemistry Tests" tests={CHEMISTRY_TESTS} />;
      case 'microbiology': return <TestCatalog title="Microbiology Tests" tests={MICRO_TESTS} />;
      case 'parasitology': return <TestCatalog title="Parasitology Tests" tests={[{ name: 'Malaria Parasite (Thick Film)', sample: 'Blood', turnaround: '1 hour', price: 25 }, { name: 'Malaria Parasite (Thin Film)', sample: 'Blood', turnaround: '1 hour', price: 30 }, { name: 'Malaria RDT', sample: 'Blood', turnaround: '15 min', price: 15 }, { name: 'Stool Ova & Parasites', sample: 'Stool', turnaround: '1 hour', price: 30 }, { name: 'Stool for Microsporidium', sample: 'Stool', turnaround: '24 hours', price: 40 }, { name: 'Schistosomiasis Test', sample: 'Stool/Urine', turnaround: '1 hour', price: 25 }]} />;
      case 'serology': return <TestCatalog title="Serology / Immunology Tests" tests={SEROLOGY_TESTS} />;
      case 'bloodbank': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Blood Bank / Transfusion Services</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ type: 'O+', units: 45 }, { type: 'O-', units: 12 }, { type: 'A+', units: 32 }, { type: 'A-', units: 8 }, { type: 'B+', units: 28 }, { type: 'B-', units: 6 }, { type: 'AB+', units: 15 }, { type: 'AB-', units: 3 }].map((b) => (
              <div key={b.type} className="bg-white rounded-lg border p-3 text-center">
                <div className="text-lg font-bold text-red-600">{b.type}</div>
                <div className={`text-2xl font-bold ${b.units < 5 ? 'text-red-600' : b.units < 10 ? 'text-yellow-600' : 'text-green-600'}`}>{b.units}</div>
                <div className="text-[10px] text-slate-500">units available</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">Blood Bank Services</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {['Blood Grouping', 'Crossmatching', 'Blood Screening (HIV, HBV, HCV, Syphilis)', 'Blood Storage (-20°C, 4°C)', 'Blood Issue for Transfusion', 'Donor Records', 'Coombs Test (Direct & Indirect)', 'Antibody Screening', 'Phenotyping'].map((s) => (
                <div key={s} className="bg-red-50 rounded p-2 text-red-800">• {s}</div>
              ))}
            </div>
          </div>
        </div>
      );
      case 'histopathology': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Histopathology / Cytology</h3>
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">Services Available</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {['Tissue Biopsy Examination', 'Fine Needle Aspiration (FNA)', 'Pap Smear / Cervical Cytology', 'Bone Marrow Biopsy', 'Immunohistochemistry (IHC)', 'Special Stains', 'Frozen Section', 'Cytology - Body Fluids', 'HPV Testing'].map((s) => (
                <div key={s} className="bg-purple-50 rounded p-2 text-purple-800">• {s}</div>
              ))}
            </div>
          </div>
        </div>
      );
      case 'results': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Results & Reporting</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ <strong>{REQUESTS.filter((r) => r.status === 'Critical').length} critical result(s)</strong> awaiting immediate doctor notification
          </div>
          <div className="space-y-2">
            {REQUESTS.filter((r) => r.status === 'Verification' || r.status === 'Critical').map((r) => (
              <div key={r.id} className={`bg-white rounded-lg border p-4 ${r.status === 'Critical' ? 'border-l-4 border-l-red-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div><span className="font-mono text-xs text-slate-400">{r.id}</span> · <span className="font-semibold">{r.patientName}</span> · {r.tests.join(', ')}</div>
                  <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => {}} className="text-xs px-3 py-1 bg-green-600 text-white rounded">Approve & Release</button>
                  <button onClick={() => {}} className="text-xs px-3 py-1 bg-blue-600 text-white rounded">Print Report</button>
                  {r.status === 'Critical' && <button onClick={() => {}} className="text-xs px-3 py-1 bg-red-600 text-white rounded font-bold">📞 Notify Doctor Now</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'qc': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Laboratory Quality Control</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">✓</div><div className="text-xs text-slate-500">Internal QC Pass</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">✓</div><div className="text-xs text-slate-500">External QC Pass</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">12</div><div className="text-xs text-slate-500">Controls Run Today</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">0</div><div className="text-xs text-slate-500">Out of Range</div></div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">QC Activities</h4>
            <div className="text-xs space-y-1">
              {['Daily internal QC with commercial control materials', 'Levey-Jennings charts for all analyzers', 'Westgard rules violation tracking', 'External Quality Assessment (EQA) participation', 'Proficiency testing (PT) for all sections', 'Equipment calibration verification', 'Reagent lot tracking and expiry management', 'Temperature monitoring (fridges, incubators, water baths)', 'Sample acceptance/rejection criteria', 'Pre-analytical error tracking'].map((item) => (
                <div key={item} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded">✅ {item}</div>
              ))}
            </div>
          </div>
        </div>
      );
      case 'equipment': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Laboratory Equipment Management</h3>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Equipment</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Section</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Model</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Last Maintenance</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Automated Hematology Analyzer', section: 'Hematology', model: 'Sysmex XN-1000', last: '2026-08-01', status: 'Operational' },
                  { name: 'Chemistry Analyzer', section: 'Chemistry', model: 'Roche Cobas c311', last: '2026-08-05', status: 'Operational' },
                  { name: 'Coagulometer', section: 'Hematology', model: 'Sysmex CS-2000i', last: '2026-07-28', status: 'Operational' },
                  { name: 'Blood Gas Analyzer', section: 'Chemistry', model: 'Radiometer ABL90', last: '2026-08-10', status: 'Operational' },
                  { name: 'Automated Microbiology System', section: 'Microbiology', model: 'BD Phoenix M50', last: '2026-07-20', status: 'Under Maintenance' },
                  { name: 'Microscope (Binocular)', section: 'Hematology', model: 'Olympus CX23', last: '2026-08-15', status: 'Operational' },
                  { name: 'Centrifuge', section: 'General', model: 'Eppendorf 5810R', last: '2026-08-12', status: 'Operational' },
                  { name: 'ELISA Reader', section: 'Serology', model: 'Thermo Multiskan', last: '2026-08-08', status: 'Operational' },
                ].map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm font-medium">{e.name}</td>
                    <td className="px-4 py-2 text-xs">{e.section}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{e.model}</td>
                    <td className="px-4 py-2 text-xs">{e.last}</td>
                    <td className="px-4 py-2"><Badge className={e.status === 'Operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{e.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'billing': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Laboratory Billing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">GH₵ 4,250</div><div className="text-xs text-slate-500">Today's Revenue</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">GH₵ 3,800</div><div className="text-xs text-slate-500">Paid</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">GH₵ 450</div><div className="text-xs text-slate-500">Pending</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{REQUESTS.length}</div><div className="text-xs text-slate-500">Billed Tests</div></div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">Supported Payment Methods</h4>
            <div className="flex gap-2 text-xs">
              {['Cash', 'NHIS', 'Insurance (Enterprise)', 'Insurance (SIC)', 'Insurance (Vital)', 'Mobile Money', 'Credit/Debit Card', 'Bank Transfer'].map((m) => (
                <span key={m} className="bg-slate-100 rounded-full px-3 py-1">{m}</span>
              ))}
            </div>
          </div>
        </div>
      );
      case 'statistics': return (
        <div className="space-y-4">
          <h3 className="font-semibold">Laboratory Statistics & Reporting</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">156</div><div className="text-xs text-slate-500">Tests Today</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">89%</div><div className="text-xs text-slate-500">TAT Compliance</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">0.2%</div><div className="text-xs text-slate-500">Error Rate</div></div>
            <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-purple-600">GH₵ 12,500</div><div className="text-xs text-slate-500">Weekly Revenue</div></div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">Key Reports</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {['Daily Test Volume', 'Turnaround Time (TAT) Report', 'Rejection Rate', 'Critical Value Report', 'QC Summary', 'Equipment Utilisation', 'Revenue by Section', 'Top 10 Tests', 'Specimen Rejection Analysis', 'Antibiotic Sensitivity Pattern', 'Blood Utilisation Report', 'EQA Performance'].map((r) => (
                <button onClick={() => {}} key={r} className="bg-slate-50 hover:bg-slate-100 rounded p-2 text-left transition">{r}</button>
              ))}
            </div>
          </div>
        </div>
      );
      default: return <LabDashboard />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">🏥 Laboratory Information System</h1><p className="text-gray-500">Complete LIS — requests, samples, testing, results, QC, equipment, billing</p></div>
        <div className="flex items-center gap-2 text-xs text-slate-400"><span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />LIS Online</div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {SECTIONS.map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as LabSection)}
            className={`shrink-0 px-3 py-2 text-xs font-medium rounded-t-lg transition ${activeSection === s.key ? 'bg-white border border-b-0 border-slate-200 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            {s.label} {s.count > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5">{s.count}</span>}
          </button>
        ))}
      </div>

      {renderSection()}
    </div>
  );
}
