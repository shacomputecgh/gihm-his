import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { Badge, Button, Card, EmptyState, Field, Icon, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';

interface Disease {
  id: string;
  name: string;
  icdCode?: string;
  category: string;
  subCategory?: string;
  type?: string;
  symptoms?: string;
  transmission?: string;
  incubationPeriod?: string;
  severity?: string;
  prevention?: string;
  diagnosis?: string;
  complications?: string;
  endemicToGhana: boolean;
  vaccineAvailable: boolean;
  drugLinks?: Array<{
    id: string;
    efficacy: string;
    dosageNote?: string;
    notes?: string;
    drug: { id: string; name: string; genericName?: string; dosageForm?: string; route?: string; adultDose?: string };
  }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  MILD: 'bg-green-100 text-green-800',
  MODERATE: 'bg-amber-100 text-amber-800',
  SEVERE: 'bg-orange-100 text-orange-800',
  LIFE_THREATENING: 'bg-red-100 text-red-800',
};

const CATEGORY_ICONS: Record<string, string> = {
  INFECTIOUS: '🦠',
  NON_COMMUNICABLE: '🏥',
  MATERNAL: '🤰',
  NEOPLASM: '🎗️',
  INJURY: '🩹',
  NUTRITIONAL: '🍎',
  MENTAL: '🧠',
  OTHER: '📋',
};

function DiseaseDetail({ disease, onClose }: { disease: Disease; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-g-ink">{CATEGORY_ICONS[disease.category] ?? '📋'} {disease.name}</h2>
            <p className="text-sm text-slate-500">{disease.icdCode ? `ICD-10: ${disease.icdCode}` : ''} · {disease.category.replace(/_/g, ' ')}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${SEVERITY_COLORS[disease.severity ?? 'MODERATE']}`}>
              {disease.severity?.replace(/_/g, ' ')}
            </span>
            {disease.endemicToGhana && <Badge tone="red">Endemic in Ghana</Badge>}
            {disease.vaccineAvailable && <Badge tone="green">💉 Vaccine Available</Badge>}
            {disease.type && <Badge tone="blue">{disease.type}</Badge>}
          </div>

          {disease.symptoms && (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase text-amber-600">🩺 Symptoms</p>
              <p className="text-sm text-amber-900">{disease.symptoms}</p>
            </div>
          )}

          {disease.transmission && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Transmission</p>
              <p className="text-sm text-g-ink">{disease.transmission}</p>
            </div>
          )}

          {disease.incubationPeriod && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Incubation Period</p>
              <p className="text-sm text-g-ink">{disease.incubationPeriod}</p>
            </div>
          )}

          {disease.diagnosis && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">🔬 Diagnosis</p>
              <p className="text-sm text-g-ink">{disease.diagnosis}</p>
            </div>
          )}

          {disease.prevention && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs font-bold uppercase text-green-600">🛡️ Prevention</p>
              <p className="text-sm text-green-900">{disease.prevention}</p>
            </div>
          )}

          {disease.complications && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs font-bold uppercase text-red-600">⚠️ Complications</p>
              <p className="text-sm text-red-900">{disease.complications}</p>
            </div>
          )}

          {disease.drugLinks && disease.drugLinks.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">💊 Treatment</p>
              <div className="mt-2 space-y-2">
                {['FIRST_LINE', 'SECOND_LINE', 'ADJUNCTIVE', 'PROPHYLACTIC', 'PALLIATIVE'].map((eff) => {
                  const links = disease.drugLinks!.filter((l) => l.efficacy === eff);
                  if (links.length === 0) return null;
                  return (
                    <div key={eff}>
                      <p className="mb-1 text-xs font-semibold text-slate-500">{eff.replace(/_/g, ' ')}</p>
                      {links.map((link) => (
                        <div key={link.id} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-g-ink">{link.drug.name}</p>
                            {link.drug.genericName && <p className="text-xs text-slate-400">{link.drug.genericName}</p>}
                            {link.dosageNote && <p className="text-xs text-blue-600 mt-0.5">{link.dosageNote}</p>}
                            {link.notes && <p className="text-xs text-slate-500 mt-0.5">{link.notes}</p>}
                          </div>
                          <div className="flex gap-1">
                            {link.drug.dosageForm && <Badge tone="gray">{link.drug.dosageForm}</Badge>}
                            {link.drug.route && <Badge tone="gray">{link.drug.route}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiseaseReference() {
  const toast = useToast();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [endemicFilter, setEndemicFilter] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (endemicFilter) params.set('endemicToGhana', 'true');
      params.set('pageSize', '200');
      const res = await api<{ items: Disease[] }>(`/diseases?${params}`);
      setDiseases(res.items);
    } catch (err) {
      toast('Failed to load diseases', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, endemicFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api<Array<{ category: string; count: number }>>('/diseases/categories/list');
      setCategories(res);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    void loadCategories();
  }, [load, loadCategories]);

  async function loadDiseaseDetail(disease: Disease) {
    try {
      const full = await api<Disease>(`/diseases/${disease.id}`);
      setSelectedDisease(full);
    } catch {
      setSelectedDisease(disease);
    }
  }

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
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
        title="🦠 Disease Reference"
        subtitle="Comprehensive disease database — symptoms, treatments, prevention, and endemic diseases in Ghana."
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Field label="Search diseases">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, symptoms, ICD code…"
                  className="pl-9"
                />
              </div>
            </Field>
          </div>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {CATEGORY_ICONS[c.category] ?? ''} {c.category.replace(/_/g, ' ')} ({c.count})
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={endemicFilter}
              onChange={(e) => setEndemicFilter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Endemic to Ghana only
          </label>
          <Button variant="green" onClick={() => void load()}>
            Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <Spinner />
      ) : diseases.length === 0 ? (
        <EmptyState icon="activity" title="No diseases found" message="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {diseases.map((d) => (
            <button
              key={d.id}
              onClick={() => void loadDiseaseDetail(d)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-g-red/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-g-ink">
                    {CATEGORY_ICONS[d.category] ?? '📋'} {d.name}
                  </p>
                  {d.icdCode && <p className="text-[11px] font-mono text-slate-400">{d.icdCode}</p>}
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${SEVERITY_COLORS[d.severity ?? 'MODERATE']}`}>
                  {d.severity?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {d.endemicToGhana && <Badge tone="red">Endemic</Badge>}
                {d.vaccineAvailable && <Badge tone="green">Vaccine</Badge>}
                {d.type && <Badge tone="blue">{d.type}</Badge>}
              </div>
              {d.symptoms && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{d.symptoms}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDisease && <DiseaseDetail disease={selectedDisease} onClose={() => setSelectedDisease(null)} />}

      <p className="text-[11px] text-slate-400">
        For clinical reference only. Information sourced from WHO, Ghana Health Service, and standard medical references.
      </p>
    </div>
  );
}
