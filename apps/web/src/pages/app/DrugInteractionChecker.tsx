import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Field, Input, PageHeader } from '../../components/ui';

interface Drug {
  name: string;
  category: string;
  interactions: string[];
  severity: 'severe' | 'moderate' | 'mild';
}

const DRUG_DB: Drug[] = [
  { name: 'Warfarin', category: 'Anticoagulant', interactions: ['Aspirin', 'Ibuprofen', 'Amoxicillin', 'Metronidazole'], severity: 'severe' },
  { name: 'Metformin', category: 'Antidiabetic', interactions: ['Alcohol', 'Iodinated contrast', 'Cimetidine'], severity: 'moderate' },
  { name: 'Lisinopril', category: 'ACE Inhibitor', interactions: ['Potassium supplements', 'NSAIDs', 'Lithium'], severity: 'moderate' },
  { name: 'Amlodipine', category: 'Calcium Channel Blocker', interactions: ['Simvastatin', 'Cyclosporine'], severity: 'mild' },
  { name: 'Aspirin', category: 'NSAID', interactions: ['Warfarin', 'Ibuprofen', 'Methotrexate'], severity: 'severe' },
  { name: 'Ibuprofen', category: 'NSAID', interactions: ['Warfarin', 'Aspirin', 'Lithium', 'ACE inhibitors'], severity: 'severe' },
  { name: 'Amoxicillin', category: 'Antibiotic', interactions: ['Warfarin', 'Methotrexate'], severity: 'moderate' },
  { name: 'Paracetamol', category: 'Analgesic', interactions: ['Warfarin', 'Isoniazid'], severity: 'mild' },
  { name: 'Omeprazole', category: 'PPI', interactions: ['Clopidogrel', 'Methotrexate'], severity: 'moderate' },
  { name: 'Atorvastatin', category: 'Statin', interactions: ['Clarithromycin', 'Itraconazole', 'Grapefruit'], severity: 'moderate' },
  { name: 'Ciprofloxacin', category: 'Fluoroquinolone', interactions: ['Antacids', 'Iron supplements', 'Theophylline'], severity: 'moderate' },
  { name: 'Metronidazole', category: 'Antibiotic', interactions: ['Warfarin', 'Alcohol', 'Lithium'], severity: 'severe' },
];

const DEFAULT_SEVERITY = { color: 'border-slate-300 bg-slate-50', badge: 'bg-slate-100 text-slate-700', icon: '⚪', desc: 'Unknown' };
const SEVERITY_CONFIG: Record<string, { color: string; badge: string; icon: string; desc: string }> = {
  severe: { color: 'border-red-300 bg-red-50', badge: 'bg-red-100 text-red-700', icon: '🔴', desc: 'CRITICAL — Avoid combination or monitor closely' },
  moderate: { color: 'border-amber-300 bg-amber-50', badge: 'bg-amber-100 text-amber-700', icon: '🟡', desc: 'CAUTION — Use with monitoring' },
  mild: { color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-700', icon: '🔵', desc: 'LOW RISK — Generally safe' },
};

export default function DrugInteractionChecker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = DRUG_DB.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase())
  );

  function toggleDrug(name: string) {
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  }

  function findInteractions(): { drug1: string; drug2: string; severity: string }[] {
    const results: { drug1: string; drug2: string; severity: string }[] = [];
    for (const name of selected) {
      const drug = DRUG_DB.find((d) => d.name === name);
      if (!drug) continue;
      for (const inter of drug.interactions) {
        if (selected.includes(inter)) {
          const severity = drug.severity;
          if (!results.find((r) => (r.drug1 === name && r.drug2 === inter) || (r.drug1 === inter && r.drug2 === name))) {
            results.push({ drug1: name, drug2: inter, severity });
          }
        }
      }
    }
    return results;
  }

  const interactions = findInteractions();
  const hasSevere = interactions.some((i) => i.severity === 'severe');

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Lab"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "testType", "label": "Test Type", "type": "select", "options": ["Blood Test", "Urine Test", "Stool Test", "X-Ray", "Ultrasound", "ECG", "Biopsy"]}, {"name": "priority", "label": "Priority", "type": "select", "options": ["Routine", "Urgent", "STAT"]}, {"name": "clinicalHistory", "label": "Clinical History", "type": "textarea", "placeholder": "Relevant clinical information"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Drug Interaction Checker"
        subtitle="Select drugs to check for dangerous interactions before prescribing"
        action={selected.length > 0 ? <Badge tone={hasSevere ? 'red' : 'green'}>{selected.length} drugs selected · {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}</Badge> : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Drug Selection */}
        <Card title="Select Drugs">
          <Field label="Search">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drugs or categories..." />
          </Field>
          <div className="mt-3 max-h-96 space-y-1 overflow-y-auto">
            {filtered.map((d) => (
              <button
                key={d.name}
                onClick={() => toggleDrug(d.name)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selected.includes(d.name) ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.category}</p>
                </div>
                {selected.includes(d.name) && <span className="text-blue-600">✓</span>}
              </button>
            ))}
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {selected.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl">💊</span>
              <p className="mt-4 text-lg font-bold text-slate-700">Select drugs to check</p>
              <p className="mt-1 text-sm text-slate-400">Click drugs from the list to check for interactions</p>
            </Card>
          ) : interactions.length === 0 ? (
            <Card className="border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="text-lg font-bold text-green-700">No Interactions Found</p>
                  <p className="text-sm text-green-600">The selected {selected.length} drugs appear safe to use together.</p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {interactions.map((inter, i) => {
                const cfg = SEVERITY_CONFIG[inter.severity] ?? DEFAULT_SEVERITY;
                return (
                  <div key={i} className={`rounded-xl border-2 p-4 ${cfg.color}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cfg.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{inter.drug1}</span>
                          <span className="text-slate-400">×</span>
                          <span className="font-bold text-slate-800">{inter.drug2}</span>
                          <Badge className={cfg.badge}>{inter.severity.toUpperCase()}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{cfg.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Selected Drugs Summary */}
          {selected.length > 0 && (
            <Card title="Selected Drugs" subtitle={`${selected.length} drugs in the interaction check`}>
              <div className="flex flex-wrap gap-2">
                {selected.map((name) => {
                  return (
                    <button
                      key={name}
                      onClick={() => toggleDrug(name)}
                      className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-red-100 hover:text-red-700"
                    >
                      {name} ✕
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" className="mt-3" onClick={() => setSelected([])}>Clear All</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
