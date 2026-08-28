import { useState } from 'react';
import { Button, Card, Input, useToast } from '../../components/ui';

interface HospitalProfile {
  name: string; type: string; ownership: string; region: string; district: string;
  address: string; phone: string; email: string; website: string;
  ghsCode: string; nhisCode: string; facilitiesLicense: string;
  directorName: string; directorPhone: string; directorEmail: string;
  pharmacyManagerName: string; labManagerName: string; nursingDirector: string;
  bedCapacity: number; staffCount: number; departments: string[];
  emergencyContact: string; ambulanceNumber: string;
  insuranceProviders: string[];
  motto: string; established: string;
}

const INITIAL_PROFILE: HospitalProfile = {
  name: 'Greater Accra Regional Hospital', type: 'Teaching Hospital', ownership: 'Government',
  region: 'Greater Accra', district: 'Accra Metropolitan', address: 'Korle-Bu, Accra',
  phone: '+233 302 775 611', email: 'info@korlebu.gov.gh', website: 'www.korlebuteachinghospital.org',
  ghsCode: 'GA-001', nhisCode: 'NHIS-GA-001', facilitiesLicense: 'FDH-2026-001',
  directorName: 'Dr. Kwame Asante', directorPhone: '+233 244 123 456', directorEmail: 'director@korlebu.gov.gh',
  pharmacyManagerName: 'Pharm. Osei Mensah', labManagerName: 'Dr. Agyemang', nursingDirector: 'Nana Ama Darko',
  bedCapacity: 2000, staffCount: 4500,
  departments: ['Emergency', 'Surgery', 'Medicine', 'Obstetrics', 'Paediatrics', 'ICU', 'Oncology', 'Psychiatry', 'Dental', 'Ophthalmology', 'ENT', 'Orthopaedics', 'Neurology', 'Dermatology', 'Radiology', 'Pathology', 'Pharmacy', 'Laboratory', 'Physiotherapy', 'Renal Unit'],
  emergencyContact: '999', ambulanceNumber: '193',
  insuranceProviders: ['NHIS', 'Enterprise Insurance', 'Star Assurance', 'SIC Insurance', 'Vitality Health'],
  motto: 'Quality Healthcare for All', established: '1925',
};



export default function HospitalProfileSettings() {
  const [profile, setProfile] = useState<HospitalProfile>(INITIAL_PROFILE);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const toast = useToast();

  const handleSave = () => {
    setProfile(form); setEditing(false);
    toast('Hospital profile updated successfully');
  };

  const Field = ({ label, value, field, type = 'text' }: { label: string; value: string; field: keyof HospitalProfile; type?: string }) => (
    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</label>
      {editing ? <Input type={type} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /> :
      <p className="text-sm text-slate-800">{value || '—'}</p>}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Hospital Profile</h1><p className="text-gray-500">Facility information, accreditation, and organisational structure</p></div>
        {editing ? (
          <div className="flex gap-2"><Button variant="outline" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></div>
        ) : <Button onClick={() => { setEditing(true); setForm(profile); }}>Edit Profile</Button>}
      </div>
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-3xl">🏥</div>
          <div><h2 className="text-xl font-bold">{profile.name}</h2><p className="text-sm text-gray-500">{profile.motto} · Est. {profile.established} · {profile.type} ({profile.ownership})</p></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Hospital Name" value={profile.name} field="name" />
          <Field label="Type" value={profile.type} field="type" />
          <Field label="Ownership" value={profile.ownership} field="ownership" />
          <Field label="Region" value={profile.region} field="region" />
          <Field label="District" value={profile.district} field="district" />
          <Field label="Address" value={profile.address} field="address" />
          <Field label="Phone" value={profile.phone} field="phone" />
          <Field label="Email" value={profile.email} field="email" />
          <Field label="Website" value={profile.website} field="website" />
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Accreditation & Codes</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="GHS Facility Code" value={profile.ghsCode} field="ghsCode" />
          <Field label="NHIS Code" value={profile.nhisCode} field="nhisCode" />
          <Field label="Facilities License" value={profile.facilitiesLicense} field="facilitiesLicense" />
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Leadership</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Hospital Director" value={profile.directorName} field="directorName" />
          <Field label="Director Phone" value={profile.directorPhone} field="directorPhone" />
          <Field label="Director Email" value={profile.directorEmail} field="directorEmail" />
          <Field label="Pharmacy Manager" value={profile.pharmacyManagerName} field="pharmacyManagerName" />
          <Field label="Laboratory Manager" value={profile.labManagerName} field="labManagerName" />
          <Field label="Nursing Director" value={profile.nursingDirector} field="nursingDirector" />
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Capacity & Staff</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{profile.bedCapacity}</div><div className="text-xs text-gray-500">Bed Capacity</div></div>
          <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">{profile.staffCount.toLocaleString()}</div><div className="text-xs text-gray-500">Total Staff</div></div>
          <div className="text-center p-3 bg-purple-50 rounded-lg"><div className="text-2xl font-bold text-purple-600">{profile.departments.length}</div><div className="text-xs text-gray-500">Departments</div></div>
          <div className="text-center p-3 bg-orange-50 rounded-lg"><div className="text-2xl font-bold text-orange-600">{profile.insuranceProviders.length}</div><div className="text-xs text-gray-500">Insurance Partners</div></div>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Emergency Contacts</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Emergency Number" value={profile.emergencyContact} field="emergencyContact" />
          <Field label="Ambulance Number" value={profile.ambulanceNumber} field="ambulanceNumber" />
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Departments</h3>
        <div className="flex flex-wrap gap-2">{profile.departments.map((d) => <span key={d} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">{d}</span>)}</div>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Insurance Partners</h3>
        <div className="flex flex-wrap gap-2">{profile.insuranceProviders.map((p) => <span key={p} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">{p}</span>)}</div>
      </Card>
    </div>
  );
}
