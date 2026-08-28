/**
 * Demo/mock data for all GIHM-HIS modules.
 * Used as fallback when no backend API is available (client-side demo mode).
 */

export const DEMO_PATIENTS = [
  { id: 'MRN-0041', fullName: 'Ama Serwaa', dateOfBirth: '1985-03-15', sex: 'Female', phone: '0244123456', nationality: 'Ghanaian', bloodGroup: 'O+', nhisNumber: 'NHIS-001', ghanaCard: 'GHA-001-001-001', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0042', fullName: 'Kofi Mensah', dateOfBirth: '1972-07-22', sex: 'Male', phone: '0201234567', nationality: 'Ghanaian', bloodGroup: 'A+', nhisNumber: 'NHIS-002', ghanaCard: 'GHA-002-002-002', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0043', fullName: 'Akua Boateng', dateOfBirth: '1990-11-08', sex: 'Female', phone: '0265432100', nationality: 'Ghanaian', bloodGroup: 'B-', nhisNumber: 'NHIS-003', ghanaCard: 'GHA-003-003-003', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0044', fullName: 'Yaw Frimpong', dateOfBirth: '1965-01-30', sex: 'Male', phone: '0278901234', nationality: 'Ghanaian', bloodGroup: 'AB+', nhisNumber: null, ghanaCard: 'GHA-004-004-004', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0045', fullName: 'Esi Adjei', dateOfBirth: '1998-05-17', sex: 'Female', phone: '0551234567', nationality: 'Ghanaian', bloodGroup: 'O-', nhisNumber: 'NHIS-005', ghanaCard: 'GHA-005-005-005', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0046', fullName: 'Nana Agyemang', dateOfBirth: '1955-09-12', sex: 'Male', phone: '0243210987', nationality: 'Ghanaian', bloodGroup: 'A-', nhisNumber: 'NHIS-006', ghanaCard: 'GHA-006-006-006', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0047', fullName: 'Abena Osei', dateOfBirth: '1980-12-25', sex: 'Female', phone: '0261234567', nationality: 'Ghanaian', bloodGroup: 'B+', nhisNumber: null, ghanaCard: 'GHA-007-007-007', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0048', fullName: 'Kwame Darko', dateOfBirth: '1943-06-03', sex: 'Male', phone: '0209876543', nationality: 'Ghanaian', bloodGroup: 'O+', nhisNumber: 'NHIS-008', ghanaCard: 'GHA-008-008-008', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0049', fullName: 'Adwoa Pokua', dateOfBirth: '1995-02-14', sex: 'Female', phone: '0559876543', nationality: 'Ghanaian', bloodGroup: 'AB-', nhisNumber: null, ghanaCard: 'GHA-009-009-009', facility: 'Korle Bu Teaching Hospital' },
  { id: 'MRN-0050', fullName: 'Kojo Ansah', dateOfBirth: '1978-08-28', sex: 'Male', phone: '0275432109', nationality: 'Ghanaian', bloodGroup: 'A+', nhisNumber: 'NHIS-010', ghanaCard: 'GHA-010-010-010', facility: 'Korle Bu Teaching Hospital' },
];

export const DEMO_PRESCRIPTIONS = [
  { id: 'RX-001', patientId: 'MRN-0041', patientName: 'Ama Serwaa', medicine: 'Amoxicillin 500mg', dosage: '500mg TDS', quantity: 30, dispensedQty: 30, status: 'DISPENSED', prescribedBy: 'Dr. Kwame Asante', prescribedAt: '2026-08-27T08:30:00', ward: 'OPD' },
  { id: 'RX-002', patientId: 'MRN-0042', patientName: 'Kofi Mensah', medicine: 'Metformin 500mg', dosage: '500mg BD', quantity: 60, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Kwame Asante', prescribedAt: '2026-08-27T09:15:00', ward: 'OPD' },
  { id: 'RX-003', patientId: 'MRN-0043', patientName: 'Akua Boateng', medicine: 'Paracetamol 1g', dosage: '1g TDS PRN', quantity: 20, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Akua Mensah', prescribedAt: '2026-08-27T10:00:00', ward: 'Maternity' },
  { id: 'RX-004', patientId: 'MRN-0044', patientName: 'Yaw Frimpong', medicine: 'Amlodipine 5mg', dosage: '5mg OD', quantity: 30, dispensedQty: 15, status: 'PARTIAL', prescribedBy: 'Dr. Kwame Asante', prescribedAt: '2026-08-26T14:20:00', ward: 'Medical' },
  { id: 'RX-005', patientId: 'MRN-0045', patientName: 'Esi Adjei', medicine: 'Ferrous Sulphate 200mg', dosage: '200mg TDS', quantity: 90, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Akua Mensah', prescribedAt: '2026-08-27T11:45:00', ward: 'Antenatal' },
  { id: 'RX-006', patientId: 'MRN-0046', patientName: 'Nana Agyemang', medicine: 'Omeprazole 20mg', dosage: '20mg OD', quantity: 30, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Kwame Asante', prescribedAt: '2026-08-27T07:30:00', ward: 'Medical' },
  { id: 'RX-007', patientId: 'MRN-0047', patientName: 'Abena Osei', medicine: 'Ibuprofen 400mg', dosage: '400mg TDS', quantity: 30, dispensedQty: 30, status: 'DISPENSED', prescribedBy: 'Dr. Akua Mensah', prescribedAt: '2026-08-25T09:00:00', ward: 'OPD' },
  { id: 'RX-008', patientId: 'MRN-0048', patientName: 'Kwame Darko', medicine: 'Atorvastatin 20mg', dosage: '20mg ON', quantity: 30, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Kwame Asante', prescribedAt: '2026-08-27T13:00:00', ward: 'Medical' },
  { id: 'RX-009', patientId: 'MRN-0049', patientName: 'Adwoa Pokua', medicine: 'Ciprofloxacin 500mg', dosage: '500mg BD', quantity: 14, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Akua Mensah', prescribedAt: '2026-08-27T14:30:00', ward: 'OPD' },
  { id: 'RX-010', patientId: 'MRN-0050', patientName: 'Kojo Ansah', medicine: 'Salbutamol Inhaler', dosage: '2 puffs PRN', quantity: 1, dispensedQty: 0, status: 'ACTIVE', prescribedBy: 'Dr. Kwame Asante', prescribedAt: '2026-08-27T15:00:00', ward: 'Emergency' },
];

export const DEMO_QUEUE = [
  { id: 'Q-001', departmentId: 'OPD', ticket: 'OUT-042', status: 'WAITING', createdAt: '2026-08-27T08:15:00', patient: { id: 'MRN-0041', mrn: 'MRN-0041', fullName: 'Ama Serwaa' } },
  { id: 'Q-002', departmentId: 'OPD', ticket: 'OUT-043', status: 'IN_SERVICE', createdAt: '2026-08-27T08:30:00', patient: { id: 'MRN-0042', mrn: 'MRN-0042', fullName: 'Kofi Mensah' } },
  { id: 'Q-003', departmentId: 'OPD', ticket: 'OUT-044', status: 'WAITING', createdAt: '2026-08-27T09:00:00', patient: { id: 'MRN-0043', mrn: 'MRN-0043', fullName: 'Akua Boateng' } },
  { id: 'Q-004', departmentId: 'OPD', ticket: 'OUT-045', status: 'WAITING', createdAt: '2026-08-27T09:15:00', patient: { id: 'MRN-0045', mrn: 'MRN-0045', fullName: 'Esi Adjei' } },
  { id: 'Q-005', departmentId: 'OPD', ticket: 'OUT-046', status: 'WAITING', createdAt: '2026-08-27T09:30:00', patient: { id: 'MRN-0046', mrn: 'MRN-0046', fullName: 'Nana Agyemang' } },
  { id: 'Q-006', departmentId: 'OPD', ticket: 'PHA-015', status: 'WAITING', createdAt: '2026-08-27T10:00:00', patient: { id: 'MRN-0048', mrn: 'MRN-0048', fullName: 'Kwame Darko' } },
  { id: 'Q-007', departmentId: 'OPD', ticket: 'OUT-047', status: 'IN_SERVICE', createdAt: '2026-08-27T10:15:00', patient: { id: 'MRN-0050', mrn: 'MRN-0050', fullName: 'Kojo Ansah' } },
  { id: 'Q-008', departmentId: 'OPD', ticket: 'IMA-006', status: 'WAITING', createdAt: '2026-08-27T10:30:00', patient: { id: 'MRN-0044', mrn: 'MRN-0044', fullName: 'Yaw Frimpong' } },
  { id: 'Q-009', departmentId: 'OPD', ticket: 'OUT-040', status: 'COMPLETED', createdAt: '2026-08-27T07:45:00', patient: { id: 'MRN-0047', mrn: 'MRN-0047', fullName: 'Abena Osei' } },
  { id: 'Q-010', departmentId: 'OPD', ticket: 'OUT-048', status: 'WAITING', createdAt: '2026-08-27T10:45:00', patient: { id: 'MRN-0049', mrn: 'MRN-0049', fullName: 'Adwoa Pokua' } },
  { id: 'Q-011', departmentId: 'OPD', ticket: 'PHA-016', status: 'WAITING', createdAt: '2026-08-27T11:00:00', patient: { id: 'MRN-0043', mrn: 'MRN-0043', fullName: 'Akua Boateng' } },
  { id: 'Q-012', departmentId: 'OPD', ticket: 'LAB-023', status: 'WAITING', createdAt: '2026-08-27T09:15:00', patient: { id: 'MRN-0045', mrn: 'MRN-0045', fullName: 'Esi Adjei' } },
  { id: 'Q-013', departmentId: 'OPD', ticket: 'IMA-007', status: 'IN_SERVICE', createdAt: '2026-08-27T11:30:00', patient: { id: 'MRN-0044', mrn: 'MRN-0044', fullName: 'Yaw Frimpong' } },
];

export const DEMO_LAB_ORDERS = [
  { id: 'LAB-001', test: 'Full Blood Count (FBC)', discipline: 'haematology', status: 'VERIFIED', critical: false, createdAt: '2026-08-27T08:00', result: 'WBC: 7.2, RBC: 4.5, Hb: 13.2, Plt: 245', referenceRange: 'Hb 12-16 g/dL', patient: { id: 'MRN-0041', fullName: 'Ama Serwaa', mrn: 'MRN-0041', dateOfBirth: '1985-03-15' } },
  { id: 'LAB-002', test: 'Blood Glucose (Random)', discipline: 'chemistry', status: 'ORDERED', critical: false, createdAt: '2026-08-27T09:00', result: null, referenceRange: null, patient: { id: 'MRN-0042', fullName: 'Kofi Mensah', mrn: 'MRN-0042', dateOfBirth: '1972-07-22' } },
  { id: 'LAB-003', test: 'Urine RDT', discipline: 'chemistry', status: 'ORDERED', critical: false, createdAt: '2026-08-27T09:30', result: null, referenceRange: null, patient: { id: 'MRN-0043', fullName: 'Akua Boateng', mrn: 'MRN-0043', dateOfBirth: '1990-11-08' } },
  { id: 'LAB-004', test: 'Malaria RDT', discipline: 'parasitology', status: 'VERIFIED', critical: false, createdAt: '2026-08-27T08:45', result: 'Negative', referenceRange: null, patient: { id: 'MRN-0045', fullName: 'Esi Adjei', mrn: 'MRN-0045', dateOfBirth: '1998-05-17' } },
  { id: 'LAB-005', test: 'Lipid Profile', discipline: 'chemistry', status: 'ORDERED', critical: false, createdAt: '2026-08-27T10:00', result: null, referenceRange: null, patient: { id: 'MRN-0046', fullName: 'Nana Agyemang', mrn: 'MRN-0046', dateOfBirth: '1955-09-12' } },
  { id: 'LAB-006', test: 'Blood Group & Rh', discipline: 'haematology', status: 'VERIFIED', critical: false, createdAt: '2026-08-27T07:30', result: 'A+', referenceRange: null, patient: { id: 'MRN-0050', fullName: 'Kojo Ansah', mrn: 'MRN-0050', dateOfBirth: '1978-08-28' } },
  { id: 'LAB-007', test: 'Urinalysis', discipline: 'chemistry', status: 'ORDERED', critical: false, createdAt: '2026-08-27T11:00', result: null, referenceRange: null, patient: { id: 'MRN-0049', fullName: 'Adwoa Pokua', mrn: 'MRN-0049', dateOfBirth: '1995-02-14' } },
  { id: 'LAB-008', test: 'Kidney Function Test', discipline: 'chemistry', status: 'ORDERED', critical: true, createdAt: '2026-08-27T11:30', result: null, referenceRange: null, patient: { id: 'MRN-0048', fullName: 'Kwame Darko', mrn: 'MRN-0048', dateOfBirth: '1943-06-03' } },
];

export const DEMO_APPOINTMENTS = [
  { id: 'APT-001', patientId: 'MRN-0041', patientName: 'Ama Serwaa', doctor: 'Dr. Kwame Asante', date: '2026-08-27', time: '09:00', type: 'Follow-up', status: 'COMPLETED', department: 'OPD' },
  { id: 'APT-002', patientId: 'MRN-0043', patientName: 'Akua Boateng', doctor: 'Dr. Akua Mensah', date: '2026-08-27', time: '10:00', type: 'Antenatal', status: 'IN_PROGRESS', department: 'Maternity' },
  { id: 'APT-003', patientId: 'MRN-0044', patientName: 'Yaw Frimpong', doctor: 'Dr. Kwame Asante', date: '2026-08-27', time: '11:00', type: 'Consultation', status: 'SCHEDULED', department: 'OPD' },
  { id: 'APT-004', patientId: 'MRN-0046', patientName: 'Nana Agyemang', doctor: 'Dr. Kwame Asante', date: '2026-08-27', time: '14:00', type: 'Review', status: 'SCHEDULED', department: 'Medical' },
  { id: 'APT-005', patientId: 'MRN-0047', patientName: 'Abena Osei', doctor: 'Dr. Akua Mensah', date: '2026-08-28', time: '09:00', type: 'New Patient', status: 'SCHEDULED', department: 'OPD' },
  { id: 'APT-006', patientId: 'MRN-0049', patientName: 'Adwoa Pokua', doctor: 'Dr. Akua Mensah', date: '2026-08-27', time: '15:00', type: 'Lab Review', status: 'SCHEDULED', department: 'OPD' },
];

export const DEMO_EMERGENCY = [
  { id: 'EMG-001', patientId: 'MRN-0050', patientName: 'Kojo Ansah', age: 48, gender: 'Male', chiefComplaint: 'Chest pain and shortness of breath', esiLevel: 2, status: 'IN_TREATMENT', arrivalTime: '08:45', bed: 'EMG-03', doctor: 'Dr. Kwame Asante' },
  { id: 'EMG-002', patientId: 'MRN-0044', patientName: 'Yaw Frimpong', age: 61, gender: 'Male', chiefComplaint: 'Hypertensive crisis - BP 210/120', esiLevel: 2, status: 'WAITING', arrivalTime: '09:15', bed: 'EMG-05', doctor: null },
  { id: 'EMG-003', patientId: 'NEW-001', patientName: 'Grace Addo', age: 35, gender: 'Female', chiefComplaint: 'Road traffic accident - left leg fracture', esiLevel: 3, status: 'IN_TREATMENT', arrivalTime: '09:30', bed: 'EMG-07', doctor: 'Dr. Akua Mensah' },
  { id: 'EMG-004', patientId: 'NEW-002', patientName: 'Samuel Owusu', age: 8, gender: 'Male', chiefComplaint: 'High fever and seizures', esiLevel: 2, status: 'TRIAGED', arrivalTime: '10:00', bed: 'EMG-02', doctor: null },
  { id: 'EMG-005', patientId: 'NEW-003', patientName: 'Mary Boateng', age: 28, gender: 'Female', chiefComplaint: 'Antepartum hemorrhage', esiLevel: 1, status: 'IN_TREATMENT', arrivalTime: '10:15', bed: 'RESUS-01', doctor: 'Dr. Akua Mensah' },
  { id: 'EMG-006', patientId: 'MRN-0046', patientName: 'Nana Agyemang', age: 71, gender: 'Male', chiefComplaint: 'Fall at home - hip pain', esiLevel: 3, status: 'DISCHARGED', arrivalTime: '07:00', bed: null, doctor: 'Dr. Kwame Asante' },
  { id: 'EMG-007', patientId: 'NEW-004', patientName: 'Ibrahim Hassan', age: 42, gender: 'Male', chiefComplaint: 'Diabetic ketoacidosis', esiLevel: 2, status: 'IN_TREATMENT', arrivalTime: '10:45', bed: 'EMG-04', doctor: 'Dr. Kwame Asante' },
];

export const DEMO_BILLING = [
  { id: 'INV-001', patientId: 'MRN-0041', patientName: 'Ama Serwaa', items: [{ desc: 'Consultation', amount: 100 }, { desc: 'FBC Test', amount: 45 }, { desc: 'Amoxicillin 500mg', amount: 25 }], total: 170, paid: 170, status: 'PAID', date: '2026-08-27' },
  { id: 'INV-002', patientId: 'MRN-0042', patientName: 'Kofi Mensah', items: [{ desc: 'Consultation', amount: 100 }, { desc: 'Blood Glucose Test', amount: 15 }, { desc: 'Metformin 500mg (60)', amount: 60 }], total: 175, paid: 100, status: 'PARTIAL', date: '2026-08-27' },
  { id: 'INV-003', patientId: 'MRN-0043', patientName: 'Akua Boateng', items: [{ desc: 'Antenatal Consultation', amount: 150 }, { desc: 'Urinalysis', amount: 20 }, { desc: 'Paracetamol 1g', amount: 10 }], total: 180, paid: 0, status: 'UNPAID', date: '2026-08-27' },
  { id: 'INV-004', patientId: 'MRN-0050', patientName: 'Kojo Ansah', items: [{ desc: 'Emergency Consultation', amount: 200 }, { desc: 'ECG', amount: 50 }, { desc: 'Salbutamol Inhaler', amount: 85 }], total: 335, paid: 335, status: 'PAID', date: '2026-08-27' },
  { id: 'INV-005', patientId: 'MRN-0044', patientName: 'Yaw Frimpong', items: [{ desc: 'Consultation', amount: 100 }, { desc: 'Lipid Profile', amount: 80 }, { desc: 'Amlodipine 5mg', amount: 35 }], total: 215, paid: 0, status: 'UNPAID', date: '2026-08-27' },
];

export const DEMO_ADMISSIONS = [
  { id: 'ADM-001', patientId: 'MRN-0044', patientName: 'Yaw Frimpong', ward: 'Medical', bed: 'MED-12', admittedAt: '2026-08-25', doctor: 'Dr. Kwame Asante', diagnosis: 'Hypertensive Heart Disease', status: 'ADMITTED' },
  { id: 'ADM-002', patientId: 'MRN-0048', patientName: 'Kwame Darko', ward: 'Medical', bed: 'MED-08', admittedAt: '2026-08-26', doctor: 'Dr. Kwame Asante', diagnosis: 'Type 2 DM with complications', status: 'ADMITTED' },
  { id: 'ADM-003', patientId: 'MRN-0043', patientName: 'Akua Boateng', ward: 'Maternity', bed: 'MAT-05', admittedAt: '2026-08-27', doctor: 'Dr. Akua Mensah', diagnosis: 'Antenatal care', status: 'ADMITTED' },
  { id: 'ADM-004', patientId: 'NEW-001', patientName: 'Grace Addo', ward: 'Surgical', bed: 'SUR-03', admittedAt: '2026-08-27', doctor: 'Dr. Akua Mensah', diagnosis: 'Left tibial fracture', status: 'ADMITTED' },
];

export const DEMO_STAFF_ATTENDANCE = [
  { id: 'ATT-001', staffId: 'STF-001', name: 'Dr. Kwame Asante', role: 'Doctor', clockIn: '07:55', clockOut: null, status: 'ON_DUTY', biometric: true },
  { id: 'ATT-002', staffId: 'STF-002', name: 'Dr. Akua Mensah', role: 'Doctor', clockIn: '08:00', clockOut: null, status: 'ON_DUTY', biometric: true },
  { id: 'ATT-003', staffId: 'STF-003', name: 'Nurse Ama Mensah', role: 'Nurse', clockIn: '07:50', clockOut: null, status: 'ON_DUTY', biometric: true },
  { id: 'ATT-004', staffId: 'STF-004', name: 'Pharm. Kofi Boateng', role: 'Pharmacist', clockIn: '08:15', clockOut: null, status: 'ON_DUTY', biometric: true },
  { id: 'ATT-005', staffId: 'STF-005', name: 'Lab Sci. Efua Owusu', role: 'Lab Scientist', clockIn: '08:05', clockOut: '16:00', status: 'CLOCKED_OUT', biometric: true },
  { id: 'ATT-006', staffId: 'STF-006', name: 'Cashier Abena Osei', role: 'Cashier', clockIn: '08:10', clockOut: null, status: 'ON_DUTY', biometric: false },
  { id: 'ATT-007', staffId: 'STF-007', name: 'Nurse Kofi Amoako', role: 'Nurse', clockIn: null, clockOut: null, status: 'ABSENT', biometric: false },
  { id: 'ATT-008', staffId: 'STF-008', name: 'Dr. Yaa Asantewaa', role: 'Doctor', clockIn: '06:00', clockOut: '14:00', status: 'CLOCKED_OUT', biometric: true },
];

/**
 * Helper: wrap API call with demo fallback.
 * Tries the real API first; on failure, returns the demo data.
 */
export async function apiWithFallback<T>(path: string, demoData: T, opts?: Record<string, unknown>): Promise<T> {
  try {
    return await import('./api').then(({ api }) => api<T>(path, opts as never));
  } catch {
    return demoData;
  }
}
