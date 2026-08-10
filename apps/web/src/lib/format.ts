const TZ = 'Africa/Accra';

export function cedis(n: number | null | undefined): string {
  return `GH₵ ${(n ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function ageFromDob(dob: string | null | undefined): string {
  if (!dob) return '—';
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age < 1 ? `${Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 86400 * 30.44)))} mo` : `${age} yrs`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  CHPS_COMPOUND: 'CHPS Compound',
  HEALTH_CENTRE: 'Health Centre',
  CLINIC: 'Clinic',
  MATERNITY_HOME: 'Maternity Home',
  POLYCLINIC: 'Polyclinic',
  DISTRICT_HOSPITAL: 'District Hospital',
  MUNICIPAL_HOSPITAL: 'Municipal Hospital',
  REGIONAL_HOSPITAL: 'Regional Hospital',
  TEACHING_HOSPITAL: 'Teaching Hospital',
  UNIVERSITY_HOSPITAL: 'University Hospital',
  PSYCHIATRIC_HOSPITAL: 'Psychiatric Hospital',
  SPECIALIST_HOSPITAL: 'Specialist Hospital',
  PRIVATE_HOSPITAL: 'Private Hospital',
  MISSION_HOSPITAL: 'Mission Hospital',
  QUASI_GOVT_HOSPITAL: 'Quasi-government Hospital',
  LABORATORY: 'Laboratory',
  PHARMACY: 'Pharmacy',
  DIAGNOSTIC_CENTRE: 'Diagnostic Centre',
  REHABILITATION_FACILITY: 'Rehabilitation Facility',
  OTHER: 'Other facility',
};

export const VACCINE_LABELS: Record<string, string> = {
  BCG: 'BCG',
  OPV: 'Polio (OPV)',
  PENTA: 'Pentavalent',
  PCV: 'Pneumococcal (PCV)',
  ROTA: 'Rotavirus',
  IPV: 'Inactivated Polio (IPV)',
  MEASLES_RUBELLA: 'Measles-Rubella',
  YF: 'Yellow fever',
  HPV: 'HPV',
  TT: 'Tetanus toxoid',
  COVID19: 'COVID-19',
};

export const SERVICE_LABELS: Record<string, string> = {
  OPD: 'Outpatient',
  EMERGENCY: 'Emergency',
  MATERNITY: 'Maternity',
  PAEDIATRICS: 'Paediatrics',
  SURGERY: 'Surgery',
  ICU: 'ICU',
  PHARMACY: 'Pharmacy',
  LABORATORY: 'Laboratory',
  IMAGING: 'Imaging',
  BLOOD_BANK: 'Blood Bank',
  AMBULANCE: 'Ambulance',
  TELEMEDICINE: 'Telemedicine',
  IMMUNIZATION: 'Immunization',
  CHPS: 'CHPS',
  COMMUNITY_HEALTH: 'Community health',
  PHYSIOTHERAPY: 'Physiotherapy',
  DENTAL: 'Dental',
  CARDIOLOGY: 'Cardiology',
  GENERAL_WARD: 'General ward',
};
