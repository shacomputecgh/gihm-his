import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { Badge, Button, Card, EmptyState, Field, Icon, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';
import DosingCalculator from '../../components/DosingCalculator';
import BarcodeDrugScanner from '../../components/BarcodeDrugScanner';
import { exportDrugsPDF } from '../../lib/drugPdfExport';

interface Drug {
  id: string;
  name: string;
  genericName?: string;
  brandNames?: string;
  category: string;
  dosageForm?: string;
  strength?: string;
  whoEssential: boolean;
  ghanaEssential: boolean;
  prescriptionOnly: boolean;
  otc: boolean;
  adultDose?: string;
  pediatricDose?: string;
  route?: string;
  sideEffects?: string;
  contraindications?: string;
  drugInteractions?: string;
  pregnancyCategory?: string;
  description?: string;
  diseaseLinks?: Array<{
    id: string;
    efficacy: string;
    dosageNote?: string;
    notes?: string;
    disease: { id: string; name: string; icdCode?: string };
  }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  ANALGESIC: 'bg-blue-100 text-blue-800',
  ANTIBIOTIC: 'bg-red-100 text-red-800',
  ANTIMALARIAL: 'bg-amber-100 text-amber-800',
  ANTIRETROVIRAL: 'bg-purple-100 text-purple-800',
  CARDIOVASCULAR: 'bg-rose-100 text-rose-800',
  ENDOCRINE: 'bg-teal-100 text-teal-800',
  GASTROINTESTINAL: 'bg-emerald-100 text-emerald-800',
  RESPIRATORY: 'bg-sky-100 text-sky-800',
  NEUROLOGICAL: 'bg-violet-100 text-violet-800',
  HORMONE: 'bg-pink-100 text-pink-800',
  VITAMIN: 'bg-lime-100 text-lime-800',
  ANTIFUNGAL: 'bg-orange-100 text-orange-800',
  ANTIPARASITIC: 'bg-yellow-100 text-yellow-800',
  DERMATOLOGICAL: 'bg-stone-100 text-stone-800',
  OPHTHALMIC: 'bg-cyan-100 text-cyan-800',
  ANTIVIRAL: 'bg-indigo-100 text-indigo-800',
};

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-800'}`}>
      {category.replace(/_/g, ' ')}
    </span>
  );
}

function DrugDetail({ drug, onClose }: { drug: Drug; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-g-ink">{drug.name}</h2>
            {drug.genericName && <p className="text-sm text-slate-500">{drug.genericName}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={drug.category} />
            {drug.whoEssential && <Badge tone="green">WHO Essential</Badge>}
            {drug.ghanaEssential && <Badge tone="blue">Ghana EML</Badge>}
            {drug.prescriptionOnly && <Badge tone="red">POM</Badge>}
            {drug.otc && <Badge tone="green">OTC</Badge>}
          </div>

          {drug.brandNames && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Brand Names</p>
              <p className="text-sm text-g-ink">{drug.brandNames}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {drug.dosageForm && (
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Dosage Form</p>
                <p className="text-sm text-g-ink">{drug.dosageForm}</p>
              </div>
            )}
            {drug.strength && (
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Strength</p>
                <p className="text-sm text-g-ink">{drug.strength}</p>
              </div>
            )}
            {drug.route && (
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Route</p>
                <p className="text-sm text-g-ink">{drug.route}</p>
              </div>
            )}
            {drug.pregnancyCategory && (
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Pregnancy Category</p>
                <p className="text-sm text-g-ink">{drug.pregnancyCategory}</p>
              </div>
            )}
          </div>

          {drug.adultDose && (
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-bold uppercase text-blue-600">Adult Dose</p>
              <p className="text-sm text-blue-900">{drug.adultDose}</p>
            </div>
          )}

          {drug.pediatricDose && (
            <div className="rounded-lg bg-teal-50 p-3">
              <p className="text-xs font-bold uppercase text-teal-600">Pediatric Dose</p>
              <p className="text-sm text-teal-900">{drug.pediatricDose}</p>
            </div>
          )}

          {drug.description && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Description</p>
              <p className="text-sm leading-relaxed text-g-ink">{drug.description}</p>
            </div>
          )}

          {drug.sideEffects && (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase text-amber-600">⚠️ Side Effects</p>
              <p className="text-sm text-amber-900">{drug.sideEffects}</p>
            </div>
          )}

          {drug.contraindications && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs font-bold uppercase text-red-600">🚫 Contraindications</p>
              <p className="text-sm text-red-900">{drug.contraindications}</p>
            </div>
          )}

          {drug.drugInteractions && (
            <div className="rounded-lg bg-purple-50 p-3">
              <p className="text-xs font-bold uppercase text-purple-600">⚠️ Drug Interactions</p>
              <p className="text-sm text-purple-900">{drug.drugInteractions}</p>
            </div>
          )}

          {drug.diseaseLinks && drug.diseaseLinks.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Treats</p>
              <div className="mt-1 space-y-1">
                {drug.diseaseLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <Badge tone={link.efficacy === 'FIRST_LINE' ? 'green' : link.efficacy === 'SECOND_LINE' ? 'gold' : 'blue'}>
                      {link.efficacy.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm font-medium text-g-ink">{link.disease.name}</span>
                    {link.dosageNote && <span className="text-xs text-slate-400">— {link.dosageNote}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DrugDatabase() {
  const toast = useToast();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [whoFilter, setWhoFilter] = useState(false);
  const [ghanaFilter, setGhanaFilter] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (whoFilter) params.set('whoEssential', 'true');
      if (ghanaFilter) params.set('ghanaEssential', 'true');
      params.set('pageSize', '200');
      const res = await api<{ items: Drug[] }>(`/drugs?${params}`);
      setDrugs(res.items);
    } catch (err) {
      toast('Failed to load drugs', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, whoFilter, ghanaFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api<Array<{ category: string; count: number }>>('/drugs/categories/list');
      setCategories(res);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    void loadCategories();
  }, [load, loadCategories]);

  async function loadDrugDetail(drug: Drug) {
    try {
      const full = await api<Drug>(`/drugs/${drug.id}`);
      setSelectedDrug(full);
    } catch {
      setSelectedDrug(drug);
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
        title="💊 Drug Reference Database"
        subtitle="Comprehensive medicines list — WHO Essential Medicines, Ghana EML, dosages, interactions, and clinical guidance."
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Field label="Search drugs">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, generic name, brand, description…"
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
                  {c.category.replace(/_/g, ' ')} ({c.count})
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={whoFilter}
              onChange={(e) => setWhoFilter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            WHO Essential
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ghanaFilter}
              onChange={(e) => setGhanaFilter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Ghana EML
          </label>
          <Button variant="green" onClick={() => void load()}>
            Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <Spinner />
      ) : drugs.length === 0 ? (
        <EmptyState icon="pill" title="No drugs found" message="Try adjusting your search or filters." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Drug Name</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Form</th>
                  <th className="px-5 py-3 font-semibold">Route</th>
                  <th className="px-5 py-3 font-semibold">WHO</th>
                  <th className="px-5 py-3 font-semibold">Ghana</th>
                  <th className="px-5 py-3 font-semibold">Rx</th>
                  <th className="px-5 py-3 font-semibold">Adult Dose</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {drugs.map((d) => (
                  <tr key={d.id} className="cursor-pointer hover:bg-g-mist/40" onClick={() => void loadDrugDetail(d)}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-g-ink">{d.name}</p>
                      {d.genericName && <p className="text-xs text-slate-400">{d.genericName}</p>}
                    </td>
                    <td className="px-5 py-3"><CategoryBadge category={d.category} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{d.dosageForm ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{d.route ?? '—'}</td>
                    <td className="px-5 py-3">{d.whoEssential ? <Badge tone="green">Yes</Badge> : <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="px-5 py-3">{d.ghanaEssential ? <Badge tone="blue">Yes</Badge> : <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="px-5 py-3">{d.prescriptionOnly ? <Badge tone="red">Rx</Badge> : <Badge tone="green">OTC</Badge>}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{d.adultDose ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Button size="sm" variant="outline">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {drugs.length} drug(s) found
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedDrug && <DrugDetail drug={selectedDrug} onClose={() => setSelectedDrug(null)} />}

      {/* Dosing Calculator */}
      <div className="mt-8">
        <DosingCalculator />
      </div>

      {/* Barcode Scanner */}
      <div className="mt-8">
        <BarcodeDrugScanner />
      </div>

      {/* Export */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => exportDrugsPDF(drugs)}>
          🖨️ Export to PDF
        </Button>
        <p className="text-[11px] text-slate-400">
          Based on WHO Model List of Essential Medicines (21st List) and Ghana Essential Medicines List.
          For clinical reference only — professional judgment required.
        </p>
      </div>
    </div>
  );
}
