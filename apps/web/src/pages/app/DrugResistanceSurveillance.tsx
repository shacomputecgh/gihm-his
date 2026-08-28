import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';

interface ResistanceData {
  organism: string; antibiotics: { name: string; resistant: number; intermediate: number; susceptible: number }[];
  lastUpdated: string;
}

const RESISTANCE: ResistanceData[] = [
  { organism: 'Staphylococcus aureus', lastUpdated: '2026-08-20', antibiotics: [{ name: 'Methicillin', resistant: 32, intermediate: 8, susceptible: 60 }, { name: 'Vancomycin', resistant: 0, intermediate: 0, susceptible: 100 }, { name: 'Linezolid', resistant: 0, intermediate: 0, susceptible: 100 }, { name: 'Clindamycin', resistant: 18, intermediate: 12, susceptible: 70 }] },
  { organism: 'E. coli', lastUpdated: '2026-08-20', antibiotics: [{ name: 'Amoxicillin', resistant: 55, intermediate: 10, susceptible: 35 }, { name: 'Ciprofloxacin', resistant: 28, intermediate: 12, susceptible: 60 }, { name: 'Meropenem', resistant: 5, intermediate: 3, susceptible: 92 }, { name: 'Gentamicin', resistant: 22, intermediate: 8, susceptible: 70 }] },
  { organism: 'Klebsiella pneumoniae', lastUpdated: '2026-08-20', antibiotics: [{ name: 'Ceftriaxone', resistant: 42, intermediate: 8, susceptible: 50 }, { name: 'Ciprofloxacin', resistant: 35, intermediate: 10, susceptible: 55 }, { name: 'Meropenem', resistant: 8, intermediate: 4, susceptible: 88 }] },
  { organism: 'Pseudomonas aeruginosa', lastUpdated: '2026-08-20', antibiotics: [{ name: 'Piperacillin', resistant: 15, intermediate: 10, susceptible: 75 }, { name: 'Meropenem', resistant: 10, intermediate: 5, susceptible: 85 }, { name: 'Amikacin', resistant: 8, intermediate: 5, susceptible: 87 }] },
];

const COLORS = { resistant: 'bg-red-500', intermediate: 'bg-yellow-500', susceptible: 'bg-green-500' };

export default function DrugResistanceSurveillance() {
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
          title="Add New Pharmacy"
          fields={[{"name": "drugName", "label": "Drug Name", "type": "text", "placeholder": "e.g. Paracetamol 500mg", "required": true}, {"name": "genericName", "label": "Generic Name", "type": "text", "placeholder": "e.g. Acetaminophen"}, {"name": "category", "label": "Category", "type": "select", "options": ["Analgesic", "Antibiotic", "Antimalarial", "Antihypertensive", "Antidiabetic", "Vitamin", "Other"]}, {"name": "dosageForm", "label": "Dosage Form", "type": "select", "options": ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler"]}, {"name": "strength", "label": "Strength", "type": "text", "placeholder": "e.g. 500mg"}, {"name": "quantity", "label": "Quantity", "type": "number", "placeholder": "0", "required": true}, {"name": "unitPrice", "label": "Unit Price (GH₵)", "type": "number", "placeholder": "0.00", "required": true}, {"name": "batchNumber", "label": "Batch Number", "type": "text", "placeholder": "BAT-XXXX"}, {"name": "expiryDate", "label": "Expiry Date", "type": "date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Drug Resistance Surveillance</h1><p className="text-gray-500">Antimicrobial resistance tracking, antibiogram generation, and AMR monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Organisms Tracked', value: RESISTANCE.length, color: 'text-blue-600' }, { label: 'MDR Organisms', value: 2, color: 'text-red-600' }, { label: 'Last Updated', value: 'Aug 2026', color: 'text-green-600' }, { label: 'Total Tests', value: '1,250', color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-6">
        {RESISTANCE.map(r => (
          <div key={r.organism} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg">{r.organism}</h3><span className="text-xs text-gray-500">Updated: {r.lastUpdated}</span></div>
            <div className="space-y-3">
              {r.antibiotics.map(a => (
                <div key={a.name}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium">{a.name}</span></div>
                  <div className="flex h-6 rounded overflow-hidden">
                    <div className={`${COLORS.resistant} flex items-center justify-center text-white text-xs font-bold`} style={{ width: `${a.resistant}%` }}>{a.resistant > 10 ? `${a.resistant}%` : ''}</div>
                    <div className={`${COLORS.intermediate} flex items-center justify-center text-white text-xs font-bold`} style={{ width: `${a.intermediate}%` }}>{a.intermediate > 10 ? `${a.intermediate}%` : ''}</div>
                    <div className={`${COLORS.susceptible} flex items-center justify-center text-white text-xs font-bold`} style={{ width: `${a.susceptible}%` }}>{a.susceptible > 10 ? `${a.susceptible}%` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.resistant}`} /> Resistant</div>
          <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.intermediate}`} /> Intermediate</div>
          <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.susceptible}`} /> Susceptible</div>
        </div>
      </div>
    </div>
  );
}
