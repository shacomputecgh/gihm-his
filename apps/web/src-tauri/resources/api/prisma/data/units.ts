// =====================================================================
// GIHM-HIS — Synthetic hospital unit seed (Department → Unit → Ward → Bed)
// ---------------------------------------------------------------------
// DEMO / SYNTHETIC DATA. Head-of-unit names, extensions and bed counts
// below are fictional placeholders for development/demonstration only —
// they are NOT official GHS/MoH facility statistics.
//
// Departments are matched by NAME against the facility's department rows
// seeded from facilities.ts. A unit whose department name is missing is
// still created (departmentId stays null — units may exist without one).
// =====================================================================

export interface SeedWardDef {
  name: string; // e.g. "Male Medical Ward"
  bedPrefix: string; // e.g. "M-" → M-01, M-02 …
  beds: number; // how many bed numbers to create
  occupied?: number[]; // 1-based bed indices seeded as OCCUPIED
}

export interface SeedUnitDef {
  code: string; // e.g. "ICU" — unique per facility
  name: string; // e.g. "Intensive Care Unit"
  type: 'CLINICAL' | 'DIAGNOSTIC' | 'SUPPORT' | 'ADMINISTRATIVE';
  department: string; // department NAME (matched against facility departments)
  headName?: string;
  headTitle?: string;
  phone?: string;
  location?: string;
  bedCapacity?: number;
  services?: string[];
  wards: SeedWardDef[];
}

export interface SeedFacilityUnits {
  facilityCode: string;
  units: SeedUnitDef[];
}

export const FACILITY_UNITS: SeedFacilityUnits[] = [
  // ============================================================ Korle-Bu
  {
    facilityCode: 'GH-KBTH',
    units: [
      {
        code: 'OPD',
        name: 'General Outpatient Unit',
        type: 'CLINICAL',
        department: 'Outpatient Department',
        headName: 'Dr. Kofi Asante (synthetic)',
        headTitle: 'Consultant Physician',
        phone: '0302 000 100 (synthetic)',
        location: 'Main Block, Ground Floor',
        services: ['OPD'],
        wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 6, occupied: [2] }],
      },
      {
        code: 'ER',
        name: 'Emergency & Trauma Unit',
        type: 'CLINICAL',
        department: 'Emergency Unit',
        headName: 'Dr. Efua Mensah (synthetic)',
        headTitle: 'Head of Emergency Medicine',
        phone: '0302 000 101 (synthetic)',
        location: 'Emergency Block, Ground Floor',
        services: ['EMERGENCY'],
        wards: [
          { name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 6, occupied: [1, 2] },
          { name: 'Emergency Observation Ward', bedPrefix: 'E-', beds: 12, occupied: [3, 5, 8] },
        ],
      },
      {
        code: 'ICU',
        name: 'Intensive Care Unit',
        type: 'CLINICAL',
        department: 'Emergency Unit',
        headName: 'Dr. Abena Owusu (synthetic)',
        headTitle: 'Consultant Intensivist',
        phone: '0302 000 102 (synthetic)',
        location: 'Critical Care Block, 1st Floor',
        services: ['ICU'],
        wards: [{ name: 'ICU', bedPrefix: 'I-', beds: 8, occupied: [1, 3] }],
      },
      {
        code: 'NICU',
        name: 'Neonatal Intensive Care Unit',
        type: 'CLINICAL',
        department: 'Paediatrics',
        headName: 'Dr. Yaw Boateng (synthetic)',
        headTitle: 'Consultant Paediatrician (Neonatology)',
        phone: '0302 000 103 (synthetic)',
        location: 'Paediatric Block, 2nd Floor',
        services: ['PAEDIATRICS'],
        wards: [{ name: 'NICU Ward', bedPrefix: 'N-', beds: 10, occupied: [2, 4] }],
      },
      {
        code: 'PAED-MED',
        name: 'Paediatric Medical Unit',
        type: 'CLINICAL',
        department: 'Paediatrics',
        headName: 'Dr. Ama Darko (synthetic)',
        headTitle: 'Consultant Paediatrician',
        phone: '0302 000 104 (synthetic)',
        location: 'Paediatric Block, 1st Floor',
        services: ['PAEDIATRICS'],
        wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 20, occupied: [3, 7, 12] }],
      },
      {
        code: 'PAED-SURG',
        name: 'Paediatric Surgical Unit',
        type: 'CLINICAL',
        department: 'Paediatrics',
        headName: 'Dr. Kwame Frimpong (synthetic)',
        headTitle: 'Consultant Paediatric Surgeon',
        phone: '0302 000 105 (synthetic)',
        location: 'Paediatric Block, 3rd Floor',
        services: ['PAEDIATRICS', 'SURGERY'],
        wards: [{ name: 'Paediatric Surgical Ward', bedPrefix: 'PS-', beds: 10 }],
      },
      {
        code: 'GEN-MED',
        name: 'General Medicine Unit',
        type: 'CLINICAL',
        department: 'Internal Medicine',
        headName: 'Dr. Adjoa Nkrumah (synthetic)',
        headTitle: 'Consultant Physician',
        phone: '0302 000 106 (synthetic)',
        location: 'Medical Block, 1st–2nd Floors',
        services: ['OPD'],
        wards: [
          { name: 'Male Medical Ward', bedPrefix: 'M-', beds: 24, occupied: [1, 4, 9] },
          { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 24, occupied: [2, 6, 11] },
        ],
      },
      {
        code: 'CARDIO',
        name: 'Cardiology Unit',
        type: 'CLINICAL',
        department: 'Cardiology',
        headName: 'Dr. Kwasi Appiah (synthetic)',
        headTitle: 'Consultant Cardiologist',
        phone: '0302 000 107 (synthetic)',
        location: 'Medical Block, 3rd Floor',
        services: ['CARDIOLOGY'],
        wards: [{ name: 'Cardiology Ward', bedPrefix: 'C-', beds: 12, occupied: [2] }],
      },
      {
        code: 'DIALYSIS',
        name: 'Renal / Dialysis Unit',
        type: 'CLINICAL',
        department: 'Internal Medicine',
        headName: 'Dr. Serwaa Owusu (synthetic)',
        headTitle: 'Consultant Nephrologist',
        phone: '0302 000 108 (synthetic)',
        location: 'Medical Block, 4th Floor',
        services: ['OPD'],
        wards: [{ name: 'Dialysis Bay', bedPrefix: 'D-', beds: 10, occupied: [1, 3, 5] }],
      },
      {
        code: 'GEN-SURG',
        name: 'General Surgery Unit',
        type: 'CLINICAL',
        department: 'Surgery/Theatre',
        headName: 'Dr. Kwabena Osei (synthetic)',
        headTitle: 'Consultant Surgeon',
        phone: '0302 000 109 (synthetic)',
        location: 'Surgical Block, 1st–2nd Floors',
        services: ['SURGERY'],
        wards: [
          { name: 'Surgical Male Ward', bedPrefix: 'SM-', beds: 16, occupied: [2, 5] },
          { name: 'Surgical Female Ward', bedPrefix: 'SF-', beds: 16, occupied: [3] },
        ],
      },
      {
        code: 'ORTHO',
        name: 'Orthopaedic Unit',
        type: 'CLINICAL',
        department: 'Surgery/Theatre',
        headName: 'Dr. Esi Antwi (synthetic)',
        headTitle: 'Consultant Orthopaedic Surgeon',
        phone: '0302 000 110 (synthetic)',
        location: 'Surgical Block, 3rd Floor',
        services: ['SURGERY'],
        wards: [{ name: 'Orthopaedic Ward', bedPrefix: 'OR-', beds: 14, occupied: [1, 6] }],
      },
      {
        code: 'BURNS',
        name: 'Burns & Plastic Surgery Unit',
        type: 'CLINICAL',
        department: 'Surgery/Theatre',
        headName: 'Dr. Kweku Gyasi (synthetic)',
        headTitle: 'Consultant Plastic Surgeon',
        phone: '0302 000 111 (synthetic)',
        location: 'Surgical Block, 4th Floor',
        services: ['SURGERY'],
        wards: [{ name: 'Burns Ward', bedPrefix: 'B-', beds: 8 }],
      },
      {
        code: 'THEATRE',
        name: 'Theatre Complex',
        type: 'SUPPORT',
        department: 'Surgery/Theatre',
        headName: 'Mrs. Akosua Ankrah (synthetic)',
        headTitle: 'Theatre Manager',
        phone: '0302 000 112 (synthetic)',
        location: 'Surgical Block, Ground Floor',
        services: ['SURGERY'],
        wards: [],
      },
      {
        code: 'MAT-ANTE',
        name: 'Antenatal Unit',
        type: 'CLINICAL',
        department: 'Maternity',
        headName: 'Dr. Abena Acheampong (synthetic)',
        headTitle: 'Consultant Obstetrician',
        phone: '0302 000 113 (synthetic)',
        location: 'Maternity Block, 1st Floor',
        services: ['MATERNITY'],
        wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 18, occupied: [2, 7] }],
      },
      {
        code: 'MAT-LABOUR',
        name: 'Labour Ward',
        type: 'CLINICAL',
        department: 'Maternity',
        headName: 'Midwife Grace Asare (synthetic)',
        headTitle: 'Senior Midwifery Officer',
        phone: '0302 000 114 (synthetic)',
        location: 'Maternity Block, Ground Floor',
        services: ['MATERNITY'],
        wards: [
          { name: 'Labour Ward', bedPrefix: 'L-', beds: 8, occupied: [1, 2] },
          { name: 'Delivery Suites', bedPrefix: 'DS-', beds: 4, occupied: [1] },
        ],
      },
      {
        code: 'MAT-POST',
        name: 'Postnatal Unit',
        type: 'CLINICAL',
        department: 'Maternity',
        headName: 'Midwife Efua Acquah (synthetic)',
        headTitle: 'Midwifery Officer',
        phone: '0302 000 115 (synthetic)',
        location: 'Maternity Block, 2nd Floor',
        services: ['MATERNITY'],
        wards: [{ name: 'Maternity Ward', bedPrefix: 'MT-', beds: 20, occupied: [4, 8, 15] }],
      },
      {
        code: 'GYNAE',
        name: 'Gynaecology Unit',
        type: 'CLINICAL',
        department: 'Maternity',
        headName: 'Dr. Nana Yaa Konadu (synthetic)',
        headTitle: 'Consultant Gynaecologist',
        phone: '0302 000 116 (synthetic)',
        location: 'Maternity Block, 3rd Floor',
        services: ['MATERNITY'],
        wards: [{ name: 'Gynaecology Ward', bedPrefix: 'G-', beds: 12 }],
      },
      {
        code: 'PHARM-OPD',
        name: 'Outpatient Pharmacy',
        type: 'SUPPORT',
        department: 'Pharmacy',
        headName: 'Pharm. Kofi Boateng (synthetic)',
        headTitle: 'Chief Pharmacist',
        phone: '0302 000 117 (synthetic)',
        location: 'Main Block, Ground Floor',
        services: ['PHARMACY'],
        wards: [],
      },
      {
        code: 'PHARM-INPT',
        name: 'Inpatient Pharmacy',
        type: 'SUPPORT',
        department: 'Pharmacy',
        headName: 'Pharm. Ama Gyamfi (synthetic)',
        headTitle: 'Deputy Chief Pharmacist',
        phone: '0302 000 118 (synthetic)',
        location: 'Pharmacy Block, 1st Floor',
        services: ['PHARMACY'],
        wards: [],
      },
      {
        code: 'LAB-MAIN',
        name: 'Main Laboratory',
        type: 'DIAGNOSTIC',
        department: 'Laboratory',
        headName: 'Mr. Isaac Tetteh (synthetic)',
        headTitle: 'Chief Laboratory Scientist',
        phone: '0302 000 119 (synthetic)',
        location: 'Diagnostics Block, Ground Floor',
        services: ['LABORATORY'],
        wards: [],
      },
      {
        code: 'LAB-MICRO',
        name: 'Microbiology Unit',
        type: 'DIAGNOSTIC',
        department: 'Laboratory',
        headName: 'Mrs. Faustina Kwarteng (synthetic)',
        headTitle: 'Senior Laboratory Scientist',
        phone: '0302 000 120 (synthetic)',
        location: 'Diagnostics Block, 1st Floor',
        services: ['LABORATORY'],
        wards: [],
      },
      {
        code: 'RAD-XRAY',
        name: 'Radiology / X-Ray Unit',
        type: 'DIAGNOSTIC',
        department: 'Radiology',
        headName: 'Dr. Kwame Darko (synthetic)',
        headTitle: 'Consultant Radiologist',
        phone: '0302 000 121 (synthetic)',
        location: 'Diagnostics Block, 2nd Floor',
        services: ['IMAGING'],
        wards: [],
      },
      {
        code: 'RAD-ULTRA',
        name: 'Ultrasound & Imaging Unit',
        type: 'DIAGNOSTIC',
        department: 'Radiology',
        headName: 'Mr. Daniel Osei (synthetic)',
        headTitle: 'Senior Radiographer',
        phone: '0302 000 122 (synthetic)',
        location: 'Diagnostics Block, 2nd Floor',
        services: ['IMAGING'],
        wards: [],
      },
      {
        code: 'BLOOD',
        name: 'Blood Bank',
        type: 'DIAGNOSTIC',
        department: 'Blood Bank',
        headName: 'Dr. Akua Sarpong (synthetic)',
        headTitle: 'Consultant Haematologist',
        phone: '0302 000 123 (synthetic)',
        location: 'Diagnostics Block, 3rd Floor',
        services: ['BLOOD_BANK'],
        wards: [],
      },
      {
        code: 'PHYSIO',
        name: 'Physiotherapy Unit',
        type: 'CLINICAL',
        department: 'Physiotherapy',
        headName: 'Mr. Michael Addo (synthetic)',
        headTitle: 'Chief Physiotherapist',
        phone: '0302 000 124 (synthetic)',
        location: 'Rehabilitation Block, Ground Floor',
        services: ['OPD'],
        wards: [],
      },
    ],
  },
  // ======================================================= Komfo Anokye
  {
    facilityCode: 'GH-KATH',
    units: [
      {
        code: 'OPD',
        name: 'General Outpatient Unit',
        type: 'CLINICAL',
        department: 'Outpatient Department',
        headName: 'Dr. Yaw Boakye (synthetic)',
        headTitle: 'Consultant Physician',
        phone: '0322 000 100 (synthetic)',
        location: 'OPD Block, Ground Floor',
        services: ['OPD'],
        wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 4 }],
      },
      {
        code: 'ER',
        name: 'Emergency Unit',
        type: 'CLINICAL',
        department: 'Emergency Unit',
        headName: 'Dr. Abena Kusi (synthetic)',
        headTitle: 'Head of Emergency Medicine',
        phone: '0322 000 101 (synthetic)',
        location: 'Emergency Block, Ground Floor',
        services: ['EMERGENCY'],
        wards: [
          { name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 4, occupied: [1] },
          { name: 'Observation Ward', bedPrefix: 'E-', beds: 8, occupied: [2] },
        ],
      },
      {
        code: 'ICU',
        name: 'Intensive Care Unit',
        type: 'CLINICAL',
        department: 'Emergency Unit',
        headName: 'Dr. Kwadwo Sarpong (synthetic)',
        headTitle: 'Consultant Intensivist',
        phone: '0322 000 102 (synthetic)',
        location: 'Critical Care Block, 1st Floor',
        services: ['ICU'],
        wards: [{ name: 'ICU', bedPrefix: 'I-', beds: 6, occupied: [1] }],
      },
      {
        code: 'GEN-MED',
        name: 'General Medicine Unit',
        type: 'CLINICAL',
        department: 'Internal Medicine',
        headName: 'Dr. Ama Owusu (synthetic)',
        headTitle: 'Consultant Physician',
        phone: '0322 000 103 (synthetic)',
        location: 'Medical Block, 1st Floor',
        services: ['OPD'],
        wards: [
          { name: 'Male Medical Ward', bedPrefix: 'M-', beds: 16, occupied: [2] },
          { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 16, occupied: [4] },
        ],
      },
      {
        code: 'GEN-SURG',
        name: 'General Surgery Unit',
        type: 'CLINICAL',
        department: 'Surgery/Theatre',
        headName: 'Dr. Kofi Agyemang (synthetic)',
        headTitle: 'Consultant Surgeon',
        phone: '0322 000 104 (synthetic)',
        location: 'Surgical Block, 1st Floor',
        services: ['SURGERY'],
        wards: [
          { name: 'Surgical Male Ward', bedPrefix: 'SM-', beds: 12 },
          { name: 'Surgical Female Ward', bedPrefix: 'SF-', beds: 12, occupied: [1] },
        ],
      },
      {
        code: 'MAT',
        name: 'Maternity Unit',
        type: 'CLINICAL',
        department: 'Maternity',
        headName: 'Dr. Akosua Amoah (synthetic)',
        headTitle: 'Consultant Obstetrician',
        phone: '0322 000 105 (synthetic)',
        location: 'Maternity Block, 1st Floor',
        services: ['MATERNITY'],
        wards: [
          { name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 12 },
          { name: 'Labour Ward', bedPrefix: 'L-', beds: 6, occupied: [2] },
          { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 14, occupied: [3] },
        ],
      },
      {
        code: 'PAED',
        name: 'Paediatric Unit',
        type: 'CLINICAL',
        department: 'Paediatrics',
        headName: 'Dr. Efua Asante (synthetic)',
        headTitle: 'Consultant Paediatrician',
        phone: '0322 000 106 (synthetic)',
        location: 'Paediatric Block, 1st Floor',
        services: ['PAEDIATRICS'],
        wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 14, occupied: [2, 5] }],
      },
      {
        code: 'LAB',
        name: 'Laboratory Unit',
        type: 'DIAGNOSTIC',
        department: 'Laboratory',
        headName: 'Mr. Samuel Yeboah (synthetic)',
        headTitle: 'Chief Laboratory Scientist',
        phone: '0322 000 107 (synthetic)',
        location: 'Diagnostics Block, Ground Floor',
        services: ['LABORATORY'],
        wards: [],
      },
      {
        code: 'RAD',
        name: 'Radiology Unit',
        type: 'DIAGNOSTIC',
        department: 'Radiology',
        headName: 'Dr. Kwaku Badu (synthetic)',
        headTitle: 'Consultant Radiologist',
        phone: '0322 000 108 (synthetic)',
        location: 'Diagnostics Block, 1st Floor',
        services: ['IMAGING'],
        wards: [],
      },
      {
        code: 'BLOOD',
        name: 'Blood Bank',
        type: 'DIAGNOSTIC',
        department: 'Blood Bank',
        headName: 'Mrs. Comfort Duah (synthetic)',
        headTitle: 'Senior Haematologist',
        phone: '0322 000 109 (synthetic)',
        location: 'Diagnostics Block, 2nd Floor',
        services: ['BLOOD_BANK'],
        wards: [],
      },
      {
        code: 'PHARM',
        name: 'Pharmacy Unit',
        type: 'SUPPORT',
        department: 'Pharmacy',
        headName: 'Pharm. Ernest Ofori (synthetic)',
        headTitle: 'Chief Pharmacist',
        phone: '0322 000 110 (synthetic)',
        location: 'Main Block, Ground Floor',
        services: ['PHARMACY'],
        wards: [],
      },
    ],
  },
  // ========================================================== Ridge / GARH
  {
    facilityCode: 'GH-GARH',
    units: [
      {
        code: 'OPD',
        name: 'General Outpatient Unit',
        type: 'CLINICAL',
        department: 'Outpatient Department',
        headName: 'Dr. Efua Quaye (synthetic)',
        headTitle: 'Medical Officer',
        phone: '0302 000 200 (synthetic)',
        location: 'OPD Block, Ground Floor',
        services: ['OPD'],
        wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 4 }],
      },
      {
        code: 'ER',
        name: 'Emergency Unit',
        type: 'CLINICAL',
        department: 'Emergency Unit',
        headName: 'Dr. Kwame Tetteh (synthetic)',
        headTitle: 'Head of Emergency',
        phone: '0302 000 201 (synthetic)',
        location: 'Emergency Block, Ground Floor',
        services: ['EMERGENCY'],
        wards: [
          { name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 3, occupied: [1] },
          { name: 'Observation Ward', bedPrefix: 'E-', beds: 6, occupied: [2] },
        ],
      },
      {
        code: 'GEN-MED',
        name: 'General Medicine Unit',
        type: 'CLINICAL',
        department: 'Internal Medicine',
        headName: 'Dr. Ama Mensah (synthetic)',
        headTitle: 'Consultant Physician',
        phone: '0302 000 202 (synthetic)',
        location: 'Medical Block, 1st Floor',
        services: ['OPD'],
        wards: [
          { name: 'Male Medical Ward', bedPrefix: 'M-', beds: 10 },
          { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 10, occupied: [1] },
        ],
      },
      {
        code: 'MAT',
        name: 'Maternity Unit',
        type: 'CLINICAL',
        department: 'Maternity',
        headName: 'Dr. Akosua Anane (synthetic)',
        headTitle: 'Consultant Obstetrician',
        phone: '0302 000 203 (synthetic)',
        location: 'Maternity Block, 1st Floor',
        services: ['MATERNITY'],
        wards: [
          { name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 8 },
          { name: 'Labour Ward', bedPrefix: 'L-', beds: 4 },
          { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 10, occupied: [2] },
        ],
      },
      {
        code: 'PAED',
        name: 'Paediatric Unit',
        type: 'CLINICAL',
        department: 'Paediatrics',
        headName: 'Dr. Kofi Asare (synthetic)',
        headTitle: 'Consultant Paediatrician',
        phone: '0302 000 204 (synthetic)',
        location: 'Paediatric Block, 1st Floor',
        services: ['PAEDIATRICS'],
        wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 10, occupied: [3] }],
      },
      {
        code: 'SURG',
        name: 'Surgical Unit',
        type: 'CLINICAL',
        department: 'Surgery/Theatre',
        headName: 'Dr. Yaw Ofori (synthetic)',
        headTitle: 'Consultant Surgeon',
        phone: '0302 000 205 (synthetic)',
        location: 'Surgical Block, 1st Floor',
        services: ['SURGERY'],
        wards: [
          { name: 'Surgical Male Ward', bedPrefix: 'SM-', beds: 8 },
          { name: 'Surgical Female Ward', bedPrefix: 'SF-', beds: 8 },
        ],
      },
      {
        code: 'LAB',
        name: 'Laboratory Unit',
        type: 'DIAGNOSTIC',
        department: 'Laboratory',
        headName: 'Mr. Daniel Adjei (synthetic)',
        headTitle: 'Chief Laboratory Scientist',
        phone: '0302 000 206 (synthetic)',
        location: 'Diagnostics Block, Ground Floor',
        services: ['LABORATORY'],
        wards: [],
      },
      {
        code: 'RAD',
        name: 'Radiology Unit',
        type: 'DIAGNOSTIC',
        department: 'Radiology',
        headName: 'Dr. Abena Frimpong (synthetic)',
        headTitle: 'Consultant Radiologist',
        phone: '0302 000 207 (synthetic)',
        location: 'Diagnostics Block, 1st Floor',
        services: ['IMAGING'],
        wards: [],
      },
      {
        code: 'PHARM',
        name: 'Pharmacy Unit',
        type: 'SUPPORT',
        department: 'Pharmacy',
        headName: 'Pharm. Kofi Danso (synthetic)',
        headTitle: 'Chief Pharmacist',
        phone: '0302 000 208 (synthetic)',
        location: 'Main Block, Ground Floor',
        services: ['PHARMACY'],
        wards: [],
      },
    ],
  },
];

// =====================================================================
// Default unit catalog — Department → Unit → Ward → Bed per facility class
// ---------------------------------------------------------------------
// The three hand-written facilities above (teaching hospitals + regional
// hospital) stay as-is; EVERY other seeded facility gets its standard
// structure from this catalog so all 43 facilities in the demo registry
// have a complete unit tree. Department names below MUST match the
// DEPARTMENTS_BY_TYPE catalog in facilities.ts (units attach by name).
//
// Wards use BASE bed counts for a ~1500-bed teaching hospital; the seed
// scales them down by the facility's actual bed capacity.
// =====================================================================

export const DEFAULT_UNITS_BY_TYPE: Record<string, SeedUnitDef[]> = {
  // -------------------------------------------------- teaching hospital
  TEACHING_HOSPITAL: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'Outpatient Department', services: ['OPD'], wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 6 }] },
    { code: 'ER', name: 'Emergency & Trauma Unit', type: 'CLINICAL', department: 'Emergency Unit', services: ['EMERGENCY'], wards: [{ name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 6 }, { name: 'Emergency Observation Ward', bedPrefix: 'E-', beds: 12 }] },
    { code: 'ICU', name: 'Intensive Care Unit', type: 'CLINICAL', department: 'ICU', services: ['ICU'], wards: [{ name: 'ICU', bedPrefix: 'I-', beds: 8 }] },
    { code: 'NICU', name: 'Neonatal Intensive Care Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'NICU Ward', bedPrefix: 'N-', beds: 10 }] },
    { code: 'PAED-MED', name: 'Paediatric Medical Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'Paediatric Medical Ward', bedPrefix: 'P-', beds: 20 }] },
    { code: 'PAED-SURG', name: 'Paediatric Surgical Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS', 'SURGERY'], wards: [{ name: 'Paediatric Surgical Ward', bedPrefix: 'PS-', beds: 10 }] },
    { code: 'GEN-MED', name: 'General Medicine Unit', type: 'CLINICAL', department: 'Internal Medicine', services: ['OPD'], wards: [{ name: 'Male Medical Ward', bedPrefix: 'M-', beds: 24 }, { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 24 }] },
    { code: 'CARDIO', name: 'Cardiology Unit', type: 'CLINICAL', department: 'Cardiology', services: ['CARDIOLOGY'], wards: [{ name: 'Cardiology Ward', bedPrefix: 'C-', beds: 12 }] },
    { code: 'DIALYSIS', name: 'Renal / Dialysis Unit', type: 'CLINICAL', department: 'Nephrology', services: ['NEPHROLOGY'], wards: [{ name: 'Dialysis Bay', bedPrefix: 'D-', beds: 10 }] },
    { code: 'ONCO', name: 'Oncology Unit', type: 'CLINICAL', department: 'Oncology', services: ['ONCOLOGY'], wards: [{ name: 'Oncology Ward', bedPrefix: 'ON-', beds: 12 }] },
    { code: 'GEN-SURG', name: 'General Surgery Unit', type: 'CLINICAL', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [{ name: 'Surgical Male Ward', bedPrefix: 'SM-', beds: 16 }, { name: 'Surgical Female Ward', bedPrefix: 'SF-', beds: 16 }] },
    { code: 'ORTHO', name: 'Orthopaedic Unit', type: 'CLINICAL', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [{ name: 'Orthopaedic Ward', bedPrefix: 'OR-', beds: 14 }] },
    { code: 'BURNS', name: 'Burns & Plastic Surgery Unit', type: 'CLINICAL', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [{ name: 'Burns Ward', bedPrefix: 'B-', beds: 8 }] },
    { code: 'THEATRE', name: 'Theatre Complex', type: 'SUPPORT', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [] },
    { code: 'CSSD', name: 'Central Sterile Services Department', type: 'SUPPORT', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [] },
    { code: 'MAT-ANTE', name: 'Antenatal Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 18 }] },
    { code: 'MAT-LABOUR', name: 'Labour Ward', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Labour Ward', bedPrefix: 'L-', beds: 8 }, { name: 'Delivery Suites', bedPrefix: 'DS-', beds: 4 }] },
    { code: 'MAT-POST', name: 'Postnatal Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 20 }] },
    { code: 'GYNAE', name: 'Gynaecology Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Gynaecology Ward', bedPrefix: 'G-', beds: 12 }] },
    { code: 'PHARM-OPD', name: 'Outpatient Pharmacy', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'PHARM-INPT', name: 'Inpatient Pharmacy', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'LAB-MAIN', name: 'Main Laboratory', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'LAB-MICRO', name: 'Microbiology Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RAD-XRAY', name: 'Radiology / X-Ray Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'RAD-ULTRA', name: 'Ultrasound & Imaging Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'BLOOD', name: 'Blood Bank', type: 'DIAGNOSTIC', department: 'Blood Bank', services: ['BLOOD_BANK'], wards: [] },
    { code: 'PHYSIO', name: 'Physiotherapy Unit', type: 'CLINICAL', department: 'Physiotherapy', services: ['PHYSIOTHERAPY'], wards: [] },
    { code: 'DENTAL', name: 'Dental Unit', type: 'CLINICAL', department: 'Dental', services: ['DENTAL'], wards: [] },
    { code: 'OPHTH', name: 'Ophthalmology Unit', type: 'CLINICAL', department: 'Ophthalmology', services: ['OPHTHALMOLOGY'], wards: [] },
    { code: 'ENT', name: 'ENT Unit', type: 'CLINICAL', department: 'ENT', services: ['ENT'], wards: [] },
    { code: 'DERMA', name: 'Dermatology Unit', type: 'CLINICAL', department: 'Dermatology', services: ['DERMATOLOGY'], wards: [] },
    { code: 'PSYCH', name: 'Psychiatry Unit', type: 'CLINICAL', department: 'Psychiatry', services: ['PSYCHIATRY'], wards: [] },
    { code: 'NUTRITION', name: 'Nutrition & Dietetics Unit', type: 'SUPPORT', department: 'Nutrition & Dietetics', services: ['NUTRITION'], wards: [] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // -------------------------------------------------- regional hospital
  REGIONAL_HOSPITAL: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'Outpatient Department', services: ['OPD'], wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 5 }] },
    { code: 'ER', name: 'Emergency Unit', type: 'CLINICAL', department: 'Emergency Unit', services: ['EMERGENCY'], wards: [{ name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 4 }, { name: 'Emergency Observation Ward', bedPrefix: 'E-', beds: 10 }] },
    { code: 'ICU', name: 'Intensive Care Unit', type: 'CLINICAL', department: 'ICU', services: ['ICU'], wards: [{ name: 'ICU', bedPrefix: 'I-', beds: 6 }] },
    { code: 'GEN-MED', name: 'General Medicine Unit', type: 'CLINICAL', department: 'Internal Medicine', services: ['OPD'], wards: [{ name: 'Male Medical Ward', bedPrefix: 'M-', beds: 18 }, { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 18 }] },
    { code: 'GEN-SURG', name: 'General Surgery Unit', type: 'CLINICAL', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [{ name: 'Surgical Male Ward', bedPrefix: 'SM-', beds: 12 }, { name: 'Surgical Female Ward', bedPrefix: 'SF-', beds: 12 }] },
    { code: 'THEATRE', name: 'Theatre Complex', type: 'SUPPORT', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [] },
    { code: 'CSSD', name: 'Central Sterile Services Department', type: 'SUPPORT', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [] },
    { code: 'MAT', name: 'Maternity Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 10 }, { name: 'Labour Ward', bedPrefix: 'L-', beds: 5 }, { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 14 }, { name: 'Gynaecology Ward', bedPrefix: 'G-', beds: 8 }] },
    { code: 'NICU', name: 'Neonatal Intensive Care Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'NICU Ward', bedPrefix: 'N-', beds: 6 }] },
    { code: 'PAED', name: 'Paediatric Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 16 }] },
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'LAB', name: 'Laboratory Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RAD', name: 'Radiology Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'BLOOD', name: 'Blood Bank', type: 'DIAGNOSTIC', department: 'Blood Bank', services: ['BLOOD_BANK'], wards: [] },
    { code: 'PHYSIO', name: 'Physiotherapy Unit', type: 'CLINICAL', department: 'Physiotherapy', services: ['PHYSIOTHERAPY'], wards: [] },
    { code: 'DENTAL', name: 'Dental Unit', type: 'CLINICAL', department: 'Dental', services: ['DENTAL'], wards: [] },
    { code: 'OPHTH', name: 'Ophthalmology Unit', type: 'CLINICAL', department: 'Ophthalmology', services: ['OPHTHALMOLOGY'], wards: [] },
    { code: 'ENT', name: 'ENT Unit', type: 'CLINICAL', department: 'ENT', services: ['ENT'], wards: [] },
    { code: 'NUTRITION', name: 'Nutrition & Dietetics Unit', type: 'SUPPORT', department: 'Nutrition & Dietetics', services: ['NUTRITION'], wards: [] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // ------------------------------------------- municipal / district hospital
  MUNICIPAL_HOSPITAL: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'Outpatient Department', services: ['OPD'], wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 4 }] },
    { code: 'ER', name: 'Emergency Unit', type: 'CLINICAL', department: 'Emergency Unit', services: ['EMERGENCY'], wards: [{ name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 3 }, { name: 'Emergency Observation Ward', bedPrefix: 'E-', beds: 8 }] },
    { code: 'GEN-MED', name: 'General Medicine Unit', type: 'CLINICAL', department: 'Internal Medicine', services: ['OPD'], wards: [{ name: 'Male Medical Ward', bedPrefix: 'M-', beds: 12 }, { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 12 }] },
    { code: 'GEN-SURG', name: 'General Surgery Unit', type: 'CLINICAL', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [{ name: 'Surgical Male Ward', bedPrefix: 'SM-', beds: 8 }, { name: 'Surgical Female Ward', bedPrefix: 'SF-', beds: 8 }] },
    { code: 'THEATRE', name: 'Theatre', type: 'SUPPORT', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [] },
    { code: 'MAT', name: 'Maternity Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 6 }, { name: 'Labour Ward', bedPrefix: 'L-', beds: 3 }, { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 8 }] },
    { code: 'PAED', name: 'Paediatric Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 10 }] },
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'LAB', name: 'Laboratory Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RAD', name: 'Radiology Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'DENTAL', name: 'Dental Unit', type: 'CLINICAL', department: 'Dental', services: ['DENTAL'], wards: [] },
    { code: 'GEN-WARD', name: 'General Ward', type: 'CLINICAL', department: 'General Ward', services: ['GENERAL_WARD'], wards: [{ name: 'Male General Ward', bedPrefix: 'GM-', beds: 10 }, { name: 'Female General Ward', bedPrefix: 'GF-', beds: 10 }] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // DISTRICT_HOSPITAL reuses the MUNICIPAL_HOSPITAL catalog (see unitsForAllFacilities).
  // ---------------------------------------------------------- polyclinic
  POLYCLINIC: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'Outpatient Department', services: ['OPD'], wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 3 }] },
    { code: 'MAT', name: 'Maternity Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 2 }, { name: 'Labour Ward', bedPrefix: 'L-', beds: 2 }, { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 3 }] },
    { code: 'PAED', name: 'Paediatric Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 4 }] },
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'LAB', name: 'Laboratory Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // -------------------------------------------------------- health centre
  HEALTH_CENTRE: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'Outpatient Department', services: ['OPD'], wards: [{ name: 'Observation Bay', bedPrefix: 'O-', beds: 2 }] },
    { code: 'MATERNITY', name: 'Maternity Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Labour & Postnatal Room', bedPrefix: 'L-', beds: 2 }] },
    { code: 'MCH', name: 'Maternal & Child Health Unit', type: 'CLINICAL', department: 'Maternal & Child Health', services: ['MATERNITY', 'IMMUNIZATION'], wards: [] },
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // --------------------------------------------------------- CHPS compound
  CHPS_COMPOUND: [
    { code: 'CHPS', name: 'Community Health Unit', type: 'CLINICAL', department: 'Community Health', services: ['CHPS', 'COMMUNITY_HEALTH'], wards: [] },
    { code: 'MCH', name: 'Maternal & Child Health Unit', type: 'CLINICAL', department: 'Maternal & Child Health', services: ['MATERNITY', 'IMMUNIZATION', 'FAMILY_PLANNING'], wards: [] },
  ],
  // ----------------------------------------------------- private hospital
  PRIVATE_HOSPITAL: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'General Outpatient', services: ['OPD'], wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 3 }] },
    { code: 'ER', name: 'Emergency Unit', type: 'CLINICAL', department: 'Emergency Unit', services: ['EMERGENCY'], wards: [{ name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 2 }] },
    { code: 'GEN-MED', name: 'General Medicine Unit', type: 'CLINICAL', department: 'Internal Medicine', services: ['OPD', 'INPATIENT'], wards: [{ name: 'Male Medical Ward', bedPrefix: 'M-', beds: 6 }, { name: 'Female Medical Ward', bedPrefix: 'F-', beds: 6 }] },
    { code: 'GEN-SURG', name: 'General Surgery Unit', type: 'CLINICAL', department: 'Surgery', services: ['SURGERY', 'INPATIENT'], wards: [{ name: 'Surgical Ward', bedPrefix: 'S-', beds: 6 }] },
    { code: 'THEATRE', name: 'Theatre', type: 'SUPPORT', department: 'Surgery', services: ['SURGERY'], wards: [] },
    { code: 'MAT', name: 'Maternity Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 3 }, { name: 'Labour Ward', bedPrefix: 'L-', beds: 2 }, { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 4 }] },
    { code: 'PAED', name: 'Paediatric Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 6 }] },
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'LAB', name: 'Laboratory Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RAD', name: 'Radiology Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'DENTAL', name: 'Dental Unit', type: 'CLINICAL', department: 'Dental', services: ['DENTAL'], wards: [] },
    { code: 'PHYSIO', name: 'Physiotherapy Unit', type: 'CLINICAL', department: 'Physiotherapy', services: ['PHYSIOTHERAPY'], wards: [] },
    { code: 'GEN-WARD', name: 'General Ward', type: 'CLINICAL', department: 'General Ward', services: ['GENERAL_WARD', 'INPATIENT'], wards: [{ name: 'General Ward', bedPrefix: 'G-', beds: 8 }] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // ----------------------------------------------------- mission hospital
  MISSION_HOSPITAL: [
    { code: 'OPD', name: 'General Outpatient Unit', type: 'CLINICAL', department: 'Outpatient Department', services: ['OPD'], wards: [{ name: 'OPD Observation Bay', bedPrefix: 'O-', beds: 3 }] },
    { code: 'ER', name: 'Emergency Unit', type: 'CLINICAL', department: 'Emergency Unit', services: ['EMERGENCY'], wards: [{ name: 'Resuscitation Bay', bedPrefix: 'R-', beds: 2 }, { name: 'Observation Ward', bedPrefix: 'E-', beds: 6 }] },
    { code: 'GEN-SURG', name: 'General Surgery Unit', type: 'CLINICAL', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [{ name: 'Surgical Ward', bedPrefix: 'S-', beds: 8 }] },
    { code: 'THEATRE', name: 'Theatre', type: 'SUPPORT', department: 'Surgery/Theatre', services: ['SURGERY'], wards: [] },
    { code: 'MAT', name: 'Maternity Unit', type: 'CLINICAL', department: 'Maternity', services: ['MATERNITY'], wards: [{ name: 'Antenatal Ward', bedPrefix: 'AN-', beds: 5 }, { name: 'Labour Ward', bedPrefix: 'L-', beds: 3 }, { name: 'Postnatal Ward', bedPrefix: 'MT-', beds: 6 }] },
    { code: 'PAED', name: 'Paediatric Unit', type: 'CLINICAL', department: 'Paediatrics', services: ['PAEDIATRICS'], wards: [{ name: 'Paediatric Ward', bedPrefix: 'P-', beds: 8 }] },
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
    { code: 'LAB', name: 'Laboratory Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RAD', name: 'Radiology Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'GEN-WARD', name: 'General Ward', type: 'CLINICAL', department: 'General Ward', services: ['GENERAL_WARD'], wards: [{ name: 'Male General Ward', bedPrefix: 'GM-', beds: 8 }, { name: 'Female General Ward', bedPrefix: 'GF-', beds: 8 }] },
    { code: 'RECORDS', name: 'Records Unit', type: 'ADMINISTRATIVE', department: 'Records', services: [], wards: [] },
  ],
  // -------------------------------------------------- diagnostic centre
  DIAGNOSTIC_CENTRE: [
    { code: 'LAB', name: 'Laboratory Unit', type: 'DIAGNOSTIC', department: 'Laboratory', services: ['LABORATORY'], wards: [] },
    { code: 'RAD', name: 'Radiology Unit', type: 'DIAGNOSTIC', department: 'Radiology', services: ['IMAGING'], wards: [] },
    { code: 'BLOOD', name: 'Blood Bank', type: 'DIAGNOSTIC', department: 'Blood Bank', services: ['BLOOD_BANK'], wards: [] },
  ],
  // -------------------------------------------------------------- pharmacy
  PHARMACY: [
    { code: 'PHARM', name: 'Pharmacy Unit', type: 'SUPPORT', department: 'Pharmacy', services: ['PHARMACY'], wards: [] },
  ],
} as Record<string, SeedUnitDef[]>;

// Deterministic Ghanaian in-charge names + titles for generated units.
const HEAD_POOL = ['Dr. Kwame Asante', 'Dr. Ama Owusu', 'Dr. Kofi Boateng', 'Dr. Efua Mensah', 'Dr. Yaw Agyeman', 'Dr. Akosua Amoah', 'Dr. Kwabena Osei', 'Dr. Abena Darko', 'Mr. Isaac Tetteh', 'Mrs. Faustina Kwarteng', 'Pharm. Ernest Ofori', 'Mr. Daniel Adjei', 'Midwife Grace Asare', 'Dr. Nana Yaa Konadu', 'Mr. Michael Addo', 'Dr. Kwaku Badu', 'Ms. Comfort Duah', 'Dr. Serwaa Owusu'];
const HEAD_TITLE_BY_TYPE: Record<string, string> = {
  CLINICAL: 'Consultant In-Charge',
  DIAGNOSTIC: 'Senior Scientist In-Charge',
  SUPPORT: 'Unit Manager',
  ADMINISTRATIVE: 'Records Officer',
};

/** Deterministic index into HEAD_POOL from a facility/unit pair. */
function headFor(facilityCode: string, unitCode: string): string {
  let h = 0;
  for (let i = 0; i < facilityCode.length; i++) h = (h * 31 + facilityCode.charCodeAt(i)) | 0;
  for (let i = 0; i < unitCode.length; i++) h = (h * 31 + unitCode.charCodeAt(i)) | 0;
  return HEAD_POOL[Math.abs(h) % HEAD_POOL.length]!;
}

/** Scale a base ward bed count to a facility's actual bed capacity. */
function scaleBeds(base: number, bedCapacity: number | null): number {
  const cap = bedCapacity ?? 120;
  const factor = cap >= 1200 ? 1 : cap >= 500 ? 0.85 : cap >= 250 ? 0.7 : cap >= 120 ? 0.55 : cap >= 40 ? 0.4 : 0.25;
  return Math.max(1, Math.round(base * factor));
}

/**
 * The full unit tree for a facility: the hand-written override when one
 * exists (GH-KBTH / GH-KATH / GH-GARH), otherwise the class catalog with
 * ward beds scaled to the facility's capacity and generated in-charge rows.
 */
export function unitsForAllFacilities(
  facilities: Array<{ code: string; type: string; bedCapacity: number | null; name: string }>,
): SeedFacilityUnits[] {
  const overrides = new Map(FACILITY_UNITS.map((f) => [f.facilityCode, f]));
  const out: SeedFacilityUnits[] = [];
  for (const f of facilities) {
    const existing = overrides.get(f.code);
    if (existing) {
      out.push(existing);
      continue;
    }
    // DISTRICT_HOSPITAL reuses the municipal catalog; unknown types fall back
    // to the private-hospital baseline.
    const catalog =
      (f.type === 'DISTRICT_HOSPITAL' ? DEFAULT_UNITS_BY_TYPE['MUNICIPAL_HOSPITAL'] : DEFAULT_UNITS_BY_TYPE[f.type]) ??
      DEFAULT_UNITS_BY_TYPE['PRIVATE_HOSPITAL'];
    const units: SeedUnitDef[] = (catalog ?? []).map((u) => ({
      ...u,
      headName: `${headFor(f.code, u.code)} (synthetic)`,
      headTitle: `${HEAD_TITLE_BY_TYPE[u.type] ?? 'Unit In-Charge'} (${f.name.replace(' (DEMO)', '')})`,
      wards: u.wards.map((w) => ({ ...w, beds: scaleBeds(w.beds, f.bedCapacity) })),
    }));
    out.push({ facilityCode: f.code, units });
  }
  return out;
}
