import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface BedPatient {
  bed: string; patientName: string; mrn: string; age: number; sex: string;
  diagnosis: string; doctor: string; admissionDate: string;
  allergies: string[]; nilByMouth: boolean; dripsRunning: boolean; drain: boolean;
  nextMed: string; nextMedTime: string; obsDue: string; pendingResults: string[];
  riskScore: string;
}

const WARDS_DATA: Record<string, BedPatient[]> = {
  'Medical Ward': [
    { bed: 'MW-01', patientName: 'Kwame Mensah', mrn: 'MRN-001', age: 62, sex: 'M', diagnosis: 'Pneumonia', doctor: 'Dr. Osei', admissionDate: '2026-08-20', allergies: ['Penicillin'], nilByMouth: false, dripsRunning: false, drain: false, nextMed: 'Amoxicillin', nextMedTime: '14:00', obsDue: '14:00', pendingResults: ['Blood Culture'], riskScore: 'Moderate' },
    { bed: 'MW-02', patientName: 'Akua Asare', mrn: 'MRN-002', age: 55, sex: 'F', diagnosis: 'DKA', doctor: 'Dr. Osei', admissionDate: '2026-08-22', allergies: [], nilByMouth: false, dripsRunning: true, drain: false, nextMed: 'Insulin', nextMedTime: '12:00', obsDue: '12:00', pendingResults: ['Electrolytes'], riskScore: 'High' },
    { bed: 'MW-03', patientName: '', mrn: '', age: 0, sex: '', diagnosis: '', doctor: '', admissionDate: '', allergies: [], nilByMouth: false, dripsRunning: false, drain: false, nextMed: '', nextMedTime: '', obsDue: '', pendingResults: [], riskScore: '' },
  ],
  'Surgical Ward': [
    { bed: 'SW-01', patientName: 'Yaw Asare', mrn: 'MRN-042', age: 45, sex: 'M', diagnosis: 'Post-Appendectomy', doctor: 'Dr. Boateng', admissionDate: '2026-08-23', allergies: [], nilByMouth: false, dripsRunning: false, drain: true, nextMed: 'Paracetamol', nextMedTime: '16:00', obsDue: '14:00', pendingResults: [], riskScore: 'Low' },
  ],
  'ICU': [
    { bed: 'ICU-01', patientName: 'Abena Osei', mrn: 'MRN-010', age: 48, sex: 'F', diagnosis: 'Sepsis', doctor: 'Dr. Agyemang', admissionDate: '2026-08-21', allergies: ['Sulphonamides'], nilByMouth: true, dripsRunning: true, drain: true, nextMed: 'Tazocin', nextMedTime: '12:00', obsDue: '12:00', pendingResults: ['Blood Culture'], riskScore: 'Very High' },
  ],
};

const RISK_COLORS: Record<string, string> = { Low: 'bg-green-100 text-green-800', Moderate: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', 'Very High': 'bg-red-100 text-red-800' };

export default function WardBoard() {
  const [selectedWard, setSelectedWard] = useState('Medical Ward');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const toast = useToast();
  const beds = WARDS_DATA[selectedWard] || [];
  const occupied = beds.filter((b) => b.patientName).length;
  const alerts = beds.filter((b) => b.riskScore === 'High' || b.riskScore === 'Very High').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Ward Board</h1><p className="text-gray-500">Real-time ward view — patients, beds, medications, and nursing tasks</p></div>
        <Button onClick={() => setShowAddPatient(true)}>+ Admit Patient</Button>
      </div>
      <div className="flex gap-2">
        {Object.keys(WARDS_DATA).map((w) => (
          <button key={w} onClick={() => setSelectedWard(w)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedWard === w ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{w}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{beds.length}</div><div className="text-xs text-gray-500">Total Beds</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{occupied}</div><div className="text-xs text-gray-500">Occupied</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-gray-600">{beds.length - occupied}</div><div className="text-xs text-gray-500">Available</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{alerts}</div><div className="text-xs text-gray-500">High Risk</div></Card>
      </div>
      <div className="grid gap-3">
        {beds.map((b, i) => (
          <Card key={i} className={`p-4 ${!b.patientName ? 'bg-gray-50 border-dashed' : (b.riskScore === 'High' || b.riskScore === 'Very High') ? 'border-red-200 bg-red-50' : ''}`}>
            {!b.patientName ? (
              <div className="text-center text-gray-400 py-4">
                <div className="text-lg font-bold">{b.bed}</div>
                <div className="text-sm">Empty — Available</div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{b.bed}</span>
                      <span className="font-semibold">{b.patientName}</span>
                      <span className="text-sm text-gray-400">{b.mrn} · {b.age}{b.sex}</span>
                      {b.riskScore && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[b.riskScore]}`}>{b.riskScore} Risk</span>}
                    </div>
                    <div className="text-sm text-gray-600">{b.diagnosis} · Admitted {b.admissionDate} · {b.doctor}</div>
                  </div>
                  <div className="flex gap-1">
                    {b.nilByMouth && <Badge tone="red">NBM</Badge>}
                    {b.dripsRunning && <Badge tone="blue">IV Drip</Badge>}
                    {b.drain && <Badge tone="gold">Drain</Badge>}
                    {b.allergies.length > 0 && <Badge tone="red">⚠️ {b.allergies.join(', ')}</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs bg-white p-2 rounded-lg border">
                  <div><span className="text-gray-500">Next Med:</span> <span className="font-medium">{b.nextMed} {b.nextMedTime}</span></div>
                  <div><span className="text-gray-500">Obs Due:</span> <span className="font-medium">{b.obsDue}</span></div>
                  <div><span className="text-gray-500">Pending:</span> <span className="font-medium">{b.pendingResults.length > 0 ? b.pendingResults.join(', ') : 'None'}</span></div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddPatient(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAddPatient(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Admit Patient to {selectedWard}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Bed *</label><Select>{beds.filter((b) => !b.patientName).map((b) => <option key={b.bed}>{b.bed}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Diagnosis *</label><Input placeholder="Primary diagnosis" /></div>
                <div><label className="block text-sm mb-1">Age</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Sex</label><Select><option>M</option><option>F</option></Select></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddPatient(false)}>Cancel</Button><Button onClick={() => { setShowAddPatient(false); toast('Patient admitted'); }}>Admit Patient</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
