import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type AssetStatus = 'operational' | 'maintenance' | 'out_of_service' | 'decommissioned';
type BuildingStatus = 'active' | 'renovation' | 'closed';

interface Building {
  id: string;
  name: string;
  type: string;
  floors: number;
  status: BuildingStatus;
  departments: string[];
  capacity: number;
  currentOccupancy: number;
  lastInspection: string;
  nextInspection: string;
  manager: string;
}

interface FacilityAsset {
  id: string;
  name: string;
  category: string;
  location: string;
  building: string;
  status: AssetStatus;
  purchaseDate: string;
  warrantyExpiry: string;
  lastMaintenance: string;
  nextMaintenance: string;
  value: number;
  serialNumber: string;
  manufacturer: string;
}

interface UtilityService {
  name: string;
  status: 'normal' | 'warning' | 'critical';
  usage: number;
  capacity: number;
  unit: string;
  lastReading: string;
  trend: 'up' | 'down' | 'stable';
}

const BUILDINGS: Building[] = [
  {
    id: 'BLD001', name: 'Main Hospital Block', type: 'Clinical', floors: 5, status: 'active',
    departments: ['Emergency', 'OPD', 'Surgery', 'ICU', 'Radiology', 'Laboratory', 'Pharmacy'],
    capacity: 200, currentOccupancy: 165, lastInspection: '2024-01-10', nextInspection: '2024-04-10',
    manager: 'Mr. Kwadwo Asare'
  },
  {
    id: 'BLD002', name: 'Medical Ward Block', type: 'Inpatient', floors: 4, status: 'active',
    departments: ['Medical Ward', 'Surgical Ward', 'Paediatric Ward'],
    capacity: 150, currentOccupancy: 120, lastInspection: '2024-01-08', nextInspection: '2024-04-08',
    manager: 'Mrs. Abena Mensah'
  },
  {
    id: 'BLD003', name: 'Maternity Wing', type: 'Specialized', floors: 3, status: 'active',
    departments: ['Labour Ward', 'Postnatal Ward', 'ANC Clinic', 'NICU'],
    capacity: 60, currentOccupancy: 42, lastInspection: '2024-01-05', nextInspection: '2024-04-05',
    manager: 'Dr. Nana Agyeman'
  },
  {
    id: 'BLD004', name: 'Administrative Block', type: 'Administrative', floors: 2, status: 'active',
    departments: ['Finance', 'HR', 'IT', 'Quality', ' Records'],
    capacity: 50, currentOccupancy: 35, lastInspection: '2024-01-12', nextInspection: '2024-04-12',
    manager: 'Mr. Kofi Asante'
  },
  {
    id: 'BLD005', name: 'New Outpatient Block', type: 'Clinical', floors: 3, status: 'renovation',
    departments: ['Dental', 'Eye Clinic', 'ENT Clinic'],
    capacity: 80, currentOccupancy: 0, lastInspection: '2023-12-01', nextInspection: '2024-03-01',
    manager: 'Mr. Emmanuel Boateng'
  }
];

const FACILITY_ASSETS: FacilityAsset[] = [
  { id: 'A001', name: 'CT Scanner (Siemens)', category: 'Imaging', location: 'Radiology', building: 'Main Hospital Block', status: 'operational', purchaseDate: '2020-06-15', warrantyExpiry: '2025-06-15', lastMaintenance: '2024-01-05', nextMaintenance: '2024-04-05', value: 450000, serialNumber: 'CT-SI-2020-001', manufacturer: 'Siemens Healthineers' },
  { id: 'A002', name: 'MRI Machine (GE)', category: 'Imaging', location: 'Radiology', building: 'Main Hospital Block', status: 'operational', purchaseDate: '2019-03-20', warrantyExpiry: '2024-03-20', lastMaintenance: '2024-01-08', nextMaintenance: '2024-04-08', value: 680000, serialNumber: 'MRI-GE-2019-001', manufacturer: 'GE Healthcare' },
  { id: 'A003', name: 'Ventilator (Dräger)', category: 'Critical Care', location: 'ICU', building: 'Main Hospital Block', status: 'operational', purchaseDate: '2021-09-10', warrantyExpiry: '2026-09-10', lastMaintenance: '2024-01-12', nextMaintenance: '2024-04-12', value: 25000, serialNumber: 'VNT-DR-2021-001', manufacturer: 'Dräger Medical' },
  { id: 'A004', name: 'Anaesthesia Machine', category: 'Surgical', location: 'Theatre 1', building: 'Main Hospital Block', status: 'maintenance', purchaseDate: '2018-11-05', warrantyExpiry: '2023-11-05', lastMaintenance: '2023-12-15', nextMaintenance: '2024-01-15', value: 35000, serialNumber: 'AN-DF-2018-001', manufacturer: 'Dräger Fabius' },
  { id: 'A005', name: 'Blood Gas Analyser', category: 'Laboratory', location: 'Main Lab', building: 'Main Hospital Block', status: 'operational', purchaseDate: '2022-04-20', warrantyExpiry: '2025-04-20', lastMaintenance: '2024-01-10', nextMaintenance: '2024-04-10', value: 45000, serialNumber: 'BGA-RM-2022-001', manufacturer: 'Roche Diagnostics' },
  { id: 'A006', name: 'Patient Monitor (Philips)', category: 'Critical Care', location: 'ICU', building: 'Main Hospital Block', status: 'out_of_service', purchaseDate: '2017-08-10', warrantyExpiry: '2022-08-10', lastMaintenance: '2023-06-20', nextMaintenance: 'N/A', value: 8000, serialNumber: 'PM-PH-2017-001', manufacturer: 'Philips Healthcare' },
  { id: 'A007', name: 'X-Ray Machine', category: 'Imaging', location: 'Radiology', building: 'Main Hospital Block', status: 'operational', purchaseDate: '2021-01-15', warrantyExpiry: '2026-01-15', lastMaintenance: '2024-01-02', nextMaintenance: '2024-07-02', value: 120000, serialNumber: 'XR-CZ-2021-001', manufacturer: 'Carestream Health' },
  { id: 'A008', name: 'Ultrasound Machine', category: 'Imaging', location: 'OPD', building: 'Main Hospital Block', status: 'operational', purchaseDate: '2022-07-25', warrantyExpiry: '2025-07-25', lastMaintenance: '2024-01-08', nextMaintenance: '2024-04-08', value: 55000, serialNumber: 'US-GE-2022-001', manufacturer: 'GE Healthcare' }
];

const UTILITIES: UtilityService[] = [
  { name: 'Electricity (Grid)', status: 'normal', usage: 850, capacity: 1200, unit: 'kVA', lastReading: '2024-01-16 08:00', trend: 'stable' },
  { name: 'Generator (Backup)', status: 'normal', usage: 0, capacity: 500, unit: 'kVA', lastReading: '2024-01-16 08:00', trend: 'down' },
  { name: 'Water Supply', status: 'warning', usage: 45000, capacity: 50000, unit: 'Litres/day', lastReading: '2024-01-16 07:00', trend: 'up' },
  { name: 'Oxygen Supply', status: 'normal', usage: 120, capacity: 200, unit: 'Cylinders/day', lastReading: '2024-01-16 08:00', trend: 'stable' },
  { name: 'Medical Gas (Nitrous)', status: 'normal', usage: 15, capacity: 50, unit: 'Cylinders/day', lastReading: '2024-01-16 08:00', trend: 'down' },
  { name: 'HVAC System', status: 'critical', usage: 95, capacity: 100, unit: '% Capacity', lastReading: '2024-01-16 08:00', trend: 'up' }
];

const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  operational: { label: 'Operational', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  maintenance: { label: 'Under Maintenance', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  out_of_service: { label: 'Out of Service', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  decommissioned: { label: 'Decommissioned', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
};

const UTIL_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  normal: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50' },
  critical: { color: 'text-red-600', bg: 'bg-red-50' }
};

export default function FacilityManagement() {
  const [activeTab, setActiveTab] = useState<'buildings' | 'assets' | 'utilities' | 'analytics'>('buildings');
  const [selectedBuilding] = useState<string | null>(null);

  const stats = {
    buildings: BUILDINGS.length,
    assets: FACILITY_ASSETS.length,
    operational: FACILITY_ASSETS.filter(a => a.status === 'operational').length,
    maintenance: FACILITY_ASSETS.filter(a => a.status === 'maintenance' || a.status === 'out_of_service').length,
    totalValue: FACILITY_ASSETS.reduce((sum, a) => sum + a.value, 0)
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
          title="Add New Facility"
          fields={[{"name":"facilityName","label":"Facility Name","type":"text","required":true},{"name":"facilityType","label":"Facility Type","type":"select","options":["Teaching Hospital","Regional Hospital","District Hospital","Health Centre","CHPS Compound","Polyclinic","Private Hospital","Clinic"]},{"name":"region","label":"Region","type":"select","options":["Greater Accra","Ashanti","Western","Northern","Central","Eastern","Volta","Upper East","Upper West","Brong Ahafo","Western North","Ahafo","Bono East","Oti","Savannah","North East"]},{"name":"district","label":"District","type":"text"},{"name":"phone","label":"Phone","type":"tel"},{"name":"email","label":"Email","type":"email"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facility Management</h1>
          <p className="text-gray-500">Buildings, assets, utilities, and infrastructure tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Building</button>
          <button onClick={() => {}} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">+ New Asset</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Buildings', value: stats.buildings, color: 'bg-blue-500' },
          { label: 'Total Assets', value: stats.assets, color: 'bg-indigo-500' },
          { label: 'Operational', value: stats.operational, color: 'bg-emerald-500' },
          { label: 'Maintenance', value: stats.maintenance, color: 'bg-amber-500' },
          { label: 'Asset Value', value: `GH₵ ${(stats.totalValue / 1000).toFixed(0)}K`, color: 'bg-purple-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['buildings', 'assets', 'utilities', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'buildings' ? 'Buildings' : tab === 'assets' ? 'Assets' : tab === 'utilities' ? 'Utilities' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Buildings Tab */}
      {activeTab === 'buildings' && (
        <div className="grid grid-cols-2 gap-4">
          {BUILDINGS.map(building => {
            const occupancyPercent = (building.currentOccupancy / building.capacity) * 100;
            return (
              <div key={building.id}
                className={`border rounded-xl p-5 transition-all ${selectedBuilding === building.id ? 'ring-2 ring-blue-300 bg-blue-50' : 'hover:shadow-md'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{building.name}</h3>
                    <p className="text-sm text-gray-500">{building.type} | {building.floors} floors</p>
                  </div>
                  <Badge className={building.status === 'active' ? 'text-emerald-600 bg-emerald-50' : building.status === 'renovation' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'}>
                    {building.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Occupancy</span>
                      <span className="font-bold">{building.currentOccupancy}/{building.capacity}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-3 rounded-full ${occupancyPercent > 90 ? 'bg-red-500' : occupancyPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${occupancyPercent}%` }} />
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1">Departments:</p>
                    <div className="flex flex-wrap gap-1">
                      {building.departments.map(d => (
                        <Badge key={d} className="bg-blue-50 text-blue-600 text-xs">{d}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                    <span>Manager: {building.manager}</span>
                    <span>Next Inspection: {building.nextInspection}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-3">
          {FACILITY_ASSETS.map(asset => {
            const statusConfig = ASSET_STATUS_CONFIG[asset.status];
            const daysUntilMaintenance = asset.nextMaintenance !== 'N/A'
              ? Math.ceil((new Date(asset.nextMaintenance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : -1;
            return (
              <div key={asset.id} className={`border ${statusConfig.bg} rounded-xl p-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{asset.name}</span>
                      <Badge className={`${statusConfig.color} bg-white border`}>{statusConfig.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{asset.location} | {asset.building}</p>
                    <p className="text-xs text-gray-400">S/N: {asset.serialNumber} | {asset.manufacturer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">GH₵ {asset.value.toLocaleString()}</p>
                    {daysUntilMaintenance > 0 && daysUntilMaintenance < 30 && (
                      <Badge className="text-amber-600 bg-amber-50 text-xs">Maintenance in {daysUntilMaintenance} days</Badge>
                    )}
                    {daysUntilMaintenance < 0 && (
                      <Badge className="text-red-600 bg-red-50 text-xs">Overdue maintenance</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Purchased: {asset.purchaseDate}</span>
                  <span>Warranty: {asset.warrantyExpiry}</span>
                  <span>Last Service: {asset.lastMaintenance}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Utilities Tab */}
      {activeTab === 'utilities' && (
        <div className="grid grid-cols-2 gap-4">
          {UTILITIES.map(util => {
            const utilStatus = UTIL_STATUS_CONFIG[util.status] ?? { color: 'text-gray-600', bg: 'bg-gray-50' };
            const usagePercent = (util.usage / util.capacity) * 100;
            return (
              <div key={util.name} className={`border rounded-xl p-5 ${utilStatus.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{util.name}</h3>
                    <p className="text-sm text-gray-500">Last Reading: {util.lastReading}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{util.trend === 'up' ? '📈' : util.trend === 'down' ? '📉' : '➡️'}</span>
                    <Badge className={`${utilStatus.color} bg-white border`}>{util.status}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Usage</span>
                    <span className="font-bold">{util.usage} / {util.capacity} {util.unit}</span>
                  </div>
                  <div className="w-full h-4 bg-white rounded-full overflow-hidden border">
                    <div className={`h-4 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${usagePercent}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 text-right">{usagePercent.toFixed(1)}% utilized</p>
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
            <h4 className="font-bold mb-4">Asset Categories</h4>
            <div className="space-y-3">
              {Object.entries(FACILITY_ASSETS.reduce<Record<string, number>>((acc, a) => {
                acc[a.category] = (acc[a.category] || 0) + a.value;
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).map(([cat, value]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-bold">GH₵ {value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Building Occupancy</h4>
            <div className="space-y-3">
              {BUILDINGS.map(b => {
                const pct = (b.currentOccupancy / b.capacity) * 100;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{b.name}</span>
                      <span className="font-bold">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-2 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Maintenance Schedule</h4>
            <div className="space-y-3">
              {FACILITY_ASSETS.filter(a => a.nextMaintenance !== 'N/A').map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{a.name}</span>
                  <span className="font-medium">{a.nextMaintenance}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Warranty Status</h4>
            <div className="space-y-3">
              {FACILITY_ASSETS.map(a => {
                const expired = new Date(a.warrantyExpiry) < new Date();
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{a.name}</span>
                    <Badge className={expired ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}>
                      {expired ? 'Expired' : `Until ${a.warrantyExpiry}`}
                    </Badge>
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
