/**
 * System Guide PDF Generator
 * Generates a printable PDF version of the System Guide for staff training.
 * Uses browser's print API with a specially formatted print view.
 */

export interface GuideModule {
  id: string;
  name: string;
  icon: string;
  section: string;
  description: string;
  steps: string[];
  tips?: string[];
  permissions?: string[];
  path: string;
}

const GUIDE_DATA: GuideModule[] = [
  {
    id: 'dashboard', name: 'Dashboard', icon: '🏠', section: 'Clinical',
    description: 'The main command center showing key metrics, alerts, and quick actions for your facility.',
    steps: [
      'Login to see your facility dashboard',
      'Review key metrics: patients today, revenue, bed occupancy',
      'Check the 7-day patient activity chart',
      'Review disease surveillance data',
      'Use quick actions for common tasks',
      'Monitor queue waiting and admissions',
    ],
    tips: ['Dashboard refreshes every 30 seconds', 'Use quick actions to speed up common workflows'],
    permissions: ['view_patient', 'view_dashboard'],
    path: '/app',
  },
  {
    id: 'patients', name: 'Patients', icon: '👥', section: 'Clinical',
    description: 'Manage patient records, search, view history, and register new patients.',
    steps: [
      'Navigate to Patients from the sidebar',
      'Search for existing patients by name, MRN, or phone',
      'Click "Register New" to add a new patient',
      'Fill in demographic information (name, DOB, gender, contact)',
      'Add emergency contact details',
      'Select insurance type (NHIS, Private, Self-Pay)',
      'Save the patient record',
      'View patient history and past visits',
    ],
    tips: ['Use MRN for quick lookups', 'Always verify patient identity before treatment'],
    permissions: ['view_patient', 'write_patient'],
    path: '/app/patients',
  },
  {
    id: 'register-patient', name: 'Register Patient', icon: '➕', section: 'Clinical',
    description: 'Register new patients with their demographic and contact information.',
    steps: [
      'Click "Register Patient" in the sidebar',
      'Enter full name (surname first)',
      'Select date of birth or age',
      'Select gender',
      'Enter phone number and email (if available)',
      'Enter residential address',
      'Select region and district',
      'Add next-of-kin information',
      'Select insurance type',
      'Upload patient photo (optional)',
      'Review and save',
    ],
    tips: ['Phone numbers are useful for SMS notifications', 'NHIS patients need their NHIS card number'],
    permissions: ['write_patient'],
    path: '/app/register-patient',
  },
  {
    id: 'queue', name: 'Patient Queue', icon: '📋', section: 'Clinical',
    description: 'Manage the patient queue — check in, triage, and route patients to departments.',
    steps: [
      'View the current queue on the Queue page',
      'Click "Add to Queue" to check in a patient',
      'Select the patient from the search',
      'Choose the department (OPD, Emergency, Specialist)',
      'Assign priority level (Normal, Urgent, Emergency)',
      'Triage nurse reviews and updates status',
      'Doctor sees patient and updates queue status',
      'Patient completes visit and is removed from queue',
    ],
    tips: ['Emergency cases bypass the queue', 'Monitor wait times to improve patient satisfaction'],
    permissions: ['view_patient', 'manage_queue'],
    path: '/app/queue',
  },
  {
    id: 'appointments', name: 'Appointments', icon: '📅', section: 'Clinical',
    description: 'Schedule, manage, and track patient appointments with doctors.',
    steps: [
      'Navigate to Appointments',
      'Click "New Appointment" button',
      'Select the patient',
      'Choose the doctor/specialist',
      'Select appointment date and time slot',
      'Enter reason for visit',
      'Set appointment type (Consultation, Follow-up, Procedure)',
      'Confirm and save',
      'Send SMS reminder to patient',
      'On the day: check in patient and update status',
    ],
    tips: ['Book follow-up appointments before patient leaves', 'Use the calendar view for weekly planning'],
    permissions: ['view_appointment', 'write_appointment'],
    path: '/app/appointments',
  },
  {
    id: 'pharmacy', name: 'Pharmacy', icon: '💊', section: 'Clinical',
    description: 'Full pharmacy management — prescriptions, dispensing, inventory, and drug database.',
    steps: [
      'Receive prescriptions from doctors',
      'Search for prescribed medications in the drug database',
      'Check stock availability and expiry dates',
      'Verify drug interactions with other patient medications',
      'Dispense medication and record in patient file',
      'Print dispensing label with dosage instructions',
      'Process payment or insurance claim',
      'Update stock levels automatically',
      'Monitor low-stock alerts and reorder',
      'Review controlled substance dispensing logs',
    ],
    tips: ['Always check expiry dates (FEFO — First Expiry First Out)', 'Flag drug interactions before dispensing'],
    permissions: ['view_pharmacy', 'dispense_medication'],
    path: '/app/pharmacy',
  },
  {
    id: 'laboratory', name: 'Laboratory', icon: '🧪', section: 'Clinical',
    description: 'Manage lab orders, results, and quality control for all laboratory tests.',
    steps: [
      'Receive lab orders from doctors',
      'Register the sample with barcode/label',
      'Perform the test and record results',
      'Enter results with reference ranges',
      'Flag abnormal values (critical/high/low)',
      'Review and approve results',
      'Release results to patient file',
      'Notify doctor of critical results',
      'Generate lab report',
      'Archive results for historical comparison',
    ],
    tips: ['Critical results should be communicated immediately', 'Always include reference ranges for interpretation'],
    permissions: ['view_lab', 'write_lab_result'],
    path: '/app/laboratory',
  },
  {
    id: 'admissions', name: 'Admissions', icon: '🏥', section: 'Clinical',
    description: 'Manage patient admissions, transfers, and discharges.',
    steps: [
      'Receive admission request from doctor',
      'Check bed availability',
      'Register admission with diagnosis',
      'Assign bed/ward',
      'Create admission orders',
      'Daily nursing notes and vitals',
      'Doctor rounds and progress notes',
      'Process discharge when ready',
      'Generate discharge summary',
      'Final billing and insurance claim',
    ],
    tips: ['Document all clinical decisions', 'Ensure discharge summary includes follow-up plan'],
    permissions: ['view_admission', 'write_admission'],
    path: '/app/admissions',
  },
  {
    id: 'beds', name: 'Bed Management', icon: '🛏️', section: 'Clinical',
    description: 'Real-time bed allocation, ward status, and occupancy tracking.',
    steps: [
      'View ward overview with bed grid',
      'Check bed availability by ward',
      'Allocate bed to admitted patient',
      'Track bed status (Available/Occupied/Reserved/Maintenance)',
      'Transfer patient between beds/wards',
      'Discharge patient and free bed',
      'Set bed to maintenance mode when needed',
      'Monitor occupancy rates by ward',
    ],
    tips: ['Color codes: Green=Available, Red=Occupied, Yellow=Reserved, Gray=Maintenance', 'ICU beds require special authorization'],
    permissions: ['view_patient', 'manage_beds'],
    path: '/app/bed-management',
  },
  {
    id: 'blood-bank', name: 'Blood Bank', icon: '🩸', section: 'Clinical',
    description: 'Manage blood units — collection, testing, storage, and transfusion tracking.',
    steps: [
      'Register blood donation',
      'Record donor information and screening',
      'Process blood unit (label, test, store)',
      'Track blood units by type and expiry',
      'Issue blood for transfusion',
      'Record transfusion reaction if any',
      'Monitor stock levels by blood type',
    ],
    tips: ['Always verify blood type compatibility', 'Track expiry dates for all units'],
    permissions: ['view_blood_bank', 'manage_blood_bank'],
    path: '/app/blood-bank',
  },
  {
    id: 'theatre', name: 'Theatre', icon: ' scalpel', section: 'Clinical',
    description: 'Surgery scheduling, theatre management, and surgical records.',
    steps: [
      'Schedule surgery with date and time',
      'Assign surgical team (surgeon, anaesthetist, nurse)',
      'Prepare theatre checklist',
      'Record pre-operative assessment',
      'Document intra-operative notes',
      'Record post-operative care',
      'Track theatre utilization',
    ],
    tips: ['Always complete the WHO Surgical Safety Checklist', 'Update theatre status in real-time'],
    permissions: ['view_theatre', 'manage_theatre'],
    path: '/app/theatre',
  },
  {
    id: 'radiology', name: 'Radiology', icon: '📡', section: 'Clinical',
    description: 'Manage imaging orders, results, and PACS integration.',
    steps: [
      'Receive imaging order from doctor',
      'Schedule the imaging study',
      'Perform the imaging procedure',
      'Upload images to system',
      'Radiologist reviews and reports',
      'Release report to patient file',
      'Notify doctor of critical findings',
    ],
    tips: ['Include clinical indication for every study', 'Flag urgent findings immediately'],
    permissions: ['view_radiology', 'write_radiology'],
    path: '/app/radiology',
  },
  {
    id: 'telemedicine', name: 'Telemedicine', icon: '💻', section: 'Clinical',
    description: 'Virtual consultations and remote patient monitoring.',
    steps: [
      'Schedule virtual consultation',
      'Send video link to patient',
      'Conduct video consultation',
      'Document consultation notes',
      'Prescribe medication if needed',
      'Schedule follow-up',
    ],
    tips: ['Test audio/video before each session', 'Ensure good internet connection'],
    permissions: ['view_telemedicine', 'manage_telemedicine'],
    path: '/app/telemedicine',
  },
  {
    id: 'referrals', name: 'Referrals', icon: '🔄', section: 'Clinical',
    description: 'Manage patient referrals between facilities and departments.',
    steps: [
      'Create referral for patient',
      'Select receiving facility/department',
      'Attach clinical summary and records',
      'Send referral electronically',
      'Track referral status',
      'Receive referral response',
      'Update patient record',
    ],
    tips: ['Include all relevant clinical information', 'Follow up on pending referrals'],
    permissions: ['view_referral', 'write_referral'],
    path: '/app/referrals',
  },
  {
    id: 'emergency-alerts', name: 'Emergency Alerts', icon: '🚨', section: 'Clinical',
    description: 'Trigger and manage emergency alerts — Code Blue, Code Red, and more.',
    steps: [
      'Click the emergency alert button',
      'Select emergency type (Code Blue, Red, etc.)',
      'Enter location of emergency',
      'Add description of situation',
      'Trigger alert — all staff notified',
      'Acknowledge alert when responded',
      'Resolve alert when situation is handled',
      'Review alert history and response times',
    ],
    tips: ['Code Blue = Medical Emergency', 'Code Red = Fire', 'Code Black = Bomb Threat'],
    permissions: ['view_emergency', 'trigger_emergency'],
    path: '/app/emergency-alerts',
  },
  {
    id: 'documents', name: 'Documents', icon: '📁', section: 'Clinical',
    description: 'Upload, store, and retrieve patient documents and medical records.',
    steps: [
      'Navigate to Documents',
      'Click "Upload Document"',
      'Select document type (Lab, Prescription, Imaging, etc.)',
      'Associate with patient',
      'Upload file (drag-and-drop or browse)',
      'Add description and tags',
      'Save document',
      'Search and retrieve when needed',
    ],
    tips: ['Use consistent naming conventions', 'Tag documents for easy retrieval'],
    permissions: ['view_document', 'write_document'],
    path: '/app/documents',
  },
  {
    id: 'immunizations', name: 'Immunizations', icon: '💉', section: 'Clinical',
    description: 'Track patient immunizations and vaccination schedules.',
    steps: [
      'Open patient record',
      'Navigate to Immunizations tab',
      'Select vaccine from catalogue',
      'Record batch number and expiry',
      'Enter date of administration',
      'Record site of injection',
      'Add any adverse reactions',
      'Print immunization card',
    ],
    tips: ['Follow the Ghana Expanded Programme on Immunization (EPI) schedule', 'Track due dates for next doses'],
    permissions: ['view_immunization', 'write_immunization'],
    path: '/app/immunizations',
  },
  {
    id: 'stock', name: 'Stock & Inventory', icon: '📦', section: 'Operations',
    description: 'Manage hospital inventory — drugs, supplies, equipment with batch tracking.',
    steps: [
      'View current stock levels',
      'Add new stock item',
      'Record supplier and purchase details',
      'Enter batch number and expiry date',
      'Set reorder level and minimum stock',
      'Process stock adjustments',
      'Record damaged/expired stock write-offs',
      'Generate stock reports',
      'Monitor expiry alerts',
    ],
    tips: ['Use FEFO (First Expiry First Out)', 'Regular stock counts improve accuracy'],
    permissions: ['view_stock', 'write_stock'],
    path: '/app/stock',
  },
  {
    id: 'insurance', name: 'Insurance', icon: '💳', section: 'Operations',
    description: 'Manage insurance claims — NHIS, private insurance, and patient coverage.',
    steps: [
      'Register patient insurance details',
      'Verify NHIS membership status',
      'Process insurance claims',
      'Submit claims electronically',
      'Track claim status',
      'Handle rejected claims',
      'Generate insurance reports',
    ],
    tips: ['Verify NHIS status before every visit', 'Keep claim documentation complete'],
    permissions: ['view_insurance', 'write_insurance'],
    path: '/app/insurance',
  },
  {
    id: 'billing', name: 'Billing', icon: '💰', section: 'Operations',
    description: 'Generate bills, process payments, and manage financial transactions.',
    steps: [
      'Select patient for billing',
      'Add billable items (consultation, lab, pharmacy, etc.)',
      'Apply insurance coverage if applicable',
      'Generate invoice',
      'Process payment (cash, card, mobile money)',
      'Print receipt',
      'Record in financial ledger',
      'Process refunds if needed',
    ],
    tips: ['Always issue receipts for every payment', 'Reconcile daily takings'],
    permissions: ['view_billing', 'write_billing'],
    path: '/app/billing',
  },
  {
    id: 'revenue', name: 'Revenue Dashboard', icon: '📈', section: 'Operations',
    description: 'Financial analytics — revenue, expenses, profit, and department performance.',
    steps: [
      'View total revenue and expenses',
      'Check net profit margin',
      'Compare monthly revenue vs expenses',
      'Review department revenue breakdown',
      'Analyze payment method distribution',
      'Track insurance vs cash collections',
      'Export financial reports',
    ],
    tips: ['Review weekly for better cash flow management', 'Compare with previous periods'],
    permissions: ['view_revenue', 'view_billing'],
    path: '/app/revenue',
  },
  {
    id: 'reports', name: 'Reports', icon: '📊', section: 'Analytics',
    description: 'Generate and view facility reports — clinical, financial, and operational.',
    steps: [
      'Navigate to Reports',
      'Select report type',
      'Set date range and filters',
      'Generate report',
      'Review data and charts',
      'Export as PDF or CSV',
      'Schedule recurring reports',
    ],
    tips: ['Daily reports help track operations', 'Weekly summaries are good for management'],
    permissions: ['view_reports'],
    path: '/app/reports',
  },
  {
    id: 'surveillance', name: 'Surveillance', icon: '🔍', section: 'Analytics',
    description: 'Disease surveillance — report cases, track outbreaks, and comply with GHS requirements.',
    steps: [
      'Open Disease Surveillance',
      'Review active case register',
      'Report new suspected case',
      'Record case details (symptoms, contacts, history)',
      'Track case status (Suspected, Confirmed, Closed)',
      'Record contact tracing information',
      'Follow up on open cases',
      'Generate surveillance reports for GHS',
    ],
    tips: ['Report notifiable diseases within 24 hours', 'Keep contact tracing up to date'],
    permissions: ['view_surveillance', 'write_surveillance'],
    path: '/app/surveillance',
  },
  {
    id: 'feedback', name: 'Patient Feedback', icon: '⭐', section: 'Analytics',
    description: 'Collect and analyze patient satisfaction surveys.',
    steps: [
      'Navigate to Patient Feedback',
      'Review submitted surveys',
      'Analyze satisfaction scores by department',
      'Read patient comments',
      'Identify areas for improvement',
      'Share feedback with staff',
      'Track improvement over time',
    ],
    tips: ['Respond to negative feedback promptly', 'Celebrate positive reviews with staff'],
    permissions: ['view_feedback'],
    path: '/app/patient-satisfaction',
  },
  {
    id: 'clinical-dashboard', name: 'Clinical Dashboard', icon: '🩺', section: 'Analytics',
    description: 'Real-time monitoring of all departments with live vitals and bed occupancy.',
    steps: [
      'Open Clinical Dashboard',
      'Monitor all departments in real-time',
      'Check bed occupancy by ward',
      'Review patient vitals table',
      'Identify critical alerts',
      'Track average wait time',
      'Monitor department performance',
    ],
    tips: ['Red values indicate critical readings', 'Dashboard auto-refreshes every 5 seconds'],
    permissions: ['view_clinical_record', 'view_dashboard'],
    path: '/app/clinical-dashboard',
  },
  {
    id: 'system-settings', name: 'System Settings', icon: '⚙️', section: 'System Settings',
    description: 'Configure SMS, WhatsApp, Email, Payment, and custom integrations.',
    steps: [
      'Navigate to System Settings',
      'Review Overview tab for API status',
      'Configure SMS provider (Hellio/Twilio)',
      'Configure WhatsApp messaging',
      'Set up email (SMTP) settings',
      'Configure payment gateway (Paystack)',
      'Add custom API integrations',
      'Test each API after configuration',
      'Save all settings',
    ],
    tips: ['Test each API before going live', 'Keep API keys secure'],
    permissions: ['manage_facility'],
    path: '/app/system-settings',
  },
  {
    id: 'notifications', name: 'Notifications', icon: '🔔', section: 'System Tools',
    description: 'View all system notifications — alerts, warnings, and updates.',
    steps: [
      'Click the bell icon in the header',
      'View notification count badge',
      'Open Notification Center',
      'Filter by type (Alerts, Warnings, Info)',
      'Mark notifications as read',
      'Clear old notifications',
    ],
    tips: ['Check notifications regularly', 'Act on alerts promptly'],
    permissions: ['view_patient'],
    path: '/app/notifications',
  },
  {
    id: 'staff', name: 'Staff Management', icon: '👨‍⚕️', section: 'System Tools',
    description: 'Manage staff — roles, departments, shifts, and scheduling.',
    steps: [
      'View staff list',
      'Add new staff member',
      'Assign role and department',
      'Set shift schedule (Morning/Afternoon/Night)',
      'Update staff status (Active/On Leave)',
      'View weekly schedule',
      'Print staff roster',
    ],
    tips: ['Keep shift schedules updated', 'Track staff availability for coverage planning'],
    permissions: ['manage_staff'],
    path: '/app/staff',
  },
  {
    id: 'backup', name: 'Backup & Restore', icon: '💾', section: 'System Tools',
    description: 'Create backups, restore data, and configure automatic backup schedules.',
    steps: [
      'Navigate to Backup & Restore',
      'Click "Create Backup" for manual backup',
      'Select tables to backup',
      'Download backup file',
      'Configure automatic backup schedule',
      'Review backup history',
      'Restore from backup if needed',
    ],
    tips: ['Create backups before major changes', 'Store backups in a safe location'],
    permissions: ['manage_facility'],
    path: '/app/backup',
  },
  {
    id: 'drug-interactions', name: 'Drug Interactions', icon: '💊', section: 'System Tools',
    description: 'Check for dangerous drug interactions before prescribing.',
    steps: [
      'Open Drug Interaction Checker',
      'Select first drug from database',
      'Select second drug',
      'View interaction severity',
      'Review clinical advice',
      'Document interaction check in patient record',
    ],
    tips: ['Always check before dispensing multiple medications', 'Severe interactions require doctor consultation'],
    permissions: ['view_pharmacy', 'view_drug_database'],
    path: '/app/drug-interactions',
  },
  {
    id: 'developer', name: 'Developer Mode', icon: '👨‍💻', section: 'Developer',
    description: 'Platform-level control — users, security, licensing, and audit trail.',
    steps: [
      'Login as Developer (developer@demo.gh)',
      'Access Developer page from sidebar',
      'Manage user accounts and roles',
      'View security audit trail',
      'Manage facility licenses',
      'Configure platform settings',
      'View system analytics',
    ],
    tips: ['Developer console is for platform-level administration only', 'Keep audit trail enabled for compliance'],
    permissions: ['developer_mode'],
    path: '/app/developer',
  },
  {
    id: 'developer-console', name: 'Developer Console', icon: '🖥️', section: 'Developer',
    description: 'System diagnostics, API explorer, database queries, and configuration.',
    steps: [
      'Open Developer Console',
      'Run system diagnostics',
      'Explore API endpoints',
      'Execute database queries',
      'View system logs',
      'Configure environment variables',
      'Monitor system performance',
    ],
    tips: ['Use with caution — direct database changes are irreversible', 'Back up before making changes'],
    permissions: ['developer_mode'],
    path: '/app/developer-console',
  },
  {
    id: 'patient-portal', name: 'Patient Portal', icon: '🩺', section: 'Patient Portal',
    description: 'Patient-facing portal for viewing records, appointments, and lab results.',
    steps: [
      'Login as Patient',
      'View personal health summary',
      'Check upcoming appointments',
      'Review lab results',
      'View prescriptions',
      'Check billing history',
      'Download medical records',
    ],
    tips: ['Keep contact information updated', 'Review lab results before follow-up visits'],
    permissions: ['patient_portal'],
    path: '/patient/portal',
  },
];

export function generatePrintableGuide(): string {
  const sections: Record<string, GuideModule[]> = {};
  GUIDE_DATA.forEach((mod) => {
    if (!sections[mod.section]) sections[mod.section] = [];
    sections[mod.section]!.push(mod);
  });

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GIHM-HIS System Guide — ShaComputeC</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1e40af; margin-bottom: 5px; }
    .header h2 { font-size: 16px; color: #64748b; font-weight: normal; }
    .header .brand { font-size: 12px; color: #94a3b8; margin-top: 10px; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .section-title { font-size: 20px; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 5px; margin-bottom: 15px; }
    .module { margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; page-break-inside: avoid; }
    .module-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .module-header h3 { font-size: 15px; color: #0f172a; }
    .module-header .icon { font-size: 20px; }
    .module-desc { font-size: 12px; color: #64748b; margin-bottom: 8px; }
    .module-steps { list-style: none; padding: 0; }
    .module-steps li { font-size: 12px; padding: 2px 0 2px 20px; position: relative; }
    .module-steps li::before { content: counter(step); counter-increment: step; position: absolute; left: 0; background: #2563eb; color: white; border-radius: 50%; width: 16px; height: 16px; text-align: center; line-height: 16px; font-size: 10px; font-weight: bold; }
    .module-steps { counter-reset: step; }
    .module-tips { margin-top: 6px; padding: 6px 8px; background: #fef3c7; border-radius: 4px; font-size: 11px; color: #92400e; }
    .module-tips strong { color: #b45309; }
    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 10px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📖 GIHM-HIS System Guide</h1>
    <h2>Ghana Integrated Health Management System — Staff Training Manual</h2>
    <div class="brand">Developed by ShaComputeC · Hard Works Never Fail · © 2026</div>
  </div>`;

  for (const [section, modules] of Object.entries(sections)) {
    html += `<div class="section"><h2 class="section-title">${section}</h2>`;
    for (const mod of modules) {
      html += `<div class="module">
        <div class="module-header"><span class="icon">${mod.icon}</span><h3>${mod.name}</h3></div>
        <div class="module-desc">${mod.description}</div>
        <ol class="module-steps">${mod.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        ${mod.tips ? `<div class="module-tips"><strong>💡 Tips:</strong> ${mod.tips.join(' · ')}</div>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  html += `<div class="footer">
    <p>GIHM-HIS — Ghana Integrated Health Management System</p>
    <p>Developed by <strong>ShaComputeC</strong> · Hard Works Never Fail</p>
    <p>📧 shacomputec@gmail.com · 📞 0266692501</p>
    <p>© 2026 ShaComputeC · All rights reserved</p>
  </div>
  <div class="no-print" style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="padding:12px 30px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">🖨️ Print / Save as PDF</button>
  </div>
</body></html>`;

  return html;
}

export function openPrintableGuide(): void {
  const html = generatePrintableGuide();
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
