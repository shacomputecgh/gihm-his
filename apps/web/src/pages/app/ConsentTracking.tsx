import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, useToast } from '../../components/ui';

interface Consent {
  id: string; patientName: string; procedure: string; type: string;
  date: string; witness: string; doctor: string;
  status: 'Obtained' | 'Pending' | 'Refused' | 'Withdrawn';
  method: string; language: string; validUntil: string;
  notes: string; documentUrl?: string;
}

const CONSENTS: Consent[] = [
  { id: 'CT-001', patientName: 'Kwame Asante', procedure: 'Coronary Angioplasty + Stent', type: 'Surgical', date: '2026-08-25', witness: 'Nurse Ama', doctor: 'Dr. Asantewaa', status: 'Obtained', method: 'E-Signature', language: 'English', validUntil: '2026-09-25', notes: 'Patient understood risks including bleeding, infection, and vessel damage' },
  { id: 'CT-002', patientName: 'Akua Mensah', procedure: 'Caesarean Section', type: 'Surgical', date: '2026-08-25', witness: 'Midwife Grace', doctor: 'Dr. Appiah', status: 'Obtained', method: 'Written', language: 'Twi', validUntil: '2026-08-26', notes: 'Consent obtained with Twi interpreter' },
  { id: 'CT-003', patientName: 'Nana Osei', procedure: 'CT Brain with Contrast', type: 'Imaging', date: '2026-08-25', witness: 'Radiographer', doctor: 'Dr. Darko', status: 'Pending', method: 'Verbal', language: 'English', validUntil: '', notes: 'Contrast allergy screening completed' },
  { id: 'CT-004', patientName: 'Efua Nyarko', procedure: 'Clinical Trial — Antimalarial Drug X', type: 'Research', date: '2026-08-24', witness: 'Dr. Mensah', doctor: 'Dr. Asantewaa', status: 'Obtained', method: 'Written + Verbal', language: 'Fante', validUntil: '2027-08-24', notes: 'IRB approved protocol, 30-day cooling-off period explained' },
  { id: 'CT-005', patientName: 'Yaw Boateng', procedure: 'Blood Transfusion (2 units pRBC)', type: 'Procedural', date: '2026-08-25', witness: 'Sr. Efua', doctor: 'Dr. Kumah', status: 'Refused', method: 'Written', language: 'English', validUntil: '', notes: 'Patient refuses on religious grounds — JW' },
  { id: 'CT-006', patientName: 'Esi Darko', procedure: 'Do Not Resuscitate (DNR)', type: 'DNR', date: '2026-08-20', witness: 'Dr. Asantewaa', doctor: 'Dr. Asantewaa', status: 'Obtained', method: 'Written', language: 'English', validUntil: '2027-08-20', notes: 'Patient of sound mind, advance directive documented' },
  { id: 'CT-007', patientName: 'Kwadwo Mensah', procedure: 'Organ Donation Consent', type: 'Research', date: '2026-08-23', witness: 'Dr. Darko', doctor: 'Dr. Kumah', status: 'Withdrawn', method: 'Written', language: 'English', validUntil: '', notes: 'Patient withdrew consent 48h after signing' },
];

const STATUS_COLORS: Record<string, string> = { Obtained: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Refused: 'bg-red-100 text-red-800', Withdrawn: 'bg-gray-100 text-gray-800' };
const TYPE_COLORS: Record<string, string> = { Surgical: 'bg-red-100 text-red-800', Imaging: 'bg-blue-100 text-blue-800', Research: 'bg-purple-100 text-purple-800', Procedural: 'bg-orange-100 text-orange-800', DNR: 'bg-gray-800 text-white' };

export default function ConsentTracking() {
  const [tab, setTab] = useState<'overview' | 'list' | 'pending' | 'analytics'>('overview');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Consent Tracking</h1>
          <p className="text-gray-600 mt-1">Informed consent · E-signatures · Multi-language · DNR orders</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          {showAdd ? "✕ Cancel" : "+ New Consent"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="New Consent Record"
          fields={[
            { name: "patientName", label: "Patient Name", type: "text", required: true },
            { name: "procedure", label: "Procedure/Intervention", type: "text", required: true },
            { name: "type", label: "Consent Type", type: "select", options: ["Surgical", "Anaesthesia", "Blood Transfusion", "Imaging", "Research", "DNR", "Discharge", "General"], required: true },
            { name: "language", label: "Language", type: "select", options: ["English", "Twi", "Ewe", "Ga", "Fante", "Hausa", "Dagbani"] },
            { name: "method", label: "Method", type: "select", options: ["Written", "E-Signature", "Verbal", "Written + Verbal"] },
            { name: "doctor", label: "Consenting Doctor", type: "text" }
          ]}
          onSave={(_data) => { toast('Consent recorded', 'success'); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Consents', value: CONSENTS.length, icon: '📝', color: 'text-blue-600' },
          { label: 'Obtained', value: CONSENTS.filter(c => c.status === 'Obtained').length, icon: '✅', color: 'text-green-600' },
          { label: 'Pending', value: CONSENTS.filter(c => c.status === 'Pending').length, icon: '⏳', color: 'text-yellow-600' },
          { label: 'DNR Orders', value: CONSENTS.filter(c => c.type === 'DNR').length, icon: '🚫', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'list', 'pending', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'list' ? '📋 All Consents' : t === 'pending' ? '⏳ Pending' : '📈 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Consent by Type</h3>
            <div className="space-y-2">
              {Object.entries(CONSENTS.reduce<Record<string, number>>((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={TYPE_COLORS[type]}>{type}</Badge><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Languages Used</h3>
            <div className="space-y-2">
              {Object.entries(CONSENTS.reduce<Record<string, number>>((a, c) => { a[c.language] = (a[c.language] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                <div key={lang} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{lang}</span><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Procedure</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Language</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Doctor</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {CONSENTS.map(c => (
                <tr key={c.id} className={`border-b hover:bg-gray-50 ${c.type === 'DNR' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-3 font-medium">{c.patientName}</td>
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate">{c.procedure}</td>
                  <td className="px-4 py-3"><Badge className={TYPE_COLORS[c.type]}>{c.type}</Badge></td>
                  <td className="px-4 py-3">{c.language}</td>
                  <td className="px-4 py-3 text-xs">{c.method}</td>
                  <td className="px-4 py-3 text-xs">{c.doctor}</td>
                  <td className="px-4 py-3 text-xs">{c.date}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {CONSENTS.filter(c => c.status === 'Pending').map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">{c.patientName} — {c.procedure}</div>
                  <div className="text-sm text-gray-500 mt-1">{c.type} · Language: {c.language} · Doctor: {c.doctor}</div>
                  {c.notes && <div className="text-xs text-gray-500 mt-1">📝 {c.notes}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-sm">✍️ Get Signature</button>
                  <button onClick={() => {}} className="px-3 py-1 bg-red-600 text-white rounded text-sm">❌ Refuse</button>
                </div>
              </div>
            </Card>
          ))}
          {CONSENTS.filter(c => c.status === 'Pending').length === 0 && <Card className="p-6 text-center text-gray-500">✅ No pending consents</Card>}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Consent Status</h3>
            <div className="space-y-3">
              {['Obtained', 'Pending', 'Refused', 'Withdrawn'].map(status => {
                const count = CONSENTS.filter(c => c.status === status).length;
                const pct = CONSENTS.length > 0 ? (count / CONSENTS.length * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={STATUS_COLORS[status]}>{status}</Badge><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${status === 'Obtained' ? 'bg-green-500' : status === 'Refused' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Consent Methods</h3>
            <div className="space-y-2">
              {Object.entries(CONSENTS.reduce<Record<string, number>>((a, c) => { a[c.method] = (a[c.method] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{method}</span><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}