import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface IVFCouple {
  id: string; femalePartner: string; malePartner: string; age: number; mrn: string;
  diagnosis: string; protocol: string; cycleDay: string; embryos: { day: number; grade: string; status: string }[];
  medications: string[]; status: 'Consultation' | 'Stimulation' | 'Egg Collection' | 'Embryo Culture' | 'Transfer' | 'Pregnancy Test' | 'Pregnant' | 'Not Pregnant';
  doctor: string; followUp: string; notes: string;
}

const COUPLES: IVFCouple[] = [
  { id: 'IVF-001', femalePartner: 'Akua Boateng', malePartner: 'Kofi Boateng', age: 35, mrn: 'MRN-2026-1150',
    diagnosis: 'Tubal Factor Infertility (bilateral tubal block)', protocol: 'Long Protocol with GnRH Agonist',
    cycleDay: 'Day 9 — Stimulation',
    embryos: [], medications: ['GnRH agonist (Leuprolide)', 'Gonadotropins (Gonal-F 225 IU)', 'Cetrotide 0.25mg'],
    status: 'Stimulation', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-26 (scan)',
    notes: 'Day 9 scan: 12 follicles >14mm bilaterally. E2 rising appropriately. Continue stimulation. Egg collection expected Day 12-13.'
  },
  { id: 'IVF-002', femalePartner: 'Efua Nyarko', malePartner: 'Yaw Nyarko', age: 32, mrn: 'MRN-2026-1152',
    diagnosis: 'Male Factor Infertility (Severe Oligozoospermia)', protocol: 'ICSI — Intracytoplasmic Sperm Injection',
    cycleDay: 'Day 2 — Embryo Culture',
    embryos: [
      { day: 2, grade: '4-cell Grade 1', status: 'On Track' },
      { day: 2, grade: '3-cell Grade 2', status: 'On Track' },
      { day: 2, grade: '4-cell Grade 1', status: 'On Track' },
      { day: 2, grade: '2-cell Grade 3', status: 'Slow' },
    ],
    medications: ['Progesterone supplementation', 'Crinone vaginal gel', 'Dydrogesterone 10mg TDS'],
    status: 'Embryo Culture', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-26 (Day 3 check)',
    notes: 'ICSI performed — 4 oocytes fertilised out of 6 mature. Embryo development being monitored. Transfer planned Day 3 or Day 5 depending on embryo quality.'
  },
  { id: 'IVF-003', femalePartner: 'Ama Mensah', malePartner: 'Nana Mensah', age: 40, mrn: 'MRN-2026-1154',
    diagnosis: 'Diminished Ovarian Reserve + Advanced Maternal Age', protocol: 'Antagonist Protocol with High Dose',
    cycleDay: 'Post-Transfer Day 5 — 2 embryos transferred',
    embryos: [
      { day: 5, grade: 'Expanded Blastocyst 4AA', status: 'Transferred' },
      { day: 5, grade: 'Expanded Blastocyst 4AB', status: 'Transferred' },
      { day: 5, grade: 'Morula', status: 'Arrested' },
    ],
    medications: ['Progesterone suppositories BD', 'Dydrogesterone 20mg BD', 'Aspirin 75mg OD', 'Clexane 40mg SC OD'],
    status: 'Pregnancy Test', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (pregnancy test)',
    notes: 'Two top-quality blastocysts transferred (4AA + 4AB). Luteal phase support ongoing. Beta-hCG test in 10 days. One additional blastocyst frozen.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Consultation': 'bg-gray-100 text-gray-800', 'Stimulation': 'bg-blue-100 text-blue-800',
  'Egg Collection': 'bg-purple-100 text-purple-800', 'Embryo Culture': 'bg-yellow-100 text-yellow-800',
  'Transfer': 'bg-green-100 text-green-800', 'Pregnancy Test': 'bg-orange-100 text-orange-800',
  'Pregnant': 'bg-green-100 text-green-800', 'Not Pregnant': 'bg-red-100 text-red-800',
};

export default function FertilityCentre() {
  const [selected, setSelected] = useState<IVFCouple | null>(COUPLES[0] ?? null);
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
          title="Add New Default"
          fields={[{"name": "name", "label": "Name", "type": "text", "placeholder": "Enter name", "required": true}, {"name": "description", "label": "Description", "type": "text", "placeholder": "Enter description"}, {"name": "status", "label": "Status", "type": "select", "options": ["Active", "Inactive", "Pending"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Fertility Centre — IVF & Assisted Reproduction</h1><p className="text-gray-500">IVF cycle tracking, embryo grading, and assisted reproduction management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Couples', value: COUPLES.length, color: 'text-blue-600' },
          { label: 'In Stimulation', value: COUPLES.filter(c=>c.status==='Stimulation').length, color: 'text-purple-600' },
          { label: 'Embryo Culture', value: COUPLES.filter(c=>c.status==='Embryo Culture').length, color: 'text-yellow-600' },
          { label: 'Pregnancy Test', value: COUPLES.filter(c=>c.status==='Pregnancy Test').length, color: 'text-orange-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {COUPLES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===c.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{c.femalePartner} & {c.malePartner}</span><Badge className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge></div>
                  <div className="text-sm text-gray-500">{c.diagnosis}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.cycleDay} — {c.protocol}</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">Female Age</div><div className="text-lg font-bold text-blue-600">{c.age}</div></div>
              </div>
              {c.embryos.length>0 && <div className="flex gap-1 mt-2 flex-wrap">{c.embryos.map((e,i)=><Badge key={i} className="text-[10px] bg-yellow-100 text-yellow-700">Day {e.day}: {e.grade}</Badge>)}</div>}
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.femalePartner} & {selected.malePartner}</h2><p className="text-sm text-gray-500">MRN: {selected.mrn} | Female age: {selected.age}</p><p className="text-sm text-blue-600">{selected.diagnosis}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Protocol:</span> {selected.protocol}</div><div><span className="text-gray-500">Stage:</span> <span className="font-semibold">{selected.cycleDay}</span></div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div></div>
              {selected.embryos.length>0 && <div><div className="text-sm font-medium text-gray-600 mb-1">Embryos</div>{selected.embryos.map((e,i)=>(<div key={i} className={`text-xs rounded p-2 mb-1 ${e.status==='Transferred'?'bg-green-50':e.status==='Arrested'?'bg-red-50':'bg-yellow-50'}`}><span className="font-medium">Day {e.day}:</span> {e.grade} — {e.status}</div>))}</div>}
              <div><div className="text-sm font-medium text-gray-600 mb-1">Medications</div>{selected.medications.map((m,i)=><div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>)}</div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
