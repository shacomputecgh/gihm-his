import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  office: string;
  specialization?: string;
  availability: 'Available' | 'In Surgery' | 'On Call' | 'Off Duty' | 'On Leave';
  shift?: string;
  certifications?: string[];
}

const STAFF: StaffMember[] = [
  { id: 'DOC-001', name: 'Dr. Kwame Asante', role: 'Consultant Surgeon', department: 'Surgery', phone: '+233 24 123 4567', email: 'kasante@hospital.com', office: 'Block A, Room 301', specialization: 'General & Laparoscopic Surgery', availability: 'Available', certifications: ['MBChB', 'FWACS', 'FACS'] },
  { id: 'DOC-002', name: 'Dr. Akua Mensah', role: 'Consultant Paediatrician', department: 'Paediatrics', phone: '+233 26 234 5678', email: 'amensah@hospital.com', office: 'Block B, Room 205', specialization: 'Paediatrics & Neonatology', availability: 'Available', certifications: ['MBChB', 'DCH', 'MRCPCH'] },
  { id: 'DOC-003', name: 'Dr. Yaw Boateng', role: 'Medical Officer — Emergency', department: 'Emergency', phone: '+233 20 345 6789', email: 'yboateng@hospital.com', office: 'Emergency Department', specialization: 'Emergency Medicine', availability: 'In Surgery', certifications: ['MBChB', 'DIMM', 'ATLS'] },
  { id: 'DOC-004', name: 'Dr. Priscilla Wiafe', role: 'Consultant Psychiatrist', department: 'Psychiatry', phone: '+233 24 456 7890', email: 'pwiafe@hospital.com', office: 'Block C, Room 102', specialization: 'Psychiatry & Addiction Medicine', availability: 'On Call', certifications: ['MBChB', 'MRCPsych', 'FRCPsych'] },
  { id: 'DOC-005', name: 'Dr. Efua Darko', role: 'Consultant Anaesthetist', department: 'Anaesthesia', phone: '+233 26 567 8901', email: 'edarko@hospital.com', office: 'Theatre Complex, Room 10', specialization: 'Anaesthesia & Critical Care', availability: 'Available', certifications: ['MBChB', 'FRCA', 'EDIC'] },
  { id: 'PH-001', name: 'Pharm. Kofi Adjei', role: 'Chief Pharmacist', department: 'Pharmacy', phone: '+233 20 678 9012', email: 'kadjei@hospital.com', office: 'Pharmacy Block', specialization: 'Clinical Pharmacy', availability: 'Available', certifications: ['BPharm', 'MSc Clinical Pharmacy'] },
  { id: 'NUR-001', name: 'Sr. Abena Osei', role: 'Senior Nurse — ICU', department: 'ICU', phone: '+233 24 789 0123', email: 'aosei@hospital.com', office: 'ICU Unit', specialization: 'Critical Care Nursing', availability: 'Available', certifications: ['RN', 'CCN', 'ACLS'] },
  { id: 'NUR-002', name: 'Sr. Esi Amoako', role: 'Senior Nurse — Ward 2', department: 'Medical Ward', phone: '+233 26 890 1234', email: 'eamoako@hospital.com', office: 'Ward 2', availability: 'Available', certifications: ['RN', 'BLS'] },
  { id: 'NUR-003', name: 'Sr. Nana Agyei', role: 'Nurse — Ward 3', department: 'Surgical Ward', phone: '+233 20 901 2345', email: 'nagyei@hospital.com', office: 'Ward 3', availability: 'On Call', shift: 'Night (7PM-7AM)', certifications: ['RN'] },
  { id: 'LAB-001', name: 'Lab. Nana Agyeman', role: 'Laboratory Scientist', department: 'Laboratory', phone: '+233 24 012 3456', email: 'nagyeman@hospital.com', office: 'Laboratory Block', specialization: 'Haematology & Clinical Chemistry', availability: 'Available', certifications: ['BMLSc', 'AMLS'] },
  { id: 'RAD-001', name: 'Dr. Nana Oforiwaa', role: 'Radiologist', department: 'Radiology', phone: '+233 26 123 4560', email: 'noforiwaa@hospital.com', office: 'Radiology Department', specialization: 'Diagnostic & Interventional Radiology', availability: 'On Leave', certifications: ['MBChB', 'FRCR'] },
  { id: 'ADM-001', name: 'Ms. Priscilla Aidoo', role: 'Hospital Administrator', department: 'Administration', phone: '+233 20 234 5670', email: 'paidoo@hospital.com', office: 'Admin Block, Room 101', availability: 'Available', certifications: ['MBA', 'HCM'] },
];

const AVAILABILITY_STYLES: Record<string, string> = {
  'Available': 'bg-green-100 text-green-800', 'In Surgery': 'bg-red-100 text-red-800',
  'On Call': 'bg-yellow-100 text-yellow-800', 'Off Duty': 'bg-gray-100 text-gray-800',
  'On Leave': 'bg-purple-100 text-purple-800',
};

export default function StaffDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterAvail, setFilterAvail] = useState('All');
  const [selected, setSelected] = useState<StaffMember | null>(STAFF[0] ?? null);

  const departments = [...new Set(STAFF.map(s => s.department))].sort();
  const filtered = STAFF.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === 'All' || s.department === filterDept;
    const matchAvail = filterAvail === 'All' || s.availability === filterAvail;
    return matchSearch && matchDept && matchAvail;
  });

  const availableCount = STAFF.filter(s => s.availability === 'Available').length;
  const onCallCount = STAFF.filter(s => s.availability === 'On Call').length;

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
      <div>
        <h1 className="text-2xl font-bold">Staff Directory</h1>
        <p className="text-gray-500">Staff contacts, availability, specializations, and organizational overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: STAFF.length, color: 'text-blue-600' },
          { label: 'Available', value: availableCount, color: 'text-green-600' },
          { label: 'On Call', value: onCallCount, color: 'text-yellow-600' },
          { label: 'Departments', value: departments.length, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search name or role..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterAvail} onChange={e => setFilterAvail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Availability</option>
          {Object.keys(AVAILABILITY_STYLES).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(s)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === s.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.role}</div>
                  <div className="text-xs text-gray-400">{s.department}</div>
                </div>
                <Badge className={`text-[10px] ${AVAILABILITY_STYLES[s.availability]}`}>{s.availability}</Badge>
              </div>
              {s.specialization && <div className="text-xs text-blue-600 mt-1">{s.specialization}</div>}
              <div className="flex gap-1 mt-2 flex-wrap">
                {s.certifications?.slice(0, 3).map(c => <Badge key={c} className="text-[10px] bg-gray-100">{c}</Badge>)}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mx-auto">
                  {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h2 className="font-bold text-lg mt-2">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.role}</p>
                <Badge className={`text-xs mt-1 ${AVAILABILITY_STYLES[selected.availability]}`}>{selected.availability}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">📞 <span>{selected.phone}</span></div>
                <div className="flex items-center gap-2">✉️ <span>{selected.email}</span></div>
                <div className="flex items-center gap-2">🏢 <span>{selected.office}</span></div>
                {selected.shift && <div className="flex items-center gap-2">🕐 <span>{selected.shift}</span></div>}
              </div>

              {selected.specialization && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700">Specialization</div>
                  <div className="text-sm text-blue-600">{selected.specialization}</div>
                </div>
              )}

              {selected.certifications && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Certifications</div>
                  <div className="flex gap-1 flex-wrap">
                    {selected.certifications.map(c => <Badge key={c} className="text-xs bg-purple-100 text-purple-700">{c}</Badge>)}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => {}} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">📞 Call</button>
                <button onClick={() => {}} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">✉️ Email</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
