import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface TouristPatient {
  id: string; name: string; country: string; nationality: string;
  package: string; treatment: string; duration: string;
  estimatedCost: number; paidAmount: number;
  status: 'Enquiry' | 'Consultation' | 'Travel Arranged' | 'Arrived' | 'In Treatment' | 'Completed' | 'Follow-up';
  arrivalDate: string; coordinator: string; languages: string[];
}

const TOURIST_PATIENTS: TouristPatient[] = [
  { id: 'MT-001', name: 'John Smith', country: 'United Kingdom', nationality: 'British', package: 'Premium', treatment: 'Cardiac Surgery (CABG)', duration: '3 weeks', estimatedCost: 45000, paidAmount: 22500, status: 'In Treatment', arrivalDate: '2026-08-10', coordinator: 'Nana Osei-Bonsu', languages: ['English'] },
  { id: 'MT-002', name: 'Fatima Al-Hassan', country: 'Nigeria', nationality: 'Nigerian', package: 'Standard', treatment: 'Fertility Treatment (IVF)', duration: '6 weeks', estimatedCost: 12000, paidAmount: 12000, status: 'In Treatment', arrivalDate: '2026-07-15', coordinator: 'Ama Darko', languages: ['English', 'Hausa'] },
  { id: 'MT-003', name: 'Pierre Dupont', country: 'France', nationality: 'French', package: 'Executive', treatment: 'Full Health Screening + Dental', duration: '1 week', estimatedCost: 8000, paidAmount: 8000, status: 'Completed', arrivalDate: '2026-08-01', coordinator: 'Kofi Mensah', languages: ['French', 'English'] },
  { id: 'MT-004', name: 'Maria Garcia', country: 'Spain', nationality: 'Spanish', package: 'Premium', treatment: 'Orthopaedic Surgery (Knee Replacement)', duration: '4 weeks', estimatedCost: 25000, paidAmount: 12500, status: 'Travel Arranged', arrivalDate: '2026-09-01', coordinator: 'Nana Osei-Bonsu', languages: ['Spanish', 'English'] },
  { id: 'MT-005', name: 'Ahmed Hassan', country: 'United Arab Emirates', nationality: 'Emirati', package: 'VIP', treatment: 'Oncology Treatment Package', duration: '8 weeks', estimatedCost: 85000, paidAmount: 42500, status: 'Consultation', arrivalDate: '2026-09-15', coordinator: 'Ama Darko', languages: ['Arabic', 'English'] },
];

const PACKAGES = [
  { name: 'Executive Health Screening', duration: '3-5 days', price: 'GH₵ 8,000 - 15,000', includes: 'Full body checkup, cardiac screen, dental, eye exam, spa', patients: 45, icon: '🏥' },
  { name: 'Fertility Treatment (IVF)', duration: '4-6 weeks', price: 'GH₵ 12,000 - 25,000', includes: 'Consultation, stimulation, egg retrieval, transfer, monitoring', patients: 28, icon: '👶' },
  { name: 'Cardiac Surgery Package', duration: '2-4 weeks', price: 'GH₵ 35,000 - 60,000', includes: 'Pre-op, surgery, ICU, rehab, hotel stay', patients: 15, icon: '❤️' },
  { name: 'Orthopaedic Surgery', duration: '3-4 weeks', price: 'GH₵ 20,000 - 40,000', includes: 'Surgery, physiotherapy, follow-up', patients: 22, icon: '🦴' },
  { name: 'Dental Tourism Package', duration: '1-2 weeks', price: 'GH₵ 3,000 - 8,000', includes: 'Implants, crowns, whitening, checkup', patients: 55, icon: '🦷' },
  { name: 'Oncology Treatment', duration: '6-12 weeks', price: 'GH₵ 50,000 - 120,000', includes: 'Chemotherapy, radiation, surgery, follow-up', patients: 8, icon: '🎗️' },
];

const STATUS_COLORS: Record<string, string> = {
  'Enquiry': 'bg-blue-100 text-blue-800', 'Consultation': 'bg-purple-100 text-purple-800',
  'Travel Arranged': 'bg-orange-100 text-orange-800', 'Arrived': 'bg-green-100 text-green-800',
  'In Treatment': 'bg-yellow-100 text-yellow-800', 'Completed': 'bg-gray-100 text-gray-800', 'Follow-up': 'bg-cyan-100 text-cyan-800',
};

export default function MedicalTourism() {
  const [tab, setTab] = useState<'patients' | 'packages' | 'stats'>('patients');
  const totalRevenue = TOURIST_PATIENTS.reduce((s, p) => s + p.paidAmount, 0);
  const totalEstimated = TOURIST_PATIENTS.reduce((s, p) => s + p.estimatedCost, 0);

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
          title="Add New Tourism Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Medical Tourism & International Patients</h1><p className="text-gray-500">International patient management, treatment packages, travel coordination, and concierge services</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'International Patients', value: TOURIST_PATIENTS.length, color: 'text-blue-600' }, { label: 'Revenue Collected', value: `$${(totalRevenue/1000).toFixed(0)}K`, color: 'text-green-600' }, { label: 'Pipeline Value', value: `$${((totalEstimated-totalRevenue)/1000).toFixed(0)}K`, color: 'text-orange-600' }, { label: 'Packages Offered', value: PACKAGES.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['patients', 'packages', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'patients' ? 'International Patients' : t === 'packages' ? 'Treatment Packages' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'patients' && (
        <div className="space-y-4">
          {TOURIST_PATIENTS.map(p => (
            <div key={p.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌍</span>
                    <span className="font-bold">{p.name}</span>
                    <span className="text-sm text-gray-500">({p.nationality})</span>
                    <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{p.treatment} — {p.duration}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Coordinator: {p.coordinator}</div>
                  <div className="text-xs text-gray-400">Languages: {p.languages.join(', ')}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Package</div><div className="font-bold">{p.package}</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Estimated Cost</div><div className="font-bold">${p.estimatedCost.toLocaleString()}</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Paid</div><div className="font-bold text-green-600">${p.paidAmount.toLocaleString()}</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Arrival</div><div className="font-bold">{p.arrivalDate}</div></div>
              </div>
              <div className="mt-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${(p.paidAmount/p.estimatedCost)*100}%` }} /></div><div className="text-xs text-gray-500 text-right mt-1">{Math.round((p.paidAmount/p.estimatedCost)*100)}% paid</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PACKAGES.map(p => (
            <div key={p.name} className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{p.icon}</span><h3 className="font-semibold text-sm">{p.name}</h3></div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Duration</span><span>{p.duration}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price Range</span><span className="font-bold text-green-600">{p.price}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Patients Served</span><span className="font-bold">{p.patients}</span></div>
              </div>
              <div className="mt-2 text-xs text-gray-600 bg-blue-50 rounded p-2">{p.includes}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">By Country of Origin</h3>
            {[...new Set(TOURIST_PATIENTS.map(p => p.country))].map(c => (
              <div key={c} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{c}</span><span className="font-bold">{TOURIST_PATIENTS.filter(p => p.country === c).length}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">By Status</h3>
            {Object.keys(STATUS_COLORS).map(s => (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0">
                <Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{TOURIST_PATIENTS.filter(p => p.status === s).length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
