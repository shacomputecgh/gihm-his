import { useState } from 'react';
import { Badge, Button, Card, Field, Input, PageHeader, useToast } from '../../components/ui';

interface Survey {
  id: string;
  patientName: string;
  department: string;
  overall: number;
  cleanliness: number;
  staffBehavior: number;
  waitTime: number;
  wouldRecommend: boolean;
  comment: string;
  date: string;
}

const DEMO_SURVEYS: Survey[] = [
  { id: '1', patientName: 'Kofi A.', department: 'Emergency', overall: 5, cleanliness: 4, staffBehavior: 5, waitTime: 3, wouldRecommend: true, comment: 'Excellent care despite the wait. The nurses were very professional.', date: '2024-01-15' },
  { id: '2', patientName: 'Ama D.', department: 'Pharmacy', overall: 4, cleanliness: 5, staffBehavior: 4, waitTime: 4, wouldRecommend: true, comment: 'Fast service. Pharmacist explained my medication well.', date: '2024-01-14' },
  { id: '3', patientName: 'Yaw M.', department: 'Laboratory', overall: 3, cleanliness: 3, staffBehavior: 4, waitTime: 2, wouldRecommend: false, comment: 'Long wait time for blood test results. Could improve.', date: '2024-01-13' },
  { id: '4', patientName: 'Akua B.', department: 'Maternity', overall: 5, cleanliness: 5, staffBehavior: 5, waitTime: 4, wouldRecommend: true, comment: 'Amazing maternity ward! Clean, professional, and caring staff.', date: '2024-01-12' },
  { id: '5', patientName: 'Nana K.', department: 'Surgery', overall: 4, cleanliness: 4, staffBehavior: 5, waitTime: 3, wouldRecommend: true, comment: 'Surgery went well. Post-op care was excellent.', date: '2024-01-11' },
];

const DEPARTMENTS = ['All', 'Emergency', 'Pharmacy', 'Laboratory', 'Maternity', 'Surgery', 'Internal Medicine', 'Pediatrics'];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          className={`text-xl ${n <= value ? 'text-yellow-400' : 'text-slate-300'} ${onChange ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PatientSatisfaction() {
  const toast = useToast();
  const [surveys, setSurveys] = useState<Survey[]>(DEMO_SURVEYS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', department: 'Emergency', overall: 0, cleanliness: 0, staffBehavior: 0, waitTime: 0, wouldRecommend: true, comment: '' });
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? surveys : surveys.filter((s) => s.department === filter);
  const avgOverall = surveys.length ? (surveys.reduce((s, v) => s + v.overall, 0) / surveys.length).toFixed(1) : '0';
  const avgCleanliness = surveys.length ? (surveys.reduce((s, v) => s + v.cleanliness, 0) / surveys.length).toFixed(1) : '0';
  const avgStaff = surveys.length ? (surveys.reduce((s, v) => s + v.staffBehavior, 0) / surveys.length).toFixed(1) : '0';
  const avgWait = surveys.length ? (surveys.reduce((s, v) => s + v.waitTime, 0) / surveys.length).toFixed(1) : '0';
  const recommendPercent = surveys.length ? Math.round((surveys.filter((s) => s.wouldRecommend).length / surveys.length) * 100) : 0;

  function submitSurvey() {
    if (!form.patientName || form.overall === 0) {
      toast('Patient name and overall rating are required', 'error');
      return;
    }
    setSurveys([{ id: String(Date.now()), ...form, date: new Date().toISOString().slice(0, 10) }, ...surveys]);
    setForm({ patientName: '', department: 'Emergency', overall: 0, cleanliness: 0, staffBehavior: 0, waitTime: 0, wouldRecommend: true, comment: '' });
    setShowForm(false);
    toast('Survey submitted. Thank you!', 'success');
  }

  return (
    <div>
      <PageHeader
        title="📋 Patient Satisfaction Survey"
        subtitle={`${surveys.length} surveys collected · ${recommendPercent}% would recommend`}
        action={<Button variant="green" onClick={() => setShowForm(!showForm)}>+ New Survey</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-xs font-bold text-slate-400">Overall</p><p className="text-2xl font-bold text-yellow-600">⭐ {avgOverall}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Cleanliness</p><p className="text-2xl font-bold text-blue-600">⭐ {avgCleanliness}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Staff Behavior</p><p className="text-2xl font-bold text-green-600">⭐ {avgStaff}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Wait Time</p><p className="text-2xl font-bold text-amber-600">⭐ {avgWait}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Would Recommend</p><p className="text-2xl font-bold text-green-600">{recommendPercent}%</p></Card>
      </div>

      {showForm && (
        <Card className="mb-5 border-green-200 bg-green-50" title="New Survey">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Patient Name"><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Patient name" /></Field>
            <Field label="Department">
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {DEPARTMENTS.filter((d) => d !== 'All').map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-600">Overall Rating</p><StarRating value={form.overall} onChange={(v) => setForm({ ...form, overall: v })} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-600">Cleanliness</p><StarRating value={form.cleanliness} onChange={(v) => setForm({ ...form, cleanliness: v })} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-600">Staff Behavior</p><StarRating value={form.staffBehavior} onChange={(v) => setForm({ ...form, staffBehavior: v })} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-600">Wait Time</p><StarRating value={form.waitTime} onChange={(v) => setForm({ ...form, waitTime: v })} /></div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.wouldRecommend} onChange={(e) => setForm({ ...form, wouldRecommend: e.target.checked })} className="h-4 w-4 accent-green-600" /><span className="text-sm font-semibold text-slate-700">Would recommend this facility</span></label>
          </div>
          <Field label="Comments" className="mt-4"><textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Share your experience..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3} /></Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="green" onClick={() => void submitSurvey()}>Submit Survey</Button>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {DEPARTMENTS.map((d) => (
          <button key={d} onClick={() => setFilter(d)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${filter === d ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{d}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{s.patientName}</p>
                  <Badge tone="navy">{s.department}</Badge>
                </div>
                <StarRating value={s.overall} />
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-slate-500">
                  <span>Cleanliness: ⭐ {s.cleanliness}</span>
                  <span>Staff: ⭐ {s.staffBehavior}</span>
                  <span>Wait: ⭐ {s.waitTime}</span>
                </div>
                {s.comment && <p className="mt-2 text-sm text-slate-600 italic">"{s.comment}"</p>}
              </div>
              <div className="text-right">
                <Badge tone={s.wouldRecommend ? 'green' : 'red'}>{s.wouldRecommend ? '👍 Recommends' : '👎 Doesn\'t Recommend'}</Badge>
                <p className="mt-1 text-xs text-slate-400">{s.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
