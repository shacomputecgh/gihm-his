// ---- API types (mirror apps/api) ------------------------------------------

export interface ApiError {
  error: { code: string; message: string; candidates?: MpiCandidate[] };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  scope: string;
  permissions: string[];
  organizationId: string | null;
  facilityId: string | null;
  regionId: string | null;
  districtId: string | null;
  // Scope context names — the UI shows these instead of a bare scope label.
  regionName: string | null;
  districtName: string | null;
  facilityName: string | null;
}

export interface Region {
  id: string;
  code: string;
  name: string;
  capital: string | null;
  _count?: { districts: number; facilities: number };
}

export interface District {
  id: string;
  code: string;
  name: string;
  type: string;
  capital: string | null;
  regionId: string;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: string;
  level: string | null;
  ownership: string;
  regionId: string;
  districtId: string;
  address: string | null;
  telephone: string | null;
  email: string | null;
  website: string | null;
  emergencyContact: string | null;
  operationalStatus: string;
  accreditation: string | null;
  bedCapacity: number | null;
  openingHours: Record<string, string>;
  services: string[];
  departmentsJson: string[];
  departments?: { id: string; name: string }[];
  isSynthetic: boolean;
  region?: { id: string; name: string; capital: string | null };
  district?: { id: string; name: string; type: string; capital: string | null };
  gpsLat?: number | null;
  gpsLng?: number | null;
}

export interface Patient {
  id: string;
  mrn: string;
  fullName: string;
  formerName: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  ghanaCard: string | null;
  nhisNumber: string | null;
  bloodGroup: string | null;
  genotype: string | null;
  allergies: string[];
  // Admission-form identification (docs: hospital admission form) — a foreign
  // national registers with passport/visa instead of Ghana Card/NHIS.
  patientType: string;
  nationality: string | null;
  passport: string | null;
  passportIssueDate: string | null;
  passportExpiryDate: string | null;
  visaPermitType: string | null;
  visaPermitNumber: string | null;
  visaPermitExpiry: string | null;
  countryOfResidence: string | null;
  permanentAddress: string | null;
  internationalInsurer: string | null;
  internationalPolicyNumber: string | null;
  interpreterRequired: boolean;
  interpreterLanguage: string | null;
  preferredContactMethod: string | null;
  regionId: string | null;
  districtId: string | null;
  community: string | null;
  address: string | null;
  facilityId: string | null;
  consentAccepted: boolean;
  reminderOptOut: boolean;
  preferredLanguage: string | null;
  status: string;
  createdAt: string;
  region?: { name: string };
  district?: { name: string };
  facility?: { id: string; name: string };
  encounters?: Encounter[];
  labOrders?: LabOrder[];
  prescriptions?: Prescription[];
  appointments?: Appointment[];
  admissions?: Admission[];
  referrals?: Referral[];
  invoices?: Invoice[];
  immunizations?: Immunization[];
  identifiers?: PatientIdentifier[];
  documents?: PatientDocument[];
  /** Folder size shown in the registry (from the list endpoint's _count). */
  documentsCount?: number;
  /** Stored photograph (admission-form checklist) — served via /patients/:id/photo. */
  photoStoredName: string | null;
}

/** One file in the patient's digital folder (docs/10). */
export interface PatientDocument {
  id: string;
  patientId: string;
  category: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  createdAt: string;
  uploadedBy: { id: string; fullName: string } | null;
}

export interface PatientIdentifier {
  id: string;
  type: string;
  value: string;
  verified: boolean;
}

export interface Encounter {
  id: string;
  patientId: string;
  facilityId: string;
  type: string;
  status: string;
  presentingComplaint: string | null;
  temperature: number | null;
  pulse: number | null;
  respiratoryRate: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  spo2: number | null;
  weightKg: number | null;
  heightCm: number | null;
  painScore: number | null;
  triageCategory: string | null;
  diagnosisSummary: string | null;
  createdAt: string;
  notes?: ClinicalNote[];
  diagnoses?: Diagnosis[];
}

export interface ClinicalNote {
  id: string;
  noteType: string;
  note: string;
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  code: string;
  description: string;
  type: string;
}

export interface LabOrder {
  id: string;
  test: string;
  discipline: string;
  status: string;
  result: string | null;
  referenceRange: string | null;
  critical: boolean;
  createdAt: string;
}

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: number | null;
  route: string | null;
  status: string;
  dispensedQty: number | null;
  createdAt: string;
}

export interface WorklistPatient {
  id: string;
  mrn: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
}

export interface PrescriptionWorklistRow extends Prescription {
  patient: WorklistPatient;
}

export interface LabOrderWorklistRow extends LabOrder {
  patient: WorklistPatient;
}

export interface MpiDuplicatePair {
  a: { patientId: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; status: string };
  b: { patientId: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; status: string };
  score: number;
  matchedOn: string[];
}

export interface FacilityApplication {
  id: string;
  name: string;
  type: string;
  ownership: string;
  address: string | null;
  telephone: string | null;
  email: string | null;
  contactName: string | null;
  services: string[];
  reason: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  region?: { id: string; name: string };
  district?: { id: string; name: string };
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  batch: string | null;
  expiryDate: string | null;
  location: string | null;
  low: boolean;
  out: boolean;
  expirySoon: boolean;
}

export interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  facility?: { name: string };
}

export interface Bed {
  id: string;
  ward: string;
  bedNumber: string;
  status: string;
  patientId: string | null;
  admissionId: string | null;
  notes: string | null;
  unitId: string | null;
  wardId: string | null;
  patient?: { id: string; mrn: string; fullName: string } | null;
  unit?: { id: string; code: string; name: string; department?: { id: string; name: string } | null } | null;
  wardRow?: { id: string; name: string } | null;
}

export interface Referral {
  id: string;
  patientId: string;
  fromFacilityId: string;
  toFacilityId: string | null;
  toFacilityName: string | null;
  fromFacilityName: string | null;
  specialty: string | null;
  urgency: string;
  summary: string | null;
  status: string;
  note: string | null;
  receivedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  ambulance: { id: string; registration: string; driverName: string | null } | null;
  patient?: { id: string; mrn: string; fullName: string };
}

export interface Appointment {
  id: string;
  patientId: string;
  service: string | null;
  reason: string | null;
  scheduledFor: string;
  status: string;
  patient?: { id: string; mrn: string; fullName: string; phone: string | null };
}

export interface QueueEntry {
  id: string;
  departmentId: string;
  ticket: string;
  status: string;
  createdAt: string;
  patient?: { id: string; mrn: string; fullName: string } | null;
}

export interface Admission {
  id: string;
  ward: string | null;
  bed: string | null;
  status: string;
  admittedAt: string;
  dischargedAt: string | null;
  reason: string | null;
}

export interface Referral {
  id: string;
  toFacilityName: string | null;
  specialty: string | null;
  urgency: string;
  status: string;
  createdAt: string;
}

export interface AdmissionRecord {
  id: string;
  admissionNumber: string | null;
  patient: {
    id: string;
    fullName: string;
    mrn: string;
    phone: string | null;
    patientType: string;
    sex: string | null;
    dateOfBirth: string | null;
    ghanaCard: string | null;
    nhisNumber: string | null;
    passport: string | null;
  } | null;
  facility: { id: string; code: string; name: string } | null;
  admissionType: string | null;
  source: string | null;
  referringFacility: string | null;
  referringDoctor: string | null;
  chiefComplaint: string | null;
  provisionalDiagnosis: string | null;
  reason: string | null;
  identificationPending: boolean;
  ward: string | null;
  bed: string | null;
  nurseReceiving: string | null;
  vitals: Record<string, number | null>;
  paymentMethod: string | null;
  billingAccount: string | null;
  insurerName: string | null;
  policyNumber: string | null;
  authorizationNumber: string | null;
  maternity: { pregnant: boolean | null; edd: string | null; gravida: number | null; parity: number | null; lmp: string | null };
  consentSigned: boolean;
  consentSignedAt: string | null;
  status: string;
  admittedAt: string;
  dischargedAt: string | null;
  dischargeSummary: string | null;
  dischargeNote: string | null;
  transferNote: string | null;
  transferredAt: string | null;
  transferHistory: Array<{ fromWard: string | null; fromBed: string | null; toWard: string | null; toBed: string | null; note: string | null; at: string; by: string }>;
  consultant: { id: string; fullName: string } | null;
  attending: { id: string; fullName: string } | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  patientId?: string;
  amount: number;
  paidAmount: number;
  status: string;
  paymentMethod: string | null;
  issuedAt: string;
}

export interface PaymentAttempt {
  id: string;
  invoiceId: string;
  provider: string;
  providerRef: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  checkoutUrl: string | null;
  error: string | null;
  initiatedAt: string;
  confirmedAt: string | null;
}

export interface PaymentProviderInfo {
  id: string;
  name: string;
  kind: 'MOMO' | 'CARD' | 'TEST';
  configured: boolean;
  note: string;
}

export interface InsuranceScheme {
  id: string;
  code: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface PatientInsurance {
  id: string;
  patientId: string;
  scheme: { id: string; code: string; name: string; type: string; status: string } | null;
  membershipNumber: string;
  holderName: string | null;
  relationship: string;
  validFrom: string;
  validTo: string | null;
  status: string;
  verified: boolean;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patient: { id: string; fullName: string; mrn: string } | null;
  scheme: { id: string; code: string; name: string; type: string } | null;
  facility: { id: string; code: string; name: string } | null;
  invoiceId: string | null;
  encounterId: string | null;
  serviceDate: string;
  items: Array<{ description: string; amount: number }>;
  amount: number;
  approvedAmount: number | null;
  status: string;
  submittedBy: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface InsuranceSummary {
  coverage: { totalMemberships: number; activeMemberships: number; verified: number; expiringSoon: number };
  claims: {
    pending: { count: number; amount: number };
    decidedPending: { count: number; amount: number };
    submittedThisMonth: { count: number; amount: number };
    paidThisMonth: { count: number; amount: number };
    byStatus: Record<string, { count: number; amount: number }>;
  };
  byScheme: Array<{ scheme: { id: string; code: string; name: string; type: string }; members: number; activeMembers: number; claims: number; claimValue: number }>;
}

export interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  description: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  acquisitionDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  location: string | null;
  custodianName: string | null;
  status: string;
  disposedAt: string | null;
  disposalNote: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  facility: { id: string; code: string; name: string } | null;
  accumulatedDepreciation: number;
  currentValue: number;
  annualDepreciation: number;
  depreciationPct: number;
}

export interface AssetSummary {
  totals: { assets: number; active: number; inStorage: number; disposed: number; bookValue: number; replacementCost: number; annualDepreciation: number };
  byCategory: Array<{ category: string; count: number; replacementCost: number; bookValue: number }>;
  byStatus: Record<string, number>;
}

export interface Immunization {
  id: string;
  vaccine: string;
  dose: string;
  administeredAt: string;
  nextDueAt: string | null;
  status: string;
  batch: string | null;
  facilityId: string | null;
  createdAt: string;
  patient?: { id: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null };
  facility?: { id: string; name: string };
}

export interface ImmunizationDueRow {
  id: string;
  patient: { id: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; districtName: string | null; reminderOptOut: boolean };
  vaccine: string;
  dose: string;
  description: string;
  lastDoseAt: string;
  nextDueAt: string;
  daysUntil: number;
  daysOverdue: number;
  bucket: 'OVERDUE' | 'DUE_SOON';
}

// ---- Predictive analytics — stock consumption forecast (docs/22 Phase 7)

export interface StockForecastResult {
  stockItem: {
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    minStock: number;
    reorderLevel: number;
    batch: string | null;
    expiryDate: string | null;
  };
  history: Array<{ weekStart: string; issued: number }>;
  projectedMonthlyDemand: number | null;
  lower: number | null;
  upper: number | null;
  weeksOfStockRemaining: number | null;
  runOutAt: string | null;
  status: 'OK' | 'LOW' | 'OUT' | 'INSUFFICIENT_DATA';
  disclaimer: string;
  method: string;
  generatedAt: string;
  basedOn: string[];
  available: boolean;
  note: string | null;
}

// ---- Telemedicine (spec §82–83, docs/13 §9)

export interface Teleconsultation {
  id: string;
  patientId: string;
  clinicianId: string | null;
  facilityId: string | null;
  mode: string;
  status: string;
  scheduledFor: string;
  startedAt: string | null;
  endedAt: string | null;
  joinUrl: string | null;
  notes: string | null;
  outcome: string | null;
  createdAt: string;
  patient?: { id: string; mrn: string; fullName: string; phone: string | null };
  clinician?: { id: string; fullName: string };
}

// ---- Imaging & radiology (spec §24, docs/13 §10)

export interface ImagingOrder {
  id: string;
  patientId: string;
  encounterId: string;
  facilityId: string | null;
  modality: string;
  bodyPart: string | null;
  clinicalQuestion: string | null;
  status: string;
  report: string | null;
  impression: string | null;
  requestedById: string | null;
  reportedById: string | null;
  createdAt: string;
  updatedAt: string;
  encounter?: { id: string; type: string };
  patient?: { id: string; mrn: string; fullName: string; phone: string | null; dateOfBirth: string | null };
}

// ---- Maternity & obstetrics (spec §20, docs/13 §7–8)

export interface AntenatalVisit {
  id: string;
  patientId: string;
  facilityId: string | null;
  visitNumber: number;
  gaWeeks: number;
  edd: string | null;
  weightKg: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  fundalHeight: number | null;
  fetalHeartRate: number | null;
  riskAssessment: string;
  supplements: string | null;
  nextVisitAt: string | null;
  status: string;
  visitedAt: string;
}

export interface DeliveryRecord {
  id: string;
  patientId: string;
  facilityId: string | null;
  deliveryType: string;
  mode: string | null;
  outcome: string | null;
  birthWeightKg: number | null;
  apgar1: number | null;
  apgar5: number | null;
  complications: string | null;
  maternalOutcome: string;
  newbornOutcome: string;
  placentaComplete: boolean;
  attendedByName: string | null;
  deliveredAt: string;
}

export interface PostnatalVisit {
  id: string;
  patientId: string;
  facilityId: string | null;
  visitNumber: number;
  maternalReview: string | null;
  newbornReview: string | null;
  breastfeeding: string | null;
  contraception: string | null;
  immunization: string | null;
  followUpAt: string | null;
  visitedAt: string;
}

export interface Partograph {
  id: string;
  patientId: string;
  facilityId: string | null;
  labourStartedAt: string;
  status: string;
  notes: string | null;
  _count?: { observations: number };
}

export interface PartographObservation {
  id: string;
  partographId: string;
  observedAt: string;
  cervicalDilationCm: number | null;
  fetalHeartRateBpm: number | null;
  contractionsPer10Min: number | null;
  contractionDurationSec: number | null;
  descentFifths: number | null;
  pulseBpm: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  temperatureC: number | null;
  urineOutputMl: number | null;
  notes: string | null;
  hoursSinceStart: number;
  expectedDilationCm: number;
  beyondAlertLine: boolean | null;
  beyondActionLine: boolean | null;
}

export interface ImmunizationScheduleItem {
  vaccine: string;
  dose: string;
  label: string;
  description: string;
  ageDays: number | null;
  intervalDays: number | null;
}

export interface ImmunizationMissedRow {
  id: string;
  patient: { id: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; districtName: string | null; reminderOptOut: boolean };
  vaccine: string;
  dose: string;
  description: string;
  missedSince: string | null;
  lastGivenAt: string;
  daysOverdue: number | null;
}

export interface ReminderResult {
  reminded: boolean;
  channel: string;
  to: string | null;
  dispatched: boolean;
  provider?: string;
  messageId?: string | null;
  note: string;
}

export interface CoverageIndicator {
  key: string;
  vaccine: string;
  dose: string;
  label: string;
  eligible: number;
  vaccinated: number;
  coveragePct: number;
}

export interface ImmunizationCoverage {
  scope: string;
  indicators: CoverageIndicator[];
  dropoutRate: number;
  fullyImmunized: { eligible: number; vaccinated: number; coveragePct: number };
  generatedAt: string;
}

export interface MpiCandidate {
  patientId: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string | null;
  phone: string | null;
  score: number;
  matchedOn: string[];
}

export interface DashboardStats {
  scope: string;
  facilityId: string | null;
  stats: {
    patientsToday: number;
    appointmentsToday: number;
    queueWaiting: number;
    activeAdmissions: number;
    encountersToday: number;
    labPending: number;
    prescriptionsActive: number;
    invoicesToday: number;
    revenueToday: number;
    criticalLabs: number;
    patientCount: number;
  };
  national: { districts: number; facilities: number };
  trend: { date: string; count: number }[];
}

export interface Ambulance {
  id: string;
  registration: string;
  model: string | null;
  type: string;
  status: string;
  driverName: string | null;
  driverPhone: string | null;
  crewNames: string[];
  fuelLevel: number | null;
  odometerKm: number | null;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
  facility?: { id: string; name: string };
  trips?: { id: string; status: string; patient: { fullName: string; mrn: string } | null }[];
}

export interface AmbulanceTrip {
  id: string;
  ambulanceId: string;
  patientId: string | null;
  status: string;
  emergencyType: string | null;
  pickupLocation: string | null;
  notes: string | null;
  dispatchedAt: string;
  arrivedAtScene: string | null;
  departedSceneAt: string | null;
  arrivedAtFacility: string | null;
  completedAt: string | null;
  ambulance?: { id: string; registration: string };
  patient?: { id: string; mrn: string; fullName: string } | null;
  destination?: { id: string; name: string } | null;
}

export interface BloodDonor {
  id: string;
  fullName: string;
  sex: string | null;
  phone: string | null;
  bloodGroup: string;
  genotype: string | null;
  status: string;
  totalDonations: number;
  lastDonationAt: string | null;
}

export interface BloodDonation {
  id: string;
  bloodGroup: string;
  volumeMl: number;
  screeningResult: string | null;
  donatedAt: string;
  donor?: { id: string; fullName: string; bloodGroup: string };
}

export interface BloodUnit {
  id: string;
  unitCode: string;
  bloodGroup: string;
  component: string;
  status: string;
  expiryDate: string;
  collectedAt: string;
  issuedAt: string | null;
  issuedPatient?: { id: string; fullName: string; mrn: string } | null;
}

export interface TransfusionRecord {
  id: string;
  crossmatchResult: string | null;
  status: string;
  reaction: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  patient?: { id: string; mrn: string; fullName: string };
  unit?: { unitCode: string; bloodGroup: string; component: string };
}

export interface SurgicalBooking {
  id: string;
  patientId: string;
  procedure: string;
  theatre: string | null;
  urgency: string;
  status: string;
  scheduledFor: string | null;
  consentObtained: boolean;
  consentDate: string | null;
  consentNote: string | null;
  preOpAssessment: string | null;
  intraOpNotes: string | null;
  postOpNotes: string | null;
  patient?: { id: string; mrn: string; fullName: string };
  surgeon?: { id: string; fullName: string } | null;
  anaesthetist?: { id: string; fullName: string } | null;
}

export interface DirectorateNode {
  id: string;
  name: string;
  code?: string;
  type: string;
  metrics: {
    facilities: number;
    patients: number;
    encounters: number;
    admissions: number;
    labPending: number;
    prescriptionsActive: number;
    immunizations: number;
    diseaseCases: number;
    referrals: number;
    revenue: number;
  };
  recentEncounters: number;
}

export interface DirectorateOverview {
  level: 'NATIONAL' | 'REGIONAL' | 'DISTRICT' | 'FACILITY';
  nodes: DirectorateNode[];
  // The caller's own scope context for the default (non-drilled) view — the
  // breadcrumb/heading use these so a district user sees "Kumasi Metropolitan"
  // instead of a bare "Ghana" crumb and a generic "Facility overview".
  regionName: string | null;
  districtName: string | null;
  facilityName: string | null;
}

export interface SystemSetting {
  key: string;
  group: 'sms' | 'whatsapp' | 'reminder' | 'app' | 'mail';
  label: string;
  description: string;
  env: string;
  secret: boolean;
  /** 'custom' = a DB override is active; 'env' = using the boot default. */
  source: 'custom' | 'env';
  configured: boolean;
  /** Masked for secrets; effective value otherwise. */
  value: string;
}

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  role: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  facilityId: string | null;
  ip: string | null;
  createdAt: string;
}

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  platform: string;
  status: string;
  enrolledAt: string | null;
  blockReason: string | null;
  remoteLogoutAt: string | null;
  lastSyncAt: string | null;
  lastSeenAt: string | null;
  softwareVersion: string | null;
}

/** A sync conflict awaiting review (docs/15 §4) — both versions preserved. */
export interface SyncConflictRow {
  id: string;
  transactionId: string;
  entityType: string;
  entityId: string;
  operation: string;
  status: string;
  deviceName: string | null;
  clientUser: string | null;
  clientEmail: string | null;
  /** JSON of the server state at detection (the row that won). */
  serverVersion: string;
  /** JSON of the incoming stale payload (never discarded, §166). */
  clientVersion: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface SyncConflictList {
  conflicts: SyncConflictRow[];
  open: number;
}

export interface ConfigAuditEntry {
  id: string;
  at: string;
  actorEmail: string | null;
  role: string | null;
  action: string;
  label: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  summary: string;
  after: Record<string, unknown>;
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roleCode: string;
  roleName: string;
  roleScope: string;
  facility: { id: string; name: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RoleBrief {
  code: string;
  name: string;
  scope: string;
}

export interface LicenseStatus {
  activated: boolean;
  edition: string | null;
  keySuffix: string | null;
  expiresAt: string | null;
  expired: boolean;
  daysLeft: number | null;
  facilities: { used: number; max: number | null };
  users: { used: number; max: number | null };
  compliant: boolean;
  limitsExceeded: string[];
}

export interface DeveloperUserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roleCode: string;
  roleName: string;
  roleScope: string;
  permissions: string[];
  facility: { id: string; name: string } | null;
  regionId: string | null;
  districtId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface DeliveryChannelStats {
  channel: string;
  total: number;
  delivered: number;
  /** Queued and still retryable (below the max attempts). */
  pending: number;
  /** Gave up — at max attempts and never delivered. */
  exhausted: number;
}

/** One day of delivery-health counts for the Overview trend chart. */
export interface DeliveryTrendPoint {
  date: string;
  delivered: number;
  pending: number;
  exhausted: number;
}

/** One channel's 14-day series — the Overview chart filter picks one (or All). */
export interface DeliveryChannelTrend {
  channel: string;
  points: DeliveryTrendPoint[];
}

export interface DeveloperOverview {
  license: LicenseStatus;
  counts: { users: number; facilities: number; devices: number; auditToday: number; activeSessions: number };
  security: { passwordMinLength: number; lockoutThreshold: number; sessionTtlHours: number };
  runtime: { node: string; platform: string; nodeEnv: string };
  /** Alert settings resolved for the developer panel. */
  settings: { alertPhone: string; alertWhatsApp: string; alertEmail: string; escalationEmail: string; alertWebhook: string; retentionDays: number; alertRetentionDays: number; emailMinSeverity: string; retryMaxAttempts: number; alertDaysBefore: number };
  /** Per-channel alert delivery counts (email / sms / webhook). */
  deliveryStats: DeliveryChannelStats[];
  /** Per-channel delivery health for the last 14 days (Overview trend chart). */
  deliveryTrend: DeliveryChannelTrend[];
}

export interface DevSystemInfo {
  runtime: { node: string; platform: string; arch: string; nodeEnv: string; pid: number };
  env: { key: string; env: string; group: string; secret: boolean; source: string; configured: boolean }[];
  counts: Record<string, number>;
}

export interface LockedUserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roleCode: string;
  roleName: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
}

export interface LockoutEventRow {
  id: string;
  at: string;
  /** The account that got locked (unauthenticated attempts have no actor). */
  email: string | null;
  actorEmail: string | null;
  entityId: string | null;
  ip: string | null;
  attempts: number | null;
}

export interface LockoutsOverview {
  locked: LockedUserRow[];
  recentEvents: LockoutEventRow[];
}

export interface SecurityAlertRow {
  id: string;
  event: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SecurityAlertInbox {
  unread: number;
  alerts: SecurityAlertRow[];
  deliveryStats: DeliveryChannelStats[];
}

/** One outbound delivery attempt record for an alert (retry queue row). */
export interface SecurityDeliveryRow {
  id: string;
  channel: string;
  to: string;
  subject: string | null;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
  status: 'DELIVERED' | 'RETRYING' | 'QUEUED';
}

/** Full alert detail for the drawer — the raw payload and per-recipient fan-out. */
export interface SecurityAlertDetail {
  alert: {
    id: string;
    event: string;
    severity: string;
    title: string;
    message: string;
    payload: Record<string, unknown>;
    read: boolean;
    createdAt: string;
  };
  deliveries: SecurityDeliveryRow[];
}

// ---- Admin masterdata (docs/24) -------------------------------------------

export interface EpiScheduleAdminItem {
  vaccine: string;
  dose: string;
  label: string;
  description: string;
  ageDays: number | null;
  intervalDays: number | null;
  source: 'default' | 'custom';
  active: boolean;
}

export interface RoleRow {
  id: string;
  code: string;
  name: string;
  scope: string;
  permissions: string[];
  userCount: number;
}

export interface PermissionInfo {
  code: string;
  label: string;
  group: string;
}

export interface AdminFacility {
  id: string;
  code: string;
  name: string;
  type: string;
  level: string | null;
  ownership: string;
  operationalStatus: string;
  accreditation: string | null;
  bedCapacity: number | null;
  telephone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  emergencyContact: string | null;
  services: string[];
  departmentsJson: string[];
  region?: { id: string; name: string };
  district?: { id: string; name: string };
  departments?: { id: string; name: string }[];
}

export interface GeoDistrict {
  id: string;
  code: string;
  name: string;
  type: string;
  capital: string | null;
  status: string;
}

export interface GeoRegion {
  id: string;
  code: string;
  name: string;
  capital: string | null;
  status: string;
  districts: GeoDistrict[];
}

// ---- Reports & analytics (docs/14) ----------------------------------------

export interface ReportIndicator {
  code: string;
  name: string;
  group: string;
  unit: string;
  dhims2Code: string;
  collected: boolean;
  value: number | null;
}

export interface ReportGroupRow {
  id: string;
  name: string;
  indicators: Record<string, number | null>;
}

export interface ReportSummary {
  scope: string;
  from: string;
  to: string;
  groupBy: 'none' | 'facility' | 'district' | 'region';
  indicators: ReportIndicator[];
  groups: ReportGroupRow[];
  truncated: boolean;
  generatedAt: string;
}

export interface ReportCompletenessRow {
  facilityId: string;
  code: string;
  name: string;
  district: string | null;
  region: string | null;
  reported: boolean;
  activity: string | null;
}

export interface ReportCompleteness {
  scope: string;
  from: string;
  to: string;
  facilities: { expected: number; reported: number };
  completenessPct: number;
  rows: ReportCompletenessRow[];
  generatedAt: string;
}

// ---- Anomaly detection (docs/14 §4) ---------------------------------------

export interface AnomalyFlag {
  weekStart: string;
  value: number;
  expected: number;
  stddev: number;
  z: number;
  severity: 'high' | 'medium';
}

export interface AnomalySeries {
  code: string;
  name: string;
  dhims2Code: string;
  unit: string;
  analyzed: boolean;
  values: Array<{ weekStart: string; value: number | null }>;
  mean: number | null;
  stddev: number | null;
  flags: AnomalyFlag[];
}

export interface AnomalyResult {
  scope: string;
  from: string;
  to: string;
  bucket: 'week';
  minPoints: number;
  indicators: AnomalySeries[];
  summary: { analyzed: number; anomalies: number; high: number };
  method: string;
}

// ---- Scheduled reports (docs/14 §5, spec §149) ---------------------------

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'summary' | 'completeness' | 'anomalies';
  cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  runTime: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  recipients: string;
  groupBy: 'none' | 'facility' | 'district' | 'region';
  scope: string;
  facilityId: string | null;
  regionId: string | null;
  districtId: string | null;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  lastStatus: string | null;
  lastError: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface ScheduledReportDelivery {
  id: string;
  scheduleId: string;
  reportType: string;
  periodFrom: string;
  periodTo: string;
  recipients: string;
  status: string;
  note: string | null;
  messageId: string | null;
  runAt: string;
  attempts: number;
  nextAttemptAt: string | null;
}

export interface ScheduledReportList {
  schedules: ScheduledReport[];
  cadences: string[];
  reportTypes: string[];
}

export interface ScheduledReportDeliveryLog {
  deliveries: ScheduledReportDelivery[];
}

// ---- GIS / national map (docs/14 §6) --------------------------------------

export interface MapPoint {
  id: string;
  code: string;
  name: string;
  type: string;
  level: string | null;
  ownership: string;
  operationalStatus: string;
  bedCapacity: number | null;
  lat: number;
  lng: number;
  regionId: string | null;
  region: string | null;
  districtId: string | null;
  district: string | null;
  activity30d: number;
}

export interface GeographyMap {
  scope: string;
  generatedAt: string;
  points: MapPoint[];
  total: number;
  /** True when the national scope exceeded the map cap and points were truncated. */
  truncated: boolean;
}

// ---- Hospital units (Department → Unit → Ward → Bed) --------------------

export interface UnitWard {
  id: string;
  name: string;
  bedCapacity: number | null;
  status: string;
  beds: number;
  occupied: number;
}

export interface HospitalUnit {
  id: string;
  code: string;
  name: string;
  type: string;
  headName: string | null;
  headTitle: string | null;
  phone: string | null;
  location: string | null;
  bedCapacity: number | null;
  services: string[];
  notes: string | null;
  status: string;
  department: { id: string; name: string } | null;
  facility: { id: string; code: string; name: string };
  wards: UnitWard[];
  beds: number;
  occupied: number;
  equipment: UnitEquipmentSummary;
  team: UnitTeamSummary;
}

export interface UnitDepartmentGroup {
  department: { id: string; name: string } | null;
  units: HospitalUnit[];
}

export interface UnitFacilityTree {
  facility: { id: string; code: string; name: string; staff: UnitStaffSummary };
  departments: UnitDepartmentGroup[];
}

export interface UnitEquipmentSummary {
  items: number;
  functional: number;
  inMaintenance: number;
  faulty: number;
  maintenanceDue: number;
}

export interface UnitTeamSummary {
  count: number;
  heads: number;
  onLeave: number;
}

export interface UnitStaffSummary {
  total: number;
  assigned: number;
  heads: number;
}

export interface Staff {
  id: string;
  staffNumber: string;
  fullName: string;
  role: string;
  speciality: string | null;
  licenseNumber: string | null;
  phone: string | null;
  email: string | null;
  employmentStatus: string;
  headOfUnit: boolean;
  joinedAt: string | null;
  notes: string | null;
  unit: { id: string; code: string; name: string } | null;
  facility: { id: string; code: string; name: string };
  /** Linked login account (docs/25) — null until an admin creates one. */
  user: { id: string; email: string; status: string; roleCode: string; roleName: string } | null;
}

export interface NationalServiceStaff {
  id: string;
  nssNumber: string;
  fullName: string;
  institution: string | null;
  programme: string | null;
  placement: string | null;
  supervisor: string | null;
  phone: string | null;
  email: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  unit: { id: string; code: string; name: string } | null;
  facility: { id: string; code: string; name: string };
}

export interface UnitEquipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  functional: number;
  inMaintenance: number;
  faulty: number;
  status: string;
  maintenanceDue: boolean;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  purchaseDate: string | null;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
  notes: string | null;
  createdAt: string;
  recentMaintenance?: { id: string; performedAt: string; note: string | null; performedBy: string | null }[];
}

export interface SurveillanceCase {
  id: string;
  patient: { id: string; fullName: string; mrn: string } | null;
  facility: { id: string; code: string; name: string; district: string | null; region: string | null } | null;
  reporter: { id: string; fullName: string } | null;
  disease: string;
  caseType: string;
  severity: string | null;
  status: string;
  outcome: string | null;
  notes: string | null;
  reportedAt: string;
  updatedAt: string;
  followUpCount: number;
}

export interface CaseFollowUp {
  id: string;
  followUpAt: string;
  status: string;
  temperature: number | null;
  contactsTraced: number;
  notes: string | null;
  by: { id: string; fullName: string } | null;
}

// ---- National integrations (docs/08): DHIMS2 + SORMAS + GhiLMIS + HRIMS + NHIS + eTracker + LHIMS adapters

export interface IntegrationStatusAdapter {
  adapter: 'dhims2' | 'sormas' | 'ghilmis' | 'hrims' | 'nhis' | 'etracker' | 'lhims';
  configured: boolean;
  pending: number;
  delivered: number;
  failed: number;
  lastDeliveredAt: string | null;
  lastError: string | null;
  nextAttemptAt: string | null;
  lastRemoteId: string | null;
}

export interface IntegrationStatus {
  adapters: IntegrationStatusAdapter[];
  sweepIntervalMs: number;
  maxAttempts: number;
  now: string;
}

export interface IntegrationDeliveryRow {
  id: string;
  adapter: string;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  idempotencyKey: string;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  remoteId: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface Dhims2Submission {
  dataSet: string;
  period: string;
  orgUnit: string;
  completeDate: string;
  dataValues: Array<{ dataElement: string; value: number; categoryOptionCombo: string }>;
  generatedAt: string;
}

export interface GhilmisSubmission {
  dataSet: string;
  period: string;
  orgUnit: string;
  generatedAt: string;
  items: Array<{
    commodity: string;
    category: string;
    unit: string;
    quantity: number;
    reorderLevel: number;
    minStock: number;
    maxStock: number;
    batch: string | null;
    expiryDate: string | null;
    status: 'OK' | 'LOW' | 'OUT';
  }>;
}

export interface HrimsSubmission {
  dataSet: string;
  period: string;
  orgUnit: string;
  generatedAt: string;
  summary: { total: number; active: number; onLeave: number; heads: number };
  staff: Array<{
    staffNumber: string;
    fullName: string;
    role: string;
    speciality: string | null;
    licenseNumber: string | null;
    phone: string | null;
    email: string | null;
    employmentStatus: string;
    headOfUnit: boolean;
    joinedAt: string | null;
    unitCode: string | null;
    unitName: string | null;
    facilityCode: string;
    facilityName: string;
  }>;
}

export interface NhisSubmission {
  dataSet: string;
  period: string;
  orgUnit: string;
  generatedAt: string;
  claims: Array<{
    claimNumber: string;
    patientName: string;
    nhisNumber: string | null;
    schemeCode: string;
    schemeName: string;
    serviceDate: string;
    items: Array<{ description: string; amount: number }>;
    amount: number;
  }>;
}

export interface EtrackerSubmission {
  dataSet: string;
  period: string;
  orgUnit: string;
  generatedAt: string;
  clients: Array<{
    clientId: string;
    mrn: string;
    fullName: string;
    sex: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    ghanaCard: string | null;
    nhisNumber: string | null;
    program: 'ANC' | 'PNC' | 'DELIVERY' | 'MULTIPLE';
    ancVisitsInPeriod: number;
    latestRiskAssessment: string | null;
    deliveriesInPeriod: number;
    latestDeliveryOutcome: string | null;
    pncVisitsInPeriod: number;
  }>;
}

export interface LhimsSubmission {
  dataSet: string;
  period: string;
  orgUnit: string;
  generatedAt: string;
  bundle: {
    resourceType: 'Bundle';
    type: 'transaction';
    entry: Array<{ fullUrl: string; resource: Record<string, unknown> }>;
  };
}

export interface SormasCaseExportItem {
  externalId: string;
  disease: string;
  caseClassification: 'SUSPECTED' | 'CONFIRMED';
  reportDate: string;
  facilityName: string | null;
  person: { firstName: string | null; lastName: string | null; sex: string; birthdate: string | null } | null;
}

export interface SurveillanceSummary {
  totals: {
    cases: number;
    open: number;
    closed: number;
    confirmed: number;
    suspected: number;
    deaths: number;
    followUps: number;
    contactsTraced: number;
    followUpRate: number;
  };
  byStatus: Record<string, number>;
  byCaseType: Record<string, number>;
  byDisease: Array<{ disease: string; count: number; confirmed: number; open: number }>;
  byFacility: Array<{ id: string; name: string; count: number }>;
  byDistrict: Record<string, number>;
  byRegion: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
}

// ---- Outbreak tracking: contact tracing network & patient location ----

export interface ContactTracingNode {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  phone: string | null;
  caseId: string;
  disease: string;
  status: 'CONFIRMED' | 'SUSPECTED' | 'CONTACT' | 'RECOVERED' | 'DECEASED';
  exposureDate: string;
  exposureType: 'DIRECT' | 'INDIRECT' | 'HOUSEHOLD' | 'HEALTHCARE' | 'COMMUNITY';
  notes: string | null;
  facility: { id: string; name: string } | null;
}

export interface ContactTracingEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: 'HOUSEHOLD' | 'WORKPLACE' | 'HEALTHCARE' | 'COMMUNITY' | 'TRANSPORT';
  exposureDate: string;
  durationMinutes: number | null;
  notes: string | null;
}

export interface ContactTracingNetwork {
  nodes: ContactTracingNode[];
  edges: ContactTracingEdge[];
  summary: {
    totalContacts: number;
    confirmedCases: number;
    pendingContacts: number;
    recovered: number;
    deceased: number;
  };
}

export interface PatientLocationEntry {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  phone: string | null;
  ward: string;
  bed: string | null;
  unit: { id: string; name: string } | null;
  department: string | null;
  admittedAt: string;
  dischargedAt: string | null;
  status: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED' | 'ISOLATED';
  isolationRequired: boolean;
  notes: string | null;
}

export interface LocationTrackingSummary {
  currentInHospital: number;
  isolated: number;
  transferred: number;
  discharged: number;
  byWard: Array<{ ward: string; count: number; isolated: number }>;
  recentMoves: Array<{ patientName: string; from: string; to: string; at: string }>;
}

export interface ExposureAlert {
  id: string;
  caseId: string;
  disease: string;
  patientName: string;
  contactPhone: string;
  contactName: string | null;
  alertType: 'SMS' | 'WHATSAPP' | 'EMAIL';
  message: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt: string | null;
  deliveredAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface ExposureAlertSummary {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  byDisease: Array<{ disease: string; alerts: number; delivered: number }>;
}
