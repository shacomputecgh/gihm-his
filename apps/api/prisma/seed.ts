// =====================================================================
// GIHM-HIS seed — DEMO / SYNTHETIC DATA ONLY (spec §155)
// All patients, contacts, facility figures and clinical records below are
// fictional and generated for development/demonstration. Never use real
// patient data in demos.
// =====================================================================
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { GHANA_REGIONS, districtType, TOTAL_REGIONS, TOTAL_DISTRICTS } from './data/geography.js';
import { DEMO_FACILITIES } from './data/facilities.js';
import { DAY_MS, nextScheduleItem } from '../src/modules/immunization/schedule.js';

const db = new PrismaClient();

// Deterministic PRNG so re-seeding produces the same demo dataset.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const pick = <T>(arr: T[]): T => {
  const v = arr[Math.floor(rnd() * arr.length)];
  return v === undefined ? arr[0]! : v;
};
const between = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const daysAgo = (n: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, between(0, 59), 0, 0);
  return d;
};

/** Next-due date for a dose, mirroring the API module: child doses are due at
 * the next dose's age from birth; repeat/adult doses a fixed interval later. */
function epiNextDueAt(dob: Date, vaccine: string, dose: string, givenAt: Date): Date | undefined {
  const next = nextScheduleItem(vaccine, dose);
  if (!next) return undefined;
  if (next.ageDays !== null) return new Date(dob.getTime() + next.ageDays * DAY_MS);
  if (next.intervalDays !== null) return new Date(givenAt.getTime() + next.intervalDays * DAY_MS);
  return undefined;
}

const FIRST = ['Kwame', 'Kofi', 'Kojo', 'Yaw', 'Kwabena', 'Kwaku', 'Akosua', 'Ama', 'Abena', 'Akua', 'Yaa', 'Afia', 'Efua', 'Adwoa', 'Kweku', 'Esi', 'Araba', 'Baaba', 'Nana', 'Kwasi', 'Adjoa', 'Ekua', 'Serwaa', 'Akwasi', 'Yaw', 'Fosu', 'Gyamfi', 'Owusu', 'Osei', 'Antwi', 'Boadu', 'Appiah', 'Asante', 'Darko', 'Frimpong', 'Mensah', 'Ntow', 'Opoku', 'Poku', 'Sarpong', 'Twum', 'Agyemang', 'Boateng', 'Danquah', 'Essien', 'Fianko', 'Kwarteng', 'Nkrumah', 'Quaye', 'Sowah'];
const SURNAMES = ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Osei', 'Appiah', 'Antwi', 'Boadu', 'Darko', 'Frimpong', 'Agyemang', 'Danquah', 'Essien', 'Gyamfi', 'Kwarteng', 'Nkrumah', 'Opoku', 'Quaye', 'Sarpong', 'Twum', 'Bediako', 'Cudjoe', 'Dankwa', 'Fianko', 'Kyei', 'Ntow', 'Poku', 'Sowah', 'Tetteh', 'Amoah', 'Blay', 'Djan', 'Eduah', 'Ghartey', 'Hagan', 'Kobla', 'Lartey', 'Mettle', 'Nortey', 'Ocloo'];
const COMMUNITIES = ['Zongo', 'Aboabo', 'Asafo', 'Bantama', 'Obuasi New Town', 'Nima', 'Chorkor', 'Madina', 'Sukura', 'Adenta', 'Kasoa', 'Fadama', 'Kotoka', 'Labadi', 'Teshie', 'Dansoman'];
const DISTRICTS_GA = ['Accra Metropolitan', 'Ayawaso West Municipal', 'Tema Metropolitan', 'Ga East Municipal', 'Adenta Municipal', 'Korle Klottey Municipal'];
const DISTRICTS_AS = ['Kumasi Metropolitan', 'Ejisu Municipal', 'Asokwa Municipal', 'Oforikrom Municipal', 'Bekwai Municipal'];
const DISTRICTS_OTHER = ['Ho Municipal', 'Cape Coast Metropolitan', 'Sogakope', 'Sunyani Municipal', 'Tamale Metropolitan', 'Sekondi-Takoradi Metropolitan'];

async function main() {
  console.log('🌍 Seeding GIHM-HIS (DEMO / SYNTHETIC DATA)…');

  // ---------------------------------------------------------------- wipe
  await db.auditLog.deleteMany();
  await db.mutationLog.deleteMany();
  await db.facilityApplication.deleteMany();
  await db.patientMerge.deleteMany();
  await db.transfusionRecord.deleteMany();
  await db.bloodUnit.deleteMany();
  await db.bloodDonation.deleteMany();
  await db.bloodDonor.deleteMany();
  await db.surgicalBooking.deleteMany();
  await db.ambulanceTrip.deleteMany();
  await db.ambulance.deleteMany();
  await db.stockMovement.deleteMany();
  await db.stockItem.deleteMany();
  await db.bed.deleteMany();
  await db.diseaseCase.deleteMany();
  await db.immunization.deleteMany();
  await db.invoice.deleteMany();
  await db.referral.deleteMany();
  await db.admission.deleteMany();
  await db.prescription.deleteMany();
  await db.labOrder.deleteMany();
  await db.diagnosis.deleteMany();
  await db.clinicalNote.deleteMany();
  await db.encounter.deleteMany();
  await db.queueEntry.deleteMany();
  await db.appointment.deleteMany();
  await db.patientIdentifier.deleteMany();
  await db.patientContact.deleteMany();
  await db.patient.deleteMany();
  await db.device.deleteMany();
  await db.user.deleteMany();
  await db.role.deleteMany();
  await db.department.deleteMany();
  await db.facility.deleteMany();
  await db.subDistrict.deleteMany();
  await db.community.deleteMany();
  await db.district.deleteMany();
  await db.region.deleteMany();
  await db.organization.deleteMany();

  // ---------------------------------------------------------- geography
  const regionIds: Record<string, string> = {};
  const districtIdByName: Record<string, string> = {};
  for (const r of GHANA_REGIONS) {
    const region = await db.region.create({
      data: { code: r.code, name: r.name, capital: r.capital, gpsLat: r.gpsLat, gpsLng: r.gpsLng, status: 'ACTIVE', effectiveDate: new Date('2021-01-01') },
    });
    regionIds[r.code] = region.id;
    let i = 1;
    for (const d of r.districts) {
      const district = await db.district.create({
        data: {
          code: `${r.code}-${String(i++).padStart(2, '0')}`,
          name: d.name,
          type: districtType(d.name),
          capital: d.capital,
          regionId: region.id,
          status: 'ACTIVE',
        },
      });
      districtIdByName[d.name] = district.id;
    }
  }
  console.log(`  ✓ ${TOTAL_REGIONS} regions, ${TOTAL_DISTRICTS} district entries`);

  // ---------------------------------------------------------- organizations
  const orgGhs = await db.organization.create({ data: { name: 'Ghana Health Service (synthetic)', type: 'GHS' } });
  const orgKbth = await db.organization.create({ data: { name: 'Korle-Bu Teaching Hospital (synthetic)', type: 'TEACHING_HOSPITAL' } });
  const orgChag = await db.organization.create({ data: { name: 'CHAG / Mission (synthetic)', type: 'CHAG_MISSION' } });
  const orgPriv = await db.organization.create({ data: { name: 'Private providers (synthetic)', type: 'PRIVATE' } });

  // --------------------------------------------------------------- facilities
  const facilityByCode: Record<string, { id: string; departments: { id: string; name: string }[] }> = {};
  for (const f of DEMO_FACILITIES) {
    const region = await db.region.findUnique({ where: { code: f.regionCode } });
    const district = await db.district.findFirst({ where: { name: f.districtName } });
    if (!region || !district) {
      console.warn(`  ! skipping facility ${f.name}: geography not found`);
      continue;
    }
    const orgId =
      f.ownership === 'TEACHING_HOSPITAL' ? orgKbth.id :
      f.ownership === 'CHAG_MISSION' ? orgChag.id :
      f.ownership === 'PRIVATE' ? orgPriv.id : orgGhs.id;
    const facility = await db.facility.create({
      data: {
        code: f.code,
        name: f.name,
        type: f.type,
        level: f.level,
        ownership: f.ownership,
        organizationId: orgId,
        regionId: region.id,
        districtId: district.id,
        address: f.address,
        gpsLat: f.gpsLat,
        gpsLng: f.gpsLng,
        telephone: f.telephone,
        email: f.email,
        website: f.website,
        emergencyContact: f.emergencyContact,
        operationalStatus: 'OPERATIONAL',
        accreditation: 'PENDING_ACCREDITATION',
        bedCapacity: f.bedCapacity,
        openingHours: JSON.stringify(f.openingHours),
        services: JSON.stringify(f.services),
        departmentsJson: JSON.stringify(f.departments),
        isSynthetic: true,
        status: 'ACTIVE',
      },
    });
    const deps: { id: string; name: string }[] = [];
    for (const d of f.departments) {
      const dep = await db.department.create({ data: { name: d, facilityId: facility.id, queueEnabled: true } });
      deps.push({ id: dep.id, name: dep.name });
    }
    facilityByCode[f.code] = { id: facility.id, departments: deps };
    console.log(`  ✓ facility ${f.name}`);
  }

  const korleBu = facilityByCode['GH-KBTH']!;
  const deptO = (name: string) => korleBu.departments.find((d) => d.name.toLowerCase().includes(name.toLowerCase()))!;

  // ------------------------------------------------------------------ roles
  const P = {
    all: ['view_patient', 'create_patient', 'edit_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'dispense', 'order_lab', 'verify_lab', 'view_financial', 'process_payment', 'view_reports', 'export_data', 'manage_users', 'manage_facility', 'manage_region', 'manage_district', 'view_queue', 'manage_queue', 'view_appointments', 'book_appointment', 'view_dashboard', 'view_audit', 'manage_devices', 'sync_data', 'view_surveillance', 'manage_stock', 'manage_patient_records', 'manage_ambulance', 'manage_blood_bank', 'manage_theatre'],
  };
  const roles: Record<string, string> = {
    NATIONAL_ADMIN: JSON.stringify([...P.all, 'review_facility_applications']),
    REGIONAL_DIRECTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'view_reports', 'export_data', 'view_dashboard', 'view_queue', 'view_appointments', 'manage_region', 'view_audit', 'view_surveillance', 'review_facility_applications']),
    DISTRICT_DIRECTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'view_reports', 'export_data', 'view_dashboard', 'view_queue', 'view_appointments', 'manage_district', 'view_surveillance', 'review_facility_applications']),
    HOSPITAL_ADMIN: JSON.stringify([...P.all, 'manage_users', 'manage_facility', 'view_financial', 'view_audit', 'manage_devices']),
    MEDICAL_DIRECTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'order_lab', 'verify_lab', 'view_reports', 'view_dashboard', 'view_appointments', 'view_queue', 'book_appointment']),
    DOCTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'order_lab', 'view_appointments', 'book_appointment', 'view_queue', 'view_dashboard', 'view_reports']),
    NURSE: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'view_appointments', 'view_queue', 'manage_queue', 'view_dashboard', 'dispense', 'manage_theatre', 'manage_ambulance', 'manage_blood_bank']),
    AMBULANCE_OFFICER: JSON.stringify(['view_patient', 'manage_ambulance', 'view_queue', 'manage_queue', 'view_dashboard', 'view_appointments', 'write_clinical_note']),
    MIDWIFE: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'view_appointments', 'view_queue', 'manage_queue', 'view_dashboard', 'view_surveillance']),
    PHARMACIST: JSON.stringify(['view_patient', 'dispense', 'view_queue', 'manage_queue', 'view_dashboard', 'view_financial', 'manage_stock']),
    LAB_SCIENTIST: JSON.stringify(['view_patient', 'order_lab', 'verify_lab', 'view_queue', 'manage_queue', 'view_dashboard']),
    HEALTH_INFO_OFFICER: JSON.stringify(['view_patient', 'view_reports', 'export_data', 'view_dashboard', 'view_audit', 'view_surveillance']),
    ACCOUNTANT: JSON.stringify(['view_financial', 'view_reports', 'view_dashboard']),
    CASHIER: JSON.stringify(['view_financial', 'process_payment', 'view_queue', 'manage_queue', 'view_dashboard', 'view_patient']),
    IT_ADMIN: JSON.stringify(['manage_devices', 'view_audit', 'sync_data', 'manage_users', 'view_dashboard']),
    COMMUNITY_HEALTH_WORKER: JSON.stringify(['create_patient', 'view_patient', 'view_clinical_record', 'write_clinical_note', 'sync_data', 'view_queue', 'view_dashboard', 'view_surveillance', 'view_appointments', 'book_appointment']),
    PATIENT: JSON.stringify(['self_access']),
  };
  const roleScopes: Record<string, string> = {
    NATIONAL_ADMIN: 'NATIONAL',
    REGIONAL_DIRECTOR: 'REGIONAL',
    DISTRICT_DIRECTOR: 'DISTRICT',
    HOSPITAL_ADMIN: 'FACILITY',
    MEDICAL_DIRECTOR: 'FACILITY',
    DOCTOR: 'FACILITY',
    NURSE: 'FACILITY',
    AMBULANCE_OFFICER: 'FACILITY',
    MIDWIFE: 'FACILITY',
    PHARMACIST: 'FACILITY',
    LAB_SCIENTIST: 'FACILITY',
    HEALTH_INFO_OFFICER: 'FACILITY',
    ACCOUNTANT: 'FACILITY',
    CASHIER: 'FACILITY',
    IT_ADMIN: 'FACILITY',
    COMMUNITY_HEALTH_WORKER: 'FACILITY',
    PATIENT: 'PATIENT',
  };
  const roleIds: Record<string, string> = {};
  for (const [code, perms] of Object.entries(roles)) {
    const r = await db.role.create({ data: { code, name: code.replace(/_/g, ' '), scope: roleScopes[code]!, permissions: perms } });
    roleIds[code] = r.id;
  }

  // ------------------------------------------------------------------ users
  const hash = await bcrypt.hash('Demo@123', 10);
  const asanteRegion = await db.region.findUnique({ where: { code: 'AS' } });
  const kumasiMetro = await db.district.findFirst({ where: { name: 'Kumasi Metropolitan' } });

  const users = [
    { email: 'admin@demo.gh', fullName: 'National Admin (Demo)', role: 'NATIONAL_ADMIN' },
    { email: 'regional@demo.gh', fullName: 'Ashanti Regional Director (Demo)', role: 'REGIONAL_DIRECTOR', regionId: asanteRegion?.id ?? null, districtId: kumasiMetro?.id ?? null },
    { email: 'hospital@demo.gh', fullName: 'Korle-Bu Hospital Admin (Demo)', role: 'HOSPITAL_ADMIN', facilityId: korleBu.id },
    { email: 'doctor@demo.gh', fullName: 'Dr. Kwabena Owusu (Demo)', role: 'DOCTOR', facilityId: korleBu.id },
    { email: 'nurse@demo.gh', fullName: 'Nurse Ama Serwaa (Demo)', role: 'NURSE', facilityId: korleBu.id },
    { email: 'pharmacist@demo.gh', fullName: 'Pharm. Kofi Mensah (Demo)', role: 'PHARMACIST', facilityId: korleBu.id },
    { email: 'lab@demo.gh', fullName: 'Lab. Scientist Efua Appiah (Demo)', role: 'LAB_SCIENTIST', facilityId: korleBu.id },
    { email: 'cashier@demo.gh', fullName: 'Cashier Adwoa Boateng (Demo)', role: 'CASHIER', facilityId: korleBu.id },
    { email: 'ambulance@demo.gh', fullName: 'Ambulance Officer Kojo Asante (Demo)', role: 'AMBULANCE_OFFICER', facilityId: korleBu.id },
    { email: 'chw@demo.gh', fullName: 'CHW Akua Frimpong (Demo)', role: 'COMMUNITY_HEALTH_WORKER', facilityId: facilityByCode['GH-KWRIDGE']?.id },
  ];
  const userIdByEmail: Record<string, string> = {};
  for (const u of users) {
    const created = await db.user.create({
      data: {
        email: u.email,
        passwordHash: hash,
        fullName: u.fullName,
        roleId: roleIds[u.role]!,
        facilityId: u.facilityId,
        regionId: u.regionId,
        districtId: u.districtId,
        isSynthetic: true,
        status: 'ACTIVE',
      },
    });
    userIdByEmail[u.email] = created.id;
  }

  // ----------------------------------------------------------------- patients
  const ghanaCards = ['GHA-000000000-1', 'GHA-000000000-2', 'GHA-000000000-3', 'GHA-000000000-4', 'GHA-000000000-5'];
  const patientDefs: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 42; i++) {
    const name = `${pick(FIRST)} ${pick(SURNAMES)}`;
    const sex = rnd() > 0.5 ? 'F' : 'M';
    const age = between(1, 78);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    dob.setMonth(between(0, 11), between(1, 28));
    patientDefs.push({
      name,
      sex,
      dob,
      phone: `0${between(20, 55)}${String(between(1000000, 9999999)).padStart(7, '0')}`,
      district: pick([...DISTRICTS_GA, ...DISTRICTS_AS, ...DISTRICTS_OTHER]),
      community: pick(COMMUNITIES),
      ghanaCard: i < 5 ? ghanaCards[i] : undefined,
      nhis: i % 3 === 0 ? `NHIS-${10000000 + i}` : undefined,
    });
  }
  // An intentional near-duplicate pair to exercise the Master Patient Index.
  patientDefs.push({ name: 'Ama Serwaa Mensah', sex: 'F', dob: new Date('1992-04-15'), phone: '0244000001', district: 'Accra Metropolitan', community: 'Nima' });
  patientDefs.push({ name: 'Ama Serwaa Mensah', sex: 'F', dob: new Date('1992-04-15'), phone: '0244000001', district: 'Accra Metropolitan', community: 'Nima' });

  const patientIds: string[] = [];
  let mrnSeq = 1;
  for (const def of patientDefs) {
    const districtId = districtIdByName[def.district as string];
    const region = districtId
      ? await db.district.findUnique({ where: { id: districtId }, include: { region: true } })
      : null;
    const patient = await db.patient.create({
      data: {
        mrn: `GH-${String(mrnSeq++).padStart(6, '0')}`,
        fullName: def.name as string,
        sex: def.sex as string,
        dateOfBirth: def.dob as Date,
        phone: def.phone as string,
        ghanaCard: def.ghanaCard as string | undefined,
        nhisNumber: def.nhis as string | undefined,
        districtId: districtId ?? undefined,
        regionId: region?.regionId ?? undefined,
        facilityId: korleBu.id,
        community: def.community as string,
        address: `Sample address, ${def.community} (synthetic)`,
        bloodGroup: pick(['O+', 'A+', 'B+', 'O-', 'AB+']),
        allergies: rnd() > 0.85 ? JSON.stringify(['Penicillin']) : '[]',
        isSynthetic: true,
        status: 'ACTIVE',
      },
    });
    patientIds.push(patient.id);
  }

  // Link the patient demo account to one record.
  const linkedPatient = await db.patient.findFirst({ where: { fullName: 'Ama Serwaa Mensah' } });
  if (linkedPatient) {
    await db.user.update({ where: { id: userIdByEmail['patient@demo.gh'] ?? '' }, data: { patient: { connect: { id: linkedPatient.id } } } }).catch(() => undefined);
    if (!userIdByEmail['patient@demo.gh']) {
      await db.user.create({ data: { email: 'patient@demo.gh', passwordHash: hash, fullName: 'Ama Serwaa Mensah (Patient)', roleId: roleIds['PATIENT']!, isSynthetic: true, status: 'ACTIVE', patient: { connect: { id: linkedPatient.id } } } });
    }
  }
  console.log(`  ✓ ${patientIds.length} synthetic patients`);

  // ------------------------------------------------------- appointments
  for (let i = 0; i < 16; i++) {
    const when = daysAgo(i === 0 ? 0 : -1 * Math.floor(rnd() * 3) - 1, between(8, 16));
    const patientId = pick(patientIds);
    await db.appointment.create({
      data: {
        patientId,
        facilityId: korleBu.id,
        service: pick(['General OPD', 'Antenatal', 'Paediatrics', 'Dental', 'Cardiology review', 'Diabetes review', 'Physiotherapy']),
        scheduledFor: when,
        status: pick(['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED']),
      },
    });
  }

  // -------------------------------------------------------------- encounters
  const icd = [
    { code: 'J06.9', desc: 'Acute upper respiratory infection' },
    { code: 'B54', desc: 'Unspecified malaria' },
    { code: 'A09', desc: 'Infectious gastroenteritis' },
    { code: 'I10', desc: 'Essential hypertension' },
    { code: 'E11.9', desc: 'Type 2 diabetes mellitus' },
    { code: 'J45.9', desc: 'Asthma, unspecified' },
    { code: 'M54.5', desc: 'Low back pain' },
    { code: 'N39.0', desc: 'Urinary tract infection' },
    { code: 'K29.7', desc: 'Gastritis, unspecified' },
    { code: 'D64.9', desc: 'Anaemia, unspecified' },
  ];
  const meds = ['Paracetamol 500mg', 'Artemether-Lumefantrine', 'Amoxicillin 500mg', 'Metformin 500mg', 'Amlodipine 5mg', 'ORS Sachets', 'Ibuprofen 400mg', 'Salbutamol Inhaler'];
  const labs = [
    { test: 'Full Blood Count', discipline: 'HAEMATOLOGY' },
    { test: 'Malaria RDT', discipline: 'MICROBIOLOGY' },
    { test: 'Random Blood Sugar', discipline: 'CHEMISTRY' },
    { test: 'Urine RDT (Pregnancy)', discipline: 'SEROLOGY' },
    { test: 'Blood Group & Rh', discipline: 'BLOOD_BANK' },
    { test: 'Widal Test', discipline: 'MICROBIOLOGY' },
  ];

  for (let i = 0; i < 30; i++) {
    const patientId = pick(patientIds);
    const d = daysAgo(Math.floor(rnd() * 6), between(8, 15));
    const dx = pick(icd);
    const encounter = await db.encounter.create({
      data: {
        patientId,
        facilityId: korleBu.id,
        type: pick(['OPD', 'OPD', 'OPD', 'EMERGENCY']),
        status: 'COMPLETED',
        clinicianId: userIdByEmail['doctor@demo.gh'],
        presentingComplaint: pick(['Fever and headache', 'Cough with sputum', 'Abdominal pain', 'Body aches', 'High blood pressure review', 'Diarrhoea and vomiting', 'Skin rash']),
        temperature: 36.5 + rnd() * 2.5,
        pulse: between(60, 110),
        respiratoryRate: between(14, 24),
        systolicBp: between(95, 170),
        diastolicBp: between(60, 105),
        spo2: 94 + rnd() * 6,
        weightKg: between(38, 95),
        painScore: between(0, 8),
        triageCategory: rnd() > 0.8 ? 'EMERGENT' : rnd() > 0.5 ? 'URGENT' : 'NON_URGENT',
        diagnosisSummary: dx.desc,
        createdAt: d,
        updatedAt: d,
      },
    });
    await db.diagnosis.create({ data: { encounterId: encounter.id, code: dx.code, description: dx.desc, type: 'PRIMARY' } });
    await db.clinicalNote.create({
      data: {
        encounterId: encounter.id,
        authorId: userIdByEmail['doctor@demo.gh'],
        noteType: 'DOCTOR',
        note: `Synthetic consultation note: ${dx.desc}. Patient counselled, treatment plan documented. (DEMO DATA)`,
        createdAt: d,
      },
    });

    if (rnd() > 0.5) {
      const lb = pick(labs);
      const order = await db.labOrder.create({
        data: {
          encounterId: encounter.id,
          patientId,
          facilityId: korleBu.id,
          test: lb.test,
          discipline: lb.discipline,
          sampleType: pick(['Blood', 'Urine', 'Stool']),
          status: pick(['VERIFIED', 'VERIFIED', 'ORDERED']),
          requestedById: userIdByEmail['doctor@demo.gh'],
          verifiedById: userIdByEmail['lab@demo.gh'],
          result: 'Result pending… (synthetic)' === 'Result pending… (synthetic)' && rnd() > 0.4 ? syntheticResult(lb.test) : undefined,
          critical: false,
          createdAt: d,
          updatedAt: d,
        },
      });
      if (i === 3) {
        await db.labOrder.update({ where: { id: order.id }, data: { result: 'Hb 5.2 g/dL', critical: true, status: 'VERIFIED', referenceRange: '12.0–16.0 g/dL' } });
      }
    }
    if (rnd() > 0.45) {
      await db.prescription.create({
        data: {
          encounterId: encounter.id,
          patientId,
          facilityId: korleBu.id,
          medicine: pick(meds),
          dosage: pick(['500mg', '1 tablet', '2 tablets', '1 sachet']),
          frequency: pick(['TDS', 'BD', 'OD', 'QDS', 'PRN']),
          duration: pick(['3 days', '5 days', '7 days', '14 days']),
          quantity: between(6, 42),
          route: 'Oral',
          status: pick(['DISPENSED', 'DISPENSED', 'ACTIVE']),
          dispensedQty: 0,
          prescribedById: userIdByEmail['doctor@demo.gh'],
          dispensedById: userIdByEmail['pharmacist@demo.gh'],
          createdAt: d,
        },
      });
    }
    if (rnd() > 0.7) {
      await db.invoice.create({
        data: {
          patientId,
          facilityId: korleBu.id,
          encounterId: encounter.id,
          items: JSON.stringify([
            { description: 'Consultation', amount: 80 },
            { description: 'Laboratory', amount: between(30, 120) },
          ]),
          amount: 110 + between(0, 120),
          paidAmount: rnd() > 0.5 ? 110 + between(0, 120) : 0,
          status: rnd() > 0.5 ? 'PAID' : 'UNPAID',
          paymentMethod: rnd() > 0.5 ? 'MOMO' : 'CASH',
          issuedAt: d,
        },
      });
    }
  }

  // -------------------------------------------------------------- admissions
  await db.admission.create({ data: { patientId: patientIds[0]!, facilityId: korleBu.id, ward: 'Male Medical Ward', bed: 'M-12', reason: 'Severe malaria with dehydration', status: 'ADMITTED', admittedAt: daysAgo(1) } });
  await db.admission.create({ data: { patientId: patientIds[1]!, facilityId: korleBu.id, ward: 'Female Medical Ward', bed: 'F-04', reason: 'Diabetic ketoacidosis management', status: 'ADMITTED', admittedAt: daysAgo(1) } });
  await db.admission.create({ data: { patientId: patientIds[2]!, facilityId: korleBu.id, ward: 'Paediatric Ward', bed: 'P-09', reason: 'Severe anaemia — blood transfusion', status: 'ADMITTED', admittedAt: daysAgo(2) } });

  // ------------------------------------------------------------ immunization
  // Infant cohort with partial EPI histories across two facilities so the
  // due/overdue worklist, missed follow-up list and patient portal all have
  // coherent demo data. A MISSED-status row means the dose that followed it
  // (next in the schedule) was due but not received.
  const kbGeo = await db.facility.findUnique({ where: { id: korleBu.id }, select: { regionId: true, districtId: true } });
  const ridgeFac = facilityByCode['GH-KWRIDGE'];
  const ridgeGeo = ridgeFac ? await db.facility.findUnique({ where: { id: ridgeFac.id }, select: { regionId: true, districtId: true } }) : null;

  const BIRTH_DOSES = [
    { vaccine: 'BCG', dose: '0' },
    { vaccine: 'OPV', dose: '0' },
  ];
  const WEEK6_DOSES = [
    { vaccine: 'PENTA', dose: '1' },
    { vaccine: 'OPV', dose: '1' },
    { vaccine: 'PCV', dose: '1' },
    { vaccine: 'ROTA', dose: '1' },
  ];
  const WEEK10_DOSES = [
    { vaccine: 'PENTA', dose: '2' },
    { vaccine: 'OPV', dose: '2' },
    { vaccine: 'PCV', dose: '2' },
    { vaccine: 'ROTA', dose: '2' },
  ];
  const WEEK14_DOSES = [
    { vaccine: 'PENTA', dose: '3' },
    { vaccine: 'OPV', dose: '3' },
    { vaccine: 'PCV', dose: '3' },
    { vaccine: 'IPV', dose: '1' },
  ];

  const infantDefs = [
    // PENTA 1 overdue by ~3 days
    { name: 'Kwame Junior Appiah (synthetic infant)', sex: 'M', dobDaysAgo: 45, facilityId: korleBu.id, geo: kbGeo, groups: [{ daysAgo: 45, doses: BIRTH_DOSES }] },
    // PENTA 2 due in ~10 days (DUE_SOON)
    { name: 'Ama Serwaa Junior (synthetic infant)', sex: 'F', dobDaysAgo: 60, facilityId: korleBu.id, geo: kbGeo, groups: [{ daysAgo: 60, doses: BIRTH_DOSES }, { daysAgo: 18, doses: WEEK6_DOSES }] },
    // PENTA 2 overdue by ~30 days
    { name: 'Yaw Boateng Junior (synthetic infant)', sex: 'M', dobDaysAgo: 100, facilityId: korleBu.id, geo: kbGeo, groups: [{ daysAgo: 100, doses: BIRTH_DOSES }, { daysAgo: 55, doses: WEEK6_DOSES }] },
    // PENTA 2 documented missed (follow-up case) + OPV 2 overdue
    {
      name: 'Kofi Mensah Junior (synthetic infant)', sex: 'M', dobDaysAgo: 90, facilityId: korleBu.id, geo: kbGeo,
      groups: [{ daysAgo: 90, doses: BIRTH_DOSES }, { daysAgo: 45, doses: [{ vaccine: 'PENTA', dose: '1', status: 'MISSED' }, { vaccine: 'OPV', dose: '1' }, { vaccine: 'PCV', dose: '1' }, { vaccine: 'ROTA', dose: '1' }] }],
    },
    // Whole 10-week visit missed at Ridge Hospital (defaulter follow-up)
    {
      name: 'Efua Darko Junior (synthetic infant)', sex: 'F', dobDaysAgo: 130, facilityId: ridgeFac?.id ?? korleBu.id, geo: ridgeGeo ?? kbGeo,
      groups: [{ daysAgo: 130, doses: BIRTH_DOSES }, { daysAgo: 108, doses: WEEK6_DOSES.map((d) => ({ ...d, status: 'MISSED' })) }],
    },
    // Measles-rubella / yellow fever due in ~13 days (DUE_SOON)
    {
      name: 'Adjoa Owusu Junior (synthetic infant)', sex: 'F', dobDaysAgo: 260, facilityId: korleBu.id, geo: kbGeo,
      groups: [{ daysAgo: 260, doses: BIRTH_DOSES }, { daysAgo: 242, doses: WEEK6_DOSES }, { daysAgo: 214, doses: WEEK10_DOSES }, { daysAgo: 190, doses: WEEK14_DOSES }],
    },
  ];

  let immCount = 0;
  for (const inf of infantDefs) {
    const dob = daysAgo(inf.dobDaysAgo);
    const patient = await db.patient.create({
      data: {
        mrn: `GH-${String(mrnSeq++).padStart(6, '0')}`,
        fullName: inf.name,
        sex: inf.sex,
        dateOfBirth: dob,
        phone: `0${between(20, 55)}${String(between(1000000, 9999999)).padStart(7, '0')}`,
        districtId: inf.geo?.districtId ?? undefined,
        regionId: inf.geo?.regionId ?? undefined,
        facilityId: inf.facilityId,
        community: pick(COMMUNITIES),
        address: `Sample address, ${pick(COMMUNITIES)} (synthetic)`,
        isSynthetic: true,
        status: 'ACTIVE',
      },
    });
    for (const g of inf.groups) {
      for (const d of g.doses) {
        const givenAt = daysAgo(g.daysAgo);
        await db.immunization.create({
          data: {
            patientId: patient.id,
            facilityId: inf.facilityId,
            vaccine: d.vaccine,
            dose: d.dose,
            administeredAt: givenAt,
            nextDueAt: epiNextDueAt(dob, d.vaccine, d.dose, givenAt),
            batch: `B${between(1000, 9999)}`,
            vaccinatorId: userIdByEmail['nurse@demo.gh'],
            status: d.status ?? 'GIVEN',
          },
        });
        immCount++;
      }
    }
  }

  // Tetanus booster for the linked patient-portal demo account (TT 2 due soon).
  if (linkedPatient) {
    await db.immunization.create({
      data: {
        patientId: linkedPatient.id,
        facilityId: korleBu.id,
        vaccine: 'TT',
        dose: '1',
        administeredAt: daysAgo(10),
        nextDueAt: daysAgo(-18),
        batch: `B${between(1000, 9999)}`,
        vaccinatorId: userIdByEmail['nurse@demo.gh'],
        status: 'GIVEN',
      },
    });
    immCount++;
  }
  console.log(`  ✓ ${immCount} immunization records (infant cohort + adult tetanus)`);

  // ---------------------------------------------------------- disease case
  await db.diseaseCase.create({
    data: { patientId: patientIds[6]!, facilityId: korleBu.id, disease: 'Malaria', caseType: 'CONFIRMED', status: 'OPEN', reportedAt: daysAgo(1) },
  });

  // ------------------------------------------------------------------ queue
  const opdDep = deptO('outpatient');
  const pharmDep = deptO('pharmacy');
  const labDep = deptO('laboratory');
  const queueDefs: Array<{ dep: { id: string; name: string }; status: string; n: number; hourOffset: number }> = [
    { dep: opdDep, status: 'WAITING', n: 6, hourOffset: 1 },
    { dep: pharmDep, status: 'WAITING', n: 5, hourOffset: 2 },
    { dep: labDep, status: 'WAITING', n: 4, hourOffset: 3 },
  ];
  for (const qd of queueDefs) {
    const prefix = qd.dep.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    for (let i = 1; i <= qd.n; i++) {
      const t = new Date();
      t.setHours(8 + qd.hourOffset, i * 7, 0, 0);
      await db.queueEntry.create({
        data: {
          facilityId: korleBu.id,
          departmentId: qd.dep.id,
          patientId: pick(patientIds),
          ticket: `${prefix}-${String(i).padStart(3, '0')}`,
          status: qd.status as 'WAITING',
          createdAt: t,
        },
      });
    }
  }

  // ------------------------------------------------------------- stock
  const stockDefs: Array<Record<string, unknown>> = [
    { name: 'Paracetamol 500mg', category: 'MEDICINE', unit: 'tablet', quantity: 240, minStock: 50, reorderLevel: 80, batch: 'PRC-26A', expiryDate: new Date('2027-05-01'), location: 'Pharmacy A1' },
    { name: 'Artemether-Lumefantrine', category: 'MEDICINE', unit: 'tablet', quantity: 60, minStock: 30, reorderLevel: 40, batch: 'AL-26B', expiryDate: new Date('2026-11-01'), location: 'Pharmacy A1' },
    { name: 'Amoxicillin 500mg', category: 'MEDICINE', unit: 'capsule', quantity: 45, minStock: 50, reorderLevel: 70, batch: 'AMX-26C', expiryDate: new Date('2027-01-01'), location: 'Pharmacy A2' },
    { name: 'Metformin 500mg', category: 'MEDICINE', unit: 'tablet', quantity: 180, minStock: 40, reorderLevel: 60, batch: 'MTF-26D', expiryDate: new Date('2027-03-01'), location: 'Pharmacy A2' },
    { name: 'Amlodipine 5mg', category: 'MEDICINE', unit: 'tablet', quantity: 12, minStock: 40, reorderLevel: 50, batch: 'AML-26E', expiryDate: new Date('2026-09-01'), location: 'Pharmacy A2' },
    { name: 'ORS Sachets', category: 'MEDICINE', unit: 'sachet', quantity: 500, minStock: 100, reorderLevel: 150, batch: 'ORS-26F', expiryDate: new Date('2027-08-01'), location: 'Store B1' },
    { name: 'Ibuprofen 400mg', category: 'MEDICINE', unit: 'tablet', quantity: 300, minStock: 60, reorderLevel: 90, batch: 'IBU-26G', expiryDate: new Date('2027-02-01'), location: 'Pharmacy A1' },
    { name: 'Salbutamol Inhaler', category: 'MEDICINE', unit: 'unit', quantity: 25, minStock: 10, reorderLevel: 15, batch: 'SLB-26H', expiryDate: new Date('2026-12-01'), location: 'Pharmacy A3' },
    { name: 'Surgical Gloves (Box)', category: 'SUPPLY', unit: 'box', quantity: 80, minStock: 20, reorderLevel: 30, batch: 'GLV-26I', expiryDate: null, location: 'Store B2' },
    { name: 'Glucose Test Strips', category: 'REAGENT', unit: 'vial', quantity: 15, minStock: 25, reorderLevel: 30, batch: 'GTS-26J', expiryDate: new Date('2026-10-01'), location: 'Lab C1' },
    { name: 'Blood Collection Tubes', category: 'SUPPLY', unit: 'box', quantity: 120, minStock: 40, reorderLevel: 50, batch: 'BCT-26K', expiryDate: null, location: 'Lab C1' },
  ];
  for (const s of stockDefs) {
    const item = await db.stockItem.create({
      data: {
        facilityId: korleBu.id,
        name: s.name as string,
        category: s.category as string,
        unit: s.unit as string,
        quantity: s.quantity as number,
        minStock: s.minStock as number,
        maxStock: 500,
        reorderLevel: s.reorderLevel as number,
        batch: s.batch as string,
        expiryDate: s.expiryDate as Date | null,
        location: s.location as string,
        status: 'ACTIVE',
      },
    });
    await db.stockMovement.create({
      data: {
        stockItemId: item.id,
        facilityId: korleBu.id,
        type: 'RECEIPT',
        quantity: s.quantity as number,
        balanceAfter: s.quantity as number,
        note: 'Initial seed stock (synthetic)',
        performedById: userIdByEmail['pharmacist@demo.gh'],
      },
    });
  }
  console.log(`  ✓ ${stockDefs.length} stock items`);

  // ---------------------------------------------------------------- beds
  const wardDefs: Array<{ ward: string; beds: number; occupied: number[] }> = [
    { ward: 'Male Medical Ward', beds: 8, occupied: [1] },
    { ward: 'Female Medical Ward', beds: 8, occupied: [2] },
    { ward: 'Paediatric Ward', beds: 6, occupied: [3] },
    { ward: 'Maternity Ward', beds: 6, occupied: [] },
    { ward: 'ICU', beds: 4, occupied: [] },
  ];
  let bedIndex = 1;
  for (const w of wardDefs) {
    for (let i = 1; i <= w.beds; i++) {
      const occupied = w.occupied.includes(i);
      await db.bed.create({
        data: {
          facilityId: korleBu.id,
          ward: w.ward,
          bedNumber: `${w.ward.slice(0, 1)}-${String(i).padStart(2, '0')}`,
          status: occupied ? 'OCCUPIED' : 'AVAILABLE',
          patientId: occupied ? patientIds[(bedIndex - 1) % patientIds.length] : undefined,
          notes: occupied ? 'Synthetic occupied bed' : undefined,
        },
      });
      bedIndex++;
    }
  }
  console.log(`  ✓ ${bedIndex - 1} beds across ${wardDefs.length} wards`);

  // ------------------------------------------------------------- referrals
  const korleBuId = korleBu.id;
  const komfo = await db.facility.findUnique({ where: { code: 'GH-KATH' } });
  const ridge = await db.facility.findUnique({ where: { code: 'GH-KWRIDGE' } });
  await db.referral.create({
    data: {
      patientId: patientIds[4]!,
      fromFacilityId: korleBuId,
      toFacilityId: komfo?.id,
      toFacilityName: komfo?.name ?? 'Komfo Anokye Teaching Hospital (DEMO)',
      specialty: 'Cardiology',
      urgency: 'URGENT',
      summary: 'Synthetic referral: suspected rheumatic heart disease — cardiology review requested.',
      status: 'ACCEPTED',
      createdAt: daysAgo(2),
    },
  });
  await db.referral.create({
    data: {
      patientId: patientIds[6]!,
      fromFacilityId: korleBuId,
      toFacilityId: ridge?.id,
      toFacilityName: ridge?.name ?? 'Ridge Hospital (DEMO)',
      specialty: 'Neurology',
      urgency: 'ROUTINE',
      summary: 'Synthetic referral: chronic headaches — neurology assessment.',
      status: 'SUBMITTED',
      createdAt: daysAgo(1),
    },
  });
  await db.referral.create({
    data: {
      patientId: patientIds[9]!,
      fromFacilityId: korleBuId,
      toFacilityId: komfo?.id,
      toFacilityName: komfo?.name ?? 'Komfo Anokye Teaching Hospital (DEMO)',
      specialty: 'Orthopaedics',
      urgency: 'EMERGENCY',
      summary: 'Synthetic referral: open fracture — urgent orthopaedic review.',
      status: 'AWAITING_TRANSPORT',
      createdAt: daysAgo(0, 7),
    },
  });
  console.log('  ✓ 3 referrals');

  // -------------------------------------------------------------- ambulances
  const ambulanceDefs = [
    { registration: 'GV-4821-25', model: 'Mercedes Sprinter', status: 'AVAILABLE', driver: 'Sgt. Kofi Ansah', fuel: 82 },
    { registration: 'GV-1177-24', model: 'Toyota Hiace', status: 'AVAILABLE', driver: 'Sgt. Yaw Owusu', fuel: 65 },
    { registration: 'GV-9033-25', model: 'Ford Transit', status: 'MAINTENANCE', driver: 'Cpl. Kwame Boateng', fuel: 40 },
  ];
  for (const a of ambulanceDefs) {
    await db.ambulance.create({
      data: {
        facilityId: korleBu.id,
        registration: a.registration,
        model: a.model,
        type: 'AMBULANCE',
        status: a.status as string,
        driverName: a.driver,
        crewNames: JSON.stringify(['Emergency care assistant (synthetic)']),
        fuelLevel: a.fuel,
        odometerKm: between(12000, 98000),
        lastMaintenanceAt: daysAgo(between(5, 60)),
        nextMaintenanceAt: daysAgo(-between(10, 90)),
      },
    });
  }
  const amb1 = await db.ambulance.findFirst({ where: { facilityId: korleBu.id, registration: 'GV-4821-25' } });
  if (amb1) {
    await db.ambulanceTrip.create({
      data: {
        ambulanceId: amb1.id,
        patientId: patientIds[5],
        dispatchedById: userIdByEmail['ambulance@demo.gh'],
        emergencyType: 'TRAUMA',
        pickupLocation: 'Dansoman, Accra (synthetic)',
        destinationFacilityId: korleBu.id,
        notes: 'Synthetic trip: road traffic accident pickup.',
        status: 'AT_FACILITY',
        dispatchedAt: daysAgo(0, 7),
        arrivedAtScene: daysAgo(0, 8),
        departedSceneAt: daysAgo(0, 9),
        arrivedAtFacility: daysAgo(0, 10),
      },
    });
  }
  console.log(`  ✓ ${ambulanceDefs.length} ambulances + 1 trip`);

  // --------------------------------------------------------------- blood bank
  const donorDefs = [
    { name: 'Esi Owusu-Ansah (synthetic)', bloodGroup: 'O+', phone: '0244555666' },
    { name: 'Nana Kwaku Boateng (synthetic)', bloodGroup: 'A+', phone: '0244777888' },
    { name: 'Abena Darko (synthetic)', bloodGroup: 'B+', phone: '0204999000' },
    { name: 'Kofi Tetteh (synthetic)', bloodGroup: 'O-', phone: '0266777111' },
  ];
  const donorIds: string[] = [];
  for (const d of donorDefs) {
    const donor = await db.bloodDonor.create({
      data: { facilityId: korleBu.id, fullName: d.name, bloodGroup: d.bloodGroup, phone: d.phone, sex: d.name.startsWith('Esi') || d.name.startsWith('Abena') ? 'F' : 'M', status: 'ACTIVE', totalDonations: 1, lastDonationAt: daysAgo(between(10, 90)) },
    });
    donorIds.push(donor.id);
    await db.bloodDonation.create({
      data: { donorId: donor.id, facilityId: korleBu.id, bloodGroup: d.bloodGroup, volumeMl: 450, screeningResult: 'NEGATIVE', unitsCreated: 1, donatedAt: daysAgo(between(10, 90)) },
    });
  }
  // Inventory units from those donations.
  const donations = await db.bloodDonation.findMany({ orderBy: { donatedAt: 'asc' }, take: 8 });
  let unitSeq = 1;
  for (const donation of donations) {
    await db.bloodUnit.create({
      data: {
        donationId: donation.id,
        facilityId: korleBu.id,
        unitCode: `BL-${new Date().getFullYear()}-${String(unitSeq++).padStart(4, '0')}`,
        bloodGroup: donation.bloodGroup,
        component: 'WHOLE_BLOOD',
        status: 'AVAILABLE',
        expiryDate: new Date(Date.now() + 28 * 24 * 3600 * 1000),
        collectedAt: donation.donatedAt,
      },
    });
  }
  // One crossmatched unit + transfusion record.
  const unit = await db.bloodUnit.findFirst({ where: { facilityId: korleBu.id, status: 'AVAILABLE' } });
  if (unit) {
    await db.bloodUnit.update({ where: { id: unit.id }, data: { status: 'CROSSMATCHED', crossmatchPatientId: patientIds[2] } });
    await db.transfusionRecord.create({
      data: { unitId: unit.id, patientId: patientIds[2]!, facilityId: korleBu.id, crossmatchResult: 'COMPATIBLE', performedById: userIdByEmail['lab@demo.gh'], status: 'CROSSMATCHED' },
    });
  }
  console.log(`  ✓ ${donorDefs.length} donors, ${donations.length} units`);

  // --------------------------------------------------------------- theatre
  const surgeon = await db.user.findUnique({ where: { email: 'doctor@demo.gh' } });
  const theatreDefs = [
    { patientIdx: 3, procedure: 'Emergency appendicectomy', theatre: 'Theatre 1', urgency: 'URGENT', status: 'PRE_OP', consent: true },
    { patientIdx: 8, procedure: 'Caesarean section', theatre: 'Theatre 2', urgency: 'ROUTINE', status: 'SCHEDULED', consent: true },
    { patientIdx: 12, procedure: 'Open reduction internal fixation (femur)', theatre: 'Theatre 1', urgency: 'EMERGENCY', status: 'BOOKED', consent: false },
  ];
  for (const t of theatreDefs) {
    await db.surgicalBooking.create({
      data: {
        patientId: patientIds[t.patientIdx]!,
        facilityId: korleBu.id,
        procedure: t.procedure,
        theatre: t.theatre,
        surgeonId: surgeon?.id,
        anaesthetistId: surgeon?.id,
        urgency: t.urgency,
        status: t.status,
        scheduledFor: daysAgo(t.status === 'BOOKED' ? -1 : 0, between(9, 15)),
        consentObtained: t.consent,
        consentDate: t.consent ? daysAgo(1) : null,
        consentNote: t.consent ? 'Informed consent signed (synthetic)' : undefined,
        preOpAssessment: t.status === 'PRE_OP' ? 'ASA II — fit for surgery under GA (synthetic)' : undefined,
      },
    });
  }
  console.log(`  ✓ ${theatreDefs.length} surgical bookings`);

  // ----------------------------------------------------------------- devices
  await db.device.create({ data: { deviceId: 'demo-windows-reception-01', name: 'Reception PC (Demo)', platform: 'WINDOWS', facilityId: korleBu.id, status: 'ACTIVE', lastSeenAt: new Date() } });
  await db.device.create({ data: { deviceId: 'demo-android-chw-01', name: 'CHPS Field Device (Demo)', platform: 'ANDROID', facilityId: facilityByCode['GH-KWRIDGE']?.id, status: 'ACTIVE', lastSeenAt: new Date() } });

  // ------------------------------------------- facility applications (pending)
  const eastern = await db.region.findUnique({ where: { code: 'EA' } });
  const koforidua = await db.district.findFirst({ where: { name: 'New Juaben South Municipal' } });
  const western = await db.region.findUnique({ where: { code: 'WE' } });
  const sekondi = await db.district.findFirst({ where: { name: 'Sekondi-Takoradi Metropolitan' } });
  if (eastern && koforidua) {
    await db.facilityApplication.create({
      data: {
        name: 'New Town Community Clinic (Application)',
        type: 'CLINIC',
        ownership: 'PRIVATE',
        regionId: eastern.id,
        districtId: koforidua.id,
        address: '12 Hospital Road, New Town (synthetic)',
        telephone: '0342-000123',
        email: 'clinic-application@example.gh',
        contactName: 'Dr. Nana Yaw Asante (synthetic)',
        services: JSON.stringify(['OPD', 'MATERNITY', 'PHARMACY', 'LABORATORY']),
        reason: 'New private clinic serving the New Town community (DEMO).',
        status: 'PENDING',
      },
    });
  }
  if (western && sekondi) {
    await db.facilityApplication.create({
      data: {
        name: 'Harbour View Diagnostics Centre (Application)',
        type: 'DIAGNOSTIC_CENTRE',
        ownership: 'PRIVATE',
        regionId: western.id,
        districtId: sekondi.id,
        address: '3 Beach Road, Sekondi (synthetic)',
        telephone: '031-000456',
        email: 'diagnostics-application@example.gh',
        contactName: 'Mrs. Efua Blankson (synthetic)',
        services: JSON.stringify(['LABORATORY', 'IMAGING']),
        reason: 'Diagnostic imaging and laboratory services for the western corridor (DEMO).',
        status: 'PENDING',
      },
    });
  }

  console.log('✅ Seed complete — DEMO / SYNTHETIC DATA ONLY');
  console.log('   Demo logins (password: Demo@123):');
  console.log('   • admin@demo.gh      (National Admin)');
  console.log('   • regional@demo.gh   (Ashanti Regional Director)');
  console.log('   • hospital@demo.gh   (Korle-Bu Hospital Admin)');
  console.log('   • doctor@demo.gh     (Doctor)');
  console.log('   • nurse@demo.gh / pharmacist@demo.gh / lab@demo.gh / cashier@demo.gh');
  console.log('   • chw@demo.gh        (Community Health Worker)');
  console.log('   • patient@demo.gh    (Patient portal)');
}

function syntheticResult(test: string): string {
  switch (test) {
    case 'Full Blood Count':
      return `Hb ${(10 + rnd() * 6).toFixed(1)} g/dL, WBC ${(4 + rnd() * 8).toFixed(1)} x10^9/L, Platelets ${between(120, 420)} x10^9/L`;
    case 'Malaria RDT':
      return pick(['Negative', 'Positive (P.falciparum)']);
    case 'Random Blood Sugar':
      return `${(5 + rnd() * 12).toFixed(1)} mmol/L`;
    case 'Urine RDT (Pregnancy)':
      return pick(['Negative', 'Positive']);
    case 'Blood Group & Rh':
      return pick(['O+', 'A+', 'B+', 'AB+']);
    default:
      return 'Within normal limits (synthetic)';
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
