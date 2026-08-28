import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface Credential {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  licenseType: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Suspended';
  privileges: string[];
  lastVerified: string;
  verifications: { date: string; by: string; result: string }[];
  continuingEducation: { course: string; date: string; credits: number }[];
}

const CREDENTIALS: Credential[] = [
  {
    id: 'CR-001', staffId: 'DOC-001', staffName: 'Dr. Kwame Asante', role: 'Consultant Surgeon',
    department: 'Surgery', licenseType: 'Medical Practitioner', licenseNumber: 'GMC-2024-1542',
    issuingAuthority: 'Ghana Medical & Dental Council', issueDate: '2024-01-15', expiryDate: '2026-01-15',
    status: 'Active', privileges: ['General Surgery', 'Laparoscopic Surgery', 'Emergency Surgery', 'Surgical Oncology'],
    lastVerified: '2026-03-01',
    verifications: [{ date: '2026-03-01', by: 'Credentialing Committee', result: 'Verified' }, { date: '2025-01-15', by: 'Credentialing Committee', result: 'Verified' }],
    continuingEducation: [{ course: 'Advanced Laparoscopic Techniques', date: '2026-02-10', credits: 25 }, { course: 'Surgical Oncology Update', date: '2025-11-20', credits: 15 }]
  },
  {
    id: 'CR-002', staffId: 'DOC-002', staffName: 'Dr. Akua Mensah', role: 'Consultant Paediatrician',
    department: 'Paediatrics', licenseType: 'Medical Practitioner', licenseNumber: 'GMC-2023-0987',
    issuingAuthority: 'Ghana Medical & Dental Council', issueDate: '2023-06-01', expiryDate: '2026-06-01',
    status: 'Active', privileges: ['General Paediatrics', 'Neonatology', 'Paediatric Emergency', 'Developmental Assessment'],
    lastVerified: '2026-02-15',
    verifications: [{ date: '2026-02-15', by: 'Medical Director', result: 'Verified' }],
    continuingEducation: [{ course: 'Neonatal Resuscitation Program', date: '2026-01-20', credits: 10 }, { course: 'Paediatric Cardiology Update', date: '2025-09-15', credits: 20 }]
  },
  {
    id: 'CR-003', staffId: 'NUR-001', staffName: 'Sr. Abena Osei', role: 'Senior Nurse — ICU',
    department: 'ICU', licenseType: 'Nursing License', licenseNumber: 'NMC-2024-3321',
    issuingAuthority: 'Nursing & Midwifery Council of Ghana', issueDate: '2024-03-01', expiryDate: '2026-09-30',
    status: 'Active', privileges: ['Critical Care Nursing', 'Ventilator Management', 'Vascular Access', 'Triage'],
    lastVerified: '2026-06-01',
    verifications: [{ date: '2026-06-01', by: 'Nursing Director', result: 'Verified' }],
    continuingEducation: [{ course: 'Critical Care Nursing Certification', date: '2026-04-10', credits: 40 }, { course: 'ACLS Provider', date: '2025-12-15', credits: 16 }]
  },
  {
    id: 'CR-004', staffId: 'PH-001', staffName: 'Pharm. Kofi Adjei', role: 'Chief Pharmacist',
    department: 'Pharmacy', licenseType: 'Pharmacy License', licenseNumber: 'PCG-2024-0543',
    issuingAuthority: 'Pharmacy Council of Ghana', issueDate: '2024-02-15', expiryDate: '2026-02-15',
    status: 'Expiring Soon', privileges: ['Drug Dispensing', 'Clinical Pharmacy', 'Formulary Management', 'Controlled Substances', 'Pharmacovigilance'],
    lastVerified: '2026-01-01',
    verifications: [{ date: '2026-01-01', by: 'Credentialing Committee', result: 'Verified' }],
    continuingEducation: [{ course: 'Clinical Pharmacokinetics', date: '2025-10-20', credits: 30 }, { course: 'Pharmacovigilance Training', date: '2026-03-05', credits: 8 }]
  },
  {
    id: 'CR-005', staffId: 'DOC-003', staffName: 'Dr. Yaw Boateng', role: 'Medical Officer',
    department: 'Emergency', licenseType: 'Medical Practitioner', licenseNumber: 'GMC-2025-2100',
    issuingAuthority: 'Ghana Medical & Dental Council', issueDate: '2025-01-10', expiryDate: '2026-07-10',
    status: 'Expiring Soon', privileges: ['Emergency Medicine', 'Trauma Management', 'Basic Surgical Procedures', 'ICU Management'],
    lastVerified: '2025-12-01',
    verifications: [{ date: '2025-12-01', by: 'ER Director', result: 'Verified' }],
    continuingEducation: [{ course: 'ATLS Provider', date: '2026-05-15', credits: 20 }]
  },
  {
    id: 'CR-006', staffId: 'RAD-001', staffName: 'Dr. Esi Darko', role: 'Radiologist',
    department: 'Radiology', licenseType: 'Medical Practitioner', licenseNumber: 'GMC-2022-0789',
    issuingAuthority: 'Ghana Medical & Dental Council', issueDate: '2022-09-01', expiryDate: '2025-09-01',
    status: 'Expired', privileges: ['Diagnostic Radiology', 'Interventional Radiology', 'Ultrasound', 'CT/MRI Reporting'],
    lastVerified: '2025-06-01',
    verifications: [{ date: '2025-06-01', by: 'Medical Director', result: 'Expired — Renewal Required' }],
    continuingEducation: [{ course: 'Interventional Radiology Workshop', date: '2025-03-20', credits: 25 }]
  },
  {
    id: 'CR-007', staffId: 'LAB-001', staffName: 'Lab. Nana Agyeman', role: 'Laboratory Scientist',
    department: 'Laboratory', licenseType: 'Medical Laboratory License', licenseNumber: 'MLSC-2024-1210',
    issuingAuthority: 'Medical Laboratory Science Council', issueDate: '2024-05-01', expiryDate: '2026-05-01',
    status: 'Active', privileges: ['Haematology', 'Clinical Chemistry', 'Microbiology', 'Blood Banking'],
    lastVerified: '2026-04-01',
    verifications: [{ date: '2026-04-01', by: 'Lab Director', result: 'Verified' }],
    continuingEducation: [{ course: 'Molecular Diagnostics Training', date: '2026-02-15', credits: 20 }]
  },
  {
    id: 'CR-008', staffId: 'DOC-004', staffName: 'Dr. Priscilla Wiafe', role: 'Consultant Psychiatrist',
    department: 'Psychiatry', licenseType: 'Medical Practitioner', licenseNumber: 'GMC-2024-1650',
    issuingAuthority: 'Ghana Medical & Dental Council', issueDate: '2024-04-15', expiryDate: '2026-04-15',
    status: 'Active', privileges: ['General Psychiatry', 'Child Psychiatry', 'Addiction Medicine', 'Psychotherapy'],
    lastVerified: '2026-03-15',
    verifications: [{ date: '2026-03-15', by: 'Medical Director', result: 'Verified' }],
    continuingEducation: [{ course: 'Addiction Psychiatry Fellowship', date: '2026-01-10', credits: 35 }]
  }
];

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  'Expiring Soon': 'bg-yellow-100 text-yellow-800',
  Expired: 'bg-red-100 text-red-800',
  Suspended: 'bg-gray-100 text-gray-800',
};

function daysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function StaffCredentialing() {
  const [selectedStaff, setSelectedStaff] = useState<Credential | null>(CREDENTIALS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');

  const departments = [...new Set(CREDENTIALS.map(c => c.department))];
  const filtered = CREDENTIALS.filter(c => {
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchDept = filterDepartment === 'All' || c.department === filterDepartment;
    return matchStatus && matchDept;
  });

  const expiringCount = CREDENTIALS.filter(c => c.status === 'Expiring Soon').length;
  const expiredCount = CREDENTIALS.filter(c => c.status === 'Expired').length;

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
          title="Add New Lab"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "testType", "label": "Test Type", "type": "select", "options": ["Blood Test", "Urine Test", "Stool Test", "X-Ray", "Ultrasound", "ECG", "Biopsy"]}, {"name": "priority", "label": "Priority", "type": "select", "options": ["Routine", "Urgent", "STAT"]}, {"name": "clinicalHistory", "label": "Clinical History", "type": "textarea", "placeholder": "Relevant clinical information"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Staff Credentialing</h1>
        <p className="text-gray-500">License verification, certifications, privileging, and continuing education tracking</p>
      </div>

      {/* Alerts */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {expiredCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-red-600 text-xl">🚨</span>
              <div>
                <div className="font-semibold text-red-800">{expiredCount} Expired License{expiredCount > 1 ? 's' : ''}</div>
                <div className="text-sm text-red-600">These staff members cannot practice until renewed</div>
              </div>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-800">{expiringCount} Expiring Soon</div>
                <div className="text-sm text-yellow-600">License renewal required within 30 days</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Staff', value: CREDENTIALS.length, color: 'text-blue-600' },
          { label: 'Active', value: CREDENTIALS.filter(c => c.status === 'Active').length, color: 'text-green-600' },
          { label: 'Expiring Soon', value: expiringCount, color: 'text-yellow-600' },
          { label: 'Expired', value: expiredCount, color: 'text-red-600' },
          { label: 'Total CE Credits', value: CREDENTIALS.reduce((sum, c) => sum + c.continuingEducation.reduce((s, e) => s + e.credits, 0), 0), color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(cred => {
            const daysLeft = daysUntilExpiry(cred.expiryDate);
            return (
              <div key={cred.id} onClick={() => setSelectedStaff(cred)}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                  selectedStaff?.id === cred.id ? 'border-blue-500 shadow-md' : ''
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{cred.staffName}</span>
                      <Badge className={`text-[10px] ${STATUS_STYLES[cred.status]}`}>{cred.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">{cred.role} — {cred.department}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {cred.licenseType}: {cred.licenseNumber} | {cred.issuingAuthority}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
                    </div>
                    <div className="text-xs text-gray-400">Exp: {cred.expiryDate}</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {cred.privileges.slice(0, 4).map(p => <Badge key={p} className="text-[10px] bg-blue-50 text-blue-700">{p}</Badge>)}
                  {cred.privileges.length > 4 && <Badge className="text-[10px] bg-gray-100">+{cred.privileges.length - 4}</Badge>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedStaff ? (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selectedStaff.staffName}</h2>
                <p className="text-sm text-gray-500">{selectedStaff.role} — {selectedStaff.department}</p>
                <p className="text-xs text-gray-400">Staff ID: {selectedStaff.staffId}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="text-sm"><span className="text-gray-500">License:</span> {selectedStaff.licenseType}</div>
                <div className="text-sm"><span className="text-gray-500">Number:</span> {selectedStaff.licenseNumber}</div>
                <div className="text-sm"><span className="text-gray-500">Authority:</span> {selectedStaff.issuingAuthority}</div>
                <div className="text-sm"><span className="text-gray-500">Issue:</span> {selectedStaff.issueDate}</div>
                <div className="text-sm"><span className="text-gray-500">Expiry:</span> {selectedStaff.expiryDate}</div>
                <div className="text-sm"><span className="text-gray-500">Last Verified:</span> {selectedStaff.lastVerified}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Clinical Privileges</div>
                {selectedStaff.privileges.map((p, i) => (
                  <div key={i} className="text-sm flex items-center gap-1">
                    <span className="text-green-500">✓</span> {p}
                  </div>
                ))}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Verification History</div>
                {selectedStaff.verifications.map((v, i) => (
                  <div key={i} className="text-xs border-l-2 border-blue-200 pl-2 mb-2">
                    <div>{v.date} — {v.by}</div>
                    <div className={`font-medium ${v.result.includes('Expired') ? 'text-red-600' : 'text-green-600'}`}>{v.result}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Continuing Education</div>
                {selectedStaff.continuingEducation.map((ce, i) => (
                  <div key={i} className="text-xs bg-purple-50 rounded p-2 mb-1">
                    <div className="font-medium text-purple-800">{ce.course}</div>
                    <div className="text-purple-600">{ce.date} — {ce.credits} CPD credits</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Renew License</Button>
                <Button size="sm" variant="outline" className="flex-1">Send Reminder</Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 bg-white border rounded-xl">Select a staff member</div>
          )}
        </div>
      </div>
    </div>
  );
}
