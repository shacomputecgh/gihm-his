import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Material {
  id: string; title: string; category: string; condition: string;
  format: string; language: string; views: number;
  lastUpdated: string;
}

const MATERIALS: Material[] = [
  { id: 'PE-001', title: 'Understanding Your Heart Attack', category: 'Cardiology', condition: 'Myocardial Infarction', format: 'Leaflet + Video', language: 'English / Twi', views: 1250, lastUpdated: '2026-07-15' },
  { id: 'PE-002', title: 'Managing Your Diabetes at Home', category: 'Endocrinology', condition: 'Type 2 Diabetes', format: 'Booklet', language: 'English / Ga', views: 2100, lastUpdated: '2026-06-20' },
  { id: 'PE-003', title: 'Post-Surgery Wound Care', category: 'Surgery', condition: 'Post-operative', format: 'Leaflet', language: 'English / Ewe', views: 980, lastUpdated: '2026-08-01' },
  { id: 'PE-004', title: 'Malaria Prevention & Treatment', category: 'Infectious Disease', condition: 'Malaria', format: 'Poster + Leaflet', language: 'English / Hausa', views: 3500, lastUpdated: '2026-05-10' },
  { id: 'PE-005', title: 'Breastfeeding Your Baby', category: 'Maternity', condition: 'Postpartum', format: 'Video + Booklet', language: 'English / Twi / Ga', views: 1800, lastUpdated: '2026-08-10' },
  { id: 'PE-006', title: 'TB Treatment — Complete Your Course', category: 'Respiratory', condition: 'Tuberculosis', format: 'Leaflet', language: 'English / Dagbani', views: 1500, lastUpdated: '2026-07-01' },
  { id: 'PE-007', title: 'HIV — Living a Healthy Life', category: 'Infectious Disease', condition: 'HIV/AIDS', format: 'Booklet + App', language: 'English / Ewe', views: 2800, lastUpdated: '2026-06-15' },
  { id: 'PE-008', title: 'Childhood Vaccination Schedule', category: 'Paediatrics', condition: 'Immunisation', format: 'Poster', language: 'English / Twi', views: 4200, lastUpdated: '2026-08-01' },
];

const LANGUAGES = ['English', 'Twi', 'Ga', 'Ewe', 'Hausa', 'Dagbani'];

export default function PatientEducation() {
  const [search, setSearch] = useState('');
  const filtered = MATERIALS.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));

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
          title="Add New Education Material"
          fields={[{"name":"topic","label":"Topic","type":"text","required":true},{"name":"category","label":"Category","type":"select","options":["Disease Management","Medication","Prevention","Nutrition","Exercise","Mental Health","Other"]},{"name":"targetAudience","label":"Target Audience","type":"select","options":["Patients","Caregivers","General Public"]},{"name":"content","label":"Content","type":"textarea","required":true}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Patient Education</h1><p className="text-gray-500">Educational materials, condition information, discharge instructions, and health literacy</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Materials', value: MATERIALS.length, color: 'text-blue-600' }, { label: 'Total Views', value: `${(MATERIALS.reduce((s, m) => s + m.views, 0)/1000).toFixed(1)}K`, color: 'text-green-600' }, { label: 'Languages', value: LANGUAGES.length, color: 'text-purple-600' }, { label: 'Categories', value: [...new Set(MATERIALS.map(m => m.category))].length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <input type="text" placeholder="Search materials by title or category..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded-lg px-4 py-2 text-sm" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div key={m.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><span className="font-bold text-sm">{m.title}</span><Badge className="bg-gray-100 text-gray-800">{m.category}</Badge></div>
            <div className="text-xs text-gray-500 space-y-1 mb-2"><div>Condition: <span className="font-medium">{m.condition}</span></div><div>Format: {m.format}</div><div>Languages: {m.language}</div></div>
            <div className="flex items-center justify-between text-xs"><span className="text-blue-600 font-bold">{m.views.toLocaleString()} views</span><span className="text-gray-500">Updated: {m.lastUpdated}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
