import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface HospitalProfile { id: string; name: string; type: 'Teaching Hospital' | 'Regional Hospital' | 'District Hospital' | 'Health Centre' | 'CHPS' | 'Private Hospital' | 'Mission Hospital'; region: string; district: string; address: string; phone: string; email: string; website: string; ghsCode: string; beds: number; staff: number; departments: string[]; services: string[]; accreditation: string; established: string; logo?: string; }

const PROFILE: HospitalProfile = {
  id: 'FAC-001', name: 'Lister Private Hospital', type: 'Private Hospital', region: 'Greater Accra', district: 'Accra Metropolitan', address: '123 Independence Ave, Accra, Ghana', phone: '+233 30 123 4567', email: 'info@listerhospital.com', website: 'www.listerhospital.com', ghsCode: 'GHS-AR-0123', beds: 120, staff: 350,
  departments: ['Emergency', 'OPD', 'IPD', 'Surgery', 'Maternity', 'Paediatrics', 'ICU', 'Laboratory', 'Radiology', 'Pharmacy', 'Dental', 'Ophthalmology', 'ENT', 'Dermatology', 'Orthopaedics', 'Cardiology', 'Oncology', 'Physiotherapy', 'Mental Health', 'Nutrition'],
  services: ['24/7 Emergency', 'ICU/NICU', 'Dialysis', 'CT Scan', 'MRI', 'X-Ray', 'Ultrasound', 'Laboratory', 'Blood Bank', 'Pharmacy', 'Telemedicine', 'Antenatal', 'Family Planning', 'Immunisation', 'HIV Care', 'TB Treatment'],
  accreditation: 'Ghana Health Service — Category 1A', established: '1995'
};

const FACILITY_TYPES = ['Teaching Hospital', 'Regional Hospital', 'District Hospital', 'Health Centre', 'CHPS', 'Private Hospital', 'Mission Hospital'];
const GHANA_REGIONS = ['Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Northern', 'Volta', 'Upper East', 'Upper West', 'Brong Ahafo', 'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'];

export default function HospitalProfileSettingsEnhanced() {
  const [tab, setTab] = useState<'profile' | 'departments' | 'services' | 'compliance'>('profile');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hospital Profile Settings</h1>
          <p className="text-slate-500 text-sm">Facility information, departments, services, and compliance</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
      </div>

      <div className="flex gap-2">
        {(['profile', 'departments', 'services', 'compliance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Facility Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-500">Hospital Name</label><input defaultValue={PROFILE.name} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Facility Type</label><select defaultValue={PROFILE.type} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">{FACILITY_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-xs text-slate-500">GHS Code</label><input defaultValue={PROFILE.ghsCode} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Region</label><select defaultValue={PROFILE.region} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">{GHANA_REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label className="text-xs text-slate-500">District</label><input defaultValue={PROFILE.district} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Address</label><input defaultValue={PROFILE.address} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Phone</label><input defaultValue={PROFILE.phone} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Email</label><input defaultValue={PROFILE.email} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Website</label><input defaultValue={PROFILE.website} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Total Beds</label><input type="number" defaultValue={PROFILE.beds} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Total Staff</label><input type="number" defaultValue={PROFILE.staff} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">Established</label><input defaultValue={PROFILE.established} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
          </div>
          <div><label className="text-xs text-slate-500">Accreditation</label><input defaultValue={PROFILE.accreditation} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
          <div><label className="text-xs text-slate-500">Hospital Logo</label><div className="mt-1 flex items-center gap-4"><div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">🏥</div><button onClick={() => {}} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">Upload Logo</button></div></div>
        </Card>
      )}

      {tab === 'departments' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Departments ({PROFILE.departments.length})</h2>
            <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+ Add Department</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROFILE.departments.map(d => (
              <div key={d} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">{d}</span>
                <button onClick={() => {}} className="text-xs text-red-500 hover:text-red-700">✕</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'services' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Services ({PROFILE.services.length})</h2>
            <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+ Add Service</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PROFILE.services.map(s => (
              <div key={s} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">✅ {s}</span>
                <button onClick={() => {}} className="text-xs text-red-500 hover:text-red-700">✕</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'compliance' && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Compliance & Licensing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm font-medium text-green-800">GHS Registration</p><Badge tone="green">Active</Badge><p className="text-xs text-slate-500 mt-1">Expires: 2027-12-31</p></div>
            <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm font-medium text-green-800">FDA License</p><Badge tone="green">Active</Badge><p className="text-xs text-slate-500 mt-1">Expires: 2027-06-30</p></div>
            <div className="p-4 bg-yellow-50 rounded-lg"><p className="text-sm font-medium text-yellow-800">NHIS Accreditation</p><Badge tone="gold">Renewal Due</Badge><p className="text-xs text-slate-500 mt-1">Expires: 2026-12-31</p></div>
            <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm font-medium text-green-800">Environmental Permit</p><Badge tone="green">Active</Badge><p className="text-xs text-slate-500 mt-1">Expires: 2028-03-15</p></div>
          </div>
        </Card>
      )}
    </div>
  );
}
