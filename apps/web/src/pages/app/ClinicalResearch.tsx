import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, useToast } from '../../components/ui';

type StudyStatus = 'recruiting' | 'active' | 'completed' | 'suspended';
type StudyPhase = 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4';

interface ResearchStudy {
  id: string;
  title: string;
  principalInvestigator: string;
  department: string;
  status: StudyStatus;
  phase: StudyPhase;
  targetEnrollment: number;
  currentEnrollment: number;
  startDate: string;
  endDate: string;
  sponsor: string;
  protocol: string;
  lastAudit: string;
}

const PHASE_CONFIG: Record<StudyPhase, { label: string; color: string }> = {
  phase_1: { label: 'Phase I', color: 'text-blue-600 bg-blue-50' },
  phase_2: { label: 'Phase II', color: 'text-purple-600 bg-purple-50' },
  phase_3: { label: 'Phase III', color: 'text-indigo-600 bg-indigo-50' },
  phase_4: { label: 'Phase IV', color: 'text-emerald-600 bg-emerald-50' }
};

const STATUS_CONFIG: Record<StudyStatus, { label: string; color: string; bg: string }> = {
  recruiting: { label: 'Recruiting', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  active: { label: 'Active', color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-50' },
  suspended: { label: 'Suspended', color: 'text-red-600', bg: 'bg-red-50' }
};

const MOCK_STUDIES: ResearchStudy[] = [
  {
    id: 'RS001', title: 'Hypertension Management in Ghana', principalInvestigator: 'Dr. Akua Osei',
    department: 'Cardiology', status: 'recruiting', phase: 'phase_3', targetEnrollment: 200,
    currentEnrollment: 85, startDate: '2024-01-01', endDate: '2025-12-31', sponsor: 'Ghana Health Service',
    protocol: 'GH-HYP-2024-001', lastAudit: '2024-01-10'
  },
  {
    id: 'RS002', title: 'Malaria Vaccine Efficacy Trial', principalInvestigator: 'Dr. Kofi Asante',
    department: 'Infectious Disease', status: 'active', phase: 'phase_2', targetEnrollment: 150,
    currentEnrollment: 150, startDate: '2023-06-01', endDate: '2024-12-31', sponsor: 'WHO',
    protocol: 'MAL-VAX-2023-002', lastAudit: '2024-01-15'
  },
  {
    id: 'RS003', title: 'Diabetes Prevention Programme', principalInvestigator: 'Dr. Nana Agyeman',
    department: 'Endocrinology', status: 'active', phase: 'phase_1', targetEnrollment: 50,
    currentEnrollment: 42, startDate: '2024-01-15', endDate: '2024-06-30', sponsor: 'Ministry of Health',
    protocol: 'DM-PREV-2024-003', lastAudit: '2024-01-12'
  },
  {
    id: 'RS004', title: 'Neonatal Sepsis Biomarker Study', principalInvestigator: 'Dr. Esi Mensah',
    department: 'Paediatrics', status: 'completed', phase: 'phase_2', targetEnrollment: 80,
    currentEnrollment: 80, startDate: '2022-03-01', endDate: '2023-12-31', sponsor: 'KNUST Research Fund',
    protocol: 'NBS-BM-2022-004', lastAudit: '2024-01-05'
  },
  {
    id: 'RS005', title: 'COVID-19 Long-term Effects', principalInvestigator: 'Dr. Akua Osei',
    department: 'Pulmonology', status: 'suspended', phase: 'phase_3', targetEnrollment: 300,
    currentEnrollment: 120, startDate: '2023-01-01', endDate: '2024-12-31', sponsor: 'NIH',
    protocol: 'COVID-LTE-2023-005', lastAudit: '2023-11-20'
  }
];

export default function ClinicalResearch() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'studies' | 'analytics' | 'regulatory'>('studies');
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);

  const stats = {
    total: MOCK_STUDIES.length,
    recruiting: MOCK_STUDIES.filter(s => s.status === 'recruiting').length,
    active: MOCK_STUDIES.filter(s => s.status === 'active').length,
    totalEnrolled: MOCK_STUDIES.reduce((sum, s) => sum + s.currentEnrollment, 0)
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
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clinical Research</h1>
          <p className="text-gray-500">Research studies, protocols, and regulatory compliance</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Study</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Studies', value: stats.total, color: 'bg-blue-500' },
          { label: 'Recruiting', value: stats.recruiting, color: 'bg-emerald-500' },
          { label: 'Active', value: stats.active, color: 'bg-purple-500' },
          { label: 'Total Enrolled', value: stats.totalEnrolled, color: 'bg-amber-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['studies', 'analytics', 'regulatory'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'studies' ? 'Studies' : tab === 'analytics' ? 'Analytics' : 'Regulatory'}
          </button>
        ))}
      </div>

      {/* Studies Tab */}
      {activeTab === 'studies' && (
        <div className="space-y-3">
          {MOCK_STUDIES.map(s => {
            const status = STATUS_CONFIG[s.status];
            const phase = PHASE_CONFIG[s.phase];
            const progress = (s.currentEnrollment / s.targetEnrollment) * 100;
            return (
              <div key={s.id} className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedStudy === s.id ? 'ring-2 ring-blue-300 bg-blue-50' : 'hover:shadow-md'}`}
                onClick={() => setSelectedStudy(selectedStudy === s.id ? null : s.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{s.title}</span>
                      <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                      <Badge className={phase.color}>{phase.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">PI: {s.principalInvestigator} | {s.department}</p>
                    <p className="text-xs text-gray-400">Sponsor: {s.sponsor} | Protocol: {s.protocol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{s.currentEnrollment}/{s.targetEnrollment}</p>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>
                </div>

                {selectedStudy === s.id && (
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                    <div className="grid grid-cols-4 gap-4">
                      <div><span className="text-gray-500">Start:</span> {s.startDate}</div>
                      <div><span className="text-gray-500">End:</span> {s.endDate}</div>
                      <div><span className="text-gray-500">Last Audit:</span> {s.lastAudit}</div>
                      <div><span className="text-gray-500">Progress:</span> <span className="font-bold">{progress.toFixed(0)}%</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Studies by Phase</h4>
            <div className="space-y-3">
              {Object.entries(PHASE_CONFIG).map(([phase, config]) => {
                const count = MOCK_STUDIES.filter(s => s.phase === phase).length;
                return (
                  <div key={phase} className="flex items-center justify-between">
                    <Badge className={config.color}>{config.label}</Badge>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Enrollment Progress</h4>
            <div className="space-y-3">
              {MOCK_STUDIES.filter(s => s.status !== 'completed').map(s => (
                <div key={s.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 truncate">{s.title.substring(0, 25)}...</span>
                    <span className="font-bold">{s.currentEnrollment}/{s.targetEnrollment}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(s.currentEnrollment / s.targetEnrollment) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regulatory Tab */}
      {activeTab === 'regulatory' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Regulatory Compliance</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'IRB Approval', status: 'All studies approved', icon: '✅', color: 'text-emerald-600' },
              { title: 'Informed Consent', status: 'Templates ready', icon: '📋', color: 'text-blue-600' },
              { title: 'Data Safety Monitoring', status: 'Quarterly review scheduled', icon: '🛡️', color: 'text-purple-600' },
              { title: 'Adverse Event Reporting', status: '24h reporting active', icon: '⚠️', color: 'text-amber-600' },
              { title: 'Protocol Deviations', status: '1 minor deviation noted', icon: '📝', color: 'text-orange-600' },
              { title: 'Audit Readiness', status: '3/5 studies audit-ready', icon: '🔍', color: 'text-indigo-600' }
            ].map(item => (
              <div key={item.title} className="border rounded-xl p-4">
                <span className="text-2xl">{item.icon}</span>
                <p className="font-bold mt-2">{item.title}</p>
                <p className={`text-sm ${item.color}`}>{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
