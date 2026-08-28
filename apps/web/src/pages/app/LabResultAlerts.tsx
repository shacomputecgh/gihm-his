import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface LabAlert {
  id: string; patientName: string; mrn: string; test: string; result: string;
  normalRange: string; status: 'Critical' | 'Abnormal' | 'Pending Review' | 'Acknowledged';
  doctor: string; dateIssued: string; acknowledgedBy?: string;
}

const ALERTS: LabAlert[] = [
  { id: 'LA-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', test: 'Blood Glucose (Fasting)', result: '380 mg/dL', normalRange: '70-100 mg/dL', status: 'Critical', doctor: 'Dr. Sarah Johnson', dateIssued: '2026-08-23 09:30' },
  { id: 'LA-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', test: 'Potassium (K+)', result: '6.8 mmol/L', normalRange: '3.5-5.0 mmol/L', status: 'Critical', doctor: 'Dr. James Mensah', dateIssued: '2026-08-23 10:15' },
  { id: 'LA-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', test: 'Haemoglobin', result: '5.2 g/dL', normalRange: '12-16 g/dL', status: 'Critical', doctor: 'Dr. Ama Darko', dateIssued: '2026-08-23 08:45' },
  { id: 'LA-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', test: 'Creatinine', result: '4.2 mg/dL', normalRange: '0.6-1.2 mg/dL', status: 'Abnormal', doctor: 'Dr. Kofi Appiah', dateIssued: '2026-08-23 11:00' },
  { id: 'LA-005', patientName: 'Yaw Boateng', mrn: 'MRN-2024-0678', test: 'WBC Count', result: '18,500/µL', normalRange: '4,000-11,000/µL', status: 'Pending Review', doctor: 'Dr. Sarah Johnson', dateIssued: '2026-08-23 11:30' },
  { id: 'LA-006', patientName: 'Ama Serwaa', mrn: 'MRN-2024-0812', test: 'HbA1c', result: '11.2%', normalRange: '<7.0%', status: 'Acknowledged', doctor: 'Dr. James Mensah', dateIssued: '2026-08-22 14:00', acknowledgedBy: 'Dr. James Mensah' },
];

const STATUS_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800', Abnormal: 'bg-orange-100 text-orange-800',
  'Pending Review': 'bg-yellow-100 text-yellow-800', Acknowledged: 'bg-green-100 text-green-800',
};

export default function LabResultAlerts() {
  const [alerts, setAlerts] = useState<LabAlert[]>(ALERTS);
  const toast = useToast();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [filter, setFilter] = useState('');

  const filtered = alerts.filter((a) => !filter || a.status === filter);
  const criticalCount = alerts.filter((a) => a.status === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lab Result Alerts</h1>
          <p className="text-gray-500">Critical and abnormal lab results requiring immediate attention</p>
        </div>
        {criticalCount > 0 && (
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
            ⚠️ {criticalCount} CRITICAL RESULT{criticalCount > 1 ? 'S' : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Critical', 'Abnormal', 'Pending Review', 'Acknowledged'].map((s) => {
          const count = alerts.filter((a) => a.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={`p-3 rounded-lg border text-center transition ${filter === s ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className={`text-xl font-bold ${s === 'Critical' ? 'text-red-600' : s === 'Abnormal' ? 'text-orange-600' : s === 'Pending Review' ? 'text-yellow-600' : 'text-green-600'}`}>{count}</div>
              <div className="text-xs text-slate-500">{s}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <div key={a.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${a.status === 'Critical' ? 'border-l-4 border-l-red-500' : a.status === 'Abnormal' ? 'border-l-4 border-l-orange-500' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{a.id}</span>
                  <span className="font-semibold">{a.patientName}</span>
                  <span className="text-xs text-slate-400">({a.mrn})</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{a.test}: <span className="font-bold text-lg">{a.result}</span></p>
                <p className="text-xs text-slate-400">Normal: {a.normalRange} · Doctor: {a.doctor} · {a.dateIssued}</p>
              </div>
              <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
            </div>
            {a.status !== 'Acknowledged' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setAlerts(alerts.map((al) => al.id === a.id ? { ...al, status: 'Acknowledged' as const, acknowledgedBy: 'Current User' } : al)); toast('Result acknowledged', 'success'); }} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 font-medium">✓ Acknowledge</button>
                <button onClick={() => toast(`📞 Calling ${a.doctor}...`, 'info')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">📞 Contact Doctor</button>
                <button onClick={() => { setNoteFor(noteFor === a.id ? null : a.id); }} className="text-xs px-3 py-1.5 border rounded hover:bg-slate-50 font-medium">📋 Add Note</button>
              </div>
            )}
            {noteFor === a.id && (
              <div className="mt-2 flex gap-2"><input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1 border rounded px-2 py-1 text-sm" /><button onClick={() => { if (noteText.trim()) { toast('Note added', 'success'); setNoteText(''); setNoteFor(null); } }} className="text-xs px-3 py-1 bg-green-600 text-white rounded">Save</button></div>
            )}
            {a.acknowledgedBy && <p className="text-xs text-green-600 mt-2">✓ Acknowledged by {a.acknowledgedBy}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
