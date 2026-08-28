import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Drug { name: string; category: string; interactions: { drug: string; severity: 'Major' | 'Moderate' | 'Minor'; effect: string }[]; }

const DRUGS: Drug[] = [
  { name: 'Warfarin', category: 'Anticoagulant', interactions: [
    { drug: 'Aspirin', severity: 'Major', effect: 'Increased bleeding risk — avoid combination' },
    { drug: 'Amoxicillin', severity: 'Moderate', effect: 'May increase INR — monitor closely' },
    { drug: 'Omeprazole', severity: 'Moderate', effect: 'May increase warfarin effect — reduce dose if needed' },
    { drug: 'Ibuprofen', severity: 'Major', effect: 'Increased GI bleeding risk — avoid NSAIDs' },
    { drug: 'Vitamin K', severity: 'Moderate', effect: 'Reduces warfarin effect — consistent vitamin K intake important' },
  ]},
  { name: 'Metformin', category: 'Antidiabetic', interactions: [
    { drug: 'Alcohol', severity: 'Major', effect: 'Increased risk of lactic acidosis — limit alcohol' },
    { drug: 'Iodinated Contrast', severity: 'Major', effect: 'Stop metformin 48h before/after contrast — renal risk' },
    { drug: 'Lisinopril', severity: 'Minor', effect: 'Monitor renal function — generally safe' },
  ]},
  { name: 'Amlodipine', category: 'Antihypertensive', interactions: [
    { drug: 'Simvastatin', severity: 'Moderate', effect: 'Increased statin levels — limit simvastatin to 20mg' },
    { drug: 'Cyclosporine', severity: 'Moderate', effect: 'Increased cyclosporine levels — monitor' },
  ]},
  { name: 'Amoxicillin', category: 'Antibiotic', interactions: [
    { drug: 'Warfarin', severity: 'Moderate', effect: 'May increase INR — monitor closely' },
    { drug: 'Methotrexate', severity: 'Moderate', effect: 'Increased methotrexate toxicity — monitor' },
  ]},
  { name: 'Omeprazole', category: 'PPI', interactions: [
    { drug: 'Clopidogrel', severity: 'Major', effect: 'Reduces clopidogrel activation — avoid combination' },
    { drug: 'Methotrexate', severity: 'Moderate', effect: 'Increased methotrexate levels — monitor' },
    { drug: 'Iron supplements', severity: 'Minor', effect: 'Reduced iron absorption — take iron separately' },
  ]},
  { name: 'Ibuprofen', category: 'NSAID', interactions: [
    { drug: 'Warfarin', severity: 'Major', effect: 'Increased bleeding risk — avoid NSAIDs' },
    { drug: 'Lisinopril', severity: 'Moderate', effect: 'Reduced antihypertensive effect — monitor BP' },
    { drug: 'Aspirin', severity: 'Major', effect: 'Increased GI bleeding — avoid combination' },
  ]},
];

const SEVERITY_COLORS: Record<string, string> = { Major: 'bg-red-100 text-red-800', Moderate: 'bg-yellow-100 text-yellow-800', Minor: 'bg-green-100 text-green-800' };

export default function DrugInteractionCheckerEnhanced() {
  const [drugs] = useState<Drug[]>(DRUGS);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(DRUGS[0] ?? null);
  const [search, setSearch] = useState('');

  const filtered = drugs.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Drug Interaction Checker</h1><p className="text-gray-500">Check drug-drug interactions, severity levels, and clinical recommendations</p></div>
      <div className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drug name or category..." className="flex-1 max-w-md border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Drug List</h3>
          {filtered.map((d) => (
            <div key={d.name} onClick={() => setSelectedDrug(d)} className={`bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${selectedDrug?.name === d.name ? 'ring-2 ring-green-500' : ''}`}>
              <div className="font-semibold text-sm">{d.name}</div>
              <div className="text-xs text-slate-500">{d.category} · {d.interactions.length} interactions</div>
            </div>
          ))}
        </div>
        {selectedDrug && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4">
            <div><h3 className="text-lg font-bold">{selectedDrug.name}</h3><p className="text-sm text-gray-500">{selectedDrug.category}</p></div>
            <h4 className="font-semibold text-sm">Known Interactions ({selectedDrug.interactions.length})</h4>
            <div className="space-y-3">
              {selectedDrug.interactions.map((i, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${i.severity === 'Major' ? 'bg-red-50 border-red-200' : i.severity === 'Moderate' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{i.drug}</span>
                    <Badge className={SEVERITY_COLORS[i.severity]}>{i.severity}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{i.effect}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
