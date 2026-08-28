import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface GrowthRecord {
  id: string;
  patientName: string;
  ageMonths: number;
  gender: 'Male' | 'Female';
  weight: number;
  length: number;
  headCircumference: number;
  weightForAge: 'Normal' | 'Overweight' | 'Obese' | 'Underweight' | 'Severely Underweight' | 'Wasted' | 'Stunted';
  muac: number;
  milestones: { milestone: string; achieved: boolean; ageExpected: string; ageAchieved?: string }[];
  immunizations: { vaccine: string; date: string; status: 'Done' | 'Due' | 'Overdue' }[];
  doctor: string;
  notes: string;
}

const GROWTH_RECORDS: GrowthRecord[] = [
  {
    id: 'GR-001', patientName: 'Kwabena Mensah', ageMonths: 24, gender: 'Male',
    weight: 11.2, length: 82, headCircumference: 48, muac: 14.5,
    weightForAge: 'Normal',
    milestones: [
      { milestone: 'Sits without support', achieved: true, ageExpected: '6 months', ageAchieved: '5 months' },
      { milestone: 'Crawls', achieved: true, ageExpected: '9 months', ageAchieved: '8 months' },
      { milestone: 'Walks independently', achieved: true, ageExpected: '12 months', ageAchieved: '11 months' },
      { milestone: 'Runs', achieved: true, ageExpected: '18 months', ageAchieved: '17 months' },
      { milestone: 'Speaks 2-word phrases', achieved: true, ageExpected: '24 months', ageAchieved: '22 months' },
      { milestone: 'Kicks a ball', achieved: false, ageExpected: '24 months' },
      { milestone: 'Builds tower of 4 blocks', achieved: true, ageExpected: '24 months', ageAchieved: '23 months' },
    ],
    immunizations: [
      { vaccine: 'BCG', date: '2024-08-28', status: 'Done' },
      { vaccine: 'OPV 0,1,2,3', date: '2024-08-28, 2024-09-28, 2024-10-28, 2024-11-28', status: 'Done' },
      { vaccine: 'Penta 1,2,3', date: '2024-09-28, 2024-10-28, 2024-11-28', status: 'Done' },
      { vaccine: 'Measles-Rubella 1', date: '2025-08-28', status: 'Done' },
      { vaccine: 'Yellow Fever', date: '2025-08-28', status: 'Done' },
      { vaccine: 'Measles-Rubella 2', date: '2026-08-28', status: 'Due' },
    ],
    doctor: 'Dr. Akua Mensah',
    notes: 'Growing well. Weight for age on track. All milestones met or ahead. MR2 due next month.'
  },
  {
    id: 'GR-002', patientName: 'Ama Serwaa', ageMonths: 6, gender: 'Female',
    weight: 6.1, length: 62, headCircumference: 41, muac: 13.2,
    weightForAge: 'Normal',
    milestones: [
      { milestone: 'Social smile', achieved: true, ageExpected: '2 months', ageAchieved: '6 weeks' },
      { milestone: 'Rolls over', achieved: true, ageExpected: '4 months', ageAchieved: '5 months' },
      { milestone: 'Sits without support', achieved: false, ageExpected: '6 months' },
      { milestone: 'Reaches for objects', achieved: true, ageExpected: '4 months', ageAchieved: '4 months' },
      { milestone: 'Babbles', achieved: true, ageExpected: '6 months', ageAchieved: '5 months' },
    ],
    immunizations: [
      { vaccine: 'BCG', date: '2026-02-10', status: 'Done' },
      { vaccine: 'OPV 0,1,2', date: '2026-02-10, 2026-03-10, 2026-04-10', status: 'Done' },
      { vaccine: 'Penta 1,2', date: '2026-03-10, 2026-04-10', status: 'Done' },
      { vaccine: 'OPV 3', date: '2026-05-10', status: 'Done' },
      { vaccine: 'Penta 3', date: '2026-05-10', status: 'Done' },
      { vaccine: 'PCV 1,2,3', date: '2026-03-10, 2026-04-10, 2026-05-10', status: 'Done' },
      { vaccine: 'Rotavirus 1,2', date: '2026-03-10, 2026-04-10', status: 'Done' },
    ],
    doctor: 'Dr. Akua Mensah',
    notes: 'Breastfeeding exclusively. Good weight gain. Starting complementary feeding at 6 months.'
  },
  {
    id: 'GR-003', patientName: 'Kofi Nkrumah', ageMonths: 18, gender: 'Male',
    weight: 8.5, length: 74, headCircumference: 46, muac: 12.8,
    weightForAge: 'Underweight',
    milestones: [
      { milestone: 'Sits without support', achieved: true, ageExpected: '6 months', ageAchieved: '7 months' },
      { milestone: 'Crawls', achieved: true, ageExpected: '9 months', ageAchieved: '11 months' },
      { milestone: 'Walks independently', achieved: false, ageExpected: '12 months' },
      { milestone: 'Says 3+ words', achieved: false, ageExpected: '18 months' },
      { milestone: 'Points to objects', achieved: true, ageExpected: '12 months', ageAchieved: '14 months' },
    ],
    immunizations: [
      { vaccine: 'BCG', date: '2025-02-10', status: 'Done' },
      { vaccine: 'OPV 0,1,2,3', date: '2025-02-10, 2025-03-10, 2025-04-10, 2025-05-10', status: 'Done' },
      { vaccine: 'Penta 1,2,3', date: '2025-03-10, 2025-04-10, 2025-05-10', status: 'Done' },
      { vaccine: 'Measles-Rubella 1', date: '2026-02-10', status: 'Done' },
      { vaccine: 'Vitamin A', date: '2026-02-10', status: 'Done' },
      { vaccine: 'Vitamin A (6-month)', date: '2026-08-10', status: 'Overdue' },
    ],
    doctor: 'Dr. Akua Mensah',
    notes: 'Underweight with delayed milestones. Refer to nutritionist. Vitamin A supplementation overdue. Screen for TB, HIV.'
  },
  {
    id: 'GR-004', patientName: 'Akua Mensah', ageMonths: 36, gender: 'Female',
    weight: 13.8, length: 92, headCircumference: 49, muac: 15.2,
    weightForAge: 'Overweight',
    milestones: [
      { milestone: 'Walks independently', achieved: true, ageExpected: '12 months', ageAchieved: '11 months' },
      { milestone: 'Runs', achieved: true, ageExpected: '18 months', ageAchieved: '16 months' },
      { milestone: 'Speaks in sentences', achieved: true, ageExpected: '36 months', ageAchieved: '30 months' },
      { milestone: 'Counts to 10', achieved: true, ageExpected: '36 months', ageAchieved: '32 months' },
      { milestone: 'Rides tricycle', achieved: true, ageExpected: '36 months', ageAchieved: '34 months' },
      { milestone: 'Dresses self', achieved: true, ageExpected: '36 months', ageAchieved: '33 months' },
    ],
    immunizations: [
      { vaccine: 'All EPI vaccines', date: 'Completed', status: 'Done' },
      { vaccine: 'Measles-Rubella 2', date: '2025-08-28', status: 'Done' },
      { vaccine: 'DPT booster', date: '2026-08-28', status: 'Due' },
    ],
    doctor: 'Dr. Akua Mensah',
    notes: 'Overweight — monitor diet. Encourage physical activity. All developmental milestones met early. DPT booster due.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Normal': 'bg-green-100 text-green-800', 'Overweight': 'bg-yellow-100 text-yellow-800',
  'Obese': 'bg-red-100 text-red-800', 'Underweight': 'bg-orange-100 text-orange-800',
  'Severely Underweight': 'bg-red-100 text-red-800', 'Wasted': 'bg-red-100 text-red-800', 'Stunted': 'bg-yellow-100 text-yellow-800',
};

export default function PaediatricGrowthCharts() {
  const [selected, setSelected] = useState<GrowthRecord | null>(GROWTH_RECORDS[0] ?? null);
  const filtered = GROWTH_RECORDS.filter(() => true);

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
          title="Add New Growth Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Paediatric Growth Charts</h1>
        <p className="text-gray-500">WHO growth monitoring, developmental milestones, and immunization tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Children Tracked', value: GROWTH_RECORDS.length, color: 'text-blue-600' },
          { label: 'Normal Growth', value: GROWTH_RECORDS.filter(r => r.weightForAge === 'Normal').length, color: 'text-green-600' },
          { label: 'Underweight', value: GROWTH_RECORDS.filter(r => r.weightForAge === 'Underweight').length, color: 'text-orange-600' },
          { label: 'Overdue Vaccines', value: GROWTH_RECORDS.reduce((sum, r) => sum + r.immunizations.filter(i => i.status === 'Overdue').length, 0), color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {filtered.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === r.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{r.patientName}</div>
                  <div className="text-xs text-gray-500">{r.ageMonths} months — {r.gender}</div>
                </div>
                <Badge className={`text-[10px] ${STATUS_STYLES[r.weightForAge]}`}>{r.weightForAge}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-xs text-center">
                <div className="bg-blue-50 rounded p-1"><div className="font-bold">{r.weight}kg</div><div className="text-[10px] text-gray-400">Weight</div></div>
                <div className="bg-blue-50 rounded p-1"><div className="font-bold">{r.length}cm</div><div className="text-[10px] text-gray-400">Length</div></div>
                <div className="bg-blue-50 rounded p-1"><div className="font-bold">{r.headCircumference}cm</div><div className="text-[10px] text-gray-400">Head</div></div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{selected.patientName}</h2>
                  <p className="text-sm text-gray-500">{selected.ageMonths} months — {selected.gender}</p>
                </div>
                <Badge className={`text-xs ${STATUS_STYLES[selected.weightForAge]}`}>{selected.weightForAge}</Badge>
              </div>

              {/* Growth Measurements */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Weight', value: `${selected.weight}kg`, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Length', value: `${selected.length}cm`, color: 'bg-green-50 text-green-700' },
                  { label: 'Head Circ.', value: `${selected.headCircumference}cm`, color: 'bg-purple-50 text-purple-700' },
                  { label: 'MUAC', value: `${selected.muac}cm`, color: selected.muac < 13.5 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700' },
                ].map((m, i) => (
                  <div key={i} className={`${m.color} rounded-lg p-3 text-center`}>
                    <div className="text-lg font-bold">{m.value}</div>
                    <div className="text-[10px]">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Developmental Milestones */}
              <div>
                <div className="text-sm font-bold text-gray-700 mb-2">🧸 Developmental Milestones</div>
                <div className="space-y-1">
                  {selected.milestones.map((m, i) => (
                    <div key={i} className={`flex items-center justify-between text-sm p-2 rounded ${
                      m.achieved ? 'bg-green-50' : 'bg-yellow-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>{m.achieved ? '✅' : '⏳'}</span>
                        <span>{m.milestone}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {m.achieved ? `Achieved: ${m.ageAchieved}` : `Expected: ${m.ageExpected}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immunizations */}
              <div>
                <div className="text-sm font-bold text-gray-700 mb-2">💉 Immunizations</div>
                <div className="space-y-1">
                  {selected.immunizations.map((imm, i) => (
                    <div key={i} className={`flex items-center justify-between text-sm p-2 rounded ${
                      imm.status === 'Done' ? 'bg-green-50' :
                      imm.status === 'Overdue' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>{imm.status === 'Done' ? '✅' : imm.status === 'Overdue' ? '🔴' : '🟡'}</span>
                        <span>{imm.vaccine}</span>
                      </div>
                      <div className="text-xs text-gray-500">{imm.date}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 bg-white border rounded-xl">Select a child to view growth data</div>
          )}
        </div>
      </div>
    </div>
  );
}
