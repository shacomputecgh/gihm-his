import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Material { id: string; title: string; category: string; condition: string; format: string; language: string; views: number; lastUpdated: string; author: string; status: 'Published' | 'Draft' | 'Under Review'; difficulty: 'Easy' | 'Intermediate' | 'Advanced'; }

const MATERIALS: Material[] = [
  { id: 'PE-001', title: 'Understanding Your Heart Attack', category: 'Cardiology', condition: 'Myocardial Infarction', format: 'Leaflet + Video', language: 'English / Twi', views: 1250, lastUpdated: '2026-07-15', author: 'Dr. Yaw Boateng', status: 'Published', difficulty: 'Easy' },
  { id: 'PE-002', title: 'Managing Your Diabetes at Home', category: 'Endocrinology', condition: 'Type 2 Diabetes', format: 'Booklet', language: 'English / Ga', views: 2100, lastUpdated: '2026-06-20', author: 'Dr. Kofi Asante', status: 'Published', difficulty: 'Intermediate' },
  { id: 'PE-003', title: 'Post-Surgery Wound Care', category: 'Surgery', condition: 'Post-operative', format: 'Leaflet', language: 'English / Ewe', views: 980, lastUpdated: '2026-08-01', author: 'Nurse Akua', status: 'Published', difficulty: 'Easy' },
  { id: 'PE-004', title: 'Malaria Prevention & Treatment', category: 'Infectious Disease', condition: 'Malaria', format: 'Poster + Leaflet', language: 'English / Hausa', views: 3500, lastUpdated: '2026-05-10', author: 'Dr. Ama Darko', status: 'Published', difficulty: 'Easy' },
  { id: 'PE-005', title: 'Blood Pressure Management', category: 'Cardiology', condition: 'Hypertension', format: 'Video + Booklet', language: 'English / Twi', views: 1800, lastUpdated: '2026-07-20', author: 'Dr. Yaw Boateng', status: 'Published', difficulty: 'Easy' },
  { id: 'PE-006', title: 'Understanding Your Lab Results', category: 'General', condition: 'Laboratory', format: 'Leaflet', language: 'English', views: 2800, lastUpdated: '2026-08-10', author: 'Lab Manager', status: 'Published', difficulty: 'Intermediate' },
  { id: 'PE-007', title: 'Breastfeeding Your Baby', category: 'Maternity', condition: 'Lactation', format: 'Booklet + Video', language: 'English / Fante', views: 4200, lastUpdated: '2026-06-01', author: 'Midwife Abena', status: 'Published', difficulty: 'Easy' },
  { id: 'PE-008', title: 'Medication Safety at Home', category: 'Pharmacy', condition: 'Medication', format: 'Leaflet', language: 'English / Dagbani', views: 1500, lastUpdated: '2026-08-05', author: 'Pharmacist Kofi', status: 'Published', difficulty: 'Easy' },
  { id: 'PE-009', title: 'COPD Self-Management', category: 'Respiratory', condition: 'COPD', format: 'Booklet', language: 'English', views: 650, lastUpdated: '2026-08-15', author: 'Dr. James Mensah', status: 'Draft', difficulty: 'Advanced' },
  { id: 'PE-010', title: 'HIV/AIDS Awareness', category: 'Infectious Disease', condition: 'HIV', format: 'Poster + Leaflet + Video', language: 'English / Twi / Ga', views: 5200, lastUpdated: '2026-04-15', author: 'Dr. Ama Darko', status: 'Published', difficulty: 'Easy' },
];

const CATEGORY_ICONS: Record<string, string> = { Cardiology: '❤️', Endocrinology: '🩸', Surgery: '🏥', 'Infectious Disease': '🦠', General: '📋', Maternity: '👶', Pharmacy: '💊', Respiratory: '🫁' };

export default function PatientEducationEnhanced() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const categories = ['All', ...new Set(MATERIALS.map(m => m.category))];
  const filtered = MATERIALS.filter(m => (catFilter === 'All' || m.category === catFilter) && (search === '' || m.title.toLowerCase().includes(search.toLowerCase()) || m.condition.toLowerCase().includes(search.toLowerCase())));
  const totalViews = MATERIALS.reduce((s, m) => s + m.views, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Education Library</h1>
          <p className="text-slate-500 text-sm">Health education materials in multiple Ghanaian languages</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Material</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Materials</p><p className="text-2xl font-bold">{MATERIALS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Total Views</p><p className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Languages</p><p className="text-2xl font-bold">6</p><p className="text-xs text-slate-400">EN, Twi, Ga, Ewe, Fante, Hausa, Dagbani</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Published</p><p className="text-2xl font-bold text-green-600">{MATERIALS.filter(m => m.status === 'Published').length}</p></Card>
      </div>

      <input type="text" placeholder="Search materials by title or condition..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm" />

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1 rounded-lg text-xs font-medium ${catFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{c !== 'All' ? `${CATEGORY_ICONS[c] ?? ''} ` : ''}{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <Card key={m.id} className="p-4 hover:shadow transition">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{CATEGORY_ICONS[m.category] ?? '📋'}</span>
              <Badge tone={m.status === 'Published' ? 'green' : m.status === 'Draft' ? 'gold' : 'blue'}>{m.status}</Badge>
            </div>
            <h3 className="font-semibold">{m.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{m.condition}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge tone="blue">{m.format}</Badge>
              <Badge tone="green">{m.language}</Badge>
              <Badge tone={m.difficulty === 'Easy' ? 'green' : m.difficulty === 'Intermediate' ? 'gold' : 'red'}>{m.difficulty}</Badge>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>👁️ {m.views.toLocaleString()} views</span>
              <span>Updated: {m.lastUpdated}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">By {m.author}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
