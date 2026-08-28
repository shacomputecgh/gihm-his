import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Neonate {
  id: string; name: string; gestationalAge: number; birthWeight: number; sex: string;
  motherName: string; mrn: string; admissionDate: string;
  apgar: { one: number; five: number; ten: number };
  diagnosis: string; ventilator: boolean; incubator: boolean;
  temperature: number; weight: number; feeding: string;
  status: 'Critical' | 'Stable' | 'Improving' | 'Ready for Discharge' | 'Discharged';
  doctor: string; followUp: string; notes: string;
}

const NEONATES: Neonate[] = [
  { id: 'NICU-001', name: 'Baby Boy Mensah', gestationalAge: 28, birthWeight: 1150, sex: 'Male',
    motherName: 'Akua Mensah', mrn: 'NICU-2026-001', admissionDate: '2026-08-20',
    apgar: { one: 3, five: 5, ten: 7 }, diagnosis: 'Extreme Prematurity (28 weeks) — RDS',
    ventilator: true, incubator: true, temperature: 36.8, weight: 1080,
    feeding: 'NG tube — expressed breast milk 30ml Q3H',
    status: 'Critical', doctor: 'Dr. Akua Mensah', followUp: '2026-08-25 (daily review)',
    notes: 'Extreme preterm. On CPAP, weaning. Phototherapy for jaundice. Caffeine for apnoea. Parenteral nutrition + trophic feeds.'
  },
  { id: 'NICU-002', name: 'Baby Girl Boateng', gestationalAge: 34, birthWeight: 2200, sex: 'Female',
    motherName: 'Efua Boateng', mrn: 'NICU-2026-002', admissionDate: '2026-08-22',
    apgar: { one: 7, five: 9, ten: 9 }, diagnosis: 'Late Preterm — Transient Tachypnoea of Newborn',
    ventilator: false, incubator: true, temperature: 36.9, weight: 2150,
    feeding: 'Breastfeeding + top-up EBM via cup',
    status: 'Improving', doctor: 'Dr. Akua Mensah', followUp: '2026-08-25 (daily)',
    notes: 'Respiratory distress improving. Oxygen weaned to room air. Feeding well. Anticipate discharge in 2-3 days if gaining weight.'
  },
  { id: 'NICU-003', name: 'Baby Boy Asare', gestationalAge: 38, birthWeight: 3200, sex: 'Male',
    motherName: 'Ama Asare', mrn: 'NICU-2026-003', admissionDate: '2026-08-24',
    apgar: { one: 2, five: 5, ten: 7 }, diagnosis: 'Birth Asphyxia — Hypoxic-Ischaemic Encephalopathy (Grade II)',
    ventilator: true, incubator: true, temperature: 36.5, weight: 3180,
    feeding: 'Nil by mouth — IV fluids',
    status: 'Critical', doctor: 'Dr. Akua Mensah', followUp: '2026-08-25 (continuous monitoring)',
    notes: 'HIE Grade II. Completed therapeutic hypothermia protocol (72 hours). Rewarming phase. Seizure monitoring. MRI brain planned Day 5-7.'
  },
  { id: 'NICU-004', name: 'Baby Girl Nyarko', gestationalAge: 37, birthWeight: 2800, sex: 'Female',
    motherName: 'Priscilla Nyarko', mrn: 'NICU-2026-004', admissionDate: '2026-08-21',
    apgar: { one: 8, five: 9, ten: 10 }, diagnosis: 'Neonatal Sepsis (Early Onset)',
    ventilator: false, incubator: false, temperature: 37.2, weight: 2750,
    feeding: 'Breastfeeding on demand',
    status: 'Ready for Discharge', doctor: 'Dr. Akua Mensah', followUp: '2026-08-25 (discharge planning)',
    notes: 'Septicaemia — blood culture grew GBS. Completed IV antibiotics x 7 days. Repeat blood culture negative. Gaining weight. Discharge with outpatient follow-up.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Critical': 'bg-red-100 text-red-800', 'Stable': 'bg-yellow-100 text-yellow-800',
  'Improving': 'bg-green-100 text-green-800', 'Ready for Discharge': 'bg-teal-100 text-teal-800',
  'Discharged': 'bg-gray-100 text-gray-800',
};

export default function NeonatalUnit() {
  const [selected, setSelected] = useState<Neonate | null>(NEONATES[0] ?? null);
  const criticalCount = NEONATES.filter(n => n.status === 'Critical').length;
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
          title="Add New Neonatal Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Neonatal Intensive Care Unit (NICU)</h1><p className="text-gray-500">Neonatal monitoring, gestational age tracking, APGAR scoring, and feeding management</p></div>
      {criticalCount > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"><span className="text-red-600 text-xl">👶</span><div><div className="font-semibold text-red-800">{criticalCount > 1 ? `${criticalCount} Critical Neonates` : `${criticalCount} Critical Neonate`}</div><div className="text-sm text-red-600">Requires intensive monitoring and ventilatory support</div></div></div>}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Total Babies', value: NEONATES.length, color: 'text-blue-600' },
          { label: 'Critical', value: criticalCount, color: 'text-red-600' },
          { label: 'On Ventilator', value: NEONATES.filter(n=>n.ventilator).length, color: 'text-purple-600' },
          { label: 'Discharge Ready', value: NEONATES.filter(n=>n.status==='Ready for Discharge').length, color: 'text-teal-600' },
          { label: 'Avg Gestation', value: `${Math.round(NEONATES.reduce((s,n)=>s+n.gestationalAge,0)/NEONATES.length)}w`, color: 'text-green-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {NEONATES.map(n => (
            <div key={n.id} onClick={() => setSelected(n)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===n.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{n.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[n.status]}`}>{n.status}</Badge><Badge className="text-[10px] bg-pink-100 text-pink-700">{n.sex==='Male'?'♂':'♀'} {n.gestationalAge}w</Badge></div>
                  <div className="text-sm text-gray-500">{n.diagnosis}</div>
                  <div className="text-xs text-gray-400 mt-1">Mother: {n.motherName} | Weight: {n.weight}g | Temp: {n.temperature}°C</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">APGAR</div><div className={`text-sm font-bold ${n.apgar.one<=3?'text-red-600':n.apgar.one<=6?'text-yellow-600':'text-green-600'}`}>{n.apgar.one}/{n.apgar.five}/{n.apgar.ten}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">GA {selected.gestationalAge}w | Birth: {selected.birthWeight}g | Now: {selected.weight}g</p><p className="text-sm text-blue-600">{selected.diagnosis}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Mother:</span> {selected.motherName}</div><div><span className="text-gray-500">Admitted:</span> {selected.admissionDate}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">APGAR Scores</div><div className="grid grid-cols-3 gap-2 text-center"><div className="bg-red-50 rounded p-2"><div className="text-lg font-bold text-red-600">{selected.apgar.one}</div><div className="text-[10px]">1 minute</div></div><div className="bg-yellow-50 rounded p-2"><div className="text-lg font-bold text-yellow-600">{selected.apgar.five}</div><div className="text-[10px]">5 minutes</div></div><div className="bg-green-50 rounded p-2"><div className="text-lg font-bold text-green-600">{selected.apgar.ten}</div><div className="text-[10px]">10 minutes</div></div></div></div>
              <div className="flex gap-2 text-sm">
                <div className={`flex-1 rounded p-2 text-center ${selected.ventilator?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}><div className="font-bold">{selected.ventilator?'Ventilator':'Room Air'}</div><div className="text-[10px]">Respiratory</div></div>
                <div className={`flex-1 rounded p-2 text-center ${selected.incubator?'bg-yellow-50 text-yellow-600':'bg-green-50 text-green-600'}`}><div className="font-bold">{selected.incubator?'Incubator':'Cot'}</div><div className="text-[10px]">Environment</div></div>
                <div className="bg-blue-50 text-blue-600 rounded p-2 text-center"><div className="font-bold">{selected.temperature}°C</div><div className="text-[10px]">Temperature</div></div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3"><div className="text-sm font-medium text-purple-700">🍼 Feeding</div><div className="text-sm text-purple-600">{selected.feeding}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
