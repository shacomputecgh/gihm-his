import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface CancerCase {
  id: string; patientName: string; age: number; gender: string;
  cancerType: string; site: string; stage: string; grade: string;
  diagnosisDate: string; status: 'Active Treatment' | 'Surveillance' | 'Palliative' | 'Deceased';
  treatment: string;
}

const CANCER_CASES: CancerCase[] = [
  { id: 'CR-001', patientName: 'Akua Mensah', age: 52, gender: 'F', cancerType: 'Breast Cancer', site: 'Left Breast', stage: 'IIA', grade: 'Grade 2', diagnosisDate: '2026-03-15', status: 'Active Treatment', treatment: 'AC-T + Surgery + RT' },
  { id: 'CR-002', patientName: 'Kwame Asante', age: 65, gender: 'M', cancerType: 'Prostate Cancer', site: 'Prostate', stage: 'IIB', grade: 'Gleason 7', diagnosisDate: '2026-01-10', status: 'Active Treatment', treatment: 'Androgen Deprivation + RT' },
  { id: 'CR-003', patientName: 'Efua Nyarko', age: 45, gender: 'F', cancerType: 'Cervical Cancer', site: 'Cervix', stage: 'IB2', grade: 'Squamous Cell', diagnosisDate: '2025-11-20', status: 'Surveillance', treatment: 'Radical Hysterectomy + Chemo' },
  { id: 'CR-004', patientName: 'Nana Osei', age: 58, gender: 'M', cancerType: 'Colorectal Cancer', site: 'Sigmoid Colon', stage: 'IIIA', grade: 'Adenocarcinoma', diagnosisDate: '2026-05-01', status: 'Active Treatment', treatment: 'FOLFOX + Surgery' },
  { id: 'CR-005', patientName: 'Ama Boateng', age: 72, gender: 'F', cancerType: 'Lung Cancer', site: 'Left Lower Lobe', stage: 'IV', grade: 'Adenocarcinoma', diagnosisDate: '2026-02-15', status: 'Palliative', treatment: 'Pembrolizumab + Pemetrexed' },
];

const STATUS_COLORS: Record<string, string> = { 'Active Treatment': 'bg-blue-100 text-blue-800', Surveillance: 'bg-green-100 text-green-800', Palliative: 'bg-yellow-100 text-yellow-800', Deceased: 'bg-gray-100 text-gray-800' };

export default function CancerRegistry() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Cancer Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Cancer Registry</h1><p className="text-gray-500">Cancer incidence tracking, staging, treatment protocols, and outcome monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Cases', value: CANCER_CASES.length, color: 'text-blue-600' }, { label: 'Active Treatment', value: CANCER_CASES.filter(c => c.status === 'Active Treatment').length, color: 'text-green-600' }, { label: 'Surveillance', value: CANCER_CASES.filter(c => c.status === 'Surveillance').length, color: 'text-purple-600' }, { label: 'Palliative', value: CANCER_CASES.filter(c => c.status === 'Palliative').length, color: 'text-yellow-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {CANCER_CASES.map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{c.id}</span><span className="font-bold">{c.patientName}</span><span className="text-sm text-gray-500">{c.age}/{c.gender}</span></div><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div><span className="text-gray-500">Type:</span> <span className="font-medium text-red-600">{c.cancerType}</span></div>
              <div><span className="text-gray-500">Site:</span> {c.site}</div>
              <div><span className="text-gray-500">Stage:</span> <span className="font-bold">{c.stage}</span></div>
              <div><span className="text-gray-500">Grade:</span> {c.grade}</div>
              <div><span className="text-gray-500">Diagnosed:</span> {c.diagnosisDate}</div>
            </div>
            <div className="text-sm mt-2"><span className="text-gray-500">Treatment:</span> <span className="font-medium text-blue-600">{c.treatment}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
