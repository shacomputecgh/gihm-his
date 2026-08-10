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
  regionId: string | null;
  districtId: string | null;
  community: string | null;
  address: string | null;
  facilityId: string | null;
  consentAccepted: boolean;
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
  patient?: { id: string; mrn: string; fullName: string } | null;
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
  createdAt: string;
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

export interface Invoice {
  id: string;
  amount: number;
  paidAmount: number;
  status: string;
  paymentMethod: string | null;
  issuedAt: string;
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
  patient: { id: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; districtName: string | null };
  vaccine: string;
  dose: string;
  description: string;
  lastDoseAt: string;
  nextDueAt: string;
  daysUntil: number;
  daysOverdue: number;
  bucket: 'OVERDUE' | 'DUE_SOON';
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
  patient: { id: string; mrn: string; fullName: string; dateOfBirth: string | null; phone: string | null; districtName: string | null };
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
  note: string;
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
  lastSeenAt: string | null;
  softwareVersion: string | null;
}
