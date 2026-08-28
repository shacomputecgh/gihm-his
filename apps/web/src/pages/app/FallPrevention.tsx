import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface FallRisk {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  bed: string;
  age: number;
  morseScore: number; // Morse Fall Scale
  riskLevel: 'Low' | 'Moderate' | 'High';
  history: boolean;
  secondaryDx: boolean;
  ambulatoryAid: boolean;
  ivHeparin: boolean;
  gait: boolean;
  mentalStatus: boolean;
  interventions: string[];
  lastAssessment: string;
  nextAssessment: string;
  incidentToday: boolean;
}

const SAMPLE: FallRisk[] = [
  { id: 'FR-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', ward: 'Medical', bed: 'Bed 3', age: 78, morseScore: 75, riskLevel: 'High', history: true, secondaryDx: true, ambulatoryAid: true, ivHeparin: false, gait: true, mentalStatus: true, interventions: ['Yellow fall wristband', 'Bed at lowest position', 'Call bell within reach', 'Non-slip footwear', 'Hourly rounding', 'PT/OT referral'], lastAssessment: '2026-08-25', nextAssessment: '2026-08-26', incidentToday: false },
  { id: 'FR-002', patientName: 'Ama Osei', mrn: 'MRN-12350', ward: 'Maternity', bed: 'Bed 5', age: 28, morseScore: 15, riskLevel: 'Low', history: false, secondaryDx: false, ambulatoryAid: false, ivHeparin: false, gait: false, mentalStatus: false, interventions: ['Standard precautions'], lastAssessment: '2026-08-25', nextAssessment: '2026-08-27', incidentToday: false },
  { id: 'FR-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', ward: 'ICU', bed: 'Bed 2', age: 65, morseScore: 55, riskLevel: 'Moderate', history: false, secondaryDx: true, ambulatoryAid: false, ivHeparin: true, gait: true, mentalStatus: false, interventions: ['Yellow fall wristband', 'Bed at lowest position', 'Call bell within reach', 'Non-slip footwear'], lastAssessment: '2026-08-25', nextAssessment: '2026-08-26', incidentToday: false },
  { id: 'FR-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', ward: 'Emergency', bed: 'Triage 3', age: 82, morseScore: 85, riskLevel: 'High', history: true, secondaryDx: true, ambulatoryAid: true, ivHeparin: false, gait: true, mentalStatus: true, interventions: ['Red fall wristband', '1:1 sitter', 'Bed at lowest position', 'Bed rails up', 'Call bell within reach', 'Non-slip footwear', 'Hourly rounding', 'PT/OT referral'], lastAssessment: '2026-08-25', nextAssessment: '2026-08-25', incidentToday: true },
];

const RISK_COLORS: Record<string, { bg: string; text: string }> = { Low: { bg: 'bg-green-100', text: 'text-green-800' }, Moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800' }, High: { bg: 'bg-red-100', text: 'text-red-800' } };

function _calcMorse(r: FallRisk): number {
  let score = 0;
  if (r.history) score += 25;
  if (r.secondaryDx) score += 15;
  if (r.ambulatoryAid) score += 15;
  if (r.ivHeparin) score += 20;
  if (r.gait) score += 10;
  if (r.mentalStatus) score += 15;
  return score;
}

export default function FallPrevention() {
  const [tab, setTab] = useState<'overview' | 'patients' | 'incidents' | 'protocols'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚠️ Fall Prevention</h1>
          <p className="text-gray-600 mt-1">Morse Fall Scale · Risk assessment · Interventions · Incident tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assessed', value: SAMPLE.length, icon: '📋', color: 'text-blue-600' },
          { label: 'High Risk', value: SAMPLE.filter(r => r.riskLevel === 'High').length, icon: '🔴', color: 'text-red-600' },
          { label: 'Falls Today', value: SAMPLE.filter(r => r.incidentToday).length, icon: '🚨', color: 'text-red-600' },
          { label: 'Avg Morse Score', value: Math.round(SAMPLE.reduce((s, r) => s + r.morseScore, 0) / SAMPLE.length), icon: '📊', color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(['overview', 'patients', 'incidents', 'protocols'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'patients' ? '👥 Patients' : t === 'incidents' ? '🚨 Incidents' : '📋 Protocols'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              {['High', 'Moderate', 'Low'].map(level => {
                const count = SAMPLE.filter(r => r.riskLevel === level).length;
                const pct = SAMPLE.length > 0 ? (count / SAMPLE.length * 100) : 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={`${RISK_COLORS[level].bg} ${RISK_COLORS[level].text}`}>{level}</Badge><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${level === 'High' ? 'bg-red-500' : level === 'Moderate' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Morse Fall Scale Criteria</h3>
            <div className="space-y-1 text-sm">
              {['History of falling (25 pts)', 'Secondary diagnosis (15 pts)', 'Ambulatory aid (15 pts)', 'IV/Heparin lock (20 pts)', 'Gait (10 pts)', 'Mental status (15 pts)'].map((c, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded">{c}</div>
              ))}
              <div className="mt-2 p-2 bg-yellow-50 rounded font-bold">0-24: Low | 25-50: Moderate | 51+: High</div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'patients' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Ward/Bed</th>
                <th className="px-4 py-3 text-left">Age</th>
                <th className="px-4 py-3 text-left">Morse Score</th>
                <th className="px-4 py-3 text-left">Risk</th>
                <th className="px-4 py-3 text-left">Interventions</th>
                <th className="px-4 py-3 text-left">Fall Today</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.sort((a, b) => b.morseScore - a.morseScore).map(r => {
                const rc = RISK_COLORS[r.riskLevel];
                return (
                  <tr key={r.id} className={`border-b hover:bg-gray-50 ${r.incidentToday ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3"><div className="font-medium">{r.patientName}</div><div className="text-xs text-gray-500">{r.mrn}</div></td>
                    <td className="px-4 py-3">{r.ward} / {r.bed}</td>
                    <td className="px-4 py-3">{r.age}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${r.morseScore >= 51 ? 'text-red-600' : r.morseScore >= 25 ? 'text-yellow-600' : 'text-green-600'}`}>{r.morseScore}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`}>{r.riskLevel}</span></td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate">{r.interventions.join(', ')}</td>
                    <td className="px-4 py-3">{r.incidentToday ? <span className="text-red-600 font-bold">🚨 YES</span> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="space-y-4">
          {SAMPLE.filter(r => r.incidentToday).map(r => (
            <Card key={r.id} className="p-5 ring-2 ring-red-500">
              <div className="flex justify-between items-start">
                <div><h4 className="font-bold text-red-800">🚨 Fall Incident — {r.patientName}</h4><div className="text-sm text-gray-600 mt-1">{r.ward} {r.bed} · Age {r.age} · Morse Score: {r.morseScore}</div></div>
                <Badge className="bg-red-100 text-red-800">Fall Today</Badge>
              </div>
              <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm">
                <div className="font-medium text-red-800">Incident Report Filed</div>
                <div className="text-red-600 mt-1">Patient found on floor beside bed. No apparent injury. Vitals stable. Neurological assessment completed. Doctor notified. Incident form completed per hospital protocol.</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Time:</span> <strong>03:45</strong></div>
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Injury:</span> <strong>None</strong></div>
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Witness:</span> <strong>Staff Nurse</strong></div>
              </div>
            </Card>
          ))}
          {SAMPLE.filter(r => r.incidentToday).length === 0 && <Card className="p-6 text-center text-gray-500">✅ No fall incidents today</Card>}
        </div>
      )}

      {tab === 'protocols' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">🔴 High Risk Interventions</h3>
            <div className="space-y-2">
              {['Red/yellow fall risk wristband', 'Bed at lowest position with brakes locked', 'Call bell within reach at all times', 'Non-slip footwear provided', 'Hourly purposeful rounding', 'PT/OT referral within 24h', '1:1 sitter if confused', 'Bed rails up per care plan', 'Toileting schedule every 2h', 'Medications reviewed for fall risk'].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded"><span className="text-red-600">🔴</span><span className="text-sm">{item}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">🟡 Moderate Risk Interventions</h3>
            <div className="space-y-2">
              {['Yellow fall risk wristband', 'Bed at lowest position', 'Call bell within reach', 'Non-slip footwear', 'Rounding every 2 hours', 'Ambulation assistance', 'Toileting schedule every 3-4h'].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 rounded"><span className="text-yellow-600">🟡</span><span className="text-sm">{item}</span></div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
