import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface MicroPatient {
  id: string; patientName: string; age: number; gender: string; mrn: string;
  specimenType: string; specimenDate: string; organism: string;
  sensitivity: string[]; resistance: string[];
  site: string; clinicalSignificance: string;
  status: 'Specimen Received' | 'In Culture' | 'Preliminary' | 'Final Report' | 'Follow-up';
  recommendedAbx: string; technologist: string; followUp: string; notes: string;
}

const CULTURES: MicroPatient[] = [
  { id: 'MIC-001', patientName: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1140',
    specimenType: 'Blood Culture', specimenDate: '2026-08-23', organism: 'Staphylococcus aureus (MSSA)',
    sensitivity: ['Flucloxacillin', 'Cefazolin', 'Vancomycin', 'Linezolid', 'Trimethoprim-Sulfamethoxazole'],
    resistance: ['Penicillin', 'Erythromycin'], site: 'Bloodstream',
    clinicalSignificance: 'Significant — Septicaemia. Two sets positive. Identify and sensitise confirmed.',
    status: 'Final Report', recommendedAbx: 'Flucloxacillin 2g IV Q6H (or Cefazolin 2g IV Q8H)',
    technologist: 'Lab. Nana Agyeman', followUp: '2026-08-27 (repeat blood cultures)',
    notes: 'MSSA bloodstream infection. Repeat blood cultures in 48-72 hours. Echocardiogram to rule out endocarditis. Infectious disease review.'
  },
  { id: 'MIC-002', patientName: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1142',
    specimenType: 'Urine', specimenDate: '2026-08-23', organism: 'Escherichia coli (ESBL)',
    sensitivity: ['Meropenem', 'Ertapenem', 'Piperacillin-Tazobactam'],
    resistance: ['Ciprofloxacin', 'Ceftriaxone', 'Cefuroxime', 'Trimethoprim-Sulfamethoxazole', 'Amoxicillin-Clavulanate'],
    site: 'Urinary Tract',
    clinicalSignificance: 'Significant — UTI. High colony count >10⁵ CFU/mL with symptoms.',
    status: 'Final Report', recommendedAbx: 'Nitrofurantoin 100mg TDS (uncomplicated) or Ertapenem 1g IV OD (complicated)',
    technologist: 'Lab. Nana Agyeman', followUp: '2026-09-07 (repeat culture post-treatment)',
    notes: 'ESBL E. coli — multidrug resistant. Carbapenem-sparing strategy. Nitrofurantoin for lower UTI. Review antibiotics prescribed.'
  },
  { id: 'MIC-003', patientName: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1144',
    specimenType: 'Sputum', specimenDate: '2026-08-23', organism: 'Klebsiella pneumoniae (MRSA-negative)',
    sensitivity: ['Amoxicillin-Clavulanate', 'Ciprofloxacin', 'Meropenem'],
    resistance: ['Ampicillin', 'Amoxicillin'],
    site: 'Lower Respiratory Tract',
    clinicalSignificance: 'Probable pathogen — Pneumonia. Moderate growth. Good quality sputum (>25 PMNs, <10 squamous epithelial cells).',
    status: 'Preliminary', recommendedAbx: 'Amoxicillin-Clavulanate 1.2g IV Q8H + Azithromycin 500mg OD',
    technologist: 'Lab. Nana Agyeman', followUp: '2026-08-25 (final sensitivity)',
    notes: 'K. pneumoniae respiratory isolate. Final sensitivity pending. Clinical correlation with pneumonia severity.'
  },
  { id: 'MIC-004', patientName: 'Efua Nyarko', age: 35, gender: 'Female', mrn: 'MRN-2026-1146',
    specimenType: 'Wound Swab', specimenDate: '2026-08-24', organism: 'Mixed flora — Staphylococcus epidermidis, Streptococcus pyogenes',
    sensitivity: ['Flucloxacillin', 'Amoxicillin', 'Clindamycin', 'Erythromycin'],
    resistance: [],
    site: 'Surgical Wound',
    clinicalSignificance: 'Contamination vs colonisation — interpret with clinical context. Possible early wound infection.',
    status: 'Preliminary', recommendedAbx: 'Flucloxacillin 500mg QDS (if clinically infected)',
    technologist: 'Lab. Nana Agyeman', followUp: '2026-08-26 (final report)',
    notes: 'Wound swab — mixed growth. Clinical assessment needed. Not all organisms may be pathogenic. Consider re-culture if concern.'
  },
  { id: 'MIC-005', patientName: 'Nana Kuffour', age: 8, gender: 'Male', mrn: 'MRN-2026-1148',
    specimenType: 'Stool', specimenDate: '2026-08-24', organism: 'Salmonella enterica serovar Typhi',
    sensitivity: ['Ciprofloxacin', 'Azithromycin', 'Ceftriaxone', 'Meropenem'],
    resistance: ['Ampicillin', 'Trimethoprim-Sulfamethoxazole'],
    site: 'Gastrointestinal Tract',
    clinicalSignificance: 'Significant pathogen — Typhoid fever. High clinical significance.',
    status: 'Final Report', recommendedAbx: 'Ciprofloxacin 750mg PO BD x 7-10 days (or Ceftriaxone 2g IV OD if severe)',
    technologist: 'Lab. Nana Agyeman', followUp: '2026-09-07 (repeat stool culture)',
    notes: 'Salmonella Typhi — Typhoid fever. Reportable disease. Contact tracing required. Blood cultures if not done.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Specimen Received': 'bg-blue-100 text-blue-800', 'In Culture': 'bg-yellow-100 text-yellow-800',
  'Preliminary': 'bg-orange-100 text-orange-800', 'Final Report': 'bg-green-100 text-green-800',
  'Follow-up': 'bg-purple-100 text-purple-800',
};

export default function MicrobiologyLab() {
  const [selected, setSelected] = useState<MicroPatient | null>(CULTURES[0] ?? null);
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
          title="Add New Microbiology Record"
          fields={[{"name":"testType","label":"Test Type","type":"select","options":["Culture & Sensitivity","Gram Stain","AFB Stain","Blood Culture","Urine Culture","Wound Swab","Other"],"required":true},{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"specimen","label":"Specimen Source","type":"text"},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Microbiology Laboratory</h1><p className="text-gray-500">Culture and sensitivity, organism identification, and antimicrobial stewardship</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Cultures', value: CULTURES.length, color: 'text-blue-600' },
          { label: 'Final Reports', value: CULTURES.filter(c=>c.status==='Final Report').length, color: 'text-green-600' },
          { label: 'MDR Organisms', value: CULTURES.filter(c=>c.resistance.length>=3).length, color: 'text-red-600' },
          { label: 'Significant', value: CULTURES.filter(c=>c.clinicalSignificance.includes('Significant')).length, color: 'text-orange-600' },
          { label: 'Specimen Types', value: new Set(CULTURES.map(c=>c.specimenType)).size, color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {CULTURES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===c.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{c.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge><Badge className="text-[10px] bg-gray-100">{c.specimenType}</Badge></div>
                  <div className="text-sm text-gray-500">{c.organism}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.site} — {c.specimenDate}</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">Resistant to</div><div className="text-sm font-bold text-red-600">{c.resistance.length > 1 ? `${c.resistance.length} drugs` : `${c.resistance.length} drug`}</div></div>
              </div>
              {c.resistance.length>0 && <div className="flex gap-1 mt-2 flex-wrap">{c.resistance.map(r=><Badge key={r} className="text-[10px] bg-red-100 text-red-700">R: {r}</Badge>)}</div>}
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.specimenType} — {selected.site}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Date:</span> {selected.specimenDate}</div><div><span className="text-gray-500">Technologist:</span> {selected.technologist}</div></div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3"><div className="text-sm font-medium text-purple-700">🦠 Organism</div><div className="text-sm text-purple-600 font-semibold">{selected.organism}</div></div>
              <div><div className="text-sm font-medium text-green-600 mb-1">Sensitive</div><div className="flex flex-wrap gap-1">{selected.sensitivity.map(s=><Badge key={s} className="text-[10px] bg-green-100 text-green-700">S: {s}</Badge>)}</div></div>
              {selected.resistance.length>0 && <div><div className="text-sm font-medium text-red-600 mb-1">Resistant</div><div className="flex flex-wrap gap-1">{selected.resistance.map(r=><Badge key={r} className="text-[10px] bg-red-100 text-red-700">R: {r}</Badge>)}</div></div>}
              <div className="bg-blue-50 rounded-lg p-3"><div className="text-sm font-medium text-blue-700 mb-1">Recommended Antibiotics</div><div className="text-sm text-blue-600">{selected.recommendedAbx}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Clinical Significance</div><div className="text-xs">{selected.clinicalSignificance}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
