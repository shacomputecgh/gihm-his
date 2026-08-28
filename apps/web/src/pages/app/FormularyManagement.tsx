import { useState } from 'react';
import { Card, Badge, useToast } from '../../components/ui';

interface FormularyDrug {
  id: string;
  genericName: string;
  brandName: string;
  category: string;
  subCategory: string;
  strength: string;
  dosageForm: string;
  route: string;
  manufacturer: string;
  supplier: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  insurancePrice: number;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  unit: string;
  formularyStatus: 'Formulary' | 'Non-Formulary' | 'Restricted' | 'Conditional';
  prescriptionOnly: boolean;
  controlled: boolean;
  genericAvailable: boolean;
  therapeuticClass: string;
  atcCode: string;
  interactions: string[];
  contraindications: string[];
  sideEffects: string[];
  indications: string[];
  adultDose: string;
  paediatricDose: string;
  renalDoseAdjust: string;
  hepaticDoseAdjust: string;
  storageConditions: string;
  availability: 'Available' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
}

const SAMPLE_FORMULARY: FormularyDrug[] = [
  { id: 'FD-001', genericName: 'Amoxicillin', brandName: 'Amoxil', category: 'Antibiotics', subCategory: 'Penicillins', strength: '500mg', dosageForm: 'Capsule', route: 'Oral', manufacturer: 'GSK', supplier: 'Pharma Distribution GH', batchNumber: 'BAT-2026-001', expiryDate: '2027-06-30', purchasePrice: 0.50, sellingPrice: 2.00, insurancePrice: 1.50, currentStock: 5000, minimumStock: 1000, reorderLevel: 2000, unit: 'Capsules', formularyStatus: 'Formulary', prescriptionOnly: true, controlled: false, genericAvailable: true, therapeuticClass: 'Beta-Lactam Antibiotics', atcCode: 'J01CA04', interactions: ['Methotrexate', 'Warfarin', 'Oral Contraceptives'], contraindications: ['Penicillin Allergy', 'Mononucleosis'], sideEffects: ['Nausea', 'Diarrhea', 'Rash', 'Vomiting'], indications: ['Upper Respiratory Tract Infections', 'UTI', 'H. Pylori', 'Otitis Media'], adultDose: '500mg TID for 7-14 days', paediatricDose: '25-50mg/kg/day divided TID', renalDoseAdjust: 'CrCl <30: extend interval', hepaticDoseAdjust: 'Monitor liver function', storageConditions: 'Store below 25°C', availability: 'Available' },
  { id: 'FD-002', genericName: 'Metformin', brandName: 'Glucophage', category: 'Antidiabetics', subCategory: 'Biguanides', strength: '500mg', dosageForm: 'Tablet', route: 'Oral', manufacturer: 'Merck', supplier: 'MediTrade GH', batchNumber: 'BAT-2026-002', expiryDate: '2027-08-15', purchasePrice: 0.30, sellingPrice: 1.50, insurancePrice: 1.00, currentStock: 8000, minimumStock: 2000, reorderLevel: 3000, unit: 'Tablets', formularyStatus: 'Formulary', prescriptionOnly: true, controlled: false, genericAvailable: true, therapeuticClass: 'Oral Antidiabetics', atcCode: 'A10BA02', interactions: ['Alcohol', 'Contrast Dye', 'Diuretics'], contraindications: ['Renal Failure', 'Metabolic Acidosis', 'Hepatic Failure'], sideEffects: ['GI Upset', 'Metallic Taste', 'Vitamin B12 Deficiency'], indications: ['Type 2 Diabetes', 'PCOS', 'Gestational Diabetes'], adultDose: '500mg BID, titrate to 2000mg/day', paediatricDose: '10-15mg/kg/day', renalDoseAdjust: 'CrCl <30: Contraindicated', hepaticDoseAdjust: 'Contraindicated', storageConditions: 'Store below 30°C', availability: 'Available' },
  { id: 'FD-003', genericName: 'Amlodipine', brandName: 'Norvasc', category: 'Antihypertensives', subCategory: 'Calcium Channel Blockers', strength: '5mg', dosageForm: 'Tablet', route: 'Oral', manufacturer: 'Pfizer', supplier: 'Pharma Distribution GH', batchNumber: 'BAT-2026-003', expiryDate: '2027-09-30', purchasePrice: 0.40, sellingPrice: 2.50, insurancePrice: 1.80, currentStock: 6000, minimumStock: 1500, reorderLevel: 2500, unit: 'Tablets', formularyStatus: 'Formulary', prescriptionOnly: true, controlled: false, genericAvailable: true, therapeuticClass: 'Antihypertensives', atcCode: 'C08CA01', interactions: ['Simvastatin (high dose)', 'Cyclosporine'], contraindications: ['Severe Hypotension', 'Cardiogenic Shock'], sideEffects: ['Ankle Edema', 'Dizziness', 'Flushing', 'Headache'], indications: ['Hypertension', 'Angina', 'Vasospastic Angina'], adultDose: '5-10mg once daily', paediatricDose: '0.06-0.3mg/kg/day', renalDoseAdjust: 'No adjustment needed', hepaticDoseAdjust: 'Start 2.5mg daily', storageConditions: 'Store below 25°C', availability: 'Available' },
  { id: 'FD-004', genericName: 'Omeprazole', brandName: 'Prilosec', category: 'Gastrointestinal', subCategory: 'Proton Pump Inhibitors', strength: '20mg', dosageForm: 'Capsule', route: 'Oral', manufacturer: 'AstraZeneca', supplier: 'MediTrade GH', batchNumber: 'BAT-2026-004', expiryDate: '2027-05-31', purchasePrice: 0.25, sellingPrice: 1.80, insurancePrice: 1.20, currentStock: 3500, minimumStock: 1000, reorderLevel: 2000, unit: 'Capsules', formularyStatus: 'Formulary', prescriptionOnly: false, controlled: false, genericAvailable: true, therapeuticClass: 'GI Agents', atcCode: 'A02BC01', interactions: ['Clopidogrel', 'Methotrexate', 'Iron Supplements'], contraindications: ['Hypersensitivity to PPIs'], sideEffects: ['Headache', 'Diarrhea', 'Nausea', 'B12 Deficiency (long-term)'], indications: ['GERD', 'Peptic Ulcer', 'H. Pylori Eradication', 'Zollinger-Ellison'], adultDose: '20mg daily for 4-8 weeks', paediatricDose: '0.7-3.5mg/kg/day', renalDoseAdjust: 'No adjustment', hepaticDoseAdjust: 'Consider dose reduction', storageConditions: 'Store below 25°C', availability: 'Available' },
  { id: 'FD-005', genericName: 'Salbutamol', brandName: 'Ventolin', category: 'Respiratory', subCategory: 'Beta-2 Agonists', strength: '100mcg/dose', dosageForm: 'MDI Inhaler', route: 'Inhaled', manufacturer: 'GSK', supplier: 'Pharma Distribution GH', batchNumber: 'BAT-2026-005', expiryDate: '2027-03-31', purchasePrice: 3.00, sellingPrice: 8.00, insurancePrice: 6.00, currentStock: 200, minimumStock: 50, reorderLevel: 100, unit: 'Inhalers', formularyStatus: 'Formulary', prescriptionOnly: false, controlled: false, genericAvailable: true, therapeuticClass: 'Anti-Asthmatics', atcCode: 'R03AC02', interactions: ['Beta-Blockers', 'Digoxin', 'MAOIs'], contraindications: ['Hypersensitivity to Salbutamol'], sideEffects: ['Tremor', 'Palpitations', 'Headache', 'Hypokalemia'], indications: ['Asthma', 'COPD', 'Bronchospasm', 'Exercise-Induced Bronchospasm'], adultDose: '1-2 puffs PRN q4-6h', paediatricDose: '1 puff PRN q4-6h', renalDoseAdjust: 'No adjustment', hepaticDoseAdjust: 'No adjustment', storageConditions: 'Store below 30°C', availability: 'Low Stock' },
  { id: 'FD-006', genericName: 'Morphine Sulfate', brandName: 'MST Continus', category: 'Analgesics', subCategory: 'Opioid Analgesics', strength: '10mg', dosageForm: 'Tablet SR', route: 'Oral', manufacturer: 'Napp', supplier: 'Controlled Drugs GH', batchNumber: 'BAT-2026-006', expiryDate: '2027-04-30', purchasePrice: 2.50, sellingPrice: 12.00, insurancePrice: 9.00, currentStock: 150, minimumStock: 50, reorderLevel: 80, unit: 'Tablets', formularyStatus: 'Restricted', prescriptionOnly: true, controlled: true, genericAvailable: false, therapeuticClass: 'Opioid Analgesics', atcCode: 'N02AA01', interactions: ['MAOIs', 'Benzodiazepines', 'Alcohol', 'SSRIs'], contraindications: ['Respiratory Depression', 'Paralytic Ileus', 'Acute Abdomen'], sideEffects: ['Constipation', 'Nausea', 'Respiratory Depression', 'Sedation'], indications: ['Severe Pain', 'Cancer Pain', 'Post-Surgical Pain', 'Palliative Care'], adultDose: '5-15mg q4h', paediatricDose: '0.2-0.5mg/kg q4h', renalDoseAdjust: 'Reduce dose 50%', hepaticDoseAdjust: 'Reduce dose 50%', storageConditions: 'Secure storage - Schedule II', availability: 'Available' },
  { id: 'FD-007', genericName: 'Artemether-Lumefantrine', brandName: 'Coartem', category: 'Antimalarials', subCategory: 'ACTs', strength: '20/120mg', dosageForm: 'Tablet', route: 'Oral', manufacturer: 'Novartis', supplier: 'Pharma Distribution GH', batchNumber: 'BAT-2026-007', expiryDate: '2027-07-31', purchasePrice: 1.00, sellingPrice: 5.00, insurancePrice: 3.50, currentStock: 4000, minimumStock: 1500, reorderLevel: 2500, unit: 'Tablets', formularyStatus: 'Formulary', prescriptionOnly: true, controlled: false, genericAvailable: true, therapeuticClass: 'Antimalarials', atcCode: 'P01BF01', interactions: ['Warfarin', 'Anticonvulsants', 'Antiretrovirals'], contraindications: ['First Trimester Pregnancy (unless severe malaria)', 'Hypersensitivity'], sideEffects: ['Headache', 'Dizziness', 'Nausea', 'QT Prolongation'], indications: ['Uncomplicated P. Falciparum Malaria', 'Severe Malaria (IV form)'], adultDose: '4 tabs at 0h, 8h, 24h, 36h', paediatricDose: 'Weight-based dosing', renalDoseAdjust: 'No adjustment', hepaticDoseAdjust: 'Use with caution', storageConditions: 'Store below 30°C', availability: 'Available' },
];

const STATUS_COLORS: Record<string, string> = {
  Formulary: 'bg-green-100 text-green-800',
  'Non-Formulary': 'bg-gray-100 text-gray-800',
  Restricted: 'bg-orange-100 text-orange-800',
  Conditional: 'bg-yellow-100 text-yellow-800',
};

const AVAIL_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-800',
  'Low Stock': 'bg-yellow-100 text-yellow-800',
  'Out of Stock': 'bg-red-100 text-red-800',
  Discontinued: 'bg-gray-100 text-gray-800',
};

export default function FormularyManagement() {
  const [drugs] = useState<FormularyDrug[]>(SAMPLE_FORMULARY);
  const [tab, setTab] = useState<'overview' | 'catalogue' | 'interactions' | 'cost' | 'therapeutic'>('overview');
  const [selectedDrug, setSelectedDrug] = useState<FormularyDrug | null>(null);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const filtered = search ? drugs.filter(d => d.genericName.toLowerCase().includes(search.toLowerCase()) || d.brandName.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase())) : drugs;
  const totalStockValue = drugs.reduce((s, d) => s + d.currentStock * d.purchasePrice, 0);
  const lowStockDrugs = drugs.filter(d => d.currentStock <= d.reorderLevel);
  const controlledDrugs = drugs.filter(d => d.controlled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💊 Pharmaceutical Formulary</h1>
          <p className="text-gray-600 mt-1">Drug catalogue · Interactions · Cost tracking · Therapeutic substitutions</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drugs..." className="px-4 py-2 border rounded-lg w-64" />
          <button onClick={() => toast('Add new drug form opened', 'success')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Drug</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Drugs', value: drugs.length, icon: '💊', color: 'text-blue-600' },
          { label: 'Formulary', value: drugs.filter(d => d.formularyStatus === 'Formulary').length, icon: '✅', color: 'text-green-600' },
          { label: 'Restricted', value: drugs.filter(d => d.formularyStatus === 'Restricted').length, icon: '🔒', color: 'text-orange-600' },
          { label: 'Low Stock', value: lowStockDrugs.length, icon: '⚠️', color: 'text-yellow-600' },
          { label: 'Controlled', value: controlledDrugs.length, icon: '🚫', color: 'text-red-600' },
          { label: 'Stock Value', value: `GH₵${totalStockValue.toLocaleString()}`, icon: '💰', color: 'text-purple-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{stat.icon} {stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'catalogue', 'interactions', 'cost', 'therapeutic'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'catalogue' ? '📚 Catalogue' : t === 'interactions' ? '⚠️ Interactions' : t === 'cost' ? '💰 Cost Analysis' : '🔄 Therapeutic'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Drugs by Category</h3>
            <div className="space-y-2">
              {Object.entries(drugs.reduce<Record<string, number>>((acc, d) => {
                acc[d.category] = (acc[d.category] || 0) + 1;
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{cat}</span>
                  <span className="font-bold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Stock Alerts</h3>
            <div className="space-y-2">
              {lowStockDrugs.map(d => (
                <div key={d.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{d.genericName} ({d.brandName})</div>
                    <div className="text-xs text-gray-500">{d.strength} {d.dosageForm}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-700">{d.currentStock} {d.unit}</div>
                    <div className="text-xs text-gray-500">Min: {d.minimumStock}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Formulary Status Distribution</h3>
            <div className="space-y-3">
              {['Formulary', 'Non-Formulary', 'Restricted', 'Conditional'].map(status => {
                const count = drugs.filter(d => d.formularyStatus === status).length;
                const pct = drugs.length > 0 ? (count / drugs.length * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <Badge className={STATUS_COLORS[status]}>{status}</Badge>
                      <span className="font-bold">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Controlled Substances (Schedule II)</h3>
            <div className="space-y-2">
              {controlledDrugs.map(d => (
                <div key={d.id} className="p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-red-800">🚫 {d.genericName} ({d.brandName})</div>
                      <div className="text-xs text-gray-500">{d.strength} {d.dosageForm} — Stock: {d.currentStock}</div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Controlled</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Catalogue Tab */}
      {tab === 'catalogue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Generic Name</th>
                  <th className="px-4 py-3 text-left">Brand Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Strength</th>
                  <th className="px-4 py-3 text-left">Form</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="font-medium">{d.genericName}</div>{d.genericAvailable && <span className="text-xs text-green-600">Generic Available</span>}</td>
                    <td className="px-4 py-3">{d.brandName}</td>
                    <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{d.category}</Badge></td>
                    <td className="px-4 py-3">{d.strength}</td>
                    <td className="px-4 py-3">{d.dosageForm}</td>
                    <td className="px-4 py-3"><span className={d.currentStock <= d.reorderLevel ? 'text-yellow-600 font-bold' : ''}>{d.currentStock}</span></td>
                    <td className="px-4 py-3">GH₵{d.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge className={STATUS_COLORS[d.formularyStatus]}>{d.formularyStatus}</Badge></td>
                    <td className="px-4 py-3"><button onClick={() => setSelectedDrug(d)} className="text-blue-600 hover:underline text-sm">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactions Tab */}
      {tab === 'interactions' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Drug Interactions Database</h3>
            <div className="space-y-4">
              {drugs.filter(d => d.interactions.length > 0).map(d => (
                <div key={d.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">{d.genericName} ({d.brandName})</div>
                      <div className="text-xs text-gray-500">{d.strength} — {d.therapeuticClass}</div>
                    </div>
                    <Badge className={d.interactions.length > 3 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                      {d.interactions.length} interaction(s)
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.interactions.map((int, i) => (
                      <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">⚠️ {int}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contraindications Overview</h3>
            <div className="space-y-4">
              {drugs.filter(d => d.contraindications.length > 0).map(d => (
                <div key={d.id} className="p-3 bg-orange-50 rounded-lg">
                  <div className="font-medium text-orange-800">{d.genericName}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.contraindications.map((c, i) => (
                      <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">🚫 {c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Cost Tab */}
      {tab === 'cost' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Price Comparison (Generic vs Brand)</h3>
            <div className="space-y-3">
              {drugs.filter(d => d.genericAvailable).map(d => {
                const savings = d.sellingPrice - d.purchasePrice;
                return (
                  <div key={d.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{d.genericName}</div>
                        <div className="text-xs text-gray-500">{d.brandName}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-500">Cost: GH₵{d.purchasePrice.toFixed(2)}</div>
                        <div className="text-green-600 font-bold">Margin: GH₵{savings.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Stock Value by Category</h3>
            <div className="space-y-3">
              {Object.entries(drugs.reduce<Record<string, number>>((acc, d) => {
                acc[d.category] = (acc[d.category] || 0) + (d.currentStock * d.purchasePrice);
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).map(([cat, value]) => {
                const pct = totalStockValue > 0 ? (value / totalStockValue * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat}</span>
                      <span className="font-bold">GH₵{value.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Insurance vs Cash Pricing</h3>
            <div className="space-y-2">
              {drugs.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium">{d.genericName} {d.strength}</span>
                  <div className="flex gap-4 text-right">
                    <span className="text-green-600">Insurance: GH₵{d.insurancePrice.toFixed(2)}</span>
                    <span className="text-blue-600">Cash: GH₵{d.sellingPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">ATC Classification</h3>
            <div className="space-y-2">
              {drugs.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">{d.atcCode}</span>
                  <span className="font-medium">{d.genericName}</span>
                  <span className="text-gray-500">{d.therapeuticClass}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Therapeutic Tab */}
      {tab === 'therapeutic' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Therapeutic Classifications</h3>
            <div className="space-y-4">
              {Object.entries(drugs.reduce<Record<string, FormularyDrug[]>>((acc, d) => {
                if (!acc[d.therapeuticClass]) acc[d.therapeuticClass] = [];
                acc[d.therapeuticClass].push(d);
                return acc;
              }, {})).sort((a, b) => b[1].length - a[1].length).map(([tc, drugList]) => (
                <div key={tc} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900">{tc}</h4>
                    <Badge className="bg-blue-100 text-blue-800">{drugList.length} drug(s)</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {drugList.map(d => (
                      <div key={d.id} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{d.genericName} {d.strength}</div>
                          <div className="text-xs text-gray-500">{d.brandName} · {d.dosageForm}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div>Stock: {d.currentStock}</div>
                          <div className="font-bold">GH₵{d.sellingPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Drug Detail Modal */}
      {selectedDrug && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{selectedDrug.genericName} ({selectedDrug.brandName})</h3>
              <button onClick={() => setSelectedDrug(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">ATC Code:</span> <span className="font-mono">{selectedDrug.atcCode}</span></div>
                <div><span className="text-gray-500">Status:</span> <Badge className={STATUS_COLORS[selectedDrug.formularyStatus]}>{selectedDrug.formularyStatus}</Badge></div>
                <div><span className="text-gray-500">Category:</span> {selectedDrug.category}</div>
                <div><span className="text-gray-500">Sub-Category:</span> {selectedDrug.subCategory}</div>
                <div><span className="text-gray-500">Strength:</span> {selectedDrug.strength}</div>
                <div><span className="text-gray-500">Form:</span> {selectedDrug.dosageForm}</div>
                <div><span className="text-gray-500">Route:</span> {selectedDrug.route}</div>
                <div><span className="text-gray-500">Manufacturer:</span> {selectedDrug.manufacturer}</div>
                <div><span className="text-gray-500">Stock:</span> {selectedDrug.currentStock} {selectedDrug.unit}</div>
                <div><span className="text-gray-500">Availability:</span> <Badge className={AVAIL_COLORS[selectedDrug.availability]}>{selectedDrug.availability}</Badge></div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-2">Pricing</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-2 bg-gray-50 rounded text-center"><div className="text-gray-500">Purchase</div><div className="font-bold">GH₵{selectedDrug.purchasePrice.toFixed(2)}</div></div>
                  <div className="p-2 bg-blue-50 rounded text-center"><div className="text-gray-500">Cash Price</div><div className="font-bold text-blue-600">GH₵{selectedDrug.sellingPrice.toFixed(2)}</div></div>
                  <div className="p-2 bg-green-50 rounded text-center"><div className="text-gray-500">Insurance</div><div className="font-bold text-green-600">GH₵{selectedDrug.insurancePrice.toFixed(2)}</div></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-2">Dosing</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-500">Adult:</span> {selectedDrug.adultDose}</div>
                  <div><span className="text-gray-500">Paediatric:</span> {selectedDrug.paediatricDose}</div>
                  <div><span className="text-gray-500">Renal:</span> {selectedDrug.renalDoseAdjust}</div>
                  <div><span className="text-gray-500">Hepatic:</span> {selectedDrug.hepaticDoseAdjust}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-2">Interactions</h4>
                <div className="flex flex-wrap gap-1">{selectedDrug.interactions.map((int, i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">⚠️ {int}</span>)}</div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-2">Indications</h4>
                <div className="flex flex-wrap gap-1">{selectedDrug.indications.map((ind, i) => <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">✅ {ind}</span>)}</div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-2">Side Effects</h4>
                <div className="flex flex-wrap gap-1">{selectedDrug.sideEffects.map((se, i) => <span key={i} className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">⚡ {se}</span>)}</div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-2">Storage</h4>
                <div className="text-sm text-gray-700">{selectedDrug.storageConditions}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
