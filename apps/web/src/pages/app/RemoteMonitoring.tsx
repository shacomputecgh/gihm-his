import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type MonitoringStatus = 'normal' | 'warning' | 'critical' | 'offline';
type DeviceType = 'bp_monitor' | 'glucometer' | 'pulse_oximeter' | 'weight_scale' | 'thermometer' | 'ecg';

interface MonitoredPatient {
  id: string;
  patientName: string;
  patientId: string;
  condition: string;
  status: MonitoringStatus;
  lastReading: string;
  lastReadingTime: string;
  devices: DeviceReading[];
  alerts: Alert[];
  assignedNurse: string;
}

interface DeviceReading {
  deviceType: DeviceType;
  value: string;
  unit: string;
  timestamp: string;
  normalRange: string;
  flag: 'normal' | 'high' | 'low';
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  acknowledged: boolean;
}

const DEVICE_CONFIG: Record<DeviceType, { label: string; icon: string; color: string }> = {
  bp_monitor: { label: 'BP Monitor', icon: '❤️', color: 'text-red-600' },
  glucometer: { label: 'Glucometer', icon: '🩸', color: 'text-amber-600' },
  pulse_oximeter: { label: 'Pulse Oximeter', icon: '💙', color: 'text-blue-600' },
  weight_scale: { label: 'Weight Scale', icon: '⚖️', color: 'text-purple-600' },
  thermometer: { label: 'Thermometer', icon: '🌡️', color: 'text-orange-600' },
  ecg: { label: 'ECG Monitor', icon: '📊', color: 'text-indigo-600' }
};

const STATUS_CONFIG: Record<MonitoringStatus, { label: string; color: string; bg: string; icon: string }> = {
  normal: { label: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
  warning: { label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50', icon: '⚠️' },
  critical: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', icon: '🚨' },
  offline: { label: 'Offline', color: 'text-gray-600', bg: 'bg-gray-50', icon: '📵' }
};

const MONITORED_PATIENTS: MonitoredPatient[] = [
  {
    id: 'MP001', patientName: 'Kwame Mensah', patientId: 'P001', condition: 'Hypertension',
    status: 'normal', lastReading: '130/85 mmHg', lastReadingTime: '2024-01-16 09:00',
    assignedNurse: 'Nurse Ama',
    devices: [
      { deviceType: 'bp_monitor', value: '130/85', unit: 'mmHg', timestamp: '09:00', normalRange: '<140/90', flag: 'normal' },
      { deviceType: 'weight_scale', value: '78.5', unit: 'kg', timestamp: '09:00', normalRange: '75-85', flag: 'normal' }
    ],
    alerts: []
  },
  {
    id: 'MP002', patientName: 'Ama Darko', patientId: 'P002', condition: 'Diabetes Type 2',
    status: 'warning', lastReading: '185 mg/dL', lastReadingTime: '2024-01-16 08:30',
    assignedNurse: 'Nurse Kofi',
    devices: [
      { deviceType: 'glucometer', value: '185', unit: 'mg/dL', timestamp: '08:30', normalRange: '80-140', flag: 'high' },
      { deviceType: 'weight_scale', value: '82.0', unit: 'kg', timestamp: '08:30', normalRange: '70-80', flag: 'high' }
    ],
    alerts: [
      { id: 'A1', type: 'warning', message: 'Blood glucose above target range', time: '08:35', acknowledged: false }
    ]
  },
  {
    id: 'MP003', patientName: 'Nana Kwame', patientId: 'P014', condition: 'Heart Failure',
    status: 'critical', lastReading: 'SpO2 88%', lastReadingTime: '2024-01-16 09:15',
    assignedNurse: 'Nurse Critical',
    devices: [
      { deviceType: 'pulse_oximeter', value: '88', unit: '%', timestamp: '09:15', normalRange: '>95%', flag: 'low' },
      { deviceType: 'bp_monitor', value: '95/60', unit: 'mmHg', timestamp: '09:15', normalRange: '100-140/60-90', flag: 'low' },
      { deviceType: 'weight_scale', value: '95.0', unit: 'kg', timestamp: '08:00', normalRange: '85-90', flag: 'high' }
    ],
    alerts: [
      { id: 'A2', type: 'critical', message: 'SpO2 below 90% - immediate attention required', time: '09:15', acknowledged: false },
      { id: 'A3', type: 'warning', message: 'Weight gain 2kg in 24h - fluid retention', time: '08:00', acknowledged: false }
    ]
  },
  {
    id: 'MP004', patientName: 'Abena Boateng', patientId: 'P015', condition: 'Asthma',
    status: 'normal', lastReading: 'SpO2 98%', lastReadingTime: '2024-01-16 08:45',
    assignedNurse: 'Nurse Esi',
    devices: [
      { deviceType: 'pulse_oximeter', value: '98', unit: '%', timestamp: '08:45', normalRange: '>95%', flag: 'normal' },
      { deviceType: 'thermometer', value: '36.6', unit: '°C', timestamp: '08:45', normalRange: '36.1-37.2', flag: 'normal' }
    ],
    alerts: []
  },
  {
    id: 'MP005', patientName: 'Kofi Amoako', patientId: 'P006', condition: 'COPD',
    status: 'offline', lastReading: 'SpO2 92%', lastReadingTime: '2024-01-15 22:00',
    assignedNurse: 'Nurse Ama',
    devices: [
      { deviceType: 'pulse_oximeter', value: '92', unit: '%', timestamp: '22:00', normalRange: '>92%', flag: 'normal' }
    ],
    alerts: [
      { id: 'A4', type: 'info', message: 'Device offline since 22:00', time: '22:00', acknowledged: true }
    ]
  }
];

export default function RemoteMonitoring() {
  const [activeTab, setActiveTab] = useState<'patients' | 'alerts' | 'analytics'>('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const stats = {
    total: MONITORED_PATIENTS.length,
    normal: MONITORED_PATIENTS.filter(p => p.status === 'normal').length,
    warning: MONITORED_PATIENTS.filter(p => p.status === 'warning').length,
    critical: MONITORED_PATIENTS.filter(p => p.status === 'critical').length,
    totalAlerts: MONITORED_PATIENTS.reduce((sum, p) => sum + p.alerts.filter(a => !a.acknowledged).length, 0)
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
          title="Add New Remote Monitoring Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Monitored Condition","type":"select","options":["Hypertension","Diabetes","Heart Failure","COPD","Post-Surgical","Pregnancy","Other"]},{"name":"device","label":"Device Type","type":"select","options":["BP Monitor","Glucose Monitor","Pulse Oximeter","Weight Scale","ECG Monitor"]},{"name":"frequency","label":"Check Frequency","type":"select","options":["Daily","Twice Daily","Weekly","Monthly"]},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Remote Patient Monitoring</h1>
          <p className="text-gray-500">Telehealth and chronic condition monitoring</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Enroll Patient</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Monitored', value: stats.total, color: 'bg-blue-500' },
          { label: 'Normal', value: stats.normal, color: 'bg-emerald-500' },
          { label: 'Warning', value: stats.warning, color: 'bg-amber-500' },
          { label: 'Critical', value: stats.critical, color: 'bg-red-500' },
          { label: 'Active Alerts', value: stats.totalAlerts, color: 'bg-purple-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['patients', 'alerts', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'patients' ? 'Patients' : tab === 'alerts' ? 'Alerts' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-3">
          {MONITORED_PATIENTS.sort((a, b) => {
            const order: Record<MonitoringStatus, number> = { critical: 0, warning: 1, normal: 2, offline: 3 };
            return order[a.status] - order[b.status];
          }).map(patient => {
            const status = STATUS_CONFIG[patient.status];
            const isSelected = selectedPatient === patient.id;
            return (
              <div key={patient.id}
                className={`border ${status.bg} rounded-xl p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-300' : 'hover:shadow-md'}`}
                onClick={() => setSelectedPatient(isSelected ? null : patient.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{status.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{patient.patientName}</span>
                        <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{patient.condition} | Last: {patient.lastReading}</p>
                      <p className="text-xs text-gray-400">{patient.lastReadingTime} | Nurse: {patient.assignedNurse}</p>
                    </div>
                  </div>
                  {patient.alerts.filter(a => !a.acknowledged).length > 0 && (
                    <Badge className="text-red-600 bg-red-100 border border-red-200">
                      {patient.alerts.filter(a => !a.acknowledged).length} alerts
                    </Badge>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <h4 className="font-bold text-sm">Device Readings</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {patient.devices.map((device, idx) => {
                        const deviceConfig = DEVICE_CONFIG[device.deviceType];
                        return (
                          <div key={idx} className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{deviceConfig.icon}</span>
                              <span className="text-xs font-medium">{deviceConfig.label}</span>
                            </div>
                            <p className={`text-lg font-bold mt-1 ${device.flag === 'normal' ? 'text-emerald-600' : device.flag === 'high' ? 'text-red-600' : 'text-blue-600'}`}>
                              {device.value} {device.unit}
                            </p>
                            <p className="text-xs text-gray-400">Normal: {device.normalRange}</p>
                            <p className="text-xs text-gray-400">{device.timestamp}</p>
                          </div>
                        );
                      })}
                    </div>

                    {patient.alerts.filter(a => !a.acknowledged).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm">Active Alerts</h4>
                        {patient.alerts.filter(a => !a.acknowledged).map(alert => (
                          <div key={alert.id} className={`p-2 rounded-lg border ${
                            alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                            alert.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <p className={`text-sm font-medium ${alert.type === 'critical' ? 'text-red-600' : alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                              {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'} {alert.message}
                            </p>
                            <p className="text-xs text-gray-400">{alert.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {MONITORED_PATIENTS.flatMap(p => p.alerts.map(a => ({ ...a, patientName: p.patientName, patientCondition: p.condition })))
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, info: 2 };
              return order[a.type] - order[b.type];
            })
            .map(alert => (
              <div key={alert.id} className={`border rounded-xl p-4 ${
                alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                      <span className="font-bold">{alert.patientName}</span>
                      <Badge className={alert.type === 'critical' ? 'text-red-600 bg-red-100' : alert.type === 'warning' ? 'text-amber-600 bg-amber-100' : 'text-blue-600 bg-blue-100'}>
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.time} | {alert.patientCondition}</p>
                  </div>
                  {!alert.acknowledged && (
                    <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Acknowledge</button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Patient Status Distribution</h4>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = MONITORED_PATIENTS.filter(p => p.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-600">{config.icon} {config.label}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Conditions Monitored</h4>
            <div className="space-y-3">
              {Object.entries(MONITORED_PATIENTS.reduce<Record<string, number>>((acc, p) => {
                acc[p.condition] = (acc[p.condition] || 0) + 1;
                return acc;
              }, {})).map(([condition, count]) => (
                <div key={condition} className="flex items-center justify-between">
                  <span className="text-gray-600">{condition}</span>
                  <Badge className="bg-blue-50 text-blue-600">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
