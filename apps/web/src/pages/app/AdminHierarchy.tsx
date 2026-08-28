import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Card, Badge, PageHeader, StatCard } from '../../components/ui';


type RoleLevel = 'super_admin' | 'national' | 'regional' | 'district' | 'circuit' | 'assembly' | 'staff';

interface AdminRole {
  level: RoleLevel;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  badgeTone: 'red' | 'navy' | 'blue' | 'gold' | 'green' | 'gray';
  scope: string;
  reportsTo: string | null;
  manages: string[];
  permissions: string[];
  staffCount: number;
  userCount: number;
  facilities: string;
  description: string;
}

const ROLE_HIERARCHY: AdminRole[] = [
  {
    level: 'super_admin',
    title: 'Super Administrator',
    subtitle: 'Platform Owner / System Developer',
    icon: '👑',
    badge: 'SUPER_ADMIN',
    badgeTone: 'red',
    scope: 'PLATFORM',
    reportsTo: null,
    manages: ['national', 'regional', 'district', 'circuit', 'assembly', 'staff'],
    permissions: ['Full platform access', 'System configuration', 'Security policy', 'License management', 'API credentials', 'Database access', 'User management (all)', 'Audit trail (all)', 'Developer console'],
    staffCount: 1,
    userCount: 1,
    facilities: 'All facilities globally',
    description: 'The Super Administrator has unrestricted access to every feature, configuration, and data in the system. Only the platform developer holds this role. Can manage all other admin levels.',
  },
  {
    level: 'national',
    title: 'National Administrator',
    subtitle: 'Ministry of Health / Ghana Health Service',
    icon: '🇬🇭',
    badge: 'NATIONAL_ADMIN',
    badgeTone: 'navy',
    scope: 'NATIONAL',
    reportsTo: 'Super Administrator',
    manages: ['regional', 'district', 'circuit', 'assembly', 'staff'],
    permissions: ['National facility registry', 'All regional data', 'National surveillance', 'DHIMS-II reporting', 'National staff management', 'Policy configuration', 'National analytics', 'Audit trail (national)'],
    staffCount: 15,
    userCount: 156,
    facilities: 'All facilities nationally',
    description: 'Manages the entire national health information system. Oversees all regions, districts, and facilities. Sets national policies, monitors disease surveillance, and generates DHIMS-II reports.',
  },
  {
    level: 'regional',
    title: 'Regional Administrator',
    subtitle: 'Regional Health Directorate',
    icon: '🗺️',
    badge: 'REGIONAL_ADMIN',
    badgeTone: 'blue',
    scope: 'REGIONAL',
    reportsTo: 'National Administrator',
    manages: ['district', 'circuit', 'assembly', 'staff'],
    permissions: ['Regional facility management', 'District data aggregation', 'Regional surveillance', 'Regional analytics', 'Staff within region', 'Regional reporting'],
    staffCount: 8,
    userCount: 89,
    facilities: 'All facilities in region',
    description: 'Manages all districts and facilities within a specific region. Monitors regional health indicators, coordinates inter-district transfers, and reports to the national level.',
  },
  {
    level: 'district',
    title: 'District Administrator',
    subtitle: 'District Health Directorate',
    icon: '🏛️',
    badge: 'DISTRICT_ADMIN',
    badgeTone: 'gold',
    scope: 'DISTRICT',
    reportsTo: 'Regional Administrator',
    manages: ['circuit', 'assembly', 'staff'],
    permissions: ['District facility management', 'Circuit data aggregation', 'District surveillance', 'Staff within district', 'District reporting', 'Community health programs'],
    staffCount: 5,
    userCount: 45,
    facilities: 'All facilities in district',
    description: 'Manages all circuits and facilities within a district. Oversees community health programs, manages district-level reporting, and coordinates with regional authorities.',
  },
  {
    level: 'circuit',
    title: 'Circuit Administrator',
    subtitle: 'Circuit Health Team',
    icon: '🔗',
    badge: 'CIRCUIT_ADMIN',
    badgeTone: 'green',
    scope: 'CIRCUIT',
    reportsTo: 'District Administrator',
    manages: ['assembly', 'staff'],
    permissions: ['Circuit facility management', 'Assembly data aggregation', 'Circuit surveillance', 'Staff within circuit', 'Circuit reporting', 'Outreach coordination'],
    staffCount: 3,
    userCount: 28,
    facilities: 'All facilities in circuit',
    description: 'Manages assemblies and facilities within a health circuit. Coordinates outreach activities, monitors circuit-level indicators, and reports to the district level.',
  },
  {
    level: 'assembly',
    title: 'Assembly Administrator',
    subtitle: 'Assembly Health Committee',
    icon: '🏘️',
    badge: 'ASSEMBLY_ADMIN',
    badgeTone: 'gray',
    scope: 'ASSEMBLY',
    reportsTo: 'Circuit Administrator',
    manages: ['staff'],
    permissions: ['Assembly facility management', 'Community health data', 'Assembly surveillance', 'Staff within assembly', 'Assembly reporting', 'Community outreach'],
    staffCount: 2,
    userCount: 18,
    facilities: 'All facilities in assembly',
    description: 'Manages health facilities within an assembly. Coordinates with community health workers, monitors assembly-level health indicators, and reports to the circuit level.',
  },
  {
    level: 'staff',
    title: 'Facility Staff',
    subtitle: 'Hospital / Clinic Staff',
    icon: '🏥',
    badge: 'STAFF',
    badgeTone: 'gray',
    scope: 'FACILITY',
    reportsTo: 'Assembly Administrator',
    manages: [],
    permissions: ['Patient management', 'Clinical records', 'Pharmacy operations', 'Laboratory orders', 'Appointments', 'Queue management', 'Billing (facility)'],
    staffCount: 0,
    userCount: 1240,
    facilities: 'Assigned facility only',
    description: 'Regular hospital and clinic staff who directly provide healthcare services. Roles include doctors, nurses, pharmacists, lab technicians, and administrative staff.',
  },
];

const MANAGER_ROLE: { title: string; description: string; permissions: string[] } = {
  title: 'Manager (Head of Staff)',
  description: 'At each administrative level, the Manager serves as the head of staff. The Manager has all permissions of their level plus additional staff management capabilities.',
  permissions: [
    'All permissions of their admin level',
    'Staff supervision and performance reviews',
    'Shift scheduling and duty roster management',
    'Training coordination and certification tracking',
    'Incident reporting and investigation',
    'Budget management for their unit',
    'Equipment and supply requisition approval',
    'Inter-level communication and reporting',
    'Emergency response coordination',
    'Quality assurance and compliance monitoring',
  ],
};

const ALL_PERMISSIONS = [
  'view_patient', 'write_patient', 'manage_patient',
  'view_clinical_record', 'write_clinical_note',
  'dispense', 'manage_pharmacy', 'manage_stock',
  'verify_lab', 'order_lab',
  'manage_appointments', 'manage_queue',
  'process_payment', 'view_financial',
  'manage_surveillance', 'view_surveillance',
  'manage_staff', 'view_staff',
  'manage_facility', 'view_facility',
  'manage_reports', 'view_reports',
  'admin_config', 'admin_security',
  'view_audit', 'manage_users',
];

export default function AdminHierarchy() {

  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [showManager, setShowManager] = useState(false);

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Hierarchy Level"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Administrative Hierarchy"
        subtitle="Complete role-based access control — from Super Administrator down to Facility Staff. Each level has a Manager as head of staff."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Admin Roles" value={ROLE_HIERARCHY.length} tone="navy" icon="shield" />
        <StatCard label="Total Users" value={ROLE_HIERARCHY.reduce((s, r) => s + r.userCount, 0)} tone="green" icon="users" />
        <StatCard label="Admin Staff" value={ROLE_HIERARCHY.reduce((s, r) => s + r.staffCount, 0)} tone="blue" icon="users" />
        <StatCard label="Active Facilities" value="45" tone="gold" icon="pill" />
      </div>

      {/* Hierarchy Tree Visualization */}
      <Card title="Role Hierarchy Tree" subtitle="Each level reports to the one above it. Managers (head of staff) exist at every admin level.">
        <div className="space-y-3">
          {ROLE_HIERARCHY.map((role, i) => (
            <div key={role.level}>
              <button
                onClick={() => { setSelectedRole(role); setShowManager(false); }}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  selectedRole?.level === role.level
                    ? 'border-g-green bg-green-50/50 dark:bg-green-900/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
                style={{ marginLeft: `${i * 24}px` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {i > 0 && <span className="text-slate-300">{'│'}</span>}
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-g-ink dark:text-white">{role.title}</h3>
                        <Badge tone={role.badgeTone}>{role.badge}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{role.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="tabular-nums">{role.userCount} users</span>
                    {role.staffCount > 0 && <span className="tabular-nums">{role.staffCount} staff</span>}
                    <span>→</span>
                  </div>
                </div>
              </button>

              {/* Manager Card (inline) */}
              {i < ROLE_HIERARCHY.length - 1 && i < 6 && (
                <div className="ml-8 mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-bold text-g-green">└─ Manager (Head of Staff)</span>
                  <button
                    onClick={() => setShowManager(!showManager)}
                    className="text-g-green underline"
                  >
                    {showManager ? 'hide details' : 'view details'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Manager Details */}
      {showManager && (
        <Card>
          <h3 className="mb-3 text-lg font-bold text-g-ink dark:text-white">👔 {MANAGER_ROLE.title}</h3>
          <p className="mb-4 text-sm text-slate-500">{MANAGER_ROLE.description}</p>
          <h4 className="mb-2 text-xs font-bold uppercase text-slate-400">Manager Permissions</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MANAGER_ROLE.permissions.map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm dark:bg-green-900/10">
                <span className="text-g-green">✓</span>
                <span className="text-g-ink dark:text-white">{p}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Role Detail Panel */}
      {selectedRole && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl">{selectedRole.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-g-ink dark:text-white">{selectedRole.title}</h3>
                <p className="text-sm text-slate-500">{selectedRole.subtitle}</p>
              </div>
              <Badge tone={selectedRole.badgeTone}>{selectedRole.badge}</Badge>
            </div>

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{selectedRole.description}</p>

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Scope</dt><dd className="font-semibold text-g-ink dark:text-white">{selectedRole.scope}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Reports To</dt><dd className="text-g-ink dark:text-white">{selectedRole.reportsTo ?? '— (top level)'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Manages</dt><dd className="text-g-ink dark:text-white">{selectedRole.manages.length > 0 ? selectedRole.manages.join(', ').toUpperCase() : '— (leaf level)'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Coverage</dt><dd className="text-g-ink dark:text-white">{selectedRole.facilities}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Users</dt><dd className="tabular-nums font-bold text-g-ink dark:text-white">{selectedRole.userCount}</dd></div>
              {selectedRole.staffCount > 0 && (
                <div className="flex justify-between"><dt className="text-slate-400">Admin Staff</dt><dd className="tabular-nums font-bold text-g-ink dark:text-white">{selectedRole.staffCount}</dd></div>
              )}
            </dl>
          </Card>

          <Card title="Permissions" subtitle={`${selectedRole.permissions.length} permissions granted at this level`}>
            <div className="space-y-2">
              {selectedRole.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <span className="text-g-green">✓</span>
                  <span className="text-sm text-g-ink dark:text-white">{p}</span>
                </div>
              ))}
            </div>

            {selectedRole.level !== 'staff' && (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-400">Subordinate Levels</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRole.manages.map((m) => {
                    const sub = ROLE_HIERARCHY.find((r) => r.level === m);
                    return sub ? (
                      <button
                        key={m}
                        onClick={() => setSelectedRole(sub)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {sub.icon} {sub.title}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Quick Role Reference */}
      <Card title="Quick Role Reference" subtitle="All roles at a glance with scope and key permissions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                {['Level', 'Role', 'Scope', 'Reports To', 'Users', 'Key Permissions'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {ROLE_HIERARCHY.map((r) => (
                <tr key={r.level} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 text-lg">{r.icon}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-g-ink dark:text-white">{r.title}</p>
                    <Badge tone={r.badgeTone}>{r.badge}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-500">{r.scope}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{r.reportsTo ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-xs">{r.userCount}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 max-w-xs truncate">{r.permissions.slice(0, 3).join(', ')}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* All Permissions Matrix */}
      <Card title="Full Permissions Matrix" subtitle="Complete list of all system permissions across roles">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                <th className="px-2 py-2 font-semibold">Permission</th>
                {ROLE_HIERARCHY.map((r) => (
                  <th key={r.level} className="px-2 py-2 text-center font-semibold">{r.icon}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {ALL_PERMISSIONS.map((perm) => (
                <tr key={perm} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-300">{perm}</td>
                  {ROLE_HIERARCHY.map((r) => {
                    const hasPerm = r.level === 'super_admin' || r.level === 'national' ||
                      (r.level === 'regional' && !perm.startsWith('admin_')) ||
                      (r.level === 'district' && !perm.startsWith('admin_')) ||
                      (r.level === 'circuit' && (perm.startsWith('view_') || perm.startsWith('write_') || perm === 'manage_queue' || perm === 'manage_appointments')) ||
                      (r.level === 'assembly' && (perm.startsWith('view_') || perm === 'manage_queue')) ||
                      (r.level === 'staff' && (perm.startsWith('view_') || perm.startsWith('write_') || perm === 'manage_queue' || perm === 'manage_appointments'));
                    return (
                      <td key={r.level} className="px-2 py-1.5 text-center">
                        {hasPerm ? (
                          <span className="text-g-green">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
