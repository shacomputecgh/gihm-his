import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface VitalEntry { id: string; patientName: string; mrn: string; ward: string; bed: string; recordedBy: string; recordedAt: string; bp: string; hr: number; respRate: number; temp: number; spO2: number; painScore: number; bloodGlucose?: string; weight?: string; height?: string; bmi?: string; notes: string; abnormalFlags: string[]; }

const VITALS: VitalEntry[] = [
  { id: 'VS-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', bed: 'B-12', recordedBy: 'Nurse Akua', recordedAt: '2026-08-26 08:00', bp: '128/82', hr: 78, respRate: 16, temp: 36.8, spO2: 98, painScore: 3, bloodGlucose: '5.8', weight: '72kg', height: '172cm', bmi: '24.3', notes: 'Post-op Day 2. Comfortable.', abnormalFlags: [] },
  { id: 'VS-002', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', bed: 'ICU-08', recordedBy: 'ICU Nurse', recordedAt: '2026-08-26 09:00', bp: '85/50', hr: 130, respRate: 28, temp: 38.5, spO2: 91, painScore: 0, notes: 'Unstable. On HFNC 40L.', abnormalFlags: ['Hypotension', 'Tachycardia', 'Hypoxia', 'Fever'] },
  { id: 'VS-003', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', bed: 'B-12', recordedBy: 'Nurse Esi', recordedAt: '2026-08-26 08:30', bp: '142/90', hr: 88, respRate: 18, temp: 36.5, spO2: 97, painScore: 0, bloodGlucose: '14.2', weight: '85kg', height: '165cm', bmi: '31.2', notes: 'Blood glucose elevated. DM patient.', abnormalFlags: ['Hypertension', 'Elevated glucose', 'Obesity'] },
  { id: 'VS-004', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', ward: 'Paediatric', bed: 'P-01', recordedBy: 'Nurse Yaa', recordedAt: '2026-08-26 07:30', bp: '95/60', hr: 110, respRate: 24, temp: 39.2, spO2: 96, painScore: 4, notes: 'High fever. Antimalarials given.', abnormalFlags: ['Fever', 'Tachycardia (paediatric)'] },
  { id: 'VS-005', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', ward: 'Oncology', bed: 'ONC-05', recordedBy: 'Nurse Abena', recordedAt: '2026-08-26 08:15', bp: '118/72', hr: 95, respRate: 20, temp: 37.8, spO2: 97, painScore: 2, notes: 'Low-grade fever post-chemo. Monitoring.', abnormalFlags: ['Low-grade fever'] },
  { id: 'VS-006', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', ward: 'ICU', bed: 'ICU-11', recordedBy: 'ICU Nurse', recordedAt: '2026-08-26 09:15', bp: '165/95', hr: 55, respRate: 30, temp: 37.0, spO2: 88, painScore: 0, bloodGlucose: '7.2', notes: 'On ventilator. Sedated. BP high.', abnormalFlags: ['Hypertension', 'Bradycardia', 'Hypoxia', 'Tachypnoea'] },
];

export default function VitalSignsChartingEnhanced() {
  const [selected, setSelected] = useState<VitalEntry | null>(null);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? VITALS : VITALS.filter(v => v.abnormalFlags.length > 0);
  const abnormalCount = VITALS.filter(v => v.abnormalFlags.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vital Signs Charting</h1>
          <p className="text-slate-500 text-sm">Record, trend, and monitor patient vital signs</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Record Vitals</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Records Today</p><p className="text-2xl font-bold">{VITALS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Abnormal Alerts</p><p className="text-2xl font-bold text-red-600">{abnormalCount}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">ICU Patients</p><p className="text-2xl font-bold">{VITALS.filter(v => v.ward === 'ICU').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Overdue Charting</p><p className="text-2xl font-bold text-orange-600">2</p></Card>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('All')} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === 'All' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
        <button onClick={() => setFilter('Abnormal')} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === 'Abnormal' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>⚠️ Abnormal Only</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filtered.map(v => (
            <Card key={v.id} className={`p-4 cursor-pointer hover:shadow transition ${selected?.id === v.id ? 'ring-2 ring-blue-500' : ''} ${v.abnormalFlags.length > 0 ? 'border-red-200' : ''}`} onClick={() => setSelected(selected?.id === v.id ? null : v)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{v.patientName}</span>
                    {v.abnormalFlags.length > 0 && <Badge tone="red">{v.abnormalFlags.length} alert{v.abnormalFlags.length > 1 ? 's' : ''}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{v.mrn} · {v.ward} Bed {v.bed} · {v.recordedAt}</p>
                </div>
                <div className="flex gap-1">
                  {v.abnormalFlags.slice(0, 2).map((f, i) => (
                    <Badge key={i} tone="red">{f}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-3 text-center">
                <div><p className="text-xs text-slate-400">BP</p><p className={`font-bold text-sm ${parseInt(v.bp.split('/')[0] ?? '0') > 140 || parseInt(v.bp.split('/')[1] ?? '0') > 90 ? 'text-red-600' : ''}`}>{v.bp}</p></div>
                <div><p className="text-xs text-slate-400">HR</p><p className={`font-bold text-sm ${v.hr > 100 || v.hr < 60 ? 'text-red-600' : ''}`}>{v.hr}</p></div>
                <div><p className="text-xs text-slate-400">Temp</p><p className={`font-bold text-sm ${v.temp > 37.5 ? 'text-orange-600' : ''}`}>{v.temp}°</p></div>
                <div><p className="text-xs text-slate-400">SpO₂</p><p className={`font-bold text-sm ${v.spO2 < 94 ? 'text-red-600' : ''}`}>{v.spO2}%</p></div>
                <div><p className="text-xs text-slate-400">Pain</p><p className={`font-bold text-sm ${v.painScore >= 7 ? 'text-red-600' : v.painScore >= 4 ? 'text-orange-600' : 'text-green-600'}`}>{v.painScore}/10</p></div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="p-6 h-fit sticky top-4">
            <h2 className="text-lg font-bold mb-2">{selected.patientName} — Vital Signs Detail</h2>
            <p className="text-xs text-slate-500 mb-4">{selected.mrn} · {selected.ward} Bed {selected.bed} · {selected.recordedAt} by {selected.recordedBy}</p>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Blood Pressure</p><p className={`text-xl font-bold ${parseInt(selected.bp.split('/')[0] ?? '0') > 140 ? 'text-red-600' : ''}`}>{selected.bp}</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Heart Rate</p><p className={`text-xl font-bold ${selected.hr > 100 || selected.hr < 60 ? 'text-red-600' : ''}`}>{selected.hr} bpm</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Temperature</p><p className={`text-xl font-bold ${selected.temp > 37.5 ? 'text-orange-600' : ''}`}>{selected.temp}°C</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">SpO₂</p><p className={`text-xl font-bold ${selected.spO2 < 94 ? 'text-red-600' : 'text-green-600'}`}>{selected.spO2}%</p></div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Resp Rate</p><p className="text-xl font-bold">{selected.respRate}/min</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Pain Score</p><p className={`text-xl font-bold ${selected.painScore >= 7 ? 'text-red-600' : selected.painScore >= 4 ? 'text-orange-600' : 'text-green-600'}`}>{selected.painScore}/10</p></div>
              {selected.bloodGlucose && <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Blood Glucose</p><p className={`text-xl font-bold ${parseFloat(selected.bloodGlucose) > 11 ? 'text-red-600' : ''}`}>{selected.bloodGlucose} mmol/L</p></div>}
              {selected.bmi && <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">BMI</p><p className={`text-xl font-bold ${parseFloat(selected.bmi) > 30 ? 'text-orange-600' : ''}`}>{selected.bmi}</p></div>}
            </div>

            {selected.abnormalFlags.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Abnormal Alerts</p>
                <div className="flex flex-wrap gap-1">{selected.abnormalFlags.map((f, i) => <Badge key={i} tone="red">{f}</Badge>)}</div>
              </div>
            )}

            <div className="mb-4"><p className="text-xs font-semibold text-slate-500">Notes</p><p className="text-sm mt-1">{selected.notes}</p></div>

            <div className="flex gap-2">
              <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">📈 View Trend</button>
              <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">📄 Export PDF</button>
              <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">🔔 Set Alert</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
