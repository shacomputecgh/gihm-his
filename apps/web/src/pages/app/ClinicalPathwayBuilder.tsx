import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, useToast } from '../../components/ui';

type PathwayStatus = 'active' | 'draft' | 'archived';
type StepType = 'assessment' | 'intervention' | 'medication' | 'lab' | 'imaging' | 'consultation' | 'education' | 'discharge';

interface ClinicalPathway {
  id: string;
  name: string;
  description: string;
  diagnosis: string;
  category: string;
  status: PathwayStatus;
  version: string;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  steps: PathwayStep[];
  avgLengthOfStay: number;
  compliance: number;
}

interface PathwayStep {
  id: string;
  day: number;
  type: StepType;
  title: string;
  description: string;
  required: boolean;
  department: string;
}

const STEP_TYPE_CONFIG: Record<StepType, { label: string; icon: string; color: string }> = {
  assessment: { label: 'Assessment', icon: '🩺', color: 'text-blue-600' },
  intervention: { label: 'Intervention', icon: '💉', color: 'text-purple-600' },
  medication: { label: 'Medication', icon: '💊', color: 'text-emerald-600' },
  lab: { label: 'Laboratory', icon: '🔬', color: 'text-cyan-600' },
  imaging: { label: 'Imaging', icon: '📷', color: 'text-indigo-600' },
  consultation: { label: 'Consultation', icon: '👨‍⚕️', color: 'text-amber-600' },
  education: { label: 'Education', icon: '📚', color: 'text-pink-600' },
  discharge: { label: 'Discharge', icon: '✅', color: 'text-green-600' }
};

const MOCK_PATHWAYS: ClinicalPathway[] = [
  {
    id: 'CP001', name: 'Appendectomy Pathway', description: 'Standard pathway for uncomplicated appendectomy',
    diagnosis: 'Acute Appendicitis', category: 'Surgery', status: 'active', version: '2.1',
    createdBy: 'Dr. Osei', createdDate: '2023-06-15', lastUpdated: '2024-01-10',
    avgLengthOfStay: 3, compliance: 87,
    steps: [
      { id: 'S1', day: 0, type: 'assessment', title: 'Initial Assessment', description: 'History, physical examination, consent', required: true, department: 'Emergency' },
      { id: 'S2', day: 0, type: 'lab', title: 'Pre-op Labs', description: 'FBC, U&E, Group & Save, Urinalysis', required: true, department: 'Laboratory' },
      { id: 'S3', day: 0, type: 'imaging', title: 'CT Abdomen', description: 'CT with contrast if diagnosis uncertain', required: false, department: 'Radiology' },
      { id: 'S4', day: 0, type: 'medication', title: 'IV Antibiotics', description: 'Cefuroxime 1.5g IV + Metronidazole 500mg IV', required: true, department: 'Pharmacy' },
      { id: 'S5', day: 0, type: 'intervention', title: 'Appendectomy', description: 'Laparoscopic or open appendectomy', required: true, department: 'Theatre' },
      { id: 'S6', day: 1, type: 'assessment', title: 'Post-op Assessment', description: 'Vital signs, pain assessment, wound check', required: true, department: 'Surgical Ward' },
      { id: 'S7', day: 1, type: 'medication', title: 'Pain Management', description: 'Paracetamol 1g QID + Tramadol 50mg TID PRN', required: true, department: 'Pharmacy' },
      { id: 'S8', day: 2, type: 'education', title: 'Patient Education', description: 'Wound care, activity restrictions, follow-up', required: true, department: 'Nursing' },
      { id: 'S9', day: 2, type: 'discharge', title: 'Discharge Planning', description: 'Prescriptions, follow-up appointment, return precautions', required: true, department: 'Surgical Ward' }
    ]
  },
  {
    id: 'CP002', name: 'Diabetic Ketoacidosis', description: 'Emergency management of DKA',
    diagnosis: 'Diabetic Ketoacidosis', category: 'Emergency', status: 'active', version: '3.0',
    createdBy: 'Dr. Asante', createdDate: '2023-03-20', lastUpdated: '2024-01-05',
    avgLengthOfStay: 5, compliance: 92,
    steps: [
      { id: 'S1', day: 0, type: 'assessment', title: 'Initial Assessment', description: 'GCS, vitals, dehydration assessment', required: true, department: 'Emergency' },
      { id: 'S2', day: 0, type: 'lab', title: 'Emergency Labs', description: 'BMP, blood gas, ketones, FBC, cultures', required: true, department: 'Laboratory' },
      { id: 'S3', day: 0, type: 'intervention', title: 'IV Fluids', description: 'Normal saline 1L bolus then 250mL/hr', required: true, department: 'Emergency' },
      { id: 'S4', day: 0, type: 'medication', title: 'Insulin Infusion', description: 'Insulin 0.1 units/kg/hr IV', required: true, department: 'Emergency' },
      { id: 'S5', day: 0, type: 'medication', title: 'Potassium Replacement', description: 'KCl 20-40mEq/L based on levels', required: true, department: 'Emergency' },
      { id: 'S6', day: 1, type: 'lab', title: 'Repeat Labs Q4H', description: 'BMP, blood gas every 4 hours', required: true, department: 'Laboratory' },
      { id: 'S7', day: 1, type: 'assessment', title: 'Hourly Monitoring', description: 'Vitals, fluid balance, neurological status', required: true, department: 'ICU' },
      { id: 'S8', day: 2, type: 'medication', title: 'Subcutaneous Insulin', description: 'Transition to SC insulin when eating', required: true, department: 'Pharmacy' },
      { id: 'S9', day: 3, type: 'education', title: 'Diabetes Education', description: 'Insulin injection technique, sick day rules', required: true, department: 'Nursing' },
      { id: 'S10', day: 4, type: 'discharge', title: 'Discharge', description: 'Follow-up, insulin supplies, diet plan', required: true, department: 'Endocrine' }
    ]
  },
  {
    id: 'CP003', name: 'Pneumonia Management', description: 'Community-acquired pneumonia pathway',
    diagnosis: 'Community-Acquired Pneumonia', category: 'Medical', status: 'active', version: '1.8',
    createdBy: 'Dr. Osei', createdDate: '2023-09-10', lastUpdated: '2024-01-12',
    avgLengthOfStay: 5, compliance: 85,
    steps: [
      { id: 'S1', day: 0, type: 'assessment', title: 'CURB-65 Score', description: 'Severity assessment and disposition', required: true, department: 'Emergency' },
      { id: 'S2', day: 0, type: 'lab', title: 'Investigations', description: 'FBC, CRP, blood cultures, sputum culture', required: true, department: 'Laboratory' },
      { id: 'S3', day: 0, type: 'imaging', title: 'Chest X-Ray', description: 'PA and lateral chest radiograph', required: true, department: 'Radiology' },
      { id: 'S4', day: 0, type: 'medication', title: 'Empirical Antibiotics', description: 'Amoxicillin 1g TID + Clarithromycin 500mg BD', required: true, department: 'Pharmacy' },
      { id: 'S5', day: 1, type: 'assessment', title: 'Daily Review', description: 'Clinical response, oxygen saturation', required: true, department: 'Medical Ward' },
      { id: 'S6', day: 2, type: 'lab', title: 'Repeat CRP', description: 'Check CRP trend for response', required: false, department: 'Laboratory' },
      { id: 'S7', day: 3, type: 'medication', title: 'IV to Oral Switch', description: 'Switch to oral antibiotics if improving', required: true, department: 'Pharmacy' },
      { id: 'S8', day: 4, type: 'education', title: 'Patient Education', description: 'Smoking cessation, pneumococcal vaccine', required: true, department: 'Nursing' },
      { id: 'S9', day: 5, type: 'discharge', title: 'Discharge', description: 'Follow-up CXR in 6 weeks', required: true, department: 'Medical Ward' }
    ]
  },
  {
    id: 'CP004', name: 'Caesarean Section', description: 'Elective and emergency caesarean section pathway',
    diagnosis: 'Caesarean Section', category: 'Obstetrics', status: 'draft', version: '1.0',
    createdBy: 'Dr. Agyeman', createdDate: '2024-01-01', lastUpdated: '2024-01-15',
    avgLengthOfStay: 4, compliance: 0,
    steps: [
      { id: 'S1', day: 0, type: 'assessment', title: 'Pre-op Assessment', description: 'Consent, birth plan review', required: true, department: 'ANC' },
      { id: 'S2', day: 0, type: 'intervention', title: 'Caesarean Section', description: 'Spinal anaesthesia, surgery', required: true, department: 'Theatre' },
      { id: 'S3', day: 0, type: 'assessment', title: 'Post-op Monitoring', description: 'Vitals Q15min x4, then Q1H', required: true, department: 'Labour Ward' },
      { id: 'S4', day: 1, type: 'medication', title: 'Pain & Antibiotics', description: 'Paracetamol, NSAIDs, antibiotics', required: true, department: 'Pharmacy' },
      { id: 'S5', day: 1, type: 'education', title: 'Baby Care', description: 'Breastfeeding, cord care, immunizations', required: true, department: 'Maternity' },
      { id: 'S6', day: 2, type: 'assessment', title: 'Wound Check', description: 'Inspect wound, check bleeding', required: true, department: 'Maternity' },
      { id: 'S7', day: 3, type: 'discharge', title: 'Discharge', description: 'Follow-up, warning signs, contraception', required: true, department: 'Maternity' }
    ]
  }
];

export default function ClinicalPathwayBuilder() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'pathways' | 'builder' | 'analytics'>('pathways');
  const [selectedPathway, setSelectedPathway] = useState<string | null>(MOCK_PATHWAYS[0]?.id ?? null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const pathway = MOCK_PATHWAYS.find(p => p.id === selectedPathway);

  const stats = {
    total: MOCK_PATHWAYS.length,
    active: MOCK_PATHWAYS.filter(p => p.status === 'active').length,
    avgCompliance: Math.round(MOCK_PATHWAYS.filter(p => p.status === 'active').reduce((sum, p) => sum + p.compliance, 0) / MOCK_PATHWAYS.filter(p => p.status === 'active').length),
    avgLos: Math.round(MOCK_PATHWAYS.filter(p => p.status === 'active').reduce((sum, p) => sum + p.avgLengthOfStay, 0) / MOCK_PATHWAYS.filter(p => p.status === 'active').length)
  };

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
          title="Add New Clinical Pathway"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clinical Pathway Builder</h1>
          <p className="text-gray-500">Design and manage standardized treatment pathways</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Pathway</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Pathways', value: stats.total, color: 'bg-blue-500' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-500' },
          { label: 'Avg Compliance', value: `${stats.avgCompliance}%`, color: 'bg-purple-500' },
          { label: 'Avg LOS (days)', value: stats.avgLos, color: 'bg-amber-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['pathways', 'builder', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'pathways' ? 'Pathways' : tab === 'builder' ? 'Pathway Builder' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Pathways Tab */}
      {activeTab === 'pathways' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Pathway List */}
          <div className="space-y-3">
            {MOCK_PATHWAYS.map(p => (
              <div key={p.id}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedPathway === p.id ? 'ring-2 ring-blue-300 bg-blue-50' : 'hover:shadow-md'}`}
                onClick={() => setSelectedPathway(p.id)}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{p.name}</span>
                  <Badge className={p.status === 'active' ? 'text-emerald-600 bg-emerald-50' : p.status === 'draft' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-100'}>
                    {p.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{p.diagnosis}</p>
                <div className="flex gap-2 mt-2 text-xs text-gray-400">
                  <span>Steps: {p.steps.length}</span>
                  <span>LOS: {p.avgLengthOfStay} days</span>
                  <span>Compliance: {p.compliance}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pathway Detail */}
          <div className="col-span-2">
            {pathway ? (
              <div className="space-y-4">
                <div className="border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{pathway.name}</h3>
                      <p className="text-gray-500">{pathway.description}</p>
                    </div>
                    <Badge className={pathway.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}>
                      v{pathway.version}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{pathway.diagnosis}</span></div>
                    <div><span className="text-gray-500">Category:</span> <span className="font-medium">{pathway.category}</span></div>
                    <div><span className="text-gray-500">Created:</span> <span className="font-medium">{pathway.createdBy}</span></div>
                    <div><span className="text-gray-500">Updated:</span> <span className="font-medium">{pathway.lastUpdated}</span></div>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4">Pathway Steps</h4>
                  <div className="space-y-3">
                    {pathway.steps.map((step, idx) => {
                      const stepConfig = STEP_TYPE_CONFIG[step.type] ?? { label: 'Unknown', icon: '?', color: 'text-gray-600' };
                      return (
                        <div key={step.id}
                          className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedStep === step.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}>
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${stepConfig.color} bg-white border-2 ${
                              selectedStep === step.id ? 'border-blue-500' : 'border-gray-200'
                            }`}>
                              {stepConfig.icon}
                            </div>
                            {idx < pathway.steps.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">Day {step.day}</span>
                              <Badge className={`${stepConfig.color} bg-white border text-xs`}>{stepConfig.label}</Badge>
                              {step.required && <Badge className="text-red-600 bg-red-50 border border-red-200 text-xs">Required</Badge>}
                            </div>
                            <p className="font-medium text-sm mt-1">{step.title}</p>
                            <p className="text-xs text-gray-500">{step.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Department: {step.department}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">Select a pathway to view details</div>
            )}
          </div>
        </div>
      )}

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Build New Pathway</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pathway Name</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="e.g., Hip Replacement Pathway" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Diagnosis / Condition</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="e.g., Hip Fracture" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select className="w-full border rounded-lg px-3 py-2 mt-1">
                  <option>Surgery</option>
                  <option>Medical</option>
                  <option>Emergency</option>
                  <option>Obstetrics</option>
                  <option>Paediatrics</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="Brief description..." />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-bold mb-3">Add Steps</h4>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(STEP_TYPE_CONFIG).map(([type, config]) => (
                  <button onClick={() => {}} key={type} className="p-3 border rounded-xl hover:bg-gray-50 text-left">
                    <span className="text-xl">{config.icon}</span>
                    <p className="text-sm font-medium mt-1">{config.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => {}} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg">Save as Draft</button>
              <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create Pathway</button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Compliance by Pathway</h4>
            <div className="space-y-3">
              {MOCK_PATHWAYS.filter(p => p.status === 'active').map(p => (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{p.name}</span>
                    <span className="font-bold">{p.compliance}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-3 rounded-full ${p.compliance >= 90 ? 'bg-emerald-500' : p.compliance >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${p.compliance}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Average Length of Stay</h4>
            <div className="space-y-3">
              {MOCK_PATHWAYS.filter(p => p.status === 'active').map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-gray-600">{p.name}</span>
                  <span className="font-bold">{p.avgLengthOfStay} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
