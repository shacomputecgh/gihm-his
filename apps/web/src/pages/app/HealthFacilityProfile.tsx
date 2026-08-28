import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';

interface Facility {
  id: string; name: string; type: string; region: string; district: string;
  beds: number; staff: number; services: string[];
  accreditation: string; lastInspection: string;
}

const FACILITIES: Facility[] = [
  { id: 'HF-001', name: 'Korle-Bu Teaching Hospital', type: 'Teaching Hospital', region: 'Greater Accra', district: 'Accra Metro', beds: 2000, staff: 5000, services: ['Surgery', 'Medicine', 'Paediatrics', 'Obstetrics', 'Oncology', 'Cardiology', 'Neurology'], accreditation: 'Ghana Medical & Dental Council', lastInspection: '2026-06-15' },
  { id: 'HF-002', name: 'Komfo Anokye Teaching Hospital', type: 'Teaching Hospital', region: 'Ashanti', district: 'Kumasi Metro', beds: 1200, staff: 3500, services: ['Surgery', 'Medicine', 'Paediatrics', 'Obstetrics', 'Ophthalmology'], accreditation: 'Ghana Medical & Dental Council', lastInspection: '2026-05-20' },
  { id: 'HF-003', name: 'Tamale Teaching Hospital', type: 'Teaching Hospital', region: 'Northern', district: 'Tamale Metro', beds: 800, staff: 2000, services: ['Surgery', 'Medicine', 'Paediatrics', 'Obstetrics'], accreditation: 'Ghana Medical & Dental Council', lastInspection: '2026-04-10' },
  { id: 'HF-004', name: 'Cape Coast Teaching Hospital', type: 'Teaching Hospital', region: 'Central', district: 'Cape Coast Metro', beds: 600, staff: 1500, services: ['Surgery', 'Medicine', 'Paediatrics', 'Obstetrics'], accreditation: 'Ghana Medical & Dental Council', lastInspection: '2026-07-01' },
  { id: 'HF-005', name: 'Ho Teaching Hospital', type: 'Teaching Hospital', region: 'Volta', district: 'Ho Municipal', beds: 400, staff: 1000, services: ['Surgery', 'Medicine', 'Paediatrics', 'Obstetrics'], accreditation: 'Ghana Medical & Dental Council', lastInspection: '2026-03-15' },
  { id: 'HF-006', name: 'Tema General Hospital', type: 'General Hospital', region: 'Greater Accra', district: 'Tema Metro', beds: 300, staff: 800, services: ['Surgery', 'Medicine', 'Paediatrics', 'Emergency'], accreditation: 'Ghana Health Service', lastInspection: '2026-08-01' },
];

export default function HealthFacilityProfile() {
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
          title="Add New Staff"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "Staff full name", "required": true}, {"name": "role", "label": "Role", "type": "select", "options": ["Doctor", "Nurse", "Pharmacist", "Lab Tech", "Admin", "Other"]}, {"name": "department", "label": "Department", "type": "select", "options": ["Emergency", "Surgery", "Medicine", "Paediatrics", "Obstetrics", "Pharmacy", "Laboratory", "Administration"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "email", "label": "Email", "type": "email", "placeholder": "staff@hospital.com"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Health Facility Profile</h1><p className="text-gray-500">Facility details, services, capacity, accreditation, and inspection tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {FACILITIES.map((f) => (
          <div key={f.id} className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="text-lg font-bold">{f.name}</div>
            <div className="text-sm text-gray-500">{f.type} — {f.region}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 rounded p-2 text-center"><div className="font-bold text-blue-700">{f.beds}</div><div className="text-xs text-gray-500">Beds</div></div>
              <div className="bg-green-50 rounded p-2 text-center"><div className="font-bold text-green-700">{f.staff}</div><div className="text-xs text-gray-500">Staff</div></div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {f.services.map((s) => <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s}</span>)}
            </div>
            <div className="mt-2 text-xs text-gray-500">Accreditation: {f.accreditation}</div>
            <div className="text-xs text-gray-500">Last Inspection: {f.lastInspection}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
