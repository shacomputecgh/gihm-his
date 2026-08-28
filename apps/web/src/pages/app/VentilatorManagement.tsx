import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface VentilatedPatient {
  id: string; patientName: string; mrn: string; age: number;
  diagnosis: string; ventilatorType: string;
  mode: string; fio2: number; peep: number; pressure: number; rate: number; tidalVolume: number;
  spO2: number; lastAbg: string;
  duration: string; startDate: string;
  weaningProtocol: string; weaningDay: number;
  status: 'Full Ventilation' | 'Weaning' | 'Trial Off' | 'Extubated';
  complications: string[];
}

const INITIAL: VentilatedPatient[] = [
  { id: 'V-001', patientName: 'Abena Osei', mrn: 'MRN-2026-010', age: 48, diagnosis: 'Sepsis with ARDS', ventilatorType: 'Hamilton G5', mode: 'SIMV', fio2: 60, peep: 10, pressure: 18, rate: 14, tidalVolume: 420, spO2: 94, lastAbg: 'pH 7.32, pCO2 42, pO2 68, HCO3 21, BE -4', duration: '5 days', startDate: '2026-08-21', weaningProtocol: 'Not yet — still on full support', weaningDay: 0, status: 'Full Ventilation', complications: ['Ventilator-associated pneumonia — treated'] },
  { id: 'V-002', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', age: 65, diagnosis: 'Post-operative respiratory failure', ventilatorType: 'Dräger V500', mode: 'PSV', fio2: 35, peep: 5, pressure: 12, rate: 0, tidalVolume: 480, spO2: 97, lastAbg: 'pH 7.38, pCO2 38, pO2 82, HCO3 24, BE 0', duration: '2 days', startDate: '2026-08-23', weaningProtocol: 'Spontaneous breathing trial today', weaningDay: 2, status: 'Weaning', complications: [] },
];

const MODES = ['CMV', 'SIMV', 'PSV', 'CPAP', 'APRV', 'HFOV', 'NIV'];
const STATUS_CONFIG: Record<string, { tone: 'red' | 'gold' | 'blue' | 'green' }> = {
  'Full Ventilation': { tone: 'red' }, Weaning: { tone: 'gold' }, 'Trial Off': { tone: 'blue' }, Extubated: { tone: 'green' },
};

export default function VentilatorManagement() {
  const [patients] = useState<VentilatedPatient[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const weaning = patients.filter((p) => p.status === 'Weaning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Ventilator Management</h1><p className="text-gray-500">Ventilated patient monitoring, ventilator settings, and weaning protocols</p></div>
        <Button onClick={() => setShowForm(true)}>+ Add Patient</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{patients.length}</div><div className="text-xs text-gray-500">Ventilated</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{patients.filter((p) => p.status === 'Full Ventilation').length}</div><div className="text-xs text-gray-500">Full Support</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{weaning}</div><div className="text-xs text-gray-500">Weaning</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{patients.filter((p) => p.complications.length === 0).length}</div><div className="text-xs text-gray-500">No Complications</div></Card>
      </div>
      <div className="space-y-4">
        {patients.map((p) => (
          <Card key={p.id} className={`p-4 ${p.status === 'Full Ventilation' ? 'border-red-200' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{p.patientName}</span>
                  <span className="text-sm text-gray-400">{p.mrn} · Age {p.age}</span>
                  <Badge tone={STATUS_CONFIG[p.status]?.tone}>{p.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">{p.diagnosis} · {p.ventilatorType} · Duration: {p.duration}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-sm bg-gray-50 rounded-lg p-3 mb-2">
              <div><span className="text-gray-500 text-xs">Mode</span><div className="font-medium">{p.mode}</div></div>
              <div><span className="text-gray-500 text-xs">FiO₂</span><div className="font-medium">{p.fio2}%</div></div>
              <div><span className="text-gray-500 text-xs">PEEP</span><div className="font-medium">{p.peep} cmH₂O</div></div>
              <div><span className="text-gray-500 text-xs">Rate</span><div className="font-medium">{p.rate}/min</div></div>
              <div><span className="text-gray-500 text-xs">SpO₂</span><div className={`font-bold ${p.spO2 < 94 ? 'text-red-600' : 'text-green-600'}`}>{p.spO2}%</div></div>
            </div>
            <div className="text-xs bg-white p-2 rounded border mb-2"><strong>ABG:</strong> {p.lastAbg}</div>
            <div className="text-xs text-gray-500"><strong>Weaning:</strong> {p.weaningProtocol} {p.weaningDay > 0 ? `(Day ${p.weaningDay})` : ''}</div>
            {p.complications.length > 0 && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-600">
                ⚠️ {p.complications.join(' · ')}
              </div>
            )}
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Add Ventilated Patient</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Ventilator Type *</label><Input placeholder="e.g. Hamilton G5" /></div>
                <div><label className="block text-sm mb-1">Mode *</label><Select>{MODES.map((m) => <option key={m}>{m}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">FiO₂ (%) *</label><Input type="number" min="21" max="100" /></div>
                <div><label className="block text-sm mb-1">PEEP *</label><Input type="number" step="0.5" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Patient added to ventilator'); }}>Add Patient</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
