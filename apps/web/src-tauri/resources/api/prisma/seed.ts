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
import { unitsForAllFacilities } from './data/units.js';
import { equipmentForUnit } from './data/equipment.js';
import { UNIT_STAFF, FACILITY_STAFF } from './data/staff.js';
import { INSURANCE_SCHEMES, SEED_MEMBERSHIPS } from './data/insurance.js';
import { DRUGS } from './data/drugs.js';
import { DISEASES } from './data/diseases.js';
import { DRUG_DISEASE_LINKS } from './data/drugDiseaseLinks.js';
import { FACILITY_ASSETS } from './data/assets.js';
import { DAY_MS, nextScheduleItem, GHANA_EPI_SCHEDULE } from '../src/modules/immunization/schedule.js';

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
  await db.epiScheduleItem.deleteMany();
  await db.systemSetting.deleteMany();
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
  await db.equipmentMaintenance.deleteMany();
  await db.unitEquipment.deleteMany();
  await db.asset.deleteMany(); // assets reference facilities
  await db.nationalServiceStaff.deleteMany();
  await db.staff.deleteMany(); // staff reference units + facilities
  await db.bed.deleteMany(); // children first: beds → wards → units
  await db.ward.deleteMany();
  await db.hospitalUnit.deleteMany();
  await db.caseFollowUp.deleteMany(); // children first: follow-ups → disease cases
  await db.diseaseCase.deleteMany();
  await db.immunization.deleteMany();
  await db.invoice.deleteMany();
  await db.insuranceClaim.deleteMany(); // claims reference patients + schemes
  await db.patientInsurance.deleteMany();
  await db.insuranceScheme.deleteMany();
  await db.referral.deleteMany();
  await db.admission.deleteMany();
  await db.prescription.deleteMany();
  await db.labOrder.deleteMany();
  await db.diagnosis.deleteMany();
  await db.clinicalNote.deleteMany();
  await db.encounter.deleteMany();
  await db.queueSequence.deleteMany(); // ticket counters — re-baselined below
  await db.queueEntry.deleteMany();
  await db.appointment.deleteMany();
  await db.patientIdentifier.deleteMany();
  await db.patientContact.deleteMany();
  await db.patientSequence.deleteMany(); // MRN counter — re-baselined below
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
    all: ['view_patient', 'create_patient', 'edit_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'dispense', 'order_lab', 'verify_lab', 'order_imaging', 'verify_imaging', 'view_financial', 'process_payment', 'view_reports', 'export_data', 'manage_users', 'manage_facility', 'manage_region', 'manage_district', 'view_queue', 'manage_queue', 'view_appointments', 'book_appointment', 'view_dashboard', 'view_audit', 'manage_devices', 'manage_sync_conflicts', 'sync_data',    'view_surveillance', 'manage_surveillance', 'manage_stock', 'manage_patient_records', 'manage_ambulance', 'manage_blood_bank', 'manage_theatre', 'manage_system_settings', 'manage_epi_schedule', 'manage_integrations', 'manage_scheduled_reports'],
  };
  const roles: Record<string, string> = {
    // manage_roles_permissions is deliberately granted here (not via P.all):
    // NATIONAL_ADMIN + IT_ADMIN may edit roles; HOSPITAL_ADMIN may not.
    NATIONAL_ADMIN: JSON.stringify([...P.all, 'review_facility_applications', 'manage_roles_permissions']),
    REGIONAL_DIRECTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'view_reports', 'export_data', 'view_dashboard', 'view_queue', 'view_appointments', 'manage_region', 'view_audit', 'view_surveillance', 'manage_surveillance', 'review_facility_applications']),
    DISTRICT_DIRECTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'view_reports', 'export_data', 'view_dashboard', 'view_queue', 'view_appointments', 'manage_district', 'view_surveillance', 'manage_surveillance', 'review_facility_applications']),
    HOSPITAL_ADMIN: JSON.stringify([...P.all, 'manage_users', 'manage_facility', 'view_financial', 'view_audit', 'manage_devices']),
    MEDICAL_DIRECTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'order_lab', 'verify_lab', 'order_imaging', 'verify_imaging', 'view_reports', 'view_dashboard', 'view_appointments', 'view_queue', 'book_appointment']),
    DOCTOR: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'order_lab', 'order_imaging', 'view_appointments', 'book_appointment', 'view_queue', 'view_dashboard', 'view_reports', 'view_surveillance', 'manage_surveillance']),
    RADIOLOGIST: JSON.stringify(['view_patient', 'view_clinical_record', 'order_imaging', 'verify_imaging', 'view_queue', 'manage_queue', 'view_dashboard']),
    NURSE: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'view_appointments', 'view_queue', 'manage_queue', 'view_dashboard', 'dispense', 'manage_theatre', 'manage_ambulance', 'manage_blood_bank', 'view_surveillance', 'manage_surveillance']),
    AMBULANCE_OFFICER: JSON.stringify(['view_patient', 'manage_ambulance', 'view_queue', 'manage_queue', 'view_dashboard', 'view_appointments', 'write_clinical_note']),
    MIDWIFE: JSON.stringify(['view_patient', 'view_clinical_record', 'write_clinical_note', 'view_appointments', 'view_queue', 'manage_queue', 'view_dashboard', 'view_surveillance', 'manage_surveillance']),
    PHARMACIST: JSON.stringify(['view_patient', 'dispense', 'view_queue', 'manage_queue', 'view_dashboard', 'view_financial', 'manage_stock']),
    LAB_SCIENTIST: JSON.stringify(['view_patient', 'order_lab', 'verify_lab', 'view_queue', 'manage_queue', 'view_dashboard']),
    HEALTH_INFO_OFFICER: JSON.stringify(['view_patient', 'view_reports', 'export_data', 'view_dashboard', 'view_audit', 'view_surveillance', 'manage_surveillance', 'manage_integrations', 'manage_scheduled_reports']),
    ACCOUNTANT: JSON.stringify(['view_financial', 'view_reports', 'view_dashboard']),
    CASHIER: JSON.stringify(['view_financial', 'process_payment', 'view_queue', 'manage_queue', 'view_dashboard', 'view_patient']),
    IT_ADMIN: JSON.stringify(['manage_devices', 'manage_sync_conflicts', 'view_audit', 'sync_data', 'manage_users', 'view_dashboard', 'manage_system_settings', 'manage_epi_schedule', 'manage_roles_permissions', 'manage_integrations']),
    COMMUNITY_HEALTH_WORKER: JSON.stringify(['create_patient', 'view_patient', 'view_clinical_record', 'write_clinical_note', 'sync_data', 'view_queue', 'view_dashboard', 'view_surveillance', 'manage_surveillance', 'view_appointments', 'book_appointment']),
    PATIENT: JSON.stringify(['self_access']),
    // Developer mode (docs/25): the platform developer controls everything —
    // including admins and super-admins, the security system and licensing.
    DEVELOPER: JSON.stringify([...P.all, 'review_facility_applications', 'manage_roles_permissions', 'developer_mode']),
    LAB_TECHNICIAN: JSON.stringify(['order_lab', 'enter_lab_result']),
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
    RADIOLOGIST: 'FACILITY',
    HEALTH_INFO_OFFICER: 'FACILITY',
    ACCOUNTANT: 'FACILITY',
    CASHIER: 'FACILITY',
    IT_ADMIN: 'FACILITY',
    COMMUNITY_HEALTH_WORKER: 'FACILITY',
    PATIENT: 'PATIENT',
    DEVELOPER: 'DEVELOPER',
    LAB_TECHNICIAN: 'FACILITY',
  };
  const roleIds: Record<string, string> = {};
  for (const [code, perms] of Object.entries(roles)) {
    const r = await db.role.create({ data: { code, name: code.replace(/_/g, ' '), scope: roleScopes[code]!, permissions: perms } });
    roleIds[code] = r.id;
  }

  // ------------------------------------------------- editable EPI schedule
  // Seed the default schedule as DB rows so the admin UI can edit it in place
  // (docs/24). Editing a row overrides the built-in default; deleting rows is
  // how an operator reverts to code defaults.
  await db.epiScheduleItem.createMany({
    data: GHANA_EPI_SCHEDULE.map((s) => ({ vaccine: s.vaccine, dose: s.dose, label: s.label, description: s.description, ageDays: s.ageDays, intervalDays: s.intervalDays, active: true })),
  });
  console.log(`  ✓ ${GHANA_EPI_SCHEDULE.length} EPI schedule entries (editable)`);

  // ------------------------------------------------------------------ users
  const hash = await bcrypt.hash('Demo@123', 10);
  const asanteRegion = await db.region.findUnique({ where: { code: 'AS' } });
  const kumasiMetro = await db.district.findFirst({ where: { name: 'Kumasi Metropolitan' } });

  const users = [
    { email: 'developer@demo.gh', fullName: 'Platform Developer (Demo)', role: 'DEVELOPER' },
    { email: 'admin@demo.gh', fullName: 'National Admin (Demo)', role: 'NATIONAL_ADMIN' },
    { email: 'regional@demo.gh', fullName: 'Ashanti Regional Director (Demo)', role: 'REGIONAL_DIRECTOR', regionId: asanteRegion?.id ?? null, districtId: kumasiMetro?.id ?? null },
    { email: 'district@demo.gh', fullName: 'Kumasi Metropolitan District Director (Demo)', role: 'DISTRICT_DIRECTOR', regionId: asanteRegion?.id ?? null, districtId: kumasiMetro?.id ?? null },
    { email: 'hospital@demo.gh', fullName: 'Korle-Bu Hospital Admin (Demo)', role: 'HOSPITAL_ADMIN', facilityId: korleBu.id },
    { email: 'doctor@demo.gh', fullName: 'Dr. Kwabena Owusu (Demo)', role: 'DOCTOR', facilityId: korleBu.id },
    { email: 'nurse@demo.gh', fullName: 'Nurse Ama Serwaa (Demo)', role: 'NURSE', facilityId: korleBu.id },
    { email: 'pharmacist@demo.gh', fullName: 'Pharm. Kofi Mensah (Demo)', role: 'PHARMACIST', facilityId: korleBu.id },
    { email: 'lab@demo.gh', fullName: 'Lab. Scientist Efua Appiah (Demo)', role: 'LAB_SCIENTIST', facilityId: korleBu.id },
    { email: 'cashier@demo.gh', fullName: 'Cashier Adwoa Boateng (Demo)', role: 'CASHIER', facilityId: korleBu.id },
    { email: 'ambulance@demo.gh', fullName: 'Ambulance Officer Kojo Asante (Demo)', role: 'AMBULANCE_OFFICER', facilityId: korleBu.id },
    { email: 'chw@demo.gh', fullName: 'CHW Akua Frimpong (Demo)', role: 'COMMUNITY_HEALTH_WORKER', facilityId: facilityByCode['GH-KWRIDGE']?.id },
    // Private sector (hybrid platform): a private hospital with its own admin
    // and clinical staff — the same product serves both government and private
    // facilities, with the sector chosen at the login screen.
    { email: 'private-admin@demo.gh', fullName: 'Lister Private Hospital Admin (Demo)', role: 'HOSPITAL_ADMIN', facilityId: facilityByCode['GH-LISTER']?.id },
    { email: 'private-doctor@demo.gh', fullName: 'Dr. Efua Prempeh (Demo)', role: 'DOCTOR', facilityId: facilityByCode['GH-LISTER']?.id },
    { email: 'private-nurse@demo.gh', fullName: 'Nurse Abena Owusu (Demo)', role: 'NURSE', facilityId: facilityByCode['GH-LISTER']?.id },
    { email: 'private-pharmacist@demo.gh', fullName: 'Pharmacist Kwesi Mensah (Demo)', role: 'PHARMACIST', facilityId: facilityByCode['GH-LISTER']?.id },
    { email: 'private-lab@demo.gh', fullName: 'Lab Tech. Akua Boateng (Demo)', role: 'LAB_TECHNICIAN', facilityId: facilityByCode['GH-LISTER']?.id },
    { email: 'private-cashier@demo.gh', fullName: 'Cashier Yaa Asantewaa (Demo)', role: 'CASHIER', facilityId: facilityByCode['GH-LISTER']?.id },
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
  }  console.log(`  ✓ ${patientIds.length} synthetic patients`);



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

  // ------------------------------------------------------------ insurance
  // The national insurer registry + patient memberships + a claim pipeline
  // (submitted → approved → paid) so the insurance dashboard has coherent
  // demo data. Schemes are national master data; memberships and claims
  // are per-facility (Korle-Bu for the demo).
  const schemeIds: Record<string, string> = {};
  for (const s of INSURANCE_SCHEMES) {
    const scheme = await db.insuranceScheme.create({
      data: { code: s.code, name: s.name, type: s.type, phone: s.phone ?? null, email: s.email ?? null, notes: s.notes ?? null, status: 'ACTIVE', isSynthetic: true },
    });
    schemeIds[s.code] = scheme.id;
  }
  let membershipCount = 0;
  for (const m of SEED_MEMBERSHIPS) {
    const patientId = patientIds[m.patientIdx];
    const schemeId = schemeIds[m.schemeCode];
    if (!patientId || !schemeId) continue;
    const validYears = m.validYears ?? 2;
    await db.patientInsurance.create({
      data: {
        patientId,
        schemeId,
        membershipNumber: m.membershipNumber,
        relationship: m.relationship ?? 'SELF',
        validFrom: daysAgo(180),
        validTo: m.status === 'EXPIRED' ? daysAgo(30) : daysAgo(-validYears * 365),
        status: m.status ?? 'ACTIVE',
        verified: m.verified ?? false,
        verifiedAt: m.verified ? daysAgo(between(5, 60)) : null,
        verifiedById: userIdByEmail['cashier@demo.gh'],
        notes: 'Synthetic membership (DEMO DATA)',
        isSynthetic: true,
      },
    });
    membershipCount++;
  }
  // A deterministic claim pipeline across the enrolled cohort so every
  // dashboard bucket (submitted → approved/partial → paid, plus rejected)
  // is populated. Claims link to a recent invoice for the same patient when
  // one exists; otherwise they stand alone with their own line items.
  const activeMemberships = await db.patientInsurance.findMany({ where: { status: 'ACTIVE' }, select: { patientId: true, schemeId: true } });
  const membershipByPatient = new Map(activeMemberships.map((m) => [m.patientId, m.schemeId]));
  // All within the current month so the dashboard's "this month" buckets
  // are populated (claims older than ~30 days fall out of the window).
  const claimDefs: Array<{ patientIdx: number; status: string; daysAgo: number; items: Array<{ description: string; amount: number }>; note?: string }> = [
    { patientIdx: 0, status: 'SUBMITTED', daysAgo: 1, items: [{ description: 'Consultation', amount: 80 }, { description: 'Laboratory', amount: 45 }] },
    { patientIdx: 1, status: 'SUBMITTED', daysAgo: 3, items: [{ description: 'Consultation', amount: 80 }] },
    { patientIdx: 3, status: 'APPROVED', daysAgo: 5, items: [{ description: 'Consultation', amount: 80 }, { description: 'Pharmacy', amount: 62 }] },
    { patientIdx: 5, status: 'PARTIALLY_APPROVED', daysAgo: 6, items: [{ description: 'Laboratory', amount: 120 }], note: 'Line-item review — chemistry panel under negotiation.' },
    { patientIdx: 6, status: 'PAID', daysAgo: 2, items: [{ description: 'Consultation', amount: 80 }, { description: 'Imaging', amount: 240 }] },
    { patientIdx: 7, status: 'PAID', daysAgo: 4, items: [{ description: 'Consultation', amount: 80 }, { description: 'Pharmacy', amount: 54 }] },
    { patientIdx: 10, status: 'REJECTED', daysAgo: 7, items: [{ description: 'Consultation', amount: 80 }], note: 'Membership lapsed at service date — re-submit after renewal.' },
  ];
  let claimSeq = 1;
  let claimCount = 0;
  for (const cd of claimDefs) {
    const patientId = patientIds[cd.patientIdx];
    const schemeId = patientId ? membershipByPatient.get(patientId) : undefined;
    if (!patientId || !schemeId) continue;
    const invoice = await db.invoice.findFirst({ where: { patientId, facilityId: korleBu.id }, orderBy: { issuedAt: 'desc' } });
    const amount = cd.items.reduce((acc, it) => acc + it.amount, 0);
    const approvedAmount = cd.status === 'APPROVED' || cd.status === 'PAID' ? amount : cd.status === 'PARTIALLY_APPROVED' ? Math.round(amount * 0.7 * 100) / 100 : null;
    await db.insuranceClaim.create({
      data: {
        claimNumber: `CLM-${new Date().getFullYear()}-${String(claimSeq++).padStart(4, '0')}`,
        patientId,
        schemeId,
        facilityId: korleBu.id,
        invoiceId: invoice?.id ?? null,
        encounterId: invoice?.encounterId ?? null,
        serviceDate: daysAgo(cd.daysAgo),
        items: JSON.stringify(cd.items),
        amount,
        approvedAmount,
        status: cd.status,
        submittedById: userIdByEmail['cashier@demo.gh'],
        decidedById: cd.status === 'SUBMITTED' ? null : userIdByEmail['hospital@demo.gh'],
        decidedAt: cd.status === 'SUBMITTED' ? null : daysAgo(Math.max(0, cd.daysAgo - 2)),
        decisionNote: cd.status === 'SUBMITTED' ? null : (cd.note ?? 'Synthetic claim decision (DEMO DATA)'),
        isSynthetic: true,
        createdAt: daysAgo(cd.daysAgo),
      },
    });
    claimCount++;
  }
  console.log(`  ✓ ${INSURANCE_SCHEMES.length} insurance schemes · ${membershipCount} memberships · ${claimCount} claims`);

  // -------------------------------------------------------------- admissions
  // Full Ghana admission-form records (admission number, type, source, vitals,
  // consent, payment) so the admissions register is alive from first login.
  let admissionSeq = 1;
  const admissionDefs: Array<Record<string, unknown>> = [
    { patientIdx: 0, ward: 'Male Medical Ward', bed: 'M-12', type: 'EMERGENCY', source: 'EMERGENCY_DEPT', chiefComplaint: 'High fever, vomiting and weakness for 3 days', provisionalDiagnosis: 'Severe malaria with dehydration', reason: 'Severe malaria with dehydration', vitals: { temperature: 39.4, pulse: 104, respiratoryRate: 22, systolicBp: 100, diastolicBp: 65, spo2: 96, weightKg: 61, heightCm: 170 }, daysAgo: 1 },
    { patientIdx: 1, ward: 'Female Medical Ward', bed: 'F-04', type: 'EMERGENCY', source: 'HOME', chiefComplaint: 'Confusion and rapid breathing', provisionalDiagnosis: 'Diabetic ketoacidosis', reason: 'Diabetic ketoacidosis management', vitals: { temperature: 37.1, pulse: 118, respiratoryRate: 28, systolicBp: 95, diastolicBp: 60, spo2: 98, weightKg: 72, heightCm: 165 }, daysAgo: 1 },
    { patientIdx: 2, ward: 'Paediatric Ward', bed: 'P-09', type: 'OPD_TO_IPD', source: 'CLINIC', chiefComplaint: 'Pallor, fatigue and breathlessness on exertion', provisionalDiagnosis: 'Severe anaemia', reason: 'Severe anaemia — blood transfusion', vitals: { temperature: 36.9, pulse: 112, respiratoryRate: 24, systolicBp: 98, diastolicBp: 62, spo2: 97, weightKg: 18, heightCm: 118 }, daysAgo: 2, paymentMethod: 'NHIS' },
  ];
  for (const ad of admissionDefs) {
    const patientId = patientIds[ad.patientIdx as number];
    if (!patientId) continue;
    const admittedAt = daysAgo(ad.daysAgo as number);
    await db.admission.create({
      data: {
        patientId,
        facilityId: korleBu.id,
        admissionNumber: `ADM-${new Date().getFullYear()}-${String(admissionSeq++).padStart(4, '0')}`,
        admissionType: ad.type as string,
        source: ad.source as string,
        chiefComplaint: ad.chiefComplaint as string,
        provisionalDiagnosis: ad.provisionalDiagnosis as string,
        reason: ad.reason as string,
        ward: ad.ward as string,
        bed: ad.bed as string,
        admissionVitals: JSON.stringify(ad.vitals ?? {}),
        paymentMethod: (ad.paymentMethod as string | undefined) ?? null,
        consultantId: userIdByEmail['doctor@demo.gh'],
        attendingDoctorId: userIdByEmail['doctor@demo.gh'],
        nurseReceiving: 'Nurse Ama Serwaa',
        consentSigned: true,
        consentSignedAt: admittedAt,
        status: 'ADMITTED',
        admittedAt,
      },
    });
  }
  // One discharged admission so the register has history.
  await db.admission.create({
    data: {
      patientId: patientIds[3]!,
      facilityId: korleBu.id,
      admissionNumber: `ADM-${new Date().getFullYear()}-${String(admissionSeq++).padStart(4, '0')}`,
      admissionType: 'ELECTIVE',
      source: 'CLINIC',
      chiefComplaint: 'Planned hernia repair review',
      provisionalDiagnosis: 'Inguinal hernia',
      reason: 'Elective surgical admission',
      ward: 'Surgical Ward',
      bed: 'S-02',
      admissionVitals: JSON.stringify({ temperature: 36.6, pulse: 78, respiratoryRate: 16, systolicBp: 118, diastolicBp: 76, spo2: 99, weightKg: 84, heightCm: 178 }),
      consultantId: userIdByEmail['doctor@demo.gh'],
      attendingDoctorId: userIdByEmail['doctor@demo.gh'],
      consentSigned: true,
      consentSignedAt: daysAgo(8),
      status: 'DISCHARGED',
      admittedAt: daysAgo(7),
      dischargedAt: daysAgo(3),
      dischargeSummary: 'Uneventful recovery post-herniorrhaphy. Wound clean and dry; discharged on simple analgesia with a surgical review in 2 weeks. (DEMO DATA)',
    },
  });
  console.log('  ✓ admissions register (3 active + 1 discharged)');

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
  // Disease surveillance register (spec §36): the 24-hour-reportable and
  // weekly-reportable conditions public health teams track — a suspected
  // cholera cluster at Korle-Bu with contact-tracing follow-ups, measles,
  // AFP/polio surveillance, a yellow fever suspect and routine malaria.
  // Every status/caseType/outcome bucket is populated so the surveillance
  // dashboard is alive from the first demo login.
  const chwId = userIdByEmail['chw@demo.gh']!;
  const nurseId = userIdByEmail['nurse@demo.gh']!;
  const doctorId = userIdByEmail['doctor@demo.gh']!;
  const kathId = facilityByCode['GH-KATH']?.id;
  const garhId = facilityByCode['GH-GARH']?.id;
  const ridgeId = facilityByCode['GH-KWRIDGE']?.id;
  const caseDefs: Array<Record<string, unknown>> = [
    // Cholera cluster at Korle-Bu — the headline outbreak.
    { patientIdx: 6, facilityId: korleBu.id, disease: 'Cholera', caseType: 'CONFIRMED', severity: 'SEVERE', status: 'OPEN', reporterId: nurseId, reportedDaysAgo: 1, notes: 'Watery diarrhoea + vomiting; admitted to isolation bay. Stool culture: V. cholerae O1 Ogawa.' },
    { patientIdx: 11, facilityId: korleBu.id, disease: 'Cholera', caseType: 'SUSPECTED', severity: 'MODERATE', status: 'INVESTIGATED', reporterId: nurseId, reportedDaysAgo: 3, notes: 'Household contact of confirmed case — sample awaiting culture.' },
    { patientIdx: 17, facilityId: korleBu.id, disease: 'Cholera', caseType: 'CONFIRMED', severity: 'MODERATE', status: 'CLOSED', outcome: 'RECOVERED', reporterId: chwId, reportedDaysAgo: 12, notes: 'Rehydration + zinc completed; discharged after 2 negative stools.' },
    // AFP — the critical polio-surveillance indicator (reportable within 24 h).
    { patientIdx: 21, facilityId: korleBu.id, disease: 'Acute Flaccid Paralysis', caseType: 'SUSPECTED', severity: 'CRITICAL', status: 'OPEN', reporterId: doctorId, reportedDaysAgo: 0, notes: 'Sudden flaccid weakness in left leg, fever 2 days prior. Stool specimens ×2 within 14 days of onset.' },
    // Measles with an active follow-up.
    { patientIdx: 26, facilityId: korleBu.id, disease: 'Measles', caseType: 'SUSPECTED', severity: 'MODERATE', status: 'INVESTIGATED', reporterId: chwId, reportedDaysAgo: 4, notes: 'Maculopapular rash + fever + cough. Serology pending; unvaccinated child.' },
    // Yellow fever suspect at Ridge.
    { patientIdx: 30, facilityId: ridgeId, disease: 'Yellow Fever', caseType: 'SUSPECTED', severity: 'SEVERE', status: 'OPEN', reporterId: nurseId, reportedDaysAgo: 2, notes: 'Jaundice + fever + bleeding gums; vaccination history unknown.' },
    // Routine confirmed malaria (the most common weekly report).
    { patientIdx: 0, facilityId: korleBu.id, disease: 'Malaria', caseType: 'CONFIRMED', severity: 'MILD', status: 'CLOSED', outcome: 'RECOVERED', reporterId: doctorId, reportedDaysAgo: 6 },
    { patientIdx: 3, facilityId: kathId, disease: 'Malaria', caseType: 'CONFIRMED', severity: 'MODERATE', status: 'CLOSED', outcome: 'RECOVERED', reporterId: doctorId, reportedDaysAgo: 9 },
    { patientIdx: 5, facilityId: garhId, disease: 'Malaria', caseType: 'CONFIRMED', severity: 'SEVERE', status: 'INVESTIGATED', reporterId: doctorId, reportedDaysAgo: 1, notes: 'Severe anaemia + cerebral signs; on IV artesunate.' },
    // Maternal death — auditable outcome.
    { patientIdx: 33, facilityId: korleBu.id, disease: 'Maternal Death', caseType: 'CONFIRMED', severity: 'CRITICAL', status: 'CLOSED', outcome: 'DECEASED', reporterId: doctorId, reportedDaysAgo: 14, notes: 'Post-partum haemorrhage; maternal death audit opened.' },
  ];
  let caseCount = 0;
  let followUpCount = 0;
  for (const cd of caseDefs) {
    if (!cd.facilityId) {
      console.warn(`  ! skipping surveillance case ${cd.disease}: facility not found`);
      continue;
    }
    const patientId = patientIds[cd.patientIdx as number];
    if (!patientId) continue;
    const reportedAt = daysAgo(cd.reportedDaysAgo as number);
    const created = await db.diseaseCase.create({
      data: {
        patientId,
        facilityId: cd.facilityId as string,
        reporterId: (cd.reporterId as string | undefined) ?? null,
        disease: cd.disease as string,
        caseType: cd.caseType as string,
        severity: (cd.severity as string | undefined) ?? null,
        status: cd.status as string,
        outcome: (cd.outcome as string | undefined) ?? null,
        notes: (cd.notes as string | undefined) ?? null,
        reportedAt,
        createdAt: reportedAt,
        updatedAt: reportedAt,
        isSynthetic: true,
      },
    });
    caseCount++;
    // Contact-tracing follow-ups for the active outbreak cases.
    const followUps: Array<{ daysAgo: number; status: string; temperature: number | null; contactsTraced: number; notes: string }> = [];
    if (cd.disease === 'Cholera' && cd.status !== 'CLOSED') {
      followUps.push({ daysAgo: Math.max(0, (cd.reportedDaysAgo as number) - 1), status: 'STABLE', temperature: 37.1, contactsTraced: 6, notes: 'Household visited; 6 contacts listed for monitoring.' });
    }
    if (cd.disease === 'Measles') {
      followUps.push({ daysAgo: 2, status: 'IMPROVING', temperature: 38.2, contactsTraced: 4, notes: 'Rash fading; 4 unvaccinated contacts referred for catch-up.' });
    }
    if (cd.disease === 'Acute Flaccid Paralysis') {
      followUps.push({ daysAgo: 0, status: 'WORSENING', temperature: 38.9, contactsTraced: 2, notes: 'Weakness progressing to right leg; stool specimens collected.' });
    }
    for (const fu of followUps) {
      const at = daysAgo(fu.daysAgo);
      await db.caseFollowUp.create({
        data: { caseId: created.id, byId: nurseId, followUpAt: at, status: fu.status, temperature: fu.temperature, contactsTraced: fu.contactsTraced, notes: fu.notes, isSynthetic: true, createdAt: at },
      });
      followUpCount++;
    }
  }
  console.log(`  ✓ ${caseCount} disease cases · ${followUpCount} contact-tracing follow-ups`);

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

  // Queue ticket counters (schema: QueueSequence — atomic per-department
  // allocation; a load test caught the old count+1 allocator racing under
  // parallel check-ins). Baseline each seeded department at the HIGHEST ticket
  // the seed just wrote (the allocator increments before handing out, so the
  // first runtime check-in continues at OUT-007+ instead of colliding with
  // OUT-001…006). create-only: a live counter is never rewound.
  for (const qd of queueDefs) {
    await db.queueSequence.upsert({
      where: { departmentId: qd.dep.id },
      create: { departmentId: qd.dep.id, value: qd.n },
      update: {},
    });
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

  // ---------------------------------------------------------------- units
  // Department → Unit → Ward → Bed (hospital structure) for EVERY seeded
  // facility: the hand-written teaching/regional hospital trees plus the
  // class catalog (scaled by bed capacity) for all other facilities. Units
  // match departments by name; a missing department just leaves the unit
  // standalone. Created units feed the equipment pass below.
  const facilityTypeByCode: Record<string, string> = Object.fromEntries(DEMO_FACILITIES.map((f) => [f.code, f.type]));
  const createdUnitRows: Array<{ id: string; facilityId: string; code: string; facilityCode: string; type: string }> = [];
  let unitCount = 0;
  let wardCount = 0;
  let unitBedCount = 0;
  for (const fu of unitsForAllFacilities(DEMO_FACILITIES.map((f) => ({ code: f.code, type: f.type, bedCapacity: f.bedCapacity, name: f.name })))) {
    const facility = facilityByCode[fu.facilityCode];
    if (!facility) {
      console.warn(`  ! skipping units for ${fu.facilityCode}: facility not found`);
      continue;
    }
    for (const u of fu.units) {
      const department = facility.departments.find((d) => d.name === u.department);
      const unit = await db.hospitalUnit.create({
        data: {
          facilityId: facility.id,
          departmentId: department?.id ?? null,
          code: u.code,
          name: u.name,
          type: u.type,
          headName: u.headName ?? null,
          headTitle: u.headTitle ?? null,
          phone: u.phone ?? null,
          location: u.location ?? null,
          bedCapacity: u.bedCapacity ?? null,
          services: JSON.stringify(u.services ?? []),
          status: 'ACTIVE',
        },
      });
      unitCount++;
      createdUnitRows.push({ id: unit.id, facilityId: facility.id, code: u.code, facilityCode: fu.facilityCode, type: facilityTypeByCode[fu.facilityCode] ?? 'PRIVATE_HOSPITAL' });
      for (const w of u.wards) {
        const ward = await db.ward.create({ data: { unitId: unit.id, name: w.name, bedCapacity: w.beds, status: 'ACTIVE' } });
        wardCount++;
        for (let i = 1; i <= w.beds; i++) {
          const occupied = (w.occupied ?? []).includes(i);
          await db.bed.create({
            data: {
              facilityId: facility.id,
              unitId: unit.id,
              wardId: ward.id,
              ward: w.name,
              bedNumber: `${w.bedPrefix}${String(i).padStart(2, '0')}`,
              status: occupied ? 'OCCUPIED' : 'AVAILABLE',
              patientId: occupied ? patientIds[(unitBedCount + i) % patientIds.length] : undefined,
              notes: occupied ? 'Synthetic occupied bed' : undefined,
            },
          });
          unitBedCount++;
        }
      }
    }
    console.log(`  ✓ units for ${fu.facilityCode}: ${fu.units.length} units`);
  }
  console.log(`  ✓ ${unitCount} units · ${wardCount} wards · ${unitBedCount} beds across ${createdUnitRows.length} units`);

  // -------------------------------------------------------- equipment
  // Every unit's tools & equipment (ventilators, monitors, lab analysers…)
  // from the canonical kit for its unit type, scaled by facility class,
  // with functional / in-maintenance / faulty counts and maintenance
  // scheduling.
  let equipmentCount = 0;
  let maintenanceLogCount = 0;
  for (const unit of createdUnitRows) {
    const kit = equipmentForUnit(unit.code, unit.type);
    if (kit.length === 0) continue;
    for (const e of kit) {
      const functional = e.functional ?? e.quantity - (e.inMaintenance ?? 0) - (e.faulty ?? 0);
      const inMaintenance = e.inMaintenance ?? 0;
      const faulty = e.faulty ?? 0;
      const nextMaintenanceAt = e.nextMaintenanceInDays === undefined ? null : daysAgo(-e.nextMaintenanceInDays, 10);
      const equipment = await db.unitEquipment.create({
        data: {
          unitId: unit.id,
          facilityId: unit.facilityId,
          name: e.name,
          category: e.category,
          quantity: e.quantity,
          functional: Math.max(0, Math.min(e.quantity, functional)),
          inMaintenance: Math.max(0, Math.min(e.quantity, inMaintenance)),
          faulty: Math.max(0, Math.min(e.quantity, faulty)),
          manufacturer: e.manufacturer ?? null,
          model: e.model ?? null,
          serialNumber: `SYN-${unit.facilityCode.replace('GH-', '')}-${unit.code}-${String(equipmentCount + 1).padStart(3, '0')}`,
          purchaseDate: daysAgo(between(180, 2200)),
          lastMaintenanceAt: nextMaintenanceAt ? new Date(nextMaintenanceAt.getTime() - between(30, 120) * DAY_MS) : null,
          nextMaintenanceAt,
          notes: 'Synthetic equipment record (DEMO DATA)',
        },
      });
      // A few records have a maintenance history so the log view is populated.
      if (inMaintenance > 0) {
        await db.equipmentMaintenance.create({
          data: { equipmentId: equipment.id, performedById: null, performedAt: daysAgo(between(2, 14)), note: 'Synthetic scheduled maintenance (DEMO DATA)' },
        });
        maintenanceLogCount++;
      }
      equipmentCount++;
    }
  }
  console.log(`  ✓ ${equipmentCount} equipment records · ${maintenanceLogCount} maintenance log entries`);

  // Unit lookup keyed by facility id + unit code — used by the staff and
  // national-service seeds below (built from the units just created).
  const unitByKey = new Map(createdUnitRows.map((u) => [`${u.facilityId}:${u.code}`, u]));

  // ------------------------------------------------------------- staff
  // The hospital workforce — per-unit teams plus hospital-level roles
  // (records, finance, HIO, security, portering…). Staff numbers are
  // sequential per facility ("KBTH-0001"…). Seeded head rows mirror the
  // unit headName/headTitle so the roster agrees with the unit's free-text
  // in-charge field.
  const staffSeqByFacility = new Map<string, number>();
  let staffCount = 0;
  for (const su of UNIT_STAFF) {
    const facility = facilityByCode[su.facilityCode];
    if (!facility) {
      console.warn(`  ! skipping staff for ${su.facilityCode}: facility not found`);
      continue;
    }
    const unit = unitByKey.get(`${facility.id}:${su.unitCode}`);
    if (!unit) {
      console.warn(`  ! skipping staff for ${su.facilityCode}:${su.unitCode} — unit not found`);
      continue;
    }
    let seq = staffSeqByFacility.get(facility.id) ?? 0;
    for (const s of su.staff) {
      seq++;
      await db.staff.create({
        data: {
          facilityId: facility.id,
          unitId: unit.id,
          staffNumber: `${su.facilityCode.replace('GH-', '')}-${String(seq).padStart(4, '0')}`,
          fullName: s.fullName,
          role: s.role,
          speciality: s.speciality,
          licenseNumber: s.licenseNumber,
          phone: s.phone,
          email: s.email,
          employmentStatus: s.employmentStatus ?? 'ACTIVE',
          headOfUnit: s.headOfUnit ?? false,
          joinedAt: daysAgo(between(30, 2400)),
          notes: 'Synthetic staff record (DEMO DATA)',
          isSynthetic: true,
        },
      });
      staffCount++;
    }
    staffSeqByFacility.set(facility.id, seq);
  }
  for (const fs of FACILITY_STAFF) {
    const facility = facilityByCode[fs.facilityCode];
    if (!facility) {
      console.warn(`  ! skipping facility staff for ${fs.facilityCode}: facility not found`);
      continue;
    }
    let seq = staffSeqByFacility.get(facility.id) ?? 0;
    for (const s of fs.staff) {
      seq++;
      await db.staff.create({
        data: {
          facilityId: facility.id,
          unitId: null,
          staffNumber: `${fs.facilityCode.replace('GH-', '')}-${String(seq).padStart(4, '0')}`,
          fullName: s.fullName,
          role: s.role,
          speciality: s.speciality,
          licenseNumber: s.licenseNumber,
          phone: s.phone,
          email: s.email,
          employmentStatus: s.employmentStatus ?? 'ACTIVE',
          headOfUnit: false,
          joinedAt: daysAgo(between(30, 2400)),
          notes: 'Synthetic staff record (DEMO DATA)',
          isSynthetic: true,
        },
      });
      staffCount++;
    }
    staffSeqByFacility.set(facility.id, seq);
  }
  console.log(`  ✓ ${staffCount} staff records (per-unit teams + hospital-level roles)`);

  // -------------------------------------------------- national service
  // Ghana National Service Scheme graduates posted to the demo facilities
  // for their service year (docs: NSS register). A handful across the
  // government and private sites so the register has real depth.
  const NSS_POSTINGS: Array<{ facilityCode: string; unitCode?: string; fullName: string; institution: string; programme: string; placement: string; supervisor: string; status?: string; monthsAgo?: number; endMonthsAhead?: number }> = [
    { facilityCode: 'GH-KBTH', unitCode: 'NICU', fullName: 'Abena Owusu-Ansah', institution: 'University of Ghana', programme: 'BSc Nursing', placement: 'Paediatric ward support', supervisor: 'Nurse Ama Serwaa', monthsAgo: 8, endMonthsAhead: 4 },
    { facilityCode: 'GH-KBTH', unitCode: 'PHARM-OPD', fullName: 'Kwame Adjei Boateng', institution: 'KNUST', programme: 'PharmD', placement: 'Dispensary rotation', supervisor: 'Pharm. Kofi Mensah', monthsAgo: 2, endMonthsAhead: 10 },
    { facilityCode: 'GH-KATH', unitCode: 'GEN-MED', fullName: 'Efua Serwaa Amoah', institution: 'University of Cape Coast', programme: 'BSc Medical Laboratory Science', placement: 'Clinical lab support', supervisor: 'Lab. Scientist Efua Appiah', monthsAgo: 6, endMonthsAhead: 6 },
    { facilityCode: 'GH-GARH', fullName: 'Yaw Frimpong Darko', institution: 'GIMPA', programme: 'BA Accounting', placement: 'Finance office support', supervisor: 'Accountant', monthsAgo: 4, endMonthsAhead: 8 },
    { facilityCode: 'GH-LISTER', fullName: 'Akosua Konadu', institution: 'University of Ghana', programme: 'BSc Nursing', placement: 'Maternity support', supervisor: 'Nurse Abena Owusu', monthsAgo: 10, endMonthsAhead: 2 },
    { facilityCode: 'GH-TTH', fullName: 'Mohammed Alhassan', institution: 'University for Development Studies', programme: 'BSc Health Administration', placement: 'Records & admissions', supervisor: 'Records Officer', monthsAgo: 1, endMonthsAhead: 11 },
    { facilityCode: 'GH-CCTH', fullName: 'Maame Esi Essel', institution: 'University of Ghana', programme: 'BSc Radiography', placement: 'Radiology rotation', supervisor: 'Radiographer', monthsAgo: 7, endMonthsAhead: 5, status: 'ACTIVE' },
  ];
  let nssCount = 0;
  for (const n of NSS_POSTINGS) {
    const facility = facilityByCode[n.facilityCode];
    if (!facility) {
      console.warn(`  ! skipping NSS posting for ${n.facilityCode}: facility not found`);
      continue;
    }
    const unit = n.unitCode ? unitByKey.get(`${facility.id}:${n.unitCode}`) : undefined;
    if (n.unitCode && !unit) {
      console.warn(`  ! NSS posting for ${n.fullName}: unit ${n.unitCode} not found at ${n.facilityCode} — posting without a unit`);
    }
    const start = daysAgo((n.monthsAgo ?? 3) * 30);
    const end = new Date(start.getTime() + ((n.monthsAgo ?? 3) + (n.endMonthsAhead ?? 9)) * 30 * DAY_MS);
    await db.nationalServiceStaff.create({
      data: {
        facilityId: facility.id,
        unitId: unit?.id ?? null,
        nssNumber: `NSS-${start.getFullYear()}-${String(nssCount + 1).padStart(4, '0')}`,
        fullName: n.fullName,
        institution: n.institution,
        programme: n.programme,
        placement: n.placement,
        supervisor: n.supervisor,
        startDate: start,
        endDate: end,
        status: n.status ?? 'ACTIVE',
        notes: 'Synthetic national service posting (DEMO DATA)',
        isSynthetic: true,
      },
    });
    nssCount++;
  }
  console.log(`  ✓ ${nssCount} national service postings`);

  // -------------------------------------------------------------- assets
  // The fixed-asset register — facility-level assets (buildings, vehicles,
  // IT, plant, furniture) with purchase facts. Book value and depreciation
  // are DERIVED by the assets API at read time, so the seed only records
  // acquisition cost, life and salvage.
  let assetCount = 0;
  for (const fa of FACILITY_ASSETS) {
    const facility = facilityByCode[fa.facilityCode];
    if (!facility) {
      console.warn(`  ! skipping assets for ${fa.facilityCode}: facility not found`);
      continue;
    }
    let seq = 1;
    for (const a of fa.assets) {
      seq++;
      await db.asset.create({
        data: {
          facilityId: facility.id,
          assetNumber: `${fa.facilityCode.replace('GH-', '')}-${String(seq).padStart(4, '0')}`,
          name: a.name,
          category: a.category,
          description: a.description ?? null,
          serialNumber: a.manufacturer && a.model ? `SYN-${fa.facilityCode.replace('GH-', '')}-${a.category.slice(0, 3)}-${String(seq)}` : null,
          manufacturer: a.manufacturer ?? null,
          model: a.model ?? null,
          acquisitionDate: daysAgo(a.acquiredDaysAgo),
          purchaseCost: a.purchaseCost,
          salvageValue: a.salvageValue ?? 0,
          usefulLifeYears: a.usefulLifeYears,
          location: a.location ?? null,
          custodianName: a.custodian ?? null,
          status: a.status ?? 'ACTIVE',
          disposedAt: a.status === 'DISPOSED' ? daysAgo(between(30, 400)) : null,
          disposalNote: a.disposalNote ?? null,
          notes: a.notes ?? null,
          isSynthetic: true,
        },
      });
      assetCount++;
    }
    console.log(`  ✓ assets for ${fa.facilityCode}: ${fa.assets.length} assets`);
  }
  console.log(`  ✓ ${assetCount} fixed assets (buildings, vehicles, IT, plant, furniture)`);

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
  await db.device.create({ data: { deviceId: 'demo-windows-reception-01', name: 'Reception PC (Demo)', platform: 'WINDOWS', facilityId: korleBu.id, status: 'ACTIVE', enrolledAt: new Date(), lastSeenAt: new Date() } });
  await db.device.create({ data: { deviceId: 'demo-android-chw-01', name: 'CHPS Field Device (Demo)', platform: 'ANDROID', facilityId: facilityByCode['GH-KWRIDGE']?.id, status: 'ACTIVE', enrolledAt: new Date(), lastSeenAt: new Date() } });
  // A device that self-registered but has not been approved yet — demonstrates
  // the enrollment queue (docs/21 §1): it cannot sync until an admin approves it.
  await db.device.create({ data: { deviceId: 'demo-windows-records-02', name: 'Records PC 2 (Demo, pending approval)', platform: 'WINDOWS', facilityId: korleBu.id, status: 'PENDING', lastSeenAt: new Date() } });
  // The Playwright E2E journey bills through /sync/mutations with this device id.
  await db.device.create({ data: { deviceId: 'e2e-billing', name: 'E2E billing device (synthetic)', platform: 'PWA', facilityId: korleBu.id, status: 'ACTIVE', enrolledAt: new Date() } });

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

  // MRN counter baseline (schema: PatientSequence — atomic allocation; a load
  // test caught the old count-based allocator racing under parallel creates).
  // Must run AFTER every patient-creating section so the baseline sits past
  // the highest seeded MRN. create-only: a live counter is never rewound.
  const maxMrn = await db.patient.findFirst({ orderBy: { mrn: 'desc' }, select: { mrn: true } });
  const highMrn = maxMrn ? parseInt(maxMrn.mrn.replace(/^GH-0*/, ''), 10) || 0 : 0;
  await db.patientSequence.upsert({
    where: { key: 'patient' },
    create: { key: 'patient', value: Math.max(highMrn + 1, 1) },
    update: {},
  });

  console.log('✅ Seed complete — DEMO / SYNTHETIC DATA ONLY');
  console.log('   Demo logins (password: Demo@123):');
  console.log('   • developer@demo.gh  (Platform Developer — full control, docs/25)');
  console.log('   • admin@demo.gh      (National Admin)');
  console.log('   • regional@demo.gh   (Ashanti Regional Director)');
  console.log('   • district@demo.gh   (Kumasi Metropolitan District Director)');
  console.log('   • hospital@demo.gh   (Korle-Bu Hospital Admin — government)');
  console.log('   • private-admin@demo.gh (Lister Private Hospital Admin — private)');
  console.log('   • private-doctor@demo.gh (Lister Private Hospital Doctor — private)');
  console.log('   • private-nurse@demo.gh (Lister Private Hospital Nurse — private)');
  console.log('   • private-pharmacist@demo.gh (Lister Private Hospital Pharmacist — private)');
  console.log('   • private-lab@demo.gh (Lister Private Hospital Lab Tech — private)');
  console.log('   • private-cashier@demo.gh (Lister Private Hospital Cashier — private)');
  console.log('   • doctor@demo.gh     (Doctor)');
  console.log('   • nurse@demo.gh / pharmacist@demo.gh / lab@demo.gh / cashier@demo.gh');
  console.log('   • chw@demo.gh        (Community Health Worker)');
  console.log('   • patient@demo.gh    (Patient portal)');

  // =================================================================
  // Drug & Disease Reference Database
  // =================================================================
  console.log('💊 Seeding drug reference database…');
  await db.drugDiseaseLink.deleteMany();
  await db.drug.deleteMany();
  await db.disease.deleteMany();

  // Seed drugs
  const drugIdMap = new Map<string, string>();
  for (const d of DRUGS) {
    const created = await db.drug.create({ data: d });
    drugIdMap.set(d.name, created.id);
  }
  console.log(`  ✅ ${DRUGS.length} drugs seeded`);

  // Seed diseases
  const diseaseIdMap = new Map<string, string>();
  for (const d of DISEASES) {
    const created = await db.disease.create({ data: d });
    diseaseIdMap.set(d.name, created.id);
  }
  console.log(`  ✅ ${DISEASES.length} diseases seeded`);

  // Seed drug-disease links (skip duplicates via upsert)
  let linksCreated = 0;
  let linksSkipped = 0;
  for (const link of DRUG_DISEASE_LINKS) {
    const drugId = drugIdMap.get(link.drugName);
    const diseaseId = diseaseIdMap.get(link.diseaseName);
    if (drugId && diseaseId) {
      try {
        await db.drugDiseaseLink.create({
          data: { drugId, diseaseId, efficacy: link.efficacy, dosageNote: link.dosageNote, notes: link.notes },
        });
        linksCreated++;
      } catch (e: any) {
        if (e?.code === 'P2002') linksSkipped++;
        else throw e;
      }
    }
  }
  console.log(`  ✅ ${linksCreated} drug-disease links seeded (${linksSkipped} duplicates skipped)`);
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
