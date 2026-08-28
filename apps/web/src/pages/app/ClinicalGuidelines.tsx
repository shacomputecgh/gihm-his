import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, Field, Icon, Input, PageHeader, Select } from '../../components/ui';

interface Guideline {
  id: string;
  title: string;
  condition: string;
  category: string;
  severity: string;
  source: string;
  lastUpdated: string;
  firstLine: string[];
  secondLine: string[];
  supportive: string[];
  monitoring: string[];
  referral: string[];
  prevention: string[];
  notes: string[];
}

const GUIDELINES: Guideline[] = [
  {
    id: 'malaria-uncomplicated',
    title: 'Uncomplicated Malaria',
    condition: 'Malaria (P. falciparum)',
    category: 'INFECTIOUS',
    severity: 'MODERATE',
    source: 'Ghana National Malaria Control Programme / WHO',
    lastUpdated: '2024-01',
    firstLine: [
      'Artemether-Lumefantrine (ACT) — weight-based dosing over 3 days',
      'Take with fatty food for optimal absorption',
    ],
    secondLine: [
      'Artesunate-Amodiaquine (ASAQ) if AL unavailable',
      'Dihydroartemisinin-Piperaquine (DHA-PPQ)',
    ],
    supportive: [
      'Paracetamol 15mg/kg q6h for fever (max 4g/day adults)',
      'ORS for dehydration',
      'Monitor for severe malaria signs',
    ],
    monitoring: [
      'Repeat RDT at day 3 to confirm clearance',
      'Watch for delayed haemolysis (day 7-14)',
      'Monitor Hb if anaemic',
    ],
    referral: [
      'Refer if: persistent vomiting, unable to take oral, prostration, severe anaemia (Hb<5), Jaundice, renal impairment',
      'IV artesunate for severe malaria',
    ],
    prevention: [
      'Insecticide-treated nets (ITNs)',
      'Indoor residual spraying (IRS)',
      'IPTp for pregnant women (SP at each ANC visit)',
      'Prompt treatment within 24h of fever onset',
    ],
    notes: [
      'Ghana endemic — test ALL fever cases with RDT before treatment',
      'Do NOT use chloroquine monotherapy (resistance)',
      'Monitor for recrudescence vs reinfection',
    ],
  },
  {
    id: 'hiv-firstline',
    title: 'HIV/AIDS — First-Line ART',
    condition: 'HIV/AIDS',
    category: 'INFECTIOUS',
    severity: 'SEVERE',
    source: 'Ghana National AIDS Control Programme / WHO',
    lastUpdated: '2024-01',
    firstLine: [
      'Tenofovir + Lamivudine + Dolutegravir (TLD) — 1 tablet once daily',
      'Start ART as soon as possible after diagnosis (same-day ART)',
    ],
    secondLine: [
      'Tenofovir + Lamivudine + Efavirenz (TLE) if DTG not tolerated',
      'AZT + 3TC + DTG for second-line',
    ],
    supportive: [
      'Cotrimoxazole 480mg daily (PCP prophylaxis)',
      'Vitamin A for children',
      'Isoniazid Preventive Therapy (IPT) for TB prevention',
    ],
    monitoring: [
      'Viral load at 6 months, then annually',
      'CD4 count at baseline',
      'FBC, LFTs at baseline and 3 months',
      'Weight and BMI monitoring',
    ],
    referral: [
      'Refer for: treatment failure (VL >1000 after 6 months adherence)',
      'TB co-infection requiring TB treatment',
      'Pregnancy (ART continuation with monitoring)',
    ],
    prevention: [
      'PMTCT: Start ART immediately in pregnancy',
      'PrEP for high-risk individuals',
      'Male circumcision (VMMC)',
      'Condom use',
    ],
    notes: [
      'Test ALL pregnant women for HIV at first ANC',
      'DTG preferred in pregnancy (now safe per WHO)',
      'Avoid efavirenz in first trimester if possible',
      'Adherence counselling is critical — 95%+ adherence needed',
    ],
  },
  {
    id: 'tb-treatment',
    title: 'Pulmonary Tuberculosis',
    condition: 'Tuberculosis',
    category: 'INFECTIOUS',
    severity: 'SEVERE',
    source: 'Ghana National TB Control Programme / WHO',
    lastUpdated: '2024-01',
    firstLine: [
      'Intensive phase (2 months): RHZE — Rifampicin, Isoniazid, Pyrazinamide, Ethambutol',
      'Continuation phase (4 months): RH — Rifampicin, Isoniazid',
      'DOTS directly observed therapy',
    ],
    secondLine: [
      'For MDR-TB: Refer to national MDR-TB centre',
      'Do NOT use fluoroquinolones as first-line',
    ],
    supportive: [
      'Pyridoxine (Vitamin B6) 10-25mg daily with INH',
      'Nutritional support',
      'Good ventilation in living space',
    ],
    monitoring: [
      'Sputum microscopy at month 2, 5, 6',
      'LFTs at baseline and monthly for first 2 months',
      'Visual acuity check for ethambutol',
      'Weight monitoring',
    ],
    referral: [
      'Refer for: MDR-TB suspected, HIV co-infection requiring ART',
      'Drug-resistant TB contact tracing',
      'Extrapulmonary TB requiring specialist care',
    ],
    prevention: [
      'BCG vaccination at birth',
      'TPT for HIV+ and household contacts',
      'Early detection and treatment',
      'Contact tracing',
    ],
    notes: [
      'Report all TB cases to District Health Directorate',
      'Treatment is FREE in Ghana',
      'Do not stop treatment early — risk of drug resistance',
      'Rifampicin interacts with many drugs (ART, OCPs, warfarin)',
    ],
  },
  {
    id: 'cholera',
    title: 'Cholera Management',
    condition: 'Cholera',
    category: 'INFECTIOUS',
    severity: 'LIFE_THREATENING',
    source: 'WHO / Ghana Health Service',
    lastUpdated: '2024-01',
    firstLine: [
      'Aggressive rehydration: ORS ad libitum',
      'Severe dehydration: Ringer\'s Lactate IV 100ml/kg in 3h (adults)',
      'Zinc 20mg/day for children x10 days',
    ],
    secondLine: [
      'Doxycycline 300mg single dose (adults)',
      'Azithromycin 1g single dose (children, pregnant women)',
    ],
    supportive: [
      'Continue breastfeeding during diarrhoea',
      'Rice-based ORS if available',
      'Anti-emetics if persistent vomiting',
    ],
    monitoring: [
      'Strict fluid balance chart',
      'Urine output (target >1ml/kg/h)',
      'Skin pinch test for dehydration',
      'Sunken eyes, dry mouth assessment',
    ],
    referral: [
      'Refer severe cases to cholera treatment centre',
      'Transfer for: persistent vomiting, unable to drink, severe dehydration, unconscious',
    ],
    prevention: [
      'Safe water: boil, treat, or filter',
      'Hand washing with soap',
      'Oral cholera vaccine (OCV) in outbreaks',
      'Proper sanitation and waste disposal',
    ],
    notes: [
      'Oral rehydration saves lives — do not delay',
      'IV fluids for severe dehydration only',
      'ORAL feeding should continue alongside IV fluids',
      'Report immediately to District Health Directorate',
    ],
  },
  {
    id: 'pneumonia-childhood',
    title: 'Childhood Pneumonia (IMCI)',
    condition: 'Pneumonia (Childhood)',
    category: 'INFECTIOUS',
    severity: 'SEVERE',
    source: 'WHO IMCI Guidelines / Ghana',
    lastUpdated: '2024-01',
    firstLine: [
      'Amoxicillin dispersible tablet 25mg/kg q8h x5 days (non-severe)',
      'If unable to take oral: Amoxicillin IM 50mg/kg single dose',
    ],
    secondLine: [
      'Amoxicillin-Clavulanate 45mg/kg/day q12h x5-7 days',
      'Ceftriaxone 50-100mg/kg IV/IM daily (severe pneumonia)',
    ],
    supportive: [
      'Paracetamol 15mg/kg q6h for fever',
      'ORS if dehydrated',
      'Encourage continued feeding and breastfeeding',
      'Oxygen if SpO2 <90%',
    ],
    monitoring: [
      'Respiratory rate counting for full 60 seconds',
      'Chest indrawing assessment',
      'Ability to drink/breastfeed',
      'Danger signs: unable to drink, convulsions, lethargy',
    ],
    referral: [
      'IMMEDIATE referral for: chest indrawing, inability to drink, convulsions, central cyanosis, SpO2 <90%',
      'Give first dose of antibiotic before referral',
    ],
    prevention: [
      'PCV (Pneumococcal Conjugate Vaccine) — part of EPI',
      'Hib vaccine — part of EPI',
      'Exclusive breastfeeding for first 6 months',
      'Reduce indoor air pollution (improved cookstoves)',
    ],
    notes: [
      'IMCI classification: PNEUMONIA if fast breathing + cough',
      'Fast breathing: >60/min (<2mo), >50/min (2-12mo), >40/min (1-5y)',
      'Complete full course even if child improves',
    ],
  },
  {
    id: 'diarrhoea-ors',
    title: 'Acute Diarrhoea with Dehydration (ORS)',
    condition: 'Acute Diarrhoeal Disease',
    category: 'INFECTIOUS',
    severity: 'MODERATE',
    source: 'WHO / Ghana Health Service',
    lastUpdated: '2024-01',
    firstLine: [
      'ORS: Low-osmolarity formula, ad libitum after each loose stool',
      'Zinc 20mg/day x10-14 days (children ≥6 months)',
      'Zinc 10mg/day x10-14 days (children <6 months)',
    ],
    secondLine: [
      'IV Ringer\'s Lactate if severe dehydration and unable to tolerate ORS',
      'Metronidazole only if amoebic dysentery confirmed',
    ],
    supportive: [
      'Continue breastfeeding and age-appropriate feeding',
      'Avoid fruit juices and carbonated drinks',
      'Anti-emetics (ondansetron) if persistent vomiting blocks ORS',
    ],
    monitoring: [
      'Assess dehydration: None / Some / Severe',
      'Skin pinch, eyes, drinking ability, tears, fontanelle (infants)',
      'Urine output',
      'Weight monitoring',
    ],
    referral: [
      'Refer for severe dehydration: lethargy, unconscious, unable to drink, sunken eyes, no tears, skin pinch returns >2s',
    ],
    prevention: [
      'Exclusive breastfeeding for first 6 months',
      'Rotavirus vaccine — part of EPI',
      'Safe water and sanitation',
      'Hand washing with soap',
    ],
    notes: [
      'ORS is the most important treatment — reduces mortality by 50%',
      'Zinc reduces duration and severity',
      'Do NOT use antibiotics for watery diarrhoea',
      'Continue feeding — do NOT starve a child with diarrhoea',
    ],
  },
];

export default function ClinicalGuidelines() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Guideline | null>(null);

  const filtered = GUIDELINES.filter((g) => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()) && !g.condition.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && g.category !== category) return false;
    return true;
  });

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
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
      <PageHeader
        title="📋 Clinical Guidelines"
        subtitle="Evidence-based treatment protocols for common conditions in Ghana — sourced from WHO, Ghana Health Service, and national programmes."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Field label="Search guidelines">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by condition or guideline name…" className="pl-9" />
              </div>
            </Field>
          </div>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              <option value="INFECTIOUS">Infectious Diseases</option>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelected(selected?.id === g.id ? null : g)}
            className={`cursor-pointer rounded-xl border p-4 text-left transition ${
              selected?.id === g.id ? 'border-g-red bg-g-red/5 shadow-md' : 'border-slate-200 bg-white hover:border-g-red/30 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-g-ink">{g.title}</p>
                <p className="text-xs text-slate-500">{g.condition}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                g.severity === 'LIFE_THREATENING' ? 'bg-red-100 text-red-800' :
                g.severity === 'SEVERE' ? 'bg-orange-100 text-orange-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {g.severity.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge tone="blue">{(g.source.split('/')[0] ?? '').trim()}</Badge>
              <Badge tone="gray">Updated {g.lastUpdated}</Badge>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <Card title={selected.title} subtitle={selected.condition}>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs font-bold uppercase text-green-600">✅ First-Line Treatment</p>
              <ul className="mt-1 space-y-1">
                {selected.firstLine.map((t, i) => <li key={i} className="text-sm text-green-900">• {t}</li>)}
              </ul>
            </div>

            {selected.secondLine.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-bold uppercase text-amber-600">🔄 Second-Line / Alternative</p>
                <ul className="mt-1 space-y-1">
                  {selected.secondLine.map((t, i) => <li key={i} className="text-sm text-amber-900">• {t}</li>)}
                </ul>
              </div>
            )}

            {selected.supportive.length > 0 && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-bold uppercase text-blue-600">💊 Supportive Care</p>
                <ul className="mt-1 space-y-1">
                  {selected.supportive.map((t, i) => <li key={i} className="text-sm text-blue-900">• {t}</li>)}
                </ul>
              </div>
            )}

            {selected.monitoring.length > 0 && (
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="text-xs font-bold uppercase text-purple-600">📊 Monitoring</p>
                <ul className="mt-1 space-y-1">
                  {selected.monitoring.map((t, i) => <li key={i} className="text-sm text-purple-900">• {t}</li>)}
                </ul>
              </div>
            )}

            {selected.referral.length > 0 && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs font-bold uppercase text-red-600">🏥 Referral Criteria</p>
                <ul className="mt-1 space-y-1">
                  {selected.referral.map((t, i) => <li key={i} className="text-sm text-red-900">• {t}</li>)}
                </ul>
              </div>
            )}

            {selected.prevention.length > 0 && (
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="text-xs font-bold uppercase text-teal-600">🛡️ Prevention</p>
                <ul className="mt-1 space-y-1">
                  {selected.prevention.map((t, i) => <li key={i} className="text-sm text-teal-900">• {t}</li>)}
                </ul>
              </div>
            )}

            {selected.notes.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-600">📝 Notes</p>
                <ul className="mt-1 space-y-1">
                  {selected.notes.map((t, i) => <li key={i} className="text-xs text-slate-700">• {t}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      <p className="text-[11px] text-slate-400">
        Sourced from WHO, Ghana Health Service, and national disease control programmes. For clinical reference only.
      </p>
    </div>
  );
}
