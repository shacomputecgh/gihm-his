import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface Handover {
  id: string;
  ward: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  date: string;
  outgoingNurse: string;
  incomingNurse: string;
  patientCount: number;
  criticalAlerts: string[];
  pendingTasks: string[];
  patients: { name: string; bed: string; diagnosis: string; status: string; alerts: string[] }[];
  completedTime: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

const SAMPLE: Handover[] = [
  { id: 'HO-001', ward: 'ICU', shift: 'Morning', date: '2026-08-25', outgoingNurse: 'Sister Akoto', incomingNurse: 'Sister Mensah', patientCount: 6, criticalAlerts: ['Bed 2: Rising lactate, monitor closely', 'Bed 5: New onset AF, cardiologist review pending'], pendingTasks: ['14:00 — Turn and reposition Bed 3', '15:00 — Blood culture Bed 1', '16:00 — Nephrology consult Bed 4'], patients: [{ name: 'Kofi Asante', bed: 'Bed 1', diagnosis: 'Sepsis', status: 'Stable', alerts: [] }, { name: 'Yaw Darko', bed: 'Bed 2', diagnosis: 'Cardiogenic Shock', status: 'Deteriorating', alerts: ['Rising lactate'] }, { name: 'Esi Kumah', bed: 'Bed 3', diagnosis: 'Pneumonia', status: 'Stable', alerts: [] }, { name: 'Akua Boateng', bed: 'Bed 4', diagnosis: 'AKI', status: 'Stable', alerts: [] }, { name: 'Kwame Mensah', bed: 'Bed 5', diagnosis: 'New AF', status: 'Monitoring', alerts: ['New AF, HR 110'] }, { name: 'Ama Osei', bed: 'Bed 6', diagnosis: 'DKA', status: 'Improving', alerts: [] }], completedTime: '07:30', status: 'Completed' },
  { id: 'HO-002', ward: 'Ward A', shift: 'Morning', date: '2026-08-25', outgoingNurse: 'Nurse Osei', incomingNurse: 'Nurse Appiah', patientCount: 12, criticalAlerts: ['Bed 8: Fall risk - confused patient', 'Bed 3: Pressure ulcer wound care due'], pendingTasks: ['09:00 — Wound dressing Bed 3', '10:00 — Medication review Bed 8', '11:00 — Physiotherapy Bed 5'], patients: [{ name: 'Patient 1', bed: 'Bed 1', diagnosis: 'Stroke Recovery', status: 'Stable', alerts: [] }, { name: 'Patient 3', bed: 'Bed 3', diagnosis: 'Pressure Ulcer Grade 3', status: 'Wound Care', alerts: ['Wound dressing due'] }], completedTime: '', status: 'In Progress' },
];

const SHIFT_COLORS: Record<string, string> = { Morning: 'bg-yellow-100 text-yellow-800', Afternoon: 'bg-blue-100 text-blue-800', Night: 'bg-purple-100 text-purple-800' };

export default function ShiftHandover() {
  const [selected, setSelected] = useState<Handover | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔄 Shift Handover</h1>
          <p className="text-gray-600 mt-1">SBAR format · Patient census · Critical alerts · Pending tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today Handovers', value: SAMPLE.length, icon: '🔄', color: 'text-blue-600' },
          { label: 'Completed', value: SAMPLE.filter(s => s.status === 'Completed').length, icon: '✅', color: 'text-green-600' },
          { label: 'Critical Alerts', value: SAMPLE.reduce((s, h) => s + h.criticalAlerts.length, 0), icon: '🚨', color: 'text-red-600' },
          { label: 'Pending Tasks', value: SAMPLE.reduce((s, h) => s + h.pendingTasks.length, 0), icon: '📋', color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAMPLE.map(h => (
          <Card key={h.id} className="p-5 cursor-pointer hover:ring-2 hover:ring-blue-500" onClick={() => setSelected(h)}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-900">{h.ward}</div>
                <Badge className={SHIFT_COLORS[h.shift]}>{h.shift} Shift</Badge>
              </div>
              <Badge className={h.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>{h.status}</Badge>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div>👥 {h.patientCount} patients</div>
              <div>👩‍⚕️ {h.outgoingNurse} → {h.incomingNurse}</div>
              <div>🚨 {h.criticalAlerts.length} critical alerts</div>
              <div>📋 {h.pendingTasks.length} pending tasks</div>
            </div>
            {h.criticalAlerts.length > 0 && (
              <div className="mt-3 space-y-1">
                {h.criticalAlerts.map((a, i) => (
                  <div key={i} className="p-2 bg-red-50 rounded text-xs text-red-700">🚨 {a}</div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{selected.ward} — {selected.shift} Shift Handover</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Outgoing:</span> <strong>{selected.outgoingNurse}</strong></div>
                <div><span className="text-gray-500">Incoming:</span> <strong>{selected.incomingNurse}</strong></div>
                <div><span className="text-gray-500">Patients:</span> <strong>{selected.patientCount}</strong></div>
                <div><span className="text-gray-500">Date:</span> <strong>{selected.date}</strong></div>
              </div>
              <div>
                <h4 className="font-bold text-red-800 mb-2">🚨 Critical Alerts (SITUATION)</h4>
                {selected.criticalAlerts.map((a, i) => <div key={i} className="p-2 bg-red-50 rounded mb-1 text-sm">{a}</div>)}
              </div>
              <div>
                <h4 className="font-bold text-blue-800 mb-2">📋 Patient Census (BACKGROUND)</h4>
                <div className="space-y-1">
                  {selected.patients.map((p, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <strong>{p.name}</strong> ({p.bed}) — {p.diagnosis} <Badge className={p.status === 'Deteriorating' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>{p.status}</Badge>
                      {p.alerts.length > 0 && p.alerts.map((a, j) => <span key={j} className="text-red-600 text-xs ml-2">⚠️ {a}</span>)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-orange-800 mb-2">📋 Pending Tasks (ASSESSMENT/RECOMMENDATION)</h4>
                {selected.pendingTasks.map((t, i) => <div key={i} className="p-2 bg-orange-50 rounded mb-1 text-sm">📌 {t}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
