import { useState } from 'react';
import { Badge, Button, Card, Input } from '../../components/ui';

interface JourneyEvent {
  id: string; patientName: string; mrn: string; date: string; time: string;
  department: string; event: string; notes: string; status: 'Completed' | 'Current' | 'Upcoming';
  icon: string;
}

const PATIENTS: Record<string, JourneyEvent[]> = {
  'MRN-2026-001': [
    { id: '1', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-20', time: '09:00', department: 'Registration', event: 'Patient Registration', notes: 'New patient. Ghana Card verified. NHIS active.', status: 'Completed', icon: '📋' },
    { id: '2', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-20', time: '09:30', department: 'OPD', event: 'Consultation', notes: 'Seen by Dr. Osei. Suspected pneumonia. Chest X-ray ordered.', status: 'Completed', icon: '👨‍⚕️' },
    { id: '3', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-20', time: '10:00', department: 'Radiology', event: 'Chest X-Ray', notes: 'Right lower lobe consolidation. Consistent with pneumonia.', status: 'Completed', icon: '🔬' },
    { id: '4', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-20', time: '10:30', department: 'Laboratory', event: 'Blood Tests', notes: 'FBC, CRP, Blood Culture sent. CRP 85 mg/L.', status: 'Completed', icon: '🧪' },
    { id: '5', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-20', time: '11:00', department: 'Pharmacy', event: 'Prescription Dispensed', notes: 'Amoxicillin 500mg TDS, Paracetamol 1g QDS. NHIS covered.', status: 'Completed', icon: '💊' },
    { id: '6', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-20', time: '14:00', department: 'Billing', event: 'Payment Processed', notes: 'NHIS claim filed. Patient co-pay GH₵ 45.00.', status: 'Completed', icon: '💰' },
    { id: '7', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-21', time: '08:00', department: 'Emergency', event: 'Readmission — Worsening', notes: 'Brought back by family. Fever 39.2°C, SpO2 91%. Admitted to Medical Ward.', status: 'Completed', icon: '🚑' },
    { id: '8', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-25', time: '08:00', department: 'Medical Ward', event: 'Inpatient Day 5', notes: 'Improving. Afebrile. SpO2 97% on room air. Plan: Continue antibiotics for 3 more days.', status: 'Current', icon: '🏥' },
    { id: '9', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', date: '2026-08-28', time: '—', department: 'Medical Ward', event: 'Planned Discharge', notes: 'Target discharge. Review bloods and discharge medications.', status: 'Upcoming', icon: '🏠' },
  ],
};

export default function PatientJourneyTracker() {
  const [searchMrn, setSearchMrn] = useState('');
  const [selectedMrn, setSelectedMrn] = useState('MRN-2026-001');
  const events = PATIENTS[selectedMrn] || [];

  const handleSearch = () => {
    if (searchMrn && PATIENTS[searchMrn]) { setSelectedMrn(searchMrn); }
    else if (searchMrn) { setSelectedMrn(searchMrn); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Patient Journey Tracker</h1><p className="text-gray-500">Complete timeline from registration to discharge — every touchpoint visible</p></div>
        <div className="flex gap-2">
          <Input placeholder="Search by MRN..." value={searchMrn} onChange={(e) => setSearchMrn(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-64" />
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>
      {events.length > 0 && (
        <Card className="p-4">
          <div className="mb-4"><h3 className="font-semibold text-lg">{events[0]?.patientName}</h3><p className="text-sm text-gray-500">MRN: {events[0]?.mrn} · Journey: {events[0]?.date} → {events[events.length - 1]?.date}</p></div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {events.map((e) => (
                <div key={e.id} className="flex gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 flex-shrink-0 ${e.status === 'Completed' ? 'bg-green-100 text-green-700' : e.status === 'Current' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : 'bg-gray-100 text-gray-400'}`}>
                    {e.icon}
                  </div>
                  <div className={`flex-1 p-3 rounded-lg border ${e.status === 'Current' ? 'border-blue-200 bg-blue-50' : e.status === 'Upcoming' ? 'border-dashed border-gray-200' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div><span className="font-medium text-sm">{e.event}</span><span className="text-xs text-gray-400 ml-2">{e.department}</span></div>
                      <span className="text-xs text-gray-400">{e.date} {e.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{e.notes}</p>
                    {e.status === 'Current' && <Badge tone="blue">Current</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      {events.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-lg">Search for a patient</h3>
          <p className="text-gray-500">Enter an MRN to view the complete patient journey timeline</p>
          <p className="text-xs text-gray-400 mt-2">Try: MRN-2026-001</p>
        </Card>
      )}
    </div>
  );
}
