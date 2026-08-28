import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface OAndPDevice {
  id: string; patientName: string; age: number; gender: string; mrn: string;
  deviceType: string; side: string; indication: string;
  status: 'Assessment' | 'Fabrication' | 'Fitting' | 'Delivered' | 'Follow-up';
  followUpType: string; lastVisit: string; nextVisit: string;
  clinician: string; notes: string;
}

const DEVICES: OAndPDevice[] = [
  { id: 'OP-001', patientName: 'Kwame Mensah', age: 45, gender: 'Male', mrn: 'MRN-2026-1250',
    deviceType: 'Transtibial Prosthesis (Below Knee)', side: 'Left', indication: 'Below-knee amputation — diabetes',
    status: 'Delivered', followUpType: '3-month review', lastVisit: '2026-08-10', nextVisit: '2026-11-10',
    clinician: 'Mr. Kofi Adjei (Prosthetist)', notes: 'K1 level ambulator. Prosthesis fitting good. Socket comfort 8/10. Gait training ongoing with physio. Referral to community rehabilitation.'
  },
  { id: 'OP-002', patientName: 'Akua Boateng', age: 72, gender: 'Female', mrn: 'MRN-2026-1252',
    deviceType: 'AFO (Ankle-Foot Orthosis)', side: 'Right', indication: 'Foot drop — peripheral neuropathy',
    status: 'Fitting', followUpType: 'Fitting adjustment', lastVisit: '2026-08-20', nextVisit: '2026-08-28',
    clinician: 'Mr. Kofi Adjei (Orthotist)', notes: 'AFO moulded. Initial fitting done. Minor pressure areas on medial malleolus — modification needed. Gait assessment with physio pending.'
  },
  { id: 'OP-003', patientName: 'Kofi Asare', age: 8, gender: 'Male', mrn: 'MRN-2026-1254',
    deviceType: 'SCOS (Supracondylar Orthosis)', side: 'Left', indication: 'Distal femoral osteotomy — post-surgical bracing',
    status: 'Fabrication', followUpType: 'Post-surgical bracing', lastVisit: '2026-08-15', nextVisit: '2026-09-01',
    clinician: 'Mr. Kofi Adjei (Orthotist)', notes: 'Custom brace being fabricated. Weight-bearing status: TTWB for 6 weeks. Brace to control ROM during healing.'
  },
  { id: 'OP-004', patientName: 'Efua Nyarko', age: 55, gender: 'Female', mrn: 'MRN-2026-1256',
    deviceType: 'Transfemoral Prosthesis (Above Knee)', side: 'Right', indication: 'Above-knee amputation — osteosarcoma',
    status: 'Assessment', followUpType: 'Initial assessment', lastVisit: '2026-08-24', nextVisit: '2026-09-07',
    clinician: 'Mr. Kofi Adjei (Prosthetist)', notes: 'New amputee — 6 weeks post-op. Stump healing well. Pre-prosthetic exercises started. Socket casting planned for next week. K2 potential.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Fabrication': 'bg-yellow-100 text-yellow-800',
  'Fitting': 'bg-orange-100 text-orange-800', 'Delivered': 'bg-green-100 text-green-800',
  'Follow-up': 'bg-purple-100 text-purple-800',
};

export default function OrthoticsProsthetics() {
  const [selected, setSelected] = useState<OAndPDevice | null>(DEVICES[0] ?? null);
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
          title="Add New Orthotics Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Orthotics & Prosthetics</h1><p className="text-gray-500">Custom prosthetic devices, orthotic bracing, fitting, and rehabilitation</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Devices', value: DEVICES.length, color: 'text-blue-600' },
          { label: 'Prostheses', value: DEVICES.filter(d=>d.deviceType.includes('Prosthesis')).length, color: 'text-green-600' },
          { label: 'Orthoses', value: DEVICES.filter(d=>d.deviceType.includes('Orthosis')).length, color: 'text-purple-600' },
          { label: 'Delivered', value: DEVICES.filter(d=>d.status==='Delivered').length, color: 'text-gray-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {DEVICES.map(d => (
            <div key={d.id} onClick={() => setSelected(d)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===d.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{d.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[d.status]}`}>{d.status}</Badge></div>
                  <div className="text-sm text-gray-500">{d.deviceType} — {d.side}</div>
                  <div className="text-xs text-gray-400 mt-1">{d.indication}</div>
                </div>
                <div className="text-right text-xs text-gray-400"><div>Next: {d.nextVisit}</div><div>{d.clinician}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p></div>
              <div className="bg-blue-50 rounded-lg p-3"><div className="text-sm font-medium text-blue-700">🦿 {selected.deviceType}</div><div className="text-sm text-blue-600">{selected.side} side</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Indication:</span> {selected.indication}</div><div><span className="text-gray-500">Clinician:</span> {selected.clinician}</div><div><span className="text-gray-500">Last Visit:</span> {selected.lastVisit}</div><div><span className="text-gray-500">Next Visit:</span> {selected.nextVisit}</div><div><span className="text-gray-500">Review Type:</span> {selected.followUpType}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
