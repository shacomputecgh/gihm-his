import { useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { Page, Patient, StockForecastResult, StockItem } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Icon, Input, PageHeader, Select, useToast } from '../../components/ui';

/**
 * AI Services (docs/22 Phase 7 — spec §82–83). Deterministic assist features
 * computed live from platform records: documentation assist (SOAP draft from
 * an encounter), duplicate review (MPI candidates ranked), and forecasting
 * (linear-trend projection of the live indicator series). Every output carries
 * the mandatory "AI-generated — requires professional verification" label and
 * is never written to the record automatically.
 */

const AI_DISCLAIMER = 'AI-generated — requires professional verification. Draft output only; a licensed professional must review and approve before it becomes part of the record.';

const COLLECTED_INDICATORS: Array<{ code: string; name: string; unit: string }> = [
  { code: 'OPD_ATTENDANCE', name: 'OPD attendance', unit: 'visits' },
  { code: 'OPD_NEW', name: 'New OPD patients', unit: 'patients' },
  { code: 'ADMISSIONS', name: 'Inpatient admissions', unit: 'admissions' },
  { code: 'DISCHARGES', name: 'Inpatient discharges', unit: 'discharges' },
  { code: 'LAB_TESTS', name: 'Laboratory tests ordered', unit: 'tests' },
  { code: 'LAB_VERIFIED', name: 'Verified results', unit: 'results' },
  { code: 'CRITICAL_LABS', name: 'Critical results', unit: 'results' },
  { code: 'IMM_BCG', name: 'BCG doses given', unit: 'doses' },
  { code: 'DISEASE_CASES', name: 'Disease cases reported', unit: 'cases' },
  { code: 'BLOOD_DONATIONS', name: 'Blood donations', unit: 'donations' },
  { code: 'REVENUE', name: 'Revenue collected', unit: 'GHS' },
];

function Disclaimer() {
  return (
    <div className="rounded-md border border-g-gold/40 bg-g-gold/10 px-3 py-2 text-[11px] font-medium text-yellow-800">
      {AI_DISCLAIMER}
    </div>
  );
}

function PatientPicker({ onPick, placeholder = 'Search by name or MRN' }: { onPick: (p: Patient) => void; placeholder?: string }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  async function search(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    try {
      const page = await api<Page<Patient>>('/patients', { query: { q, pageSize: '8' } });
      setResults(page.items);
      setOpen(true);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="relative">
      <form onSubmit={(e) => void search(e)} className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-10" />
        </div>
        <Button variant="outline" loading={searching}>Search</Button>
      </form>
      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No patients found.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                className="block w-full cursor-pointer border-b border-slate-100 px-4 py-2.5 text-left last:border-0 hover:bg-slate-50"
                onClick={() => {
                  onPick(p);
                  setOpen(false);
                  setQ('');
                }}
              >
                <p className="text-sm font-semibold text-g-ink">{p.fullName}</p>
                <p className="text-[11px] text-slate-400">{p.mrn}{p.dateOfBirth ? ` · DOB ${p.dateOfBirth.slice(0, 10)}` : ''}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface DraftResult {
  draft: string;
  disclaimer: string;
  method: string;
  generatedAt: string;
  basedOn: string[];
}

interface DuplicateResult {
  patient: { id: string; mrn: string; fullName: string };
  candidates: Array<{ patientId: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; score: number; matchedOn: string[] }>;
}

interface ForecastResult {
  indicator: string;
  name: string;
  unit: string;
  months: Array<{ period: string; value: number | null; lower: number | null; upper: number | null }>;
  available: boolean;
  note: string | null;
  disclaimer: string;
  basedOn: string[];
}

export default function Ai() {
  const toast = useToast();
  const [draftPatient, setDraftPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<Array<{ id: string; type: string; createdAt: string; presentingComplaint: string | null }>>([]);
  const [encounterId, setEncounterId] = useState('');
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [dupPatient, setDupPatient] = useState<Patient | null>(null);
  const [dup, setDup] = useState<DuplicateResult | null>(null);
  const [dupBusy, setDupBusy] = useState(false);

  const [indicator, setIndicator] = useState('OPD_ATTENDANCE');
  const [months, setMonths] = useState('3');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [forecasting, setForecasting] = useState(false);

  async function loadEncounters(p: Patient) {
    setDraftPatient(p);
    setEncounters([]);
    setEncounterId('');
    setDraft(null);
    try {
      const rec = await api<Patient>(`/patients/${p.id}`);
      setEncounters((rec.encounters ?? []).slice(0, 10).map((e) => ({ id: e.id, type: e.type, createdAt: e.createdAt, presentingComplaint: e.presentingComplaint })));
    } catch {
      toast('Could not load encounters', 'error');
    }
  }

  async function generateDraft() {
    if (!encounterId) return;
    setDrafting(true);
    try {
      const res = await api<DraftResult>(`/ai/encounters/${encounterId}/draft-note`, { method: 'POST' });
      setDraft(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Draft failed', 'error');
    } finally {
      setDrafting(false);
    }
  }

  async function runDuplicates() {
    if (!dupPatient) return;
    setDupBusy(true);
    try {
      const res = await api<DuplicateResult>(`/ai/patients/${dupPatient.id}/duplicates`, { method: 'POST' });
      setDup(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Duplicate review failed', 'error');
    } finally {
      setDupBusy(false);
    }
  }

  async function runForecast() {
    setForecasting(true);
    try {
      const res = await api<ForecastResult>(`/ai/forecast/${indicator}`, { query: { months } });
      setForecast(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Forecast failed', 'error');
    } finally {
      setForecasting(false);
    }
  }

  // ------------------------------------------------ stock demand forecast
  const [stockQ, setStockQ] = useState('');
  const [stockResults, setStockResults] = useState<StockItem[]>([]);
  const [stockSearching, setStockSearching] = useState(false);
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [stockForecast, setStockForecast] = useState<StockForecastResult | null>(null);
  const [stockForecasting, setStockForecasting] = useState(false);

  async function searchStock(e: FormEvent) {
    e.preventDefault();
    if (!stockQ.trim()) return;
    setStockSearching(true);
    try {
      // The inventory list has no server-side q — fetch the scoped catalog and
      // filter client-side (name match, case-insensitive).
      const res = await api<{ items: StockItem[] }>('/inventory/stock');
      const q = stockQ.trim().toLowerCase();
      setStockResults(res.items.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Stock search failed', 'error');
      setStockResults([]);
    } finally {
      setStockSearching(false);
    }
  }

  async function runStockForecast() {
    if (!stockItem) return;
    setStockForecasting(true);
    try {
      const res = await api<StockForecastResult>(`/ai/forecast/stock/${stockItem.id}`);
      setStockForecast(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Forecast failed', 'error');
    } finally {
      setStockForecasting(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Copy not available here — select the text and copy manually', 'info');
    }
  }

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
          title="Add New AI Configuration"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="AI Services"
        subtitle="Deterministic assist features computed live from platform records (docs/22 Phase 7, spec §82–83) — every output is AI-generated and requires professional verification."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------------------------------------- documentation assist */}
        <Card title="Documentation assist" subtitle="Draft a structured clinical note from an encounter — review and edit before saving (the draft is never written automatically)">
          <div className="space-y-4">
            <PatientPicker onPick={(p) => void loadEncounters(p)} placeholder="Find the patient for the note draft" />
            {draftPatient && (
              <Field label="Encounter">
                <Select value={encounterId} onChange={(e) => setEncounterId(e.target.value)}>
                  <option value="">Choose an encounter…</option>
                  {encounters.map((e) => (
                    <option key={e.id} value={e.id}>{e.type} · {e.createdAt.slice(0, 10)} — {e.presentingComplaint ?? 'no complaint'}</option>
                  ))}
                </Select>
              </Field>
            )}
            <Button variant="green" disabled={!encounterId} loading={drafting} onClick={() => void generateDraft()}>
              Generate draft note
            </Button>
            {draft && (
              <div className="space-y-3">
                <Disclaimer />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Draft · based on {draft.basedOn.join(', ')}</p>
                    <Button size="sm" variant="outline" onClick={() => void copyDraft()}>{copied ? 'Copied ✓' : 'Copy draft'}</Button>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-700">{draft.draft}</pre>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ---------------------------------------------- duplicate review */}
        <Card title="Duplicate review" subtitle="MPI candidates ranked by confidence for one patient — never auto-merged, a professional decides (spec §12)">
          <div className="space-y-4">
            <PatientPicker onPick={(p) => { setDupPatient(p); setDup(null); }} placeholder="Find the patient to check for duplicates" />
            {dupPatient && (
              <p className="text-sm text-slate-600">
                Checking <span className="font-semibold text-g-ink">{dupPatient.fullName}</span> ({dupPatient.mrn})
              </p>
            )}
            <Button variant="green" disabled={!dupPatient} loading={dupBusy} onClick={() => void runDuplicates()}>
              Run duplicate review
            </Button>
            {dup && (
              <div className="space-y-3">
                <Disclaimer />
                {dup.candidates.length === 0 ? (
                  <EmptyState title="No likely duplicates" message={`No records in scope matched ${dup.patient.fullName} above the MPI confidence floor.`} />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    {dup.candidates.map((c, i) => (
                      <div key={c.patientId} className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0 hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-g-ink">{c.fullName}</p>
                          <p className="text-[11px] text-slate-400">{c.mrn}{c.dateOfBirth ? ` · DOB ${c.dateOfBirth}` : ''}{c.phone ? ` · ${c.phone}` : ''}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.matchedOn.map((m) => <Badge key={m} tone="gold">{m}</Badge>)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold tabular-nums text-g-ink">{c.score}</p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">{i === 0 ? 'top match' : 'confidence'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* ------------------------------------------- stock demand forecast */}
        <Card title="Stock demand forecast" subtitle="Next-month demand projected from live consumption, with weeks-of-stock-remaining and a run-out date (predictive analytics — docs/22 Phase 7)">
          <div className="space-y-4">
            <form onSubmit={(e) => void searchStock(e)} className="flex gap-2">
              <div className="relative flex-1">
                <Icon name="search" className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <Input value={stockQ} onChange={(e) => setStockQ(e.target.value)} placeholder="Search stock items in scope…" className="pl-10" />
              </div>
              <Button variant="outline" loading={stockSearching}>Search</Button>
            </form>
            {stockResults.length > 0 && !stockItem && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {stockResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
                    onClick={() => { setStockItem(s); setStockResults([]); setStockForecast(null); }}
                  >
                    <span className="text-sm font-semibold text-g-ink">{s.name}</span>
                    <span className="text-xs text-slate-400">{s.quantity} {s.unit} in stock</span>
                  </button>
                ))}
              </div>
            )}
            {stockItem && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-g-ink">{stockItem.name}</p>
                  <p className="text-[11px] text-slate-400">{stockItem.quantity} {stockItem.unit} in stock · reorder at {stockItem.reorderLevel}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setStockItem(null); setStockForecast(null); }}>Change</Button>
              </div>
            )}
            <Button variant="green" disabled={!stockItem} loading={stockForecasting} onClick={() => void runStockForecast()}>
              Run demand forecast
            </Button>
            {stockForecast && (
              <div className="space-y-3">
                <Disclaimer />
                {!stockForecast.available ? (
                  <div className="rounded-md bg-red-50 px-3 py-2.5 text-[11px] text-g-red">{stockForecast.note}</div>
                ) : (
                  <div className="rounded-lg border border-slate-200">
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                      <div className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Next month</p>
                        <p className="text-lg font-bold tabular-nums text-g-ink">
                          {typeof stockForecast.projectedMonthlyDemand === 'number' ? `${Math.round(stockForecast.projectedMonthlyDemand)} ${stockForecast.stockItem.unit}s` : '—'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {typeof stockForecast.lower === 'number' ? `range ${Math.round(stockForecast.lower)} – ${Math.round(stockForecast.upper ?? 0)}` : ''}
                        </p>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Stock lasts</p>
                        <p className="text-lg font-bold tabular-nums text-g-ink">
                          {stockForecast.weeksOfStockRemaining != null ? `~${Math.round(stockForecast.weeksOfStockRemaining)} wks` : '—'}
                        </p>
                        {stockForecast.runOutAt && <p className="text-[10px] text-slate-400">run out {stockForecast.runOutAt}</p>}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
                        <Badge tone={stockForecast.status === 'OK' ? 'green' : stockForecast.status === 'LOW' ? 'gold' : 'red'}>{stockForecast.status.replace(/_/g, ' ')}</Badge>
                      </div>
                    </div>
                    <div className="max-h-40 overflow-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                            <th className="px-3 py-1.5">Week</th>
                            <th className="px-3 py-1.5 text-right">Issued</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockForecast.history.filter((h) => h.issued > 0).slice(-8).map((h) => (
                            <tr key={h.weekStart} className="border-b border-slate-50 last:border-0">
                              <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{h.weekStart}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{h.issued}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {stockForecast.note && <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">{stockForecast.note}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* ------------------------------------------------------ forecasting */}
        <Card title="Forecasting" subtitle="Linear-trend projection of the live weekly indicator series — indicative planning input only (aggregate, no patient data)">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Indicator">
                <Select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
                  {COLLECTED_INDICATORS.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
                </Select>
              </Field>
              <Field label="Months ahead">
                <Select value={months} onChange={(e) => setMonths(e.target.value)}>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </Select>
              </Field>
            </div>
            <Button variant="green" loading={forecasting} onClick={() => void runForecast()}>
              Run forecast
            </Button>
            {forecast && (
              <div className="space-y-3">
                <Disclaimer />
                {!forecast.available ? (
                  <div className="rounded-md bg-red-50 px-3 py-2.5 text-[11px] text-g-red">{forecast.note}</div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                          <th className="px-3 py-2">Month</th>
                          <th className="px-3 py-2 text-right">Projected</th>
                          <th className="px-3 py-2 text-right">Range (95%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecast.months.map((m) => (
                          <tr key={m.period} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-mono text-xs text-slate-600">{m.period}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-g-ink">
                              {typeof m.value === 'number' ? `${m.value.toLocaleString()} ${forecast.unit}` : '—'}
                            </td>
                            <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-500">
                              {typeof m.lower === 'number' ? `${m.lower.toLocaleString()} – ${m.upper?.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">{forecast.basedOn.join(' · ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <p className="text-[11px] text-slate-400">
        These services run deterministically on this platform's own records — no external AI model is called, so they work fully offline.
        An external provider can be wired behind the same endpoints later; the disclosure and provenance contract stays identical (spec §82–83).
      </p>
    </div>
  );
}
