import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface TransplantPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  transplantType: string; organ: string; status: string;
  waitlistDate: string; hlaType: string; crossmatch: string;
  bloodGroup: string; antibodies: string; urgency: string;
  preTransplantWorkup: string[]; doctor: string; followUp: string; notes: string;
}

const PATIENTS: TransplantPatient[] = [
  { id: 'TX-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1060',
    transplantType: 'Kidney Transplant', organ: 'Kidney', status: 'Waitlisted',
    waitlistDate: '2026-03-01', hlaType: 'A2,A3,B7,B44,DR15,DR4', crossmatch: 'Pending living donor workup',
    bloodGroup: 'A+', antibodies: 'PRA 45%', urgency: 'Standard',
    preTransplantWorkup: ['Cardiac clearance ✓', 'Pulmonary clearance ✓', 'Dental clearance ✓', 'Hep B/C serology ✓', 'CMV/EBV status ✓', 'Vascular access assessment ✓'],
    doctor: 'Dr. Efua Darko', followUp: '2026-11-24 (3 months)', notes: 'Living donor evaluation — sister ABO compatible. HLA typing in progress. PRA 45% — sensitised.'
  },
  { id: 'TX-002', name: 'Akua Boateng', age: 42, gender: 'Female', mrn: 'MRN-2026-1062',
    transplantType: 'Liver Transplant', organ: 'Liver', status: 'Post-Transplant (3 months)',
    waitlistDate: '2025-12-01', hlaType: 'N/A', crossmatch: 'Deceased donor — compatible',
    bloodGroup: 'O+', antibodies: 'N/A', urgency: 'High (MELD 28)',
    preTransplantWorkup: ['Cardiac clearance ✓', 'Psychosocial assessment ✓', 'Substance abuse assessment ✓', 'Financial clearance ✓'],
    doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (2 weeks)', notes: 'Liver transplant for Wilsons disease. Tacrolimus levels stable. LFTs improving. No rejection episodes.'
  },
  { id: 'TX-003', name: 'Kofi Asare', age: 52, gender: 'Male', mrn: 'MRN-2026-1064',
    transplantType: 'Kidney Transplant', organ: 'Kidney', status: 'Waitlisted — Urgent',
    waitlistDate: '2026-01-15', hlaType: 'A1,A11,B8,B35,DR3,DR7', crossmatch: 'Waiting deceased donor',
    bloodGroup: 'B+', antibodies: 'PRA 89%', urgency: 'Urgent (highly sensitised)',
    preTransplantWorkup: ['Complete ✓', 'Desensitisation protocol in progress', 'Plasmapheresis series started'],
    doctor: 'Dr. Efua Darko', followUp: '2026-08-31 (plasmapheresis)', notes: 'Highly sensitised — PRA 89%. IVIG + plasmapheresis desensitisation. Extended cold ischaemia time may be needed.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Waitlisted': 'bg-yellow-100 text-yellow-800', 'Waitlisted — Urgent': 'bg-red-100 text-red-800',
  'Post-Transplant (3 months)': 'bg-green-100 text-green-800', 'Pre-Transplant Assessment': 'bg-blue-100 text-blue-800',
  'Deceased Donor Evaluation': 'bg-purple-100 text-purple-800',
};

export default function TransplantCoordination() {
  const [selected, setSelected] = useState<TransplantPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Transplant Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Transplant Coordination</h1><p className="text-gray-500">Organ matching, waitlist tracking, pre/post-transplant management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Waitlisted', value: PATIENTS.filter(p=>p.status.includes('Waitlisted')).length, color: 'text-yellow-600' },
          { label: 'Post-Transplant', value: PATIENTS.filter(p=>p.status.includes('Post')).length, color: 'text-green-600' },
          { label: 'Urgent', value: PATIENTS.filter(p=>p.urgency==='Urgent').length, color: 'text-red-600' },
          { label: 'Highly Sensitised', value: PATIENTS.filter(p=>p.antibodies.includes('89%')||p.antibodies.includes('45%')).length, color: 'text-orange-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]||'bg-gray-100 text-gray-800'}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.transplantType}</div>
                  <div className="text-xs text-gray-400 mt-1">Blood: {p.bloodGroup} | PRA: {p.antibodies}</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">Waitlisted</div><div className="text-sm font-medium">{p.waitlistDate}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.transplantType}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Blood Group:</span> <span className="font-bold">{selected.bloodGroup}</span></div><div><span className="text-gray-500">HLA:</span> {selected.hlaType}</div><div><span className="text-gray-500">PRA:</span> {selected.antibodies}</div><div><span className="text-gray-500">Urgency:</span> {selected.urgency}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div></div>
              <div className="bg-purple-50 rounded-lg p-3"><div className="text-sm font-medium text-purple-700 mb-1">Crossmatch</div><div className="text-sm text-purple-600">{selected.crossmatch}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Pre-Transplant Workup</div>{selected.preTransplantWorkup.map((w,i)=><div key={i} className="text-xs flex items-center gap-1 mb-1">{w.includes('✓')?<span className="text-green-500">✓</span>:<span className="text-yellow-500">○</span>} {w}</div>)}</div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
