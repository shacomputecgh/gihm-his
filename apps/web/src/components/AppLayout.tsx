import { useEffect, useState, useCallback, useMemo } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { DemoBanner, Icon, type IconName } from './ui';
import { useTranslation } from '../lib/i18n';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SyncBadge } from './SyncBadge';
import LicenseBadge from './LicenseBadge';
import AlertBell from './AlertBell';
import { Logo } from './PortalLayout';
import { ErrorBoundary } from './ErrorBoundary';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { useKeyboard } from '../lib/useKeyboard';
import SearchModal from './SearchModal';
import ShaComputeCAI from './ShaComputeCAI';
import GettingStartedWizard from './GettingStartedWizard';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  perms?: string[];
  group?: string;
  tKey?: string;
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: 'home', perms: ['view_dashboard'], group: 'Overview', tKey: 'nav_dashboard' },
  { to: '/app/queue', label: 'Queue', icon: 'list', perms: ['view_queue', 'manage_queue'], group: 'Clinical', tKey: 'nav_queue' },
  { to: '/app/patients', label: 'Patients', icon: 'users', perms: ['view_patient'], group: 'Clinical', tKey: 'nav_patients' },
  { to: '/app/register', label: 'Register Patient', icon: 'plus', perms: ['create_patient'], group: 'Clinical', tKey: 'nav_register' },
  { to: '/app/appointments', label: 'Appointments', icon: 'calendar', perms: ['view_appointments'], group: 'Clinical', tKey: 'nav_appointments' },
  { to: '/app/pharmacy', label: 'Pharmacy', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Clinical', tKey: 'nav_pharmacy' },
  { to: '/app/lab', label: 'Laboratory', icon: 'flask', perms: ['order_lab', 'verify_lab'], group: 'Clinical', tKey: 'nav_laboratory' },
  { to: '/app/laboratory-info-system', label: 'Lab Information System', icon: 'flask', perms: ['order_lab', 'verify_lab'], group: 'Clinical' , tKey: 'nav_lab_information_system' },
  { to: '/app/admissions', label: 'Admissions', icon: 'bed', perms: ['view_clinical_record', 'view_patient'], group: 'Clinical' , tKey: 'nav_admissions' },
  { to: '/app/immunizations', label: 'Immunizations', icon: 'syringe', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_immunizations' },
  { to: '/app/maternity', label: 'Maternity', icon: 'baby', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_maternity' },
  { to: '/app/clinical-notes', label: 'Clinical Notes', icon: 'clipboard', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_clinical_notes' },
  { to: '/app/medication-administration', label: 'Medication Admin', icon: 'pill', perms: ['view_clinical_record', 'dispense_medication'], group: 'Clinical' , tKey: 'nav_medication_admin' },
  { to: '/app/ward-rounds', label: 'Ward Rounds', icon: 'stethoscope', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_ward_rounds' },
  { to: '/app/patient-timeline', label: 'Patient Timeline', icon: 'clock', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_patient_timeline' },
  { to: '/app/nutrition-diet', label: 'Nutrition & Diet', icon: 'pill', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_nutrition_and_diet' },
  { to: '/app/handover-notes', label: 'Handover Notes', icon: 'clipboard', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_handover_notes' },
  { to: '/app/theatre-management', label: 'Theatre Management', icon: 'scalpel', perms: ['view_clinical_record', 'manage_facility'], group: 'Clinical' , tKey: 'nav_theatre_management' },
  { to: '/app/blood-bank-management', label: 'Blood Bank', icon: 'drop', perms: ['view_clinical_record', 'manage_facility'], group: 'Clinical' , tKey: 'nav_blood_bank' },
  { to: '/app/mental-health', label: 'Mental Health', icon: 'sparkles', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_mental_health' },
  { to: '/app/dental-clinic', label: 'Dental Clinic', icon: 'pill', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_dental_clinic' },
  { to: '/app/physiotherapy', label: 'Physiotherapy', icon: 'activity', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_physiotherapy' },
  { to: '/app/infection-control', label: 'Infection Control', icon: 'shield', perms: ['view_clinical_record', 'manage_facility'], group: 'Clinical' , tKey: 'nav_infection_control' },
  { to: '/app/clinical-protocols', label: 'Clinical Protocols', icon: 'info', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_clinical_protocols' },
  { to: '/app/medical-records', label: 'Medical Records', icon: 'clipboard', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_medical_records' },
  { to: '/app/referral-management', label: 'Referral Management', icon: 'globe', perms: ['view_patient', 'write_patient'], group: 'Clinical' , tKey: 'nav_referral_management' },
  { to: '/app/discharge-summary', label: 'Discharge Summary', icon: 'clipboard', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_discharge_summary' },
  { to: '/app/ward-management', label: 'Ward Management', icon: 'bed', perms: ['view_patient', 'manage_facility'], group: 'Clinical' , tKey: 'nav_ward_management' },
  { to: '/app/patient-complaints', label: 'Patient Complaints', icon: 'alert', perms: ['view_audit', 'manage_facility'], group: 'System' , tKey: 'nav_patient_complaints' },
  { to: '/app/clinical-audit', label: 'Clinical Audit', icon: 'shield', perms: ['view_audit', 'manage_facility'], group: 'System' , tKey: 'nav_clinical_audit' },
  { to: '/app/mm-reports', label: 'M&M Reports', icon: 'alert', perms: ['view_clinical_record', 'view_audit'], group: 'System' , tKey: 'nav_mandm_reports' },
  { to: '/app/consent-forms', label: 'Consent Forms', icon: 'clipboard', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_consent_forms' },
  { to: '/app/vital-records', label: 'Birth & Death Records', icon: 'baby', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_birth_and_death_records' },
  { to: '/app/beds', label: 'Beds', icon: 'bed', perms: ['view_patient', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_beds' },
  { to: '/app/bloodbank', label: 'Blood Bank', icon: 'drop', perms: ['manage_blood_bank', 'view_patient'], group: 'Clinical' , tKey: 'nav_blood_bank' },
  { to: '/app/theatre', label: 'Theatre', icon: 'scalpel', perms: ['manage_theatre', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_theatre' },
  { to: '/app/radiology', label: 'Radiology', icon: 'flask', perms: ['order_imaging', 'verify_imaging'], group: 'Clinical' , tKey: 'nav_radiology' },
  { to: '/app/telemedicine', label: 'Telemedicine', icon: 'globe', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_telemedicine' },
  { to: '/app/referrals', label: 'Referrals', icon: 'arrowRight', perms: ['view_patient', 'view_clinical_record'], group: 'Clinical' , tKey: 'nav_referrals' },
  { to: '/app/stock', label: 'Stock & Inventory', icon: 'truck', perms: ['manage_stock', 'view_financial'], group: 'Operations' , tKey: 'nav_stock_and_inventory' },
  { to: '/app/insurance', label: 'Insurance', icon: 'card', perms: ['view_financial', 'process_payment'], group: 'Operations' , tKey: 'nav_insurance' },
  { to: '/app/billing', label: 'Billing', icon: 'card', perms: ['process_payment', 'view_financial'], group: 'Operations' , tKey: 'nav_billing' },
  { to: '/app/assets', label: 'Fixed Assets', icon: 'building', perms: ['view_financial', 'manage_facility'], group: 'Operations' , tKey: 'nav_fixed_assets' },
  { to: '/app/ambulances', label: 'Ambulances', icon: 'ambulance', perms: ['manage_ambulance', 'view_patient'], group: 'Operations' , tKey: 'nav_ambulances' },
  { to: '/app/surveillance', label: 'Surveillance', icon: 'activity', perms: ['view_surveillance'], group: 'Analytics' , tKey: 'nav_surveillance' },
  { to: '/app/directorate', label: 'Directorate', icon: 'chart', perms: ['view_reports', 'view_dashboard'], group: 'Analytics' , tKey: 'nav_directorate' },
  { to: '/app/reports', label: 'Reports', icon: 'chart', perms: ['view_reports'], group: 'Analytics' , tKey: 'nav_reports' },
  { to: '/app/gis', label: 'Facility Map', icon: 'pin', perms: ['view_reports', 'view_dashboard'], group: 'Analytics' , tKey: 'nav_facility_map' },
  { to: '/app/dr-august', label: 'Dr. August AI', icon: 'sparkles', perms: ['view_reports', 'view_patient'], group: 'Tools' , tKey: 'nav_dr._august_ai' },
  { to: '/app/ai', label: 'AI Services', icon: 'sparkles', perms: ['view_reports', 'view_patient'], group: 'Tools' , tKey: 'nav_ai_services' },
  { to: '/app/guidelines', label: 'Clinical Guidelines', icon: 'clipboard', perms: ['view_patient', 'view_clinical_record'], group: 'Tools' , tKey: 'nav_clinical_guidelines' },
  { to: '/app/drugs', label: 'Drug Database', icon: 'pill', perms: ['view_patient', 'dispense'], group: 'Tools' , tKey: 'nav_drug_database' },
  { to: '/app/diseases', label: 'Disease Reference', icon: 'activity', perms: ['view_patient', 'view_clinical_record'], group: 'Tools' , tKey: 'nav_disease_reference' },
  { to: '/app/integrations', label: 'Integrations', icon: 'globe', perms: ['manage_integrations'], group: 'System' , tKey: 'nav_integrations' },
  { to: '/app/admin', label: 'Admin & Sync', icon: 'shield', perms: ['view_audit', 'manage_devices', 'sync_data'], group: 'System' , tKey: 'nav_admin_and_sync' },
  { to: '/app/developer', label: 'Developer', icon: 'code', perms: ['developer_mode'], group: 'System' , tKey: 'nav_developer' },
  { to: '/app/developer-console', label: 'Dev Console', icon: 'code', perms: ['developer_mode'], group: 'System' , tKey: 'nav_dev_console' },
  { to: '/app/admin-hierarchy', label: 'Admin Hierarchy', icon: 'shield', perms: ['view_audit', 'manage_facility'], group: 'System' , tKey: 'nav_admin_hierarchy' },
  { to: '/app/performance', label: 'Performance', icon: 'zap', perms: ['view_reports', 'view_patient'], group: 'System' , tKey: 'nav_performance' },
  { to: '/app/cache', label: 'Cache', icon: 'database', perms: ['view_reports', 'view_patient'], group: 'System' , tKey: 'nav_cache' },
  { to: '/app/api-config', label: 'API Config', icon: 'globe', perms: ['manage_facility', 'view_audit'], group: 'System' , tKey: 'nav_api_config' },
  { to: '/app/system-settings', label: 'System Settings', icon: 'settings', perms: ['manage_facility'], group: 'System' , tKey: 'nav_system_settings' },
  { to: '/app/system-guide', label: 'System Guide', icon: 'info', perms: ['view_patient'], group: 'System' , tKey: 'nav_system_guide' },
  { to: '/app/api-guide', label: 'API Guide', icon: 'clipboard', perms: ['manage_facility', 'view_audit'], group: 'System' , tKey: 'nav_api_guide' },
  { to: '/app/notifications', label: 'Notifications', icon: 'bell', perms: ['view_dashboard'], group: 'System' , tKey: 'nav_notifications' },
  { to: '/app/staff', label: 'Staff Management', icon: 'users', perms: ['manage_facility'], group: 'System' , tKey: 'nav_staff_management' },
  { to: '/app/import-export', label: 'Import / Export', icon: 'download', perms: ['manage_facility'], group: 'System' , tKey: 'nav_import_-_export' },
  { to: '/app/backup', label: 'Backup & Restore', icon: 'shield', perms: ['manage_facility'], group: 'System' , tKey: 'nav_backup_and_restore' },
  { to: '/app/quality-assurance', label: 'Quality Assurance', icon: 'alert', perms: ['view_audit', 'manage_facility'], group: 'System' , tKey: 'nav_quality_assurance' },
  { to: '/app/staff-training', label: 'Staff Training & Leave', icon: 'users', perms: ['manage_staff'], group: 'System' , tKey: 'nav_staff_training_and_leave' },
  { to: '/app/budget-management', label: 'Budget & Finance', icon: 'card', perms: ['view_financial', 'manage_facility'], group: 'Operations' , tKey: 'nav_budget_and_finance' },
  { to: '/app/patient-education', label: 'Patient Education', icon: 'info', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_patient_education' },
  { to: '/app/service-charter', label: 'Service Charter', icon: 'shield', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_service_charter' },
  { to: '/app/news-announcements', label: 'News & Announcements', icon: 'bell', perms: ['view_patient'], group: 'System' , tKey: 'nav_news_and_announcements' },
  { to: '/app/clinical-dashboard', label: 'Clinical Dashboard', icon: 'activity', perms: ['view_dashboard'], group: 'Analytics' , tKey: 'nav_clinical_dashboard' },
  { to: '/app/drug-interactions', label: 'Drug Interactions', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Tools' , tKey: 'nav_drug_interactions' },
  { to: '/app/emergency-alerts', label: 'Emergency Alerts', icon: 'alert', perms: ['view_dashboard'], group: 'Clinical' , tKey: 'nav_emergency_alerts' },
  { to: '/app/environment-monitor', label: 'Environment Monitor', icon: 'activity', perms: ['manage_facility'], group: 'Operations' , tKey: 'nav_environment_monitor' },
  { to: '/app/patient-satisfaction', label: 'Patient Feedback', icon: 'star', perms: ['view_reports'], group: 'Analytics' , tKey: 'nav_patient_feedback' },
  { to: '/app/documents', label: 'Documents', icon: 'folder', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_documents' },
  { to: '/app/revenue', label: 'Revenue Dashboard', icon: 'card', perms: ['view_financial'], group: 'Operations' , tKey: 'nav_revenue_dashboard' },
  { to: '/app/supplier-procurement', label: 'Supplier & Procurement', icon: 'truck', perms: ['view_stock', 'write_stock'], group: 'Operations' , tKey: 'nav_supplier_and_procurement' },
  { to: '/app/insurance-claims', label: 'Insurance Claims', icon: 'card', perms: ['view_billing', 'write_billing'], group: 'Operations' , tKey: 'nav_insurance_claims' },
  { to: '/app/waste-management', label: 'Waste Management', icon: 'trash', perms: ['view_facility', 'manage_facility'], group: 'Operations' , tKey: 'nav_waste_management' },
  { to: '/app/equipment-maintenance', label: 'Equipment Maintenance', icon: 'monitor', perms: ['view_facility', 'manage_facility'], group: 'Operations' , tKey: 'nav_equipment_maintenance' },
  { to: '/app/bed-management', label: 'Bed Management', icon: 'bed', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_bed_management' },
  { to: '/app/id-cards', label: 'ID Cards', icon: 'card', perms: ['view_patient', 'manage_facility'], group: 'System' , tKey: 'nav_id_cards' },
  { to: '/app/enhanced-patient-portal', label: 'Patient Portal (Enhanced)', icon: 'users', perms: ['view_patient'], group: 'Portal' , tKey: 'nav_patient_portal_(enhanced)' },
  { to: '/app/telemedicine-consult', label: 'Telemedicine Consult', icon: 'globe', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_telemedicine_consult' },
  { to: '/app/radiology-pacs', label: 'Radiology PACS', icon: 'flask', perms: ['order_imaging', 'verify_imaging'], group: 'Clinical' , tKey: 'nav_radiology_pacs' },
  { to: '/app/laboratory-info', label: 'Laboratory Info System', icon: 'flask', perms: ['order_lab', 'verify_lab'], group: 'Clinical' , tKey: 'nav_laboratory_info_system' },
  { to: '/app/pharmacy-dispensing', label: 'Pharmacy Dispensing', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Clinical' , tKey: 'nav_pharmacy_dispensing' },
  { to: '/app/patient-risk-assessment', label: 'Risk Assessment', icon: 'alert', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_risk_assessment' },
  { to: '/app/surgical-safety-checklist', label: 'Surgical Safety', icon: 'shield', perms: ['manage_theatre', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_surgical_safety' },
  { to: '/app/specimen-tracking', label: 'Specimen Tracking', icon: 'flask', perms: ['order_lab', 'verify_lab'], group: 'Clinical' , tKey: 'nav_specimen_tracking' },
  { to: '/app/facility-management', label: 'Facility Management', icon: 'building', perms: ['manage_facility'], group: 'Operations' , tKey: 'nav_facility_management' },
  { to: '/app/patient-flow', label: 'Patient Flow', icon: 'activity', perms: ['view_patient'], group: 'Analytics' , tKey: 'nav_patient_flow' },
  { to: '/app/emergency-department', label: 'Emergency Department', icon: 'alert', perms: ['view_patient', 'manage_facility'], group: 'Clinical' , tKey: 'nav_emergency_department' },
  { to: '/app/blood-transfusion', label: 'Blood Transfusion Service', icon: 'drop', perms: ['manage_blood_bank', 'view_patient'], group: 'Clinical' , tKey: 'nav_blood_transfusion_service' },
  { to: '/app/clinical-pathways', label: 'Clinical Pathways', icon: 'clipboard', perms: ['view_clinical_record', 'manage_facility'], group: 'Clinical' , tKey: 'nav_clinical_pathways' },
  { to: '/app/health-info-exchange', label: 'Health Info Exchange', icon: 'globe', perms: ['view_patient', 'manage_facility'], group: 'System' , tKey: 'nav_health_info_exchange' },
  { to: '/app/emergency-preparedness', label: 'Emergency Preparedness', icon: 'shield', perms: ['manage_facility'], group: 'System' , tKey: 'nav_emergency_preparedness' },
  { to: '/app/clinical-research', label: 'Clinical Research', icon: 'clipboard', perms: ['view_clinical_record', 'manage_facility'], group: 'Clinical' , tKey: 'nav_clinical_research' },
  { to: '/app/remote-monitoring', label: 'Remote Monitoring', icon: 'activity', perms: ['view_patient', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_remote_monitoring' },
  { to: '/app/smart-scheduling', label: 'Smart Scheduling', icon: 'calendar', perms: ['manage_facility'], group: 'Operations' , tKey: 'nav_smart_scheduling' },
  { to: '/app/revenue-cycle', label: 'Revenue Cycle', icon: 'card', perms: ['view_financial', 'process_payment'], group: 'Operations' , tKey: 'nav_revenue_cycle' },
  { to: '/app/health-analytics', label: 'Health Analytics', icon: 'chart', perms: ['view_reports', 'view_dashboard'], group: 'Analytics' , tKey: 'nav_health_analytics' },
  { to: '/app/icu-management', label: 'ICU Management', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_icu_management' },
  { to: '/app/pharmacy-formulary', label: 'Pharmacy Formulary', icon: 'pill', perms: ['view_pharmacy', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_pharmacy_formulary' },
  { to: '/app/staff-credentialing', label: 'Staff Credentialing', icon: 'users', perms: ['manage_staff', 'view_staff'], group: 'Operations' , tKey: 'nav_staff_credentialing' },
  { to: '/app/code-blue-emergency', label: 'Code Blue Emergency', icon: 'alert', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_code_blue_emergency' },
  { to: '/app/executive-dashboard', label: 'Executive Dashboard', icon: 'chart', perms: ['view_reports', 'view_dashboard', 'manage_system'], group: 'Analytics' , tKey: 'nav_executive_dashboard' },
  { to: '/app/financial-dashboard', label: 'Financial Dashboard', icon: 'chart', perms: ['view_reports', 'view_billing', 'manage_system'], group: 'Analytics' , tKey: 'nav_financial_dashboard' },
  { to: '/app/hospital-accreditation', label: 'Hospital Accreditation', icon: 'shield', perms: ['manage_system', 'view_reports'], group: 'Quality' , tKey: 'nav_hospital_accreditation' },
  { to: '/app/audit-trail', label: 'Audit Trail', icon: 'document', perms: ['manage_system', 'view_reports'], group: 'System' , tKey: 'nav_audit_trail' },
  { to: '/app/pre-anaesthesia', label: 'Pre-Anaesthesia Assessment', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_pre-anaesthesia_assessment' },
  { to: '/app/ophthalmology', label: 'Ophthalmology Clinic', icon: 'eye', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_ophthalmology_clinic' },
  { to: '/app/ent-clinic', label: 'ENT Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_ent_clinic' },
  { to: '/app/dermatology', label: 'Dermatology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_dermatology_clinic' },
  { to: '/app/orthopaedics', label: 'Orthopaedics Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_orthopaedics_clinic' },
  { to: '/app/paediatric-growth', label: 'Paediatric Growth Charts', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_paediatric_growth_charts' },
  { to: '/app/staff-directory', label: 'Staff Directory', icon: 'users', perms: ['view_staff'], group: 'Operations' , tKey: 'nav_staff_directory' },
  { to: '/app/cardiology', label: 'Cardiology Clinic', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_cardiology_clinic' },
  { to: '/app/nephrology-dialysis', label: 'Nephrology & Dialysis', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_nephrology_and_dialysis' },
  { to: '/app/endocrinology', label: 'Endocrinology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_endocrinology_clinic' },
  { to: '/app/pulmonology', label: 'Pulmonology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_pulmonology_clinic' },
  { to: '/app/gastroenterology', label: 'Gastroenterology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_gastroenterology_clinic' },
  { to: '/app/oncology', label: 'Oncology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_oncology_clinic' },
  { to: '/app/neurology', label: 'Neurology Clinic', icon: 'brain', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_neurology_clinic' },
  { to: '/app/urology', label: 'Urology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_urology_clinic' },
  { to: '/app/infectious-disease', label: 'Infectious Disease Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_infectious_disease_clinic' },
  { to: '/app/rheumatology', label: 'Rheumatology Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_rheumatology_clinic' },
  { to: '/app/pain-management', label: 'Pain Management', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_pain_management' },
  { to: '/app/palliative-care', label: 'Palliative Care', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_palliative_care' },
  { to: '/app/transplant', label: 'Transplant Coordination', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_transplant_coordination' },
  { to: '/app/geriatric-medicine', label: 'Geriatric Medicine', icon: 'users', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_geriatric_medicine' },
  { to: '/app/speech-therapy', label: 'Speech Therapy', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_speech_therapy' },
  { to: '/app/occupational-therapy', label: 'Occupational Therapy', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_occupational_therapy' },
  { to: '/app/wound-care', label: 'Wound Care Clinic', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_wound_care_clinic' },
  { to: '/app/day-surgery', label: 'Day Surgery Unit', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_day_surgery_unit' },
  { to: '/app/medical-genetics', label: 'Medical Genetics', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_medical_genetics' },
  { to: '/app/radiology-reporting', label: 'Radiology Reporting', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_radiology_reporting' },
  { to: '/app/microbiology', label: 'Microbiology Lab', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_microbiology_lab' },
  { to: '/app/fertility-centre', label: 'Fertility Centre', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_fertility_centre' },
  { to: '/app/hyperbaric-medicine', label: 'Hyperbaric Medicine', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_hyperbaric_medicine' },
  { to: '/app/sports-medicine', label: 'Sports Medicine', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_sports_medicine' },
  { to: '/app/pathology', label: 'Pathology Lab', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_pathology_lab' },
  { to: '/app/nicu', label: 'Neonatal Unit (NICU)', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_neonatal_unit_(nicu)' },
  { to: '/app/cardiac-rehab', label: 'Cardiac Rehabilitation', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_cardiac_rehabilitation' },
  { to: '/app/respiratory-rehab', label: 'Respiratory Rehabilitation', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_respiratory_rehabilitation' },
  { to: '/app/neurorehabilitation', label: 'Neurorehabilitation', icon: 'brain', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_neurorehabilitation' },
  { to: '/app/medical-social-work', label: 'Medical Social Work', icon: 'users', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_medical_social_work' },
  { to: '/app/lactation', label: 'Lactation Consultant', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_lactation_consultant' },
  { to: '/app/clinical-dietetics', label: 'Clinical Dietetics', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_clinical_dietetics' },
  { to: '/app/orthotics-prosthetics', label: 'Orthotics & Prosthetics', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_orthotics_and_prosthetics' },
  { to: '/app/lab-quality-control', label: 'Lab Quality Control', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_lab_quality_control' },
  { to: '/app/risk-management', label: 'Risk Management', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_risk_management' },
  { to: '/app/clinical-governance', label: 'Clinical Governance', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_clinical_governance' },
  { to: '/app/medical-education', label: 'Medical Education', icon: 'book', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_medical_education' },
  { to: '/app/patient-experience', label: 'Patient Experience', icon: 'star', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_patient_experience' },
  { to: '/app/staff-wellness', label: 'Staff Wellness', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_staff_wellness' },
  { to: '/app/triage-assessment', label: 'Triage Assessment', icon: 'alert', perms: ['view_patients', 'manage_patients'], group: 'Emergency' , tKey: 'nav_triage_assessment' },
  { to: '/app/health-insurance-management', label: 'Health Insurance & NHIS', icon: 'shield', perms: ['view_patients', 'manage_billing'], group: 'Finance' , tKey: 'nav_health_insurance_and_nhis' },
  { to: '/app/community-health', label: 'Community Health & Home Care', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_community_health_and_home_care' },
  { to: '/app/clinical-pharmacy', label: 'Clinical Pharmacy', icon: 'pill', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_clinical_pharmacy' },
  { to: '/app/health-screening', label: 'Health Screening Programme', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_health_screening_programme' },
  { to: '/app/nutrition-kitchen', label: 'Nutrition Kitchen', icon: 'book', perms: ['view_patients', 'manage_nutrition'], group: 'Operations' , tKey: 'nav_nutrition_kitchen' },
  { to: '/app/medical-tourism', label: 'Medical Tourism', icon: 'globe', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_medical_tourism' },
  { to: '/app/organ-donation', label: 'Organ Donation Registry', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_organ_donation_registry' },
  { to: '/app/mortuary', label: 'Mortuary Management', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_mortuary_management' },
  { to: '/app/laundry-housekeeping', label: 'Laundry & Housekeeping', icon: 'clipboard', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_laundry_and_housekeeping' },
  { to: '/app/portering-transport', label: 'Portering & Transport', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_portering_and_transport' },
  { to: '/app/medical-library', label: 'Medical Library', icon: 'book', perms: ['view_patients'], group: 'System' , tKey: 'nav_medical_library' },
  { to: '/app/conference-booking', label: 'Conference Booking', icon: 'clipboard', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_conference_booking' },
  { to: '/app/volunteer-management', label: 'Volunteer Management', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_volunteer_management' },
  { to: '/app/donor-relations', label: 'Donor Relations', icon: 'heart', perms: ['view_patients', 'manage_billing'], group: 'Finance' , tKey: 'nav_donor_relations' },
  { to: '/app/public-relations', label: 'Public Relations', icon: 'globe', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_public_relations' },
  { to: '/app/legal-compliance', label: 'Legal & Compliance', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_legal_and_compliance' },
  { to: '/app/medical-ethics', label: 'Medical Ethics Committee', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_medical_ethics_committee' },
  { to: '/app/death-birth-records', label: 'Death & Birth Records', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_death_and_birth_records' },
  { to: '/app/cafeteria', label: 'Cafeteria Management', icon: 'book', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_cafeteria_management' },
  { to: '/app/security-management', label: 'Security Management', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_security_management' },
  { to: '/app/transport-management', label: 'Transport Management', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_transport_management' },
  { to: '/app/nursing-care-plans', label: 'Nursing Care Plans', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_nursing_care_plans' },
  { to: '/app/infection-control', label: 'Infection Control', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_infection_control' },
  { to: '/app/chemotherapy-day-unit', label: 'Chemotherapy Day Unit', icon: 'pill', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_chemotherapy_day_unit' },
  { to: '/app/staff-leave', label: 'Staff Leave Management', icon: 'clipboard', perms: ['manage_staff'], group: 'Operations' , tKey: 'nav_staff_leave_management' },
  { to: '/app/capital-projects', label: 'Capital Projects', icon: 'home', perms: ['view_patients', 'manage_billing'], group: 'Finance' , tKey: 'nav_capital_projects' },
  { to: '/app/predictive-analytics', label: 'Predictive Analytics & AI', icon: 'ai', perms: ['view_patients', 'manage_patients'], group: 'Analytics' , tKey: 'nav_predictive_analytics_and_ai' },
  { to: '/app/clinical-decision-support', label: 'Clinical Decision Support', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_clinical_decision_support' },
  { to: '/app/patient-education', label: 'Patient Education', icon: 'book', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_patient_education' },
  { to: '/app/telehealth-platform', label: 'Telehealth Platform', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_telehealth_platform' },
  { to: '/app/data-analytics', label: 'Data Analytics Dashboard', icon: 'ai', perms: ['view_patients'], group: 'Analytics' , tKey: 'nav_data_analytics_dashboard' },
  { to: '/app/procurement-tendering', label: 'Procurement Tendering', icon: 'shield', perms: ['view_patients', 'manage_billing'], group: 'Finance' , tKey: 'nav_procurement_tendering' },
  { to: '/app/staff-performance', label: 'Staff Performance', icon: 'star', perms: ['manage_staff'], group: 'Operations' , tKey: 'nav_staff_performance' },
  { to: '/app/emergency-preparedness-tracker', label: 'Emergency Preparedness Tracker', icon: 'alert', perms: ['view_patients', 'manage_patients'], group: 'Emergency' , tKey: 'nav_emergency_preparedness_tracker' },
  { to: '/app/nursing-shifts', label: 'Nursing Shift Management', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_nursing_shift_management' },
  { to: '/app/doctor-on-call', label: 'Doctor On-Call Roster', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_doctor_on-call_roster' },
  { to: '/app/fall-prevention', label: 'Fall Prevention Programme', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_fall_prevention_programme' },
  { to: '/app/medication-reconciliation', label: 'Medication Reconciliation', icon: 'pill', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_medication_reconciliation' },
  { to: '/app/patient-feedback', label: 'Patient Feedback Surveys', icon: 'star', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_patient_feedback_surveys' },
  { to: '/app/incident-reporting', label: 'Incident Reporting', icon: 'alert', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_incident_reporting' },
  { to: '/app/discharge-planning', label: 'Discharge Planning', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_discharge_planning' },
  { to: '/app/interpreter-services', label: 'Interpreter Services', icon: 'globe', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_interpreter_services' },
  { to: '/app/advance-directives', label: 'Advance Directives', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_advance_directives' },
  { to: '/app/ward-equipment', label: 'Ward Equipment Tracking', icon: 'home', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_ward_equipment_tracking' },
  { to: '/app/nutritional-screening', label: 'Nutritional Screening', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_nutritional_screening' },
  { to: '/app/documentation-audit', label: 'Documentation Audit', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_documentation_audit' },
  { to: '/app/dvt-prophylaxis', label: 'DVT Prophylaxis Tracker', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_dvt_prophylaxis_tracker' },
  { to: '/app/pressure-ulcer-prevention', label: 'Pressure Ulcer Prevention', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_pressure_ulcer_prevention' },
  { to: '/app/root-cause-analysis', label: 'Root Cause Analysis', icon: 'alert', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_root_cause_analysis' },
  { to: '/app/readmission-prevention', label: 'Readmission Prevention', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_readmission_prevention' },
  { to: '/app/spiritual-care', label: 'Spiritual Care & Chaplaincy', icon: 'heart', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_spiritual_care_and_chaplaincy' },
  { to: '/app/patient-rights', label: 'Patient Rights & Advocacy', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_patient_rights_and_advocacy' },
  { to: '/app/consent-tracking', label: 'Consent Tracking', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_consent_tracking' },
  { to: '/app/theatre-scheduling', label: 'Theatre Scheduling Optimisation', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_theatre_scheduling_optimisation' },
  { to: '/app/blood-bank-inventory', label: 'Blood Bank Inventory', icon: 'heart', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_blood_bank_inventory' },
  { to: '/app/ward-handover', label: 'Ward Handover Protocol', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_ward_handover_protocol' },
  { to: '/app/safety-culture', label: 'Patient Safety Culture', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_patient_safety_culture' },
  { to: '/app/palliative-care-consult', label: 'Palliative Care Consult', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_palliative_care_consult' },
  { to: '/app/ethics-consultation', label: 'Ethics Consultation', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_ethics_consultation' },
  { to: '/app/social-work', label: 'Social Work Services', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_social_work_services' },
  { to: '/app/antimicrobial-stewardship', label: 'Antimicrobial Stewardship', icon: 'pill', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_antimicrobial_stewardship' },
  { to: '/app/pathway-compliance', label: 'Pathway Compliance', icon: 'clipboard', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_pathway_compliance' },
  { to: '/app/ward-census', label: 'Ward Census Dashboard', icon: 'home', perms: ['view_patients'], group: 'Analytics' , tKey: 'nav_ward_census_dashboard' },
  { to: '/app/oxygen-therapy', label: 'Oxygen Therapy Tracker', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_oxygen_therapy_tracker' },
  { to: '/app/transfusion-safety', label: 'Transfusion Safety', icon: 'heart', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_transfusion_safety' },
  { to: '/app/contact-tracing', label: 'Contact Tracing', icon: 'shield', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_contact_tracing' },
  { to: '/app/blood-product-issuance', label: 'Blood Product Issuance', icon: 'heart', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_blood_product_issuance' },
  { to: '/app/national-health-data', label: 'National Health Data (DHIMS2)', icon: 'globe', perms: ['view_patients', 'manage_patients'], group: 'Analytics' , tKey: 'nav_national_health_data_(dhims2)' },
  { to: '/app/health-facility-profile', label: 'Health Facility Profile', icon: 'home', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_health_facility_profile' },
  { to: '/app/telemedicine-consultation', label: 'Telemedicine Consultation', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_telemedicine_consultation' },
  { to: '/app/traditional-medicine', label: 'Traditional Medicine Integration', icon: 'pill', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_traditional_medicine_integration' },
  { to: '/app/nhis-claims', label: 'NHIS Claims Processing', icon: 'shield', perms: ['view_patients', 'manage_billing'], group: 'Finance' , tKey: 'nav_nhis_claims_processing' },
  { to: '/app/cancer-registry', label: 'Cancer Registry', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_cancer_registry' },
  { to: '/app/vaccine-cold-chain', label: 'Vaccine Cold Chain', icon: 'heart', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_vaccine_cold_chain' },
  { to: '/app/community-health-workers', label: 'Community Health Workers', icon: 'home', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_community_health_workers' },
  { to: '/app/maternal-death-surveillance', label: 'Maternal Death Surveillance (MDSR)', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_maternal_death_surveillance_(mdsr)' },
  { to: '/app/neonatal-death-surveillance', label: 'Neonatal Death Surveillance (NDSR)', icon: 'clipboard', perms: ['view_patients', 'manage_patients'], group: 'Quality' , tKey: 'nav_neonatal_death_surveillance_(ndsr)' },
  { to: '/app/drug-resistance-surveillance', label: 'Drug Resistance Surveillance', icon: 'shield', perms: ['view_patients', 'manage_pharmacy'], group: 'Clinical' , tKey: 'nav_drug_resistance_surveillance' },
  { to: '/app/trauma-registry', label: 'Trauma Registry', icon: 'alert', perms: ['view_patients', 'manage_patients'], group: 'Emergency' , tKey: 'nav_trauma_registry' },
  { to: '/app/ward-cleaning-audit', label: 'Ward Cleaning Audit', icon: 'clipboard', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_ward_cleaning_audit' },
  { to: '/app/patient-tracking', label: 'Patient Tracking', icon: 'phone', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_patient_tracking' },
  { to: '/app/patient-phone-tracking', label: 'Phone Tracking', icon: 'phone', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_phone_tracking' },
  { to: '/app/pharmacy-compounding', label: 'Pharmacy Compounding', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Pharmacy' , tKey: 'nav_pharmacy_compounding' },
  { to: '/app/ward-transfer', label: 'Ward Transfer', icon: 'bed', perms: ['view_clinical_record', 'manage_patients'], group: 'Clinical' , tKey: 'nav_ward_transfer' },
  { to: '/app/theatre-utilisation', label: 'Theatre Utilisation', icon: 'clipboard', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_theatre_utilisation' },
  { to: '/app/nicu-tracking', label: 'NICU Tracking', icon: 'baby', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_nicu_tracking' },
  { to: '/app/drug-recall', label: 'Drug Recall', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Pharmacy' , tKey: 'nav_drug_recall' },
  { to: '/app/prescription-printing', label: 'Prescription Print', icon: 'clipboard', perms: ['dispense', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_prescription_print' },
  { to: '/app/lab-result-alerts', label: 'Lab Result Alerts', icon: 'alert', perms: ['verify_lab', 'view_clinical_record'], group: 'Laboratory' , tKey: 'nav_lab_result_alerts' },
  { to: '/app/crash-cart-tracking', label: 'Crash Cart Tracking', icon: 'shield', perms: ['view_clinical_record'], group: 'Emergency' , tKey: 'nav_crash_cart_tracking' },
  { to: '/app/visitor-management', label: 'Visitor Management', icon: 'users', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_visitor_management' },
  { to: '/app/antibiotic-stewardship', label: 'Antibiotic Stewardship', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Clinical' , tKey: 'nav_antibiotic_stewardship' },
  { to: '/app/infection-control-dashboard', label: 'Infection Control', icon: 'shield', perms: ['view_patients'], group: 'Infection Control' , tKey: 'nav_infection_control' },
  { to: '/app/bed-occupancy-realtime', label: 'Bed Occupancy', icon: 'bed', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_bed_occupancy' },
  { to: '/app/staff-scheduling', label: 'Staff Scheduling', icon: 'users', perms: ['view_patients'], group: 'HR' , tKey: 'nav_staff_scheduling' },
  { to: '/app/oxygen-therapy-monitor', label: 'Oxygen Therapy', icon: 'activity', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_oxygen_therapy' },
  { to: '/app/patient-satisfaction-survey', label: 'Patient Satisfaction', icon: 'star', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_patient_satisfaction' },
  { to: '/app/quality-indicators', label: 'Quality Indicators', icon: 'activity', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_quality_indicators' },
  { to: '/app/budget-tracking', label: 'Budget Tracking', icon: 'card', perms: ['manage_billing'], group: 'Finance' , tKey: 'nav_budget_tracking' },
  { to: '/app/wristband-printing', label: 'Wristband Printing', icon: 'clipboard', perms: ['create_patient'], group: 'Clinical' , tKey: 'nav_wristband_printing' },
  { to: '/app/discharge-planning-enhanced', label: 'Discharge Planning', icon: 'bed', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_discharge_planning' },
  { to: '/app/insurance-claim-tracker', label: 'Insurance Claims', icon: 'card', perms: ['manage_billing'], group: 'Finance' , tKey: 'nav_insurance_claims' },
  { to: '/app/emergency-protocols', label: 'Emergency Protocols', icon: 'shield', perms: ['view_clinical_record'], group: 'Emergency' , tKey: 'nav_emergency_protocols' },
  { to: '/app/ward-census-enhanced', label: 'Ward Census Enhanced', icon: 'bed', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_ward_census_enhanced' },
  { to: '/app/staff-scheduling-enhanced', label: 'Staff Scheduling Enhanced', icon: 'users', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_staff_scheduling_enhanced' },
  { to: '/app/ward-rounds-enhanced', label: 'Ward Rounds Enhanced', icon: 'stethoscope', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_ward_rounds_enhanced' },
  { to: '/app/discharge-summary-enhanced', label: 'Discharge Summary Enhanced', icon: 'clipboard', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_discharge_summary_enhanced' },
  { to: '/app/queue-enhanced', label: 'OPD Queue Enhanced', icon: 'list', perms: ['view_queue', 'manage_queue'], group: 'Clinical' , tKey: 'nav_opd_queue_enhanced' },
  { to: '/app/ward-transfer-enhanced', label: 'Ward Transfer Enhanced', icon: 'arrow', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_ward_transfer_enhanced' },
  { to: '/app/death-birth-records-enhanced', label: 'Birth & Death Records Enhanced', icon: 'document', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_birth_and_death_records_enhanced' },
  { to: '/app/infection-control-enhanced', label: 'Infection Control Enhanced', icon: 'shield', perms: ['manage_system', 'view_reports'], group: 'Quality' , tKey: 'nav_infection_control_enhanced' },
  { to: '/app/antibiotic-stewardship-enhanced', label: 'Antibiotic Stewardship Enhanced', icon: 'pill', perms: ['view_clinical_record', 'manage_system'], group: 'Clinical' , tKey: 'nav_antibiotic_stewardship_enhanced' },
  { to: '/app/oxygen-therapy-monitor-enhanced', label: 'Oxygen Therapy Monitor', icon: 'stethoscope', perms: ['view_patients', 'manage_patients'], group: 'Clinical' , tKey: 'nav_oxygen_therapy_monitor' },
  { to: '/app/bed-management-enhanced', label: 'Bed Management Enhanced', icon: 'bed', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_bed_management_enhanced' },
  { to: '/app/vital-signs-charting-enhanced', label: 'Vital Signs Charting Enhanced', icon: 'stethoscope', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_vital_signs_charting_enhanced' },
  { to: '/app/consent-forms-enhanced', label: 'Consent Forms Enhanced', icon: 'document', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Clinical' , tKey: 'nav_consent_forms_enhanced' },
  { to: '/app/visitor-management-enhanced', label: 'Visitor Management Enhanced', icon: 'users', perms: ['view_patients', 'manage_patients'], group: 'Operations' , tKey: 'nav_visitor_management_enhanced' },
  { to: '/app/wristband-printing-enhanced', label: 'Wristband Printing Enhanced', icon: 'document', perms: ['view_patients', 'manage_patients'], group: 'System' , tKey: 'nav_wristband_printing_enhanced' },
  { to: '/app/patient-education-enhanced', label: 'Patient Education Enhanced', icon: 'book', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_patient_education_enhanced' },
  { to: '/app/service-charter-enhanced', label: 'Service Charter Enhanced', icon: 'shield', perms: ['manage_system', 'view_reports'], group: 'System' , tKey: 'nav_service_charter_enhanced' },
  { to: '/app/hospital-profile-enhanced', label: 'Hospital Profile Enhanced', icon: 'home', perms: ['manage_system'], group: 'System' , tKey: 'nav_hospital_profile_enhanced' },
  { to: '/app/point-of-care-enhanced', label: 'POC Testing Enhanced', icon: 'flask', perms: ['view_clinical_record', 'write_clinical_note'], group: 'Laboratory' , tKey: 'nav_poc_testing_enhanced' },
  { to: '/app/pharmacy-enhanced', label: 'Pharmacy Enhanced', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Clinical' , tKey: 'nav_pharmacy_enhanced' },
  { to: '/app/lab-enhanced', label: 'Laboratory Enhanced', icon: 'flask', perms: ['order_lab', 'verify_lab'], group: 'Laboratory' , tKey: 'nav_laboratory_enhanced' },
  { to: '/app/billing-enhanced', label: 'Billing Enhanced', icon: 'dollar', perms: ['view_billing', 'manage_billing'], group: 'Finance' , tKey: 'nav_billing_enhanced' },
  { to: '/app/emergency-dept-enhanced', label: 'Emergency Dept Enhanced', icon: 'activity', perms: ['view_patients'], group: 'Emergency' , tKey: 'nav_emergency_dept_enhanced' },
  { to: '/app/theatre-management-enhanced', label: 'Theatre Management Enhanced', icon: 'calendar', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_theatre_management_enhanced' },
  { to: '/app/radiology-enhanced', label: 'Radiology Enhanced', icon: 'activity', perms: ['view_clinical_record'], group: 'Radiology' , tKey: 'nav_radiology_enhanced' },
  { to: '/app/maternity-enhanced', label: 'Maternity Enhanced', icon: 'heart', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_maternity_enhanced' },
  { to: '/app/icu-monitoring-enhanced', label: 'ICU Monitoring Enhanced', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_icu_monitoring_enhanced' },
  { to: '/app/nicu-tracking-enhanced', label: 'NICU Tracking Enhanced', icon: 'heart', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_nicu_tracking_enhanced' },
  { to: '/app/appointment-scheduler-enhanced', label: 'Appointment Scheduler', icon: 'calendar', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_appointment_scheduler' },
  { to: '/app/handover-notes-enhanced', label: 'Handover Notes Enhanced', icon: 'clipboard', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_handover_notes_enhanced' },
  { to: '/app/renal-dialysis-enhanced', label: 'Renal Dialysis Enhanced', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_renal_dialysis_enhanced' },
  { to: '/app/physiotherapy-enhanced', label: 'Physiotherapy Enhanced', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_physiotherapy_enhanced' },
  { to: '/app/covid19-management', label: 'COVID-19 Management', icon: 'alert-circle', perms: ['view_patients'], group: 'Emergency' , tKey: 'nav_covid-19_management' },
  { to: '/app/radiation-safety', label: 'Radiation Safety', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_radiation_safety' },
  { to: '/app/cardiac-cath-lab', label: 'Cardiac Cath Lab', icon: 'heart', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_cardiac_cath_lab' },
  { to: '/app/medical-waste-tracking', label: 'Medical Waste Tracking', icon: 'layers', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_medical_waste_tracking' },
  { to: '/app/formulary-management', label: 'Formulary Management', icon: 'book', perms: ['view_pharmacy'], group: 'Pharmacy' , tKey: 'nav_formulary_management' },
  { to: '/app/equipment-calibration', label: 'Equipment Calibration', icon: 'tool', perms: ['view_settings'], group: 'Quality' , tKey: 'nav_equipment_calibration' },
  { to: '/app/preventive-maintenance', label: 'Preventive Maintenance', icon: 'wrench', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_preventive_maintenance' },
  { to: '/app/blood-donor-registry', label: 'Blood Donor Registry', icon: 'heart', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_blood_donor_registry' },
  { to: '/app/fire-safety', label: 'Fire Safety', icon: 'alert-circle', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_fire_safety' },
  { to: '/app/linen-management', label: 'Linen Management', icon: 'layers', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_linen_management' },
  { to: '/app/dietary-management', label: 'Dietary Management', icon: 'coffee', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_dietary_management' },
  { to: '/app/staff-onboarding', label: 'Staff Onboarding', icon: 'users', perms: ['view_settings'], group: 'System' , tKey: 'nav_staff_onboarding' },
  { to: '/app/patient-consent', label: 'Patient Consent', icon: 'file-text', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_patient_consent' },
  { to: '/app/sterilisation', label: 'CSSD Sterilisation', icon: 'check-circle', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_cssd_sterilisation' },
  { to: '/app/medical-gas', label: 'Medical Gas', icon: 'wind', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_medical_gas' },
  { to: '/app/ward-cleaning', label: 'Ward Cleaning', icon: 'layers', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_ward_cleaning' },
  { to: '/app/shift-handover', label: 'Shift Handover', icon: 'refresh-cw', perms: ['view_patients'], group: 'Nursing' , tKey: 'nav_shift_handover' },
  { to: '/app/fall-prevention', label: 'Fall Prevention', icon: 'alert-triangle', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_fall_prevention' },
  { to: '/app/surgery-booking', label: 'Surgery Booking', icon: 'scissors', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_surgery_booking' },
  { to: '/app/infection-surveillance', label: 'Infection Surveillance', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_infection_surveillance' },
  { to: '/app/patient-identification', label: 'Patient ID', icon: 'user', perms: ['view_patients'], group: 'System' , tKey: 'nav_patient_id' },
  { to: '/app/pharmacy-ordering', label: 'Pharmacy Ordering', icon: 'shopping-cart', perms: ['view_pharmacy'], group: 'Pharmacy' , tKey: 'nav_pharmacy_ordering' },
  { to: '/app/medical-device', label: 'Medical Devices', icon: 'box', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_medical_devices' },
  { to: '/app/energy-management', label: 'Energy Management', icon: 'zap', perms: ['view_settings'], group: 'Operations' , tKey: 'nav_energy_management' },
  { to: '/app/staff-time-book', label: 'Staff Time Book', icon: 'clock', perms: ['view_settings'], group: 'System' , tKey: 'nav_staff_time_book' },
  { to: '/app/therapeutic-drug-monitoring', label: 'Drug Monitoring', icon: 'activity', perms: ['view_pharmacy'], group: 'Pharmacy' , tKey: 'nav_drug_monitoring' },
  { to: '/app/lab-reception', label: 'Lab Reception', icon: 'flask', perms: ['order_lab'], group: 'Laboratory' , tKey: 'nav_lab_reception' },
  { to: '/app/medication-safety', label: 'Medication Safety', icon: 'shield', perms: ['dispense', 'view_patient'], group: 'Pharmacy' , tKey: 'nav_medication_safety' },
  { to: '/app/patient-meal-tracking', label: 'Patient Meals', icon: 'users', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_patient_meals' },
  { to: '/app/theatre-scheduling-enhanced', label: 'Theatre Scheduling', icon: 'calendar', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_theatre_scheduling' },
  { to: '/app/patient-portal-enhanced', label: 'Patient Portal', icon: 'users', perms: ['view_patient'], group: 'Patient' , tKey: 'nav_patient_portal' },
  { to: '/app/medical-records-enhanced', label: 'Medical Records', icon: 'clipboard', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_medical_records' },
  { to: '/app/staff-performance-tracker', label: 'Staff Performance', icon: 'users', perms: ['view_patients'], group: 'HR' , tKey: 'nav_staff_performance' },
  { to: '/app/patient-education-enhanced', label: 'Patient Education', icon: 'users', perms: ['view_patients'], group: 'Patient' , tKey: 'nav_patient_education' },
  { to: '/app/health-screening-programme', label: 'Health Screening', icon: 'shield', perms: ['view_patients'], group: 'Community' , tKey: 'nav_health_screening' },
  { to: '/app/organ-donation-registry', label: 'Organ Donation', icon: 'heart', perms: ['view_clinical_record'], group: 'Clinical' , tKey: 'nav_organ_donation' },
  { to: '/app/telemedicine-enhanced', label: 'Telemedicine Enhanced', icon: 'users', perms: ['view_clinical_record'], group: 'Telehealth' , tKey: 'nav_telemedicine_enhanced' },
  { to: '/app/traditional-medicine', label: 'Traditional Medicine', icon: 'pill', perms: ['view_patient'], group: 'Clinical' , tKey: 'nav_traditional_medicine' },
  { to: '/app/drug-interaction-checker', label: 'Drug Interactions', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Pharmacy' , tKey: 'nav_drug_interactions' },
  { to: '/app/blood-bank-enhanced', label: 'Blood Bank', icon: 'heart', perms: ['dispense', 'view_patient'], group: 'Clinical' , tKey: 'nav_blood_bank' },
  { to: '/app/equipment-maintenance-enhanced', label: 'Equipment Maintenance', icon: 'shield', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_equipment_maintenance' },
  { to: '/app/vte-prevention', label: 'VTE Prevention', icon: 'shield', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_vte_prevention' },
  { to: '/app/falls-prevention', label: 'Falls Prevention', icon: 'shield', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_falls_prevention' },
  { to: '/app/patient-flow-board', label: 'Patient Flow Board', icon: 'bed', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_patient_flow_board' },
  { to: '/app/pressure-ulcer-prevention', label: 'Pressure Ulcer Prevention', icon: 'shield', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_pressure_ulcer_prevention' },
  { to: '/app/medication-reconciliation-v2', label: 'Medication Reconciliation', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Pharmacy' , tKey: 'nav_medication_reconciliation' },
  { to: '/app/vital-signs-charting', label: 'Vital Signs Charting', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_vital_signs_charting' },
  { to: '/app/specimen-tracking', label: 'Specimen Tracking', icon: 'beaker', perms: ['view_patients'], group: 'Laboratory' , tKey: 'nav_specimen_tracking' },
  { to: '/app/clinical-governance', label: 'Clinical Governance', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_clinical_governance' },
  { to: '/app/ambulance-dispatch', label: 'Ambulance Dispatch', icon: 'activity', perms: ['view_patients'], group: 'Operations' , tKey: 'nav_ambulance_dispatch' },
  { to: '/app/medication-administration-chart', label: 'Medication Administration', icon: 'pill', perms: ['dispense', 'view_patient'], group: 'Clinical' , tKey: 'nav_medication_administration' },
  { to: '/app/point-of-care-testing', label: 'Point-of-Care Testing', icon: 'beaker', perms: ['view_patients'], group: 'Laboratory' , tKey: 'nav_point-of-care_testing' },
  { to: '/app/ward-board', label: 'Ward Board', icon: 'bed', perms: ['view_patients'], group: 'Wards' , tKey: 'nav_ward_board' },
  { to: '/app/clinical-pathways', label: 'Clinical Pathways', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_clinical_pathways' },
  { to: '/app/patient-journey', label: 'Patient Journey', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_patient_journey' },
  { to: '/app/obstetric-emergency', label: 'Obstetric Emergency', icon: 'heart', perms: ['view_patients'], group: 'Maternity' , tKey: 'nav_obstetric_emergency' },
  { to: '/app/renal-dialysis', label: 'Renal Dialysis', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_renal_dialysis' },
  { to: '/app/burn-unit', label: 'Burn Unit', icon: 'heart', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_burn_unit' },
  { to: '/app/hospital-profile', label: 'Hospital Profile', icon: 'building', perms: ['view_patients'], group: 'Settings' , tKey: 'nav_hospital_profile' },
  { to: '/app/system-health', label: 'System Health', icon: 'activity', perms: ['view_patients'], group: 'Settings' , tKey: 'nav_system_health' },
  { to: '/app/user-roles', label: 'User Roles', icon: 'users', perms: ['view_patients'], group: 'Settings' , tKey: 'nav_user_roles' },
  { to: '/app/nicu', label: 'NICU', icon: 'heart', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_nicu' },
  { to: '/app/surgical-safety-checklist', label: 'Surgical Safety Checklist', icon: 'shield', perms: ['view_patients'], group: 'Theatre' , tKey: 'nav_surgical_safety_checklist' },
  { to: '/app/hand-hygiene-compliance', label: 'Hand Hygiene Compliance', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_hand_hygiene_compliance' },
  { to: '/app/psychiatric-assessment', label: 'Psychiatric Assessment', icon: 'brain', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_psychiatric_assessment' },
  { to: '/app/nutrition-assessment', label: 'Nutrition Assessment', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_nutrition_assessment' },
  { to: '/app/discharge-letter', label: 'Discharge Letters', icon: 'document', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_discharge_letters' },
  { to: '/app/operating-theatre-log', label: 'Theatre Log', icon: 'list', perms: ['view_patients'], group: 'Theatre' , tKey: 'nav_theatre_log' },
  { to: '/app/ventilator-management', label: 'Ventilator Management', icon: 'activity', perms: ['view_patients'], group: 'ICU' , tKey: 'nav_ventilator_management' },
  { to: '/app/blood-transfusion-safety', label: 'Blood Transfusion Safety', icon: 'heart', perms: ['view_patients'], group: 'Blood Bank' , tKey: 'nav_blood_transfusion_safety' },
  { to: '/app/tuberculosis-tracker', label: 'TB Tracker', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_tb_tracker' },
  { to: '/app/malaria-surveillance', label: 'Malaria Surveillance', icon: 'activity', perms: ['view_patients'], group: 'Clinical' , tKey: 'nav_malaria_surveillance' },
  { to: '/app/ssi-tracker', label: 'SSI Tracker', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_ssi_tracker' },
  { to: '/app/medication-error-tracker', label: 'Medication Error Tracker', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_medication_error_tracker' },
  { to: '/app/patient-fall-tracker', label: 'Patient Fall Tracker', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_patient_fall_tracker' },
  { to: '/app/infection-control-audit', label: 'Infection Control Audit', icon: 'shield', perms: ['view_patients'], group: 'Quality' , tKey: 'nav_infection_control_audit' },
  { to: '/app/emergency-triage-enhanced', label: 'Emergency Triage Enhanced', icon: 'activity', perms: ['view_patients'], group: 'Emergency' , tKey: 'nav_emergency_triage_enhanced' },
  { to: '/app/labour-ward', label: 'Labour Ward', icon: 'heart', perms: ['view_patients'], group: 'Maternity' , tKey: 'nav_labour_ward' },
  { to: "/app/neonatal-screening", label: "Neonatal Screening", icon: "baby", perms: ["view_patients"], group: "Clinical" },
  { to: "/app/immunisation-tracker", label: "Immunisation Tracker", icon: "vaccine", perms: ["view_patients"], group: "Clinical" },
  { to: "/app/mental-health-crisis", label: "Mental Health Crisis", icon: "brain", perms: ["view_patients"], group: "Clinical" },
  { to: "/app/psychiatric-ward", label: "Psychiatric Ward", icon: "hospital", perms: ["view_patients"], group: "Clinical" },
  { to: "/app/consent-management-enhanced", label: "Consent Management", icon: "document", perms: ["view_patients"], group: "Operations" },
  { to: "/app/pharmacy-compounding-enhanced", label: "Pharmacy Compounding", icon: "flask", perms: ["manage_pharmacy"], group: "Pharmacy" },
  { to: "/app/community-health-tracker", label: "Community Health Tracker", icon: "community", perms: ["view_patients"], group: "Operations" },
  { to: "/app/diagnostic-imaging", label: "Diagnostic Imaging", icon: "camera", perms: ["view_clinical_record"], group: "Radiology" },
  { to: "/app/pathology-reporting", label: "Pathology Reporting", icon: "microscope", perms: ["view_lab_result"], group: "Laboratory" },
  { to: "/app/theatre-scheduler", label: "Theatre Scheduler", icon: "calendar", perms: ["manage_theatre"], group: "Theatre" },
  { to: "/app/pre-op-assessment", label: "Pre-Op Assessment", icon: "clipboard", perms: ["view_clinical_record"], group: "Theatre" },
  { to: "/app/post-op-recovery", label: "Post-Op Recovery", icon: "hospital", perms: ["view_clinical_record"], group: "Theatre" },
  { to: "/app/ward-medication-safety", label: "Medication Safety", icon: "pill", perms: ["view_clinical_record"], group: "Quality" },
  { to: "/app/oxygen-therapy-safety", label: "Oxygen Therapy Safety", icon: "lungs", perms: ["view_clinical_record"], group: "Clinical" },
  { to: "/app/insulin-safety", label: "Insulin Safety", icon: "syringe", perms: ["view_clinical_record"], group: "Clinical" },
  { to: "/app/nurse-handover-enhanced", label: "Nurse Handover", icon: "clipboard", perms: ["view_clinical_record"], group: "Nursing" },
  { to: "/app/clinical-research", label: "Clinical Research", icon: "flask", perms: ["view_patients"], group: "Operations" },
  { to: "/app/ward-census-tracker", label: "Ward Census Tracker", icon: "bed", perms: ["view_patients"], group: "Operations" },
  { to: "/app/medical-equipment-tracker", label: "Equipment Tracker", icon: "wrench", perms: ["view_facility"], group: "Facility" },
  { to: "/app/patient-risk-stratification", label: "Patient Risk Stratification", icon: "alert-triangle", perms: ["view_clinical_record"], group: "Quality" },
  { to: "/app/drug-interaction-alerts", label: "Drug Interactions", icon: "alert-circle", perms: ["manage_pharmacy"], group: "Pharmacy" },
  { to: "/app/blood-bank-enhanced", label: "Blood Bank Enhanced", icon: "droplet", perms: ["view_lab_result"], group: "Laboratory" },
];

function canSee(user: { scope: string; permissions: string[] } | null, perms?: string[]): boolean {
  if (!user) return false;
  if (user.scope === 'PATIENT') return false;
  // Developer has access to everything
  if (user.roleCode === 'DEVELOPER' || user.scope === 'DEVELOPER') return true;
  if (!perms || perms.length === 0) return true;
  // Wildcard permission grants access to all
  if (user.permissions.includes('*')) return true;
  return perms.some((p) => user.permissions.includes(p));
}

/** Get the current page title from the URL */
function usePageTitle(): string {
  const { pathname } = useLocation();
  const match = NAV.find((n) => n.to === pathname || (n.to !== '/app' && pathname.startsWith(n.to)));
  return match?.label ?? 'Dashboard';
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const sector = typeof window !== 'undefined' ? localStorage.getItem('gihm_sector') : null;
  const navigate = useNavigate();
  const [facilityName, setFacilityName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pageTitle = usePageTitle();

  useEffect(() => {
    let alive = true;
    if (!user?.facilityId) { setFacilityName(null); return; }
    api<{ name?: string }>(`/facilities/${user.facilityId}`, { public: true })
      .then((r) => { if (alive) setFacilityName(r.name ?? null); })
      .catch(() => { if (alive) setFacilityName(null); });
    return () => { alive = false; };
  }, [user?.facilityId]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    '1': () => navigate('/app'),
    '2': () => navigate('/app/queue'),
    '3': () => navigate('/app/patients'),
    '4': () => navigate('/app/pharmacy'),
    '5': () => navigate('/app/lab'),
    'mod+k': () => setSearchOpen(true),
    'Escape': () => { setSidebarOpen(false); setSearchOpen(false); },
  }), [navigate]);
  useKeyboard(shortcuts);

  // Close sidebar on navigation (mobile)
  const handleNavClick = useCallback(() => setSidebarOpen(false), []);

  const filteredNav = NAV.filter((n) => canSee(user, n.perms));
  const groups = [...new Set(filteredNav.map((n) => n.group ?? 'Other'))];

  return (
    <div className="flex min-h-screen bg-g-paper dark:bg-g-dark-bg">
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-g-navy text-slate-300 transition-all duration-300 ease-out
          ${sidebarCollapsed ? 'w-[68px]' : 'w-60'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <Logo dark />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" onClick={handleNavClick}>
          {groups.map((group) => (
            <div key={group} className="mb-2">
              {!sidebarCollapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group}
                </p>
              )}
              {filteredNav.filter((n) => (n.group ?? 'Other') === group).map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/app'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon name={n.icon} className="h-4.5 w-4.5 shrink-0" />
                  {!sidebarCollapsed && <span>{t(n.tKey ?? n.label)}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="pt-4 border-t border-white/10 mt-4">
            <Link to="/" className="sidebar-link" onClick={handleNavClick}>
              <Icon name="globe" className="h-4.5 w-4.5 shrink-0" />
              {!sidebarCollapsed && <span>Public portal</span>}
            </Link>
          </div>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center border-t border-white/10 py-2 text-slate-500 transition hover:text-white cursor-pointer"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={sidebarCollapsed ? 'arrowRight' : 'chevDown'} className={`h-4 w-4 transition-transform ${sidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>

        {/* Developer credit */}
        {!sidebarCollapsed && (
          <div className="border-t border-white/10 px-4 py-2">
            <p className="text-[9px] text-slate-600 leading-tight">
              Built by <span className="font-bold text-g-gold">ShaComputeC</span>
              <br />Hard Works Never Fail
            </p>
          </div>
        )}

        {/* User info */}
        <div className="border-t border-white/10 p-4">
          <DemoBanner compact />
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-g-red text-xs font-bold text-white shadow-md">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{user?.fullName}</p>
                  <p className="truncate text-[10px] text-slate-400">{user?.roleName}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  title="Log out"
                >
                  <Icon name="logout" className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-slate-200 dark:border-g-dark-border dark:bg-g-dark-surface/80" role="banner">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
              >
                <Icon name="menu" className="h-5 w-5" />
              </button>
              {/* Page title (mobile) */}
              <h1 className="text-lg font-bold text-g-ink dark:text-g-dark-text lg:hidden">{pageTitle}</h1>
              {/* Facility info (desktop) */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-g-dark-muted">
                <Icon name="building" className="h-4 w-4 text-g-red" />
                <span className="font-semibold text-g-ink dark:text-g-dark-text">{facilityName ?? 'Ghana Integrated Health Platform'}</span>
                <span className="hidden text-slate-400 xl:inline">· {user?.scope}</span>
                {sector && (
                  <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide xl:inline ${sector === 'PRIVATE' ? 'bg-g-gold/20 text-yellow-700' : 'bg-g-navy/10 text-g-navy'}`}>
                    {sector === 'PRIVATE' ? '🏥 Private' : '🏛 Government'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <LicenseBadge />
              <ThemeToggle />
              {user?.scope === 'DEVELOPER' && <AlertBell />}
              <SyncBadge />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* ShaComputeC AI - Always visible on every page */}
        <ShaComputeCAI />

        {/* Getting Started Wizard for first-time users */}
        <GettingStartedWizard />
      </div>
    </div>
  );
}
