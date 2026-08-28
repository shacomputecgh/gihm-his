import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface FormularyDrug {
  id: string;
  genericName: string;
  brandNames: string[];
  category: string;
  form: string;
  strengths: string[];
  formularyStatus: 'Formulary' | 'Non-Formulary' | 'Restricted' | 'Special Authorization';
  restrictions: string;
  substitutionAllowed: boolean;
  substituteDrug?: string;
  costCategory: 'Low' | 'Medium' | 'High' | 'Very High';
  indication: string;
  doseRange: string;
  frequency: string;
  route: string;
  sideEffects: string[];
  contraindications: string[];
  interactions: string[];
  pregnancyCategory: string;
  whoEssential: boolean;
  pricePerUnit: number;
}

const FORMULARY_DRUGS: FormularyDrug[] = [
  {
    id: 'FD-001', genericName: 'Amoxicillin', brandNames: ['Amoxil', 'Moxatag'], category: 'Antibiotics',
    form: 'Capsule', strengths: ['250mg', '500mg', '1g'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: true, substituteDrug: 'Amoxicillin-Clavulanate',
    costCategory: 'Low', indication: 'Upper/Lower respiratory infections, UTI, Skin infections',
    doseRange: '250-500mg', frequency: 'TDS', route: 'Oral',
    sideEffects: ['Diarrhea', 'Rash', 'Nausea'], contraindications: ['Penicillin allergy'], interactions: ['Methotrexate', 'Warfarin'],
    pregnancyCategory: 'B', whoEssential: true, pricePerUnit: 1.50
  },
  {
    id: 'FD-002', genericName: 'Metformin', brandNames: ['Glucophage', 'Diabetmin'], category: 'Antidiabetics',
    form: 'Tablet', strengths: ['500mg', '850mg', '1000mg'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: true, substituteDrug: 'Metformin XR',
    costCategory: 'Low', indication: 'Type 2 Diabetes Mellitus', doseRange: '500-2000mg',
    frequency: 'BD-TDS', route: 'Oral', sideEffects: ['GI upset', 'Lactic acidosis (rare)', 'Vitamin B12 deficiency'],
    contraindications: ['eGFR <30', 'Hepatic impairment', 'Metabolic acidosis'], interactions: ['Alcohol', 'Contrast dye'],
    pregnancyCategory: 'C', whoEssential: true, pricePerUnit: 0.80
  },
  {
    id: 'FD-003', genericName: 'Amlodipine', brandNames: ['Norvasc', 'Stamlo'], category: 'Antihypertensives',
    form: 'Tablet', strengths: ['5mg', '10mg'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: true, substituteDrug: 'Nifedipine',
    costCategory: 'Low', indication: 'Hypertension, Angina', doseRange: '5-10mg',
    frequency: 'OD', route: 'Oral', sideEffects: ['Ankle edema', 'Flushing', 'Headache'],
    contraindications: ['Cardiogenic shock', 'Severe aortic stenosis'], interactions: ['Simvastatin (dose limit)', 'CYP3A4 inhibitors'],
    pregnancyCategory: 'C', whoEssential: true, pricePerUnit: 1.20
  },
  {
    id: 'FD-004', genericName: 'Salbutamol', brandNames: ['Ventolin', 'ProAir'], category: 'Respiratory',
    form: 'Inhaler', strengths: ['100mcg/puff', '4mg tablet'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: false, costCategory: 'Low',
    indication: 'Bronchospasm, Asthma, COPD', doseRange: '100-200mcg',
    frequency: 'PRN Q4-6H', route: 'Inhaled', sideEffects: ['Tachycardia', 'Tremor', 'Hypokalemia'],
    contraindications: ['Hypersensitivity'], interactions: ['Beta-blockers', 'Digoxin'],
    pregnancyCategory: 'C', whoEssential: true, pricePerUnit: 5.00
  },
  {
    id: 'FD-005', genericName: 'Pantoprazole', brandNames: ['Pantozol', 'Protonix'], category: 'Gastrointestinal',
    form: 'Tablet', strengths: ['20mg', '40mg'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: true, substituteDrug: 'Omeprazole',
    costCategory: 'Medium', indication: 'GERD, Peptic ulcer, H. pylori eradication',
    doseRange: '20-40mg', frequency: 'OD-BD', route: 'Oral/IV',
    sideEffects: ['Headache', 'Diarrhea', 'Hypomagnesemia (long-term)'], contraindications: [],
    interactions: ['Methotrexate', 'Clopidogrel', 'Iron supplements'], pregnancyCategory: 'B',
    whoEssential: true, pricePerUnit: 3.50
  },
  {
    id: 'FD-006', genericName: 'Insulin Glargine', brandNames: ['Lantus', 'Biosimilar'], category: 'Antidiabetics',
    form: 'Injection', strengths: ['100 IU/mL'], formularyStatus: 'Restricted',
    restrictions: 'Requires endocrinologist/diabetologist prescription', substitutionAllowed: false,
    costCategory: 'Very High', indication: 'Type 1 & Type 2 DM (basal insulin)', doseRange: '10-80 units',
    frequency: 'OD SC', route: 'Subcutaneous', sideEffects: ['Hypoglycemia', 'Lipodystrophy', 'Weight gain'],
    contraindications: ['Hypoglycemia'], interactions: ['Sulfonylureas', 'Thiazolidinediones'],
    pregnancyCategory: 'C', whoEssential: false, pricePerUnit: 25.00
  },
  {
    id: 'FD-007', genericName: 'Vancomycin', brandNames: ['Vancocin'], category: 'Antibiotics',
    form: 'Injection', strengths: ['500mg', '1g'], formularyStatus: 'Special Authorization',
    restrictions: 'Infectious disease approval required. TDM mandatory.', substitutionAllowed: false,
    costCategory: 'High', indication: 'MRSA, C. difficile, severe Gram-positive infections',
    doseRange: '500mg-1g', frequency: 'Q8-12H IV', route: 'Intravenous',
    sideEffects: ['Nephrotoxicity', 'Ototoxicity', 'Red Man Syndrome'], contraindications: ['Severe renal impairment (dose adjust)'],
    interactions: ['Aminoglycosides', 'Piperacillin'], pregnancyCategory: 'B', whoEssential: false, pricePerUnit: 45.00
  },
  {
    id: 'FD-008', genericName: 'Paracetamol', brandNames: ['Panadol', 'Tylenol'], category: 'Analgesics',
    form: 'Tablet', strengths: ['500mg', '1g'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: false, costCategory: 'Low',
    indication: 'Pain, Fever', doseRange: '500mg-1g', frequency: 'QDS (max 4g/day)',
    route: 'Oral/IV/PR', sideEffects: ['Hepatotoxicity (overdose)', 'Rash (rare)'], contraindications: ['Severe hepatic impairment'],
    interactions: ['Warfarin (high dose)', 'Isoniazid'], pregnancyCategory: 'A', whoEssential: true, pricePerUnit: 0.50
  },
  {
    id: 'FD-009', genericName: 'Ciprofloxacin', brandNames: ['Ciproxin'], category: 'Antibiotics',
    form: 'Tablet', strengths: ['250mg', '500mg', '750mg'], formularyStatus: 'Formulary',
    restrictions: 'Avoid in children <18, pregnancy unless essential', substitutionAllowed: true,
    substituteDrug: 'Levofloxacin', costCategory: 'Medium',
    indication: 'UTI, GI infections, Bone/joint infections, Pneumonia',
    doseRange: '250-750mg', frequency: 'BD', route: 'Oral/IV',
    sideEffects: ['Tendon rupture', 'QT prolongation', 'GI upset', 'Photosensitivity'],
    contraindications: ['QT prolongation', 'Tendon disorders', 'Myasthenia gravis'], interactions: ['Antacids', 'Theophylline', 'Warfarin'],
    pregnancyCategory: 'C', whoEssential: true, pricePerUnit: 4.00
  },
  {
    id: 'FD-010', genericName: 'Ondansetron', brandNames: ['Zofran'], category: 'Antiemetics',
    form: 'Tablet', strengths: ['4mg', '8mg'], formularyStatus: 'Formulary',
    restrictions: '', substitutionAllowed: false, costCategory: 'Medium',
    indication: 'Chemotherapy-induced nausea, Post-operative nausea, Gastroenteritis',
    doseRange: '4-8mg', frequency: 'BD-TDS PRN', route: 'Oral/IV',
    sideEffects: ['Headache', 'Constipation', 'QT prolongation (high dose)'],
    contraindications: ['QT prolongation', 'Phenylketonuria (oral solution)'], interactions: ['QT-prolonging drugs'],
    pregnancyCategory: 'B', whoEssential: true, pricePerUnit: 2.50
  }
];

const STATUS_STYLES: Record<string, string> = {
  Formulary: 'bg-green-100 text-green-800',
  'Non-Formulary': 'bg-red-100 text-red-800',
  Restricted: 'bg-orange-100 text-orange-800',
  'Special Authorization': 'bg-purple-100 text-purple-800',
};
const COST_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800', 'Very High': 'bg-red-100 text-red-800',
};

export default function PharmacyFormulary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedDrug, setSelectedDrug] = useState<FormularyDrug | null>(null);

  const categories = [...new Set(FORMULARY_DRUGS.map(d => d.category))];

  const filtered = FORMULARY_DRUGS.filter(d => {
    const matchSearch = d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.brandNames.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = filterCategory === 'All' || d.category === filterCategory;
    const matchStatus = filterStatus === 'All' || d.formularyStatus === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

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
          title="Add New Pharmacy"
          fields={[{"name": "drugName", "label": "Drug Name", "type": "text", "placeholder": "e.g. Paracetamol 500mg", "required": true}, {"name": "genericName", "label": "Generic Name", "type": "text", "placeholder": "e.g. Acetaminophen"}, {"name": "category", "label": "Category", "type": "select", "options": ["Analgesic", "Antibiotic", "Antimalarial", "Antihypertensive", "Antidiabetic", "Vitamin", "Other"]}, {"name": "dosageForm", "label": "Dosage Form", "type": "select", "options": ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler"]}, {"name": "strength", "label": "Strength", "type": "text", "placeholder": "e.g. 500mg"}, {"name": "quantity", "label": "Quantity", "type": "number", "placeholder": "0", "required": true}, {"name": "unitPrice", "label": "Unit Price (GH₵)", "type": "number", "placeholder": "0.00", "required": true}, {"name": "batchNumber", "label": "Batch Number", "type": "text", "placeholder": "BAT-XXXX"}, {"name": "expiryDate", "label": "Expiry Date", "type": "date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Pharmacy Formulary</h1>
        <p className="text-gray-500">Drug formulary management, therapeutic substitution, and prescribing guidelines</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Drugs', value: FORMULARY_DRUGS.length, color: 'text-blue-600' },
          { label: 'Formulary', value: FORMULARY_DRUGS.filter(d => d.formularyStatus === 'Formulary').length, color: 'text-green-600' },
          { label: 'Restricted', value: FORMULARY_DRUGS.filter(d => d.formularyStatus === 'Restricted').length, color: 'text-orange-600' },
          { label: 'Special Auth', value: FORMULARY_DRUGS.filter(d => d.formularyStatus === 'Special Authorization').length, color: 'text-purple-600' },
          { label: 'WHO Essential', value: FORMULARY_DRUGS.filter(d => d.whoEssential).length, color: 'text-teal-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search drug name or brand..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64" />
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
        <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Generic Name</th>
                  <th className="text-left p-3 font-medium text-gray-600">Category</th>
                  <th className="text-left p-3 font-medium text-gray-600">Form</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Cost</th>
                  <th className="text-left p-3 font-medium text-gray-600">Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(drug => (
                  <tr key={drug.id} onClick={() => setSelectedDrug(drug)}
                    className={`border-t cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedDrug?.id === drug.id ? 'bg-blue-50' : ''
                    }`}>
                    <td className="p-3">
                      <div className="font-semibold">{drug.genericName}</div>
                      <div className="text-xs text-gray-400">{drug.brandNames.join(', ')}</div>
                    </td>
                    <td className="p-3 text-xs">{drug.category}</td>
                    <td className="p-3 text-xs">{drug.form}</td>
                    <td className="p-3"><Badge className={`text-[10px] ${STATUS_STYLES[drug.formularyStatus]}`}>{drug.formularyStatus}</Badge></td>
                    <td className="p-3"><Badge className={`text-[10px] ${COST_COLORS[drug.costCategory]}`}>{drug.costCategory}</Badge></td>
                    <td className="p-3 text-sm font-medium">GH₵ {drug.pricePerUnit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDrug ? (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selectedDrug.genericName}</h2>
                <p className="text-sm text-gray-500">{selectedDrug.brandNames.join(' / ')}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className={`text-[10px] ${STATUS_STYLES[selectedDrug.formularyStatus]}`}>{selectedDrug.formularyStatus}</Badge>
                  {selectedDrug.whoEssential && <Badge className="text-[10px] bg-teal-100 text-teal-800">WHO Essential</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Form:</span> {selectedDrug.form}</div>
                <div><span className="text-gray-500">Route:</span> {selectedDrug.route}</div>
                <div><span className="text-gray-500">Dose:</span> {selectedDrug.doseRange}</div>
                <div><span className="text-gray-500">Frequency:</span> {selectedDrug.frequency}</div>
                <div><span className="text-gray-500">Pregnancy:</span> Category {selectedDrug.pregnancyCategory}</div>
                <div><span className="text-gray-500">Price:</span> GH₵ {selectedDrug.pricePerUnit.toFixed(2)}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">Strengths</div>
                <div className="flex gap-1 flex-wrap mt-1">
                  {selectedDrug.strengths.map(s => <Badge key={s} className="text-[10px] bg-gray-100">{s}</Badge>)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">Indication</div>
                <div className="text-sm">{selectedDrug.indication}</div>
              </div>

              {selectedDrug.substitutionAllowed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-700">Substitution Allowed</div>
                  <div className="text-sm text-green-600">→ {selectedDrug.substituteDrug}</div>
                </div>
              )}

              {selectedDrug.restrictions && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-700">Restrictions</div>
                  <div className="text-sm text-orange-600">{selectedDrug.restrictions}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600">Side Effects</div>
                <div className="text-sm text-gray-600">{selectedDrug.sideEffects.join(', ')}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">Contraindications</div>
                <div className="text-sm text-gray-600">{selectedDrug.contraindications.length > 0 ? selectedDrug.contraindications.join(', ') : 'None'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">Interactions</div>
                <div className="text-sm text-gray-600">{selectedDrug.interactions.join(', ')}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 bg-white border rounded-xl">
              Select a drug to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
