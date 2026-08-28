import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, useToast } from '../../components/ui';

type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
type TransfusionStatus = 'requested' | 'crossmatched' | 'approved' | 'issued' | 'transfusing' | 'completed' | 'reaction';
type ComponentType = 'packed_rbc' | 'platelets' | 'plasma' | 'cryoprecipitate' | 'whole_blood';

interface BloodUnit {
  id: string;
  unitCode: string;
  bloodGroup: BloodGroup;
  component: ComponentType;
  volume: number;
  collectionDate: string;
  expiryDate: string;
  donorId: string;
  status: 'available' | 'reserved' | 'issued' | 'expired' | 'quarantine';
  screeningResult: 'negative' | 'positive' | 'pending';
  storageTemp: string;
  location: string;
}

interface TransfusionRequest {
  id: string;
  patientName: string;
  patientId: string;
  bloodGroup: BloodGroup;
  component: ComponentType;
  unitsRequested: number;
  clinicalIndication: string;
  requestingDoctor: string;
  status: TransfusionStatus;
  requestDate: string;
  issuedDate?: string;
  transfusedDate?: string;
  preTransfusionHb?: number;
  postTransfusionHb?: number;
  reaction?: string;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMPONENT_CONFIG: Record<ComponentType, { label: string; icon: string; color: string }> = {
  packed_rbc: { label: 'Packed RBC', icon: '🩸', color: 'text-red-600' },
  platelets: { label: 'Platelets', icon: '🟡', color: 'text-amber-600' },
  plasma: { label: 'Plasma', icon: '🟡', color: 'text-yellow-500' },
  cryoprecipitate: { label: 'Cryoprecipitate', icon: '🔵', color: 'text-blue-600' },
  whole_blood: { label: 'Whole Blood', icon: '🩸', color: 'text-red-700' }
};

const STATUS_CONFIG: Record<TransfusionStatus, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: 'text-gray-600', bg: 'bg-gray-50' },
  crossmatched: { label: 'Crossmatched', color: 'text-blue-600', bg: 'bg-blue-50' },
  approved: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  issued: { label: 'Issued', color: 'text-purple-600', bg: 'bg-purple-50' },
  transfusing: { label: 'Transfusing', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
  reaction: { label: 'Reaction', color: 'text-red-600', bg: 'bg-red-50' }
};

const BLOOD_INVENTORY: BloodUnit[] = [
  { id: 'BU001', unitCode: 'BLD-2024-001', bloodGroup: 'A+', component: 'packed_rbc', volume: 300, collectionDate: '2024-01-10', expiryDate: '2024-02-10', donorId: 'D001', status: 'available', screeningResult: 'negative', storageTemp: '4°C', location: 'Blood Bank Rack A1' },
  { id: 'BU002', unitCode: 'BLD-2024-002', bloodGroup: 'A+', component: 'packed_rbc', volume: 300, collectionDate: '2024-01-12', expiryDate: '2024-02-12', donorId: 'D002', status: 'available', screeningResult: 'negative', storageTemp: '4°C', location: 'Blood Bank Rack A1' },
  { id: 'BU003', unitCode: 'BLD-2024-003', bloodGroup: 'O-', component: 'packed_rbc', volume: 300, collectionDate: '2024-01-14', expiryDate: '2024-02-14', donorId: 'D003', status: 'reserved', screeningResult: 'negative', storageTemp: '4°C', location: 'Blood Bank Rack B1' },
  { id: 'BU004', unitCode: 'BLD-2024-004', bloodGroup: 'B+', component: 'platelets', volume: 250, collectionDate: '2024-01-15', expiryDate: '2024-01-22', donorId: 'D004', status: 'available', screeningResult: 'negative', storageTemp: '22°C', location: 'Platelet Incubator' },
  { id: 'BU005', unitCode: 'BLD-2024-005', bloodGroup: 'AB+', component: 'plasma', volume: 200, collectionDate: '2024-01-13', expiryDate: '2024-07-13', donorId: 'D005', status: 'available', screeningResult: 'negative', storageTemp: '-18°C', location: 'Freezer F1' },
  { id: 'BU006', unitCode: 'BLD-2024-006', bloodGroup: 'O+', component: 'packed_rbc', volume: 300, collectionDate: '2024-01-08', expiryDate: '2024-02-08', donorId: 'D006', status: 'available', screeningResult: 'negative', storageTemp: '4°C', location: 'Blood Bank Rack C1' },
  { id: 'BU007', unitCode: 'BLD-2024-007', bloodGroup: 'A-', component: 'cryoprecipitate', volume: 50, collectionDate: '2024-01-14', expiryDate: '2024-07-14', donorId: 'D007', status: 'available', screeningResult: 'negative', storageTemp: '-18°C', location: 'Freezer F2' },
  { id: 'BU008', unitCode: 'BLD-2024-008', bloodGroup: 'B-', component: 'packed_rbc', volume: 300, collectionDate: '2024-01-11', expiryDate: '2024-02-11', donorId: 'D008', status: 'expired', screeningResult: 'negative', storageTemp: '4°C', location: 'Disposal Area' }
];

const TRANSFUSION_REQUESTS: TransfusionRequest[] = [
  {
    id: 'TR001', patientName: 'Kofi Asante', patientId: 'P010', bloodGroup: 'A+', component: 'packed_rbc',
    unitsRequested: 2, clinicalIndication: 'Post-surgical bleeding, Hb 6.8 g/dL', requestingDoctor: 'Dr. Emergency',
    status: 'transfusing', requestDate: '2024-01-16 08:30', issuedDate: '2024-01-16 09:00',
    preTransfusionHb: 6.8
  },
  {
    id: 'TR002', patientName: 'Ama Serwaa', patientId: 'P011', bloodGroup: 'O-', component: 'packed_rbc',
    unitsRequested: 1, clinicalIndication: 'Acute blood loss, trauma', requestingDoctor: 'Dr. Akua Osei',
    status: 'approved', requestDate: '2024-01-16 09:00'
  },
  {
    id: 'TR003', patientName: 'Yaw Mensah', patientId: 'P012', bloodGroup: 'B+', component: 'platelets',
    unitsRequested: 1, clinicalIndication: 'Dengue fever, platelets 25,000', requestingDoctor: 'Dr. Nana Agyeman',
    status: 'crossmatched', requestDate: '2024-01-16 09:30'
  },
  {
    id: 'TR004', patientName: 'Nana Kwame', patientId: 'P014', bloodGroup: 'A+', component: 'packed_rbc',
    unitsRequested: 3, clinicalIndication: 'Hip surgery, Hb 7.2 g/dL', requestingDoctor: 'Dr. Kofi Asante',
    status: 'requested', requestDate: '2024-01-16 10:00'
  },
  {
    id: 'TR005', patientName: 'Abena Boateng', patientId: 'P015', bloodGroup: 'AB+', component: 'plasma',
    unitsRequested: 2, clinicalIndication: 'DIC, coagulopathy', requestingDoctor: 'Dr. Akua Osei',
    status: 'completed', requestDate: '2024-01-15 14:00', issuedDate: '2024-01-15 15:00',
    transfusedDate: '2024-01-15 16:00', preTransfusionHb: 9.2, postTransfusionHb: 10.8
  }
];

export default function BloodTransfusionService() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'crossmatch' | 'analytics'>('inventory');
  const [bloodFilter, setBloodFilter] = useState<BloodGroup | 'all'>('all');

  const stats = {
    totalUnits: BLOOD_INVENTORY.length,
    available: BLOOD_INVENTORY.filter(u => u.status === 'available').length,
    requests: TRANSFUSION_REQUESTS.length,
    transfusing: TRANSFUSION_REQUESTS.filter(r => r.status === 'transfusing').length,
    reactions: TRANSFUSION_REQUESTS.filter(r => r.status === 'reaction').length
  };

  const filteredInventory = BLOOD_INVENTORY.filter(u => bloodFilter === 'all' || u.bloodGroup === bloodFilter);

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
          title="Add New Transfusion Service"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blood Transfusion Service</h1>
          <p className="text-gray-500">Cross-matching, transfusion tracking, and blood component management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {}} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">+ New Request</button>
          <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Blood Unit</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Units', value: stats.totalUnits, color: 'bg-red-500' },
          { label: 'Available', value: stats.available, color: 'bg-emerald-500' },
          { label: 'Requests', value: stats.requests, color: 'bg-blue-500' },
          { label: 'Transfusing', value: stats.transfusing, color: 'bg-indigo-500' },
          { label: 'Reactions', value: stats.reactions, color: 'bg-amber-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['inventory', 'requests', 'crossmatch', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'inventory' ? 'Blood Inventory' : tab === 'requests' ? 'Transfusion Requests' : tab === 'crossmatch' ? 'Cross-Match' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select value={bloodFilter} onChange={e => setBloodFilter(e.target.value as BloodGroup | 'all')}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Blood Groups</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Blood Group Overview */}
          <div className="grid grid-cols-8 gap-2">
            {BLOOD_GROUPS.map(group => {
              const count = BLOOD_INVENTORY.filter(u => u.bloodGroup === group && u.status === 'available').length;
              return (
                <div key={group} className="text-center p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{group}</p>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-gray-500">units</p>
                </div>
              );
            })}
          </div>

          {/* Unit List */}
          <div className="space-y-3">
            {filteredInventory.map(unit => {
              const comp = COMPONENT_CONFIG[unit.component];
              
              return (
                <div key={unit.id} className={`border rounded-xl p-4 ${
                  unit.status === 'available' ? 'bg-emerald-50 border-emerald-200' :
                  unit.status === 'reserved' ? 'bg-amber-50 border-amber-200' :
                  unit.status === 'expired' ? 'bg-gray-50 border-gray-200' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{comp.icon}</span>
                        <span className="font-bold">{unit.unitCode}</span>
                        <Badge className="text-red-600 bg-red-100 border border-red-200">{unit.bloodGroup}</Badge>
                        <Badge className={`${comp.color} bg-white border`}>{comp.label}</Badge>
                        <Badge className={unit.status === 'available' ? 'text-emerald-600 bg-emerald-100' : unit.status === 'reserved' ? 'text-amber-600 bg-amber-100' : 'text-gray-600 bg-gray-100'}>
                          {unit.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Volume: {unit.volume}mL | Donor: {unit.donorId} | {unit.storageTemp} | {unit.location}
                      </p>
                      <p className="text-xs text-gray-400">
                        Collected: {unit.collectionDate} | Expires: {unit.expiryDate} | Screen: {unit.screeningResult}
                      </p>
                    </div>
                    {unit.status === 'available' && (
                      <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Reserve</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {TRANSFUSION_REQUESTS.map(request => {
            const status = STATUS_CONFIG[request.status];
            const comp = COMPONENT_CONFIG[request.component];
            return (
              <div key={request.id} className={`border rounded-xl p-4 ${status.bg}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{request.id}</span>
                      <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                      <Badge className="text-red-600 bg-red-100 border border-red-200">{request.bloodGroup}</Badge>
                      <Badge className={`${comp.color} bg-white border`}>{comp.label}</Badge>
                    </div>
                    <p className="text-gray-700 mt-1">{request.patientName} — {request.unitsRequested} unit(s)</p>
                    <p className="text-sm text-gray-500">Indication: {request.clinicalIndication}</p>
                    <p className="text-xs text-gray-400">Doctor: {request.requestingDoctor} | Requested: {request.requestDate}</p>
                    {request.preTransfusionHb && (
                      <p className="text-xs text-gray-500 mt-1">Pre-transfusion Hb: {request.preTransfusionHb} g/dL</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'requested' && (
                      <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Crossmatch</button>
                    )}
                    {request.status === 'crossmatched' && (
                      <button onClick={() => {}} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg">Approve</button>
                    )}
                    {request.status === 'approved' && (
                      <button onClick={() => {}} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg">Issue</button>
                    )}
                    {request.status === 'issued' && (
                      <button onClick={() => {}} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg">Start Transfusion</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cross-Match Tab */}
      {activeTab === 'crossmatch' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Cross-Matching Protocol</h3>
          <div className="border rounded-xl p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-700 mb-2">Step 1: Sample Collection</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Collect 5mL blood in EDTA tube</li>
                    <li>• Label with patient name, MRN, date</li>
                    <li>• Two-person verification</li>
                  </ul>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="font-bold text-emerald-700 mb-2">Step 2: Antibody Screening</h4>
                  <ul className="text-sm text-emerald-600 space-y-1">
                    <li>• Test for unexpected antibodies</li>
                    <li>• If positive, identify specificity</li>
                    <li>• Select antigen-negative units</li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-bold text-amber-700 mb-2">Step 3: Major Crossmatch</h4>
                  <ul className="text-sm text-amber-600 space-y-1">
                    <li>• Donor RBC + Patient serum</li>
                    <li>• Immediate spin + AHG phase</li>
                    <li>• Check for agglutination</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-bold text-purple-700 mb-2">Step 4: Issue Blood</h4>
                  <ul className="text-sm text-purple-600 space-y-1">
                    <li>• Final verification</li>
                    <li>• Label blood unit</li>
                    <li>• Two-person bedside check</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Blood Group Distribution</h4>
            <div className="space-y-3">
              {BLOOD_GROUPS.map(group => {
                const count = BLOOD_INVENTORY.filter(u => u.bloodGroup === group).length;
                return (
                  <div key={group} className="flex items-center justify-between">
                    <span className="font-bold text-red-600">{group}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-3 bg-red-500 rounded-full" style={{ width: `${(count / BLOOD_INVENTORY.length) * 100}%` }} />
                      </div>
                      <span className="font-bold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Component Types</h4>
            <div className="space-y-3">
              {Object.entries(COMPONENT_CONFIG).map(([type, config]) => {
                const count = BLOOD_INVENTORY.filter(u => u.component === type).length;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-600">{config.icon} {config.label}</span>
                    <Badge className="bg-blue-50 text-blue-600">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Transfusion Outcomes</h4>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = TRANSFUSION_REQUESTS.filter(r => r.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-gray-600`}>{config.label}</span>
                    <Badge className={`${config.color} bg-white border`}>{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Expiry Alert</h4>
            <div className="space-y-3">
              {BLOOD_INVENTORY.filter(u => {
                const daysToExpiry = Math.ceil((new Date(u.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysToExpiry < 14 && u.status !== 'expired';
              }).map(unit => {
                const daysToExpiry = Math.ceil((new Date(unit.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={unit.id} className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-sm">{unit.unitCode} ({unit.bloodGroup})</span>
                    <Badge className="text-amber-600 bg-amber-100">{daysToExpiry} days</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
