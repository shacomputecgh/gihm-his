import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, useToast } from '../../components/ui';

interface BloodIssue {
  id: string; patientName: string; ward: string; bloodGroup: string;
  component: string; units: number; issueDate: string; issueTime: string;
  issuedBy: string; verifiedBy: string;
  status: 'Ordered' | 'Crossmatched' | 'Issued' | 'Transfusing' | 'Completed' | 'Returned';
  preTransfusionVitals: string; reactions?: string;
  indication: string; specimenTime: string; compatibleUnits: number;
  startTime?: string; endTime?: string;
  phn: string; urgency: 'Routine' | 'Urgent' | 'Stat';
}

const ISSUES: BloodIssue[] = [
  { id: 'BI-001', patientName: 'Kwame Asante', ward: 'ICU', bloodGroup: 'O+', component: 'Packed RBC', units: 2, issueDate: '2026-08-25', issueTime: '08:30', issuedBy: 'Lab Tech Esi', verifiedBy: 'Sr. Ama', status: 'Transfusing', preTransfusionVitals: 'BP 110/70, HR 95, Temp 37.2°C, SpO2 94%', indication: 'Hb 6.2 g/dL — symptomatic anaemia', specimenTime: '06:00', compatibleUnits: 8, startTime: '08:35', phn: 'PHN-001', urgency: 'Urgent' },
  { id: 'BI-002', patientName: 'Akua Mensah', ward: 'Surgery', bloodGroup: 'A+', component: 'Packed RBC', units: 1, issueDate: '2026-08-25', issueTime: '09:00', issuedBy: 'Lab Tech Nana', verifiedBy: 'Sr. Kofi', status: 'Completed', preTransfusionVitals: 'BP 125/80, HR 78, Temp 36.8°C, SpO2 98%', indication: 'Pre-operative Hb 9.1 g/dL', specimenTime: '07:30', compatibleUnits: 5, startTime: '09:05', endTime: '10:45', phn: 'PHN-002', urgency: 'Routine' },
  { id: 'BI-003', patientName: 'Nana Osei', ward: 'Medicine', bloodGroup: 'B+', component: 'FFP', units: 4, issueDate: '2026-08-25', issueTime: '10:00', issuedBy: 'Lab Tech Esi', verifiedBy: 'Sr. Abena', status: 'Completed', preTransfusionVitals: 'BP 115/75, HR 82, Temp 37.0°C, SpO2 96%', indication: 'INR 3.2 — active bleeding', specimenTime: '08:15', compatibleUnits: 12, startTime: '10:10', endTime: '11:30', phn: 'PHN-003', urgency: 'Urgent' },
  { id: 'BI-004', patientName: 'Efua Nyarko', ward: 'Emergency', bloodGroup: 'O-', component: 'Packed RBC', units: 3, issueDate: '2026-08-25', issueTime: '11:00', issuedBy: 'Lab Tech Nana', verifiedBy: 'Dr. Darko', status: 'Completed', preTransfusionVitals: 'BP 90/55, HR 110, Temp 36.5°C, SpO2 92%', reactions: 'Mild fever 38.2°C — resolved with paracetamol', indication: 'Post-partum haemorrhage', specimenTime: '10:30', compatibleUnits: 3, startTime: '11:05', endTime: '14:00', phn: 'PHN-004', urgency: 'Stat' },
  { id: 'BI-005', patientName: 'Yaw Darko', ward: 'Theatre', bloodGroup: 'AB+', component: 'Platelets', units: 1, issueDate: '2026-08-25', issueTime: '13:00', issuedBy: 'Lab Tech Esi', verifiedBy: 'Sr. Ama', status: 'Issued', preTransfusionVitals: 'BP 120/75, HR 88, Temp 36.9°C, SpO2 97%', indication: 'Platelet count 15 — intraoperative bleeding', specimenTime: '11:30', compatibleUnits: 4, phn: 'PHN-005', urgency: 'Stat' },
];

const STATUS_COLORS: Record<string, string> = { Ordered: 'bg-gray-100 text-gray-800', Crossmatched: 'bg-blue-100 text-blue-800', Issued: 'bg-orange-100 text-orange-800', Transfusing: 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Returned: 'bg-red-100 text-red-800' };
const URGENCY_COLORS: Record<string, string> = { Routine: 'bg-green-100 text-green-800', Urgent: 'bg-orange-100 text-orange-800', Stat: 'bg-red-100 text-red-800' };

export default function BloodProductIssuance() {
  const [tab, setTab] = useState<'overview' | 'orders' | 'transfusion' | 'reactions'>('overview');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🩸 Blood Product Issuance</h1>
          <p className="text-gray-600 mt-1">Crossmatching · Transfusion monitoring · Reaction tracking</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          {showAdd ? "✕ Cancel" : "+ New Order"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="New Blood Product Order"
          fields={[
            { name: "patientName", label: "Patient Name", type: "text", required: true },
            { name: "bloodType", label: "Blood Type Required", type: "select", options: ["A+","A-","B+","B-","AB+","AB-","O+","O-"], required: true },
            { name: "component", label: "Component", type: "select", options: ["Whole Blood","Packed RBC","Platelets","FFP","Cryo"], required: true },
            { name: "units", label: "Units", type: "number" },
            { name: "indication", label: "Clinical Indication", type: "textarea" },
            { name: "urgency", label: "Urgency", type: "select", options: ["Routine","Urgent","Stat"], required: true }
          ]}
          onSave={(_data) => { toast('Blood order submitted', 'success'); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: ISSUES.length, icon: '🩸', color: 'text-blue-600' },
          { label: 'Transfusing', value: ISSUES.filter(i => i.status === 'Transfusing').length, icon: '💉', color: 'text-green-600' },
          { label: 'Stat/Urgent', value: ISSUES.filter(i => i.urgency !== 'Routine').length, icon: '🚨', color: 'text-red-600' },
          { label: 'Reactions', value: ISSUES.filter(i => i.reactions).length, icon: '⚠️', color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'orders', 'transfusion', 'reactions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'orders' ? '📋 Orders' : t === 'transfusion' ? '💉 Transfusion' : '⚠️ Reactions'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Blood Group Distribution</h3>
            <div className="space-y-2">
              {Object.entries(ISSUES.reduce<Record<string, number>>((a, i) => { a[i.bloodGroup] = (a[i.bloodGroup] || 0) + i.units; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([group, units]) => (
                <div key={group} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg font-bold text-red-600">{group}</span><span className="font-bold">{units} units</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Component Distribution</h3>
            <div className="space-y-2">
              {Object.entries(ISSUES.reduce<Record<string, number>>((a, i) => { a[i.component] = (a[i.component] || 0) + i.units; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([comp, units]) => (
                <div key={comp} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className="bg-gray-100 text-gray-800">{comp}</Badge><span className="font-bold">{units} units</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {ISSUES.map(i => (
            <Card key={i.id} className={`p-5 ${i.reactions ? 'ring-2 ring-red-500' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">{i.id}</span>
                  <span className="font-bold">{i.patientName}</span>
                  <Badge className="bg-gray-100 text-gray-800">{i.ward}</Badge>
                  <Badge className={URGENCY_COLORS[i.urgency]}>{i.urgency}</Badge>
                </div>
                <Badge className={STATUS_COLORS[i.status]}>{i.status}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                <div><span className="text-gray-500">Group:</span> <span className="font-bold text-red-600">{i.bloodGroup}</span></div>
                <div><span className="text-gray-500">Component:</span> {i.component}</div>
                <div><span className="text-gray-500">Units:</span> <span className="font-bold">{i.units}</span></div>
                <div><span className="text-gray-500">Compatible:</span> {i.compatibleUnits}</div>
                <div><span className="text-gray-500">Time:</span> {i.issueTime}</div>
                <div><span className="text-gray-500">PHN:</span> {i.phn}</div>
              </div>
              <div className="mt-2 text-xs bg-blue-50 border border-blue-200 rounded p-2"><span className="font-medium">Indication:</span> {i.indication}</div>
              <div className="mt-1 text-xs bg-gray-50 rounded p-2">Pre-Vitals: {i.preTransfusionVitals}</div>
              {i.reactions && <div className="mt-1 text-xs bg-red-50 border border-red-200 rounded p-2">⚠️ Reaction: {i.reactions}</div>}
            </Card>
          ))}
        </div>
      )}

      {tab === 'transfusion' && (
        <div className="space-y-3">
          {ISSUES.filter(i => i.status === 'Transfusing' || i.status === 'Completed').map(i => (
            <Card key={i.id} className="p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold">{i.patientName} — {i.bloodGroup} {i.component}</span>
                <Badge className={STATUS_COLORS[i.status]}>{i.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center"><div className="text-xs text-gray-500">Start</div><div className="font-bold">{i.startTime || '—'}</div></div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center"><div className="text-xs text-gray-500">End</div><div className="font-bold">{i.endTime || 'In progress...'}</div></div>
                  {i.startTime && i.endTime && <div className="text-center"><div className="text-xs text-gray-500">Duration</div><div className="font-bold">{Math.round((new Date(`2026-01-01 ${i.endTime}`).getTime() - new Date(`2026-01-01 ${i.startTime}`).getTime()) / 60000)} min</div></div>}
                </div>
                {i.status === 'Transfusing' && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-sm">✓ Complete</button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'reactions' && (
        <div className="space-y-3">
          {ISSUES.filter(i => i.reactions).map(i => (
            <Card key={i.id} className="p-5 ring-2 ring-red-500">
              <div className="flex justify-between items-start">
                <div><div className="font-bold text-red-800">⚠️ {i.patientName} — {i.bloodGroup} {i.component}</div><div className="text-sm text-gray-600 mt-1">{i.ward} · {i.units} units · {i.issueDate}</div></div>
                <Badge className="bg-red-100 text-red-800">Reaction</Badge>
              </div>
              <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm">{i.reactions}</div>
            </Card>
          ))}
          {ISSUES.filter(i => i.reactions).length === 0 && <Card className="p-6 text-center text-gray-500">✅ No transfusion reactions today</Card>}
        </div>
      )}
    </div>
  );
}