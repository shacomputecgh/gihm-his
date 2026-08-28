import { useState } from 'react';
import { api } from '../lib/api';
import { Badge, Button, Card, EmptyState, Icon, Input, Spinner, useToast } from './ui';

interface Patient {
  id: string;
  fullName: string;
  mrn: string;
  dateOfBirth?: string;
}

interface Prescription {
  id: string;
  medicine: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  status: string;
  prescribedAt: string;
}

interface ReconciliationResult {
  patient: Patient;
  activeMedications: string[];
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: string;
    description: string;
  }>;
  warnings: string[];
  duplicates: string[];
  recommendations: string[];
  score: number; // 0-100 safety score
}

export default function MedicationReconciliation() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchPatient(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(searchQuery)}&pageSize=5`);
      setSearchResults(res.items);
    } catch {
      toast('Search failed', 'error');
    } finally {
      setSearching(false);
    }
  }

  async function loadPatientMedications(patient: Patient) {
    setSelectedPatient(patient);
    setSearchResults([]);
    setLoading(true);
    setReconciliation(null);
    try {
      const res = await api<Patient>(`/patients/${patient.id}`);
      const meds = ((res as any).prescriptions ?? []).filter((p: Prescription) => p.status === 'ACTIVE' || p.status === 'PARTIAL');
      setPrescriptions(meds);
      // Run reconciliation
      if (meds.length >= 2) {
        const drugNames = meds.map((m: Prescription) => m.medicine);
        const interactionRes = await api<{
          drugsChecked: string[];
          interactions: Array<{ drug1: string; drug2: string; severity: string; description: string }>;
          warnings: string[];
          totalInteractions: number;
          totalWarnings: number;
          safe: boolean;
        }>('/clinical/patient-interactions', {
          method: 'POST',
          body: { drugNames },
        });

        // Check for duplicate active ingredients
        const generics = meds.map((m: Prescription) => m.medicine.toLowerCase());
        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const g of generics) {
          if (seen.has(g)) duplicates.push(g);
          seen.add(g);
        }

        // Calculate safety score
        let score = 100;
        score -= interactionRes.totalInteractions * 15;
        score -= interactionRes.totalWarnings * 5;
        score -= duplicates.length * 20;
        score = Math.max(0, Math.min(100, score));

        // Generate recommendations
        const recommendations: string[] = [];
        if (interactionRes.totalInteractions > 0) {
          recommendations.push('Review drug interactions — consider alternative medications or close monitoring');
        }
        if (duplicates.length > 0) {
          recommendations.push('Duplicate medications detected — verify with prescriber');
        }
        if (meds.length > 5) {
          recommendations.push('High medication burden — consider deprescribing review');
        }
        if (meds.some((m: Prescription) => m.route === 'IV') && meds.some((m: Prescription) => m.route === 'ORAL')) {
          recommendations.push('Consider IV-to-oral switch where possible');
        }

        setReconciliation({
          patient,
          activeMedications: drugNames,
          interactions: interactionRes.interactions,
          warnings: interactionRes.warnings,
          duplicates,
          recommendations,
          score,
        });
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load medications', 'error');
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  }

  return (
    <div className="space-y-6">
      {/* Patient Search */}
      <Card title="🔍 Medication Reconciliation" subtitle="Review all active medications for a patient and check for interactions, duplicates, and safety concerns">
        <form onSubmit={(e) => void searchPatient(e)} className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchResults([]); }}
              placeholder="Search patient by name or MRN…"
              className="pl-9"
            />
          </div>
          <Button variant="green" loading={searching}>Search</Button>
        </form>
        {searchResults.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            {searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => void loadPatientMedications(p)}
                className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-2.5 text-left last:border-0 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-g-ink">{p.fullName}</p>
                  <p className="text-xs text-slate-400">{p.mrn}</p>
                </div>
                <Button size="sm" variant="outline">Select</Button>
              </button>
            ))}
          </div>
        )}
      </Card>

      {loading && <Spinner />}

      {reconciliation && (
        <>
          {/* Safety Score */}
          <Card>
            <div className="flex items-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${getScoreColor(reconciliation.score)}`}>
                <span className="text-2xl font-bold">{reconciliation.score}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-g-ink">Safety Score for {reconciliation.patient.fullName}</p>
                <p className="text-sm text-slate-500">
                  {reconciliation.activeMedications.length} active medication(s) ·{' '}
                  {reconciliation.interactions.length} interaction(s) ·{' '}
                  {reconciliation.warnings.length} warning(s) ·{' '}
                  {reconciliation.duplicates.length} duplicate(s)
                </p>
              </div>
            </div>
          </Card>

          {/* Active Medications */}
          <Card title="💊 Active Medications" subtitle={`${prescriptions.length} prescription(s)`}>
            <div className="space-y-2">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-g-ink">{rx.medicine}</p>
                    <p className="text-xs text-slate-400">
                      {rx.dosage ?? '—'} · {rx.frequency ?? '—'} · {rx.route ?? 'Oral'} · {rx.duration ?? '—'}
                    </p>
                  </div>
                  <Badge tone={rx.status === 'ACTIVE' ? 'gold' : 'blue'}>{rx.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Interactions */}
          {reconciliation.interactions.length > 0 && (
            <Card title="⚠️ Drug Interactions" subtitle="Potential interactions between active medications">
              <div className="space-y-2">
                {reconciliation.interactions.map((int, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="gold">{int.severity}</Badge>
                      <span className="text-sm font-semibold text-g-ink">{int.drug1} ↔ {int.drug2}</span>
                    </div>
                    <p className="mt-1 text-xs text-amber-800">{int.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Duplicates */}
          {reconciliation.duplicates.length > 0 && (
            <Card title="🔄 Duplicate Medications" subtitle="Same active ingredient prescribed multiple times">
              <div className="space-y-1">
                {reconciliation.duplicates.map((d, i) => (
                  <div key={i} className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">
                    ⚠️ Duplicate: <strong>{d}</strong>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {reconciliation.recommendations.length > 0 && (
            <Card title="📋 Recommendations" subtitle="Clinical suggestions based on reconciliation">
              <div className="space-y-2">
                {reconciliation.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2">
                    <span className="text-blue-600">💡</span>
                    <p className="text-sm text-blue-900">{r}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {selectedPatient && prescriptions.length === 0 && !loading && (
        <EmptyState icon="pill" title="No active medications" message={`${selectedPatient.fullName} has no active prescriptions.`} />
      )}
    </div>
  );
}
