import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';

interface ResistanceData {
  organism: string; antibiotics: { name: string; resistance: number }[];
}

const RESISTANCE: ResistanceData[] = [
  { organism: 'Staphylococcus aureus', antibiotics: [{ name: 'Methicillin', resistance: 32 }, { name: 'Vancomycin', resistance: 0 }, { name: 'Linezolid', resistance: 0 }] },
  { organism: 'E. coli', antibiotics: [{ name: 'Amoxicillin', resistance: 55 }, { name: 'Ciprofloxacin', resistance: 28 }, { name: 'Meropenem', resistance: 5 }] },
  { organism: 'Klebsiella pneumoniae', antibiotics: [{ name: 'Ceftriaxone', resistance: 42 }, { name: 'Ciprofloxacin', resistance: 35 }, { name: 'Meropenem', resistance: 8 }] },
];

const STEWARDSHIP_METRICS = [
  { metric: 'Antibiotic Utilisation (DDD/100 bed-days)', target: 25, actual: 28.5, unit: 'DDD' },
  { metric: 'IV to Oral Switch Rate', target: 70, actual: 62, unit: '%' },
  { metric: 'Appropriate Empiric Therapy', target: 80, actual: 85, unit: '%' },
  { metric: 'C. difficile Rate', target: 3.0, actual: 2.1, unit: '/10,000' },
  { metric: 'MDR Organism Rate', target: 10, actual: 8.5, unit: '%' },
];

export default function AntimicrobialStewardshipDashboard() {
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
          title="Add New Ward"
          fields={[{"name": "wardName", "label": "Ward Name", "type": "text", "placeholder": "e.g. Medical Ward 3", "required": true}, {"name": "wardType", "label": "Ward Type", "type": "select", "options": ["Medical", "Surgical", "Paediatric", "Maternity", "ICU", "NICU", "Emergency", "Psychiatric", "Oncology"]}, {"name": "capacity", "label": "Bed Capacity", "type": "number", "placeholder": "0", "required": true}, {"name": "headNurse", "label": "Head Nurse", "type": "text", "placeholder": "Nurse name"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Antimicrobial Stewardship Dashboard</h1><p className="text-gray-500">Stewardship programme metrics, resistance patterns, and antibiotic utilisation tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'On Target', value: STEWARDSHIP_METRICS.filter(m => m.actual <= m.target || (m.metric.includes('Appropriate') && m.actual >= m.target)).length, color: 'text-green-600' }, { label: 'Below Target', value: STEWARDSHIP_METRICS.filter(m => m.actual > m.target && !m.metric.includes('Appropriate')).length, color: 'text-red-600' }, { label: 'Organisms Tracked', value: RESISTANCE.length, color: 'text-blue-600' }, { label: 'MDR Rate', value: '8.5%', color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-4">Stewardship Metrics</h3>
        <div className="space-y-4">
          {STEWARDSHIP_METRICS.map(m => {
            const isOnTarget = m.metric.includes('Appropriate') ? m.actual >= m.target : m.actual <= m.target;
            return (
              <div key={m.metric}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{m.metric}</span><span className={isOnTarget ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{m.actual}{m.unit} (Target: {m.target}{m.unit})</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${isOnTarget ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min((m.actual / m.target) * 100, 100)}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-4">Antibiotic Resistance Patterns</h3>
        <div className="space-y-4">
          {RESISTANCE.map(r => (
            <div key={r.organism} className="border rounded p-4">
              <div className="font-bold text-sm mb-2">{r.organism}</div>
              <div className="space-y-2">{r.antibiotics.map(a => (
                <div key={a.name}>
                  <div className="flex justify-between text-xs mb-1"><span>{a.name}</span><span className={a.resistance >= 30 ? 'text-red-600 font-bold' : a.resistance >= 10 ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'}>{a.resistance}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${a.resistance >= 30 ? 'bg-red-500' : a.resistance >= 10 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${a.resistance}%` }} /></div>
                </div>
              ))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
