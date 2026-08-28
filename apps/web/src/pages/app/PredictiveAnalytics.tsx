import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Prediction {
  id: string; patientName: string; prediction: string; risk: number;
  factors: string[]; intervention: string; confidence: number;
  model: string;
}

const PREDICTIONS: Prediction[] = [
  { id: 'PR-001', patientName: 'Kwame Asante', prediction: 'Cardiac Arrest Risk', risk: 78, factors: ['Rising heart rate', 'Falling BP', 'Low SpO2', 'Elevated lactate'], intervention: 'Activate rapid response team', confidence: 85, model: 'Cardiac Monitor AI v2.1' },
  { id: 'PR-002', patientName: 'Akua Mensah', prediction: 'ICU Transfer Risk', risk: 65, factors: ['Worsening vital signs', 'Rising NEWS score', 'Acute kidney injury'], intervention: 'ICU consultation and close monitoring', confidence: 72, model: 'NEWS2 Predictor v1.3' },
  { id: 'PR-003', patientName: 'Nana Osei', prediction: 'Sepsis Onset', risk: 82, factors: ['Fever + tachycardia', 'Raised WCC', 'Elevated procalcitonin', 'Hypotension'], intervention: 'Sepsis bundle — blood cultures, lactate, fluids, antibiotics', confidence: 88, model: 'Sepsis Alert AI v3.0' },
  { id: 'PR-004', patientName: 'Yaw Boateng', prediction: '30-Day Readmission', risk: 45, factors: ['Previous admissions', 'Multiple comorbidities', 'Polypharmacy', 'Social isolation'], intervention: 'Enhanced discharge planning, follow-up call in 48h', confidence: 68, model: 'Readmission Risk v1.5' },
  { id: 'PR-005', patientName: 'Efua Nyarko', prediction: 'Falls Risk', risk: 70, factors: ['Age > 65', 'Mobility impairment', 'Sedation', 'Previous falls'], intervention: 'Fall prevention protocol, bed alarm, 1:1 supervision', confidence: 75, model: 'Falls Predictor v1.2' },
];

const POPULATION_INSIGHTS = [
  { metric: 'Avg Length of Stay', current: '5.2 days', target: '< 5.0 days', trend: 'Improving', color: 'text-green-600' },
  { metric: 'Readmission Rate (30-day)', current: '12.5%', target: '< 10%', trend: 'Stable', color: 'text-yellow-600' },
  { metric: 'ICU Mortality', current: '18.2%', target: '< 15%', trend: 'Improving', color: 'text-green-600' },
  { metric: 'Sepsis Mortality', current: '22%', target: '< 20%', trend: 'Worsening', color: 'text-red-600' },
  { metric: 'Hospital-Acquired Infections', current: '8.5%', target: '< 5%', trend: 'Stable', color: 'text-yellow-600' },
];

const RISK_COLORS = (risk: number) => risk >= 70 ? 'text-red-600 bg-red-50 border-red-200' : risk >= 50 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200';

export default function PredictiveAnalytics() {
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
          title="Add New Prediction Model"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Predictive Analytics & AI</h1><p className="text-gray-500">AI-powered clinical predictions, patient deterioration alerts, readmission risk, and population health insights</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Predictions', value: PREDICTIONS.length, color: 'text-blue-600' }, { label: 'High Risk', value: PREDICTIONS.filter(p => p.risk >= 70).length, color: 'text-red-600' }, { label: 'Models Active', value: 5, color: 'text-green-600' }, { label: 'Avg Confidence', value: `${Math.round(PREDICTIONS.reduce((s, p) => s + p.confidence, 0) / PREDICTIONS.length)}%`, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white">Active Predictions</div>
        <div className="px-4 py-2 rounded-lg text-sm font-medium bg-white border text-gray-600">Population Insights</div>
      </div>

      <div className="space-y-3">
        {PREDICTIONS.sort((a, b) => b.risk - a.risk).map(p => (
          <div key={p.id} className={`bg-white rounded-lg border p-4 ${RISK_COLORS(p.risk)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="font-bold">{p.patientName}</span><span className="text-sm">— {p.prediction}</span></div>
              <div className="flex items-center gap-2"><span className="text-sm">Risk:</span><span className="text-2xl font-bold">{p.risk}%</span><span className="text-xs text-gray-500">Confidence: {p.confidence}%</span></div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">{p.factors.map((f, i) => <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">{f}</span>)}</div>
            <div className="flex items-center justify-between"><div className="text-sm bg-blue-50 border border-blue-200 rounded p-2"><strong>Intervention:</strong> {p.intervention}</div><div className="text-xs text-gray-500">{p.model}</div></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-4">Population Health Insights</h3>
        <div className="space-y-3">
          {POPULATION_INSIGHTS.map((pi, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div><span className="font-medium text-sm">{pi.metric}</span></div>
              <div className="flex items-center gap-4"><span className="font-bold">{pi.current}</span><span className="text-xs text-gray-500">Target: {pi.target}</span><Badge className={pi.color === 'text-green-600' ? 'bg-green-100 text-green-800' : pi.color === 'text-red-600' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{pi.trend}</Badge></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
