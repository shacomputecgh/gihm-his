import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface LactationCase {
  id: string; motherName: string; babyAge: string; mrn: string;
  issue: string; breastfeedingStatus: string; latchAssessment: string;
  weightGain: string; milkSupply: string;
  plan: string; status: 'Consultation' | 'Ongoing Support' | 'Resolved' | 'Follow-up';
  consultant: string; followUp: string; notes: string;
}

const CASES: LactationCase[] = [
  { id: 'LC-001', motherName: 'Akua Mensah', babyAge: '3 days', mrn: 'MRN-2026-1230',
    issue: 'Difficulty latching — painful breastfeeding', breastfeedingStatus: 'Establishing',
    latchAssessment: 'Shallow latch — tongue-tie suspected. Inverted nipples.',
    weightGain: 'Lost 8% birth weight (within normal)', milkSupply: 'Colostrum transitioning — adequate',
    plan: 'Refer for tongue-tie assessment. nipple shield trial. Positioning correction. Follow-up in 48 hours.',
    status: 'Consultation', consultant: 'Sr. Abena Osei', followUp: '2026-08-26 (48 hours)',
    notes: 'First-time mother. Very motivated. Partner supportive. Tongue-tie clinic referral for tomorrow. Hand expression taught.'
  },
  { id: 'LC-002', motherName: 'Efua Boateng', babyAge: '6 weeks', mrn: 'MRN-2026-1232',
    issue: 'Low milk supply — supplementing with formula', breastfeedingStatus: 'Mixed feeding',
    latchAssessment: 'Good latch — technique correct. No structural issues.',
    weightGain: 'Tracking along 25th percentile — adequate', milkSupply: 'Low supply — likely insufficient glandular tissue',
    plan: 'Power pumping programme. Galactagogues (domperidone 10mg TDS). Maximise skin-to-skin. Donor milk bank option.',
    status: 'Ongoing Support', consultant: 'Sr. Abena Osei', followUp: '2026-08-28 (1 week)',
    notes: 'Secondary insufficiency likely. Power pumping started. Domperidone prescribed. Emotional support provided. Mix feeding acceptable — no guilt.'
  },
  { id: 'LC-003', motherName: 'Ama Nyarko', babyAge: '10 days', mrn: 'MRN-2026-1234',
    issue: 'Mastitis — red, painful left breast', breastfeedingStatus: 'Exclusive breastfeeding',
    latchAssessment: 'Good latch bilaterally. No tongue-tie.',
    weightGain: 'Gaining well — 25g/day', milkSupply: 'Full supply',
    plan: 'Continue breastfeeding on affected side. Warm compresses. Antibiotics (Flucloxacillin). Pain management.',
    status: 'Ongoing Support', consultant: 'Sr. Abena Osei', followUp: '2026-08-26 (48 hours)',
    notes: 'Uncomplicated mastitis. Fever 38.5°C. Antibiotics started. Continue feeding — no need to stop. Monitor for abscess.'
  },
  { id: 'LC-004', motherName: 'Priscilla Kuffour', babyAge: '4 months', mrn: 'MRN-2026-1236',
    issue: 'Returning to work — wanting to maintain breastfeeding', breastfeedingStatus: 'Combination feeding',
    latchAssessment: 'Excellent. Baby thriving.',
    weightGain: 'On 75th percentile — excellent', milkSupply: 'Full supply — pump during work',
    plan: 'Pump schedule for work. Milk storage education. Day care feeding plan. Continue breastfeeding mornings/evenings/weekends.',
    status: 'Consultation', consultant: 'Sr. Abena Osei', followUp: '2026-09-14 (before return to work)',
    notes: 'Returning to work in 4 weeks. Expressed milk supply excellent — freezer stash built up. Day care supportive. Career-breastfeeding balance plan created.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Consultation': 'bg-blue-100 text-blue-800', 'Ongoing Support': 'bg-yellow-100 text-yellow-800',
  'Resolved': 'bg-green-100 text-green-800', 'Follow-up': 'bg-purple-100 text-purple-800',
};

export default function LactationConsultant() {
  const [selected, setSelected] = useState<LactationCase | null>(CASES[0] ?? null);
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
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Lactation Consultant</h1><p className="text-gray-500">Breastfeeding assessment, infant feeding, and postnatal support</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Cases Today', value: CASES.length, color: 'text-blue-600' },
          { label: 'Ongoing', value: CASES.filter(c=>c.status==='Ongoing Support').length, color: 'text-yellow-600' },
          { label: 'Latch Issues', value: CASES.filter(c=>c.latchAssessment.includes('Shallow')||c.latchAssessment.includes('Tongue')).length, color: 'text-red-600' },
          { label: 'Supply Concerns', value: CASES.filter(c=>c.milkSupply.includes('Low')).length, color: 'text-orange-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {CASES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===c.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{c.motherName}</span><Badge className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge><Badge className="text-[10px] bg-pink-100 text-pink-700">👶 {c.babyAge}</Badge></div>
                  <div className="text-sm text-gray-500">{c.issue}</div>
                  <div className="text-xs text-gray-400 mt-1">Breastfeeding: {c.breastfeedingStatus} | Milk: {c.milkSupply}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.motherName}</h2><p className="text-sm text-gray-500">Baby age: {selected.babyAge} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.issue}</p></div>
              <div className="bg-pink-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Breastfeeding:</span> {selected.breastfeedingStatus}</div><div><span className="text-gray-500">Milk Supply:</span> {selected.milkSupply}</div><div><span className="text-gray-500">Weight Gain:</span> {selected.weightGain}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Latch Assessment</div><div className="bg-blue-50 rounded p-2 text-xs">{selected.latchAssessment}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Plan</div><div className="bg-green-50 rounded p-2 text-xs">{selected.plan}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
