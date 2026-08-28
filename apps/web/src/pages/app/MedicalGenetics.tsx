import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface GeneticsPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; testType: string; result: string;
  familyHistory: string[]; riskLevel: string;
  status: 'Pre-Test' | 'Awaiting Results' | 'Counselled' | 'Ongoing';
  counsellor: string; followUp: string; notes: string;
}

const PATIENTS: GeneticsPatient[] = [
  { id: 'GEN-001', name: 'Kwame Mensah', age: 35, gender: 'Male', mrn: 'MRN-2026-1120',
    condition: 'Family History — Sickle Cell Disease', testType: 'Haemoglobin Electrophoresis + Genetic Panel',
    result: 'HbAS — Sickle Cell Trait Carrier',
    familyHistory: ['Mother — HbAS', 'Father — HbAS', 'Sibling — HbSS (affected)', 'Child — HbAS'],
    riskLevel: 'Moderate', status: 'Counselled',
    counsellor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (6 months)',
    notes: 'Carrier status confirmed. Genetic counselling provided regarding offspring risks. Partner tested — HbAA (normal). Offspring: 50% HbAS, 50% HbAA.'
  },
  { id: 'GEN-002', name: 'Akua Boateng', age: 42, gender: 'Female', mrn: 'MRN-2026-1122',
    condition: 'BRCA1/2 Testing — Breast Cancer Family History', testType: 'BRCA1/2 Gene Sequencing',
    result: 'BRCA1 Pathogenic Variant c.5266dupC (p.Gln1756ProfsTer74)',
    familyHistory: ['Mother — Breast cancer age 45', 'Maternal aunt — Ovarian cancer age 52', 'Maternal grandmother — Breast cancer age 60'],
    riskLevel: 'Very High', status: 'Counselled',
    counsellor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (2 weeks)',
    notes: 'BRCA1 positive — lifetime breast cancer risk 72%, ovarian cancer risk 44%. Discussing prophylactic mastectomy and oophorectomy. Enhanced surveillance initiated.'
  },
  { id: 'GEN-003', name: 'Efua Nyarko', age: 28, gender: 'Female', mrn: 'MRN-2026-1124',
    condition: 'Prenatal Genetic Screening', testType: 'NIPT (Non-Invasive Prenatal Testing)',
    result: 'Low risk — Trisomy 21, 18, 13 all negative',
    familyHistory: ['No significant family history'],
    riskLevel: 'Low', status: 'Counselled',
    counsellor: 'Dr. Priscilla Wiafe', followUp: '2026-09-14 (3 weeks)',
    notes: 'NIPT negative for common trisomies. GA 14 weeks. Normal USS. Couple relieved. Routine antenatal care continuing.'
  },
  { id: 'GEN-004', name: 'Nana Kuffour', age: 50, gender: 'Male', mrn: 'MRN-2026-1126',
    condition: 'Familial Hypercholesterolaemia', testType: 'LDLR Gene Panel',
    result: 'LDLR Pathogenic Variant — Familial Hypercholesterolaemia confirmed',
    familyHistory: ['Father — MI age 42', 'Brother — MI age 45', 'Paternal uncle — MI age 50'],
    riskLevel: 'Very High', status: 'Ongoing',
    counsellor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Heterozygous FH. Total cholesterol 12.5. On high-intensity statin. Cascade screening recommended for first-degree relatives.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Pre-Test': 'bg-blue-100 text-blue-800', 'Awaiting Results': 'bg-yellow-100 text-yellow-800',
  'Counselled': 'bg-green-100 text-green-800', 'Ongoing': 'bg-purple-100 text-purple-800',
};

export default function MedicalGenetics() {
  const [selected, setSelected] = useState<GeneticsPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Genetics Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Medical Genetics</h1><p className="text-gray-500">Genetic counselling, hereditary conditions, prenatal screening, and cascade testing</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Very High Risk', value: PATIENTS.filter(p=>p.riskLevel==='Very High').length, color: 'text-red-600' },
          { label: 'Counselled', value: PATIENTS.filter(p=>p.status==='Counselled').length, color: 'text-green-600' },
          { label: 'Pathogenic', value: PATIENTS.filter(p=>p.result.includes('Pathogenic')).length, color: 'text-orange-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge><Badge className={`text-[10px] ${p.riskLevel==='Very High'?'bg-red-100 text-red-800':p.riskLevel==='Moderate'?'bg-yellow-100 text-yellow-800':'bg-green-100 text-green-800'}`}>{p.riskLevel} Risk</Badge></div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.testType}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3"><div className="text-sm font-medium text-purple-700 mb-1">Genetic Test Result</div><div className="text-sm text-purple-600 font-semibold">{selected.result}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Family History</div>{selected.familyHistory.map((f,i)=><div key={i} className="text-xs bg-orange-50 rounded px-2 py-1 mb-1">👨‍👩‍👧 {f}</div>)}</div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
