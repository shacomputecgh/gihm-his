import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

const FEATURE_HELP: Record<string, { title: string; content: string; steps?: string[] }> = {
  'dashboard': { title: 'Dashboard', content: 'Your facility\'s command center showing real-time metrics, alerts, and quick actions.', steps: ['Review key metrics daily', 'Use quick actions for common tasks', 'Check disease surveillance'] },
  'patients': { title: 'Patient Records', content: 'Manage patient demographics, medical history, and contact information.', steps: ['Search by name or MRN', 'Verify identity before treatment', 'Keep contact info updated'] },
  'queue': { title: 'Patient Queue', content: 'Track patient flow from check-in to department routing.', steps: ['Assign priority levels', 'Monitor wait times', 'Route to correct department'] },
  'appointments': { title: 'Appointments', content: 'Schedule and manage patient visits with doctors.', steps: ['Book follow-ups before discharge', 'Send SMS reminders', 'Use calendar view for planning'] },
  'pharmacy': { title: 'Pharmacy', content: 'Dispense medications, track inventory, and check drug interactions.', steps: ['Check expiry dates (FEFO)', 'Verify drug interactions', 'Record all dispensing'] },
  'laboratory': { title: 'Laboratory', content: 'Manage lab orders, results, and quality control.', steps: ['Label all samples', 'Flag critical results', 'Include reference ranges'] },
  'billing': { title: 'Billing & Payments', content: 'Generate invoices, process payments, and manage financial transactions.', steps: ['Issue receipts for all payments', 'Reconcile daily takings', 'Process insurance claims'] },
  'insurance': { title: 'Insurance', content: 'Manage NHIS and private insurance claims.', steps: ['Verify NHIS before every visit', 'Keep claim docs complete', 'Track claim status'] },
  'stock': { title: 'Stock & Inventory', content: 'Track hospital supplies, drugs, and equipment.', steps: ['Use FEFO (First Expiry First Out)', 'Set reorder levels', 'Regular stock counts'] },
  'admissions': { title: 'Admissions', content: 'Manage patient admissions, transfers, and discharges.', steps: ['Check bed availability', 'Document clinical decisions', 'Include follow-up in discharge'] },
  'surveillance': { title: 'Disease Surveillance', content: 'Report and track notifiable diseases for GHS compliance.', steps: ['Report within 24 hours', 'Keep contact tracing updated', 'Follow up on open cases'] },
  'settings': { title: 'System Settings', content: 'Configure your facility\'s API integrations (SMS, WhatsApp, Email, Payment).', steps: ['Test each API after setup', 'Keep API keys secure', 'Save settings after changes'] },
  'backup': { title: 'Backup & Restore', content: 'Create and restore data backups for safety.', steps: ['Backup before major changes', 'Store copies safely', 'Test restore periodically'] },
  'staff': { title: 'Staff Management', content: 'Manage staff roles, shifts, and schedules.', steps: ['Keep schedules updated', 'Track availability', 'Assign appropriate roles'] },
  'emergency': { title: 'Emergency Alerts', content: 'Trigger emergency codes and track response.', steps: ['Know the codes', 'Respond immediately', 'Acknowledge and resolve alerts'] },
  'drug-interactions': { title: 'Drug Interactions', content: 'Check for dangerous interactions between medications.', steps: ['Check before dispensing', 'Report severe interactions', 'Document the check'] },
  'beds': { title: 'Bed Management', content: 'Real-time bed allocation and occupancy tracking.', steps: ['Color codes indicate status', 'Track ward occupancy', 'Set maintenance when needed'] },
  'documents': { title: 'Documents', content: 'Upload, store, and retrieve patient documents.', steps: ['Use consistent naming', 'Tag for easy retrieval', 'Maintain document types'] },
  'telemedicine': { title: 'Telemedicine', content: 'Conduct virtual consultations with patients.', steps: ['Test audio/video first', 'Document consultation notes', 'Schedule follow-ups'] },
  'referrals': { title: 'Referrals', content: 'Manage patient referrals between facilities.', steps: ['Include clinical summary', 'Track referral status', 'Follow up on pending'] },
  'reports': { title: 'Reports', content: 'Generate clinical, financial, and operational reports.', steps: ['Set appropriate date range', 'Export for analysis', 'Schedule recurring reports'] },
  'revenue': { title: 'Revenue Dashboard', content: 'Financial analytics and department performance.', steps: ['Review weekly', 'Compare with previous periods', 'Track payment methods'] },
};

export function HelpTooltip({ content, title, children, className = '' }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className={`relative inline-block ${className}`} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children || (
        <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 hover:bg-blue-200 transition">
          ?
        </span>
      )}
      {show && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
          {title && <div className="mb-1 font-bold text-slate-800 text-sm">{title}</div>}
          <div className="text-xs text-slate-600 leading-relaxed">{content}</div>
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white" />
        </div>
      )}
    </span>
  );
}

export function FeatureHelpIcon({ featureKey }: { featureKey: string }) {
  const help = FEATURE_HELP[featureKey];
  if (!help) return null;
  return <HelpTooltip title={help.title} content={help.content + (help.steps ? '\n\n' + help.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '')} />;
}

export { FEATURE_HELP };
