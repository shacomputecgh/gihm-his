// Script to add nav translations to i18n.ts - targeting the translations object
import { readFileSync, writeFileSync } from 'fs';

const i18nPath = 'src/lib/i18n.ts';
let content = readFileSync(i18nPath, 'utf8');

// Find the translations object (line 16: const translations: Record<Language, Record<string, string>> = {)
// Then find each language section inside it

const navTranslations: Record<string, Record<string, string>> = {
  tw: {
    nav_dashboard: 'Aban mu', nav_queue: 'Ntwaho', nav_patients: 'Akomfoɔ',
    nav_register: 'Kyere Din', nav_appointments: 'Nhyehyɛe', nav_pharmacy: 'Adwumayɛbea',
    nav_laboratory: 'Suesue Beaeɛ', nav_admissions: 'Mpawabɛn', nav_maternity: 'Maame Dwuma',
    nav_clinical_notes: 'Nsɛm Krataa', nav_medication_admin: 'Ayaresabea Ayɛ',
    nav_ward_rounds: 'Ɔdan Mu Hwɛ', nav_patient_timeline: 'Ɔkwan so Nsu',
    nav_nutrition_and_diet: 'Aduane', nav_handover_notes: 'Nsɛm Tua',
    nav_theatre_management: 'Operaeson Mu', nav_blood_bank: 'Mogya Bank',
    nav_mental_health: 'Adom Mu Apɔmuden', nav_dental_clinic: 'Anom Beaeɛ',
    nav_physiotherapy: 'Ahodwuma', nav_infection_control: 'Ariara Ntwaho',
    nav_clinical_protocols: 'Nhyehyɛe Krataa', nav_medical_records: 'Ayaresabea Krataa',
    nav_referral_management: 'Soma Tu Mu', nav_discharge_summary: 'Fi mu Nsɛm',
    nav_ward_management: 'Ɔdan Mu Dwuma', nav_consent_forms: 'Agoo Krataa',
    nav_birth_and_death_records: 'Ɔbrɛ ne Ɔkɛ Mu', nav_beds: 'Mpapanim',
    nav_theatre: 'Operaeson', nav_radiology: 'X-ray', nav_telemedicine: 'Meda So Ayɛ',
    nav_referrals: 'Soma Tu', nav_patient_education: 'Akomfoɔ Adesua',
    nav_service_charter: 'Adwuma Nhyehyɛe', nav_emergency_alerts: 'Nkra Hyehyɛ',
    nav_documents: 'Krataa', nav_bed_management: 'Mpapanim Dwuma',
    nav_emergency_department: 'Nkɔhɔ Beaeɛ', nav_pharmacy_dispensing: 'Ayɛ Ayɛ',
    nav_risk_assessment: 'Nsɛm Nhwehwɛmu', nav_surgical_safety: 'Operaeson Ahoɔden',
    nav_specimen_tracking: 'Nsɛm Hwɛ', nav_blood_transfusion_service: 'Mogya Tua',
    nav_clinical_pathways: 'Ɔkwan', nav_clinical_research: 'Nhwehwɛmu',
    nav_icu_management: 'ICU Dwuma', nav_code_blue_emergency: 'Code Blue',
    nav_ophthalmology_clinic: 'Ani Beaeɛ', nav_ent_clinic: 'Ntu ne Anum Beaeɛ',
    nav_dermatology_clinic: 'Panim Beaeɛ', nav_orthopaedics_clinic: 'Bone Beaeɛ',
    nav_paediatric_growth_charts: 'Mma Nkɔso', nav_cardiology_clinic: 'Akoma Beaeɛ',
    nav_nephrology_and_dialysis: 'Ase Ntwaho', nav_endocrinology_clinic: 'Nsɛm Beaeɛ',
    nav_pulmonology_clinic: 'Moa Beaeɛ', nav_gastroenterology_clinic: 'Akom Beaeɛ',
    nav_oncology_clinic: 'Cancer Beaeɛ', nav_neurology_clinic: 'Nkramo Beaeɛ',
    nav_urology_clinic: 'Ase Beaeɛ', nav_infectious_disease_clinic: 'Ariara Beaeɛ',
    nav_pain_management: 'Ahuhia Dwuma', nav_palliative_care: 'Ahowɔ Ayɛ',
    nav_speech_therapy: 'Kasa Ayɛ', nav_occupational_therapy: 'Adwuma Ayɛ',
    nav_wound_care_clinic: 'Nkwari Beaeɛ', nav_day_surgery_unit: 'Da Operaeson',
    nav_pathology_lab: 'Ɔkɛ Suesue', nav_microbiology_lab: 'Kramo Suesue',
    nav_cardiac_rehabilitation: 'Akoma Ahodwuma', nav_medical_social_work: 'Mmoa Adwuma',
    nav_clinical_pharmacy: 'Ayaresabea Ayɛ', nav_nursing_care_plans: 'Nurse Nhyehyɛe',
    nav_clinical_governance: 'Ayaresabea Nhyehyɛe', nav_discharge_planning: 'Fi Mu Nhyehyɛe',
    nav_consent_tracking: 'Agoo Hwɛ', nav_blood_bank_inventory: 'Mogya Bank Nsɛm',
    nav_blood_product_issuance: 'Mogya Nneɛma', nav_cancer_registry: 'Cancer Nsɛm',
    nav_ward_transfer: 'Ɔdan So Tua', nav_theatre_utilisation: 'Operaeson Adwuma',
    nav_nicu_tracking: 'Mma ICU Hwɛ', nav_prescription_print: 'Krataa Twa',
    nav_antibiotic_stewardship: 'Ariara Ayɛ', nav_oxygen_therapy: 'Oxygen Ayɛ',
    nav_wristband_printing: 'Mpaeae Twa', nav_ward_rounds_enhanced: 'Ɔdan Mu Hwɛ Foforo',
    nav_discharge_summary_enhanced: 'Fi Mu Nsɛm Foforo', nav_opd_queue_enhanced: 'OPD Ntwaho Foforo',
    nav_ward_transfer_enhanced: 'Ɔdan So Tua Foforo', nav_birth_and_death_records_enhanced: 'Ɔbrɛ ne Ɔkɛ Mu Foforo',
    nav_oxygen_therapy_monitor: 'Oxygen Hwɛ Foforo', nav_vital_signs_charting_enhanced: 'Nsɛm Krataa Foforo',
    nav_consent_forms_enhanced: 'Agoo Krataa Foforo', nav_patient_education_enhanced: 'Akomfoɔ Adesua Foforo',
    nav_pharmacy_enhanced: 'Adwumayɛbea Foforo', nav_theatre_management_enhanced: 'Operaeson Dwuma Foforo',
    nav_maternity_enhanced: 'Maame Dwuma Foforo', nav_icu_monitoring_enhanced: 'ICU Hwɛ Foforo',
    nav_nicu_tracking_enhanced: 'Mma ICU Hwɛ Foforo', nav_appointment_scheduler: 'Nhyehyɛe Foforo',
    nav_handover_notes_enhanced: 'Nsɛm Tua Foforo', nav_renal_dialysis_enhanced: 'Ase Ntwaho Foforo',
    nav_physiotherapy_enhanced: 'Ahodwuma Foforo', nav_cardiac_cath_lab: 'Akoma Operaeson',
    nav_blood_donor_registry: 'Mogya Mfa Nsɛm', nav_dietary_management: 'Aduane Dwuma',
    nav_patient_consent: 'Akomfoɔ Agoo', nav_surgery_booking: 'Operaeson Nhyehyɛe',
    nav_theatre_scheduling: 'Operaeson Nhyehyɛe', nav_traditional_medicine: 'Ayɛ Foforo',
    nav_vital_signs_charting: 'Nsɛm Krataa', nav_medication_administration: 'Ayaresabea Ayɛ',
    nav_patient_journey: 'Akomfoɔ Ɔkwan', nav_renal_dialysis: 'Ase Ntwaho',
    nav_burn_unit: 'Ahuru Beaeɛ', nav_nicu: 'Mma ICU', nav_psychiatric_assessment: 'Adom Mu Hwɛ',
    nav_discharge_letters: 'Fi Mu Krataa', nav_tb_tracker: 'TB Hwɛ',
    nav_malaria_surveillance: 'Malaria Hwɛ', nav_neonatal_screening: 'Mma Hwɛ',
    nav_immunisation_tracker: 'Ahyɛase Ntwaho Hwɛ', nav_mental_health_crisis: 'Adom Mu Nkɔhɔ',
    nav_psychiatric_ward: 'Adom Mu Ɔdan', nav_oxygen_therapy_safety: 'Oxygen Ahoɔden',
    nav_insulin_safety: 'Insulin Ahoɔden', nav_patient_complaints: 'Akomfoɔ Nkɔhɔ',
    nav_clinical_audit: 'Ayaresabea Nhwɛ', nav_integrations: 'Nneɛma Bɔ Ne Ho',
    nav_admin_and_sync: 'Admin ne Sync', nav_developer: 'Developer',
    nav_dev_console: 'Dev Console', nav_admin_hierarchy: 'Admin Ɔkwan',
    nav_performance: 'Adwuma', nav_api_config: 'API Nhyehyɛe',
    nav_system_settings: 'System Nhyehyɛe', nav_system_guide: 'System Adesua',
    nav_api_guide: 'API Adesua', nav_notifications: 'Nkra',
    nav_staff_management: 'Adwumayɛfoɔ Dwuma', nav_backup_and_restore: 'San Nhyehyɛe',
    nav_quality_assurance: 'Quality Assurance', nav_staff_training_leave: 'Adwumayɛfoɔ Adesua',
    nav_news_announcements: 'Nsɛm Nkra', nav_id_cards: 'ID Cards',
    nav_health_info_exchange: 'Apɔmuden Nsɛm', nav_emergency_preparedness: 'Nkɔhɔ Nhyehyɛe',
    nav_audit_trail: 'Nhwɛ Ɔkwan', nav_medical_library: 'Ayaresabea Adansidie',
    nav_staff_onboarding: 'Adwumayɛfoɔ Bra', nav_patient_id: 'Akomfoɔ ID',
    nav_staff_time_book: 'Adwumayɛfoɔ Bere', nav_stock_inventory: 'Nneɛma Nsɛm',
    nav_billing: 'Sika Tu Mu', nav_fixed_assets: 'Nneɛma A Ɛwɔ Hɔ',
    nav_ambulances: 'Ambulance', nav_budget_finance: 'Sika Nhyehyɛe',
    nav_revenue_dashboard: 'Sika Aban', nav_supplier_procurement: 'Soma Tu',
    nav_insurance_claims: 'Insurance Nsɛm', nav_waste_management: 'Mume Dwuma',
    nav_equipment_maintenance: 'Nneɛma Ho Dwuma', nav_facility_management: 'Ayaresabea Dwuma',
    nav_smart_scheduling: 'Nhyehyɛe Foforo', nav_revenue_cycle: 'Sika Ɔkwan',
    nav_staff_directory: 'Adwumayɛfoɔ List', nav_security_management: 'Ahoɔden Dwuma',
    nav_staff_leave_management: 'Adwumayɛfoɔ Fi Mu', nav_staff_performance: 'Adwumayɛfoɔ Adwuma',
    nav_doctor_on_call_roster: 'Dokota List', nav_interpreter_services: 'Kasa Mmoa',
    nav_ward_cleaning_audit: 'Ɔdan Ahaban Hwɛ', nav_patient_tracking: 'Akomfoɔ Hwɛ',
    nav_phone_tracking: 'Ahomatrofoɔ Hwɛ', nav_visitor_management: 'Ɛhɔ Brɛfoɔ Dwuma',
    nav_bed_occupancy: 'Mpapanim Adwuma', nav_ward_census_enhanced: 'Ɔdan Nsɛm Foforo',
    nav_staff_scheduling_enhanced: 'Adwumayɛfoɔ Nhyehyɛe Foforo',
    nav_bed_management_enhanced: 'Mpapanim Dwuma Foforo',
    nav_medical_waste_tracking: 'Mume Dwuma Foforo', nav_preventive_maintenance: 'Nneɛma Ho Dwuma',
    nav_fire_safety: 'Ogya Ahoɔden', nav_linen_management: 'Ahaban Dwuma',
    nav_cssd_sterilisation: 'CSSD Ahoɔden', nav_medical_gas: 'Gas Ayɛ',
    nav_ward_cleaning: 'Ɔdan Ahaban', nav_medical_devices: 'Nneɛma A Ɛwɔ Hɔ',
    nav_energy_management: 'Energy Dwuma', nav_patient_meals: 'Akomfoɔ Aduane',
    nav_ambulance_dispatch: 'Ambulance Soma Tu', nav_consent_management: 'Agoo Dwuma',
    nav_surveillance: 'Hwɛ Nsɛm', nav_directorate: 'Directorate',
    nav_reports: 'Nsɛm Krataa', nav_facility_map: 'Ayaresabea Map',
    nav_clinical_dashboard: 'Ayaresabea Aban', nav_patient_feedback: 'Akomfoɔ Nkɔhɔ',
    nav_patient_flow: 'Akomfoɔ Ɔkwan', nav_health_analytics: 'Apɔmuden Nsɛm',
    nav_executive_dashboard: 'Aban Nyinaa', nav_financial_dashboard: 'Sika Aban',
    nav_dr_august_ai: 'Dr. August AI', nav_ai_services: 'AI Adwuma',
    nav_clinical_guidelines: 'Ayaresabea Nhyehyɛe', nav_drug_database: 'Ayɛ Nsɛm',
    nav_disease_reference: 'Ariara Nsɛm', nav_drug_interactions: 'Ayɛ Nneɛma Bɔ Ne Ho',
    nav_hospital_accreditation: 'Ayaresabea Certification', nav_risk_management: 'Nsɛm Ntwaho',
    nav_medical_education: 'Ayaresabea Adesua', nav_patient_experience: 'Akomfoɔ Nsɛm',
    nav_staff_wellness: 'Adwumayɛfoɔ Apɔmuden', nav_legal_compliance: 'Mmara Nhwɛ',
    nav_incident_reporting: 'Nkɔhɔ Nsɛm', nav_medication_safety: 'Ayɛ Ahoɔden',
    nav_triage_assessment: 'Nkɔhɔ Hwɛ', nav_emergency_protocols: 'Nkɔhɔ Nhyehyɛe',
    nav_emergency_dept_enhanced: 'Nkɔhɔ Beaeɛ Foforo', nav_covid_19_management: 'COVID-19 Dwuma',
    nav_health_insurance_nhis: 'Health Insurance NHIS', nav_nhis_claims_processing: 'NHIS Nsɛm',
    nav_budget_tracking: 'Sika Hwɛ', nav_billing_enhanced: 'Sika Tu Mu Foforo',
    nav_formulary_management: 'Ayɛ Nsɛm Dwuma', nav_pharmacy_ordering: 'Ayɛ Soma Tu',
    nav_drug_monitoring: 'Ayɛ Hwɛ', nav_lab_result_alerts: 'Suesue Nkra',
    nav_poc_testing_enhanced: 'POC Hwɛ Foforo', nav_laboratory_enhanced: 'Suesue Beaeɛ Foforo',
    nav_blood_transfusion_safety: 'Mogya Tua Ahoɔden',
    nav_radiation_safety: 'Radiation Ahoɔden', nav_equipment_calibration: 'Nneɛma Nhyehyɛe',
    nav_fall_prevention: 'Fa Mu Ntwaho', nav_infection_surveillance: 'Ariara Hwɛ',
    nav_infection_control_enhanced: 'Ariara Ntwaho Foforo',
    nav_hospital_profile_enhanced: 'Ayaresabea Nsɛm Foforo',
    nav_wristband_printing_enhanced: 'Mpaeae Twa Foforo',
    nav_service_charter_enhanced: 'Adwuma Nhyehyɛe Foforo',
    welcome: 'Akwaaba', login: 'Bra Mu', logout: 'Fi Mu', save: 'Kora', cancel: 'Twa Mu',
    delete: 'Yi', edit: 'Sesa', create: 'Yɛ', submit: 'Di Dwuma', search: 'Hwehwɛ',
    help: 'Mmoa', settings: 'Nhyehyɛe', success: 'Adwuma Yie', error: 'Nsɛm Ka',
    warning: 'Nsɛm Diɛnsɛm', yes: 'Ɛɛ', no: 'Dɛn', all: 'Nyinaa', close: 'To Mu',
    open: 'Bue', print: 'Twa', export: 'Yi mu', import: 'Fa mu',
  },
  fa: {
    welcome: 'Akwaaba', login: 'Bra mu', logout: 'Fi mu', save: 'Kora', cancel: 'Twa mu',
    delete: 'Yi', edit: 'Sesa', create: 'Yɛ', submit: 'Di dwuma', search: 'Hwehwɛ',
    help: 'Mmoa', settings: 'Nhyehyɛeɛ', success: 'Adwuma yie', error: 'Nsɛm kaa',
    nav_dashboard: 'Dashboard', nav_patients: 'Ahɔfoɔ', nav_pharmacy: 'Medicine',
    nav_laboratory: 'Suesuebea', nav_queue: 'Ntwaho', nav_appointments: 'Nhyehyɛeɛ',
    nav_admissions: 'Mpawabɛn', nav_maternity: 'Maame Dwuma',
    nav_emergency_department: 'Nkɔhɔ Beaeɛ', nav_billing: 'Sika Tu Mu',
    nav_staff_management: 'Adwumayɛfoɔ Dwuma', nav_system_settings: 'System Nhyehyɛeɛ',
    nav_staff_time_book: 'Adwumayɛfoɔ Bere', nav_id_cards: 'ID Cards',
    nav_surveillance: 'Hwɛ Nsɛm', nav_reports: 'Nsɛm Krataa',
    nav_dr_august_ai: 'Dr. August AI',
  },
  ga: {
    welcome: 'Ojɛkoo', login: 'Bra', logout: 'Fii', save: 'Save', cancel: 'Cancel',
    delete: 'Delete', edit: 'Edit', create: 'Create', submit: 'Submit', search: 'Shishi',
    help: 'Help', settings: 'Setting', success: 'Adwuma yie', error: 'Nsɛm kaa',
    nav_dashboard: 'Dashboard', nav_patients: 'Gbɛjoo', nav_pharmacy: 'Medicine',
    nav_laboratory: 'Suesue', nav_queue: 'Line', nav_appointments: 'Appointment',
    nav_admissions: 'Mpawabɛn', nav_maternity: 'Maame Dwuma',
    nav_emergency_department: 'Emergency Beaeɛ', nav_billing: 'Sika Tu Mu',
    nav_staff_management: 'Adwumayɛfoɔ Dwuma', nav_system_settings: 'System Setting',
    nav_staff_time_book: 'Adwumayɛfoɔ Bere', nav_id_cards: 'ID Cards',
    nav_surveillance: 'Hwɛ Nsɛm', nav_reports: 'Nsɛm Krataa',
    nav_dr_august_ai: 'Dr. August AI',
  },
  ew: {
    welcome: 'WOEZƆ', login: 'Bia', logout: 'Yi', save: 'Kora', cancel: 'Tɔ',
    delete: 'Trɔ', edit: 'Sesa', create: 'Wɔ', submit: 'Na', search: 'Di',
    help: 'Kpekpe', settings: 'Ŋutsusu', success: 'Woawa', error: 'Vodada',
    nav_dashboard: 'Dashboard', nav_patients: 'Amesiwo', nav_pharmacy: 'Dɔwɔƒe',
    nav_laboratory: 'Nusuhalã', nav_queue: 'Nuƒoƒo', nav_appointments: 'Nusiwo',
    nav_admissions: 'Nusiɖoɖo', nav_maternity: 'Nɔnɔmeƒe',
    nav_emergency_department: 'Bɔjɔƒe', nav_billing: 'Xexeme Ƒe',
    nav_staff_management: 'Dukɔ Ƒe', nav_system_settings: 'System Ŋutsusu',
    nav_staff_time_book: 'Dukɔ Gaƒoƒo', nav_id_cards: 'ID Cards',
    nav_surveillance: 'Le Xi', nav_reports: 'Nya',
    nav_dr_august_ai: 'Dr. August AI',
  },
  ha: {
    nav_dashboard: 'Dashboard', nav_patients: 'Marasa', nav_pharmacy: 'Gida',
    nav_laboratory: 'Kimiyar Lafiya', nav_staff_management: 'Ma\'aikata',
    nav_dr_august_ai: 'Dr. August AI',
  },
  dag: {
    nav_dashboard: 'Dashboard', nav_patients: 'Lobigba', nav_pharmacy: 'Chimsi',
    nav_laboratory: 'Chimsi Biri', nav_staff_management: 'Dima Bihi',
    nav_dr_august_ai: 'Dr. August AI',
  },
};

// Find the translations object start
const translationsIdx = content.indexOf('const translations:');
if (translationsIdx === -1) {
  console.error('Could not find translations object');
  process.exit(1);
}

// For each language, find its section inside translations and add missing nav_ keys
for (const [lang, navs] of Object.entries(navTranslations)) {
  // Find "  lang: {" inside the translations object
  const langRegex = new RegExp(`^  ${lang}: \\{`, 'm');
  const searchFrom = translationsIdx;
  const langMatch = content.substring(searchFrom).match(langRegex);
  if (!langMatch) continue;
  
  const langStart = searchFrom + content.substring(searchFrom).indexOf(langMatch[0]);
  
  // Find closing brace
  let braceCount = 0;
  let langEnd = langStart;
  for (let i = langStart; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') { braceCount--; if (braceCount === 0) { langEnd = i + 1; break; } }
  }
  
  // Get existing keys
  const langText = content.substring(langStart, langEnd);
  const existingKeys = new Set([...langText.matchAll(/'([^']+)':/g)].map(m => m[1]));
  
  // Build additions
  let additions = '';
  for (const [key, val] of Object.entries(navs)) {
    if (!existingKeys.has(key)) {
      additions += `    '${key}': '${val}',\n`;
    }
  }
  
  if (additions) {
    // Insert before the closing }
    content = content.substring(0, langEnd - 1) + additions + content.substring(langEnd - 1);
  }
}

writeFileSync(i18nPath, content);
console.log('Done - added nav translations to translations object');
