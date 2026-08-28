import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface StaffRole {
  id: string; name: string; description: string; department: string;
  permissions: string[]; staffCount: number; isActive: boolean;
}

const INITIAL_ROLES: StaffRole[] = [
  { id: 'role-001', name: 'Hospital Director', description: 'Full system access including admin, reports, and configuration', department: 'Administration', permissions: ['all'], staffCount: 1, isActive: true },
  { id: 'role-002', name: 'Medical Doctor', description: 'Patient care, prescriptions, referrals, clinical notes', department: 'Clinical', permissions: ['view_patients', 'edit_patients', 'prescribe', 'refer', 'view_lab', 'view_radiology', 'discharge'], staffCount: 45, isActive: true },
  { id: 'role-003', name: 'Nurse', description: 'Patient care, vitals, medication administration, ward management', department: 'Nursing', permissions: ['view_patients', 'edit_patients', 'record_vitals', 'administer_medication', 'ward_board'], staffCount: 180, isActive: true },
  { id: 'role-004', name: 'Pharmacist', description: 'Pharmacy operations, dispensing, drug management, inventory', department: 'Pharmacy', permissions: ['dispense', 'pharmacy_inventory', 'drug_database', 'view_prescriptions'], staffCount: 12, isActive: true },
  { id: 'role-005', name: 'Laboratory Technician', description: 'Lab testing, specimen processing, results entry', department: 'Laboratory', permissions: ['specimen_tracking', 'lab_results', 'lab_inventory', 'quality_control'], staffCount: 8, isActive: true },
  { id: 'role-006', name: 'Radiographer', description: 'Imaging requests, scan execution, results reporting', department: 'Radiology', permissions: ['imaging_requests', 'imaging_results', 'imaging_inventory'], staffCount: 6, isActive: true },
  { id: 'role-007', name: 'Midwife', description: 'Maternity care, antenatal, labour management, postnatal care', department: 'Maternity', permissions: ['view_patients', 'maternity_care', 'anc', 'pnc', 'delivery'], staffCount: 25, isActive: true },
  { id: 'role-008', name: 'Health Insurance Officer', description: 'NHIS claims processing, insurance billing, patient verification', department: 'Insurance', permissions: ['insurance_claims', 'billing', 'patient_registration'], staffCount: 5, isActive: true },
  { id: 'role-009', name: 'Accountant', description: 'Financial management, billing, payments, revenue reports', department: 'Finance', permissions: ['billing', 'payments', 'financial_reports', 'budget_management'], staffCount: 4, isActive: true },
  { id: 'role-010', name: 'Admin Staff', description: 'Registration, scheduling, general administration', department: 'Administration', permissions: ['patient_registration', 'appointments', 'scheduling'], staffCount: 15, isActive: true },
];

const DEPARTMENTS = ['Administration', 'Clinical', 'Nursing', 'Pharmacy', 'Laboratory', 'Radiology', 'Maternity', 'Insurance', 'Finance', 'IT'];

export default function UserRolesManager() {
  const [roles] = useState<StaffRole[]>(INITIAL_ROLES);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<StaffRole | null>(null);
  const toast = useToast();
  const totalStaff = roles.reduce((s, r) => s + r.staffCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">User Roles & Permissions</h1><p className="text-gray-500">Manage staff roles, permissions, and access control across the system</p></div>
        <Button onClick={() => setShowForm(true)}>+ Create Role</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{roles.length}</div><div className="text-xs text-gray-500">Total Roles</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{totalStaff}</div><div className="text-xs text-gray-500">Total Staff</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{DEPARTMENTS.length}</div><div className="text-xs text-gray-500">Departments</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{roles.filter((r) => r.isActive).length}</div><div className="text-xs text-gray-500">Active Roles</div></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role.id} className={`bg-white rounded-xl border p-4 cursor-pointer transition ${selected?.id === role.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`} onClick={() => setSelected(selected?.id === role.id ? null : role)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{role.name}</h3>
                <p className="text-xs text-gray-500">{role.department} · {role.staffCount} staff</p>
              </div>
              <Badge tone={role.isActive ? 'green' : 'gray'}>{role.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{role.description}</p>
            <div className="flex flex-wrap gap-1">{role.permissions.slice(0, 5).map((p) => <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p}</span>)}
              {role.permissions.length > 5 && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{role.permissions.length - 5} more</span>}
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Create New Role</h2>
            <div className="space-y-3">
              <div><label className="block text-sm mb-1">Role Name *</label><Input placeholder="e.g. Consultant" /></div>
              <div><label className="block text-sm mb-1">Department *</label><select className="w-full border rounded-lg p-2 text-sm">{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label className="block text-sm mb-1">Description *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Role created'); }}>Create Role</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
