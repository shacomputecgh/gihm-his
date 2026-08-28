import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PathSpecimen {
  id: string; patientName: string; age: number; gender: string; mrn: string;
  specimenType: string; site: string; procedure: string;
  diagnosis: string; tumourType: string; grade: string; stage: string;
  margins: string; lymphNodes: string; specialStains: string;
  status: 'Received' | 'Processing' | 'Preliminary' | 'Final Report';
  pathologist: string; reportDate: string; notes: string;
}

const SPECIMENS: PathSpecimen[] = [
  { id: 'PATH-001', patientName: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1180',
    specimenType: 'Excision Biopsy', site: 'Right Breast', procedure: 'Wide Local Excision',
    diagnosis: 'Invasive Ductal Carcinoma', tumourType: 'IDC — No Special Type', grade: 'Grade 2 (Modified Bloom-Richardson)',
    stage: 'pT2 N1a Mx (AJCC 8th Ed)', margins: 'Clear — 8mm closest margin (Ink negative)',
    lymphNodes: '2/12 positive for metastatic carcinoma. Largest deposit 4mm.', specialStains: 'ER: Positive (Allred 8/8)\nPR: Positive (Allred 6/8)\nHER2: Negative (1+)\nKi-67: 25%',
    status: 'Final Report', pathologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24',
    notes: 'Luminal B breast cancer. Recommend adjuvant chemotherapy + endocrine therapy. MDT discussion recommended.'
  },
  { id: 'PATH-002', patientName: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1182',
    specimenType: 'Colonoscopy Biopsy', site: 'Sigmoid Colon', procedure: 'Endoscopic Mucosal Resection',
    diagnosis: 'Tubular Adenoma with Low-Grade Dysplasia', tumourType: 'Tubular Adenoma', grade: 'Low-grade dysplasia',
    stage: 'N/A — Benign', margins: 'Complete excision', lymphNodes: 'N/A',
    specialStains: 'No high-grade dysplasia or invasion identified.', status: 'Final Report',
    pathologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24',
    notes: 'Tubular adenoma — 12mm. Complete excision. Surveillance colonoscopy in 3 years recommended.'
  },
  { id: 'PATH-003', patientName: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1184',
    specimenType: 'CT-Guided Core Biopsy', site: 'Right Upper Lobe Lung', procedure: 'Core Needle Biopsy',
    diagnosis: 'Non-Small Cell Lung Carcinoma', tumourType: 'Adenocarcinoma', grade: 'Grade 2',
    stage: 'Biopsy only — staging pending', margins: 'N/A — core biopsy',
    lymphNodes: 'N/A', specialStains: 'TTF-1: Positive\nNapsin A: Positive\nPD-L1: 60% (TPS)\nALK: Negative\nEGFR: Testing pending',
    status: 'Final Report', pathologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24',
    notes: 'Lung adenocarcinoma — PD-L1 60%. Consider immunotherapy (Pembrolizumab) as first-line if no driver mutations.'
  },
  { id: 'PATH-004', patientName: 'Efua Nyarko', age: 45, gender: 'Female', mrn: 'MRN-2026-1186',
    specimenType: 'Fine Needle Aspiration', site: 'Right Thyroid Nodule', procedure: 'FNAC',
    diagnosis: 'Bethesda Category VI — Malignant', tumourType: 'Papillary Thyroid Carcinoma', grade: 'N/A',
    stage: 'N/A — cytology only', margins: 'N/A', lymphNodes: 'N/A',
    specialStains: 'Nuclear grooves, inclusions, and Orphan Annie eye nuclei confirmed.',
    status: 'Final Report', pathologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24',
    notes: 'Bethesda VI — Papillary thyroid carcinoma. Total thyroidectomy recommended. Referral to endocrine surgery.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Received': 'bg-blue-100 text-blue-800', 'Processing': 'bg-yellow-100 text-yellow-800',
  'Preliminary': 'bg-orange-100 text-orange-800', 'Final Report': 'bg-green-100 text-green-800',
};

export default function PathologyLab() {
  const [selected, setSelected] = useState<PathSpecimen | null>(SPECIMENS[0] ?? null);
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
          title="Add New Pathology Record"
          fields={[{"name":"specimenType","label":"Specimen Type","type":"select","options":["Blood","Urine","Stool","Sputum","CSF","Tissue","Swab","Other"],"required":true},{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"diagnosis","label":"Clinical Diagnosis","type":"text"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Pathology Laboratory</h1><p className="text-gray-500">Histopathology, cytology, tissue diagnosis, and specimen tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Specimens Today', value: SPECIMENS.length, color: 'text-blue-600' },
          { label: 'Final Reports', value: SPECIMENS.filter(s=>s.status==='Final Report').length, color: 'text-green-600' },
          { label: 'Malignant', value: SPECIMENS.filter(s=>s.diagnosis.toLowerCase().includes('carcinoma')||s.diagnosis.toLowerCase().includes('malignant')).length, color: 'text-red-600' },
          { label: 'Benign', value: SPECIMENS.filter(s=>s.stage.includes('Benign')||s.diagnosis.toLowerCase().includes('adenoma')).length, color: 'text-gray-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {SPECIMENS.map(sp => (
            <div key={sp.id} onClick={() => setSelected(sp)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===sp.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{sp.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[sp.status]}`}>{sp.status}</Badge></div>
                  <div className="text-sm text-gray-500">{sp.diagnosis}</div>
                  <div className="text-xs text-gray-400 mt-1">{sp.specimenType} — {sp.site}</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">Grade</div><div className="text-sm font-bold">{sp.grade.split('(')[0]}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Specimen:</span> {selected.specimenType}</div><div><span className="text-gray-500">Site:</span> {selected.site}</div><div><span className="text-gray-500">Procedure:</span> {selected.procedure}</div><div><span className="text-gray-500">Pathologist:</span> {selected.pathologist}</div></div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3"><div className="text-sm font-medium text-purple-700">🔬 Diagnosis</div><div className="text-sm text-purple-600 font-semibold">{selected.diagnosis}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Details</div>
                {[
                  {label:'Tumour Type',val:selected.tumourType},
                  {label:'Grade',val:selected.grade},
                  {label:'Stage',val:selected.stage},
                  {label:'Margins',val:selected.margins},
                  {label:'Lymph Nodes',val:selected.lymphNodes},
                ].filter(d=>d.val!=='N/A').map((d,i)=>(
                  <div key={i} className="text-xs mb-1"><span className="text-gray-500">{d.label}:</span> {d.val}</div>
                ))}
              </div>
              {selected.specialStains && <div><div className="text-sm font-medium text-gray-600 mb-1">Special Stains / IHC</div><div className="bg-blue-50 rounded p-2 text-xs whitespace-pre-wrap">{selected.specialStains}</div></div>}
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
