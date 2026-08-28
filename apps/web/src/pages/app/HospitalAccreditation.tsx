import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface Standard {
  id: string;
  standardNumber: string;
  title: string;
  category: string;
  description: string;
  requirements: string[];
  complianceScore: number;
  status: 'Compliant' | 'Partial' | 'Non-Compliant' | 'Not Assessed';
  lastAssessed: string;
  assessor: string;
  evidence: string[];
  findings: string[];
  correctiveActions: string[];
}

const STANDARDS: Standard[] = [
  {
    id: 'STD-001', standardNumber: 'COPH Accreditation Standard 1.1',
    title: 'Patient Rights and Responsibilities', category: 'Patient Rights',
    description: 'The hospital respects the rights of every patient and ensures informed consent is obtained for all procedures.',
    requirements: ['Written patient rights policy', 'Patient rights posted in all areas', 'Informed consent process documented', 'Patient grievance mechanism', 'Interpreter services available'],
    complianceScore: 95, status: 'Compliant', lastAssessed: '2026-07-15', assessor: 'Dr. Kwame Asante',
    evidence: ['Patient rights booklet', 'Consent forms in use', 'Grievance log maintained'],
    findings: ['Minor gaps in consent documentation for emergency procedures'],
    correctiveActions: ['Update emergency consent protocol by Sep 2026']
  },
  {
    id: 'STD-002', standardNumber: 'COPH Accreditation Standard 2.1',
    title: 'Infection Prevention and Control', category: 'Infection Control',
    description: 'Comprehensive infection prevention and control program to minimize healthcare-associated infections.',
    requirements: ['IPC committee active', 'Hand hygiene compliance >85%', 'Antibiotic stewardship program', 'Surgical site infection surveillance', 'Isolation protocols'],
    complianceScore: 82, status: 'Partial', lastAssessed: '2026-07-20', assessor: 'Sr. Abena Osei',
    evidence: ['IPC committee minutes', 'Hand hygiene audit reports', 'SSI surveillance data'],
    findings: ['Hand hygiene compliance at 82% (target: 85%)', 'Missing isolation protocol updates'],
    correctiveActions: ['Intensify hand hygiene campaign', 'Update isolation protocols by Aug 2026']
  },
  {
    id: 'STD-003', standardNumber: 'COPH Accreditation Standard 3.1',
    title: 'Medication Management', category: 'Pharmacy',
    description: 'Safe medication management processes including storage, dispensing, and administration.',
    requirements: ['Drug formulary maintained', 'Medication reconciliation process', 'High-alert medication protocols', 'Controlled substance tracking', 'Drug interaction checking'],
    complianceScore: 90, status: 'Compliant', lastAssessed: '2026-07-10', assessor: 'Pharm. Kofi Adjei',
    evidence: ['Formulary document', 'Medication reconciliation forms', 'Controlled substance log'],
    findings: ['Formulary needs annual update', 'Minor gaps in reconciliation documentation'],
    correctiveActions: ['Complete formulary update by Q4 2026']
  },
  {
    id: 'STD-004', standardNumber: 'COPH Accreditation Standard 4.1',
    title: 'Surgical Safety', category: 'Surgery',
    description: 'Implementation of WHO Surgical Safety Checklist and surgical site marking protocols.',
    requirements: ['WHO checklist compliance >95%', 'Surgical site marking', 'Surgical site infection surveillance', 'Anaesthesia safety protocols', 'Equipment maintenance'],
    complianceScore: 88, status: 'Compliant', lastAssessed: '2026-07-25', assessor: 'Dr. Kwame Asante',
    evidence: ['WHO checklist completion records', 'SSI surveillance data', 'Anaesthesia logs'],
    findings: ['WHO checklist compliance at 88% (target: 95%)', 'Some incomplete sign-out phases'],
    correctiveActions: ['Re-train surgical teams on WHO checklist', 'Implement real-time audit tool']
  },
  {
    id: 'STD-005', standardNumber: 'COPH Accreditation Standard 5.1',
    title: 'Laboratory Services', category: 'Laboratory',
    description: 'Quality laboratory services with proper specimen handling and result turnaround.',
    requirements: ['QC program active', 'Proficiency testing enrolled', 'Specimen identification protocol', 'Result turnaround targets', 'Equipment calibration records'],
    complianceScore: 92, status: 'Compliant', lastAssessed: '2026-07-18', assessor: 'Lab. Nana Agyeman',
    evidence: ['QC logs', 'Proficiency test results', 'Equipment calibration certificates'],
    findings: ['Turnaround time for haematology slightly over target', 'Equipment calibration overdue for 2 analyzers'],
    correctiveActions: ['Review haematology workflow', 'Schedule overdue calibrations']
  },
  {
    id: 'STD-006', standardNumber: 'COPH Accreditation Standard 6.1',
    title: 'Emergency Preparedness', category: 'Emergency',
    description: 'Hospital emergency preparedness including disaster planning and code team activation.',
    requirements: ['Emergency plan documented', 'Regular drills conducted', 'Code team trained', 'Evacuation routes marked', 'Emergency supplies maintained'],
    complianceScore: 75, status: 'Partial', lastAssessed: '2026-07-22', assessor: 'Dr. Yaw Boateng',
    evidence: ['Emergency plan document', 'Drill records', 'Training logs'],
    findings: ['Last full-scale drill was >6 months ago', 'Some evacuation routes partially blocked'],
    correctiveActions: ['Schedule full-scale drill by Sep 2026', 'Clear blocked evacuation routes']
  },
  {
    id: 'STD-007', standardNumber: 'COPH Accreditation Standard 7.1',
    title: 'Human Resources Management', category: 'HR',
    description: 'Adequate staffing, credentialing, and continuing education for all healthcare workers.',
    requirements: ['Credentialing system active', 'Staffing ratios met', 'CE requirements tracked', 'Orientation program', 'Performance evaluations'],
    complianceScore: 85, status: 'Partial', lastAssessed: '2026-07-28', assessor: 'HR Director',
    evidence: ['Credentialing database', 'Staffing schedules', 'CE records'],
    findings: ['1 expired medical license', 'Nurse-to-patient ratio slightly below target in ICU'],
    correctiveActions: ['License renewal follow-up', 'Recruit 2 additional ICU nurses']
  },
  {
    id: 'STD-008', standardNumber: 'COPH Accreditation Standard 8.1',
    title: 'Quality Improvement', category: 'Quality',
    description: 'Systematic quality improvement program with data-driven decision making.',
    requirements: ['QI committee active', 'Quality indicators monitored', 'Clinical audit program', 'Patient satisfaction surveys', 'Incident reporting system'],
    complianceScore: 90, status: 'Compliant', lastAssessed: '2026-07-30', assessor: 'Quality Director',
    evidence: ['QI committee minutes', 'Quality dashboard', 'Incident reports'],
    findings: ['Patient satisfaction surveys need wider distribution'],
    correctiveActions: ['Expand survey distribution to all departments']
  },
  {
    id: 'STD-009', standardNumber: 'COPH Accreditation Standard 9.1',
    title: 'Health Information Management', category: 'Health Records',
    description: 'Proper patient records management, data security, and health information exchange.',
    requirements: ['Electronic health records', 'Data backup system', 'Patient privacy protocols', 'Health information exchange', 'Record retention policy'],
    complianceScore: 78, status: 'Partial', lastAssessed: '2026-08-01', assessor: 'HIM Director',
    evidence: ['EHR system logs', 'Backup verification', 'Privacy policy'],
    findings: ['Backup verification needs improvement', 'HIE connectivity with regional hospitals pending'],
    correctiveActions: ['Implement automated backup verification', 'Complete HIE integration by Q4 2026']
  },
  {
    id: 'STD-010', standardNumber: 'COPH Accreditation Standard 10.1',
    title: 'Facility Management and Safety', category: 'Facilities',
    description: 'Safe and well-maintained hospital facilities with proper utility management.',
    requirements: ['Preventive maintenance program', 'Fire safety systems', 'Utility monitoring', 'Waste management', 'Environmental services'],
    complianceScore: 80, status: 'Partial', lastAssessed: '2026-08-05', assessor: 'Facilities Manager',
    evidence: ['Maintenance logs', 'Fire safety certificates', 'Waste disposal records'],
    findings: ['Generator maintenance overdue', 'Some fire extinguishers expired'],
    correctiveActions: ['Schedule generator maintenance', 'Replace expired extinguishers']
  }
];

const STATUS_STYLES: Record<string, string> = {
  Compliant: 'bg-green-100 text-green-800',
  Partial: 'bg-yellow-100 text-yellow-800',
  'Non-Compliant': 'bg-red-100 text-red-800',
  'Not Assessed': 'bg-gray-100 text-gray-800',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Patient Rights': '📋', 'Infection Control': '🛡️', 'Pharmacy': '💊', 'Surgery': '🔪',
  'Laboratory': '🔬', 'Emergency': '🚨', 'HR': '👥', 'Quality': '⭐',
  'Health Records': '📁', 'Facilities': '🏢',
};

export default function HospitalAccreditation() {
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(STANDARDS[0] ?? null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const categories = [...new Set(STANDARDS.map(s => s.category))];
  const filtered = STANDARDS.filter(s => {
    const matchCat = filterCategory === 'All' || s.category === filterCategory;
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchCat && matchStatus;
  });

  const overallScore = Math.round(STANDARDS.reduce((sum, s) => sum + s.complianceScore, 0) / STANDARDS.length);
  const compliantCount = STANDARDS.filter(s => s.status === 'Compliant').length;
  const partialCount = STANDARDS.filter(s => s.status === 'Partial').length;
  const nonCompliantCount = STANDARDS.filter(s => s.status === 'Non-Compliant').length;

  const categoryScores = categories.map(cat => ({
    category: cat,
    score: Math.round(STANDARDS.filter(s => s.category === cat).reduce((sum, s) => sum + s.complianceScore, 0) / STANDARDS.filter(s => s.category === cat).length),
    icon: CATEGORY_ICONS[cat] || '📋',
  })).sort((a, b) => a.score - b.score);

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
          title="Add New Accreditation Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hospital Accreditation Tracker</h1>
          <p className="text-gray-500">COPH accreditation standards compliance and quality improvement tracking</p>
        </div>
        <Button variant="outline">📥 Export Accreditation Report</Button>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">Overall Accreditation Score</div>
            <div className="text-5xl font-black mt-1">{overallScore}%</div>
            <div className="text-sm mt-2 opacity-80">
              {compliantCount} Compliant | {partialCount} Partial | {nonCompliantCount} Non-Compliant
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Standards Assessed</div>
            <div className="text-3xl font-bold">{STANDARDS.length}</div>
            <Badge className={`mt-2 text-xs ${
              overallScore >= 90 ? 'bg-green-500' : overallScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {overallScore >= 90 ? 'ACCREDITATION READY' : overallScore >= 75 ? 'IMPROVEMENT NEEDED' : 'ACTION REQUIRED'}
            </Badge>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-4 overflow-hidden">
          <div className="h-full rounded-full bg-white flex items-center px-3"
            style={{ width: `${overallScore}%` }}>
            <span className="text-xs font-bold text-blue-600">{overallScore}%</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-bold mb-3">📊 Category Scores</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categoryScores.map((cat, i) => (
            <div key={i} className={`border rounded-lg p-3 text-center ${
              cat.score >= 90 ? 'border-green-200 bg-green-50' :
              cat.score >= 75 ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-lg font-bold">{cat.score}%</div>
              <div className="text-xs text-gray-500">{cat.category}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(std => (
            <div key={std.id} onClick={() => setSelectedStandard(std)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selectedStandard?.id === std.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[std.category]}</span>
                    <span className="font-bold text-sm">{std.standardNumber}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[std.status]}`}>{std.status}</Badge>
                  </div>
                  <div className="font-semibold mt-1">{std.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{std.description}</div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${
                    std.complianceScore >= 90 ? 'text-green-600' :
                    std.complianceScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{std.complianceScore}%</div>
                  <div className="text-xs text-gray-400">Last: {std.lastAssessed}</div>
                </div>
              </div>
              <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${
                  std.complianceScore >= 90 ? 'bg-green-500' :
                  std.complianceScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ width: `${std.complianceScore}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedStandard && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_ICONS[selectedStandard.category]}</span>
                  <Badge className={`text-xs ${STATUS_STYLES[selectedStandard.status]}`}>{selectedStandard.status}</Badge>
                </div>
                <h2 className="font-bold text-lg mt-2">{selectedStandard.title}</h2>
                <p className="text-xs text-gray-400">{selectedStandard.standardNumber}</p>
              </div>

              <div className="text-center">
                <div className={`text-4xl font-black ${
                  selectedStandard.complianceScore >= 90 ? 'text-green-600' :
                  selectedStandard.complianceScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>{selectedStandard.complianceScore}%</div>
                <div className="text-xs text-gray-500">Compliance Score</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Requirements</div>
                {selectedStandard.requirements.map((req, i) => (
                  <div key={i} className="text-xs flex items-start gap-1 mb-1">
                    <span className={selectedStandard.complianceScore >= 85 ? 'text-green-500' : 'text-yellow-500'}>
                      {selectedStandard.complianceScore >= 85 ? '✓' : '○'}
                    </span> {req}
                  </div>
                ))}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Evidence</div>
                {selectedStandard.evidence.map((e, i) => (
                  <div key={i} className="text-xs flex items-center gap-1 mb-1">
                    <span className="text-blue-500">📎</span> {e}
                  </div>
                ))}
              </div>

              {selectedStandard.findings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-700 mb-1">Findings</div>
                  {selectedStandard.findings.map((f, i) => (
                    <div key={i} className="text-xs text-yellow-600 mb-1">⚠️ {f}</div>
                  ))}
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Corrective Actions</div>
                {selectedStandard.correctiveActions.map((a, i) => (
                  <div key={i} className="text-xs flex items-center gap-1 mb-1 bg-red-50 rounded px-2 py-1">
                    <span className="text-red-500">🎯</span> {a}
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-400">
                Assessed by: {selectedStandard.assessor} on {selectedStandard.lastAssessed}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Update Assessment</Button>
                <Button size="sm" variant="outline" className="flex-1">Add Evidence</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
