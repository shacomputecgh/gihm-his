import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface PressureUlcer {
  id: string; patientName: string; mrn: string; ward: string;
  assessmentDate: string; assessor: string;
  sensoryScore: number; moistureScore: number; activityScore: number;
  mobilityScore: number; nutritionScore: number; frictionScore: number;
  totalBradenScore: number; riskLevel: 'At Risk' | 'Moderate Risk' | 'High Risk' | 'Very High Risk';
  ulcerSite: string; ulcerStage: string; ulcerSize: string;
  treatmentPlan: string; status: 'Intact Skin' | 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV' | 'Unstageable' | 'DTI';
}

const INITIAL: PressureUlcer[] = [
  { id: 'PU-001', patientName: 'Akosua Mensah', mrn: 'MRN-2026-020', ward: 'ICU', assessmentDate: '2026-08-24', assessor: 'Nurse Ama', sensoryScore: 2, moistureScore: 2, activityScore: 1, mobilityScore: 1, nutritionScore: 2, frictionScore: 1, totalBradenScore: 9, riskLevel: 'Very High Risk', ulcerSite: 'Sacrum', ulcerStage: 'Stage II', ulcerSize: '4cm x 3cm', treatmentPlan: 'Hydrocolloid dressing, 2h repositioning', status: 'Stage II' },
  { id: 'PU-002', patientName: 'Kofi Amoako', mrn: 'MRN-2026-021', ward: 'Geriatric Ward', assessmentDate: '2026-08-23', assessor: 'Nurse Esi', sensoryScore: 3, moistureScore: 2, activityScore: 2, mobilityScore: 2, nutritionScore: 3, frictionScore: 2, totalBradenScore: 14, riskLevel: 'Moderate Risk', ulcerSite: '', ulcerStage: '', ulcerSize: '', treatmentPlan: 'Repositioning schedule, pressure-relieving mattress', status: 'Intact Skin' },
  { id: 'PU-003', patientName: 'Abena Kyere', mrn: 'MRN-2026-022', ward: 'Surgical Ward', assessmentDate: '2026-08-25', assessor: 'Nurse Kofi', sensoryScore: 1, moistureScore: 3, activityScore: 1, mobilityScore: 1, nutritionScore: 1, frictionScore: 1, totalBradenScore: 8, riskLevel: 'Very High Risk', ulcerSite: 'Heel (Left)', ulcerStage: 'Stage III', ulcerSize: '2cm x 2cm x 1cm', treatmentPlan: 'Wound vac, daily dressing change', status: 'Stage III' },
];

const RISK_CONFIG: Record<string, { color: string; icon: string }> = {
  'At Risk': { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }, 'Moderate Risk': { color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  'High Risk': { color: 'bg-red-100 text-red-800', icon: '🔴' }, 'Very High Risk': { color: 'bg-red-200 text-red-900', icon: '🚨' },
};

export default function PressureUlcerPrevention() {
  const [records, setRecords] = useState<PressureUlcer[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ patientName: '', mrn: '', ward: '', assessor: '', sensoryScore: 4, moistureScore: 4, activityScore: 4, mobilityScore: 4, nutritionScore: 4, frictionScore: 3, ulcerSite: '', ulcerStage: 'Intact Skin', ulcerSize: '', treatmentPlan: '' });
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.riskLevel === filter);

  const braden = form.sensoryScore + form.moistureScore + form.activityScore + form.mobilityScore + form.nutritionScore + form.frictionScore;
  const bradenLevel = braden <= 9 ? 'Very High Risk' : braden <= 12 ? 'High Risk' : braden <= 14 ? 'Moderate Risk' : 'At Risk';

  const handleAdd = () => {
    const r = { id: `PU-${String(records.length + 1).padStart(3, '0')}`, patientName: form.patientName, mrn: form.mrn, ward: form.ward, assessor: form.assessor, sensoryScore: form.sensoryScore, moistureScore: form.moistureScore, activityScore: form.activityScore, mobilityScore: form.mobilityScore, nutritionScore: form.nutritionScore, frictionScore: form.frictionScore, assessmentDate: new Date().toISOString().split('T')[0], totalBradenScore: braden, riskLevel: bradenLevel, ulcerSite: form.ulcerSite, ulcerStage: form.ulcerStage, ulcerSize: form.ulcerSize, treatmentPlan: form.treatmentPlan };
    setRecords([r as PressureUlcer, ...records]); setShowForm(false);
    setForm({ patientName: '', mrn: '', ward: '', assessor: '', sensoryScore: 4, moistureScore: 4, activityScore: 4, mobilityScore: 4, nutritionScore: 4, frictionScore: 3, ulcerSite: '', ulcerStage: 'Intact Skin', ulcerSize: '', treatmentPlan: '' });
    toast('Pressure ulcer assessment saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Pressure Ulcer Prevention</h1><p className="text-gray-500">Braden scale assessment, skin integrity monitoring, wound tracking</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Assessment</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(RISK_CONFIG).map(([level, cfg]) => (
          <button key={level} onClick={() => setFilter(filter === level ? '' : level)} className={`p-3 rounded-lg border text-center transition ${filter === level ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="text-2xl">{cfg.icon}</div><div className="text-xl font-bold">{records.filter((r) => r.riskLevel === level).length}</div><div className="text-xs text-slate-500">{level}</div>
          </button>
        ))}
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Patient</th><th className="p-2">MRN</th><th className="p-2">Braden</th><th className="p-2">Risk</th><th className="p-2">Site</th><th className="p-2">Stage</th><th className="p-2">Status</th></tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{r.patientName}</td><td className="p-2">{r.mrn}</td>
                <td className="p-2 font-bold">{r.totalBradenScore}/23</td>
                <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_CONFIG[r.riskLevel]?.color ?? ''}`}>{r.riskLevel}</span></td>
                <td className="p-2">{r.ulcerSite || '—'}</td><td className="p-2">{r.ulcerStage || '—'}</td>
                <td className="p-2"><Badge tone={r.status === 'Intact Skin' ? 'green' : r.status.includes('III') || r.status.includes('IV') ? 'red' : 'gold'}>{r.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Pressure Ulcer Assessment</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Patient Name *</label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">MRN *</label><Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Ward *</label><Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Assessor *</label><Input value={form.assessor} onChange={(e) => setForm({ ...form, assessor: e.target.value })} /></div>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <h3 className="font-semibold mb-2">Braden Scale</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[{ label: 'Sensory', key: 'sensoryScore' as const, opts: [{ v: 1, l: '1 — Completely limited' }, { v: 2, l: '2 — Very limited' }, { v: 3, l: '3 — Slightly limited' }, { v: 4, l: '4 — No impairment' }] },
                    { label: 'Moisture', key: 'moistureScore' as const, opts: [{ v: 1, l: '1 — Constantly moist' }, { v: 2, l: '2 — Very moist' }, { v: 3, l: '3 — Occasionally moist' }, { v: 4, l: '4 — Rarely moist' }] },
                    { label: 'Activity', key: 'activityScore' as const, opts: [{ v: 1, l: '1 — Bedfast' }, { v: 2, l: '2 — Chairfast' }, { v: 3, l: '3 — Walks occasionally' }, { v: 4, l: '4 — Walks frequently' }] },
                    { label: 'Mobility', key: 'mobilityScore' as const, opts: [{ v: 1, l: '1 — Completely immobile' }, { v: 2, l: '2 — Very limited' }, { v: 3, l: '3 — Slightly limited' }, { v: 4, l: '4 — No limitation' }] },
                    { label: 'Nutrition', key: 'nutritionScore' as const, opts: [{ v: 1, l: '1 — Very poor' }, { v: 2, l: '2 — Probably inadequate' }, { v: 3, l: '3 — Adequate' }, { v: 4, l: '4 — Excellent' }] },
                    { label: 'Friction', key: 'frictionScore' as const, opts: [{ v: 1, l: '1 — Problem' }, { v: 2, l: '2 — Potential problem' }, { v: 3, l: '3 — No apparent problem' }] },
                  ].map(({ label, key, opts }) => (
                    <div key={key}><label className="block text-sm mb-1">{label}</label>
                      <Select value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}>
                        {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-center p-2 rounded-lg bg-white border">
                  <span className="text-sm">Braden Score: </span>
                  <span className={`text-2xl font-bold ${braden <= 9 ? 'text-red-600' : braden <= 12 ? 'text-orange-500' : braden <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>{braden}</span>
                  <span className="ml-2">/23</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${RISK_CONFIG[bradenLevel]?.color ?? ''}`}>{bradenLevel}</span>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold mb-2">Wound Details</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm mb-1">Site</label>
                    <Select value={form.ulcerSite} onChange={(e) => setForm({ ...form, ulcerSite: e.target.value })}>
                      <option value="">None</option>{['Sacrum', 'Coccyx', 'Heel (Left)', 'Heel (Right)', 'Ischium', 'Trochanter', 'Elbow', 'Occiput', 'Scapula', 'Ear', 'Other'].map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div><label className="block text-sm mb-1">Stage</label>
                    <Select value={form.ulcerStage} onChange={(e) => setForm({ ...form, ulcerStage: e.target.value })}>
                      {['Intact Skin', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unstageable', 'DTI'].map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div><label className="block text-sm mb-1">Size</label><Input value={form.ulcerSize} onChange={(e) => setForm({ ...form, ulcerSize: e.target.value })} placeholder="e.g. 4cm x 3cm" /></div>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Treatment Plan</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={form.treatmentPlan} onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleAdd}>Save</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
