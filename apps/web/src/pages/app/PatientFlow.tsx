import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type FlowStage = 'registration' | 'triage' | 'consultation' | 'diagnostics' | 'pharmacy' | 'treatment' | 'discharge';
type FlowStatus = 'active' | 'waiting' | 'completed' | 'transferred';

interface PatientJourney {
  id: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  visitDate: string;
  arrivalTime: string;
  currentStage: FlowStage;
  status: FlowStatus;
  stages: StageRecord[];
  totalTime: number;
  notes?: string;
}

interface StageRecord {
  stage: FlowStage;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  startTime?: string;
  endTime?: string;
  location: string;
  staffName: string;
  duration?: number;
}

const STAGE_CONFIG: Record<FlowStage, { label: string; icon: string; color: string; avgTime: number }> = {
  registration: { label: 'Registration', icon: '📝', color: 'text-blue-600', avgTime: 10 },
  triage: { label: 'Triage', icon: '🩺', color: 'text-purple-600', avgTime: 15 },
  consultation: { label: 'Consultation', icon: '👨‍⚕️', color: 'text-indigo-600', avgTime: 20 },
  diagnostics: { label: 'Diagnostics', icon: '🔬', color: 'text-cyan-600', avgTime: 45 },
  pharmacy: { label: 'Pharmacy', icon: '💊', color: 'text-emerald-600', avgTime: 15 },
  treatment: { label: 'Treatment', icon: '💉', color: 'text-amber-600', avgTime: 30 },
  discharge: { label: 'Discharge', icon: '✅', color: 'text-green-600', avgTime: 10 }
};

const MOCK_JOURNEYS: PatientJourney[] = [
  {
    id: 'J001', patientName: 'Kwame Mensah', patientId: 'P001', age: 45, gender: 'M',
    visitDate: '2024-01-16', arrivalTime: '08:30', currentStage: 'pharmacy', status: 'active',
    totalTime: 95, notes: 'Follow-up for hypertension',
    stages: [
      { stage: 'registration', status: 'completed', startTime: '08:30', endTime: '08:38', location: 'Registration Desk', staffName: 'Receptionist Esi', duration: 8 },
      { stage: 'triage', status: 'completed', startTime: '08:38', endTime: '08:50', location: 'Triage Area', staffName: 'Nurse Ama', duration: 12 },
      { stage: 'consultation', status: 'completed', startTime: '08:50', endTime: '09:10', location: 'OPD Room 3', staffName: 'Dr. Akua Osei', duration: 20 },
      { stage: 'diagnostics', status: 'completed', startTime: '09:10', endTime: '09:35', location: 'Laboratory', staffName: 'Lab Tech Kofi', duration: 25 },
      { stage: 'pharmacy', status: 'current', startTime: '09:35', location: 'Pharmacy Counter 2', staffName: 'Pharmacist Akua' },
      { stage: 'treatment', status: 'pending', location: 'Treatment Room', staffName: '' },
      { stage: 'discharge', status: 'pending', location: 'Registration Desk', staffName: '' }
    ]
  },
  {
    id: 'J002', patientName: 'Ama Darko', patientId: 'P002', age: 32, gender: 'F',
    visitDate: '2024-01-16', arrivalTime: '09:00', currentStage: 'consultation', status: 'active',
    totalTime: 60, notes: 'Diabetes management review',
    stages: [
      { stage: 'registration', status: 'completed', startTime: '09:00', endTime: '09:05', location: 'Registration Desk', staffName: 'Receptionist Esi', duration: 5 },
      { stage: 'triage', status: 'completed', startTime: '09:05', endTime: '09:18', location: 'Triage Area', staffName: 'Nurse Kofi', duration: 13 },
      { stage: 'consultation', status: 'current', startTime: '09:18', location: 'OPD Room 1', staffName: 'Dr. Kofi Asante' },
      { stage: 'diagnostics', status: 'pending', location: 'Laboratory', staffName: '' },
      { stage: 'pharmacy', status: 'pending', location: 'Pharmacy', staffName: '' },
      { stage: 'treatment', status: 'pending', location: 'Treatment Room', staffName: '' },
      { stage: 'discharge', status: 'pending', location: 'Registration Desk', staffName: '' }
    ]
  },
  {
    id: 'J003', patientName: 'Yaw Boateng', patientId: 'P003', age: 28, gender: 'M',
    visitDate: '2024-01-16', arrivalTime: '07:45', currentStage: 'discharge', status: 'active',
    totalTime: 145, notes: 'Completed treatment for malaria',
    stages: [
      { stage: 'registration', status: 'completed', startTime: '07:45', endTime: '07:50', location: 'Registration Desk', staffName: 'Receptionist Abena', duration: 5 },
      { stage: 'triage', status: 'completed', startTime: '07:50', endTime: '08:00', location: 'Emergency Triage', staffName: 'Nurse Akua', duration: 10 },
      { stage: 'consultation', status: 'completed', startTime: '08:00', endTime: '08:15', location: 'Emergency Room', staffName: 'Dr. Akua Osei', duration: 15 },
      { stage: 'diagnostics', status: 'completed', startTime: '08:15', endTime: '08:45', location: 'Laboratory', staffName: 'Lab Tech Nana', duration: 30 },
      { stage: 'pharmacy', status: 'completed', startTime: '08:45', endTime: '08:55', location: 'Pharmacy Counter 1', staffName: 'Pharmacist Kofi', duration: 10 },
      { stage: 'treatment', status: 'completed', startTime: '08:55', endTime: '09:50', location: 'Emergency Ward', staffName: 'Nurse Esi', duration: 55 },
      { stage: 'discharge', status: 'current', startTime: '09:50', location: 'Registration Desk', staffName: 'Receptionist Abena' }
    ]
  },
  {
    id: 'J004', patientName: 'Efua Ansah', patientId: 'P004', age: 8, gender: 'F',
    visitDate: '2024-01-16', arrivalTime: '10:00', currentStage: 'triage', status: 'active',
    totalTime: 25, notes: 'Fever and cough in child',
    stages: [
      { stage: 'registration', status: 'completed', startTime: '10:00', endTime: '10:05', location: 'Paediatric Registration', staffName: 'Receptionist Esi', duration: 5 },
      { stage: 'triage', status: 'current', startTime: '10:05', location: 'Paediatric Triage', staffName: 'Nurse Ama' },
      { stage: 'consultation', status: 'pending', location: 'Paediatric OPD', staffName: '' },
      { stage: 'diagnostics', status: 'pending', location: 'Laboratory', staffName: '' },
      { stage: 'pharmacy', status: 'pending', location: 'Pharmacy', staffName: '' },
      { stage: 'treatment', status: 'pending', location: 'Treatment Room', staffName: '' },
      { stage: 'discharge', status: 'pending', location: 'Registration Desk', staffName: '' }
    ]
  },
  {
    id: 'J005', patientName: 'Abena Pokua', patientId: 'P005', age: 55, gender: 'F',
    visitDate: '2024-01-16', arrivalTime: '08:00', currentStage: 'discharge', status: 'completed',
    totalTime: 180, notes: 'HIV viral load check - results received',
    stages: [
      { stage: 'registration', status: 'completed', startTime: '08:00', endTime: '08:06', location: 'Registration Desk', staffName: 'Receptionist Esi', duration: 6 },
      { stage: 'triage', status: 'completed', startTime: '08:06', endTime: '08:15', location: 'Triage Area', staffName: 'Nurse Akua', duration: 9 },
      { stage: 'consultation', status: 'completed', startTime: '08:15', endTime: '08:30', location: 'OPD Room 2', staffName: 'Dr. Kofi Asante', duration: 15 },
      { stage: 'diagnostics', status: 'completed', startTime: '08:30', endTime: '09:00', location: 'Laboratory', staffName: 'Lab Tech Kofi', duration: 30 },
      { stage: 'pharmacy', status: 'completed', startTime: '09:00', endTime: '09:10', location: 'Pharmacy Counter 2', staffName: 'Pharmacist Akua', duration: 10 },
      { stage: 'treatment', status: 'completed', startTime: '09:10', endTime: '09:30', location: 'Treatment Room', staffName: 'Nurse Ama', duration: 20 },
      { stage: 'discharge', status: 'completed', startTime: '09:30', endTime: '09:35', location: 'Registration Desk', staffName: 'Receptionist Esi', duration: 5 }
    ]
  }
];

const FLOW_STAGES: FlowStage[] = ['registration', 'triage', 'consultation', 'diagnostics', 'pharmacy', 'treatment', 'discharge'];

export default function PatientFlow() {
  const [activeTab, setActiveTab] = useState<'overview' | 'journeys' | 'analytics'>('overview');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  const stats = {
    total: MOCK_JOURNEYS.length,
    active: MOCK_JOURNEYS.filter(j => j.status === 'active').length,
    completed: MOCK_JOURNEYS.filter(j => j.status === 'completed').length,
    avgTime: Math.round(MOCK_JOURNEYS.reduce((sum, j) => sum + j.totalTime, 0) / MOCK_JOURNEYS.length),
    waiting: MOCK_JOURNEYS.filter(j => j.stages.some(s => s.status === 'current')).length
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
          title="Add New Flow Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Flow Tracking</h1>
          <p className="text-gray-500">Track patient journey through the hospital in real-time</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">📊 Print Report</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Today's Patients", value: stats.total, color: 'bg-blue-500' },
          { label: 'In Progress', value: stats.active, color: 'bg-indigo-500' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-500' },
          { label: 'Avg Time (min)', value: stats.avgTime, color: 'bg-amber-500' },
          { label: 'Currently Waiting', value: stats.waiting, color: 'bg-purple-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'journeys', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'overview' ? 'Flow Overview' : tab === 'journeys' ? 'Patient Journeys' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Flow Pipeline */}
          <div className="border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Hospital Flow Pipeline</h3>
            <div className="flex items-center justify-between">
              {FLOW_STAGES.map((stage, idx) => {
                const config = STAGE_CONFIG[stage];
                const patientsAtStage = MOCK_JOURNEYS.filter(j => j.currentStage === stage && j.status === 'active').length;
                const completedToday = MOCK_JOURNEYS.filter(j => j.stages.some(s => s.stage === stage && s.status === 'completed')).length;
                return (
                  <div key={stage} className="flex items-center">
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto ${
                        patientsAtStage > 0 ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-gray-100'
                      }`}>
                        {config.icon}
                      </div>
                      <p className="text-xs font-medium mt-2">{config.label}</p>
                      <p className="text-lg font-bold text-blue-600">{patientsAtStage}</p>
                      <p className="text-xs text-gray-400">active</p>
                      <p className="text-xs text-gray-400">{completedToday} done</p>
                    </div>
                    {idx < 6 && (
                      <div className="w-8 h-0.5 bg-gray-300 mx-1 mt-[-40px]">
                        <div className="w-full h-full bg-blue-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Patients */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Active Patients</h3>
            {MOCK_JOURNEYS.filter(j => j.status === 'active').map(journey => {
              const currentStageConfig = STAGE_CONFIG[journey.currentStage];
              const completedStages = journey.stages.filter(s => s.status === 'completed').length;
              
              return (
                <div key={journey.id} className="border rounded-xl p-4 hover:shadow-md cursor-pointer"
                  onClick={() => setSelectedJourneyId(journey.id === selectedJourneyId ? null : journey.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentStageConfig.icon}</span>
                      <div>
                        <p className="font-bold">{journey.patientName}</p>
                        <p className="text-sm text-gray-500">Age: {journey.age} | {journey.gender} | {journey.notes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${currentStageConfig.color} bg-white border`}>{currentStageConfig.label}</Badge>
                      <p className="text-xs text-gray-400 mt-1">Arrived: {journey.arrivalTime}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-1">
                    {FLOW_STAGES.map((stage) => {
                      const stageRecord = journey.stages.find(s => s.stage === stage);
                      const isCompleted = stageRecord?.status === 'completed';
                      const isCurrent = stageRecord?.status === 'current';
                      return (
                        <div key={stage} className="flex-1 flex items-center">
                          <div className={`w-full h-2 rounded-full ${
                            isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {FLOW_STAGES.map(stage => (
                      <span key={stage} className="text-[8px] text-gray-400">{STAGE_CONFIG[stage].label.substring(0, 4)}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Total time: {journey.totalTime} minutes | {completedStages}/7 stages completed</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Journeys Tab */}
      {activeTab === 'journeys' && (
        <div className="space-y-4">
          {MOCK_JOURNEYS.map(journey => (
            <div key={journey.id} className="border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    journey.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}>
                    {journey.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{journey.patientName}</p>
                    <p className="text-sm text-gray-500">{journey.patientId} | Age: {journey.age} | {journey.gender}</p>
                  </div>
                </div>
                <Badge className={journey.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'}>
                  {journey.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>

              {/* Stage Timeline */}
              <div className="space-y-2">
                {journey.stages.map((stageRecord, idx) => {
                  const config = STAGE_CONFIG[stageRecord.stage];
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${
                      stageRecord.status === 'current' ? 'bg-blue-50 ring-1 ring-blue-200' :
                      stageRecord.status === 'completed' ? 'bg-emerald-50' : 'bg-gray-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stageRecord.status === 'completed' ? 'bg-emerald-500 text-white' :
                        stageRecord.status === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>
                        {stageRecord.status === 'completed' ? '✓' : config.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-gray-500">{stageRecord.location} | {stageRecord.staffName}</p>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        {stageRecord.startTime && <p>{stageRecord.startTime} - {stageRecord.endTime || '...'}</p>}
                        {stageRecord.duration && <p>{stageRecord.duration} min</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-sm text-gray-500">
                Total time: <span className="font-bold">{journey.totalTime} minutes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Average Time per Stage</h4>
            <div className="space-y-3">
              {FLOW_STAGES.map(stage => {
                const config = STAGE_CONFIG[stage];
                const avgTime = config.avgTime;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm text-gray-600 w-32">{config.label}</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${(avgTime / 60) * 100}%` }} />
                    </div>
                    <span className="font-bold text-sm">{avgTime} min</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Patient Flow by Hour</h4>
            <div className="space-y-2">
              {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(hour => {
                const count = hour === '08:00' ? 3 : hour === '09:00' ? 4 : hour === '10:00' ? 2 : Math.floor(Math.random() * 3);
                return (
                  <div key={hour} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">{hour}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded">
                      <div className="h-4 bg-blue-500 rounded" style={{ width: `${(count / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Bottleneck Analysis</h4>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-bold text-red-600">⚠️ Diagnostics</p>
                <p className="text-sm text-gray-600">Average wait: 45 min | Target: 30 min</p>
                <p className="text-xs text-red-500">Recommendation: Add 1 more lab technician during peak hours</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-bold text-amber-600">⚡ Triage</p>
                <p className="text-sm text-gray-600">Average wait: 15 min | Target: 10 min</p>
                <p className="text-xs text-amber-500">Recommendation: Consider 2nd triage nurse during 08:00-10:00</p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Today's Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Total Patients</span><span className="font-bold">{stats.total}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Completed</span><span className="font-bold text-emerald-600">{stats.completed}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">In Progress</span><span className="font-bold text-blue-600">{stats.active}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Average Visit Time</span><span className="font-bold">{stats.avgTime} min</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Longest Visit</span><span className="font-bold text-red-600">180 min</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shortest Visit</span><span className="font-bold text-emerald-600">65 min</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
