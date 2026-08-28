import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface ICUPatient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  sex: string;
  admissionDate: string;
  diagnosis: string;
  consultant: string;
  nurse: string;
  bed: string;
  ventilator: boolean;
  vasopressor: boolean;
  sedation: string;
  gcs: number;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  spO2: number;
  urineOutput: string;
  bloodGlucose: string;
  capillaryRefill: string;
  painScore: number;
  threatLevel: 'Critical' | 'Stable' | 'Improving' | 'Deteriorating';
  daysAdmitted: number;
  acuityScore: number;
  isolationPrecautions: string;
  nextReview: string;
}

const SAMPLE_PATIENTS: ICUPatient[] = [
  { id: 'ICU-001', name: 'Kwame Asante', mrn: 'MRN-2024-0156', age: 67, sex: 'M', admissionDate: '2024-01-10', diagnosis: 'Septic Shock secondary to UTI', consultant: 'Dr. Mensah', nurse: 'Sr. Boateng', bed: 'ICU-A1', ventilator: true, vasopressor: true, sedation: 'Propofol + Fentanyl', gcs: 6, temperature: 38.9, heartRate: 128, bloodPressure: '82/48', respiratoryRate: 24, spO2: 94, urineOutput: '15 ml/hr', bloodGlucose: '12.4 mmol/L', capillaryRefill: '4 sec', painScore: 2, threatLevel: 'Critical', daysAdmitted: 6, acuityScore: 18, isolationPrecautions: 'Contact', nextReview: '14:00' },
  { id: 'ICU-002', name: 'Ama Darko', mrn: 'MRN-2024-0178', age: 45, sex: 'F', admissionDate: '2024-01-13', diagnosis: 'Post-op CABG', consultant: 'Dr. Ansah', nurse: 'Sr. Osei', bed: 'ICU-A2', ventilator: false, vasopressor: false, sedation: 'None', gcs: 15, temperature: 36.8, heartRate: 82, bloodPressure: '118/72', respiratoryRate: 16, spO2: 98, urineOutput: '60 ml/hr', bloodGlucose: '6.2 mmol/L', capillaryRefill: '2 sec', painScore: 3, threatLevel: 'Improving', daysAdmitted: 3, acuityScore: 8, isolationPrecautions: 'Standard', nextReview: '16:00' },
  { id: 'ICU-003', name: 'Kofi Tetteh', mrn: 'MRN-2024-0190', age: 72, sex: 'M', admissionDate: '2024-01-14', diagnosis: 'Acute MI with Cardiogenic Shock', consultant: 'Dr. Koomson', nurse: 'Sr. Adjei', bed: 'ICU-B1', ventilator: true, vasopressor: true, sedation: 'Midazolam', gcs: 8, temperature: 36.2, heartRate: 110, bloodPressure: '78/42', respiratoryRate: 22, spO2: 91, urineOutput: '10 ml/hr', bloodGlucose: '8.8 mmol/L', capillaryRefill: '5 sec', painScore: 4, threatLevel: 'Critical', daysAdmitted: 2, acuityScore: 16, isolationPrecautions: 'Standard', nextReview: '13:00' },
];

const THREAT_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-300',
  Deteriorating: 'bg-orange-100 text-orange-800 border-orange-300',
  Stable: 'bg-green-100 text-green-800 border-green-300',
  Improving: 'bg-blue-100 text-blue-800 border-blue-300',
};

export default function ICUMonitoringEnhanced() {
  const [patients] = useState<ICUPatient[]>(SAMPLE_PATIENTS);
  const [selected, setSelected] = useState<ICUPatient | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const critical = patients.filter(p => p.threatLevel === 'Critical');
  const totalBeds = 12;
  const occupiedBeds = patients.length;
  const ventilatorCount = patients.filter(p => p.ventilator).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ICU Monitoring</h1>
          <p className="text-slate-500">Real-time intensive care unit patient monitoring and alerts</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" className="h-4 w-4" /> Admit to ICU</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Bed Occupancy</p>
          <p className="text-2xl font-bold">{occupiedBeds}/{totalBeds}</p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(occupiedBeds / totalBeds) * 100}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Critical</p>
          <p className="text-2xl font-bold text-red-600">{critical.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Ventilators</p>
          <p className="text-2xl font-bold text-orange-600">{ventilatorCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Vasopressors</p>
          <p className="text-2xl font-bold text-purple-600">{patients.filter(p => p.vasopressor).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Avg Acuity</p>
          <p className="text-2xl font-bold">{(patients.reduce((s, p) => s + p.acuityScore, 0) / patients.length).toFixed(0)}</p>
        </Card>
      </div>

      {/* Bed Map */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">ICU Bed Map</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: totalBeds }).map((_, i) => {
            const patient = patients[i];
            return (
              <div key={i} className={`p-3 rounded-lg text-center text-xs border-2 ${
                patient ? (patient.threatLevel === 'Critical' ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50') : 'border-slate-200 bg-slate-50'
              }`}>
                <p className="font-bold">{`ICU-${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`}</p>
                {patient ? (
                  <>
                    <p className="font-medium truncate">{patient.name.split(' ').pop()}</p>
                    <p className="text-slate-500">{patient.ventilator ? '🫁' : ''} {patient.vasopressor ? '💉' : ''}</p>
                  </>
                ) : (
                  <p className="text-green-600">Available</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Patient List */}
      <h2 className="text-lg font-semibold">Current Patients</h2>
      <div className="space-y-4">
        {patients.map(p => (
          <Card key={p.id} className={`p-4 border-2 cursor-pointer hover:shadow-md ${THREAT_COLORS[p.threatLevel].split(' ').slice(2).join(' ')}`}
            onClick={() => setSelected(p)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.mrn} • {p.bed} • {p.age}y/{p.sex} • Day {p.daysAdmitted}</p>
              </div>
              <Badge className={THREAT_COLORS[p.threatLevel].split(' ').slice(0, 2).join(' ')}>{p.threatLevel}</Badge>
            </div>
            <p className="text-sm mb-3"><strong>Diagnosis:</strong> {p.diagnosis}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
              <div className={`rounded p-2 ${p.gcs <= 8 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <p className="text-xs text-slate-500">GCS</p>
                <p className="font-bold text-sm">{p.gcs}</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">HR</p>
                <p className={`font-bold text-sm ${p.heartRate > 120 ? 'text-red-600' : ''}`}>{p.heartRate}</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">BP</p>
                <p className={`font-bold text-sm ${parseInt(p.bloodPressure) < 90 ? 'text-red-600' : ''}`}>{p.bloodPressure}</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">SpO₂</p>
                <p className={`font-bold text-sm ${p.spO2 < 94 ? 'text-red-600' : 'text-green-600'}`}>{p.spO2}%</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">Temp</p>
                <p className={`font-bold text-sm ${p.temperature > 37.5 ? 'text-red-600' : ''}`}>{p.temperature}°C</p>
              </div>
              <div className="bg-slate-100 rounded p-2">
                <p className="text-xs text-slate-500">Urine</p>
                <p className={`font-bold text-sm ${parseInt(p.urineOutput) < 30 ? 'text-red-600' : ''}`}>{p.urineOutput}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs flex-wrap">
              {p.ventilator && <Badge className="bg-orange-100 text-orange-700">🫁 Ventilated</Badge>}
              {p.vasopressor && <Badge className="bg-purple-100 text-purple-700">💉 Vasopressor</Badge>}
              {p.sedation !== 'None' && <Badge className="bg-blue-100 text-blue-700">💊 {p.sedation}</Badge>}
              {p.isolationPrecautions !== 'Standard' && <Badge className="bg-red-100 text-red-700">⚠️ {p.isolationPrecautions}</Badge>}
              <Badge className="bg-slate-100 text-slate-700">Next Review: {p.nextReview}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-500">Bed:</span> <strong>{selected.bed}</strong></div>
                <div><span className="text-slate-500">Diagnosis:</span> <strong>{selected.diagnosis}</strong></div>
                <div><span className="text-slate-500">Consultant:</span> <strong>{selected.consultant}</strong></div>
                <div><span className="text-slate-500">Nurse:</span> <strong>{selected.nurse}</strong></div>
                <div><span className="text-slate-500">GCS:</span> <strong>{selected.gcs}/15</strong></div>
                <div><span className="text-slate-500">Acuity:</span> <strong>{selected.acuityScore}/20</strong></div>
                <div><span className="text-slate-500">Blood Glucose:</span> <strong>{selected.bloodGlucose}</strong></div>
                <div><span className="text-slate-500">Capillary Refill:</span> <strong>{selected.capillaryRefill}</strong></div>
                <div><span className="text-slate-500">Pain Score:</span> <strong>{selected.painScore}/10</strong></div>
                <div><span className="text-slate-500">Respiratory Rate:</span> <strong>{selected.respiratoryRate}/min</strong></div>
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
              <h2 className="text-xl font-bold">Admit to ICU</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Patient Name</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">MRN</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Diagnosis</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Consultant</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Ventilator Required</label><select className="w-full border rounded-lg px-3 py-2"><option>No</option><option>Yes</option></select></div>
              <div><label className="block text-slate-600 mb-1">Isolation Precautions</label><select className="w-full border rounded-lg px-3 py-2"><option>Standard</option><option>Contact</option><option>Droplet</option><option>Airborne</option></select></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Clinical Notes</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Admit Patient</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
