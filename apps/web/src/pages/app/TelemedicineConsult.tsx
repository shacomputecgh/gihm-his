import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

interface Consultation {
  id: string; patientName: string; doctor: string; department: string; date: string; time: string;
  type: 'video' | 'phone' | 'chat'; status: 'scheduled' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  reason: string; duration?: number; notes?: string;
}

const MOCK_CONSULTS: Consultation[] = [
  { id: 'TC001', patientName: 'Abena Osei', doctor: 'Dr. Mensah', department: 'Cardiology', date: '2026-05-24', time: '10:00', type: 'video', status: 'scheduled', reason: 'BP follow-up and medication review' },
  { id: 'TC002', patientName: 'Kofi Adjei', doctor: 'Dr. Psych Kwame', department: 'Psychiatry', date: '2026-05-24', time: '14:00', type: 'video', status: 'scheduled', reason: 'Medication review and therapy session' },
  { id: 'TC003', patientName: 'Akua Mensah', doctor: 'Dr. Osei', department: 'Endocrinology', date: '2026-05-23', time: '11:00', type: 'phone', status: 'completed', reason: 'Diabetes management review', duration: 20, notes: 'HbA1c improved. Continue current medications.' },
  { id: 'TC004', patientName: 'Nana Ama', doctor: 'Dr. Geriatrics', department: 'Geriatrics', date: '2026-05-22', time: '09:00', type: 'video', status: 'completed', reason: 'Dementia progress review with caregiver', duration: 30, notes: 'Caregiver managing well. Continue Donepezil.' },
  { id: 'TC005', patientName: 'Samuel Tetteh', doctor: 'Dr. Psych Kwame', department: 'Psychiatry', date: '2026-05-24', time: '16:00', type: 'chat', status: 'waiting', reason: 'PTSD follow-up' },
];

const statusConfig: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'gray' }> = { scheduled: { label: 'Scheduled', tone: 'blue' }, waiting: { label: 'Waiting', tone: 'gold' }, 'in-progress': { label: 'In Progress', tone: 'red' }, completed: { label: 'Completed', tone: 'green' }, cancelled: { label: 'Cancelled', tone: 'gray' } };

export default function TelemedicineConsult() {
  const [selectedConsult, setSelectedConsult] = useState<string | null>(null);

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
          title="Add New Consultation"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Telemedicine" subtitle="Virtual consultations, video calls, and remote patient monitoring" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_CONSULTS.length}</div><div className="text-xs text-slate-500">Total Consults</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_CONSULTS.filter(c => c.status === 'completed').length}</div><div className="text-xs text-slate-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_CONSULTS.filter(c => c.status === 'scheduled' || c.status === 'waiting').length}</div><div className="text-xs text-slate-500">Upcoming</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_CONSULTS.filter(c => c.type === 'video').length}</div><div className="text-xs text-slate-500">Video Calls</div></Card>
      </div>

      <div className="space-y-3">
        {MOCK_CONSULTS.map(c => {
          const statCfg = statusConfig[c.status];
          const isExpanded = selectedConsult === c.id;
          return (
            <Card key={c.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedConsult(isExpanded ? null : c.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.type === 'video' ? '📹' : c.type === 'phone' ? '📞' : '💬'}</span>
                    <h3 className="font-bold text-sm text-slate-800">{c.patientName}</h3>
                    <Badge tone={statCfg?.tone ?? 'gray'}>{statCfg?.label ?? c.status}</Badge>
                    <Badge tone="navy">{c.type.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>📅 {c.date} {c.time}</span><span>👨‍⚕️ {c.doctor}</span><span>🏥 {c.department}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Reason: {c.reason}</div>
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {isExpanded && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  {c.notes && <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">📝 {c.notes}</div>}
                  {c.duration && <div className="text-xs text-slate-500">⏱️ Duration: {c.duration} minutes</div>}
                  <div className="flex gap-2">
                    {c.status === 'scheduled' && <Button className="bg-green-600 hover:bg-green-700 text-xs">📹 Start Video Call</Button>}
                    {c.status === 'waiting' && <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Join Consultation</Button>}
                    {c.status === 'completed' && <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📋 View Notes</Button>}
                    <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print Summary</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button className="bg-blue-600 hover:bg-blue-700">📅 Schedule Consultation</Button>
    </div>
  );
}
