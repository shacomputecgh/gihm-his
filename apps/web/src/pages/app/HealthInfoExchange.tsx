import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type ExchangeStatus = 'pending' | 'approved' | 'sent' | 'received' | 'acknowledged' | 'rejected';
type DataType = 'referral' | 'lab_results' | 'imaging' | 'discharge_summary' | 'medication' | 'allergy' | 'vaccination';

interface ExchangeRecord {
  id: string;
  patientName: string;
  patientId: string;
  fromFacility: string;
  toFacility: string;
  dataType: DataType;
  status: ExchangeStatus;
  requestDate: string;
  sentDate?: string;
  receivedDate?: string;
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  priority: 'routine' | 'urgent' | 'stat';
}

const DATA_TYPE_CONFIG: Record<DataType, { label: string; icon: string; color: string }> = {
  referral: { label: 'Referral', icon: '🔄', color: 'text-blue-600' },
  lab_results: { label: 'Lab Results', icon: '🔬', color: 'text-cyan-600' },
  imaging: { label: 'Imaging', icon: '📷', color: 'text-indigo-600' },
  discharge_summary: { label: 'Discharge Summary', icon: '📋', color: 'text-emerald-600' },
  medication: { label: 'Medication', icon: '💊', color: 'text-purple-600' },
  allergy: { label: 'Allergy', icon: '⚠️', color: 'text-amber-600' },
  vaccination: { label: 'Vaccination', icon: '💉', color: 'text-pink-600' }
};

const STATUS_CONFIG: Record<ExchangeStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
  approved: { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-50' },
  sent: { label: 'Sent', color: 'text-purple-600', bg: 'bg-purple-50' },
  received: { label: 'Received', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  acknowledged: { label: 'Acknowledged', color: 'text-green-600', bg: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50' }
};

const MOCK_EXCHANGES: ExchangeRecord[] = [
  {
    id: 'EX001', patientName: 'Kwame Mensah', patientId: 'P001',
    fromFacility: 'Korle Bu Teaching Hospital', toFacility: 'ShaComputeC Hospital',
    dataType: 'referral', status: 'received', requestDate: '2024-01-15',
    sentDate: '2024-01-15', receivedDate: '2024-01-15', requestedBy: 'Dr. Accra General',
    approvedBy: 'Dr. Osei', priority: 'routine', notes: 'Referred for cardiac surgery evaluation'
  },
  {
    id: 'EX002', patientName: 'Ama Darko', patientId: 'P002',
    fromFacility: 'ShaComputeC Hospital', toFacility: '37 Military Hospital',
    dataType: 'lab_results', status: 'sent', requestDate: '2024-01-16',
    sentDate: '2024-01-16', requestedBy: 'Dr. Kofi Asante', approvedBy: 'Dr. Osei', priority: 'routine',
    notes: 'Sending HIV viral load results for joint care'
  },
  {
    id: 'EX003', patientName: 'Yaw Boateng', patientId: 'P003',
    fromFacility: 'Ridge Hospital', toFacility: 'ShaComputeC Hospital',
    dataType: 'imaging', status: 'pending', requestDate: '2024-01-16',
    requestedBy: 'Dr. Ridge General', priority: 'urgent',
    notes: 'Requesting CT scan images for surgical planning'
  },
  {
    id: 'EX004', patientName: 'Efua Ansah', patientId: 'P004',
    fromFacility: 'ShaComputeC Hospital', toFacility: 'Komfo Anokye Teaching Hospital',
    dataType: 'discharge_summary', status: 'approved', requestDate: '2024-01-16',
    requestedBy: 'Dr. Nana Agyeman', approvedBy: 'Dr. Osei', priority: 'routine',
    notes: 'Discharge summary for ongoing oncology care'
  },
  {
    id: 'EX005', patientName: 'Abena Pokua', patientId: 'P005',
    fromFacility: 'Tamale Teaching Hospital', toFacility: 'ShaComputeC Hospital',
    dataType: 'medication', status: 'acknowledged', requestDate: '2024-01-14',
    sentDate: '2024-01-14', receivedDate: '2024-01-14', requestedBy: 'Dr. Northern General',
    approvedBy: 'Dr. Osei', priority: 'routine', notes: 'ARV medication history for continuity of care'
  },
  {
    id: 'EX006', patientName: 'Kofi Amoako', patientId: 'P006',
    fromFacility: 'ShaComputeC Hospital', toFacility: 'Cape Coast Teaching Hospital',
    dataType: 'allergy', status: 'rejected', requestDate: '2024-01-16',
    requestedBy: 'Dr. Akua Osei', priority: 'routine', notes: 'Patient consent not obtained for data sharing'
  }
];

const FACILITIES = [
  'ShaComputeC Hospital',
  'Korle Bu Teaching Hospital',
  '37 Military Hospital',
  'Ridge Hospital',
  'Komfo Anokye Teaching Hospital',
  'Tamale Teaching Hospital',
  'Cape Coast Teaching Hospital',
  'Ho Teaching Hospital',
  'Bolgatanga Regional Hospital',
  'Sunyani Regional Hospital'
];

export default function HealthInfoExchange() {
  const [activeTab, setActiveTab] = useState<'exchanges' | 'facilities' | 'analytics'>('exchanges');
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const filtered = MOCK_EXCHANGES.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (directionFilter === 'incoming' && e.toFacility !== 'ShaComputeC Hospital') return false;
    if (directionFilter === 'outgoing' && e.fromFacility !== 'ShaComputeC Hospital') return false;
    return true;
  });

  const stats = {
    total: MOCK_EXCHANGES.length,
    incoming: MOCK_EXCHANGES.filter(e => e.toFacility === 'ShaComputeC Hospital').length,
    outgoing: MOCK_EXCHANGES.filter(e => e.fromFacility === 'ShaComputeC Hospital').length,
    pending: MOCK_EXCHANGES.filter(e => e.status === 'pending').length
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
          title="Add New Exchange Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Information Exchange</h1>
          <p className="text-gray-500">Secure inter-facility patient data sharing</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Exchange</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Exchanges', value: stats.total, color: 'bg-blue-500' },
          { label: 'Incoming', value: stats.incoming, color: 'bg-emerald-500' },
          { label: 'Outgoing', value: stats.outgoing, color: 'bg-purple-500' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['exchanges', 'facilities', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'exchanges' ? 'Exchanges' : tab === 'facilities' ? 'Connected Facilities' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Exchanges Tab */}
      {activeTab === 'exchanges' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select value={directionFilter} onChange={e => setDirectionFilter(e.target.value as 'all' | 'incoming' | 'outgoing')}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Directions</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ExchangeStatus | 'all')}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([s, c]) => <option key={s} value={s}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map(exchange => {
              const dataType = DATA_TYPE_CONFIG[exchange.dataType];
              const status = STATUS_CONFIG[exchange.status];
              const isIncoming = exchange.toFacility === 'ShaComputeC Hospital';
              return (
                <div key={exchange.id} className={`border rounded-xl p-4 ${status.bg}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dataType.icon}</span>
                        <span className="font-bold">{exchange.id}</span>
                        <Badge className={`${dataType.color} bg-white border`}>{dataType.label}</Badge>
                        <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                        {exchange.priority === 'urgent' && <Badge className="text-red-600 bg-red-100 border border-red-200">Urgent</Badge>}
                      </div>
                      <p className="text-gray-700 mt-1">{exchange.patientName}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{isIncoming ? '📥' : '📤'} {exchange.fromFacility}</span>
                        <span className="text-gray-400">→</span>
                        <span>{isIncoming ? '📥' : '📤'} {exchange.toFacility}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Requested by: {exchange.requestedBy} | {exchange.requestDate}
                        {exchange.notes && ` | ${exchange.notes}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {exchange.status === 'pending' && (
                        <button onClick={() => {}} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg">Approve</button>
                      )}
                      {exchange.status === 'approved' && (
                        <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Send</button>
                      )}
                      {exchange.status === 'received' && (
                        <button onClick={() => {}} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg">Acknowledge</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Facilities Tab */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-2 gap-4">
          {FACILITIES.map(facility => {
            const isHome = facility === 'ShaComputeC Hospital';
            const exchanges = MOCK_EXCHANGES.filter(e => e.fromFacility === facility || e.toFacility === facility);
            return (
              <div key={facility} className={`border rounded-xl p-4 ${isHome ? 'bg-blue-50 border-blue-200' : 'hover:shadow-md'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏥</span>
                      <span className="font-bold">{facility}</span>
                      {isHome && <Badge className="text-blue-600 bg-blue-100 border border-blue-200">Home</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{exchanges.length} exchange(s)</p>
                  </div>
                  <Badge className="text-emerald-600 bg-emerald-50">Connected</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Exchange by Data Type</h4>
            <div className="space-y-3">
              {Object.entries(DATA_TYPE_CONFIG).map(([type, config]) => {
                const count = MOCK_EXCHANGES.filter(e => e.dataType === type).length;
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
            <h4 className="font-bold mb-4">Exchange Status</h4>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = MOCK_EXCHANGES.filter(e => e.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-600">{config.label}</span>
                    <Badge className={`${config.color} bg-white border`}>{count}</Badge>
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
