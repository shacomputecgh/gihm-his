import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface SocialWorkCase {
  id: string; patientName: string; age: number; gender: string; mrn: string;
  issue: string; riskFactors: string[]; referrals: string[];
  dischargePlan: string; homeSituation: string;
  status: 'New' | 'In Progress' | 'Discharged' | 'Follow-up' | 'Closed';
  socialWorker: string; followUp: string; notes: string;
}

const CASES: SocialWorkCase[] = [
  { id: 'SW-001', patientName: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1220',
    issue: 'Discharge planning — post-stroke, lives alone',
    riskFactors: ['Lives alone', 'Limited social support', 'Mobility impairment', 'Financial concerns', 'Low literacy'],
    referrals: ['Home care nursing', 'Physiotherapy (home)', 'Meals on Wheels', 'Occupational therapy (home assessment)'],
    dischargePlan: 'Step-down facility for 2 weeks → home with daily nursing visits + physiotherapy x3/week',
    homeSituation: 'Single-storey house, no grab rails, bathroom not adapted. Family in another region.',
    status: 'In Progress', socialWorker: 'Ms. Priscilla Aidoo', followUp: '2026-08-28 (discharge meeting)',
    notes: 'Home assessment arranged for tomorrow. OT to assess bathroom modifications. Domiciliary care package costing GH₵ 800/month. Social welfare grant application submitted.'
  },
  { id: 'SW-002', patientName: 'Akua Boateng', age: 35, gender: 'Female', mrn: 'MRN-2026-1222',
    issue: 'Domestic violence — requesting protection',
    riskFactors: ['Domestic violence', 'Dependent children (3)', 'Financial dependence', 'Threats from partner'],
    referrals: ['DOVVSU (Domestic Violence)', 'Legal Aid', 'Women\'s shelter', 'Child Protection Services'],
    dischargePlan: 'Safe discharge to women\'s shelter with children. Legal protection order in progress.',
    homeSituation: 'Unsafe — partner aware of admission. Address confidentiality maintained.',
    status: 'In Progress', socialWorker: 'Ms. Priscilla Aidoo', followUp: '2026-08-25 (legal meeting)',
    notes: 'Police report filed. Interim protection order granted. Shelter space confirmed. Children\'s school notified. Financial support application to Department of Social Welfare.'
  },
  { id: 'SW-003', patientName: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1224',
    issue: 'End-of-life care planning — palliative patient',
    riskFactors: ['Terminal illness', 'Widowed', 'Limited finances', 'Children unable to provide full-time care'],
    referrals: ['Palliative care team', 'District nursing', 'Hospice', 'Spiritual care', 'Bereavement support'],
    dischargePlan: 'Home-based palliative care with district nursing Q4H. Hospice at-home team support.',
    homeSituation: 'Own house, daughter lives nearby. House suitable for home care. Equipment loan arranged.',
    status: 'In Progress', socialWorker: 'Ms. Priscilla Aidoo', followUp: '2026-08-26 (family meeting)',
    notes: 'Family meeting held. Advance directive discussed. Daughter will be primary carer. Equipment (hospital bed, commode) arranged. Bereavement support plan for family.'
  },
  { id: 'SW-004', patientName: 'Nana Kuffour', age: 18, gender: 'Male', mrn: 'MRN-2026-1226',
    issue: 'Discharge to care home — aged out of foster care',
    riskFactors: ['Aged out of care', 'No family', 'Mental health issues', 'No housing', 'Unemployed'],
    referrals: ['Youth services', 'Mental health team', 'Housing support', 'Jobcentre', 'Befriending service'],
    dischargePlan: 'Supported housing placement. Weekly social work visits. Mental health follow-up.',
    homeSituation: 'Currently in hospital — no home to return to. Care home placement pending.',
    status: 'New', socialWorker: 'Ms. Priscilla Aidoo', followUp: '2026-08-28 (placement meeting)',
    notes: 'Care leaver — no family support. Housing application submitted. Mental health assessment needed. Benefits application in progress.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'In Progress': 'bg-yellow-100 text-yellow-800',
  'Discharged': 'bg-green-100 text-green-800', 'Follow-up': 'bg-purple-100 text-purple-800',
  'Closed': 'bg-gray-100 text-gray-800',
};

export default function MedicalSocialWork() {
  const [selected, setSelected] = useState<SocialWorkCase | null>(CASES[0] ?? null);
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
          title="Add New Social Work Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Medical Social Work</h1><p className="text-gray-500">Discharge planning, social services, patient advocacy, and welfare assessment</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Cases', value: CASES.length, color: 'text-blue-600' },
          { label: 'In Progress', value: CASES.filter(c=>c.status==='In Progress').length, color: 'text-yellow-600' },
          { label: 'Discharge Plans', value: CASES.filter(c=>c.dischargePlan).length, color: 'text-green-600' },
          { label: 'Risk Cases', value: CASES.filter(c=>c.riskFactors.length>=4).length, color: 'text-red-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {CASES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===c.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{c.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge></div>
                  <div className="text-sm text-gray-500">{c.issue}</div>
                  <div className="text-xs text-gray-400 mt-1">Risk factors: {c.riskFactors.length} | Referrals: {c.referrals.length}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">{c.riskFactors.slice(0,3).map(r=><Badge key={r} className="text-[10px] bg-red-100 text-red-700">⚠️ {r}</Badge>)}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.issue}</p></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Risk Factors</div>{selected.riskFactors.map((r,i)=><div key={i} className="text-xs bg-red-50 rounded px-2 py-1 mb-1">⚠️ {r}</div>)}</div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Referrals</div>{selected.referrals.map((r,i)=><div key={i} className="text-xs bg-blue-50 rounded px-2 py-1 mb-1">📋 {r}</div>)}</div>
              <div className="bg-green-50 rounded-lg p-3"><div className="text-sm font-medium text-green-700 mb-1">Discharge Plan</div><div className="text-sm text-green-600">{selected.dischargePlan}</div></div>
              <div className="bg-yellow-50 rounded-lg p-3"><div className="text-sm font-medium text-yellow-700 mb-1">Home Situation</div><div className="text-sm text-yellow-600">{selected.homeSituation}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
