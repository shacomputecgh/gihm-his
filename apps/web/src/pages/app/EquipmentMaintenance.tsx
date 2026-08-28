import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Input, PageHeader } from '../../components/ui';

type EquipmentTab = 'assets' | 'work-orders' | 'schedule' | 'analytics';

interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  department: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'operational' | 'maintenance' | 'out-of-service' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  totalCost: number;
  maintenanceHistory: MaintenanceRecord[];
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'calibration';
  description: string;
  cost: number;
  technician: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'EQ001', name: 'Philips Ultrasound Machine', category: 'Diagnostic', location: 'Radiology Room 1', department: 'Radiology', manufacturer: 'Philips', model: 'Affiniti 50', serialNumber: 'PH-2024-001', purchaseDate: '2024-03-15', warrantyExpiry: '2027-03-15', lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', status: 'operational', condition: 'excellent', totalCost: 185000,
    maintenanceHistory: [{ id: 'MR001', date: '2026-04-15', type: 'preventive', description: 'Routine calibration and software update. Transducer inspection.', cost: 500, technician: 'Biomed Engineering', status: 'completed' }, { id: 'MR002', date: '2026-01-10', type: 'calibration', description: 'Annual calibration and accuracy verification.', cost: 800, technician: 'Philips Service', status: 'completed' }] },
  { id: 'EQ002', name: 'Siemens CT Scanner', category: 'Imaging', location: 'CT Room', department: 'Radiology', manufacturer: 'Siemens', model: 'Somatom Scope', serialNumber: 'SM-2023-045', purchaseDate: '2023-06-01', warrantyExpiry: '2028-06-01', lastMaintenance: '2026-03-20', nextMaintenance: '2026-06-20', status: 'operational', condition: 'good', totalCost: 850000,
    maintenanceHistory: [{ id: 'MR003', date: '2026-03-20', type: 'preventive', description: 'Tube inspection, coolant check, calibration.', cost: 2500, technician: 'Siemens Service', status: 'completed' }] },
  { id: 'EQ003', name: 'Mindray Patient Monitor', category: 'Monitoring', location: 'ICU Bed 3', department: 'ICU', manufacturer: 'Mindray', model: 'iPM-12', serialNumber: 'MR-2024-112', purchaseDate: '2024-08-10', warrantyExpiry: '2027-08-10', lastMaintenance: '2026-05-01', nextMaintenance: '2026-08-01', status: 'operational', condition: 'excellent', totalCost: 12000,
    maintenanceHistory: [{ id: 'MR004', date: '2026-05-01', type: 'preventive', description: 'SpO2 sensor calibration, ECG lead check.', cost: 200, technician: 'Biomed Engineering', status: 'completed' }] },
  { id: 'EQ004', name: 'GE Ventilator', category: 'Life Support', location: 'ICU Bed 1', department: 'ICU', manufacturer: 'GE Healthcare', model: 'CARESCAPE R860', serialNumber: 'GE-2023-089', purchaseDate: '2023-09-15', warrantyExpiry: '2028-09-15', lastMaintenance: '2026-02-10', nextMaintenance: '2026-05-10', status: 'maintenance', condition: 'good', totalCost: 95000,
    maintenanceHistory: [{ id: 'MR005', date: '2026-05-20', type: 'corrective', description: 'Oxygen sensor replacement. Alarm system recalibration.', cost: 1200, technician: 'GE Service', status: 'in-progress' }, { id: 'MR006', date: '2026-02-10', type: 'preventive', description: 'Annual preventive maintenance — all systems checked.', cost: 800, technician: 'GE Service', status: 'completed' }] },
  { id: 'EQ005', name: 'Olympus Endoscope', category: 'Surgical', location: 'Theatre 2', department: 'Theatre', manufacturer: 'Olympus', model: 'EVIS EXERA III', serialNumber: 'OL-2024-023', purchaseDate: '2024-01-20', warrantyExpiry: '2027-01-20', lastMaintenance: '2026-05-15', nextMaintenance: '2026-06-15', status: 'out-of-service', condition: 'fair', totalCost: 220000,
    maintenanceHistory: [{ id: 'MR007', date: '2026-05-15', type: 'emergency', description: 'Insertion tube damage detected. Repair required — sent to Olympus service center.', cost: 8500, technician: 'Olympus Service', status: 'in-progress' }] },
  { id: 'EQ006', name: 'Roche Blood Gas Analyzer', category: 'Laboratory', location: 'Lab Main', department: 'Laboratory', manufacturer: 'Roche', model: 'cobas b 221', serialNumber: 'RC-2024-067', purchaseDate: '2024-05-01', warrantyExpiry: '2027-05-01', lastMaintenance: '2026-04-01', nextMaintenance: '2026-07-01', status: 'operational', condition: 'excellent', totalCost: 45000,
    maintenanceHistory: [{ id: 'MR008', date: '2026-04-01', type: 'preventive', description: 'Electrode replacement, quality control check, calibration.', cost: 600, technician: 'Roche Service', status: 'completed' }] },
  { id: 'EQ007', name: 'Stryker Electrosurgical Unit', category: 'Surgical', location: 'Theatre 1', department: 'Theatre', manufacturer: 'Stryker', model: 'Force Triad', serialNumber: 'ST-2023-156', purchaseDate: '2023-11-10', warrantyExpiry: '2026-11-10', lastMaintenance: '2026-03-05', nextMaintenance: '2026-06-05', status: 'operational', condition: 'good', totalCost: 35000,
    maintenanceHistory: [{ id: 'MR009', date: '2026-03-05', type: 'preventive', description: 'Output power calibration, cable inspection, foot switch check.', cost: 400, technician: 'Biomed Engineering', status: 'completed' }] },
  { id: 'EQ008', name: 'BD Infusion Pump', category: 'Life Support', location: 'Ward M-12', department: 'Medical', manufacturer: 'BD', model: 'Alaris 8100', serialNumber: 'BD-2024-234', purchaseDate: '2024-02-15', warrantyExpiry: '2027-02-15', lastMaintenance: '2026-05-10', nextMaintenance: '2026-08-10', status: 'operational', condition: 'good', totalCost: 8500,
    maintenanceHistory: [{ id: 'MR010', date: '2026-05-10', type: 'calibration', description: 'Flow rate calibration and occlusion alarm test.', cost: 150, technician: 'Biomed Engineering', status: 'completed' }] },
];

const STATUS_CONFIG = {
  operational: { label: 'Operational', tone: 'green' as const, color: 'bg-green-50 text-green-700' },
  maintenance: { label: 'Under Maintenance', tone: 'gold' as const, color: 'bg-amber-50 text-amber-700' },
  'out-of-service': { label: 'Out of Service', tone: 'red' as const, color: 'bg-red-50 text-red-700' },
  retired: { label: 'Retired', tone: 'gray' as const, color: 'bg-gray-50 text-gray-700' },
};

const CONDITION_CONFIG = {
  excellent: { label: 'Excellent', color: 'text-green-600' },
  good: { label: 'Good', color: 'text-blue-600' },
  fair: { label: 'Fair', color: 'text-amber-600' },
  poor: { label: 'Poor', color: 'text-red-600' },
};

export default function EquipmentMaintenance() {
  const [tab, setTab] = useState<EquipmentTab>('assets');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = MOCK_EQUIPMENT.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.department.toLowerCase().includes(searchTerm.toLowerCase()));

  const operational = MOCK_EQUIPMENT.filter(e => e.status === 'operational').length;
  const underMaintenance = MOCK_EQUIPMENT.filter(e => e.status === 'maintenance').length;
  const outOfService = MOCK_EQUIPMENT.filter(e => e.status === 'out-of-service').length;
  const totalValue = MOCK_EQUIPMENT.reduce((s, e) => s + e.totalCost, 0);

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
          title="Add New Maintenance Record"
          fields={[{"name":"equipmentName","label":"Equipment Name","type":"text","required":true},{"name":"equipmentId","label":"Equipment ID","type":"text"},{"name":"department","label":"Department","type":"text"},{"name":"maintenanceType","label":"Maintenance Type","type":"select","options":["Preventive","Corrective","Calibration","Emergency"]},{"name":"issueDescription","label":"Issue Description","type":"textarea"},{"name":"priority","label":"Priority","type":"select","options":["Low","Medium","High","Critical"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Equipment Maintenance" subtitle="Asset tracking, maintenance scheduling, and lifecycle management" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_EQUIPMENT.length}</div><div className="text-xs text-slate-500">Total Assets</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{operational}</div><div className="text-xs text-slate-500">Operational</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{underMaintenance + outOfService}</div><div className="text-xs text-slate-500">Not Available</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">GH₵ {(totalValue / 1000).toFixed(0)}K</div><div className="text-xs text-slate-500">Total Value</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['assets', 'work-orders', 'schedule', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'assets' ? '🏗️ Assets' : t === 'work-orders' ? '🔧 Work Orders' : t === 'schedule' ? '📅 Schedule' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Assets Tab */}
      {tab === 'assets' && (
        <div className="space-y-3">
          <Input placeholder="Search equipment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
          {filteredAssets.map(eq => {
            const statusCfg = STATUS_CONFIG[eq.status];
            const condCfg = CONDITION_CONFIG[eq.condition];
            const isExpanded = selectedAsset === eq.id;
            return (
              <Card key={eq.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedAsset(isExpanded ? null : eq.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{eq.name}</h3>
                      <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>🏭 {eq.manufacturer} {eq.model}</span>
                      <span>🏥 {eq.department}</span>
                      <span>📍 {eq.location}</span>
                      <span className={condCfg.color}>Condition: {condCfg.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">S/N: {eq.serialNumber} · Value: GH₵ {eq.totalCost.toLocaleString()}</div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Purchased</div><div className="text-xs font-bold">{eq.purchaseDate}</div></div>
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Warranty Until</div><div className="text-xs font-bold">{eq.warrantyExpiry}</div></div>
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Last Maintenance</div><div className="text-xs font-bold">{eq.lastMaintenance}</div></div>
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Next Maintenance</div><div className="text-xs font-bold text-amber-600">{eq.nextMaintenance}</div></div>
                    </div>
                    <h4 className="font-bold text-xs text-slate-600">📋 Maintenance History</h4>
                    {eq.maintenanceHistory.map(m => (
                      <div key={m.id} className={`rounded-lg p-2 text-xs ${m.status === 'in-progress' ? 'bg-amber-50' : m.type === 'emergency' ? 'bg-red-50' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Badge tone={m.type === 'emergency' ? 'red' : m.type === 'corrective' ? 'gold' : 'green'}>{m.type.toUpperCase()}</Badge>
                          <span className="text-slate-400">{m.date}</span>
                          <span className={m.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>{m.status}</span>
                        </div>
                        <p className="mt-1 text-slate-600">{m.description}</p>
                        <div className="mt-1 text-[10px] text-slate-400">Cost: GH₵ {m.cost} · Technician: {m.technician}</div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs">🔧 Schedule Maintenance</Button>
                      <Button className="bg-amber-600 hover:bg-amber-700 text-xs">📋 Create Work Order</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Work Orders Tab */}
      {tab === 'work-orders' && (
        <div className="space-y-3">
          {MOCK_EQUIPMENT.filter(e => e.maintenanceHistory.some(m => m.status === 'in-progress')).map(eq => {
            const activeOrder = eq.maintenanceHistory.find(m => m.status === 'in-progress')!;
            return (
              <Card key={eq.id} className="p-4 border-l-4 border-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔧</span>
                  <h3 className="font-bold text-slate-800">{eq.name}</h3>
                  <Badge tone="gold">IN PROGRESS</Badge>
                </div>
                <p className="text-xs text-slate-600">{activeOrder.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
                  <span>📅 {activeOrder.date}</span>
                  <span>👨‍🔧 {activeOrder.technician}</span>
                  <span>💰 GH₵ {activeOrder.cost}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Complete</Button>
                  <Button className="bg-slate-100 text-slate-700 text-xs">📝 Update Status</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <Card className="p-4">
          <h3 className="font-bold text-sm text-slate-700 mb-3">📅 Upcoming Maintenance Schedule</h3>
          <div className="space-y-2">
            {MOCK_EQUIPMENT.sort((a, b) => a.nextMaintenance.localeCompare(b.nextMaintenance)).map(eq => (
              <div key={eq.id} className="flex items-center justify-between rounded-lg border p-2">
                <div>
                  <span className="font-medium text-xs">{eq.name}</span>
                  <span className="ml-2 text-[10px] text-slate-400">· {eq.department}</span>
                </div>
                <div className="text-xs font-bold text-amber-600">{eq.nextMaintenance}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🏗️ Assets by Department</h3>
            {[...new Set(MOCK_EQUIPMENT.map(e => e.department))].map(dept => {
              const count = MOCK_EQUIPMENT.filter(e => e.department === dept).length;
              const value = MOCK_EQUIPMENT.filter(e => e.department === dept).reduce((s, e) => s + e.totalCost, 0);
              return (
                <div key={dept} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-xs text-slate-600">{dept} ({count})</span>
                  <span className="text-xs font-bold">GH₵ {value.toLocaleString()}</span>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Asset Condition</h3>
            {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => {
              const count = MOCK_EQUIPMENT.filter(e => e.condition === key).length;
              const pct = (count / MOCK_EQUIPMENT.length) * 100;
              return (
                <div key={key} className="mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cfg.color}>{cfg.label}</span>
                    <span className="font-bold">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
