import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { Badge, Button, Card, Field, Icon, Input, useToast } from './ui';

interface Interaction {
  drug1: string;
  drug2: string;
  severity: string;
  description: string;
}

interface InteractionResult {
  drugsChecked: string[];
  notFound: string[];
  interactions: Interaction[];
  warnings: string[];
  totalInteractions: number;
  totalWarnings: number;
  safe: boolean;
}

export default function DrugInteractionChecker() {
  const toast = useToast();
  const [drugs, setDrugs] = useState<string[]>(['', '']);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);

  function addDrugField() {
    if (drugs.length < 10) setDrugs([...drugs, '']);
  }

  function removeDrugField(index: number) {
    if (drugs.length > 2) setDrugs(drugs.filter((_, i) => i !== index));
  }

  function updateDrug(index: number, value: string) {
    const updated = [...drugs];
    updated[index] = value;
    setDrugs(updated);
  }

  async function checkInteractions(e: FormEvent) {
    e.preventDefault();
    const validDrugs = drugs.filter((d) => d.trim());
    if (validDrugs.length < 2) {
      toast('Please enter at least 2 drugs', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api<InteractionResult>('/clinical/patient-interactions', {
        method: 'POST',
        body: { drugNames: validDrugs },
      });
      setResult(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Check failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Drug Interaction Checker" subtitle="Check for interactions between patient medications">
      <form onSubmit={(e) => void checkInteractions(e)} className="space-y-3">
        {drugs.map((drug, i) => (
          <div key={i} className="flex gap-2">
            <Field label={i === 0 ? 'Drug 1' : i === 1 ? 'Drug 2' : `Drug ${i + 1}`} className="flex-1">
              <Input
                value={drug}
                onChange={(e) => updateDrug(i, e.target.value)}
                placeholder={`Enter drug name (e.g. ${['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Metformin', 'Amlodipine'][i % 5]})`}
              />
            </Field>
            {drugs.length > 2 && (
              <button
                type="button"
                onClick={() => removeDrugField(i)}
                className="mb-1 mt-6 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          {drugs.length < 10 && (
            <Button type="button" variant="outline" onClick={addDrugField}>
              + Add drug
            </Button>
          )}
          <Button variant="green" type="submit" loading={loading}>
            Check interactions
          </Button>
        </div>
      </form>

      {result && (
        <div className="mt-4 space-y-3">
          {/* Safe / Unsafe banner */}
          {result.safe ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                ✅ No interactions found between {result.drugsChecked.join(', ')}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">
                ⚠️ Found {result.totalInteractions} interaction(s) and {result.totalWarnings} warning(s)
              </p>
            </div>
          )}

          {/* Interactions */}
          {result.interactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400">Drug Interactions</p>
              {result.interactions.map((int, i) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="gold">{int.severity}</Badge>
                    <span className="text-sm font-semibold text-g-ink">{int.drug1}</span>
                    <span className="text-xs text-slate-400">↔</span>
                    <span className="text-sm font-semibold text-g-ink">{int.drug2}</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">{int.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400">Warnings</p>
              {result.warnings.map((warn, i) => (
                <div key={i} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  {warn}
                </div>
              ))}
            </div>
          )}

          {/* Not found */}
          {result.notFound.length > 0 && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Not found in database: {result.notFound.join(', ')}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
