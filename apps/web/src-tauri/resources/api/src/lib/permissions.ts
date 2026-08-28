// =====================================================================
// Permission catalog (docs/06-role-permission-matrix.md, docs/24).
// Single source of truth for the Roles & Permissions admin editor and
// the seed script. Each permission has a code (stored in Role.permissions
// as a JSON array), a human label and a UI group.
// ---------------------------------------------------------------------

export interface PermissionInfo {
  code: string;
  label: string;
  group: string;
}

export const PERMISSIONS: PermissionInfo[] = [
  // --- Patient records ---
  { code: 'view_patient', label: 'View patient records', group: 'Patient records' },
  { code: 'create_patient', label: 'Register patients', group: 'Patient records' },
  { code: 'edit_patient', label: 'Edit patient records', group: 'Patient records' },
  { code: 'manage_patient_records', label: 'Manage patient records (merge, archive)', group: 'Patient records' },

  // --- Clinical care ---
  { code: 'view_clinical_record', label: 'View clinical records', group: 'Clinical care' },
  { code: 'write_clinical_note', label: 'Write clinical notes', group: 'Clinical care' },
  { code: 'prescribe', label: 'Prescribe medication', group: 'Clinical care' },
  { code: 'dispense', label: 'Dispense medication', group: 'Clinical care' },
  { code: 'order_lab', label: 'Order laboratory tests', group: 'Clinical care' },
  { code: 'verify_lab', label: 'Verify laboratory results', group: 'Clinical care' },
  { code: 'manage_theatre', label: 'Manage theatre & surgery', group: 'Clinical care' },
  { code: 'manage_blood_bank', label: 'Manage blood bank', group: 'Clinical care' },
  { code: 'view_surveillance', label: 'View disease surveillance', group: 'Clinical care' },
  { code: 'manage_surveillance', label: 'Report & manage disease surveillance', group: 'Clinical care' },

  // --- Appointments & queue ---
  { code: 'view_appointments', label: 'View appointments', group: 'Operations' },
  { code: 'book_appointment', label: 'Book appointments', group: 'Operations' },
  { code: 'view_queue', label: 'View queue', group: 'Operations' },
  { code: 'manage_queue', label: 'Manage queue', group: 'Operations' },
  { code: 'manage_ambulance', label: 'Manage ambulances', group: 'Operations' },
  { code: 'manage_stock', label: 'Manage stock & inventory', group: 'Operations' },

  // --- Finance & reporting ---
  { code: 'view_financial', label: 'View financial records', group: 'Finance & reporting' },
  { code: 'process_payment', label: 'Process payments', group: 'Finance & reporting' },
  { code: 'view_reports', label: 'View reports', group: 'Finance & reporting' },
  { code: 'export_data', label: 'Export data', group: 'Finance & reporting' },
  { code: 'view_dashboard', label: 'View dashboard', group: 'Finance & reporting' },

  // --- Administration & governance ---
  { code: 'manage_users', label: 'Manage users', group: 'Administration' },
  { code: 'manage_facility', label: 'Manage facilities', group: 'Administration' },
  { code: 'manage_region', label: 'Manage regions', group: 'Administration' },
  { code: 'manage_district', label: 'Manage districts', group: 'Administration' },
  { code: 'manage_devices', label: 'Manage devices', group: 'Administration' },
  { code: 'manage_sync_conflicts', label: 'Review & resolve sync conflicts', group: 'Administration' },
  { code: 'manage_system_settings', label: 'Manage system settings', group: 'Administration' },
  { code: 'manage_epi_schedule', label: 'Edit EPI immunization schedule', group: 'Administration' },
  { code: 'manage_roles_permissions', label: 'Edit roles & permissions', group: 'Administration' },
  { code: 'review_facility_applications', label: 'Review facility applications', group: 'Administration' },
  { code: 'view_audit', label: 'View audit log', group: 'Administration' },
  { code: 'manage_integrations', label: 'Manage national integrations (DHIMS2/SORMAS)', group: 'Administration' },
  { code: 'manage_scheduled_reports', label: 'Manage scheduled reports', group: 'Administration' },

  // --- Developer (docs/25) ---
  { code: 'developer_mode', label: 'Developer mode — full system control', group: 'Developer' },

  // --- Platform ---
  { code: 'sync_data', label: 'Synchronise offline data', group: 'Platform' },
  { code: 'self_access', label: 'Patient portal access', group: 'Platform' },
];

export const PERMISSION_CODES = new Set(PERMISSIONS.map((p) => p.code));

// DEVELOPER is deliberately NOT an editable scope: it is the platform
// developer's structural bypass (docs/25) and can only be granted via the
// seed or the developer user-management endpoints.
export const ROLE_SCOPES = ['NATIONAL', 'REGIONAL', 'DISTRICT', 'FACILITY', 'PATIENT'];

