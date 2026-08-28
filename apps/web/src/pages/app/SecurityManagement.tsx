import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface SecurityIncident {
  id: string; title: string; location: string; date: string; time: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  reportedBy: string; description: string;
}

interface AccessPoint {
  id: string; location: string; type: string;
  status: 'Operational' | 'Maintenance' | 'Offline';
  lastChecked: string;
}

const INCIDENTS: SecurityIncident[] = [
  { id: 'SI-001', title: 'Unauthorised Access — Pharmacy', location: 'Pharmacy Store', date: '2026-08-23', time: '02:30', severity: 'Critical', status: 'Investigating', reportedBy: 'Security Guard Samuel', description: 'Motion sensor triggered at 2:30 AM. CCTV shows unknown individual near pharmacy store. Locks intact. Under investigation.' },
  { id: 'SI-002', title: 'Visitor Policy Violation', location: 'ICU Ward', date: '2026-08-24', time: '14:00', severity: 'Medium', status: 'Resolved', reportedBy: 'Nurse Abena', description: 'Visitor exceeded visiting hours and refused to leave. Security escorted visitor out. Family counseled.' },
  { id: 'SI-003', title: 'CCTV Camera Malfunction', location: 'Emergency Entrance', date: '2026-08-22', time: '08:00', severity: 'High', status: 'Open', reportedBy: 'Security System', description: 'Camera #12 offline since 08:00. No image. Repair requested from vendor.' },
  { id: 'SI-004', title: 'Patient Property Theft Allegation', location: 'Ward C12', date: '2026-08-21', time: '11:30', severity: 'High', status: 'Investigating', reportedBy: 'Patient Relative', description: 'Patient claims GH₵ 500 missing from bedside. CCTV review pending. Staff statements being collected.' },
];

const ACCESS_POINTS: AccessPoint[] = [
  { id: 'AP-001', location: 'Main Entrance', type: 'Card + Biometric', status: 'Operational', lastChecked: '2026-08-24 06:00' },
  { id: 'AP-002', location: 'Emergency Entrance', type: 'Card', status: 'Operational', lastChecked: '2026-08-24 06:00' },
  { id: 'AP-003', location: 'Pharmacy Store', type: 'Biometric + PIN', status: 'Operational', lastChecked: '2026-08-24 06:00' },
  { id: 'AP-004', location: 'Staff Only — 5th Floor', type: 'Card', status: 'Maintenance', lastChecked: '2026-08-23 18:00' },
  { id: 'AP-005', location: 'Mortuary', type: 'Card + Biometric', status: 'Operational', lastChecked: '2026-08-24 06:00' },
  { id: 'AP-006', location: 'Parking Garage', type: 'Card', status: 'Operational', lastChecked: '2026-08-24 06:00' },
];

const SEV_COLORS: Record<string, string> = { Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-blue-100 text-blue-800' };
const STATUS_COLORS: Record<string, string> = { Open: 'bg-red-100 text-red-800', Investigating: 'bg-yellow-100 text-yellow-800', Resolved: 'bg-green-100 text-green-800', Closed: 'bg-gray-100 text-gray-800', Operational: 'bg-green-100 text-green-800', Maintenance: 'bg-yellow-100 text-yellow-800', Offline: 'bg-red-100 text-red-800' };

export default function SecurityManagement() {
  const [tab, setTab] = useState<'incidents' | 'access' | 'stats'>('incidents');

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
          title="Add New Security Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Security Management</h1><p className="text-gray-500">Access control, CCTV monitoring, security incidents, and safety management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Open Incidents', value: INCIDENTS.filter(i => i.status === 'Open' || i.status === 'Investigating').length, color: 'text-red-600' }, { label: 'Access Points', value: ACCESS_POINTS.length, color: 'text-blue-600' }, { label: 'Operational', value: ACCESS_POINTS.filter(a => a.status === 'Operational').length, color: 'text-green-600' }, { label: 'Critical', value: INCIDENTS.filter(i => i.severity === 'Critical').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['incidents', 'access', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'incidents' ? 'Incidents' : t === 'access' ? 'Access Control' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'incidents' && (
        <div className="space-y-3">
          {INCIDENTS.map(i => (
            <div key={i.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{i.id}</span><span className="font-semibold">{i.title}</span><Badge className={SEV_COLORS[i.severity]}>{i.severity}</Badge></div>
                <Badge className={STATUS_COLORS[i.status]}>{i.status}</Badge>
              </div>
              <div className="text-sm text-gray-600 mb-2">{i.description}</div>
              <div className="flex gap-4 text-xs text-gray-500"><span>Location: {i.location}</span><span>Date: {i.date} {i.time}</span><span>Reported by: {i.reportedBy}</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'access' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Location</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Last Checked</th></tr></thead>
            <tbody>{ACCESS_POINTS.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{a.id}</td><td className="p-3 font-medium">{a.location}</td><td className="p-3 text-xs">{a.type}</td><td className="p-3"><Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge></td><td className="p-3 text-xs">{a.lastChecked}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">By Severity</h3>{Object.keys(SEV_COLORS).map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={SEV_COLORS[s]}>{s}</Badge><span className="font-bold">{INCIDENTS.filter(i => i.severity === s).length}</span></div>)}</div>
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">By Status</h3>{['Open', 'Investigating', 'Resolved', 'Closed'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{INCIDENTS.filter(i => i.status === s).length}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
