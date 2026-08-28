import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface NICUPatient {
  id: string;
  babyName: string;
  motherName: string;
  mrn: string;
  gestationalAge: string;
  birthWeight: number;
  currentWeight: number;
  sex: string;
  admissionDate: string;
  diagnosis: string;
  apgar1: number;
  apgar5: number;
  respiratorySupport: 'Room Air' | 'CPAP' | 'Ventilator' | 'High Flow' | 'Oxygen Hood';
  feedingType: 'Breast Milk' | 'Formula' | 'Mixed' | 'TPN' | 'NPO';
  temperature: number;
  heartRate: number;
  spO2: number;
  phototherapy: boolean;
  incubatorTemp: number;
  isolation: string;
  parentVisits: string;
  assignedNurse: string;
  paediatrician: string;
  status: 'Critical' | 'Stable' | 'Improving' | 'Ready for Discharge';
  daysAdmitted: number;
  weightGain: string;
  lastFeed: string;
}

const SAMPLE_BABIES: NICUPatient[] = [
  { id: 'NICU-001', babyName: 'Baby Mensah', motherName: 'Abena Mensah', mrn: 'MRN-2024-0156', gestationalAge: '28+3', birthWeight: 1100, currentWeight: 1350, sex: 'F', admissionDate: '2024-01-10', diagnosis: 'Extreme prematurity, RDS', apgar1: 3, apgar5: 6, respiratorySupport: 'CPAP', feedingType: 'TPN', temperature: 36.7, heartRate: 152, spO2: 94, phototherapy: false, incubatorTemp: 36.5, isolation: 'Standard', parentVisits: 'Daily 10:00-12:00', assignedNurse: 'Sr. Nursery Asare', paediatrician: 'Dr. Owusu-Mensah', status: 'Stable', daysAdmitted: 6, weightGain: '+25g/day', lastFeed: '08:00' },
  { id: 'NICU-002', babyName: 'Baby Boateng', motherName: 'Akosua Boateng', mrn: 'MRN-2024-0178', gestationalAge: '32+1', birthWeight: 1650, currentWeight: 1800, sex: 'M', admissionDate: '2024-01-13', diagnosis: 'Meconium aspiration, suspected sepsis', apgar1: 5, apgar5: 7, respiratorySupport: 'Oxygen Hood', feedingType: 'Mixed', temperature: 37.0, heartRate: 148, spO2: 96, phototherapy: true, incubatorTemp: 36.8, isolation: 'Contact', parentVisits: 'Daily 11:00-13:00', assignedNurse: 'Sr. Nursery Koomson', paediatrician: 'Dr. Owusu-Mensah', status: 'Improving', daysAdmitted: 3, weightGain: '+30g/day', lastFeed: '09:30' },
  { id: 'NICU-003', babyName: 'Baby Adjei', motherName: 'Efua Adjei', mrn: 'MRN-2024-0192', gestationalAge: '36+5', birthWeight: 2400, currentWeight: 2450, sex: 'F', admissionDate: '2024-01-14', diagnosis: 'Late preterm, hypoglycemia', apgar1: 7, apgar5: 9, respiratorySupport: 'Room Air', feedingType: 'Breast Milk', temperature: 36.9, heartRate: 140, spO2: 98, phototherapy: false, incubatorTemp: 0, isolation: 'Standard', parentVisits: 'Daily', assignedNurse: 'Sr. Nursery Adjei', paediatrician: 'Dr. Owusu-Mensah', status: 'Ready for Discharge', daysAdmitted: 2, weightGain: '+25g/day', lastFeed: '07:30' },
];

const STATUS_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  Stable: 'bg-green-100 text-green-800',
  Improving: 'bg-blue-100 text-blue-800',
  'Ready for Discharge': 'bg-purple-100 text-purple-800',
};

const VENTILATOR_COLORS: Record<string, string> = {
  'Room Air': 'bg-green-100 text-green-700',
  CPAP: 'bg-blue-100 text-blue-700',
  'High Flow': 'bg-yellow-100 text-yellow-700',
  'Oxygen Hood': 'bg-orange-100 text-orange-700',
  Ventilator: 'bg-red-100 text-red-700',
};

export default function NICUTrackingEnhanced() {
  const [babies] = useState<NICUPatient[]>(SAMPLE_BABIES);
  const [selected, setSelected] = useState<NICUPatient | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const critical = babies.filter(b => b.status === 'Critical');
  const phototherapy = babies.filter(b => b.phototherapy);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NICU Tracking</h1>
          <p className="text-slate-500">Neonatal Intensive Care Unit monitoring and management</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" className="h-4 w-4" /> Admit Baby</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Babies</p>
          <p className="text-2xl font-bold">{babies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Critical</p>
          <p className="text-2xl font-bold text-red-600">{critical.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">On Phototherapy</p>
          <p className="text-2xl font-bold text-yellow-600">{phototherapy.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Ventilated</p>
          <p className="text-2xl font-bold text-orange-600">{babies.filter(b => b.respiratorySupport === 'Ventilator').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Ready for DC</p>
          <p className="text-2xl font-bold text-purple-600">{babies.filter(b => b.status === 'Ready for Discharge').length}</p>
        </Card>
      </div>

      {/* Patient Cards */}
      <h2 className="text-lg font-semibold">Current Patients</h2>
      <div className="space-y-4">
        {babies.map(b => (
          <Card key={b.id} className="p-4 cursor-pointer hover:shadow-md" onClick={() => setSelected(b)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{b.babyName}</h3>
                <p className="text-sm text-slate-500">{b.mrn} • {b.sex} • GA: {b.gestationalAge} • Day {b.daysAdmitted}</p>
                <p className="text-xs text-slate-400">Mother: {b.motherName}</p>
              </div>
              <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-sm">
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">Weight</p>
                <p className="font-bold">{b.currentWeight}g</p>
                <p className="text-xs text-green-600">{b.weightGain}</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">SpO₂</p>
                <p className={`font-bold ${b.spO2 < 94 ? 'text-red-600' : 'text-green-600'}`}>{b.spO2}%</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">HR</p>
                <p className="font-bold">{b.heartRate}</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">Temp</p>
                <p className="font-bold">{b.temperature}°C</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">Apgar</p>
                <p className="font-bold">{b.apgar1}/{b.apgar5}</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">Feeding</p>
                <p className="font-bold text-xs">{b.feedingType}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs flex-wrap">
              <Badge className={VENTILATOR_COLORS[b.respiratorySupport]}>{b.respiratorySupport}</Badge>
              {b.phototherapy && <Badge className="bg-yellow-100 text-yellow-700">☀️ Phototherapy</Badge>}
              {b.isolation !== 'Standard' && <Badge className="bg-red-100 text-red-700">⚠️ {b.isolation}</Badge>}
              <Badge className="bg-slate-100 text-slate-600">Last Feed: {b.lastFeed}</Badge>
              <Badge className="bg-slate-100 text-slate-600">Nurse: {b.assignedNurse}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selected.babyName}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-500">MRN:</span> <strong>{selected.mrn}</strong></div>
                <div><span className="text-slate-500">Mother:</span> <strong>{selected.motherName}</strong></div>
                <div><span className="text-slate-500">Gestational Age:</span> <strong>{selected.gestationalAge}</strong></div>
                <div><span className="text-slate-500">Birth Weight:</span> <strong>{selected.birthWeight}g</strong></div>
                <div><span className="text-slate-500">Current Weight:</span> <strong>{selected.currentWeight}g ({selected.weightGain})</strong></div>
                <div><span className="text-slate-500">Diagnosis:</span> <strong>{selected.diagnosis}</strong></div>
                <div><span className="text-slate-500">Respiratory:</span> <strong>{selected.respiratorySupport}</strong></div>
                <div><span className="text-slate-500">Feeding:</span> <strong>{selected.feedingType}</strong></div>
                <div><span className="text-slate-500">Paediatrician:</span> <strong>{selected.paediatrician}</strong></div>
                <div><span className="text-slate-500">Assigned Nurse:</span> <strong>{selected.assignedNurse}</strong></div>
                <div><span className="text-slate-500">Visiting Hours:</span> <strong>{selected.parentVisits}</strong></div>
                <div><span className="text-slate-500">Days Admitted:</span> <strong>{selected.daysAdmitted}</strong></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Close</button>
              <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Update Vitals</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Admit Baby to NICU</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Mother's Name</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">MRN</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Sex</label><select className="w-full border rounded-lg px-3 py-2"><option>Male</option><option>Female</option></select></div>
              <div><label className="block text-slate-600 mb-1">Gestational Age</label><input placeholder="e.g. 32+1" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Birth Weight (g)</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Apgar 1 min</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Apgar 5 min</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Respiratory Support</label><select className="w-full border rounded-lg px-3 py-2"><option>Room Air</option><option>CPAP</option><option>Ventilator</option><option>High Flow</option><option>Oxygen Hood</option></select></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Diagnosis</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Assigned Paediatrician</label><input className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Admit Baby</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
