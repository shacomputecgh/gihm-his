import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type TriageCategory = 'resuscitation' | 'emergent' | 'urgent' | 'less_urgent' | 'non_urgent';
type EDStatus = 'waiting' | 'triaged' | 'in_consultation' | 'treatment' | 'observation' | 'admitted' | 'discharged' | 'transferred';

interface EDPatient {
  id: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  arrivalTime: string;
  arrivalMode: 'ambulance' | 'walk_in' | 'referral';
  chiefComplaint: string;
  triageCategory: TriageCategory;
  status: EDStatus;
  assignedDoctor: string;
  assignedNurse: string;
  bedNumber?: string;
  waitTime: number;
  vitals?: {
    bp: string;
    pulse: number;
    temp: number;
    rr: number;
    spo2: number;
    gcs: number;
  };
  allergies: string[];
  notes?: string;
}

const TRIAGE_CONFIG: Record<TriageCategory, { label: string; color: string; bg: string; icon: string; targetTime: string }> = {
  resuscitation: { label: 'Resuscitation', color: 'text-white', bg: 'bg-red-600', icon: '🔴', targetTime: 'Immediate' },
  emergent: { label: 'Emergent', color: 'text-white', bg: 'bg-red-500', icon: '🟠', targetTime: '< 10 min' },
  urgent: { label: 'Urgent', color: 'text-white', bg: 'bg-orange-500', icon: '🟡', targetTime: '< 30 min' },
  less_urgent: { label: 'Less Urgent', color: 'text-white', bg: 'bg-amber-500', icon: '🟢', targetTime: '< 60 min' },
  non_urgent: { label: 'Non-Urgent', color: 'text-white', bg: 'bg-green-500', icon: '🔵', targetTime: '< 120 min' }
};

const STATUS_CONFIG: Record<EDStatus, { label: string; color: string; bg: string }> = {
  waiting: { label: 'Waiting', color: 'text-amber-600', bg: 'bg-amber-50' },
  triaged: { label: 'Triaged', color: 'text-blue-600', bg: 'bg-blue-50' },
  in_consultation: { label: 'In Consultation', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  treatment: { label: 'Treatment', color: 'text-purple-600', bg: 'bg-purple-50' },
  observation: { label: 'Observation', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  admitted: { label: 'Admitted', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  discharged: { label: 'Discharged', color: 'text-green-600', bg: 'bg-green-50' },
  transferred: { label: 'Transferred', color: 'text-gray-600', bg: 'bg-gray-50' }
};

const ED_PATIENTS: EDPatient[] = [
  {
    id: 'ED001', patientName: 'Kofi Asante', patientId: 'P010', age: 58, gender: 'M',
    arrivalTime: '08:15', arrivalMode: 'ambulance', chiefComplaint: 'Severe chest pain, shortness of breath',
    triageCategory: 'emergent', status: 'treatment', assignedDoctor: 'Dr. Emergency',
    assignedNurse: 'Nurse Critical', bedNumber: 'ED-01', waitTime: 5,
    vitals: { bp: '180/110', pulse: 110, temp: 36.8, rr: 28, spo2: 88, gcs: 14 },
    allergies: ['Aspirin'], notes: 'ECG shows ST elevation. Cardiology on the way.'
  },
  {
    id: 'ED002', patientName: 'Ama Serwaa', patientId: 'P011', age: 35, gender: 'F',
    arrivalTime: '08:45', arrivalMode: 'walk_in', chiefComplaint: 'Severe abdominal pain, vomiting',
    triageCategory: 'urgent', status: 'in_consultation', assignedDoctor: 'Dr. Akua Osei',
    assignedNurse: 'Nurse Ama', bedNumber: 'ED-03', waitTime: 25,
    vitals: { bp: '120/80', pulse: 95, temp: 37.8, rr: 20, spo2: 97, gcs: 15 },
    allergies: [], notes: 'Possible appendicitis. Surgical consult requested.'
  },
  {
    id: 'ED003', patientName: 'Yaw Mensah', patientId: 'P012', age: 8, gender: 'M',
    arrivalTime: '09:00', arrivalMode: 'ambulance', chiefComplaint: 'High fever, seizures',
    triageCategory: 'emergent', status: 'treatment', assignedDoctor: 'Dr. Nana Agyeman',
    assignedNurse: 'Nurse Esi', bedNumber: 'ED-02', waitTime: 3,
    vitals: { bp: '90/60', pulse: 140, temp: 40.2, rr: 35, spo2: 92, gcs: 12 },
    allergies: [], notes: 'Febrile seizure. IV fluids and antipyretics given.'
  },
  {
    id: 'ED004', patientName: 'Efua Adjei', patientId: 'P013', age: 42, gender: 'F',
    arrivalTime: '09:30', arrivalMode: 'walk_in', chiefComplaint: 'Minor cut on hand',
    triageCategory: 'non_urgent', status: 'waiting', assignedDoctor: '',
    assignedNurse: '', waitTime: 45,
    vitals: { bp: '118/76', pulse: 72, temp: 36.6, rr: 16, spo2: 99, gcs: 15 },
    allergies: ['Penicillin']
  },
  {
    id: 'ED005', patientName: 'Nana Kwame', patientId: 'P014', age: 72, gender: 'M',
    arrivalTime: '07:30', arrivalMode: 'ambulance', chiefComplaint: 'Fall, suspected hip fracture',
    triageCategory: 'urgent', status: 'observation', assignedDoctor: 'Dr. Kofi Asante',
    assignedNurse: 'Nurse Kofi', bedNumber: 'ED-05', waitTime: 8,
    vitals: { bp: '140/90', pulse: 88, temp: 36.4, rr: 18, spo2: 95, gcs: 15 },
    allergies: [], notes: 'X-ray confirmed right hip fracture. Waiting for orthopaedic admission.'
  },
  {
    id: 'ED006', patientName: 'Abena Boateng', patientId: 'P015', age: 28, gender: 'F',
    arrivalTime: '09:45', arrivalMode: 'walk_in', chiefComplaint: 'Anxiety attack, hyperventilation',
    triageCategory: 'less_urgent', status: 'observation', assignedDoctor: 'Dr. Akua Osei',
    assignedNurse: 'Nurse Ama', bedNumber: 'ED-07', waitTime: 30,
    vitals: { bp: '130/85', pulse: 110, temp: 36.7, rr: 28, spo2: 98, gcs: 15 },
    allergies: [], notes: 'Calming down with reassurance. Benzodiazepine available if needed.'
  }
];

const BEDS = Array.from({ length: 10 }, (_, i) => `ED-${String(i + 1).padStart(2, '0')}`);

export default function EmergencyDepartment() {
  const [activeTab, setActiveTab] = useState<'overview' | 'triage' | 'beds' | 'analytics'>('overview');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const stats = {
    total: ED_PATIENTS.length,
    waiting: ED_PATIENTS.filter(p => p.status === 'waiting').length,
    inTreatment: ED_PATIENTS.filter(p => p.status === 'treatment' || p.status === 'in_consultation').length,
    critical: ED_PATIENTS.filter(p => p.triageCategory === 'resuscitation' || p.triageCategory === 'emergent').length,
    avgWait: Math.round(ED_PATIENTS.reduce((sum, p) => sum + p.waitTime, 0) / ED_PATIENTS.length)
  };

  

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
          title="Add New Emergency Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"esiLevel","label":"ESI Level","type":"select","options":["Level 1 - Resuscitation","Level 2 - Emergent","Level 3 - Urgent","Level 4 - Less Urgent","Level 5 - Non-Urgent"],"required":true},{"name":"complaint","label":"Chief Complaint","type":"text","required":true},{"name":"arrivalMode","label":"Arrival Mode","type":"select","options":["Walk-in","Ambulance","Police","Self","Referral"]},{"name":"vitals","label":"Initial Vitals","type":"text","placeholder":"BP, HR, Temp, SpO2"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emergency Department</h1>
          <p className="text-gray-500">ED triage, patient tracking, and bed management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {}} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">🚨 Quick Register</button>
          <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">📊 ED Report</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'In ED', value: stats.total, color: 'bg-blue-500' },
          { label: 'Waiting', value: stats.waiting, color: 'bg-amber-500' },
          { label: 'In Treatment', value: stats.inTreatment, color: 'bg-purple-500' },
          { label: 'Critical', value: stats.critical, color: 'bg-red-500' },
          { label: 'Avg Wait (min)', value: stats.avgWait, color: 'bg-indigo-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'triage', 'beds', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'overview' ? 'Overview' : tab === 'triage' ? 'Triage Board' : tab === 'beds' ? 'Bed Status' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Triage Summary */}
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(TRIAGE_CONFIG).map(([cat, config]) => {
              const count = ED_PATIENTS.filter(p => p.triageCategory === cat).length;
              return (
                <div key={cat} className={`${config.bg} ${config.color} p-3 rounded-xl text-center`}>
                  <span className="text-xl">{config.icon}</span>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs opacity-90">{config.label}</p>
                  <p className="text-[10px] opacity-75">{config.targetTime}</p>
                </div>
              );
            })}
          </div>

          {/* Patient List */}
          <div className="space-y-3">
            {ED_PATIENTS.sort((a, b) => {
              const catOrder: Record<TriageCategory, number> = { resuscitation: 0, emergent: 1, urgent: 2, less_urgent: 3, non_urgent: 4 };
              return catOrder[a.triageCategory] - catOrder[b.triageCategory];
            }).map(patient => {
              const triage = TRIAGE_CONFIG[patient.triageCategory];
              const status = STATUS_CONFIG[patient.status];
              return (
                <div key={patient.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedPatient === patient.id ? 'ring-2 ring-blue-300' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedPatient(selectedPatient === patient.id ? null : patient.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${triage.bg} text-white text-xl`}>
                        {triage.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{patient.patientName}</span>
                          <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                          {patient.arrivalMode === 'ambulance' && <Badge className="text-red-600 bg-red-50 border border-red-200">🚑 Ambulance</Badge>}
                        </div>
                        <p className="text-sm text-gray-500">{patient.chiefComplaint}</p>
                        <p className="text-xs text-gray-400">Age: {patient.age} | {patient.gender} | Arrived: {patient.arrivalTime} | Wait: {patient.waitTime} min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {patient.bedNumber && <p className="text-sm font-bold text-gray-700">🛏️ {patient.bedNumber}</p>}
                      {patient.assignedDoctor && <p className="text-xs text-gray-500">{patient.assignedDoctor}</p>}
                    </div>
                  </div>

                  {selectedPatient === patient.id && patient.vitals && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-6 gap-3">
                        {[
                          { label: 'BP', value: patient.vitals.bp, unit: 'mmHg', color: 'text-red-600' },
                          { label: 'Pulse', value: patient.vitals.pulse, unit: '/min', color: 'text-blue-600' },
                          { label: 'Temp', value: patient.vitals.temp, unit: '°C', color: patient.vitals.temp > 37.5 ? 'text-red-600' : 'text-emerald-600' },
                          { label: 'RR', value: patient.vitals.rr, unit: '/min', color: 'text-purple-600' },
                          { label: 'SpO2', value: patient.vitals.spo2, unit: '%', color: patient.vitals.spo2 < 95 ? 'text-red-600' : 'text-emerald-600' },
                          { label: 'GCS', value: patient.vitals.gcs, unit: '/15', color: patient.vitals.gcs < 14 ? 'text-red-600' : 'text-emerald-600' }
                        ].map(v => (
                          <div key={v.label} className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">{v.label}</p>
                            <p className={`text-lg font-bold ${v.color}`}>{v.value}</p>
                            <p className="text-[10px] text-gray-400">{v.unit}</p>
                          </div>
                        ))}
                      </div>
                      {patient.allergies.length > 0 && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-bold text-red-600">⚠️ Allergies: {patient.allergies.join(', ')}</p>
                        </div>
                      )}
                      {patient.notes && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-600">{patient.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Triage Board Tab */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Triage Board</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(TRIAGE_CONFIG).map(([cat, config]) => {
              const patients = ED_PATIENTS.filter(p => p.triageCategory === cat);
              return (
                <div key={cat} className="space-y-3">
                  <div className={`${config.bg} ${config.color} p-3 rounded-xl text-center`}>
                    <p className="text-xl">{config.icon}</p>
                    <p className="font-bold">{config.label}</p>
                    <p className="text-xs opacity-90">{config.targetTime}</p>
                    <p className="text-2xl font-bold">{patients.length}</p>
                  </div>
                  {patients.map(p => {
                    const status = STATUS_CONFIG[p.status];
                    return (
                      <div key={p.id} className={`border rounded-lg p-3 ${status.bg}`}>
                        <p className="font-bold text-sm">{p.patientName}</p>
                        <p className="text-xs text-gray-500">{p.chiefComplaint.substring(0, 30)}...</p>
                        <Badge className={`${status.color} bg-white border text-xs mt-1`}>{status.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Beds Tab */}
      {activeTab === 'beds' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">ED Bed Status</h3>
          <div className="grid grid-cols-5 gap-3">
            {BEDS.map(bed => {
              const patient = ED_PATIENTS.find(p => p.bedNumber === bed);
              const isOccupied = !!patient;
              return (
                <div key={bed} className={`p-4 rounded-xl border-2 text-center ${
                  isOccupied ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'
                }`}>
                  <p className="font-bold text-lg">{bed}</p>
                  {isOccupied ? (
                    <>
                      <p className="text-sm font-medium text-red-600">{patient.patientName}</p>
                      <p className="text-xs text-gray-500">{patient.chiefComplaint.substring(0, 20)}...</p>
                    </>
                  ) : (
                    <p className="text-sm text-emerald-600">Available</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Arrival Mode</h4>
            <div className="space-y-3">
              {(['ambulance', 'walk_in', 'referral'] as const).map(mode => {
                const count = ED_PATIENTS.filter(p => p.arrivalMode === mode).length;
                return (
                  <div key={mode} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{mode.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                      </div>
                      <span className="font-bold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Top Complaints</h4>
            <div className="space-y-3">
              {Object.entries(ED_PATIENTS.reduce<Record<string, number>>((acc, p) => {
                const key = p.chiefComplaint.split(',')[0] ?? 'Unknown';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {})).map(([complaint, count]) => (
                <div key={complaint} className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">{complaint}</span>
                  <Badge className="bg-blue-50 text-blue-600">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Wait Time by Category</h4>
            <div className="space-y-3">
              {Object.entries(TRIAGE_CONFIG).map(([cat, config]) => {
                const patients = ED_PATIENTS.filter(p => p.triageCategory === cat);
                const avgWait = patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.waitTime, 0) / patients.length) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-600">{config.icon} {config.label}</span>
                    <span className="font-bold">{avgWait} min</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">ED Occupancy</h4>
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">{ED_PATIENTS.length}/{BEDS.length}</p>
                <p className="text-gray-500">Beds Occupied</p>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-4 bg-blue-500 rounded-full" style={{ width: `${(ED_PATIENTS.length / BEDS.length) * 100}%` }} />
              </div>
              <p className="text-sm text-gray-500 text-center">{((ED_PATIENTS.length / BEDS.length) * 100).toFixed(0)}% Occupied</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
