import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, Input, PageHeader } from '../../components/ui';


interface ClinicalGuideline {
  id: string; title: string; category: string; condition: string; version: string;
  lastUpdated: string; author: string; evidenceLevel: 'A' | 'B' | 'C';
  summary: string; keyRecommendations: string[]; contraindications: string[];
  references: string[]; status: 'active' | 'under-review' | 'archived';
}

interface ClinicalPathway {
  id: string; condition: string; department: string; steps: PathwayStep[];
  targetLOS: number; actualLOS?: number; compliance: number;
}

interface PathwayStep { day: number; action: string; responsible: string; status: 'pending' | 'completed' | 'skipped'; }

interface AntibioticProtocol {
  id: string; name: string; indication: string; firstLine: string; secondLine: string;
  duration: string; route: string; notes: string; organisms: string[];
}

const MOCK_GUIDELINES: ClinicalGuideline[] = [
  { id: 'GL001', title: 'Hypertension Management', category: 'Cardiology', condition: 'Essential Hypertension', version: '3.2', lastUpdated: '2026-03-15', author: 'Ghana Hypertension Society', evidenceLevel: 'A', summary: 'Evidence-based management of essential hypertension in adults, including diagnosis, classification, pharmacological and non-pharmacological interventions.', keyRecommendations: ['Target BP < 130/80 for most adults', 'Lifestyle modifications first', 'First-line: ACEi/ARB, CCB, or Thiazide', 'Combination therapy if monotherapy fails', 'Regular monitoring and follow-up'], contraindications: ['ACEi in pregnancy', 'Beta-blockers in asthma'], references: ['ISH 2023 Guidelines', 'GHS Protocol Manual'], status: 'active' },
  { id: 'GL002', title: 'Diabetes Mellitus Type 2', category: 'Endocrinology', condition: 'Type 2 Diabetes', version: '4.1', lastUpdated: '2026-02-01', author: 'Ghana Diabetes Association', evidenceLevel: 'A', summary: 'Comprehensive management of Type 2 Diabetes including lifestyle, pharmacological, and monitoring strategies.', keyRecommendations: ['HbA1c target < 7% for most patients', 'Metformin as first-line', 'Add second agent if HbA1c not at target', 'Annual eye, foot, and kidney screening', 'Cardiovascular risk assessment'], contraindications: ['Metformin in severe renal impairment'], references: ['ADA Standards 2026', 'GHS Protocol'], status: 'active' },
  { id: 'GL003', title: 'Community-Acquired Pneumonia', category: 'Infectious Disease', condition: 'Community-Acquired Pneumonia', version: '2.5', lastUpdated: '2026-01-20', author: 'Ghana Thoracic Society', evidenceLevel: 'B', summary: 'Diagnosis, severity assessment, and treatment of community-acquired pneumonia in adults and children.', keyRecommendations: ['CURB-65 for severity assessment', 'Amoxicillin first-line for mild CAP', 'Co-amoxiclav or Ceftriaxone for moderate-severe', 'Blood cultures before antibiotics', 'Chest X-ray to confirm diagnosis'], contraindications: ['Penicillin allergy — use macrolide or fluoroquinolone'], references: ['BTS Guidelines 2024', 'WHO CAP Protocol'], status: 'active' },
  { id: 'GL004', title: 'Malaria Treatment Protocol', category: 'Infectious Disease', condition: 'Uncomplicated Malaria', version: '5.0', lastUpdated: '2026-04-01', author: 'Ghana Health Service', evidenceLevel: 'A', summary: 'Updated treatment protocol for uncomplicated and severe malaria based on GHS guidelines.', keyRecommendations: ['ACT (Artemether-Lumefantrine) first-line for uncomplicated malaria', 'IV Artesunate for severe malaria', 'Confirm diagnosis with RDT before treatment', 'Monitor parasitaemia in severe cases', 'Primaquine for P. vivax radical cure'], contraindications: ['Artemether-Lumefantrine in first trimester (use Quinine)'], references: ['GHS Malaria Guidelines 2026', 'WHO Malaria Treatment 2025'], status: 'active' },
  { id: 'GL005', title: 'HIV/AIDS Management', category: 'Infectious Disease', condition: 'HIV Infection', version: '6.3', lastUpdated: '2026-03-01', author: 'Ghana AIDS Commission', evidenceLevel: 'A', summary: 'Comprehensive HIV management including ART initiation, monitoring, and opportunistic infection prevention.', keyRecommendations: ['ART for all HIV-positive individuals regardless of CD4', 'TDF/3TC/DTG preferred first-line regimen', 'Viral load monitoring at 6 and 12 months', 'IPT for TB prevention', 'Cotrimoxazole prophylaxis'], contraindications: ['DTG in women of childbearing potential (without contraception)'], references: ['Ghana National ART Guidelines 2026', 'WHO Consolidated Guidelines'], status: 'active' },
];

const MOCK_PATHWAYS: ClinicalPathway[] = [
  { id: 'CP001', condition: 'Acute Appendicitis', department: 'Surgery', targetLOS: 3, compliance: 92,
    steps: [{ day: 0, action: 'Emergency assessment, bloods, CT scan', responsible: 'ER Doctor', status: 'completed' }, { day: 0, action: 'Surgical consultation and consent', responsible: 'Surgeon', status: 'completed' }, { day: 0, action: 'Appendectomy (laparoscopic)', responsible: 'Surgeon', status: 'completed' }, { day: 1, action: 'Post-op assessment, pain management', responsible: 'Ward Nurse', status: 'completed' }, { day: 1, action: 'Mobilize and advance diet', responsible: 'Physiotherapist', status: 'completed' }, { day: 2, action: 'Discharge planning and follow-up', responsible: 'Discharge Nurse', status: 'completed' }] },
  { id: 'CP002', condition: 'Normal Vaginal Delivery', department: 'Obstetrics', targetLOS: 2, compliance: 95,
    steps: [{ day: 0, action: 'Admission and assessment', responsible: 'Midwife', status: 'completed' }, { day: 0, action: 'Labour management and delivery', responsible: 'Obstetrician', status: 'completed' }, { day: 0, action: 'Immediate postnatal care', responsible: 'Midwife', status: 'completed' }, { day: 1, action: 'Newborn care and immunizations', responsible: 'Paediatrician', status: 'completed' }, { day: 1, action: 'Breastfeeding support', responsible: 'Lactation Consultant', status: 'completed' }, { day: 2, action: 'Discharge and follow-up booking', responsible: 'Midwife', status: 'completed' }] },
  { id: 'CP003', condition: 'Diabetic Ketoacidosis', department: 'Emergency', targetLOS: 5, compliance: 88,
    steps: [{ day: 0, action: 'IV fluids (0.9% NaCl) and insulin infusion', responsible: 'ER Doctor', status: 'completed' }, { day: 0, action: 'Monitor blood glucose hourly', responsible: 'Nurse', status: 'completed' }, { day: 0, action: 'Potassium replacement as needed', responsible: 'ER Doctor', status: 'completed' }, { day: 1, action: 'Transition to subcutaneous insulin', responsible: 'Endocrinologist', status: 'completed' }, { day: 1, action: 'Diabetes education and diet counseling', responsible: 'Diabetes Educator', status: 'completed' }, { day: 2, action: 'Discharge with follow-up plan', responsible: 'Discharge Nurse', status: 'completed' }] },
];

const MOCK_ANTIBIOTICS: AntibioticProtocol[] = [
  { id: 'AB001', name: 'Amoxicillin', indication: 'Upper Respiratory Tract Infection', firstLine: '500mg TDS PO x 5 days', secondLine: 'Clarithromycin 500mg BD PO x 5 days', duration: '5-7 days', route: 'Oral', notes: 'First-line for most URTIs. Check for penicillin allergy.', organisms: ['Streptococcus pneumoniae', 'Haemophilus influenzae'] },
  { id: 'AB002', name: 'Co-Amoxiclav', indication: 'Community-Acquired Pneumonia (Moderate)', firstLine: '625mg TDS PO or 1.2g TDS IV', secondLine: 'Ceftriaxone 2g OD IV', duration: '7-10 days', route: 'Oral/IV', notes: 'For moderate CAP. IV if severe or unable to take oral.', organisms: ['Streptococcus pneumoniae', 'Moraxella catarrhalis'] },
  { id: 'AB003', name: 'Ceftriaxone', indication: 'Severe Infections / Sepsis', firstLine: '2g OD IV', secondLine: 'Meropenem 1g TDS IV', duration: '7-14 days', route: 'IV', notes: 'Broad-spectrum. For severe infections. Monitor for C. difficile.', organisms: ['Gram-negative bacteria', 'MRSA (with vancomycin)'] },
  { id: 'AB004', name: 'Artemether-Lumefantrine', indication: 'Uncomplicated Malaria', firstLine: '80/480mg BD x 3 days (weight-based)', secondLine: 'Quinine + Doxycycline', duration: '3 days', route: 'Oral', notes: 'Take with fatty food. First-line ACT for P. falciparum malaria.', organisms: ['Plasmodium falciparum'] },
  { id: 'AB005', name: 'Metronidazole', indication: 'Intra-abdominal Infections', firstLine: '400mg TDS PO or 500mg TDS IV', secondLine: 'Clindamycin 300mg QDS', duration: '5-7 days', route: 'Oral/IV', notes: 'For anaerobic coverage. Avoid alcohol during and 48h after.', organisms: ['Bacteroides fragilis', 'Clostridium difficile'] },
];

export default function ClinicalProtocols() {
  const [tab, setTab] = useState<'guidelines' | 'pathways' | 'antibiotics'>('guidelines');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuideline, setSelectedGuideline] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Clinical Protocol"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Clinical Protocols" subtitle="Evidence-based treatment guidelines, clinical pathways, and antibiotic stewardship" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_GUIDELINES.length}</div><div className="text-xs text-slate-500">Guidelines</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_PATHWAYS.length}</div><div className="text-xs text-slate-500">Pathways</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_ANTIBIOTICS.length}</div><div className="text-xs text-slate-500">Antibiotic Protocols</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_GUIDELINES.filter(g => g.evidenceLevel === 'A').length}</div><div className="text-xs text-slate-500">Level A Evidence</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['guidelines', 'pathways', 'antibiotics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'guidelines' ? '📋 Guidelines' : t === 'pathways' ? '🛤️ Pathways' : '💊 Antibiotics'}
          </button>
        ))}
      </div>

      {tab === 'guidelines' && (
        <div className="space-y-3">
          <Input placeholder="Search guidelines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {MOCK_GUIDELINES.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()) || g.condition.toLowerCase().includes(searchTerm.toLowerCase())).map(g => {
            const isExpanded = selectedGuideline === g.id;
            return (
              <Card key={g.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedGuideline(isExpanded ? null : g.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{g.title}</h3>
                      <Badge tone={g.evidenceLevel === 'A' ? 'green' : g.evidenceLevel === 'B' ? 'blue' : 'gold'}>Level {g.evidenceLevel}</Badge>
                      <Badge tone={g.status === 'active' ? 'green' : 'gray'}>{g.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{g.category} · {g.condition} · v{g.version} · Updated: {g.lastUpdated}</div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📝 Summary</h4><p className="text-xs text-slate-700 leading-relaxed">{g.summary}</p></div>
                    <div className="rounded-lg bg-green-50 p-3"><h4 className="font-bold text-xs text-green-700 mb-1">✅ Key Recommendations</h4><ul className="list-disc list-inside text-xs text-green-600 space-y-1">{g.keyRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                    {g.contraindications.length > 0 && <div className="rounded-lg bg-red-50 p-3"><h4 className="font-bold text-xs text-red-700 mb-1">⚠️ Contraindications</h4><ul className="list-disc list-inside text-xs text-red-600">{g.contraindications.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
                    <div className="text-[10px] text-slate-400">Author: {g.author} · References: {g.references.join(', ')}</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'pathways' && (
        <div className="space-y-3">
          {MOCK_PATHWAYS.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-800">{p.condition}</h3>
                <Badge tone="blue">{p.department}</Badge>
                <Badge tone="green">Target LOS: {p.targetLOS} days</Badge>
                <Badge tone={p.compliance >= 90 ? 'green' : p.compliance >= 80 ? 'gold' : 'red'}>Compliance: {p.compliance}%</Badge>
              </div>
              <div className="space-y-1">
                {p.steps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded p-1 text-xs ${s.status === 'completed' ? 'bg-green-50' : s.status === 'skipped' ? 'bg-slate-100 line-through' : 'bg-slate-50'}`}>
                    <span className="font-bold text-slate-400">Day {s.day}</span>
                    <span className={s.status === 'completed' ? 'text-green-700' : 'text-slate-700'}>{s.action}</span>
                    <span className="text-[10px] text-slate-400">→ {s.responsible}</span>
                    <span className="ml-auto">{s.status === 'completed' ? '✅' : s.status === 'skipped' ? '⏭️' : '⏳'}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'antibiotics' && (
        <div className="space-y-3">
          {MOCK_ANTIBIOTICS.map(ab => (
            <Card key={ab.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-800">{ab.name}</h3>
                <Badge tone="blue">{ab.indication}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="rounded bg-green-50 p-2"><div className="text-[10px] font-bold text-green-700">First Line</div><div className="text-xs text-green-600">{ab.firstLine}</div></div>
                <div className="rounded bg-amber-50 p-2"><div className="text-[10px] font-bold text-amber-700">Second Line</div><div className="text-xs text-amber-600">{ab.secondLine}</div></div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
                <span>⏱️ {ab.duration}</span><span>💉 {ab.route}</span><span>🦠 {ab.organisms.join(', ')}</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">📝 {ab.notes}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
