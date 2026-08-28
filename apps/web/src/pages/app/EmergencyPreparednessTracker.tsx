import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Drill {
  id: string; name: string; type: string; date: string;
  participants: number; duration: string;
  score: number; status: 'Completed' | 'Scheduled' | 'Cancelled';
  findings: string[];
}

interface Resource {
  name: string; required: number; available: number; status: string;
}

const DRILLS: Drill[] = [
  { id: 'DR-001', name: 'Mass Casualty Incident Drill', type: 'MCI', date: '2026-08-15', participants: 85, duration: '4 hours', score: 88, status: 'Completed', findings: ['Triage area too small', 'Communication delays between departments', 'Good team coordination'] },
  { id: 'DR-002', name: 'Fire Evacuation — Ward Block', type: 'Fire', date: '2026-07-20', participants: 120, duration: '2 hours', score: 92, status: 'Completed', findings: ['Evacuation time 12 min (target < 15)', 'Two stairwells used effectively', 'Some staff unfamiliar with assembly point'] },
  { id: 'DR-003', name: 'Chemical Spill Response', type: 'Hazmat', date: '2026-09-15', participants: 30, duration: '3 hours', score: 0, status: 'Scheduled', findings: [] },
  { id: 'DR-004', name: 'Pandemic Surge Drill', type: 'Infectious Disease', date: '2026-06-10', participants: 150, duration: '6 hours', score: 85, status: 'Completed', findings: ['PPE donning/doffing procedure good', 'Ventilator supply adequate', 'Staff rotation plan needs improvement'] },
];

const RESOURCES: Resource[] = [
  { name: 'Ventilators (Critical Care)', required: 20, available: 18, status: 'Adequate' },
  { name: 'Oxygen Cylinders', required: 100, available: 85, status: 'Low' },
  { name: 'PPE Sets (N95)', required: 500, available: 450, status: 'Adequate' },
  { name: 'Emergency Medications', required: 50, available: 48, status: 'Adequate' },
  { name: 'Portable Monitors', required: 15, available: 12, status: 'Low' },
  { name: 'Blood Units (O-)', required: 20, available: 8, status: 'Critical' },
  { name: 'Ambulances', required: 4, available: 3, status: 'Low' },
  { name: 'Generator Fuel (hrs)', required: 72, available: 96, status: 'Adequate' },
];

const STATUS_COLORS: Record<string, string> = { Completed: 'bg-green-100 text-green-800', Scheduled: 'bg-blue-100 text-blue-800', Cancelled: 'bg-red-100 text-red-800' };
const RES_COLORS: Record<string, string> = { Adequate: 'bg-green-100 text-green-800', Low: 'bg-yellow-100 text-yellow-800', Critical: 'bg-red-100 text-red-800' };

export default function EmergencyPreparednessTracker() {
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
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Emergency Preparedness Tracker</h1><p className="text-gray-500">Disaster drills, resource readiness, contingency plans, and surge capacity management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Drills Completed', value: DRILLS.filter(d => d.status === 'Completed').length, color: 'text-green-600' }, { label: 'Avg Drill Score', value: Math.round(DRILLS.filter(d => d.score > 0).reduce((s, d) => s + d.score, 0) / DRILLS.filter(d => d.score > 0).length), color: 'text-blue-600' }, { label: 'Critical Resources', value: RESOURCES.filter(r => r.status === 'Critical').length, color: 'text-red-600' }, { label: 'Low Resources', value: RESOURCES.filter(r => r.status === 'Low').length, color: 'text-yellow-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-4">Emergency Drills</h3>
          <div className="space-y-4">
            {DRILLS.map(d => (
              <div key={d.id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2"><span className="font-bold text-sm">{d.name}</span><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></div>
                <div className="flex gap-4 text-xs text-gray-500 mb-2"><span>Type: {d.type}</span><span>Date: {d.date}</span><span>{d.participants} participants</span><span>{d.duration}</span></div>
                {d.score > 0 && <div className="flex items-center gap-2"><div className="flex-1 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${d.score >= 85 ? 'bg-green-500' : d.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.score}%` }} /></div><span className="font-bold text-sm">{d.score}/100</span></div>}
                {d.findings.length > 0 && <div className="mt-2 space-y-1">{d.findings.map((f, i) => <div key={i} className="text-xs bg-blue-50 border border-blue-200 rounded p-1.5">• {f}</div>)}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-4">Emergency Resources</h3>
          <div className="space-y-3">
            {RESOURCES.sort((a, b) => { const order = { Critical: 0, Low: 1, Adequate: 2 }; return order[a.status as keyof typeof order] - order[b.status as keyof typeof order]; }).map(r => (
              <div key={r.name} className="border-b pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{r.name}</span><Badge className={RES_COLORS[r.status]}>{r.status}</Badge></div>
                <div className="flex items-center gap-2"><div className="flex-1 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${r.status === 'Adequate' ? 'bg-green-500' : r.status === 'Low' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min((r.available / r.required) * 100, 100)}%` }} /></div><span className="text-xs font-bold">{r.available}/{r.required}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
