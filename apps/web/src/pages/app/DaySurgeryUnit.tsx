import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DayCase {
  id: string; patientName: string; age: number; gender: string; mrn: string;
  procedure: string; surgeon: string; anaesthetist: string;
  scheduledTime: string; duration: string; status: 'Scheduled' | 'In Theatre' | 'Recovery' | 'Discharged' | 'Cancelled';
  preOpChecklist: boolean; consentObtained: boolean; fasting: boolean;
  anaesthesiaType: string; asaClass: string; notes: string;
}

const CASES: DayCase[] = [
  { id: 'DC-001', patientName: 'Kwame Mensah', age: 45, gender: 'Male', mrn: 'MRN-2026-1110',
    procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Kwame Asante', anaesthetist: 'Dr. Efua Darko',
    scheduledTime: '08:00', duration: '90 min', status: 'In Theatre',
    preOpChecklist: true, consentObtained: true, fasting: true, anaesthesiaType: 'General', asaClass: 'ASA II', notes: 'Gallstones with biliary colic. Day case protocol.'
  },
  { id: 'DC-002', patientName: 'Akua Boateng', age: 32, gender: 'Female', mrn: 'MRN-2026-1112',
    procedure: 'Arthroscopy Right Knee', surgeon: 'Dr. Akua Mensah', anaesthetist: 'Dr. Yaw Boateng',
    scheduledTime: '09:30', duration: '60 min', status: 'Recovery',
    preOpChecklist: true, consentObtained: true, fasting: true, anaesthesiaType: 'Spinal', asaClass: 'ASA I', notes: 'Meniscal tear. Weight bearing as tolerated. Physio next day.'
  },
  { id: 'DC-003', patientName: 'Kofi Asare', age: 55, gender: 'Male', mrn: 'MRN-2026-1114',
    procedure: 'Carpal Tunnel Release', surgeon: 'Dr. Akua Mensah', anaesthetist: 'Dr. Efua Darko',
    scheduledTime: '11:00', duration: '30 min', status: 'Scheduled',
    preOpChecklist: true, consentObtained: true, fasting: true, anaesthesiaType: 'Local + Sedation', asaClass: 'ASA II', notes: 'Bilateral carpal tunnel. Local anaesthesia — same day discharge.'
  },
  { id: 'DC-004', patientName: 'Efua Nyarko', age: 68, gender: 'Female', mrn: 'MRN-2026-1116',
    procedure: 'Cataract Surgery (Phaco + IOL)', surgeon: 'Dr. Akua Mensah', anaesthetist: 'Dr. Yaw Boateng',
    scheduledTime: '13:00', duration: '45 min', status: 'Scheduled',
    preOpChecklist: false, consentObtained: true, fasting: true, anaesthesiaType: 'Topical', asaClass: 'ASA II', notes: 'Pre-op checklist pending — dilating drops needed 30 min before.'
  },
  { id: 'DC-005', patientName: 'Nana Kuffour', age: 28, gender: 'Male', mrn: 'MRN-2026-1118',
    procedure: 'Excision Skin Lesion', surgeon: 'Dr. Kwame Asante', anaesthetist: 'Dr. Efua Darko',
    scheduledTime: '14:30', duration: '30 min', status: 'Cancelled',
    preOpChecklist: true, consentObtained: true, fasting: false, anaesthesiaType: 'Local', asaClass: 'ASA I', notes: 'Patient broke fast — NPO violated. Rescheduled next week.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Scheduled': 'bg-blue-100 text-blue-800', 'In Theatre': 'bg-orange-100 text-orange-800',
  'Recovery': 'bg-green-100 text-green-800', 'Discharged': 'bg-gray-100 text-gray-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

export default function DaySurgeryUnit() {
  const [selected, setSelected] = useState<DayCase | null>(CASES[0] ?? null);
  
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
          title="Add New Day Surgery Case"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Day Surgery Unit</h1><p className="text-gray-500">Outpatient procedures, recovery tracking, and day case management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Cases Today', value: CASES.length, color: 'text-blue-600' },
          { label: 'Scheduled', value: CASES.filter(c=>c.status==='Scheduled').length, color: 'text-blue-500' },
          { label: 'In Theatre', value: CASES.filter(c=>c.status==='In Theatre').length, color: 'text-orange-600' },
          { label: 'Recovery', value: CASES.filter(c=>c.status==='Recovery').length, color: 'text-green-600' },
          { label: 'Cancelled', value: CASES.filter(c=>c.status==='Cancelled').length, color: 'text-red-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {CASES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===c.id?'border-blue-500 shadow-md':''} ${c.status==='Cancelled'?'opacity-60':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{c.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge></div>
                  <div className="text-sm text-gray-500">{c.procedure}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.surgeon} | {c.anaesthesiaType} | {c.duration}</div>
                </div>
                <div className="text-right"><div className="text-lg font-bold text-blue-600">{c.scheduledTime}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-3xl font-black text-blue-600">{selected.scheduledTime}</div><div className="text-xs text-blue-600">Scheduled Time | {selected.duration}</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Procedure:</span> <span className="font-semibold">{selected.procedure}</span></div><div><span className="text-gray-500">Surgeon:</span> {selected.surgeon}</div><div><span className="text-gray-500">Anaesthetist:</span> {selected.anaesthetist}</div><div><span className="text-gray-500">Anaesthesia:</span> {selected.anaesthesiaType}</div><div><span className="text-gray-500">ASA:</span> {selected.asaClass}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-2">Pre-Op Checklist</div>
                {[{label:'Checklist Complete',val:selected.preOpChecklist},{label:'Consent Obtained',val:selected.consentObtained},{label:'NPO Confirmed',val:selected.fasting}].map((item,i)=>(
                  <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded mb-1 ${item.val?'bg-green-50':'bg-red-50'}`}><span>{item.val?'✅':'❌'}</span> {item.label}</div>
                ))}
              </div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
