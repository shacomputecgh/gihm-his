// =====================================================================
// GIHM-HIS — Synthetic hospital staff seed (Department → Unit → Staff)
// ---------------------------------------------------------------------
// DEMO / SYNTHETIC DATA. Every name, licence number, extension and email
// below is a fictional placeholder for development/demonstration only —
// they are NOT official GHS/MoH staff records.
//
// Staff are keyed by facility code + unit code (UNIT_STAFF) or facility
// code alone (FACILITY_STAFF, for hospital-level roles that have no unit:
// records, finance, HIO, security, portering…). The unit head rows reuse
// the exact headName/headTitle seeded for the matching HospitalUnit so the
// unit's structured roster agrees with its free-text in-charge field.
// =====================================================================

export interface SeedStaffDef {
  fullName: string;
  role: string; // must be one of the API STAFF_ROLES
  speciality?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  headOfUnit?: boolean;
  employmentStatus?: string; // default ACTIVE
  joinedYearsAgo?: number; // default 0-6 (deterministic)
}

export interface SeedUnitStaff {
  facilityCode: string;
  unitCode: string;
  staff: SeedStaffDef[];
}

export interface SeedFacilityStaff {
  facilityCode: string;
  staff: SeedStaffDef[];
}

export const UNIT_STAFF: SeedUnitStaff[] = [
  // ============================================================ Korle-Bu
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'OPD',
    staff: [
      { fullName: 'Dr. Kofi Asante (synthetic)', role: 'CONSULTANT', speciality: 'General Medicine', licenseNumber: 'GMC-10124 (synthetic)', phone: '0244 000 101', email: 'kofi.asante@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Efua Oforiwa (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'General Medicine', licenseNumber: 'GMC-20213 (synthetic)', email: 'efua.oforiwa@kbth.gh' },
      { fullName: 'Dr. Kwame Ansong (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'General Medicine', licenseNumber: 'GMC-20245 (synthetic)', email: 'kwame.ansong@kbth.gh' },
      { fullName: 'Sr. Ama Boatemaa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14501 (synthetic)', email: 'ama.boatemaa@kbth.gh' },
      { fullName: 'Sr. Akosua Agyekum (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14502 (synthetic)' },
      { fullName: 'Mr. Kofi Owusu-Ansah (synthetic)', role: 'RECORDS_OFFICER', email: 'records.opd@kbth.gh' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'ER',
    staff: [
      { fullName: 'Dr. Efua Mensah (synthetic)', role: 'CONSULTANT', speciality: 'Emergency Medicine', licenseNumber: 'GMC-10221 (synthetic)', phone: '0244 000 102', email: 'efua.mensah@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Kojo Agyapong (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Emergency Medicine', licenseNumber: 'GMC-20301 (synthetic)' },
      { fullName: 'Dr. Ama Adu-Boakye (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Emergency Medicine', licenseNumber: 'GMC-20302 (synthetic)' },
      { fullName: 'Sr. Grace Tetteh (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14601 (synthetic)' },
      { fullName: 'Sr. Abena Osei-Bonsu (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14602 (synthetic)' },
      { fullName: 'Sr. Yaa Amankwah (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14603 (synthetic)' },
      { fullName: 'Mr. Daniel Mensah (synthetic)', role: 'PORTER' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'ICU',
    staff: [
      { fullName: 'Dr. Abena Owusu (synthetic)', role: 'CONSULTANT', speciality: 'Intensive Care', licenseNumber: 'GMC-10311 (synthetic)', phone: '0244 000 103', email: 'abena.owusu@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Kwasi Boateng (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Intensive Care', licenseNumber: 'GMC-20412 (synthetic)' },
      { fullName: 'Sr. Efua Asamoah (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-14701 (synthetic)' },
      { fullName: 'Sr. Nana Yaa Owusu (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-14702 (synthetic)' },
      { fullName: 'Sr. Akosua Darko (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-14703 (synthetic)' },
      { fullName: 'Sr. Adwoa Sarpong (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-14704 (synthetic)' },
      { fullName: 'Sr. Efua Kwarteng (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-14705 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'NICU',
    staff: [
      { fullName: 'Dr. Yaw Boateng (synthetic)', role: 'CONSULTANT', speciality: 'Neonatology', licenseNumber: 'GMC-10401 (synthetic)', phone: '0244 000 104', email: 'yaw.boateng@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Esi Asante (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Neonatology', licenseNumber: 'GMC-20511 (synthetic)' },
      { fullName: 'Sr. Ama Gyamfua (synthetic)', role: 'NURSE', speciality: 'Neonatal Nursing', licenseNumber: 'NMC-88-14801 (synthetic)' },
      { fullName: 'Sr. Abena Owusuwaa (synthetic)', role: 'NURSE', speciality: 'Neonatal Nursing', licenseNumber: 'NMC-88-14802 (synthetic)' },
      { fullName: 'Sr. Akua Mensimah (synthetic)', role: 'NURSE', speciality: 'Neonatal Nursing', licenseNumber: 'NMC-88-14803 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'PAED-MED',
    staff: [
      { fullName: 'Dr. Ama Darko (synthetic)', role: 'CONSULTANT', speciality: 'Paediatrics', licenseNumber: 'GMC-10500 (synthetic)', phone: '0244 000 105', email: 'ama.darko@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Kweku Adjei (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Paediatrics', licenseNumber: 'GMC-20601 (synthetic)' },
      { fullName: 'Sr. Akosua Frimpomaa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14901 (synthetic)' },
      { fullName: 'Sr. Afia Opoku (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14902 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'PAED-SURG',
    staff: [
      { fullName: 'Dr. Kwame Frimpong (synthetic)', role: 'CONSULTANT', speciality: 'Paediatric Surgery', licenseNumber: 'GMC-10540 (synthetic)', phone: '0244 000 106', email: 'kwame.frimpong@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Yaw Asubonteng (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Paediatric Surgery', licenseNumber: 'GMC-20701 (synthetic)' },
      { fullName: 'Sr. Esi Boatema (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-14910 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'GEN-MED',
    staff: [
      { fullName: 'Dr. Adjoa Nkrumah (synthetic)', role: 'CONSULTANT', speciality: 'General Medicine', licenseNumber: 'GMC-10087 (synthetic)', phone: '0244 000 107', email: 'adjoa.nkrumah@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Kwabena Osei-Asare (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'General Medicine', licenseNumber: 'GMC-20801 (synthetic)' },
      { fullName: 'Dr. Akosua Danso (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'General Medicine', licenseNumber: 'GMC-20802 (synthetic)' },
      { fullName: 'Sr. Serwaa Antwi (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15001 (synthetic)' },
      { fullName: 'Sr. Korkor Ntow (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15002 (synthetic)' },
      { fullName: 'Sr. Efua Asantewaa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15003 (synthetic)' },
      { fullName: 'Sr. Abena Konadu (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15004 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'CARDIO',
    staff: [
      { fullName: 'Dr. Kwasi Appiah (synthetic)', role: 'CONSULTANT', speciality: 'Cardiology', licenseNumber: 'GMC-10102 (synthetic)', phone: '0244 000 108', email: 'kwasi.appiah@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Efua Boakyewaa (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Cardiology', licenseNumber: 'GMC-20901 (synthetic)' },
      { fullName: 'Sr. Yaa Asantewa (synthetic)', role: 'NURSE', speciality: 'Cardiac Nursing', licenseNumber: 'NMC-88-15101 (synthetic)' },
      { fullName: 'Sr. Ama Owusu-Ansah (synthetic)', role: 'NURSE', speciality: 'Cardiac Nursing', licenseNumber: 'NMC-88-15102 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'DIALYSIS',
    staff: [
      { fullName: 'Dr. Serwaa Owusu (synthetic)', role: 'CONSULTANT', speciality: 'Nephrology', licenseNumber: 'GMC-10340 (synthetic)', phone: '0244 000 109', email: 'serwaa.owusu@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Kwame Asare-Bediako (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Nephrology', licenseNumber: 'GMC-21001 (synthetic)' },
      { fullName: 'Sr. Adwoa Kyerewaa (synthetic)', role: 'NURSE', speciality: 'Renal / Dialysis Nursing', licenseNumber: 'NMC-88-15201 (synthetic)' },
      { fullName: 'Sr. Akosua Twumasi (synthetic)', role: 'NURSE', speciality: 'Renal / Dialysis Nursing', licenseNumber: 'NMC-88-15202 (synthetic)' },
      { fullName: 'Sr. Nana Ama Asiedu (synthetic)', role: 'NURSE', speciality: 'Renal / Dialysis Nursing', licenseNumber: 'NMC-88-15203 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'GEN-SURG',
    staff: [
      { fullName: 'Dr. Kwabena Osei (synthetic)', role: 'CONSULTANT', speciality: 'General Surgery', licenseNumber: 'GMC-10200 (synthetic)', phone: '0244 000 110', email: 'kwabena.osei@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Nana Yaw Asante (synthetic)', role: 'SURGEON', speciality: 'General Surgery', licenseNumber: 'GMC-21101 (synthetic)' },
      { fullName: 'Sr. Efua Baah (synthetic)', role: 'NURSE', speciality: 'Surgical Nursing', licenseNumber: 'NMC-88-15301 (synthetic)' },
      { fullName: 'Sr. Abena Gyimah (synthetic)', role: 'NURSE', speciality: 'Surgical Nursing', licenseNumber: 'NMC-88-15302 (synthetic)' },
      { fullName: 'Mr. Kofi Sarpong (synthetic)', role: 'PORTER' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'ORTHO',
    staff: [
      { fullName: 'Dr. Esi Antwi (synthetic)', role: 'CONSULTANT', speciality: 'Orthopaedics', licenseNumber: 'GMC-10390 (synthetic)', phone: '0244 000 111', email: 'esi.antwi@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Kwaku Mensah-Bonsu (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Orthopaedics', licenseNumber: 'GMC-21201 (synthetic)' },
      { fullName: 'Sr. Ama Serwaa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15401 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'BURNS',
    staff: [
      { fullName: 'Dr. Kweku Gyasi (synthetic)', role: 'CONSULTANT', speciality: 'Plastic & Reconstructive Surgery', licenseNumber: 'GMC-10440 (synthetic)', phone: '0244 000 112', email: 'kweku.gyasi@kbth.gh', headOfUnit: true },
      { fullName: 'Sr. Adjoa Mansa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15501 (synthetic)' },
      { fullName: 'Sr. Yaa Asantewaa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15502 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'THEATRE',
    staff: [
      { fullName: 'Mrs. Akosua Ankrah (synthetic)', role: 'OTHER', speciality: 'Theatre Management', phone: '0244 000 113', email: 'theatre@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Nana Kwame Oduro (synthetic)', role: 'ANESTHETIST', speciality: 'Anaesthesia', licenseNumber: 'GMC-21301 (synthetic)' },
      { fullName: 'Dr. Efua Sarpong (synthetic)', role: 'ANESTHETIST', speciality: 'Anaesthesia', licenseNumber: 'GMC-21302 (synthetic)' },
      { fullName: 'Sr. Comfort Asiedu (synthetic)', role: 'NURSE', speciality: 'Perioperative Nursing', licenseNumber: 'NMC-88-15601 (synthetic)' },
      { fullName: 'Sr. Akua Nyarko (synthetic)', role: 'NURSE', speciality: 'Perioperative Nursing', licenseNumber: 'NMC-88-15602 (synthetic)' },
      { fullName: 'Sr. Esi Owusuwa (synthetic)', role: 'NURSE', speciality: 'Perioperative Nursing', licenseNumber: 'NMC-88-15603 (synthetic)' },
      { fullName: 'Mr. Michael Tetteh (synthetic)', role: 'PORTER' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'MAT-ANTE',
    staff: [
      { fullName: 'Dr. Abena Acheampong (synthetic)', role: 'CONSULTANT', speciality: 'Obstetrics & Gynaecology', licenseNumber: 'GMC-10045 (synthetic)', phone: '0244 000 114', email: 'abena.acheampong@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Yaw Owusu-Ansah (synthetic)', role: 'OBSTETRICIAN', speciality: 'Obstetrics', licenseNumber: 'GMC-21401 (synthetic)' },
      { fullName: 'Midwife Abena Konadu (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2201 (synthetic)' },
      { fullName: 'Midwife Efua Amoako (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2202 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'MAT-LABOUR',
    staff: [
      { fullName: 'Midwife Grace Asare (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2101 (synthetic)', phone: '0244 000 115', email: 'labour.ward@kbth.gh', headOfUnit: true },
      { fullName: 'Midwife Akosua Addo (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2203 (synthetic)' },
      { fullName: 'Midwife Serwaa Boakye (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2204 (synthetic)' },
      { fullName: 'Midwife Afia Owusu (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2205 (synthetic)' },
      { fullName: 'Midwife Yaa Asantewaa (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2206 (synthetic)' },
      { fullName: 'Midwife Nana Ama Boateng (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2207 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'MAT-POST',
    staff: [
      { fullName: 'Midwife Efua Acquah (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2102 (synthetic)', phone: '0244 000 116', email: 'postnatal@kbth.gh', headOfUnit: true },
      { fullName: 'Midwife Akua Mensah (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2208 (synthetic)' },
      { fullName: 'Midwife Adwoa Frimpong (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2209 (synthetic)' },
      { fullName: 'Midwife Efua Owusuwaa (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-2210 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'GYNAE',
    staff: [
      { fullName: 'Dr. Nana Yaa Konadu (synthetic)', role: 'CONSULTANT', speciality: 'Gynaecology', licenseNumber: 'GMC-10190 (synthetic)', phone: '0244 000 117', email: 'gynae@kbth.gh', headOfUnit: true },
      { fullName: 'Dr. Akosua Acheampomaa (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Gynaecology', licenseNumber: 'GMC-21501 (synthetic)' },
      { fullName: 'Sr. Abena Nyarko (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-15701 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'PHARM-OPD',
    staff: [
      { fullName: 'Pharm. Kofi Boateng (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3011 (synthetic)', phone: '0244 000 118', email: 'pharmacy@kbth.gh', headOfUnit: true },
      { fullName: 'Pharm. Ama Gyamfua (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3012 (synthetic)' },
      { fullName: 'Pharm. Kwame Ofori (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3013 (synthetic)' },
      { fullName: 'Mr. Yaw Appiah (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3014 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'PHARM-INPT',
    staff: [
      { fullName: 'Pharm. Ama Gyamfi (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3021 (synthetic)', phone: '0244 000 119', email: 'inpatient.pharmacy@kbth.gh', headOfUnit: true },
      { fullName: 'Pharm. Efua Mensima (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3022 (synthetic)' },
      { fullName: 'Pharm. Nana Ama Asare (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-3023 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'LAB-MAIN',
    staff: [
      { fullName: 'Mr. Isaac Tetteh (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Medical Laboratory Science', licenseNumber: 'MLS-4011 (synthetic)', phone: '0244 000 120', email: 'lab@kbth.gh', headOfUnit: true },
      { fullName: 'Ms. Akosua Badu (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-4012 (synthetic)' },
      { fullName: 'Mr. Daniel Ofori (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-4013 (synthetic)' },
      { fullName: 'Ms. Efua Sika (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-4014 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'LAB-MICRO',
    staff: [
      { fullName: 'Mrs. Faustina Kwarteng (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Microbiology', licenseNumber: 'MLS-4021 (synthetic)', phone: '0244 000 121', email: 'microbiology@kbth.gh', headOfUnit: true },
      { fullName: 'Mr. Kojo Antwi (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Microbiology', licenseNumber: 'MLS-4022 (synthetic)' },
      { fullName: 'Ms. Abena Fosu (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Microbiology', licenseNumber: 'MLS-4023 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'RAD-XRAY',
    staff: [
      { fullName: 'Dr. Kwame Darko (synthetic)', role: 'RADIOLOGIST', licenseNumber: 'GMC-10600 (synthetic)', phone: '0244 000 122', email: 'radiology@kbth.gh', headOfUnit: true },
      { fullName: 'Mr. Samuel Owusu (synthetic)', role: 'RADIOGRAPHER', licenseNumber: 'GRC-5011 (synthetic)' },
      { fullName: 'Ms. Ama Ankrah (synthetic)', role: 'RADIOGRAPHER', licenseNumber: 'GRC-5012 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'RAD-ULTRA',
    staff: [
      { fullName: 'Mr. Daniel Osei (synthetic)', role: 'RADIOGRAPHER', speciality: 'Ultrasound', licenseNumber: 'GRC-5021 (synthetic)', phone: '0244 000 123', email: 'ultrasound@kbth.gh', headOfUnit: true },
      { fullName: 'Ms. Efua Obeng (synthetic)', role: 'RADIOGRAPHER', speciality: 'Ultrasound', licenseNumber: 'GRC-5022 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'BLOOD',
    staff: [
      { fullName: 'Dr. Akua Sarpong (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Haematology / Transfusion', licenseNumber: 'MLS-4031 (synthetic)', phone: '0244 000 124', email: 'bloodbank@kbth.gh', headOfUnit: true },
      { fullName: 'Mr. Kwaku Ansah (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Blood Transfusion', licenseNumber: 'MLS-4032 (synthetic)' },
      { fullName: 'Ms. Adwoa Tiwaa (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Blood Transfusion', licenseNumber: 'MLS-4033 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KBTH',
    unitCode: 'PHYSIO',
    staff: [
      { fullName: 'Mr. Michael Addo (synthetic)', role: 'PHYSIOTHERAPIST', licenseNumber: 'GPT-6011 (synthetic)', phone: '0244 000 125', email: 'physiotherapy@kbth.gh', headOfUnit: true },
      { fullName: 'Ms. Akosua Owusuwaa (synthetic)', role: 'PHYSIOTHERAPIST', licenseNumber: 'GPT-6012 (synthetic)' },
      { fullName: 'Mr. Kwesi Amoah (synthetic)', role: 'PHYSIOTHERAPIST', licenseNumber: 'GPT-6013 (synthetic)' },
    ],
  },
  // ======================================================= Komfo Anokye
  {
    facilityCode: 'GH-KATH',
    unitCode: 'OPD',
    staff: [
      { fullName: 'Dr. Yaw Boakye (synthetic)', role: 'CONSULTANT', speciality: 'General Medicine', licenseNumber: 'GMC-31001 (synthetic)', phone: '0322 000 101', email: 'yaw.boakye@kath.gh', headOfUnit: true },
      { fullName: 'Dr. Efua Kusiwaa (synthetic)', role: 'MEDICAL_OFFICER', licenseNumber: 'GMC-31002 (synthetic)' },
      { fullName: 'Sr. Akua Amponsah (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26001 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'ER',
    staff: [
      { fullName: 'Dr. Abena Kusi (synthetic)', role: 'CONSULTANT', speciality: 'Emergency Medicine', licenseNumber: 'GMC-31101 (synthetic)', phone: '0322 000 102', email: 'abena.kusi@kath.gh', headOfUnit: true },
      { fullName: 'Dr. Kofi Amankwah (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Emergency Medicine', licenseNumber: 'GMC-31102 (synthetic)' },
      { fullName: 'Sr. Serwaa Boateng (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26010 (synthetic)' },
      { fullName: 'Sr. Yaa Opoku (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26011 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'ICU',
    staff: [
      { fullName: 'Dr. Kwadwo Sarpong (synthetic)', role: 'CONSULTANT', speciality: 'Intensive Care', licenseNumber: 'GMC-31201 (synthetic)', phone: '0322 000 103', email: 'kwadwo.sarpong@kath.gh', headOfUnit: true },
      { fullName: 'Sr. Ama Mensima (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-26020 (synthetic)' },
      { fullName: 'Sr. Efua Nkrumah (synthetic)', role: 'NURSE', speciality: 'Critical Care Nursing', licenseNumber: 'NMC-88-26021 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'GEN-MED',
    staff: [
      { fullName: 'Dr. Ama Owusu (synthetic)', role: 'CONSULTANT', speciality: 'General Medicine', licenseNumber: 'GMC-31301 (synthetic)', phone: '0322 000 104', email: 'ama.owusu@kath.gh', headOfUnit: true },
      { fullName: 'Dr. Kwame Boakye-Yiadom (synthetic)', role: 'MEDICAL_OFFICER', licenseNumber: 'GMC-31302 (synthetic)' },
      { fullName: 'Sr. Adwoa Asare (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26030 (synthetic)' },
      { fullName: 'Sr. Abena Ampofo (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26031 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'GEN-SURG',
    staff: [
      { fullName: 'Dr. Kofi Agyemang (synthetic)', role: 'CONSULTANT', speciality: 'General Surgery', licenseNumber: 'GMC-31401 (synthetic)', phone: '0322 000 105', email: 'kofi.agyemang@kath.gh', headOfUnit: true },
      { fullName: 'Dr. Nana Kwabena Osei (synthetic)', role: 'SURGEON', licenseNumber: 'GMC-31402 (synthetic)' },
      { fullName: 'Sr. Efua Nyarko (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26040 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'MAT',
    staff: [
      { fullName: 'Dr. Akosua Amoah (synthetic)', role: 'CONSULTANT', speciality: 'Obstetrics & Gynaecology', licenseNumber: 'GMC-31501 (synthetic)', phone: '0322 000 106', email: 'akosua.amoah@kath.gh', headOfUnit: true },
      { fullName: 'Midwife Grace Owusu (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-3201 (synthetic)' },
      { fullName: 'Midwife Efua Baah (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-3202 (synthetic)' },
      { fullName: 'Midwife Akua Manu (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-3203 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'PAED',
    staff: [
      { fullName: 'Dr. Efua Asante (synthetic)', role: 'CONSULTANT', speciality: 'Paediatrics', licenseNumber: 'GMC-31601 (synthetic)', phone: '0322 000 107', email: 'efua.asante@kath.gh', headOfUnit: true },
      { fullName: 'Dr. Yaw Boamah (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'Paediatrics', licenseNumber: 'GMC-31602 (synthetic)' },
      { fullName: 'Sr. Akosua Dapaah (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-26050 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'LAB',
    staff: [
      { fullName: 'Mr. Samuel Yeboah (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-41001 (synthetic)', phone: '0322 000 108', email: 'lab@kath.gh', headOfUnit: true },
      { fullName: 'Ms. Abena Kankam (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-41002 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'RAD',
    staff: [
      { fullName: 'Dr. Kwaku Badu (synthetic)', role: 'RADIOLOGIST', licenseNumber: 'GMC-31701 (synthetic)', phone: '0322 000 109', email: 'radiology@kath.gh', headOfUnit: true },
      { fullName: 'Ms. Ama Owusu (synthetic)', role: 'RADIOGRAPHER', licenseNumber: 'GRC-51001 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'BLOOD',
    staff: [
      { fullName: 'Mrs. Comfort Duah (synthetic)', role: 'LAB_SCIENTIST', speciality: 'Blood Transfusion', licenseNumber: 'MLS-41010 (synthetic)', phone: '0322 000 110', email: 'bloodbank@kath.gh', headOfUnit: true },
      { fullName: 'Mr. Kwame Tuffour (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-41011 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    unitCode: 'PHARM',
    staff: [
      { fullName: 'Pharm. Ernest Ofori (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-32001 (synthetic)', phone: '0322 000 111', email: 'pharmacy@kath.gh', headOfUnit: true },
      { fullName: 'Pharm. Akosua Frimpong (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-32002 (synthetic)' },
    ],
  },
  // ========================================================== Ridge / GARH
  {
    facilityCode: 'GH-GARH',
    unitCode: 'OPD',
    staff: [
      { fullName: 'Dr. Efua Quaye (synthetic)', role: 'MEDICAL_OFFICER', speciality: 'General Medicine', licenseNumber: 'GMC-42001 (synthetic)', phone: '0302 000 201', email: 'efua.quaye@garh.gh', headOfUnit: true },
      { fullName: 'Dr. Kofi Asamoah (synthetic)', role: 'MEDICAL_OFFICER', licenseNumber: 'GMC-42002 (synthetic)' },
      { fullName: 'Sr. Ama Osei (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-37001 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'ER',
    staff: [
      { fullName: 'Dr. Kwame Tetteh (synthetic)', role: 'CONSULTANT', speciality: 'Emergency Medicine', licenseNumber: 'GMC-42101 (synthetic)', phone: '0302 000 202', email: 'kwame.tetteh@garh.gh', headOfUnit: true },
      { fullName: 'Sr. Efua Asiedu (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-37010 (synthetic)' },
      { fullName: 'Sr. Akua Owusuwaa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-37011 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'GEN-MED',
    staff: [
      { fullName: 'Dr. Ama Mensah (synthetic)', role: 'CONSULTANT', speciality: 'General Medicine', licenseNumber: 'GMC-42201 (synthetic)', phone: '0302 000 203', email: 'ama.mensah@garh.gh', headOfUnit: true },
      { fullName: 'Sr. Adwoa Ankoma (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-37020 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'MAT',
    staff: [
      { fullName: 'Dr. Akosua Anane (synthetic)', role: 'CONSULTANT', speciality: 'Obstetrics & Gynaecology', licenseNumber: 'GMC-42301 (synthetic)', phone: '0302 000 204', email: 'akosua.anane@garh.gh', headOfUnit: true },
      { fullName: 'Midwife Grace Appiah (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-4301 (synthetic)' },
      { fullName: 'Midwife Abena Owusu (synthetic)', role: 'MIDWIFE', licenseNumber: 'NMC-MW-4302 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'PAED',
    staff: [
      { fullName: 'Dr. Kofi Asare (synthetic)', role: 'CONSULTANT', speciality: 'Paediatrics', licenseNumber: 'GMC-42401 (synthetic)', phone: '0302 000 205', email: 'kofi.asare@garh.gh', headOfUnit: true },
      { fullName: 'Sr. Akosua Dansowa (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-37030 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'SURG',
    staff: [
      { fullName: 'Dr. Yaw Ofori (synthetic)', role: 'CONSULTANT', speciality: 'General Surgery', licenseNumber: 'GMC-42501 (synthetic)', phone: '0302 000 206', email: 'yaw.ofori@garh.gh', headOfUnit: true },
      { fullName: 'Sr. Efua Boatema (synthetic)', role: 'NURSE', licenseNumber: 'NMC-88-37040 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'LAB',
    staff: [
      { fullName: 'Mr. Daniel Adjei (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-43001 (synthetic)', phone: '0302 000 207', email: 'lab@garh.gh', headOfUnit: true },
      { fullName: 'Ms. Akua Frimpong (synthetic)', role: 'LAB_SCIENTIST', licenseNumber: 'MLS-43002 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'RAD',
    staff: [
      { fullName: 'Dr. Abena Frimpong (synthetic)', role: 'RADIOLOGIST', licenseNumber: 'GMC-42601 (synthetic)', phone: '0302 000 208', email: 'radiology@garh.gh', headOfUnit: true },
      { fullName: 'Mr. Kofi Osei (synthetic)', role: 'RADIOGRAPHER', licenseNumber: 'GRC-53001 (synthetic)' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    unitCode: 'PHARM',
    staff: [
      { fullName: 'Pharm. Kofi Danso (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-43001 (synthetic)', phone: '0302 000 209', email: 'pharmacy@garh.gh', headOfUnit: true },
      { fullName: 'Pharm. Efua Sarpong (synthetic)', role: 'PHARMACIST', licenseNumber: 'PCN-43002 (synthetic)' },
    ],
  },
];

export const FACILITY_STAFF: SeedFacilityStaff[] = [
  // Korle-Bu — hospital-level roles (no unit)
  {
    facilityCode: 'GH-KBTH',
    staff: [
      { fullName: 'Dr. Nana Ama Browne Klutse (synthetic)', role: 'HOSPITAL_ADMIN', speciality: 'Hospital Administration', email: 'ceo.office@kbth.gh' },
      { fullName: 'Mr. Emmanuel Osei-Bonsu (synthetic)', role: 'HOSPITAL_ADMIN', speciality: 'Hospital Administration', email: 'adm@kbth.gh' },
      { fullName: 'Mrs. Adjoa Asamoah (synthetic)', role: 'HEALTH_INFO_OFFICER', email: 'hio@kbth.gh' },
      { fullName: 'Mr. Kwame Owusu (synthetic)', role: 'HEALTH_INFO_OFFICER', email: 'hio2@kbth.gh' },
      { fullName: 'Ms. Abena Sakyiwaa (synthetic)', role: 'RECORDS_OFFICER', email: 'records@kbth.gh' },
      { fullName: 'Mr. Yaw Darkwa (synthetic)', role: 'RECORDS_OFFICER' },
      { fullName: 'Ms. Efua Kwartemaa (synthetic)', role: 'RECORDS_OFFICER' },
      { fullName: 'Mr. Kofi Antwi-Danso (synthetic)', role: 'ACCOUNTANT', email: 'finance@kbth.gh' },
      { fullName: 'Mrs. Akosua Agyemang (synthetic)', role: 'ACCOUNTANT' },
      { fullName: 'Ms. Ama Kyeremeh (synthetic)', role: 'CASHIER' },
      { fullName: 'Mr. Daniel Nkansah (synthetic)', role: 'CASHIER' },
      { fullName: 'Ms. Serwaa Oforiwa (synthetic)', role: 'CASHIER' },
      { fullName: 'Mr. Kwaku Sarpong (synthetic)', role: 'STOREKEEPER', email: 'stores@kbth.gh' },
      { fullName: 'Mr. Michael Tawiah (synthetic)', role: 'STOREKEEPER' },
      { fullName: 'Mr. Isaac Osei (synthetic)', role: 'IT_ADMIN', email: 'it@kbth.gh' },
      { fullName: 'Ms. Efua Owusuwaa (synthetic)', role: 'IT_ADMIN' },
      { fullName: 'Sgt. Kwabena Mensah (synthetic)', role: 'SECURITY' },
      { fullName: 'Cpl. Yaw Amoako (synthetic)', role: 'SECURITY' },
      { fullName: 'LCpl. Kofi Nyarko (synthetic)', role: 'SECURITY' },
      { fullName: 'Pte. Emmanuel Tetteh (synthetic)', role: 'SECURITY' },
      { fullName: 'Pte. Kwesi Boateng (synthetic)', role: 'SECURITY' },
      { fullName: 'Mr. Joseph Adjei (synthetic)', role: 'PORTER' },
      { fullName: 'Mr. Ebenezer Asante (synthetic)', role: 'PORTER' },
      { fullName: 'Mrs. Comfort Amankwah (synthetic)', role: 'CLEANER' },
      { fullName: 'Mrs. Akua Baidoo (synthetic)', role: 'CLEANER' },
      { fullName: 'Mrs. Efua Ocloo (synthetic)', role: 'CLEANER' },
      { fullName: 'Ms. Nana Ama Owusu (synthetic)', role: 'CHW' },
      { fullName: 'Mr. Kofi Tetteh (synthetic)', role: 'CHW' },
    ],
  },
  // Komfo Anokye — hospital-level roles
  {
    facilityCode: 'GH-KATH',
    staff: [
      { fullName: 'Dr. Kofi Sarpong-Agyei (synthetic)', role: 'HOSPITAL_ADMIN', email: 'adm@kath.gh' },
      { fullName: 'Mr. Yaw Osei-Tutu (synthetic)', role: 'HEALTH_INFO_OFFICER' },
      { fullName: 'Ms. Adwoa Amoako (synthetic)', role: 'RECORDS_OFFICER' },
      { fullName: 'Mr. Kwame Boakye (synthetic)', role: 'ACCOUNTANT' },
      { fullName: 'Ms. Efua Agyeiwaa (synthetic)', role: 'CASHIER' },
      { fullName: 'Mr. Daniel Owusu (synthetic)', role: 'STOREKEEPER' },
      { fullName: 'Mr. Isaac Kwakye (synthetic)', role: 'IT_ADMIN' },
      { fullName: 'Sgt. Kwesi Appiah (synthetic)', role: 'SECURITY' },
      { fullName: 'Mr. Michael Annan (synthetic)', role: 'PORTER' },
      { fullName: 'Mrs. Abena Owusuwaa (synthetic)', role: 'CLEANER' },
    ],
  },
  // Ridge / GARH — hospital-level roles
  {
    facilityCode: 'GH-GARH',
    staff: [
      { fullName: 'Dr. Akosua Adjeiwaa (synthetic)', role: 'HOSPITAL_ADMIN', email: 'adm@garh.gh' },
      { fullName: 'Ms. Efua Tetteh (synthetic)', role: 'HEALTH_INFO_OFFICER' },
      { fullName: 'Mr. Kofi Asante (synthetic)', role: 'RECORDS_OFFICER' },
      { fullName: 'Mrs. Ama Oforiwaa (synthetic)', role: 'ACCOUNTANT' },
      { fullName: 'Mr. Yaw Mensah (synthetic)', role: 'CASHIER' },
      { fullName: 'Mr. Kwaku Dapaah (synthetic)', role: 'STOREKEEPER' },
      { fullName: 'Ms. Abena Boateng (synthetic)', role: 'IT_ADMIN' },
      { fullName: 'Cpl. Kwame Owusu (synthetic)', role: 'SECURITY' },
      { fullName: 'Mrs. Akosua Amoah (synthetic)', role: 'CLEANER' },
    ],
  },
];
