import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface NICUPatient {
  id: string; babyName: string; mrn: string; gestationalAge: string; birthWeight: number;
  currentWeight: number; sex: string; motherName: string; motherMRN: string;
  diagnosis: string; admissionDate: string; ventilator: boolean; phototherapy: boolean;
  incubatorTemp: number; feedType: string; feedVolume: number; feedFrequency: string;
  status: 'Critical' | 'Stable' | 'Improving' | 'Ready to Discharge';
  alerts: string[];
}

const INITIAL: NICUPatient[] = [
  { id: 'NICU-001', babyName: 'Baby Adjei (M)', mrn: 'NICU-M-001', gestationalAge: '28 weeks', birthWeight: 1.1, currentWeight: 1.35, sex: 'M', motherName: 'Ama Adjei', motherMRN: 'MRN-2026-080', diagnosis: 'Extreme prematurity, RDS', admissionDate: '2026-08-10', ventilator: true, phototherapy: false, incubatorTemp: 36.5, feedType: 'Expressed breast milk', feedVolume: 15, feedFrequency: '3-hourly', status: 'Improving', alerts: ['On CPAP — weaning trial tomorrow'] },
  { id: 'NICU-002', babyName: 'Baby Osei (F)', mrn: 'NICU-F-001', gestationalAge: '32 weeks', birthWeight: 1.65, currentWeight: 1.82, sex: 'F', motherName: 'Efua Osei', motherMRN: 'MRN-2026-081', diagnosis: 'Prematurity, Jaundice', admissionDate: '2026-08-15', ventilator: false, phototherapy: true, incubatorTemp: 36.8, feedType: 'Mixed (EBM + formula)', feedVolume: 25, feedFrequency: '3-hourly', status: 'Stable', alerts: ['Bilirubin 245 — continue phototherapy'] },
  { id: 'NICU-003', babyName: 'Baby Mensah (M)', mrn: 'NICU-M-002', gestationalAge: '36 weeks', birthWeight: 2.4, currentWeight: 2.65, sex: 'M', motherName: 'Akua Mensah', motherMRN: 'MRN-2026-082', diagnosis: 'Late preterm, Hypoglycaemia', admissionDate: '2026-08-22', ventilator: false, phototherapy: false, incubatorTemp: 36.7, feedType: 'Formula', feedVolume: 45, feedFrequency: '3-hourly', status: 'Ready to Discharge', alerts: [] },
];

const STATUS_CONFIG: Record<string, { color: string; tone: 'red' | 'gold' | 'green' | 'blue' }> = {
  Critical: { color: 'bg-red-100 text-red-800', tone: 'red' }, Stable: { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Improving: { color: 'bg-blue-100 text-blue-800', tone: 'blue' }, 'Ready to Discharge': { color: 'bg-green-100 text-green-800', tone: 'green' },
};

export default function NeonatalIntensiveCare() {
  const [patients] = useState<NICUPatient[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const critical = patients.filter((p) => p.status === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">NICU — Neonatal Intensive Care</h1><p className="text-gray-500">Premature and sick neonate monitoring, feeding, ventilation, and developmental care</p></div>
        <Button onClick={() => setShowForm(true)}>+ Admit Neonate</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{patients.length}</div><div className="text-xs text-gray-500">Total Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{critical}</div><div className="text-xs text-gray-500">Critical</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{patients.filter((p) => p.ventilator).length}</div><div className="text-xs text-gray-500">On Ventilator</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{patients.filter((p) => p.status === 'Ready to Discharge').length}</div><div className="text-xs text-gray-500">Ready to Discharge</div></Card>
      </div>
      <div className="space-y-4">
        {patients.map((p) => (
          <Card key={p.id} className={`p-4 ${p.status === 'Critical' ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">👶 {p.babyName}</span>
                  <span className="text-sm text-gray-400">{p.mrn}</span>
                  <Badge tone={STATUS_CONFIG[p.status]?.tone}>{p.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">GA: {p.gestationalAge} · Birth: {p.birthWeight}kg → Now: {p.currentWeight}kg · {p.diagnosis}</p>
                <p className="text-xs text-gray-500">Mother: {p.motherName} ({p.motherMRN}) · Admitted: {p.admissionDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm bg-white p-3 rounded-lg border">
              <div><span className="text-gray-500 text-xs">Ventilator</span><div className="font-medium">{p.ventilator ? '🔴 YES' : '🟢 No'}</div></div>
              <div><span className="text-gray-500 text-xs">Phototherapy</span><div className="font-medium">{p.phototherapy ? '🟡 Active' : 'No'}</div></div>
              <div><span className="text-gray-500 text-xs">Incubator Temp</span><div className="font-medium">{p.incubatorTemp}°C</div></div>
              <div><span className="text-gray-500 text-xs">Feeds</span><div className="font-medium">{p.feedVolume}ml {p.feedFrequency}</div></div>
              <div><span className="text-gray-500 text-xs">Feed Type</span><div className="font-medium text-xs">{p.feedType}</div></div>
            </div>
            {p.alerts.length > 0 && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                ⚠️ {p.alerts.join(' · ')}
              </div>
            )}
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Admit Neonate to NICU</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Baby Name *</label><Input placeholder="Baby Surname" /></div>
                <div><label className="block text-sm mb-1">Sex *</label><Select><option>M</option><option>F</option></Select></div>
                <div><label className="block text-sm mb-1">Gestational Age *</label><Input placeholder="e.g. 28 weeks" /></div>
                <div><label className="block text-sm mb-1">Birth Weight (kg) *</label><Input type="number" step="0.01" /></div>
                <div><label className="block text-sm mb-1">Mother Name *</label><Input placeholder="Mother's name" /></div>
                <div><label className="block text-sm mb-1">Mother MRN *</label><Input placeholder="MRN" /></div>
              </div>
              <div><label className="block text-sm mb-1">Diagnosis *</label><Input placeholder="Primary diagnosis" /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Neonate admitted to NICU'); }}>Admit</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
