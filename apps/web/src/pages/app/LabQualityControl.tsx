import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface QCEvent {
  id: string; category: string; event: string; date: string;
  status: 'Pass' | 'Fail' | 'Pending' | 'Action Required';
  action: string; responsible: string;
}

interface Equipment {
  id: string; name: string; model: string; department: string;
  calibrationDue: string; status: 'Calibrated' | 'Due' | 'Overdue' | 'Out of Service';
}

const QC_EVENTS: QCEvent[] = [
  { id: 'QC-001', category: 'Haematology', event: 'Proficiency Testing — CBC', date: '2026-08-20', status: 'Pass', action: 'Results within acceptable range', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-002', category: 'Chemistry', event: 'Daily QC — Glucose Analyzer', date: '2026-08-24', status: 'Pass', action: 'Control within ±2SD', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-003', category: 'Microbiology', event: 'Proficiency Testing — Culture ID', date: '2026-08-15', status: 'Pass', action: 'Correct identification 100%', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-004', category: 'Blood Bank', event: 'Cross-match Proficiency', date: '2026-08-18', status: 'Pass', action: 'All panels correct', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-005', category: 'Coagulation', event: 'PT/INR Proficiency', date: '2026-08-10', status: 'Fail', action: 'INR outside range — recalibration needed', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-006', category: 'Haematology', event: 'White Cell Counter Calibration', date: '2026-08-22', status: 'Pass', action: 'Calibration verified with standard', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-007', category: 'Chemistry', event: 'Creatinine Analyzer QC', date: '2026-08-24', status: 'Pending', action: 'Awaiting morning QC run', responsible: 'Lab. Nana Agyeman' },
  { id: 'QC-008', category: 'Blood Bank', event: 'Reagent Expiry Check', date: '2026-08-24', status: 'Action Required', action: 'Anti-D reagent expires in 5 days — reorder', responsible: 'Lab. Nana Agyeman' },
];

const EQUIPMENT: Equipment[] = [
  { id: 'EQ-001', name: 'Sysmex XN-1000', model: 'Haematology Analyser', department: 'Haematology', calibrationDue: '2026-09-01', status: 'Calibrated' },
  { id: 'EQ-002', name: 'Cobas c502', model: 'Chemistry Analyser', department: 'Chemistry', calibrationDue: '2026-08-28', status: 'Calibrated' },
  { id: 'EQ-003', name: 'VITEK 2', model: 'Microbiology ID/AST', department: 'Microbiology', calibrationDue: '2026-08-25', status: 'Calibrated' },
  { id: 'EQ-004', name: 'BCS XP', model: 'Coagulation Analyser', department: 'Coagulation', calibrationDue: '2026-08-20', status: 'Overdue' },
  { id: 'EQ-005', name: 'Gel Centrifuge', model: 'Blood Bank Centrifuge', department: 'Blood Bank', calibrationDue: '2026-09-10', status: 'Calibrated' },
  { id: 'EQ-006', name: 'ABL90 FLEX', model: 'Blood Gas Analyser', department: 'Blood Gas', calibrationDue: '2026-08-24', status: 'Calibrated' },
];

const STATUS_STYLES: Record<string, string> = {
  'Pass': 'bg-green-100 text-green-800', 'Fail': 'bg-red-100 text-red-800',
  'Pending': 'bg-yellow-100 text-yellow-800', 'Action Required': 'bg-orange-100 text-orange-800',
  'Calibrated': 'bg-green-100 text-green-800', 'Due': 'bg-yellow-100 text-yellow-800',
  'Overdue': 'bg-red-100 text-red-800', 'Out of Service': 'bg-gray-100 text-gray-800',
};

export default function LabQualityControl() {
  const [tab, setTab] = useState<'qc' | 'equipment'>('qc');
  const failCount = QC_EVENTS.filter(e => e.status === 'Fail' || e.status === 'Action Required').length;
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
          title="Add New Lab"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "testType", "label": "Test Type", "type": "select", "options": ["Blood Test", "Urine Test", "Stool Test", "X-Ray", "Ultrasound", "ECG", "Biopsy"]}, {"name": "priority", "label": "Priority", "type": "select", "options": ["Routine", "Urgent", "STAT"]}, {"name": "clinicalHistory", "label": "Clinical History", "type": "textarea", "placeholder": "Relevant clinical information"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Laboratory Quality Control</h1><p className="text-gray-500">Proficiency testing, equipment calibration, and quality assurance tracking</p></div>
      {failCount > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"><span className="text-red-600 text-xl">⚠️</span><div><div className="font-semibold text-red-800">{failCount > 1 ? `${failCount} QC Alerts` : `${failCount} QC Alert`}</div><div className="text-sm text-red-600">Attention required — corrective actions needed</div></div></div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'QC Events', value: QC_EVENTS.length, color: 'text-blue-600' },
          { label: 'Passing', value: QC_EVENTS.filter(e=>e.status==='Pass').length, color: 'text-green-600' },
          { label: 'Failing', value: QC_EVENTS.filter(e=>e.status==='Fail').length, color: 'text-red-600' },
          { label: 'Equipment', value: EQUIPMENT.length, color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="flex gap-2 border-b pb-2">
        {(['qc', 'equipment'] as const).map(t => <Button key={t} variant={tab===t?'primary':'outline'} size="sm" onClick={()=>setTab(t)}>{t==='qc'?'QC Events':'Equipment'}</Button>)}
      </div>
      {tab === 'qc' && <div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3 font-medium text-gray-600">Category</th><th className="text-left p-3 font-medium text-gray-600">Event</th><th className="text-left p-3 font-medium text-gray-600">Date</th><th className="text-left p-3 font-medium text-gray-600">Status</th><th className="text-left p-3 font-medium text-gray-600">Action</th></tr></thead><tbody>{QC_EVENTS.map(e=>(
        <tr key={e.id} className="border-t hover:bg-gray-50"><td className="p-3 text-xs font-medium">{e.category}</td><td className="p-3">{e.event}</td><td className="p-3 text-xs text-gray-500">{e.date}</td><td className="p-3"><Badge className={`text-[10px] ${STATUS_STYLES[e.status]}`}>{e.status}</Badge></td><td className="p-3 text-xs max-w-[200px] truncate">{e.action}</td></tr>
      ))}</tbody></table></div>}
      {tab === 'equipment' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{EQUIPMENT.map(eq=>(
        <div key={eq.id} className="bg-white border rounded-xl p-4"><div className="flex items-start justify-between"><div><div className="font-bold">{eq.name}</div><div className="text-sm text-gray-500">{eq.model}</div><div className="text-xs text-gray-400">{eq.department}</div></div><Badge className={`text-[10px] ${STATUS_STYLES[eq.status]}`}>{eq.status}</Badge></div>
        <div className="mt-2 text-xs text-gray-400"><span className="text-gray-500">Calibration due:</span> {eq.calibrationDue}</div></div>
      ))}</div>}
    </div>
  );
}
