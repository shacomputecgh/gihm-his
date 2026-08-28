import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface NDSRRecord {
  id: string; babyName: string; gestationalAge: string; birthWeight: string;
  dateOfDeath: string; ageAtDeath: string; causeOfDeath: string;
  avoidable: string; status: 'Reviewed' | 'Pending Review';
  recommendations: string[];
}

const NDSR_RECORDS: NDSRRecord[] = [
  { id: 'NDSR-001', babyName: 'Baby Girl Mensah', gestationalAge: '28 weeks', birthWeight: '1.1 kg', dateOfDeath: '2026-08-20', ageAtDeath: '3 days', causeOfDeath: 'Respiratory Distress Syndrome', avoidable: 'Partly avoidable', status: 'Reviewed', recommendations: ['Ensure surfactant availability', 'Improve kangaroo mother care', 'Antenatal steroid administration'] },
  { id: 'NDSR-002', babyName: 'Baby Boy Osei', gestationalAge: '32 weeks', birthWeight: '1.8 kg', dateOfDeath: '2026-08-18', ageAtDeath: '7 days', causeOfDeath: 'Neonatal Sepsis', avoidable: 'Avoidable', status: 'Reviewed', recommendations: ['Improve hand hygiene compliance', 'Early recognition of sepsis signs', 'Timely antibiotic administration'] },
  { id: 'NDSR-003', babyName: 'Baby Girl Boateng', gestationalAge: '36 weeks', birthWeight: '2.5 kg', dateOfDeath: '2026-08-22', ageAtDeath: '1 day', causeOfDeath: 'Birth Asphyxia', avoidable: 'Partly avoidable', status: 'Pending Review', recommendations: [] },
];

const STATUS_COLORS: Record<string, string> = { Reviewed: 'bg-green-100 text-green-800', 'Pending Review': 'bg-yellow-100 text-yellow-800' };

export default function NeonatalDeathSurveillance() {
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
          title="Add New Default"
          fields={[{"name": "name", "label": "Name", "type": "text", "placeholder": "Enter name", "required": true}, {"name": "description", "label": "Description", "type": "text", "placeholder": "Enter description"}, {"name": "status", "label": "Status", "type": "select", "options": ["Active", "Inactive", "Pending"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Neonatal Death Surveillance (NDSR)</h1><p className="text-gray-500">Neonatal mortality review, preventability assessment, and quality improvement</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Deaths', value: NDSR_RECORDS.length, color: 'text-red-600' }, { label: 'Reviewed', value: NDSR_RECORDS.filter(r => r.status === 'Reviewed').length, color: 'text-green-600' }, { label: 'Avoidable', value: NDSR_RECORDS.filter(r => r.avoidable.includes('Avoidable')).length, color: 'text-yellow-600' }, { label: 'Pending', value: NDSR_RECORDS.filter(r => r.status === 'Pending Review').length, color: 'text-blue-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {NDSR_RECORDS.map(r => (
          <div key={r.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.babyName}</span></div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div><span className="text-gray-500">Cause:</span> <span className="font-medium text-red-600">{r.causeOfDeath}</span></div>
              <div><span className="text-gray-500">Date of Death:</span> {r.dateOfDeath}</div>
              <div><span className="text-gray-500">Gestational Age:</span> {r.gestationalAge}</div>
              <div><span className="text-gray-500">Birth Weight:</span> {r.birthWeight}</div>
              <div><span className="text-gray-500">Age at Death:</span> {r.ageAtDeath}</div>
              <div><span className="text-gray-500">Avoidability:</span> <span className={`font-medium ${r.avoidable.includes('Avoidable') ? 'text-yellow-600' : 'text-gray-600'}`}>{r.avoidable}</span></div>
            </div>
            {r.recommendations.length > 0 && <div><h4 className="font-semibold text-sm mb-1">Recommendations</h4><div className="space-y-1">{r.recommendations.map((rec, i) => <div key={i} className="text-sm bg-blue-50 border border-blue-200 rounded p-2">• {rec}</div>)}</div></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
