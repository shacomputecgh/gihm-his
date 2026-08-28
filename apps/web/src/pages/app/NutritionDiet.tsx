import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type DietTab = 'patients' | 'meal-plans' | 'assessments' | 'restrictions';

interface PatientDiet {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  bed: string;
  dietType: 'regular' | 'diabetic' | 'renal' | 'cardiac' | 'soft' | 'liquid' | 'nil-by-mouth' | 'tpn' | 'vegetarian' | 'halal';
  allergies: string[];
  restrictions: string[];
  calories: number;
  protein: number;
  meals: MealPlan[];
  nutritionist: string;
  lastAssessment: string;
  bmi: number;
  weight: number;
  height: number;
  albumin: number;
  nutritionalRisk: 'low' | 'medium' | 'high';
  notes: string;
}

interface MealPlan {
  meal: string;
  time: string;
  items: string[];
  calories: number;
  restrictions: string[];
}

interface NutritionAssessment {
  id: string;
  patientName: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  albumin: number;
  preAlbumin: number;
  weightLoss6Months: number;
  dietaryIntake: string;
  appetite: 'good' | 'fair' | 'poor';
  swallowingDifficulty: boolean;
  malnutritionRisk: 'well-nourished' | 'mild-risk' | 'moderate-risk' | 'severe-risk';
  mnaScore: number;
  recommendations: string;
  assessedBy: string;
}

const DIET_TYPES: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  regular: { label: 'Regular Diet', icon: '🍽️', color: 'text-green-700', bg: 'bg-green-50' },
  diabetic: { label: 'Diabetic Diet', icon: '🩸', color: 'text-blue-700', bg: 'bg-blue-50' },
  renal: { label: 'Renal Diet', icon: '🫘', color: 'text-purple-700', bg: 'bg-purple-50' },
  cardiac: { label: 'Cardiac Diet', icon: '❤️', color: 'text-red-700', bg: 'bg-red-50' },
  soft: { label: 'Soft Diet', icon: '🥣', color: 'text-amber-700', bg: 'bg-amber-50' },
  liquid: { label: 'Liquid Diet', icon: '🥤', color: 'text-cyan-700', bg: 'bg-cyan-50' },
  'nil-by-mouth': { label: 'Nil by Mouth', icon: '🚫', color: 'text-slate-700', bg: 'bg-slate-100' },
  tpn: { label: 'Total Parenteral Nutrition', icon: '💉', color: 'text-pink-700', bg: 'bg-pink-50' },
  vegetarian: { label: 'Vegetarian', icon: '🥗', color: 'text-green-700', bg: 'bg-green-50' },
  halal: { label: 'Halal', icon: '☪️', color: 'text-indigo-700', bg: 'bg-indigo-50' },
};

const MOCK_PATIENTS: PatientDiet[] = [
  { id: 'D001', patientName: 'Kwame Asante', mrn: 'MRN-001', ward: 'Medical', bed: 'M-12', dietType: 'diabetic', allergies: ['Peanuts', 'Shellfish'], restrictions: ['Low sugar', 'Low salt', 'No fried foods'], calories: 1800, protein: 70, meals: [
    { meal: 'Breakfast', time: '07:00', items: ['Whole wheat porridge', 'Boiled egg', 'Unsweetened tea', 'Fresh fruit'], calories: 450, restrictions: ['No sugar added'] },
    { meal: 'Mid-Morning Snack', time: '10:00', items: ['Plain yogurt', 'Almonds'], calories: 200, restrictions: [] },
    { meal: 'Lunch', time: '12:30', items: ['Grilled chicken breast', 'Brown rice', 'Steamed vegetables', 'Salad'], calories: 550, restrictions: ['No salt added'] },
    { meal: 'Afternoon Snack', time: '15:00', items: ['Apple slices', 'Cheese'], calories: 150, restrictions: [] },
    { meal: 'Dinner', time: '18:00', items: ['Baked fish', 'Sweet potato', 'Steamed broccoli', 'Water'], calories: 500, restrictions: ['Low fat'] },
    { meal: 'Supper', time: '21:00', items: ['Herbal tea', 'Whole grain crackers'], calories: 150, restrictions: [] },
  ], nutritionist: 'Nutritionist Abena', lastAssessment: '2026-05-22', bmi: 27.2, weight: 72, height: 162, albumin: 3.8, nutritionalRisk: 'medium', notes: 'Diabetic patient — strict blood sugar monitoring. Dietitian review weekly.' },
  { id: 'D002', patientName: 'Ama Darko', mrn: 'MRN-002', ward: 'Surgical', bed: 'S-05', dietType: 'soft', allergies: [], restrictions: ['Soft consistency', 'Small portions', 'High protein'], calories: 2000, protein: 90, meals: [
    { meal: 'Breakfast', time: '07:00', items: ['Scrambled eggs', 'White toast', 'Mashed banana', 'Warm milk'], calories: 400, restrictions: ['Soft texture'] },
    { meal: 'Lunch', time: '12:30', items: ['Chicken soup', 'Mashed potato', 'Steamed carrots', 'Yogurt'], calories: 550, restrictions: ['No hard foods'] },
    { meal: 'Dinner', time: '18:00', items: ['Minced meat stew', 'White rice', 'Cooked greens', 'Fruit puree'], calories: 500, restrictions: [] },
  ], nutritionist: 'Nutritionist Abena', lastAssessment: '2026-05-23', bmi: 26.4, weight: 68, height: 160, albumin: 3.5, nutritionalRisk: 'low', notes: 'Post-appendectomy — advancing diet as tolerated. Start soft diet, progress to regular.' },
  { id: 'D003', patientName: 'Akua Mensah', mrn: 'MRN-005', ward: 'Medical', bed: 'M-08', dietType: 'cardiac', allergies: ['Dairy'], restrictions: ['Low sodium (<2g/day)', 'Low fat', 'No processed foods', 'High potassium'], calories: 1900, protein: 75, meals: [
    { meal: 'Breakfast', time: '07:00', items: ['Oatmeal with berries', 'Soy milk', 'Whole wheat bread', 'Orange juice'], calories: 400, restrictions: ['No dairy'] },
    { meal: 'Lunch', time: '12:30', items: ['Grilled salmon', 'Quinoa', 'Steamed spinach', 'Banana'], calories: 550, restrictions: ['Low sodium'] },
    { meal: 'Dinner', time: '18:00', items: ['Baked chicken', 'Brown rice', 'Roasted sweet potato', 'Steamed kale'], calories: 500, restrictions: ['No salt'] },
  ], nutritionist: 'Nutritionist Abena', lastAssessment: '2026-05-21', bmi: 30.1, weight: 78, height: 161, albumin: 3.6, nutritionalRisk: 'medium', notes: 'Gestational hypertension — dairy-free, cardiac-friendly diet. Weight monitoring weekly.' },
  { id: 'D004', patientName: 'Kofi Asante Jr.', mrn: 'MRN-003', ward: 'Paediatrics', bed: 'P-03', dietType: 'regular', allergies: [], restrictions: ['Child portions', 'Encourage oral intake'], calories: 1200, protein: 40, meals: [
    { meal: 'Breakfast', time: '07:00', items: ['Porridge with milk', 'Fruit', 'Water'], calories: 300, restrictions: [] },
    { meal: 'Lunch', time: '12:30', items: ['Rice and stew', 'Chicken', 'Vegetables', 'Water'], calories: 400, restrictions: [] },
    { meal: 'Dinner', time: '18:00', items: ['Banku with soup', 'Fish', 'Greens', 'Water'], calories: 350, restrictions: [] },
  ], nutritionist: 'Nutritionist Abena', lastAssessment: '2026-05-23', bmi: 15.3, weight: 14, height: 96, albumin: 4.0, nutritionalRisk: 'low', notes: 'Encourage feeding. Monitor oral intake. IV fluids if poor intake.' },
];

const MOCK_ASSESSMENTS: NutritionAssessment[] = [
  { id: 'NA001', patientName: 'Kwame Asante', date: '2026-05-22', weight: 72, height: 162, bmi: 27.2, albumin: 3.8, preAlbumin: 22, weightLoss6Months: 2, dietaryIntake: '75% of meals consumed', appetite: 'fair', swallowingDifficulty: false, malnutritionRisk: 'mild-risk', mnaScore: 22, recommendations: 'Increase protein intake. Monitor weight weekly. Dietitian review in 1 week.', assessedBy: 'Nutritionist Abena' },
  { id: 'NA002', patientName: 'Ama Darko', date: '2026-05-23', weight: 68, height: 160, bmi: 26.4, albumin: 3.5, preAlbumin: 18, weightLoss6Months: 0, dietaryIntake: '50% of meals (post-op)', appetite: 'poor', swallowingDifficulty: false, malnutritionRisk: 'mild-risk', mnaScore: 20, recommendations: 'Post-op nutrition support. Small frequent meals. High protein supplements.', assessedBy: 'Nutritionist Abena' },
  { id: 'NA003', patientName: 'Akua Mensah', date: '2026-05-21', weight: 78, height: 161, bmi: 30.1, albumin: 3.6, preAlbumin: 20, weightLoss6Months: 0, dietaryIntake: '80% of meals', appetite: 'good', swallowingDifficulty: false, malnutritionRisk: 'well-nourished', mnaScore: 26, recommendations: 'Maintain current diet. Weight management counseling. Continue monitoring.', assessedBy: 'Nutritionist Abena' },
];

export default function NutritionDiet() {
  const [tab, setTab] = useState<DietTab>('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

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
          title="Add New Diet Plan"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"dietType","label":"Diet Type","type":"select","options":["Normal","Diabetic","Renal","Cardiac","Soft","Liquid","NPO","Paediatric"]},{"name":"calories","label":"Target Calories","type":"number"},{"name":"allergies","label":"Allergies","type":"text"},{"name":"notes","label":"Special Instructions","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Nutrition & Diet Management" subtitle="Patient diets, nutrition assessments, meal planning, and dietary restrictions" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_PATIENTS.length}</div><div className="text-xs text-slate-500">Patients on Diet</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_ASSESSMENTS.length}</div><div className="text-xs text-slate-500">Assessments</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_PATIENTS.filter(p => p.nutritionalRisk === 'high').length}</div><div className="text-xs text-slate-500">High Risk</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_PATIENTS.filter(p => p.nutritionalRisk === 'medium').length}</div><div className="text-xs text-slate-500">Medium Risk</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['patients', 'meal-plans', 'assessments', 'restrictions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'patients' ? '👥 Patients' : t === 'meal-plans' ? '🍽️ Meal Plans' : t === 'assessments' ? '📊 Assessments' : '⚠️ Restrictions'}
          </button>
        ))}
      </div>

      {/* Patients Tab */}
      {tab === 'patients' && (
        <div className="space-y-3">
          {MOCK_PATIENTS.map(p => {
            const dietInfo = DIET_TYPES[p.dietType]!;
            const isExpanded = selectedPatient === p.id;
            return (
              <Card key={p.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-green-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedPatient(isExpanded ? null : p.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{p.patientName}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dietInfo.bg} ${dietInfo.color}`}>{dietInfo.icon} {dietInfo.label}</span>
                      <Badge tone={p.nutritionalRisk === 'high' ? 'red' : p.nutritionalRisk === 'medium' ? 'gold' : 'green'}>{p.nutritionalRisk.toUpperCase()} RISK</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>🏥 {p.ward} {p.bed}</span>
                      <span>⚖️ {p.weight}kg · BMI {p.bmi}</span>
                      <span>🧬 Albumin: {p.albumin}</span>
                      <span>🔥 {p.calories} kcal/day</span>
                      <span>🥩 {p.protein}g protein/day</span>
                    </div>
                    {p.allergies.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {p.allergies.map(a => <span key={a} className="rounded bg-red-50 px-1.5 text-[10px] font-bold text-red-600">⚠️ {a}</span>)}
                      </div>
                    )}
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-slate-600 mb-1">📋 Dietary Restrictions</h4>
                      <div className="flex flex-wrap gap-1">
                        {p.restrictions.map(r => <span key={r} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">{r}</span>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-600 mb-2">🍽️ Today's Meal Plan ({p.calories} kcal)</h4>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        {p.meals.map((meal, i) => (
                          <div key={i} className="rounded-lg bg-slate-50 p-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-700">{meal.meal}</span>
                              <span className="text-[10px] text-slate-400">{meal.time}</span>
                            </div>
                            <ul className="mt-1 list-disc list-inside text-[10px] text-slate-600">
                              {meal.items.map((item, j) => <li key={j}>{item}</li>)}
                            </ul>
                            <div className="mt-1 text-[10px] text-blue-600 font-bold">{meal.calories} kcal</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      👩‍⚕️ Nutritionist: {p.nutritionist} · Last assessment: {p.lastAssessment}
                      {p.notes && <span className="ml-2 text-slate-400">📝 {p.notes}</span>}
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700 text-xs">✏️ Modify Diet Plan</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Meal Plans Tab */}
      {tab === 'meal-plans' && (
        <div className="space-y-4">
          {MOCK_PATIENTS.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-sm text-slate-800">{p.patientName}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIET_TYPES[p.dietType]!.bg} ${DIET_TYPES[p.dietType]!.color}`}>{DIET_TYPES[p.dietType]!.icon} {DIET_TYPES[p.dietType]!.label}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {p.meals.map((meal, i) => (
                  <div key={i} className="rounded-lg border p-2">
                    <div className="font-bold text-xs">{meal.meal} <span className="text-slate-400 font-normal">({meal.time})</span></div>
                    <ul className="mt-1 list-disc list-inside text-[10px] text-slate-600">{meal.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
                    <div className="mt-1 text-[10px] font-bold text-green-600">{meal.calories} kcal</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assessments Tab */}
      {tab === 'assessments' && (
        <div className="space-y-3">
          {MOCK_ASSESSMENTS.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm text-slate-800">{a.patientName}</h3>
                <Badge tone={a.malnutritionRisk === 'severe-risk' ? 'red' : a.malnutritionRisk === 'moderate-risk' ? 'gold' : a.malnutritionRisk === 'mild-risk' ? 'blue' : 'green'}>
                  {a.malnutritionRisk.toUpperCase().replace('-', ' ')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                <div className="rounded bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">BMI</div><div className={`text-sm font-bold ${a.bmi > 30 ? 'text-red-600' : a.bmi < 18.5 ? 'text-amber-600' : 'text-green-600'}`}>{a.bmi}</div></div>
                <div className="rounded bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Albumin</div><div className={`text-sm font-bold ${a.albumin < 3.5 ? 'text-red-600' : 'text-green-600'}`}>{a.albumin}</div></div>
                <div className="rounded bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Pre-Albumin</div><div className="text-sm font-bold">{a.preAlbumin}</div></div>
                <div className="rounded bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Weight Loss</div><div className={`text-sm font-bold ${a.weightLoss6Months > 5 ? 'text-red-600' : 'text-green-600'}`}>{a.weightLoss6Months}kg</div></div>
                <div className="rounded bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Appetite</div><div className={`text-sm font-bold ${a.appetite === 'poor' ? 'text-red-600' : a.appetite === 'fair' ? 'text-amber-600' : 'text-green-600'}`}>{a.appetite}</div></div>
                <div className="rounded bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">MNA Score</div><div className="text-sm font-bold">{a.mnaScore}/30</div></div>
              </div>
              <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">📋 {a.recommendations}</div>
            </Card>
          ))}
          <Button className="bg-green-600 hover:bg-green-700">➕ New Assessment</Button>
        </div>
      )}

      {/* Restrictions Tab */}
      {tab === 'restrictions' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">⚠️ Active Allergies</h3>
            {MOCK_PATIENTS.filter(p => p.allergies.length > 0).map(p => (
              <div key={p.id} className="mb-2 rounded-lg bg-red-50 p-2">
                <div className="font-bold text-xs text-red-700">{p.patientName}</div>
                <div className="flex flex-wrap gap-1 mt-1">{p.allergies.map(a => <span key={a} className="rounded bg-red-100 px-1.5 text-[10px] font-bold text-red-600">⚠️ {a}</span>)}</div>
              </div>
            ))}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📋 Dietary Restrictions</h3>
            {MOCK_PATIENTS.filter(p => p.restrictions.length > 0).map(p => (
              <div key={p.id} className="mb-2">
                <div className="font-bold text-xs text-slate-700">{p.patientName}</div>
                <div className="flex flex-wrap gap-1 mt-1">{p.restrictions.map(r => <span key={r} className="rounded bg-amber-50 px-1.5 text-[10px] font-medium text-amber-700">{r}</span>)}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
