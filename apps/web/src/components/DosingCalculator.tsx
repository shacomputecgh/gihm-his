import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Button, Card, Field, Icon, Input, Select, useToast } from './ui';

interface Drug {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  adultDose?: string;
  pediatricDose?: string;
  maxDailyDose?: string;
  route?: string;
  frequency?: string;
  pregnancyCategory?: string;
  controlledSchedule?: string;
  description?: string;
}

interface DosingResult {
  drug: Drug;
  weight: number;
  ageGroup: string;
  calculatedDose: string;
  frequency: string;
  maxDailyDose: string;
  route: string;
  warnings: string[];
  notes: string[];
}

// Common drug dosing rules (mg/kg based)
const DOSING_RULES: Record<string, {
  adultMgPerKg?: number;
  pediatricMgPerKg?: number;
  frequency?: string;
  maxDaily?: string;
  renalAdjust?: boolean;
  hepaticAdjust?: boolean;
}> = {
  'Paracetamol': { adultMgPerKg: 15, pediatricMgPerKg: 15, frequency: 'q6h', maxDaily: '60mg/kg/day (max 4g)', renalAdjust: true },
  'Ibuprofen': { adultMgPerKg: 10, pediatricMgPerKg: 10, frequency: 'q8h', maxDaily: '30mg/kg/day', renalAdjust: true },
  'Amoxicillin': { adultMgPerKg: 25, pediatricMgPerKg: 25, frequency: 'q8h', maxDaily: '80mg/kg/day (max 3g)' },
  'Metronidazole': { adultMgPerKg: 7.5, pediatricMgPerKg: 7.5, frequency: 'q8h', maxDaily: '40mg/kg/day' },
  'Ciprofloxacin': { adultMgPerKg: 10, pediatricMgPerKg: 10, frequency: 'q12h', maxDaily: '30mg/kg/day (max 1.5g)', renalAdjust: true },
  'Doxycycline': { adultMgPerKg: 2.2, frequency: 'q12h', maxDaily: '200mg/day' },
  'Azithromycin': { adultMgPerKg: 10, pediatricMgPerKg: 10, frequency: 'ONCE_DAILY', maxDaily: '500mg/day' },
  'Ceftriaxone': { adultMgPerKg: 25, pediatricMgPerKg: 50, frequency: 'ONCE_DAILY', maxDaily: '4g/day', renalAdjust: true },
  'Gentamicin': { adultMgPerKg: 5, pediatricMgPerKg: 7.5, frequency: 'ONCE_DAILY', maxDaily: '5mg/kg/day', renalAdjust: true },
  'Artemether-Lumefantrine': { frequency: 'Weight-based schedule' },
  'Artesunate': { adultMgPerKg: 2.4, pediatricMgPerKg: 2.4, frequency: 'q12h x24h then daily', maxDaily: '4.8mg/kg/day' },
  'ORS': { frequency: 'Ad libitum', maxDaily: 'As much as tolerated' },
  'Albendazole': { adultMgPerKg: 10, pediatricMgPerKg: 10, frequency: 'Single dose', maxDaily: '400mg single dose' },
  'Metformin': { adultMgPerKg: 10, pediatricMgPerKg: 10, frequency: 'q12h with meals', maxDaily: '2550mg/day', renalAdjust: true },
  'Omeprazole': { adultMgPerKg: 1, pediatricMgPerKg: 1, frequency: 'ONCE_DAILY', maxDaily: '40mg/day' },
  'Prednisolone': { adultMgPerKg: 1, pediatricMgPerKg: 1, frequency: 'ONCE_DAILY', maxDaily: '60mg/day' },
  'Tramadol': { adultMgPerKg: 2, pediatricMgPerKg: 2, frequency: 'q6h', maxDaily: '8mg/kg/day (max 400mg)', renalAdjust: true },
  'Salbutamol (Inhaler)': { frequency: '1-2 puffs q4-6h PRN', maxDaily: '12 puffs/day' },
  'Ondansetron': { adultMgPerKg: 0.15, pediatricMgPerKg: 0.15, frequency: 'q8h', maxDaily: '16mg/day (adults)' },
  'Diazepam': { adultMgPerKg: 0.2, pediatricMgPerKg: 0.2, frequency: 'q8h', maxDaily: '40mg/day', renalAdjust: true },
  'Cotrimoxazole': { adultMgPerKg: 5, pediatricMgPerKg: 5, frequency: 'q12h', maxDaily: '20mg/kg/day TMP component' },
  'Fluconazole': { adultMgPerKg: 3, pediatricMgPerKg: 3, frequency: 'ONCE_DAILY', maxDaily: '400mg/day', renalAdjust: true },
  'Clotrimazole': { frequency: 'Apply 2-3 times daily', maxDaily: 'Topical' },
  'Praziquantel': { adultMgPerKg: 40, pediatricMgPerKg: 40, frequency: 'Single dose or divided x3', maxDaily: '60mg/kg/day' },
  'Ivermectin': { adultMgPerKg: 0.2, pediatricMgPerKg: 0.2, frequency: 'Single dose', maxDaily: '12mg single dose' },
};

function calculateDosing(drug: Drug, weightKg: number, ageYears: number, renalFunction: string): DosingResult {
  const result: DosingResult = {
    drug,
    weight: weightKg,
    ageGroup: ageYears < 2 ? 'Infant (0-2y)' : ageYears < 12 ? 'Child (2-12y)' : ageYears < 18 ? 'Adolescent' : 'Adult',
    calculatedDose: drug.adultDose ?? 'See protocol',
    frequency: drug.frequency ?? 'See protocol',
    maxDailyDose: drug.maxDailyDose ?? 'See protocol',
    route: drug.route ?? 'ORAL',
    warnings: [],
    notes: [],
  };

  const rules = DOSING_RULES[drug.name];

  if (rules) {
    // Calculate weight-based dose
    if (ageYears < 18 && rules.pediatricMgPerKg) {
      const doseMg = Math.round(rules.pediatricMgPerKg * weightKg);
      result.calculatedDose = `${doseMg}mg`;
      result.notes.push(`Weight-based: ${rules.pediatricMgPerKg}mg/kg × ${weightKg}kg = ${doseMg}mg`);

      // Cap at adult dose
      if (drug.adultDose) {
        result.notes.push(`Adult dose: ${drug.adultDose}`);
      }
    } else if (ageYears >= 18 && rules.adultMgPerKg) {
      const doseMg = Math.round(rules.adultMgPerKg * weightKg);
      result.calculatedDose = `${doseMg}mg`;
      result.notes.push(`Weight-based: ${rules.adultMgPerKg}mg/kg × ${weightKg}kg = ${doseMg}mg`);
    }

    if (rules.frequency) result.frequency = rules.frequency;
    if (rules.maxDaily) result.maxDailyDose = rules.maxDaily;

    // Renal adjustment warnings
    if (rules.renalAdjust && renalFunction !== 'NORMAL') {
      result.warnings.push(`⚠️ Renal dose adjustment required for ${drug.name} in ${renalFunction} renal function`);
      if (renalFunction === 'SEVERE') {
        result.notes.push('Consider alternative drug or extended dosing interval');
      }
    }

    // Hepatic adjustment
    if (rules.hepaticAdjust) {
      result.warnings.push(`⚠️ Hepatic dose adjustment may be required for ${drug.name}`);
    }
  }

  // Pregnancy warnings
  if (drug.pregnancyCategory === 'D' || drug.pregnancyCategory === 'X') {
    result.warnings.push(`🤰 Pregnancy Category ${drug.pregnancyCategory} — contraindicated or to be avoided in pregnancy`);
  }

  // Controlled substance warnings
  if (drug.controlledSchedule) {
    result.warnings.push(`📋 Controlled substance (${drug.controlledSchedule}) — prescription regulations apply`);
  }

  // Pediatric-specific warnings
  if (ageYears < 2) {
    if (drug.name === 'Aspirin') result.warnings.push('🚫 CONTRAINDICATED in children <16 years (Reye syndrome risk)');
    if (drug.name === 'Doxycycline') result.warnings.push('🚫 Not recommended in children <8 years (dental staining)');
    if (drug.name === 'Ciprofloxacin') result.warnings.push('🚫 Not recommended in children <18 years (cartilage toxicity)');
  }

  return result;
}

export default function DosingCalculator() {
  const toast = useToast();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [, setLoading] = useState(true);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [drugSearch, setDrugSearch] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [renalFunction, setRenalFunction] = useState('NORMAL');
  const [result, setResult] = useState<DosingResult | null>(null);

  const loadDrugs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ items: Drug[] }>('/drugs?pageSize=500');
      setDrugs(res.items);
    } catch {
      toast('Failed to load drugs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrugs();
  }, [loadDrugs]);

  function calculate() {
    const drug = drugs.find((d) => d.id === selectedDrug);
    if (!drug) { toast('Please select a drug', 'error'); return; }
    const weightKg = parseFloat(weight);
    const ageYears = parseFloat(age);
    if (isNaN(weightKg) || weightKg <= 0) { toast('Please enter a valid weight', 'error'); return; }
    if (isNaN(ageYears) || ageYears < 0) { toast('Please enter a valid age', 'error'); return; }

    const dosing = calculateDosing(drug, weightKg, ageYears, renalFunction);
    setResult(dosing);
  }

  const filteredDrugs = drugSearch
    ? drugs.filter((d) => d.name.toLowerCase().includes(drugSearch.toLowerCase()) || d.genericName?.toLowerCase().includes(drugSearch.toLowerCase()))
    : drugs;

  return (
    <div className="space-y-6">
      <Card title="💊 Dosing Calculator" subtitle="Weight-based and renal-adjusted dosing for clinical reference">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Drug">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={drugSearch}
                onChange={(e) => { setDrugSearch(e.target.value); setSelectedDrug(''); setResult(null); }}
                placeholder="Search drug name…"
                className="pl-9"
              />
            </div>
            {drugSearch && !selectedDrug && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredDrugs.slice(0, 10).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-0"
                    onClick={() => { setSelectedDrug(d.id); setDrugSearch(d.name); }}
                  >
                    <span className="font-medium text-g-ink">{d.name}</span>
                    {d.genericName && <span className="ml-2 text-xs text-slate-400">{d.genericName}</span>}
                  </button>
                ))}
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 70"
                min="0.5"
                step="0.1"
              />
            </Field>
            <Field label="Age (years)">
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 35"
                min="0"
                step="0.1"
              />
            </Field>
          </div>

          <Field label="Renal Function">
            <Select value={renalFunction} onChange={(e) => setRenalFunction(e.target.value)}>
              <option value="NORMAL">Normal (eGFR &gt;60)</option>
              <option value="MILD">Mild impairment (eGFR 45-60)</option>
              <option value="MODERATE">Moderate impairment (eGFR 30-44)</option>
              <option value="SEVERE">Severe impairment (eGFR 15-29)</option>
              <option value="DIALYSIS">Dialysis (eGFR &lt;15)</option>
            </Select>
          </Field>

          <div className="flex items-end">
            <Button variant="green" onClick={calculate}>
              Calculate dose
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card title={`${result.drug.name} — Calculated Dose`} subtitle={`${result.ageGroup} · ${result.weight}kg`}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-[10px] font-bold uppercase text-blue-600">Calculated Dose</p>
                <p className="text-xl font-bold text-blue-900">{result.calculatedDose}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-[10px] font-bold uppercase text-green-600">Frequency</p>
                <p className="text-lg font-bold text-green-900">{result.frequency}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-[10px] font-bold uppercase text-amber-600">Max Daily</p>
                <p className="text-sm font-bold text-amber-900">{result.maxDailyDose}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-600">Route</p>
                <p className="text-lg font-bold text-slate-900">{result.route}</p>
              </div>
            </div>

            {result.drug.pediatricDose && (
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="text-xs font-bold text-teal-600">Pediatric Dose</p>
                <p className="text-sm text-teal-900">{result.drug.pediatricDose}</p>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-red-500">Warnings</p>
                {result.warnings.map((w, i) => (
                  <div key={i} className="rounded bg-red-50 px-3 py-1.5 text-xs text-red-800">{w}</div>
                ))}
              </div>
            )}

            {result.notes.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-slate-400">Notes</p>
                {result.notes.map((n, i) => (
                  <p key={i} className="text-xs text-slate-600">• {n}</p>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
