import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface TrainingEvent {
  id: string; staffName: string; department: string; event: string;
  type: 'CME' | 'Workshop' | 'Conference' | 'Online Course' | 'In-House Training';
  credits: number; date: string; provider: string;
  status: 'Planned' | 'Completed' | 'In Progress' | 'Expired';
  certificateExpiry?: string;
}

const EVENTS: TrainingEvent[] = [
  { id: 'EDU-001', staffName: 'Dr. Kwame Asante', department: 'Surgery', event: 'Advanced Laparoscopic Surgery Workshop',
    type: 'Workshop', credits: 25, date: '2026-08-20', provider: 'Ghana College of Surgeons',
    status: 'Completed', certificateExpiry: '2028-08-20' },
  { id: 'EDU-002', staffName: 'Dr. Akua Mensah', department: 'Paediatrics', event: 'Neonatal Resuscitation Programme',
    type: 'CME', credits: 10, date: '2026-08-15', provider: 'WHO / Ghana Health Service',
    status: 'Completed', certificateExpiry: '2028-08-15' },
  { id: 'EDU-003', staffName: 'Sr. Abena Osei', department: 'ICU', event: 'Critical Care Nursing Certification',
    type: 'Online Course', credits: 40, date: '2026-09-01', provider: 'British Association of Critical Care',
    status: 'In Progress', certificateExpiry: '2027-09-01' },
  { id: 'EDU-004', staffName: 'Pharm. Kofi Adjei', department: 'Pharmacy', event: 'Clinical Pharmacokinetics Update',
    type: 'CME', credits: 15, date: '2026-08-28', provider: 'Ghana Pharmacists Association',
    status: 'Planned' },
  { id: 'EDU-005', staffName: 'Dr. Priscilla Wiafe', department: 'Psychiatry', event: 'Addiction Psychiatry Fellowship',
    type: 'Conference', credits: 35, date: '2026-10-15', provider: 'WPA Regional Conference',
    status: 'Planned' },
  { id: 'EDU-006', staffName: 'Sr. Nana Agyei', department: 'Nursing', event: 'Advanced Cardiac Life Support (ACLS)',
    type: 'In-House Training', credits: 16, date: '2026-08-22', provider: 'Hospital ACLS Training Centre',
    status: 'Completed', certificateExpiry: '2028-08-22' },
  { id: 'EDU-007', staffName: 'Lab. Nana Agyeman', department: 'Laboratory', event: 'Molecular Diagnostics Training',
    type: 'Workshop', credits: 20, date: '2026-07-10', provider: 'Noguchi Memorial Institute',
    status: 'Completed', certificateExpiry: '2027-07-10' },
  { id: 'EDU-008', staffName: 'Dr. Yaw Boateng', department: 'Emergency', event: 'ATLS Instructor Course',
    type: 'CME', credits: 30, date: '2026-09-10', provider: 'ACS International',
    status: 'Planned' },
];

const STATUS_STYLES: Record<string, string> = {
  'Planned': 'bg-blue-100 text-blue-800', 'Completed': 'bg-green-100 text-green-800',
  'In Progress': 'bg-yellow-100 text-yellow-800', 'Expired': 'bg-red-100 text-red-800',
};
const TYPE_STYLES: Record<string, string> = {
  'CME': 'bg-purple-100 text-purple-800', 'Workshop': 'bg-blue-100 text-blue-800',
  'Conference': 'bg-orange-100 text-orange-800', 'Online Course': 'bg-teal-100 text-teal-800',
  'In-House Training': 'bg-green-100 text-green-800',
};

export default function MedicalEducation() {
  const [selected, setSelected] = useState<TrainingEvent | null>(EVENTS[0] ?? null);
  const totalCredits = EVENTS.filter(e=>e.status==='Completed').reduce((s,e)=>s+e.credits,0);
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
      <div><h1 className="text-2xl font-bold">Medical Education & Training</h1><p className="text-gray-500">CME tracking, training logs, competency assessment, and conference attendance</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Total Events', value: EVENTS.length, color: 'text-blue-600' },
          { label: 'Completed', value: EVENTS.filter(e=>e.status==='Completed').length, color: 'text-green-600' },
          { label: 'In Progress', value: EVENTS.filter(e=>e.status==='In Progress').length, color: 'text-yellow-600' },
          { label: 'Planned', value: EVENTS.filter(e=>e.status==='Planned').length, color: 'text-blue-500' },
          { label: 'Total Credits', value: totalCredits, color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {EVENTS.map(ev => (
            <div key={ev.id} onClick={() => setSelected(ev)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===ev.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{ev.staffName}</span><Badge className={`text-[10px] ${STATUS_STYLES[ev.status]}`}>{ev.status}</Badge><Badge className={`text-[10px] ${TYPE_STYLES[ev.type]}`}>{ev.type}</Badge></div>
                  <div className="text-sm text-gray-500">{ev.event}</div>
                  <div className="text-xs text-gray-400 mt-1">{ev.department} — {ev.provider}</div>
                </div>
                <div className="text-right"><div className="text-lg font-bold text-purple-600">{ev.credits}</div><div className="text-[10px] text-gray-400">Credits</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.event}</h2><p className="text-sm text-gray-500">{selected.staffName} — {selected.department}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Type:</span> {selected.type}</div><div><span className="text-gray-500">Provider:</span> {selected.provider}</div><div><span className="text-gray-500">Date:</span> {selected.date}</div><div><span className="text-gray-500">Credits:</span> <span className="font-bold text-purple-600">{selected.credits}</span></div></div>
              {selected.certificateExpiry && <div className="bg-green-50 rounded-lg p-3"><div className="text-sm font-medium text-green-700">Certificate Valid Until</div><div className="text-sm text-green-600">{selected.certificateExpiry}</div></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
