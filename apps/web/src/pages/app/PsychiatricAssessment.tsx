import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface PsychAssessment {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  consultant: string; date: string; referralReason: string;
  mentalStateExam: { appearance: string; behaviour: string; speech: string; mood: string; affect: string; thought: string; perception: string; cognition: string; insight: string; judgement: string };
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  risks: string[]; diagnosis: string; plan: string;
  status: 'Initial Assessment' | 'Review' | 'Discharged' | 'Transferred';
}

const INITIAL: PsychAssessment[] = [
  { id: 'PSY-001', patientName: 'Kwaku Mensah', mrn: 'MRN-2026-090', age: 35, sex: 'M', consultant: 'Dr. Darko', date: '2026-08-25', referralReason: 'Self-harm — wrist cutting',
    mentalStateExam: { appearance: 'Dishevelled, poor hygiene', behaviour: 'Agitated, pacing', speech: 'Rapid, pressured', mood: 'I feel hopeless', affect: 'Anxious, irritable', thought: 'Suicidal ideation, no plan', perception: 'No hallucinations', cognition: 'Alert, oriented x3', insight: 'Partial — admits need for help', judgement: 'Impaired — impulsive behaviour' },
    riskLevel: 'High', risks: ['Active suicidal ideation', 'Self-harm history', 'Impaired judgement', 'Social isolation'], diagnosis: 'Major Depressive Disorder, Recurrent', plan: 'Admit to psychiatric ward. Start Sertraline 50mg. 1:1 observation. Safety plan.', status: 'Initial Assessment' },
  { id: 'PSY-002', patientName: 'Ama Asare', mrn: 'MRN-2026-091', age: 28, sex: 'F', consultant: 'Dr. Darko', date: '2026-08-24', referralReason: 'First episode psychosis',
    mentalStateExam: { appearance: 'Young woman, dishevelled', behaviour: 'Suspicious, guarded', speech: 'Slow, poor volume', mood: 'Confused', affect: 'Flat, blunted', thought: 'Paranoid delusions, thought broadcasting', perception: 'Auditory hallucinations — command voices', cognition: 'Alert but preoccupied', insight: 'Poor — denies illness', judgement: 'Poor' },
    riskLevel: 'Moderate', risks: ['Command auditory hallucinations', 'Poor insight', 'Non-compliance risk'], diagnosis: 'Schizophrenia, First Episode', plan: 'Start Olanzapine 5mg. Psychoeducation. Family meeting. Review in 1 week.', status: 'Initial Assessment' },
];

const RISK_CONFIG: Record<string, { color: string; tone: 'green' | 'gold' | 'red' | 'blue' }> = {
  Low: { color: 'bg-green-100 text-green-800', tone: 'green' }, Moderate: { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  High: { color: 'bg-orange-100 text-orange-800', tone: 'gold' }, Critical: { color: 'bg-red-100 text-red-800', tone: 'red' },
};

export default function PsychiatricAssessment() {
  const [assessments] = useState<PsychAssessment[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const highRisk = assessments.filter((a) => a.riskLevel === 'High' || a.riskLevel === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Psychiatric Assessment</h1><p className="text-gray-500">Mental state examination, risk assessment, and treatment planning</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Assessment</Button>
      </div>
      {highRisk > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 font-bold">🚨 {highRisk} high-risk patient(s) requiring close monitoring</div>}
      <div className="space-y-4">
        {assessments.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{a.patientName}</span>
                  <span className="text-sm text-gray-400">{a.mrn} · {a.age}{a.sex}</span>
                  <Badge tone={RISK_CONFIG[a.riskLevel]?.tone}>{a.riskLevel} Risk</Badge>
                </div>
                <p className="text-sm text-gray-600">Referral: {a.referralReason} · {a.consultant} · {a.date}</p>
              </div>
              <Badge tone={a.status === 'Initial Assessment' ? 'blue' : 'green'}>{a.status}</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Mental State Examination</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(a.mentalStateExam).map(([key, val]) => (
                    <div key={key} className="flex"><span className="w-24 text-gray-500 capitalize">{key}:</span><span className="text-gray-700">{val}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="bg-red-50 rounded-lg p-3 mb-3">
                  <h4 className="font-medium text-sm text-red-700 mb-1">Risk Factors</h4>
                  <ul className="list-disc list-inside text-xs text-red-600">{a.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-sm text-blue-700 mb-1">Diagnosis & Plan</h4>
                  <p className="text-xs text-gray-700"><strong>DDx:</strong> {a.diagnosis}</p>
                  <p className="text-xs text-gray-700 mt-1"><strong>Plan:</strong> {a.plan}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Psychiatric Assessment</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Sex *</label><Select><option>M</option><option>F</option><option>Other</option></Select></div>
                <div><label className="block text-sm mb-1">Consultant *</label><Input placeholder="Dr. name" /></div>
                <div><label className="block text-sm mb-1">Risk Level *</label><Select>{Object.keys(RISK_CONFIG).map((r) => <option key={r}>{r}</option>)}</Select></div>
              </div>
              <div><label className="block text-sm mb-1">Referral Reason *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Assessment created'); }}>Create Assessment</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
