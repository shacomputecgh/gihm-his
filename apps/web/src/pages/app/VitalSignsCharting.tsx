import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface VitalReading {
  id: string; patientName: string; mrn: string; ward: string; bed: string;
  recordedAt: string; recordedBy: string;
  temperature: number; pulse: number; respRate: number; systolic: number; diastolic: number;
  spO2: number; painScore: number; bloodGlucose?: number; weight?: number;
  consciousness: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';
  abnormal: string[];
}

const INITIAL: VitalReading[] = [
  { id: 'VS-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', bed: 'MW-12', recordedAt: '2026-08-25 08:00', recordedBy: 'Nurse Ama', temperature: 37.2, pulse: 82, respRate: 18, systolic: 128, diastolic: 82, spO2: 97, painScore: 2, consciousness: 'Alert', abnormal: [] },
  { id: 'VS-002', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', bed: 'MW-12', recordedAt: '2026-08-25 14:00', recordedBy: 'Nurse Esi', temperature: 38.4, pulse: 96, respRate: 22, systolic: 138, diastolic: 88, spO2: 95, painScore: 5, bloodGlucose: 8.2, consciousness: 'Alert', abnormal: ['Fever', 'Tachycardia', 'Elevated BP'] },
  { id: 'VS-003', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', bed: 'ICU-03', recordedAt: '2026-08-25 06:00', recordedBy: 'Nurse Abena', temperature: 38.9, pulse: 110, respRate: 28, systolic: 92, diastolic: 58, spO2: 88, painScore: 7, bloodGlucose: 12.5, consciousness: 'Voice', abnormal: ['Fever', 'Tachycardia', 'Hypotension', 'Desaturation', 'Tachypnoea', 'Hyperglycaemia', 'Elevated pain'] },
  { id: 'VS-004', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', ward: 'Surgical Ward', bed: 'SW-08', recordedAt: '2026-08-25 07:00', recordedBy: 'Nurse Kofi', temperature: 36.8, pulse: 72, respRate: 14, systolic: 120, diastolic: 76, spO2: 99, painScore: 1, consciousness: 'Alert', abnormal: [] },
];

const CONSCIOUSNESS = ['Alert', 'Voice', 'Pain', 'Unresponsive'];

function checkAbnormal(v: { temperature: number; pulse: number; respRate: number; systolic: number; diastolic: number; spO2: number; painScore: number; bloodGlucose?: number | string }) {
  const ab: string[] = [];
  const bg = v.bloodGlucose !== undefined && v.bloodGlucose !== '' ? Number(v.bloodGlucose) : undefined;
  if (v.temperature >= 37.5) ab.push('Fever');
  if (v.temperature <= 35.0) ab.push('Hypothermia');
  if (v.pulse > 100) ab.push('Tachycardia');
  if (v.pulse < 60) ab.push('Bradycardia');
  if (v.respRate > 20) ab.push('Tachypnoea');
  if (v.respRate < 12) ab.push('Bradypnoea');
  if (v.systolic > 140 || v.diastolic > 90) ab.push('Elevated BP');
  if (v.systolic < 90) ab.push('Hypotension');
  if (v.spO2 < 94) ab.push('Desaturation');
  if (v.painScore >= 7) ab.push('Severe pain');
  if (bg !== undefined && bg > 11.0) ab.push('Hyperglycaemia');
  if (bg !== undefined && bg < 4.0) ab.push('Hypoglycaemia');
  return ab;
}

export default function VitalSignsCharting() {
  const [records, setRecords] = useState<VitalReading[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ patientName: '', mrn: '', ward: '', bed: '', recordedBy: '', temperature: 37.0, pulse: 80, respRate: 16, systolic: 120, diastolic: 80, spO2: 98, painScore: 0, bloodGlucose: '', consciousness: 'Alert' as VitalReading['consciousness'] });
  const toast = useToast();

  const filtered = records.filter((r) => !filter || r.patientName.toLowerCase().includes(filter.toLowerCase()) || r.mrn.includes(filter));
  const abnormalCount = records.filter((r) => r.abnormal.length > 0).length;
  const recentReadings = records.filter((r) => {
    const d = new Date(r.recordedAt);
    return Date.now() - d.getTime() < 4 * 3600000;
  });

  const handleAdd = () => {
    const ab = checkAbnormal(form);
    const r: VitalReading = {
      id: `VS-${String(records.length + 1).padStart(3, '0')}`,
      patientName: form.patientName, mrn: form.mrn, ward: form.ward, bed: form.bed,
      recordedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      recordedBy: form.recordedBy, temperature: form.temperature, pulse: form.pulse,
      respRate: form.respRate, systolic: form.systolic, diastolic: form.diastolic,
      spO2: form.spO2, painScore: form.painScore,
      bloodGlucose: form.bloodGlucose ? Number(form.bloodGlucose) : undefined,
      consciousness: form.consciousness, abnormal: ab,
    };
    setRecords([r, ...records]); setShowForm(false);
    if (ab.length > 0) toast(`⚠️ ${ab.length} abnormal vital(s) detected!`);
    else toast('Vitals recorded successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Vital Signs Charting</h1><p className="text-gray-500">Record, monitor, and trend patient vital signs with automatic abnormal detection</p></div>
        <Button onClick={() => setShowForm(true)}>+ Record Vitals</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{records.length}</div><div className="text-sm text-gray-500">Total Readings</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{records.length - abnormalCount}</div><div className="text-sm text-gray-500">Normal</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{abnormalCount}</div><div className="text-sm text-gray-500">Abnormal</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{recentReadings.length}</div><div className="text-sm text-gray-500">Last 4 Hours</div></Card>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search patient or MRN..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64" />
        <Button variant="outline" onClick={() => setFilter('')}>Clear</Button>
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="p-2">Time</th><th className="p-2">Patient</th><th className="p-2">Location</th>
              <th className="p-2">Temp</th><th className="p-2">Pulse</th><th className="p-2">RR</th>
              <th className="p-2">BP</th><th className="p-2">SpO2</th><th className="p-2">Pain</th>
              <th className="p-2">Consciousness</th><th className="p-2">Status</th>
            </tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className={`border-b ${r.abnormal.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="p-2 text-xs">{r.recordedAt}<br /><span className="text-gray-400">{r.recordedBy}</span></td>
                <td className="p-2 font-medium">{r.patientName}<br /><span className="text-xs text-gray-400">{r.mrn}</span></td>
                <td className="p-2 text-xs">{r.ward} {r.bed}</td>
                <td className="p-2"><span className={r.temperature >= 37.5 ? 'text-red-600 font-bold' : ''}>{r.temperature}°C</span></td>
                <td className="p-2"><span className={r.pulse > 100 || r.pulse < 60 ? 'text-red-600 font-bold' : ''}>{r.pulse}</span></td>
                <td className="p-2"><span className={r.respRate > 20 ? 'text-red-600 font-bold' : ''}>{r.respRate}</span></td>
                <td className="p-2"><span className={r.systolic > 140 || r.systolic < 90 ? 'text-red-600 font-bold' : ''}>{r.systolic}/{r.diastolic}</span></td>
                <td className="p-2"><span className={r.spO2 < 94 ? 'text-red-600 font-bold' : ''}>{r.spO2}%</span></td>
                <td className="p-2"><span className={r.painScore >= 7 ? 'text-red-600 font-bold' : r.painScore >= 4 ? 'text-yellow-600' : ''}>{r.painScore}/10</span></td>
                <td className="p-2">{r.consciousness}</td>
                <td className="p-2">{r.abnormal.length === 0 ? <Badge tone="green">Normal</Badge> : <Badge tone="red">{r.abnormal.length} abnormal</Badge>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Record Vital Signs</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Patient Name *</label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">MRN *</label><Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Ward *</label><Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Bed</label><Input value={form.bed} onChange={(e) => setForm({ ...form, bed: e.target.value })} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Recorded By *</label><Input value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} /></div>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <h3 className="font-semibold mb-2">Vital Signs</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm mb-1">Temp (°C)</label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">Pulse (/min)</label><Input type="number" value={form.pulse} onChange={(e) => setForm({ ...form, pulse: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">Resp Rate (/min)</label><Input type="number" value={form.respRate} onChange={(e) => setForm({ ...form, respRate: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">Systolic BP</label><Input type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">Diastolic BP</label><Input type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">SpO2 (%)</label><Input type="number" value={form.spO2} onChange={(e) => setForm({ ...form, spO2: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">Pain (0-10)</label><Input type="number" min="0" max="10" value={form.painScore} onChange={(e) => setForm({ ...form, painScore: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm mb-1">Blood Glucose</label><Input type="number" step="0.1" value={form.bloodGlucose} onChange={(e) => setForm({ ...form, bloodGlucose: e.target.value })} placeholder="mmol/L" /></div>
                  <div><label className="block text-sm mb-1">Consciousness</label>
                    <Select value={form.consciousness} onChange={(e) => setForm({ ...form, consciousness: e.target.value as VitalReading['consciousness'] })}>
                      {CONSCIOUSNESS.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                </div>
                {(() => {
                  const ab = checkAbnormal(form);
                  if (ab.length === 0) return null;
                  return (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2">
                      <span className="text-sm font-medium text-red-700">⚠️ Abnormal: {ab.join(', ')}</span>
                    </div>
                  );
                })()}
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleAdd}>Record Vitals</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
