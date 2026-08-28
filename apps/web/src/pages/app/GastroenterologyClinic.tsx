import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface GastroPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  condition: string;
  liverFunction: { ast: number; alt: number; alp: number; bilirubin: number; albumin: number; inr: number };
  endoscopy?: string;
  hepatitis?: string;
  bmi: number;
  status: 'New' | 'Follow-up' | 'Post-Endoscopy' | 'Under Treatment';
  medications: string[];
  doctor: string;
  followUp: string;
  notes: string;
}

const GASTRO_PATIENTS: GastroPatient[] = [
  {
    id: 'GASTRO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0980', visitDate: '2026-08-24',
    chiefComplaint: 'Upper GI bleed — melena, 2 days',
    condition: 'Peptic Ulcer Disease with GI Haemorrhage',
    liverFunction: { ast: 35, alt: 42, alp: 95, bilirubin: 18, albumin: 32, inr: 1.2 },
    endoscopy: 'OGD: Gastric ulcer (Forrest IIa) on lesser curvature. Haemoclip applied. No active bleeding.',
    bmi: 25.8, status: 'Post-Endoscopy',
    medications: ['Pantoprazole 40mg IV BD', 'Tranexamic 1g TDS', 'Iron supplementation', 'H. pylori triple therapy if positive'],
    doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (2 weeks)',
    notes: 'Active GI bleed controlled with haemoclip. Hb 8.2 — transfused 2 units. Repeat OGD in 6 weeks to confirm healing.'
  },
  {
    id: 'GASTRO-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-0982', visitDate: '2026-08-24',
    chiefComplaint: 'Chronic hepatitis B — routine monitoring',
    condition: 'Chronic Hepatitis B (HBeAg-negative)',
    liverFunction: { ast: 58, alt: 72, alp: 110, bilirubin: 22, albumin: 35, inr: 1.1 },
    hepatitis: 'HBsAg+, HBeAg−, HBV DNA 2.8×10⁴ IU/mL',
    bmi: 28.5, status: 'Under Treatment',
    medications: ['Tenofovir 300mg OD', 'Ursodeoxycholic acid 300mg BD'],
    doctor: 'Dr. Efua Darko', followUp: '2026-11-24 (3 months)',
    notes: 'HBeAg-negative hepatitis B. ALT elevated — on treatment. HBV DNA decreasing. FibroScan: F2 (mild fibrosis). Annual hepatocellular screening.'
  },
  {
    id: 'GASTRO-003', name: 'Kofi Asare', age: 42, gender: 'Male', mrn: 'MRN-2026-0984', visitDate: '2026-08-24',
    chiefComplaint: 'Abdominal pain, diarrhoea — 6 months, weight loss',
    condition: 'Crohn\'s Disease (Ileocolonic)',
    liverFunction: { ast: 22, alt: 28, alp: 85, bilirubin: 12, albumin: 30, inr: 1.0 },
    endoscopy: 'Colonoscopy: Skip lesions, aphthous ulcers terminal ileum, cobblestoning. Biopsies: non-caseating granulomas.',
    bmi: 20.5, status: 'Under Treatment',
    medications: ['Adalimumab 40mg SC fortnight', 'Azathioprine 150mg OD', 'Pantoprazole 40mg OD', 'Iron infusion', 'Folic acid 5mg OD'],
    doctor: 'Dr. Efua Darko', followUp: '2026-11-24 (3 months)',
    notes: 'Active Crohn\'s — biologic therapy initiated. CRP 42. Albumin low — nutritional support. Weight loss 8kg in 3 months.'
  },
  {
    id: 'GASTRO-004', name: 'Efua Nyarko', age: 38, gender: 'Female', mrn: 'MRN-2026-0986', visitDate: '2026-08-24',
    chiefComplaint: 'Heartburn, regurgitation — 1 year, worse post-meals',
    condition: 'Gastro-Oesophageal Reflux Disease (GORD)',
    liverFunction: { ast: 18, alt: 22, alp: 70, bilirubin: 10, albumin: 40, inr: 1.0 },
    endoscopy: 'OGD: Erosive oesophagitis (LA Grade B). Sliding hiatus hernia. Barrett\'s oesophagus excluded.',
    bmi: 32.1, status: 'Post-Endoscopy',
    medications: ['Esomeprazole 40mg OD', 'Domperidone 10mg TDS PRN', 'Weight management advice'],
    doctor: 'Dr. Efua Darko', followUp: '2026-11-24 (3 months)',
    notes: 'Erosive oesophagitis Grade B. H. pylori negative. Lifestyle modifications: weight loss, elevate head of bed, avoid late meals.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Endoscopy': 'bg-green-100 text-green-800', 'Under Treatment': 'bg-purple-100 text-purple-800',
};

export default function GastroenterologyClinic() {
  const [selected, setSelected] = useState<GastroPatient | null>(GASTRO_PATIENTS[0] ?? null);

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
          title="Add New GI Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Ama Darko","required":true},{"name":"complaint","label":"Chief Complaint","type":"select","options":["Abdominal Pain","Diarrhoea","Constipation","Heartburn","Jaundice","GI Bleeding","Other"]},{"name":"diagnosis","label":"Diagnosis","type":"text"},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Gastroenterology Clinic</h1>
        <p className="text-gray-500">Endoscopy, liver function, hepatitis management, and GI disorders</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: GASTRO_PATIENTS.length, color: 'text-blue-600' },
          { label: 'Post-Endoscopy', value: GASTRO_PATIENTS.filter(p => p.status === 'Post-Endoscopy').length, color: 'text-green-600' },
          { label: 'Hepatitis', value: GASTRO_PATIENTS.filter(p => p.hepatitis).length, color: 'text-orange-600' },
          { label: 'Active IBD', value: GASTRO_PATIENTS.filter(p => p.condition.includes('Crohn') || p.condition.includes('Colitis')).length, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {GASTRO_PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === p.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.chiefComplaint}</div>
                </div>
                <div className="text-right text-xs">
                  <div>AST: {p.liverFunction.ast}</div>
                  <div>ALT: {p.liverFunction.alt}</div>
                  <div>Albumin: {p.liverFunction.albumin}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p>
                <p className="text-sm text-blue-600">{selected.condition}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Liver Function Tests</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    { label: 'AST', value: selected.liverFunction.ast, unit: 'U/L', max: 40 },
                    { label: 'ALT', value: selected.liverFunction.alt, unit: 'U/L', max: 40 },
                    { label: 'ALP', value: selected.liverFunction.alp, unit: 'U/L', max: 120 },
                    { label: 'Bili', value: selected.liverFunction.bilirubin, unit: 'µmol/L', max: 21 },
                    { label: 'Albumin', value: selected.liverFunction.albumin, unit: 'g/L', min: 35 },
                    { label: 'INR', value: selected.liverFunction.inr, unit: '', max: 1.1 },
                  ].map((test, i) => (
                    <div key={i} className="bg-gray-50 rounded p-2 text-center">
                      <div className={`font-bold ${(test.max && test.value > test.max) || (test.min && test.value < test.min) ? 'text-red-600' : 'text-green-600'}`}>{test.value}</div>
                      <div className="text-[10px] text-gray-500">{test.label} ({test.unit})</div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.hepatitis && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-700">Hepatitis Status</div>
                  <div className="text-xs text-orange-600 mt-1">{selected.hepatitis}</div>
                </div>
              )}

              {selected.endoscopy && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Endoscopy Finding</div>
                  <div className="bg-blue-50 rounded p-2 text-xs">{selected.endoscopy}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Medications</div>
                {selected.medications.map((m, i) => (
                  <div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>
                ))}
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
