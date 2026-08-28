import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface NutritionPatient {
  id: string; patientName: string; mrn: string; ward: string;
  bmi: number; weight: number; height: number;
  malnutritionRisk: 'Well-Nourished' | 'Moderate Risk' | 'Severe Malnutrition';
  mstScore: number; dietType: string; oralSupplements: boolean;
  tubeFeeding: boolean; parenteralNutrition: boolean;
  allergies: string[]; swallowingDifficulty: boolean;
  dietitian: string; lastAssessed: string;
}

const INITIAL: NutritionPatient[] = [
  { id: 'NUT-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', bmi: 22.5, weight: 68, height: 174, malnutritionRisk: 'Well-Nourished', mstScore: 0, dietType: 'Normal diet', oralSupplements: false, tubeFeeding: false, parenteralNutrition: false, allergies: ['Penicillin'], swallowingDifficulty: false, dietitian: 'Diet. Ama', lastAssessed: '2026-08-25' },
  { id: 'NUT-002', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', bmi: 18.2, weight: 52, height: 169, malnutritionRisk: 'Severe Malnutrition', mstScore: 5, dietType: 'Nil by mouth', oralSupplements: false, tubeFeeding: true, parenteralNutrition: true, allergies: [], swallowingDifficulty: true, dietitian: 'Diet. Ama', lastAssessed: '2026-08-25' },
  { id: 'NUT-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', ward: 'Surgical Ward', bmi: 24.1, weight: 78, height: 179, malnutritionRisk: 'Moderate Risk', mstScore: 2, dietType: 'Soft diet', oralSupplements: true, tubeFeeding: false, parenteralNutrition: false, allergies: [], swallowingDifficulty: false, dietitian: 'Diet. Kofi', lastAssessed: '2026-08-24' },
];

const RISK_CONFIG: Record<string, { color: string; tone: 'green' | 'gold' | 'red' }> = {
  'Well-Nourished': { color: 'bg-green-100 text-green-800', tone: 'green' },
  'Moderate Risk': { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  'Severe Malnutrition': { color: 'bg-red-100 text-red-800', tone: 'red' },
};

export default function NutritionAssessment() {
  const [patients] = useState<NutritionPatient[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const severe = patients.filter((p) => p.malnutritionRisk === 'Severe Malnutrition').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Nutrition Assessment</h1><p className="text-gray-500">Malnutrition screening (MST), diet planning, tube feeding, and nutritional support</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Assessment</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{patients.length}</div><div className="text-xs text-gray-500">Total Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{patients.filter((p) => p.malnutritionRisk === 'Well-Nourished').length}</div><div className="text-xs text-gray-500">Well-Nourished</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{patients.filter((p) => p.malnutritionRisk === 'Moderate Risk').length}</div><div className="text-xs text-gray-500">Moderate Risk</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{severe}</div><div className="text-xs text-gray-500">Severe Malnutrition</div></Card>
      </div>
      <div className="space-y-4">
        {patients.map((p) => (
          <Card key={p.id} className={`p-4 ${p.malnutritionRisk === 'Severe Malnutrition' ? 'border-red-300' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{p.patientName}</span>
                  <span className="text-sm text-gray-400">{p.mrn} · {p.ward}</span>
                  <Badge tone={RISK_CONFIG[p.malnutritionRisk]?.tone}>{p.malnutritionRisk}</Badge>
                </div>
                <p className="text-sm text-gray-500">Dietitian: {p.dietitian} · Assessed: {p.lastAssessed}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm bg-gray-50 rounded-lg p-3 mb-3">
              <div><span className="text-gray-500 text-xs">BMI</span><div className={`font-bold ${p.bmi < 18.5 ? 'text-red-600' : p.bmi > 25 ? 'text-orange-600' : 'text-green-600'}`}>{p.bmi}</div></div>
              <div><span className="text-gray-500 text-xs">Weight</span><div className="font-medium">{p.weight} kg</div></div>
              <div><span className="text-gray-500 text-xs">MST Score</span><div className={`font-bold ${p.mstScore >= 2 ? 'text-red-600' : 'text-green-600'}`}>{p.mstScore}/6</div></div>
              <div><span className="text-gray-500 text-xs">Diet</span><div className="font-medium text-xs">{p.dietType}</div></div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {p.tubeFeeding && <Badge tone="blue">Nasogastric Tube</Badge>}
              {p.parenteralNutrition && <Badge tone="blue">TPN</Badge>}
              {p.oralSupplements && <Badge tone="gold">Oral Supplements</Badge>}
              {p.swallowingDifficulty && <Badge tone="red">Swallowing Difficulty</Badge>}
              {p.allergies.length > 0 && <Badge tone="red">Allergies: {p.allergies.join(', ')}</Badge>}
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Nutrition Assessment</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Weight (kg) *</label><Input type="number" step="0.1" /></div>
                <div><label className="block text-sm mb-1">Height (cm) *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">MST Score (0-6) *</label><Input type="number" min="0" max="6" /></div>
                <div><label className="block text-sm mb-1">Diet Type *</label><Select>{['Normal diet', 'Soft diet', 'Pureed diet', 'Diabetic diet', 'Renal diet', 'Nil by mouth', 'Enteral feeding', 'Parenteral nutrition'].map((d) => <option key={d}>{d}</option>)}</Select></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Assessment saved'); }}>Save Assessment</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
