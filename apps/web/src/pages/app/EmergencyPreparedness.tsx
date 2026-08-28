import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type DrillStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type EmergencyLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4';
type ResourceType = 'personnel' | 'equipment' | 'medication' | 'beds' | 'blood' | 'oxygen';

interface EmergencyDrill {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  status: DrillStatus;
  participants: number;
  leader: string;
  location: string;
  notes?: string;
  score?: number;
}

interface EmergencyPlan {
  id: string;
  name: string;
  type: string;
  lastUpdated: string;
  version: string;
  approvedBy: string;
  status: 'active' | 'draft' | 'archived';
}

interface ResourceStockpile {
  type: ResourceType;
  item: string;
  currentStock: number;
  minimumRequired: number;
  unit: string;
  lastChecked: string;
  status: 'adequate' | 'low' | 'critical';
}

const LEVEL_CONFIG: Record<EmergencyLevel, { label: string; color: string; bg: string; description: string }> = {
  level_1: { label: 'Level 1 (Green)', color: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Normal operations, minor incident' },
  level_2: { label: 'Level 2 (Yellow)', color: 'text-amber-600', bg: 'bg-amber-50', description: 'Moderate incident, increased readiness' },
  level_3: { label: 'Level 3 (Orange)', color: 'text-orange-600', bg: 'bg-orange-50', description: 'Major incident, full activation' },
  level_4: { label: 'Level 4 (Red)', color: 'text-red-600', bg: 'bg-red-50', description: 'Catastrophic, mutual aid required' }
};

const DRILLS: EmergencyDrill[] = [
  { id: 'DR001', name: 'Mass Casualty Drill', type: 'MCI', date: '2024-02-15', time: '09:00', status: 'scheduled', participants: 50, leader: 'Dr. Emergency', location: 'Emergency Department', notes: 'Simulate bus accident with 30 casualties' },
  { id: 'DR002', name: 'Fire Evacuation Drill', type: 'Fire', date: '2024-01-20', time: '10:00', status: 'scheduled', participants: 120, leader: 'Mr. Safety', location: 'Main Hospital Block', notes: 'Full building evacuation drill' },
  { id: 'DR003', name: 'Infectious Disease Outbreak', type: 'Infection', date: '2024-01-10', time: '08:00', status: 'completed', participants: 80, leader: 'Dr. Infection Control', location: 'Isolation Ward', score: 85 },
  { id: 'DR004', name: 'Earthquake Response', type: 'Natural Disaster', date: '2023-12-15', time: '14:00', status: 'completed', participants: 100, leader: 'Dr. Emergency', location: 'All Wards', score: 78 },
  { id: 'DR005', name: 'Active Shooter Drill', type: 'Security', date: '2024-03-01', time: '11:00', status: 'scheduled', participants: 60, leader: 'Security Chief', location: 'Main Hospital Block' }
];

const EMERGENCY_PLANS: EmergencyPlan[] = [
  { id: 'EP001', name: 'Mass Casualty Incident Plan', type: 'MCI', lastUpdated: '2024-01-05', version: '3.0', approvedBy: 'Medical Director', status: 'active' },
  { id: 'EP002', name: 'Fire Emergency Plan', type: 'Fire', lastUpdated: '2023-11-20', version: '2.1', approvedBy: 'Hospital Administrator', status: 'active' },
  { id: 'EP003', name: 'Infectious Disease Outbreak Plan', type: 'Infection', lastUpdated: '2024-01-10', version: '4.0', approvedBy: 'Infection Control Committee', status: 'active' },
  { id: 'EP004', name: 'Natural Disaster Response Plan', type: 'Natural Disaster', lastUpdated: '2023-10-15', version: '2.0', approvedBy: 'Medical Director', status: 'active' },
  { id: 'EP005', name: 'Bomb Threat / Terrorism Plan', type: 'Security', lastUpdated: '2023-09-01', version: '1.5', approvedBy: 'Security Committee', status: 'draft' },
  { id: 'EP006', name: 'Utility Failure Plan', type: 'Utility', lastUpdated: '2023-12-01', version: '2.0', approvedBy: 'Hospital Administrator', status: 'active' }
];

const RESOURCE_STOCKPILE: ResourceStockpile[] = [
  { type: 'personnel', item: 'Emergency Doctors on Call', currentStock: 4, minimumRequired: 3, unit: 'doctors', lastChecked: '2024-01-16', status: 'adequate' },
  { type: 'personnel', item: 'Emergency Nurses on Shift', currentStock: 8, minimumRequired: 6, unit: 'nurses', lastChecked: '2024-01-16', status: 'adequate' },
  { type: 'equipment', item: 'Ventilators Available', currentStock: 3, minimumRequired: 5, unit: 'units', lastChecked: '2024-01-16', status: 'low' },
  { type: 'equipment', item: 'Defibrillators', currentStock: 6, minimumRequired: 4, unit: 'units', lastChecked: '2024-01-16', status: 'adequate' },
  { type: 'medication', item: 'Emergency Drug Kit', currentStock: 8, minimumRequired: 10, unit: 'kits', lastChecked: '2024-01-16', status: 'low' },
  { type: 'medication', item: 'Antidotes Stock', currentStock: 12, minimumRequired: 8, unit: 'doses', lastChecked: '2024-01-15', status: 'adequate' },
  { type: 'beds', item: 'ICU Beds Available', currentStock: 2, minimumRequired: 3, unit: 'beds', lastChecked: '2024-01-16', status: 'critical' },
  { type: 'beds', item: 'Emergency Ward Beds', currentStock: 4, minimumRequired: 5, unit: 'beds', lastChecked: '2024-01-16', status: 'low' },
  { type: 'blood', item: 'Emergency Blood Units', currentStock: 15, minimumRequired: 10, unit: 'units', lastChecked: '2024-01-16', status: 'adequate' },
  { type: 'oxygen', item: 'Oxygen Cylinders', currentStock: 20, minimumRequired: 15, unit: 'cylinders', lastChecked: '2024-01-16', status: 'adequate' }
];

export default function EmergencyPreparedness() {
  const [activeTab, setActiveTab] = useState<'overview' | 'drills' | 'plans' | 'resources'>('overview');
  const [selectedLevel, setSelectedLevel] = useState<EmergencyLevel>('level_1');

  const stats = {
    totalDrills: DRILLS.length,
    completed: DRILLS.filter(d => d.status === 'completed').length,
    scheduled: DRILLS.filter(d => d.status === 'scheduled').length,
    plans: EMERGENCY_PLANS.length,
    criticalResources: RESOURCE_STOCKPILE.filter(r => r.status === 'critical' || r.status === 'low').length
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
          <h1 className="text-2xl font-bold">Emergency Preparedness</h1>
          <p className="text-gray-500">Disaster planning, drills, and emergency response readiness</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {}} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">🚨 Activate Emergency</button>
          <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Drill</button>
        </div>
      </div>

      {/* Current Emergency Level */}
      <div className={`border-2 rounded-xl p-4 ${LEVEL_CONFIG[selectedLevel].bg} border-current`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Emergency Level</p>
            <h3 className={`text-xl font-bold ${LEVEL_CONFIG[selectedLevel].color}`}>{LEVEL_CONFIG[selectedLevel].label}</h3>
            <p className="text-sm text-gray-600">{LEVEL_CONFIG[selectedLevel].description}</p>
          </div>
          <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value as EmergencyLevel)}
            className="border rounded-lg px-3 py-2 text-sm">
            {Object.entries(LEVEL_CONFIG).map(([level, config]) => (
              <option key={level} value={level}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Drills', value: stats.totalDrills, color: 'bg-blue-500' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-500' },
          { label: 'Scheduled', value: stats.scheduled, color: 'bg-amber-500' },
          { label: 'Emergency Plans', value: stats.plans, color: 'bg-purple-500' },
          { label: 'Critical Resources', value: stats.criticalResources, color: 'bg-red-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'drills', 'plans', 'resources'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'overview' ? 'Overview' : tab === 'drills' ? 'Drills' : tab === 'plans' ? 'Plans' : 'Resources'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Upcoming Drills</h4>
            <div className="space-y-3">
              {DRILLS.filter(d => d.status === 'scheduled').map(drill => (
                <div key={drill.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{drill.name}</span>
                    <Badge className="text-amber-600 bg-amber-100">{drill.type}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{drill.date} {drill.time} | {drill.location}</p>
                  <p className="text-xs text-gray-400">Leader: {drill.leader} | Participants: {drill.participants}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Resource Alerts</h4>
            <div className="space-y-3">
              {RESOURCE_STOCKPILE.filter(r => r.status !== 'adequate').map(resource => (
                <div key={resource.item} className={`p-3 rounded-lg border ${
                  resource.status === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{resource.item}</span>
                    <Badge className={resource.status === 'critical' ? 'text-red-600 bg-red-100' : 'text-amber-600 bg-amber-100'}>
                      {resource.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {resource.currentStock} {resource.unit} | Required: {resource.minimumRequired} {resource.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drills Tab */}
      {activeTab === 'drills' && (
        <div className="space-y-3">
          {DRILLS.map(drill => (
            <div key={drill.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{drill.name}</span>
                    <Badge className="bg-blue-50 text-blue-600">{drill.type}</Badge>
                    <Badge className={drill.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : drill.status === 'scheduled' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-100'}>
                      {drill.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{drill.date} {drill.time} | {drill.location}</p>
                  <p className="text-xs text-gray-400">Leader: {drill.leader} | Participants: {drill.participants}</p>
                  {drill.notes && <p className="text-xs text-gray-500 mt-1">Notes: {drill.notes}</p>}
                </div>
                {drill.score && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">{drill.score}%</p>
                    <p className="text-xs text-gray-400">Score</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-3">
          {EMERGENCY_PLANS.map(plan => (
            <div key={plan.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{plan.name}</span>
                    <Badge className="bg-blue-50 text-blue-600">{plan.type}</Badge>
                    <Badge className={plan.status === 'active' ? 'text-emerald-600 bg-emerald-50' : plan.status === 'draft' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-100'}>
                      v{plan.version} | {plan.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Approved by: {plan.approvedBy} | Last Updated: {plan.lastUpdated}</p>
                </div>
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">View Plan</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {Object.entries(RESOURCE_STOCKPILE.reduce<Record<string, ResourceStockpile[]>>((acc, r) => {
            if (!acc[r.type]) acc[r.type] = [];
            acc[r.type]!.push(r);
            return acc;
          }, {})).map(([type, resources]) => (
            <div key={type}>
              <h3 className="font-bold text-lg capitalize mb-3">{type}</h3>
              <div className="space-y-3">
                {resources.map(resource => (
                  <div key={resource.item} className={`border rounded-xl p-4 ${
                    resource.status === 'critical' ? 'bg-red-50 border-red-200' :
                    resource.status === 'low' ? 'bg-amber-50 border-amber-200' : 'bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{resource.item}</p>
                        <p className="text-sm text-gray-500">Last checked: {resource.lastChecked}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{resource.currentStock} / {resource.minimumRequired} {resource.unit}</p>
                        <Badge className={resource.status === 'critical' ? 'text-red-600 bg-red-100' : resource.status === 'low' ? 'text-amber-600 bg-amber-100' : 'text-emerald-600 bg-emerald-100'}>
                          {resource.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${resource.status === 'critical' ? 'bg-red-500' : resource.status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((resource.currentStock / resource.minimumRequired) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
