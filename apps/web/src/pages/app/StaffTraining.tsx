import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type TrainingTab = 'training' | 'leave' | 'analytics';

interface TrainingRecord {
  id: string; staffName: string; department: string; course: string; provider: string;
  startDate: string; endDate: string; status: 'completed' | 'ongoing' | 'upcoming' | 'expired';
  certificate?: string; expiryDate?: string; credits?: number;
}

interface LeaveRequest {
  id: string; staffName: string; department: string; type: 'annual' | 'sick' | 'maternity' | 'study' | 'compassionate' | 'unpaid';
  startDate: string; endDate: string; days: number; status: 'pending' | 'approved' | 'rejected' | 'active';
  approvedBy?: string; notes?: string;
}

const MOCK_TRAINING: TrainingRecord[] = [
  { id: 'TR001', staffName: 'Nurse Ama', department: 'ICU', course: 'Advanced Cardiac Life Support (ACLS)', provider: 'American Heart Association', startDate: '2026-03-01', endDate: '2026-03-03', status: 'completed', certificate: 'ACLS-2026-001', expiryDate: '2028-03-01', credits: 16 },
  { id: 'TR002', staffName: 'Dr. Mensah', department: 'Internal Medicine', course: 'Diabetes Management Update', provider: 'Ghana Medical Association', startDate: '2026-05-15', endDate: '2026-05-15', status: 'completed', certificate: 'GMA-DM-2026', credits: 8 },
  { id: 'TR003', staffName: 'Nurse Kofi', department: 'Surgical Ward', course: 'Infection Prevention & Control', provider: 'Ghana Health Service', startDate: '2026-06-01', endDate: '2026-06-02', status: 'upcoming', credits: 12 },
  { id: 'TR004', staffName: 'Dr. Osei', department: 'Paediatrics', course: 'Neonatal Resuscitation (NRP)', provider: 'American Academy of Pediatrics', startDate: '2026-05-20', endDate: '2026-05-20', status: 'completed', certificate: 'NRP-2026-045', expiryDate: '2028-05-20', credits: 8 },
  { id: 'TR005', staffName: 'Nurse Abena', department: 'Maternity', course: 'Emergency Obstetric Care', provider: 'WHO', startDate: '2026-04-10', endDate: '2026-04-12', status: 'completed', certificate: 'WHO-EmOC-2026', credits: 20 },
  { id: 'TR006', staffName: 'Lab Technician Kojo', department: 'Laboratory', course: 'Quality Management in Medical Labs', provider: 'NAAQML', startDate: '2026-07-01', endDate: '2026-07-03', status: 'upcoming', credits: 15 },
];

const MOCK_LEAVE: LeaveRequest[] = [
  { id: 'LV001', staffName: 'Nurse Ama', department: 'ICU', type: 'annual', startDate: '2026-06-01', endDate: '2026-06-07', days: 7, status: 'pending', notes: 'Family vacation' },
  { id: 'LV002', staffName: 'Dr. Mensah', department: 'Internal Medicine', type: 'study', startDate: '2026-05-25', endDate: '2026-05-27', days: 3, status: 'approved', approvedBy: 'Hospital Admin', notes: 'Conference attendance' },
  { id: 'LV003', staffName: 'Nurse Kofi', department: 'Surgical Ward', type: 'sick', startDate: '2026-05-20', endDate: '2026-05-22', days: 3, status: 'active', notes: 'Medical leave — malaria' },
  { id: 'LV004', staffName: 'Nurse Abena', department: 'Maternity', type: 'annual', startDate: '2026-07-01', endDate: '2026-07-14', days: 14, status: 'pending' },
  { id: 'LV005', staffName: 'Dr. Boateng', department: 'Surgery', type: 'compassionate', startDate: '2026-05-18', endDate: '2026-05-20', days: 3, status: 'approved', approvedBy: 'Hospital Admin', notes: 'Family bereavement' },
];

export default function StaffTraining() {
  const [tab, setTab] = useState<TrainingTab>('training');
  const leaveTypeConfig: Record<string, { label: string; color: string }> = { annual: { label: 'Annual', color: 'bg-blue-50 text-blue-700' }, sick: { label: 'Sick', color: 'bg-red-50 text-red-700' }, maternity: { label: 'Maternity', color: 'bg-pink-50 text-pink-700' }, study: { label: 'Study', color: 'bg-purple-50 text-purple-700' }, compassionate: { label: 'Compassionate', color: 'bg-amber-50 text-amber-700' }, unpaid: { label: 'Unpaid', color: 'bg-slate-50 text-slate-700' } };

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
      <PageHeader title="Staff Training & Leave" subtitle="Training records, certifications, and leave management" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_TRAINING.length}</div><div className="text-xs text-slate-500">Courses</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_TRAINING.filter(t => t.status === 'completed').length}</div><div className="text-xs text-slate-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_LEAVE.filter(l => l.status === 'pending').length}</div><div className="text-xs text-slate-500">Pending Leave</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_TRAINING.reduce((s, t) => s + (t.credits ?? 0), 0)}</div><div className="text-xs text-slate-500">CPD Credits</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['training', 'leave', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'training' ? '📚 Training' : t === 'leave' ? '📅 Leave' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'training' && (
        <div className="space-y-3">
          {MOCK_TRAINING.map(t => (
            <Card key={t.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800">{t.course}</h3>
                    <Badge tone={t.status === 'completed' ? 'green' : t.status === 'ongoing' ? 'blue' : t.status === 'expired' ? 'red' : 'gold'}>{t.status.toUpperCase()}</Badge>
                    {t.credits && <Badge tone="navy">{t.credits} CPD</Badge>}
                  </div>
                  <div className="text-xs text-slate-500">{t.staffName} · {t.department} · {t.provider}</div>
                  <div className="text-[10px] text-slate-400">{t.startDate} to {t.endDate}{t.expiryDate ? ` · Expires: ${t.expiryDate}` : ''}</div>
                </div>
              </div>
            </Card>
          ))}
          <Button className="bg-blue-600 hover:bg-blue-700">➕ Add Training Record</Button>
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-3">
          {MOCK_LEAVE.map(l => {
            const ltCfg = leaveTypeConfig[l.type]!;
            return (
              <Card key={l.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800">{l.staffName}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ltCfg.color}`}>{ltCfg.label}</span>
                      <Badge tone={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : l.status === 'active' ? 'blue' : 'gold'}>{l.status.toUpperCase()}</Badge>
                    </div>
                    <div className="text-xs text-slate-500">{l.department} · {l.days} days · {l.startDate} to {l.endDate}</div>
                    {l.notes && <div className="text-[10px] text-slate-400">📝 {l.notes}</div>}
                  </div>
                  {l.status === 'pending' && <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Approve</Button>}
                </div>
              </Card>
            );
          })}
          <Button className="bg-blue-600 hover:bg-blue-700">📝 Request Leave</Button>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📚 Training Status</h3>
            {['completed', 'ongoing', 'upcoming', 'expired'].map(s => {
              const count = MOCK_TRAINING.filter(t => t.status === s).length;
              return (<div key={s} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600 capitalize">{s}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📅 Leave Requests</h3>
            {Object.entries(leaveTypeConfig).map(([k, v]) => {
              const count = MOCK_LEAVE.filter(l => l.type === k).length;
              if (count === 0) return null;
              return (<div key={k} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${v.color}`}>{v.label}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
