import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT' | 'APPROVE' | 'REJECT';
  module: string;
  description: string;
  ipAddress: string;
  device: string;
  browser: string;
  previousValue?: string;
  newValue?: string;
  outcome: 'Success' | 'Failed' | 'Unauthorized';
}

const AUDIT_LOGS: AuditLog[] = [
  { id: 'AUD-001', timestamp: '2026-08-24 09:45:12', userId: 'DOC-001', userName: 'Dr. Kwame Asante', userRole: 'Consultant Surgeon', action: 'LOGIN', module: 'Authentication', description: 'Successful login', ipAddress: '192.168.1.105', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-002', timestamp: '2026-08-24 09:46:30', userId: 'DOC-001', userName: 'Dr. Kwame Asante', userRole: 'Consultant Surgeon', action: 'CREATE', module: 'Patients', description: 'Created new patient record: Kwaku Mensah (MRN-2026-0847)', ipAddress: '192.168.1.105', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-003', timestamp: '2026-08-24 09:48:15', userId: 'DOC-001', userName: 'Dr. Kwame Asante', userRole: 'Consultant Surgeon', action: 'UPDATE', module: 'Clinical Notes', description: 'Updated clinical notes for patient MRN-2026-0845', ipAddress: '192.168.1.105', device: 'Desktop', browser: 'Chrome 120', previousValue: 'Observation: Patient stable', newValue: 'Observation: Patient improving, discharge planned', outcome: 'Success' },
  { id: 'AUD-004', timestamp: '2026-08-24 09:50:00', userId: 'NUR-001', userName: 'Sr. Abena Osei', userRole: 'Senior Nurse — ICU', action: 'CREATE', module: 'Medication Administration', description: 'Administered IV Amoxicillin 1g to patient ICU-001 (Kwame Mensah)', ipAddress: '192.168.1.120', device: 'iPad', browser: 'Safari 17', outcome: 'Success' },
  { id: 'AUD-005', timestamp: '2026-08-24 09:52:45', userId: 'PH-001', userName: 'Pharm. Kofi Adjei', userRole: 'Chief Pharmacist', action: 'UPDATE', module: 'Pharmacy', description: 'Dispensed Paracetamol 500mg x20 to patient OPD-2026-0890', ipAddress: '192.168.1.110', device: 'Desktop', browser: 'Chrome 120', previousValue: 'Stock: 450 units', newValue: 'Stock: 430 units', outcome: 'Success' },
  { id: 'AUD-006', timestamp: '2026-08-24 09:55:00', userId: 'DOC-002', userName: 'Dr. Akua Mensah', userRole: 'Consultant Paediatrician', action: 'READ', module: 'Laboratory', description: 'Viewed lab results for patient PAED-2026-0123', ipAddress: '192.168.1.108', device: 'Desktop', browser: 'Firefox 121', outcome: 'Success' },
  { id: 'AUD-007', timestamp: '2026-08-24 09:57:30', userId: 'ADMIN-001', userName: 'Admin User', userRole: 'Hospital Administrator', action: 'PRINT', module: 'Billing', description: 'Printed invoice INV-2026-0890 for GH₵ 1,250.00', ipAddress: '192.168.1.100', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-008', timestamp: '2026-08-24 10:00:00', userId: 'LAB-001', userName: 'Lab. Nana Agyeman', userRole: 'Laboratory Scientist', action: 'CREATE', module: 'Laboratory', description: 'Reported CBC results for specimen SPEC-2026-0847', ipAddress: '192.168.1.115', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-009', timestamp: '2026-08-24 10:02:15', userId: 'NUR-002', userName: 'Sr. Esi Amoako', userRole: 'Senior Nurse — Ward 2', action: 'UPDATE', module: 'Vital Signs', description: 'Recorded vital signs for patient Ward2-008', ipAddress: '192.168.1.121', device: 'Android Tablet', browser: 'Chrome 120', previousValue: 'BP: 130/80, HR: 88', newValue: 'BP: 125/78, HR: 82', outcome: 'Success' },
  { id: 'AUD-010', timestamp: '2026-08-24 10:05:00', userId: 'DOC-003', userName: 'Dr. Yaw Boateng', userRole: 'Medical Officer — Emergency', action: 'DELETE', module: 'Appointments', description: 'Cancelled appointment APT-2026-0910 (patient no-show)', ipAddress: '192.168.1.109', device: 'Desktop', browser: 'Chrome 120', previousValue: 'Status: Scheduled', newValue: 'Status: Cancelled (No-show)', outcome: 'Success' },
  { id: 'AUD-011', timestamp: '2026-08-24 10:08:30', userId: 'SYSTEM', userName: 'System', userRole: 'System', action: 'APPROVE', module: 'Insurance', description: 'Auto-approved insurance claim INS-2026-0845 (NHIS)', ipAddress: '127.0.0.1', device: 'Server', browser: 'System', outcome: 'Success' },
  { id: 'AUD-012', timestamp: '2026-08-24 10:10:00', userId: 'DOC-004', userName: 'Dr. Priscilla Wiafe', userRole: 'Consultant Psychiatrist', action: 'LOGIN', module: 'Authentication', description: 'Failed login attempt — incorrect password', ipAddress: '192.168.1.112', device: 'Desktop', browser: 'Chrome 120', outcome: 'Failed' },
  { id: 'AUD-013', timestamp: '2026-08-24 10:12:45', userId: 'DOC-004', userName: 'Dr. Priscilla Wiafe', userRole: 'Consultant Psychiatrist', action: 'LOGIN', module: 'Authentication', description: 'Successful login (2nd attempt)', ipAddress: '192.168.1.112', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-014', timestamp: '2026-08-24 10:15:00', userId: 'NUR-003', userName: 'Sr. Nana Agyei', userRole: 'Nurse — Ward 3', action: 'EXPORT', module: 'Reports', description: 'Exported daily dispensing report as PDF', ipAddress: '192.168.1.122', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-015', timestamp: '2026-08-24 10:18:00', userId: 'DOC-001', userName: 'Dr. Kwame Asante', userRole: 'Consultant Surgeon', action: 'APPROVE', module: 'Surgery', description: 'Approved surgical case list for tomorrow (3 procedures)', ipAddress: '192.168.1.105', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-016', timestamp: '2026-08-24 10:20:00', userId: 'GUEST', userName: 'Unknown', userRole: 'Unknown', action: 'READ', module: 'Patients', description: 'Unauthorized access attempt to patient records', ipAddress: '10.0.0.55', device: 'Unknown', browser: 'Unknown', outcome: 'Unauthorized' },
  { id: 'AUD-017', timestamp: '2026-08-24 10:22:30', userId: 'PH-001', userName: 'Pharm. Kofi Adjei', userRole: 'Chief Pharmacist', action: 'UPDATE', module: 'Pharmacy', description: 'Updated drug price: Amoxicillin 500mg from GH₵ 1.20 to GH₵ 1.50', ipAddress: '192.168.1.110', device: 'Desktop', browser: 'Chrome 120', previousValue: 'Price: GH₵ 1.20', newValue: 'Price: GH₵ 1.50', outcome: 'Success' },
  { id: 'AUD-018', timestamp: '2026-08-24 10:25:00', userId: 'ADMIN-001', userName: 'Admin User', userRole: 'Hospital Administrator', action: 'CREATE', module: 'Staff', description: 'Created new staff account: Dr. Nana Oforiwaa (DOC-005)', ipAddress: '192.168.1.100', device: 'Desktop', browser: 'Chrome 120', outcome: 'Success' },
  { id: 'AUD-019', timestamp: '2026-08-24 10:28:00', userId: 'DOC-002', userName: 'Dr. Akua Mensah', userRole: 'Consultant Paediatrician', action: 'REJECT', module: 'Insurance', description: 'Rejected insurance claim INS-2026-0850 — incomplete documentation', ipAddress: '192.168.1.108', device: 'Desktop', browser: 'Firefox 121', previousValue: 'Status: Pending', newValue: 'Status: Rejected', outcome: 'Success' },
  { id: 'AUD-020', timestamp: '2026-08-24 10:30:00', userId: 'NUR-001', userName: 'Sr. Abena Osei', userRole: 'Senior Nurse — ICU', action: 'LOGOUT', module: 'Authentication', description: 'Session ended — timeout after 30 minutes inactivity', ipAddress: '192.168.1.120', device: 'iPad', browser: 'Safari 17', outcome: 'Success' },
];

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800', READ: 'bg-blue-100 text-blue-800', UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800', LOGIN: 'bg-purple-100 text-purple-800', LOGOUT: 'bg-gray-100 text-gray-800',
  PRINT: 'bg-indigo-100 text-indigo-800', EXPORT: 'bg-teal-100 text-teal-800', APPROVE: 'bg-green-100 text-green-800',
  REJECT: 'bg-red-100 text-red-800',
};
const OUTCOME_STYLES: Record<string, string> = {
  Success: 'bg-green-50 text-green-700', Failed: 'bg-red-50 text-red-700', Unauthorized: 'bg-red-100 text-red-800 font-bold',
};

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [filterModule, setFilterModule] = useState('All');
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(AUDIT_LOGS[0] ?? null);

  const modules = [...new Set(AUDIT_LOGS.map(l => l.module))].sort();
  const filtered = AUDIT_LOGS.filter(l => {
    const matchSearch = l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || l.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = filterAction === 'All' || l.action === filterAction;
    const matchModule = filterModule === 'All' || l.module === filterModule;
    const matchOutcome = filterOutcome === 'All' || l.outcome === filterOutcome;
    return matchSearch && matchAction && matchModule && matchOutcome;
  });

  const failedCount = AUDIT_LOGS.filter(l => l.outcome === 'Failed').length;
  const unauthCount = AUDIT_LOGS.filter(l => l.outcome === 'Unauthorized').length;
  const uniqueUsers = new Set(AUDIT_LOGS.map(l => l.userId)).size;

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
          title="Add New Audit Entry"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail & Activity Log</h1>
          <p className="text-gray-500">Complete logging of all user actions for compliance and security</p>
        </div>
        <Button variant="outline">📥 Export Audit Log</Button>
      </div>

      {/* Alerts */}
      {(failedCount > 0 || unauthCount > 0) && (
        <div className="flex gap-3">
          {unauthCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 flex-1">
              <span className="text-red-600 text-xl">🚨</span>
              <div>
                <div className="font-semibold text-red-800">{unauthCount} Unauthorized Access Attempt{unauthCount > 1 ? 's' : ''}</div>
                <div className="text-sm text-red-600">Investigate immediately</div>
              </div>
            </div>
          )}
          {failedCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 flex-1">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-800">{failedCount} Failed Action{failedCount > 1 ? 's' : ''}</div>
                <div className="text-sm text-yellow-600">Review failed login/activity attempts</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: AUDIT_LOGS.length, color: 'text-blue-600' },
          { label: 'Unique Users', value: uniqueUsers, color: 'text-green-600' },
          { label: 'Failed', value: failedCount, color: 'text-yellow-600' },
          { label: 'Unauthorized', value: unauthCount, color: 'text-red-600' },
          { label: 'Modules', value: modules.length, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search user or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64" />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Actions</option>
          {Object.keys(ACTION_STYLES).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Outcomes</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Unauthorized">Unauthorized</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Time</th>
                <th className="text-left p-3 font-medium text-gray-600">User</th>
                <th className="text-left p-3 font-medium text-gray-600">Action</th>
                <th className="text-left p-3 font-medium text-gray-600">Module</th>
                <th className="text-left p-3 font-medium text-gray-600">Description</th>
                <th className="text-left p-3 font-medium text-gray-600">IP</th>
                <th className="text-left p-3 font-medium text-gray-600">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} onClick={() => setSelectedLog(log)}
                  className={`border-t cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedLog?.id === log.id ? 'bg-blue-50' : ''
                  } ${log.outcome === 'Unauthorized' ? 'bg-red-50' : log.outcome === 'Failed' ? 'bg-yellow-50/50' : ''}`}>
                  <td className="p-3 font-mono text-xs whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3">
                    <div className="font-medium text-xs">{log.userName}</div>
                    <div className="text-[10px] text-gray-400">{log.userRole}</div>
                  </td>
                  <td className="p-3"><Badge className={`text-[10px] ${ACTION_STYLES[log.action]}`}>{log.action}</Badge></td>
                  <td className="p-3 text-xs">{log.module}</td>
                  <td className="p-3 text-xs max-w-[300px] truncate">{log.description}</td>
                  <td className="p-3 font-mono text-xs">{log.ipAddress}</td>
                  <td className="p-3"><Badge className={`text-[10px] ${OUTCOME_STYLES[log.outcome]}`}>{log.outcome}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLog && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-bold mb-3">📝 Event Details — {selectedLog.id}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Timestamp:</span> <span className="font-mono">{selectedLog.timestamp}</span></div>
            <div><span className="text-gray-500">User:</span> {selectedLog.userName} ({selectedLog.userId})</div>
            <div><span className="text-gray-500">Role:</span> {selectedLog.userRole}</div>
            <div><span className="text-gray-500">Action:</span> <Badge className={`text-[10px] ${ACTION_STYLES[selectedLog.action]}`}>{selectedLog.action}</Badge></div>
            <div><span className="text-gray-500">Module:</span> {selectedLog.module}</div>
            <div><span className="text-gray-500">IP Address:</span> <span className="font-mono">{selectedLog.ipAddress}</span></div>
            <div><span className="text-gray-500">Device:</span> {selectedLog.device}</div>
            <div><span className="text-gray-500">Browser:</span> {selectedLog.browser}</div>
          </div>
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-600">Description</div>
            <div className="text-sm">{selectedLog.description}</div>
          </div>
          {selectedLog.previousValue && (
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs font-medium text-red-700">Previous Value</div>
                <div className="text-sm text-red-600">{selectedLog.previousValue}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs font-medium text-green-700">New Value</div>
                <div className="text-sm text-green-600">{selectedLog.newValue}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
