import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

interface Complaint {
  id: string; date: string; patientName: string; contactPhone: string; department: string;
  category: 'service' | 'wait-time' | 'staff' | 'facility' | 'billing' | 'privacy' | 'other';
  severity: 'low' | 'medium' | 'high'; description: string;
  status: 'received' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string; resolution?: string; responseDate?: string; satisfactionScore?: number;
}

const MOCK_COMPLAINTS: Complaint[] = [
  { id: 'CMP001', date: '2026-05-22', patientName: 'Mr. John Mensah', contactPhone: '024-123-4567', department: 'Emergency', category: 'wait-time', severity: 'medium', description: 'Patient waited over 4 hours in emergency before being seen. Complainant is the patient\'s son.', status: 'investigating', assignedTo: 'Patient Relations' },
  { id: 'CMP002', date: '2026-05-21', patientName: 'Mrs. Grace Osei', contactPhone: '020-987-6543', department: 'Medical Ward', category: 'staff', severity: 'high', description: 'Nurse was rude and dismissive when patient asked for pain medication.', status: 'resolved', assignedTo: 'Nurse Manager', resolution: 'Counselling session with nurse conducted. Apology letter sent.', satisfactionScore: 3 },
  { id: 'CMP003', date: '2026-05-20', patientName: 'Mr. Samuel Koomson', contactPhone: '055-456-7890', department: 'Billing', category: 'billing', severity: 'low', description: 'Overcharged for laboratory tests. Patient was billed for tests not performed.', status: 'resolved', assignedTo: 'Billing Manager', resolution: 'Billing corrected. Refund of GH₵ 150 processed.', satisfactionScore: 4 },
  { id: 'CMP004', date: '2026-05-19', patientName: 'Ms. Adwoa Boateng', contactPhone: '024-555-1234', department: 'Pharmacy', category: 'service', severity: 'medium', description: 'Prescription medication was out of stock. Patient had to buy from outside pharmacy.', status: 'acknowledged', assignedTo: 'Pharmacy Manager' },
  { id: 'CMP005', date: '2026-05-18', patientName: 'Mr. Kofi Amoah', contactPhone: '020-111-2222', department: 'Radiology', category: 'facility', severity: 'low', description: 'Air conditioning not working in waiting area. Very uncomfortable.', status: 'resolved', assignedTo: 'Facility Management', resolution: 'AC repaired same day. Preventive maintenance schedule updated.', satisfactionScore: 5 },
  { id: 'CMP006', date: '2026-05-17', patientName: 'Mrs. Akua Mensah', contactPhone: '024-333-4444', department: 'Maternity', category: 'privacy', severity: 'high', description: 'Patient felt her privacy was not respected during examination. curtains not drawn.', status: 'investigating', assignedTo: 'Matron' },
];

export default function PatientComplaints() {
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const categoryConfig: Record<string, { label: string; color: string }> = { service: { label: 'Service', color: 'bg-blue-50 text-blue-700' }, 'wait-time': { label: 'Wait Time', color: 'bg-amber-50 text-amber-700' }, staff: { label: 'Staff', color: 'bg-red-50 text-red-700' }, facility: { label: 'Facility', color: 'bg-purple-50 text-purple-700' }, billing: { label: 'Billing', color: 'bg-green-50 text-green-700' }, privacy: { label: 'Privacy', color: 'bg-pink-50 text-pink-700' }, other: { label: 'Other', color: 'bg-slate-50 text-slate-700' } };
  const statusConfig: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'gray' }> = { received: { label: 'Received', tone: 'gray' }, acknowledged: { label: 'Acknowledged', tone: 'blue' }, investigating: { label: 'Investigating', tone: 'gold' }, resolved: { label: 'Resolved', tone: 'green' }, closed: { label: 'Closed', tone: 'green' } };
  const unresolved = MOCK_COMPLAINTS.filter(c => !['resolved', 'closed'].includes(c.status)).length;

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
          title="Add New Complaint"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"complaintType","label":"Complaint Type","type":"select","options":["Medical","Service","Billing","Staff Conduct","Facility","Other"]},{"name":"description","label":"Description","type":"textarea","required":true},{"name":"priority","label":"Priority","type":"select","options":["Low","Medium","High","Critical"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Patient Complaints" subtitle="Complaint tracking, investigation, and resolution management" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_COMPLAINTS.length}</div><div className="text-xs text-slate-500">Total Complaints</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{unresolved}</div><div className="text-xs text-slate-500">Unresolved</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_COMPLAINTS.filter(c => c.status === 'resolved').length}</div><div className="text-xs text-slate-500">Resolved</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{(MOCK_COMPLAINTS.filter(c => c.satisfactionScore).reduce((s, c) => s + (c.satisfactionScore ?? 0), 0) / MOCK_COMPLAINTS.filter(c => c.satisfactionScore).length).toFixed(1)}</div><div className="text-xs text-slate-500">Avg Satisfaction</div></Card>
      </div>

      <div className="space-y-3">
        {MOCK_COMPLAINTS.map(c => {
          const catCfg = categoryConfig[c.category]!;
          const statCfg = statusConfig[c.status]!;
          const isExpanded = selectedComplaint === c.id;
          return (
            <Card key={c.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''} ${c.severity === 'high' ? 'border-l-4 border-red-400' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedComplaint(isExpanded ? null : c.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800">{c.id}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${catCfg.color}`}>{catCfg.label}</span>
                    <Badge tone={statCfg.tone}>{statCfg.label}</Badge>
                    <Badge tone={c.severity === 'high' ? 'red' : c.severity === 'medium' ? 'gold' : 'gray'}>{c.severity}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{c.description}</div>
                  <div className="mt-1 flex gap-3 text-[10px] text-slate-400">
                    <span>📅 {c.date}</span><span>👤 {c.patientName}</span><span>📞 {c.contactPhone}</span><span>🏥 {c.department}</span>
                  </div>
                  {c.assignedTo && <div className="text-[10px] text-blue-600">Assigned to: {c.assignedTo}</div>}
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {isExpanded && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  {c.resolution && <div className="rounded-lg bg-green-50 p-3"><h4 className="font-bold text-xs text-green-700 mb-1">✅ Resolution</h4><p className="text-xs text-green-600">{c.resolution}</p></div>}
                  {c.satisfactionScore && <div className="text-xs">Satisfaction: {'⭐'.repeat(c.satisfactionScore)} ({c.satisfactionScore}/5)</div>}
                  <div className="flex gap-2">
                    {c.status !== 'resolved' && c.status !== 'closed' && <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Resolve</Button>}
                    {c.status === 'resolved' && <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📤 Close</Button>}
                    <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print Report</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        <Button className="bg-blue-600 hover:bg-blue-700">📝 Log New Complaint</Button>
      </div>
    </div>
  );
}
