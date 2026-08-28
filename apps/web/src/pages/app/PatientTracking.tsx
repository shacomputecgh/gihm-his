import { useState } from 'react';
import SelectWithOther from '../../components/SelectWithOther';

interface TrackingRecord {
  id: string;
  patientName: string;
  phone: string;
  mrn: string;
  lastSeen: string;
  lastLocation: string;
  status: 'Active' | 'Discharged' | 'AMA' | 'ELOPED' | 'Deceased' | 'Transferred';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  trackingMethod: 'Phone Call' | 'SMS' | 'WhatsApp' | 'Home Visit' | 'Police' | 'Family' | 'NHIS Lookup' | 'Ghana Card Lookup';
  notes: string;
  assignedTo: string;
  followUpDate: string;
}

const MOCK_RECORDS: TrackingRecord[] = [
  { id: 'TK-001', patientName: 'Kwame Asante', phone: '0244123456', mrn: 'MRN-2026-0001', lastSeen: '2026-08-20', lastLocation: 'Korle-Bu Emergency', status: 'ELOPED', riskLevel: 'High', trackingMethod: 'Phone Call', notes: 'Patient left against medical advice during emergency treatment', assignedTo: 'Security Office', followUpDate: '2026-08-25' },
  { id: 'TK-002', patientName: 'Akua Mensah', phone: '0201654321', mrn: 'MRN-2026-0002', lastSeen: '2026-08-18', lastLocation: 'Medical Ward 3', status: 'AMA', riskLevel: 'Medium', trackingMethod: 'SMS', notes: 'Discharged AMA — wound not fully healed, follow-up needed', assignedTo: 'Nurse Esi', followUpDate: '2026-08-28' },
  { id: 'TK-003', patientName: 'Nana Osei', phone: '0551987654', mrn: 'MRN-2026-0003', lastSeen: '2026-08-22', lastLocation: 'Psychiatric Unit', status: 'Active', riskLevel: 'Critical', trackingMethod: 'Home Visit', notes: 'Psychiatric patient — risk of self-harm. Family cooperating', assignedTo: 'Dr. psychiatric team', followUpDate: '2026-08-24' },
  { id: 'TK-004', patientName: 'Efua Nyarko', phone: '0277345678', mrn: 'MRN-2026-0004', lastSeen: '2026-08-15', lastLocation: 'Maternity Ward', status: 'ELOPED', riskLevel: 'High', trackingMethod: 'WhatsApp', notes: 'New mother left with newborn — immunisation schedule missed', assignedTo: 'Midwife Abena', followUpDate: '2026-08-26' },
  { id: 'TK-005', patientName: 'Yusif Ibrahim', phone: '0249871234', mrn: 'MRN-2026-0005', lastSeen: '2026-08-19', lastLocation: 'Surgical Ward', status: 'Active', riskLevel: 'Low', trackingMethod: 'NHIS Lookup', notes: 'Post-op patient — missed follow-up appointment', assignedTo: 'Clinic Reception', followUpDate: '2026-08-30' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Discharged: 'bg-gray-100 text-gray-800', AMA: 'bg-yellow-100 text-yellow-800', ELOPED: 'bg-red-100 text-red-800', Deceased: 'bg-slate-100 text-slate-800', Transferred: 'bg-blue-100 text-blue-800' };
const RISK_COLORS: Record<string, string> = { Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800' };

export default function PatientTracking() {
  const [records] = useState<TrackingRecord[]>(MOCK_RECORDS);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selected, setSelected] = useState<TrackingRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showPhoneTrace, setShowPhoneTrace] = useState(false);
  const [tracePhone, setTracePhone] = useState('');
  const [traceResults, setTraceResults] = useState<TrackingRecord[]>([]);

  const filtered = records.filter((r) => {
    if (phoneSearch && !r.phone.includes(phoneSearch)) return false;
    if (nameSearch && !r.patientName.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (riskFilter && r.riskLevel !== riskFilter) return false;
    return true;
  });

  function tracePhoneAction() {
    const results = records.filter((r) => r.phone === tracePhone || r.phone.includes(tracePhone));
    setTraceResults(results);
  }

  function sendSMS(r: TrackingRecord) {
    alert(`SMS sent to ${r.patientName} (${r.phone}): "Dear ${r.patientName}, your hospital follow-up is due. Please visit Korle-Bu OPD or call 0302771301."`);
  }

  function sendWhatsApp(r: TrackingRecord) {
    alert(`WhatsApp message sent to ${r.patientName} (${r.phone})`);
  }

  function logCall(r: TrackingRecord) {
    alert(`Call logged for ${r.patientName} (${r.phone}). Status: Attempted`);
  }

  const stats = {
    total: records.length,
    eloped: records.filter((r) => r.status === 'ELOPED').length,
    ama: records.filter((r) => r.status === 'AMA').length,
    critical: records.filter((r) => r.riskLevel === 'Critical').length,
    active: records.filter((r) => r.status === 'Active').length,
  };

  return (
    <div className="space-y-6">
      {showAdd && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Add New Tracking Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Patient Name *</label><input className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" placeholder="Patient name" /></div>
            <div><label className="text-sm font-medium text-slate-700">Phone Number *</label><input className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" placeholder="0244 000 000" /></div>
            <div><label className="text-sm font-medium text-slate-700">MRN</label><input className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" placeholder="MRN-XXXX-XXXX" /></div>
            <SelectWithOther label="Status" value="" onChange={() => {}} options={['Active', 'Discharged', 'AMA', 'ELOPED', 'Deceased', 'Transferred']} className="mt-1" />
            <SelectWithOther label="Risk Level" value="" onChange={() => {}} options={['Low', 'Medium', 'High', 'Critical']} className="mt-1" />
            <SelectWithOther label="Tracking Method" value="" onChange={() => {}} options={['Phone Call', 'SMS', 'WhatsApp', 'Home Visit', 'Police', 'Family', 'NHIS Lookup', 'Ghana Card Lookup']} className="mt-1" />
            <div className="md:col-span-3"><label className="text-sm font-medium text-slate-700">Notes</label><textarea className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" rows={3} placeholder="Tracking notes..." /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Save</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div><h1 className="text-2xl font-bold">Patient Tracking System</h1><p className="text-gray-500">Track patients by phone number, NHIS, Ghana Card, or name — for patients who left AMA, eloped, or need follow-up</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Tracked</div>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-red-600">{stats.eloped}</div>
          <div className="text-xs text-gray-500">Eloped</div>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.ama}</div>
          <div className="text-xs text-gray-500">AMA</div>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.critical}</div>
          <div className="text-xs text-gray-500">Critical Risk</div>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-gray-500">Active Tracking</div>
        </div>
      </div>

      {/* Phone Trace Tool */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📞</span>
          <div>
            <h3 className="font-bold text-blue-800">Phone Number Trace</h3>
            <p className="text-xs text-blue-600">Track a patient by their phone number — checks all records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input value={tracePhone} onChange={(e) => setTracePhone(e.target.value)} placeholder="Enter phone number to trace..." className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          <button onClick={tracePhoneAction} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Trace</button>
          <button onClick={() => setShowPhoneTrace(!showPhoneTrace)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Advanced</button>
        </div>
        {traceResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {traceResults.map((r) => (
              <div key={r.id} className="bg-white rounded-lg border border-blue-200 p-3 flex justify-between items-center">
                <div>
                  <span className="font-bold">{r.patientName}</span>
                  <span className="ml-2 text-sm text-gray-500">{r.phone}</span>
                  <span className="ml-2 text-xs text-gray-400">{r.mrn}</span>
                  <span className="ml-2"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[r.status]}`}>{r.status}</span></span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => sendSMS(r)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">SMS</button>
                  <button onClick={() => sendWhatsApp(r)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">WhatsApp</button>
                  <button onClick={() => logCall(r)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Call</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} placeholder="Search by phone..." className="rounded-lg border px-3 py-2 text-sm" />
        <input value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} placeholder="Search by name..." className="rounded-lg border px-3 py-2 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Risk</option>
          {Object.keys(RISK_COLORS).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">+ Add Tracking</button>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Patient</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Phone</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">MRN</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Risk</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Method</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Last Seen</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Follow-Up</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(r)}>
                <td className="px-3 py-2 font-medium">{r.patientName}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.phone}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.mrn}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[r.riskLevel]}`}>{r.riskLevel}</span></td>
                <td className="px-3 py-2 text-xs">{r.trackingMethod}</td>
                <td className="px-3 py-2 text-xs">{r.lastSeen}</td>
                <td className="px-3 py-2 text-xs">{r.followUpDate}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => sendSMS(r)} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">SMS</button>
                    <button onClick={() => sendWhatsApp(r)} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">WA</button>
                    <button onClick={() => logCall(r)} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Call</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selected.patientName}</h2>
                <p className="text-sm text-gray-500">{selected.phone} — {selected.mrn}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_COLORS[selected.riskLevel]}`}>{selected.riskLevel} Risk</span>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Last Seen:</span> <span className="font-medium">{selected.lastSeen}</span></div>
              <div><span className="text-gray-500">Last Location:</span> <span className="font-medium">{selected.lastLocation}</span></div>
              <div><span className="text-gray-500">Tracking Method:</span> <span className="font-medium">{selected.trackingMethod}</span></div>
              <div><span className="text-gray-500">Assigned To:</span> <span className="font-medium">{selected.assignedTo}</span></div>
              <div><span className="text-gray-500">Follow-Up:</span> <span className="font-medium">{selected.followUpDate}</span></div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
              <p className="text-sm">{selected.notes}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => sendSMS(selected)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Send SMS</button>
              <button onClick={() => sendWhatsApp(selected)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">WhatsApp</button>
              <button onClick={() => logCall(selected)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Log Call</button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
