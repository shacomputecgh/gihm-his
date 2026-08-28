import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Feedback {
  id: string; patientName: string; department: string; category: string;
  rating: number; comment: string; nps: number;
  status: 'New' | 'Acknowledged' | 'Investigating' | 'Resolved' | 'Escalated';
  date: string; respondedBy: string;
}

const FEEDBACK: Feedback[] = [
  { id: 'FB-001', patientName: 'Kwame Mensah', department: 'Surgery', category: 'Staff Attitude',
    rating: 5, comment: 'Excellent care from Dr. Asante and nursing team. Felt very well looked after.', nps: 9,
    status: 'Resolved', date: '2026-08-24', respondedBy: 'Quality Director' },
  { id: 'FB-002', patientName: 'Akua Boateng', department: 'Emergency', category: 'Wait Time',
    rating: 2, comment: 'Waited 4 hours in ED before being seen. Very frustrated. Staff seemed overwhelmed.', nps: 3,
    status: 'Investigating', date: '2026-08-24', respondedBy: 'ER Manager' },
  { id: 'FB-003', patientName: 'Kofi Asare', department: 'Pharmacy', category: 'Medication Information',
    rating: 4, comment: 'Pharmacist explained my medications well. However, had to wait 45 minutes for prescription.', nps: 7,
    status: 'Acknowledged', date: '2026-08-23', respondedBy: 'Chief Pharmacist' },
  { id: 'FB-004', patientName: 'Efua Nyarko', department: 'Maternity', category: 'Overall Experience',
    rating: 5, comment: 'Wonderful maternity experience. Midwives were kind and professional. Birth plan respected.', nps: 10,
    status: 'Resolved', date: '2026-08-22', respondedBy: 'Matron' },
  { id: 'FB-005', patientName: 'Nana Kuffour', department: 'Radiology', category: 'Communication',
    rating: 3, comment: 'Results took too long to get to my doctor. Had to call to chase up. Otherwise fine.', nps: 6,
    status: 'New', date: '2026-08-22', respondedBy: '' },
  { id: 'FB-006', patientName: 'Ama Serwaa', department: 'Ward 2', category: 'Cleanliness',
    rating: 2, comment: 'Bathroom was not cleaned regularly. Food was cold. Ward noisy at night.', nps: 4,
    status: 'Escalated', date: '2026-08-21', respondedBy: 'Hospital Manager' },
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Acknowledged': 'bg-yellow-100 text-yellow-800',
  'Investigating': 'bg-orange-100 text-orange-800', 'Resolved': 'bg-green-100 text-green-800',
  'Escalated': 'bg-red-100 text-red-800',
};

export default function PatientExperience() {
  const [selected, setSelected] = useState<Feedback | null>(FEEDBACK[0] ?? null);
  const avgRating = (FEEDBACK.reduce((s,f)=>s+f.rating,0)/FEEDBACK.length).toFixed(1);
  const avgNPS = (FEEDBACK.reduce((s,f)=>s+f.nps,0)/FEEDBACK.length).toFixed(1);
  const promoters = FEEDBACK.filter(f=>f.nps>=9).length;
  const detractors = FEEDBACK.filter(f=>f.nps<=6).length;
  const npsScore = Math.round(((promoters-detractors)/FEEDBACK.length)*100);
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
          title="Add New Experience Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Patient Experience</h1><p className="text-gray-500">Patient feedback, surveys, complaints tracking, and NPS scoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Total Feedback', value: FEEDBACK.length, color: 'text-blue-600' },
          { label: 'Avg Rating', value: avgRating, color: 'text-green-600' },
          { label: 'Avg NPS', value: avgNPS, color: 'text-purple-600' },
          { label: 'NPS Score', value: npsScore, color: npsScore>0?'text-green-600':'text-red-600' },
          { label: 'Escalated', value: FEEDBACK.filter(f=>f.status==='Escalated').length, color: 'text-red-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div><div className="text-sm opacity-80">Net Promoter Score (NPS)</div><div className="text-4xl font-black">{npsScore}</div></div>
          <div className="text-right"><div className="text-sm opacity-80">Score Range: -100 to +100</div><div className="text-sm">{promoters} Promoters | {FEEDBACK.length-promoters-detractors} Passives | {detractors} Detractors</div></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {FEEDBACK.map(fb => (
            <div key={fb.id} onClick={() => setSelected(fb)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===fb.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{fb.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[fb.status]}`}>{fb.status}</Badge><Badge className="text-[10px] bg-gray-100">{fb.department}</Badge></div>
                  <div className="text-sm text-gray-500 mt-1">{fb.comment.substring(0, 100)}...</div>
                </div>
                <div className="text-right"><div className="flex items-center gap-1">{'⭐'.repeat(fb.rating)}</div><div className={`text-sm font-bold ${fb.nps>=9?'text-green-600':fb.nps>=7?'text-yellow-600':'text-red-600'}`}>NPS {fb.nps}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.department} — {selected.category}</p></div>
              <div className="flex items-center gap-4"><div><div className="text-sm font-medium text-gray-600">Rating</div><div className="text-3xl font-black text-green-600">{selected.rating}/5</div><div>{'⭐'.repeat(selected.rating)}</div></div><div><div className="text-sm font-medium text-gray-600">NPS</div><div className={`text-3xl font-black ${selected.nps>=9?'text-green-600':selected.nps>=7?'text-yellow-600':'text-red-600'}`}>{selected.nps}</div></div></div>
              <div className="bg-blue-50 rounded-lg p-3"><div className="text-sm font-medium text-blue-700 mb-1">Comment</div><div className="text-sm text-blue-600">"{selected.comment}"</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm"><div><span className="text-gray-500">Date:</span> {selected.date}</div><div><span className="text-gray-500">Responded by:</span> {selected.respondedBy || 'Pending'}</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
