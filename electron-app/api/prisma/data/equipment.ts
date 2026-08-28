// =====================================================================
// GIHM-HIS — Unit equipment & tools seed (Department → Unit → Equipment)
// ---------------------------------------------------------------------
// DEMO / SYNTHETIC DATA. Quantities, serial numbers, manufacturers and
// maintenance dates below are fictional placeholders for development and
// demonstration only — NOT official hospital asset registers.
//
// Every unit of a given type (an ICU in a teaching hospital or a district
// hospital, a Labour Ward anywhere) is equipped from the same canonical
// kit, scaled down by facility class so a private clinic's theatre has a
// fraction of a teaching hospital's inventory. Units without a kit entry
// simply have no equipment (the admin UI lets staff add it).
// =====================================================================

export interface SeedEquipmentDef {
  name: string; // e.g. "Ventilator"
  category: 'LIFE_SUPPORT' | 'MONITORING' | 'DIAGNOSTIC' | 'SURGICAL' | 'THERAPY' | 'SUPPORT' | 'OTHER';
  quantity: number;
  /** functional = quantity by default; override for realistic in-use/faulty mixes. */
  functional?: number;
  inMaintenance?: number;
  faulty?: number;
  manufacturer?: string;
  model?: string;
  /** days from seed time until next maintenance is due (negative = already due). */
  nextMaintenanceInDays?: number;
}

/**
 * Canonical equipment kit per unit code. Quantities are written for a large
 * teaching hospital (~1500 beds); `equipmentForUnit` scales them per facility
 * class so every seeded facility gets a realistic inventory.
 */
export const EQUIPMENT_BY_CODE: Record<string, SeedEquipmentDef[]> = {
  OPD: [
    { name: 'Consultation Desk Set', category: 'SUPPORT', quantity: 12 },
    { name: 'Patient Examination Couch', category: 'SUPPORT', quantity: 10, inMaintenance: 1 },
    { name: 'Weighing Scale (Adult)', category: 'DIAGNOSTIC', quantity: 6 },
    { name: 'Blood Pressure Monitor', category: 'MONITORING', quantity: 15, functional: 14, inMaintenance: 1 },
    { name: 'Stethoscope', category: 'DIAGNOSTIC', quantity: 18, faulty: 2 },
    { name: 'Pulse Oximeter', category: 'MONITORING', quantity: 10 },
    { name: 'Thermometer (Digital)', category: 'MONITORING', quantity: 20, inMaintenance: 2 },
    { name: 'Glucometer', category: 'DIAGNOSTIC', quantity: 6 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Triage Emergency Trolley', category: 'SUPPORT', quantity: 2 },
  ],
  ER: [
    { name: 'Resuscitation Trolley (Crash Cart)', category: 'LIFE_SUPPORT', quantity: 4, inMaintenance: 1 },
    { name: 'Defibrillator (AED)', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Cardiac Monitor', category: 'MONITORING', quantity: 8, functional: 7, faulty: 1 },
    { name: 'Ventilator (Adult)', category: 'LIFE_SUPPORT', quantity: 6, functional: 5, inMaintenance: 1 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 6 },
    { name: 'Oxygen Cylinder Set', category: 'LIFE_SUPPORT', quantity: 12, nextMaintenanceInDays: -4 },
    { name: 'Trauma Stretcher', category: 'SUPPORT', quantity: 8, inMaintenance: 1 },
    { name: 'Splint Set (Trauma)', category: 'SURGICAL', quantity: 10 },
    { name: 'IV Infusion Pump', category: 'SUPPORT', quantity: 10, functional: 9, inMaintenance: 1 },
    { name: 'Emergency Obstetric Kit', category: 'SURGICAL', quantity: 4 },
    { name: 'Patient Monitor (Multi-param)', category: 'MONITORING', quantity: 8 },
  ],
  ICU: [
    { name: 'Ventilator (Adult ICU)', category: 'LIFE_SUPPORT', quantity: 8, functional: 7, inMaintenance: 1, nextMaintenanceInDays: -6 },
    { name: 'Bedside Cardiac Monitor', category: 'MONITORING', quantity: 10, functional: 9, faulty: 1 },
    { name: 'Defibrillator', category: 'LIFE_SUPPORT', quantity: 2 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 20, inMaintenance: 2 },
    { name: 'Syringe Pump', category: 'SUPPORT', quantity: 16, functional: 15, faulty: 1 },
    { name: 'Central Station Monitor', category: 'MONITORING', quantity: 1 },
    { name: 'Blood Gas Analyser', category: 'DIAGNOSTIC', quantity: 1, nextMaintenanceInDays: -2 },
    { name: 'Portable X-Ray (Chest)', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Crash Cart', category: 'LIFE_SUPPORT', quantity: 2 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 6 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Bedside Ultrasound (POCUS)', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Intra-Aortic Balloon Pump', category: 'LIFE_SUPPORT', quantity: 1, inMaintenance: 1, nextMaintenanceInDays: 5 },
  ],
  NICU: [
    { name: 'Incubator', category: 'LIFE_SUPPORT', quantity: 10, functional: 9, inMaintenance: 1 },
    { name: 'Radiant Warmer', category: 'LIFE_SUPPORT', quantity: 6, faulty: 1 },
    { name: 'Neonatal Ventilator', category: 'LIFE_SUPPORT', quantity: 4, nextMaintenanceInDays: -3 },
    { name: 'CPAP Machine (Neonatal)', category: 'LIFE_SUPPORT', quantity: 6 },
    { name: 'Phototherapy Unit', category: 'THERAPY', quantity: 8, inMaintenance: 1 },
    { name: 'Neonatal Pulse Oximeter', category: 'MONITORING', quantity: 12 },
    { name: 'Neonatal Monitor (Multi-param)', category: 'MONITORING', quantity: 10, functional: 9, faulty: 1 },
    { name: 'Bilirubinometer', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Infusion Pump (Paediatric)', category: 'SUPPORT', quantity: 8 },
    { name: 'Breast Pump (Hospital Grade)', category: 'SUPPORT', quantity: 4 },
  ],
  PAED: [
    { name: 'Paediatric Monitor', category: 'MONITORING', quantity: 8 },
    { name: 'Nebulizer', category: 'THERAPY', quantity: 6, inMaintenance: 1 },
    { name: 'Pulse Oximeter (Paediatric)', category: 'MONITORING', quantity: 10, functional: 9, faulty: 1 },
    { name: 'Infusion Pump (Paediatric)', category: 'SUPPORT', quantity: 10 },
    { name: 'Weighing Scale (Infant)', category: 'DIAGNOSTIC', quantity: 4 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 3 },
    { name: 'Phototherapy Unit', category: 'THERAPY', quantity: 4 },
  ],
  'PAED-MED': [
    { name: 'Paediatric Monitor', category: 'MONITORING', quantity: 8 },
    { name: 'Nebulizer', category: 'THERAPY', quantity: 6, inMaintenance: 1 },
    { name: 'Pulse Oximeter (Paediatric)', category: 'MONITORING', quantity: 10, functional: 9, faulty: 1 },
    { name: 'Infusion Pump (Paediatric)', category: 'SUPPORT', quantity: 10 },
    { name: 'Weighing Scale (Infant)', category: 'DIAGNOSTIC', quantity: 4 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 3 },
  ],
  'PAED-SURG': [
    { name: 'Paediatric Surgical Instrument Set', category: 'SURGICAL', quantity: 6 },
    { name: 'Surgical Suction', category: 'LIFE_SUPPORT', quantity: 3 },
    { name: 'Patient Monitor (Paediatric)', category: 'MONITORING', quantity: 4 },
    { name: 'Wound Care Trolley', category: 'SUPPORT', quantity: 4 },
  ],
  'GEN-MED': [
    { name: 'ECG Machine (12-lead)', category: 'DIAGNOSTIC', quantity: 4, nextMaintenanceInDays: -8 },
    { name: 'BP Monitor (Ward)', category: 'MONITORING', quantity: 12, inMaintenance: 2 },
    { name: 'Pulse Oximeter', category: 'MONITORING', quantity: 12 },
    { name: 'Glucometer', category: 'DIAGNOSTIC', quantity: 6 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 14, functional: 13, faulty: 1 },
    { name: 'Patient Monitor (Multi-param)', category: 'MONITORING', quantity: 8 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 6 },
    { name: 'Weighing Scale', category: 'DIAGNOSTIC', quantity: 4 },
  ],
  CARDIO: [
    { name: 'ECG Machine (12-lead)', category: 'DIAGNOSTIC', quantity: 4, inMaintenance: 1 },
    { name: 'Echocardiogram Machine', category: 'DIAGNOSTIC', quantity: 2, nextMaintenanceInDays: -10 },
    { name: 'Holter Monitor', category: 'MONITORING', quantity: 6 },
    { name: 'Stress Test Treadmill', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Cardiac Monitor', category: 'MONITORING', quantity: 6 },
    { name: 'Defibrillator', category: 'LIFE_SUPPORT', quantity: 2 },
  ],
  DIALYSIS: [
    { name: 'Haemodialysis Machine', category: 'LIFE_SUPPORT', quantity: 12, functional: 11, inMaintenance: 1, nextMaintenanceInDays: -5 },
    { name: 'Reverse Osmosis Water Treatment', category: 'SUPPORT', quantity: 1 },
    { name: 'Dialysis Chair', category: 'SUPPORT', quantity: 12 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 6 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 6 },
    { name: 'Portable Ultrasound (Access)', category: 'DIAGNOSTIC', quantity: 1 },
  ],
  ONCO: [
    { name: 'Chemotherapy Infusion Pump', category: 'SUPPORT', quantity: 12, inMaintenance: 1 },
    { name: 'Biological Safety Cabinet (Cytotoxic)', category: 'SUPPORT', quantity: 2, nextMaintenanceInDays: -4 },
    { name: 'Patient Monitor', category: 'MONITORING', quantity: 8 },
    { name: 'Electronic Weighing Scale', category: 'DIAGNOSTIC', quantity: 4 },
    { name: 'Refrigerator (Vaccine / Cytotoxic Storage)', category: 'SUPPORT', quantity: 2 },
    { name: 'Infusion Pump Stand', category: 'SUPPORT', quantity: 12 },
  ],
  'GEN-SURG': [
    { name: 'Surgical Instrument Set (General)', category: 'SURGICAL', quantity: 12 },
    { name: 'Surgical Suction', category: 'LIFE_SUPPORT', quantity: 6 },
    { name: 'Patient Monitor (Multi-param)', category: 'MONITORING', quantity: 6 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 8 },
    { name: 'Wound Care Trolley', category: 'SUPPORT', quantity: 6 },
    { name: 'Cautery Unit (Bovie)', category: 'SURGICAL', quantity: 2 },
  ],
  // Surgical unit at the regional / municipal level (Ridge, KATH-style wards) —
  // the general-surgery kit sized for a mid-size surgical service.
  SURG: [
    { name: 'Surgical Instrument Set (General)', category: 'SURGICAL', quantity: 8, inMaintenance: 1 },
    { name: 'Surgical Suction', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Patient Monitor (Multi-param)', category: 'MONITORING', quantity: 4 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 6 },
    { name: 'Wound Care Trolley', category: 'SUPPORT', quantity: 4 },
    { name: 'Cautery Unit (Bovie)', category: 'SURGICAL', quantity: 1 },
    { name: 'IV Stand', category: 'SUPPORT', quantity: 12 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 3 },
  ],
  ORTHO: [
    { name: 'Orthopaedic Instrument Set', category: 'SURGICAL', quantity: 8 },
    { name: 'C-Arm Image Intensifier', category: 'DIAGNOSTIC', quantity: 1, nextMaintenanceInDays: -2 },
    { name: 'Traction Frame Set', category: 'SUPPORT', quantity: 6 },
    { name: 'Plaster Saw', category: 'SURGICAL', quantity: 2 },
    { name: 'Patient Monitor', category: 'MONITORING', quantity: 4 },
  ],
  BURNS: [
    { name: 'Burns Dressing Trolley', category: 'SUPPORT', quantity: 4 },
    { name: 'Infection Control Isolation Cart', category: 'SUPPORT', quantity: 2 },
    { name: 'Patient Monitor', category: 'MONITORING', quantity: 4 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 6 },
    { name: 'Skin Graft Instrument Set', category: 'SURGICAL', quantity: 2 },
  ],
  THEATRE: [
    { name: 'Anaesthesia Machine', category: 'LIFE_SUPPORT', quantity: 5, functional: 4, inMaintenance: 1, nextMaintenanceInDays: -7 },
    { name: 'Operating Table', category: 'SUPPORT', quantity: 5 },
    { name: 'Surgical Light (Ceiling)', category: 'SUPPORT', quantity: 5 },
    { name: 'Diathermy Unit', category: 'SURGICAL', quantity: 4, faulty: 1 },
    { name: 'Surgical Suction', category: 'LIFE_SUPPORT', quantity: 5 },
    { name: 'Surgical Instrument Set (Major)', category: 'SURGICAL', quantity: 20, inMaintenance: 2 },
    { name: 'Laparoscopy Tower', category: 'SURGICAL', quantity: 2 },
    { name: 'Patient Monitor (Theatre)', category: 'MONITORING', quantity: 5 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 10 },
    { name: 'Autoclave (CSSD)', category: 'SUPPORT', quantity: 3, nextMaintenanceInDays: -3 },
    { name: 'Defibrillator', category: 'LIFE_SUPPORT', quantity: 2 },
    { name: 'Instrument Steriliser (Flash)', category: 'SUPPORT', quantity: 2 },
  ],
  CSSD: [
    { name: 'Large Autoclave (Steam Steriliser)', category: 'SUPPORT', quantity: 4, functional: 3, inMaintenance: 1, nextMaintenanceInDays: -5 },
    { name: 'Washer-Disinfector', category: 'SUPPORT', quantity: 2 },
    { name: 'Ultrasonic Cleaner', category: 'SUPPORT', quantity: 2 },
    { name: 'Heat Sealer', category: 'SUPPORT', quantity: 3 },
    { name: 'Instrument Trays & Wrapping Station', category: 'SUPPORT', quantity: 20 },
  ],
  'MAT-ANTE': [
    { name: 'Foetal Doppler', category: 'MONITORING', quantity: 8, inMaintenance: 1 },
    { name: 'CTG Monitor', category: 'MONITORING', quantity: 4, nextMaintenanceInDays: -2 },
    { name: 'Portable Ultrasound (Obstetric)', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 6 },
    { name: 'Weighing Scale (Maternal)', category: 'DIAGNOSTIC', quantity: 4 },
  ],
  'MAT-LABOUR': [
    { name: 'Delivery Bed', category: 'SUPPORT', quantity: 8 },
    { name: 'CTG Monitor', category: 'MONITORING', quantity: 6, functional: 5, inMaintenance: 1 },
    { name: 'Foetal Doppler', category: 'MONITORING', quantity: 6 },
    { name: 'Neonatal Resuscitaire', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Infant Radiant Warmer', category: 'LIFE_SUPPORT', quantity: 4, inMaintenance: 1 },
    { name: 'Vacuum Extractor', category: 'SURGICAL', quantity: 3 },
    { name: 'Obstetric Forceps Set', category: 'SURGICAL', quantity: 3 },
    { name: 'Emergency Obstetric Kit', category: 'SURGICAL', quantity: 6 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Oxygen Cylinder Set', category: 'LIFE_SUPPORT', quantity: 6 },
  ],
  'MAT-POST': [
    { name: 'Baby Crib', category: 'SUPPORT', quantity: 16 },
    { name: 'Infant Radiant Warmer', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Phototherapy Unit', category: 'THERAPY', quantity: 4 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 4 },
    { name: 'Weighing Scale (Infant)', category: 'DIAGNOSTIC', quantity: 4 },
    { name: 'Breast Pump (Hospital Grade)', category: 'SUPPORT', quantity: 4 },
  ],
  MAT: [
    { name: 'Delivery Bed', category: 'SUPPORT', quantity: 6 },
    { name: 'CTG Monitor', category: 'MONITORING', quantity: 5, inMaintenance: 1 },
    { name: 'Foetal Doppler', category: 'MONITORING', quantity: 6 },
    { name: 'Neonatal Resuscitaire', category: 'LIFE_SUPPORT', quantity: 3 },
    { name: 'Infant Radiant Warmer', category: 'LIFE_SUPPORT', quantity: 3 },
    { name: 'Vacuum Extractor', category: 'SURGICAL', quantity: 2 },
    { name: 'Obstetric Forceps Set', category: 'SURGICAL', quantity: 2 },
    { name: 'Emergency Obstetric Kit', category: 'SURGICAL', quantity: 4 },
    { name: 'Portable Ultrasound (Obstetric)', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 3 },
    { name: 'Oxygen Cylinder Set', category: 'LIFE_SUPPORT', quantity: 4 },
  ],
  MATERNITY: [
    { name: 'Delivery Bed', category: 'SUPPORT', quantity: 2 },
    { name: 'Foetal Doppler', category: 'MONITORING', quantity: 2 },
    { name: 'Neonatal Resuscitaire', category: 'LIFE_SUPPORT', quantity: 1 },
    { name: 'Emergency Obstetric Kit', category: 'SURGICAL', quantity: 2 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 1 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 2 },
    { name: 'Weighing Scale (Infant)', category: 'DIAGNOSTIC', quantity: 1 },
  ],
  GYNAE: [
    { name: 'Gynaecology Examination Table', category: 'SUPPORT', quantity: 6 },
    { name: 'Colposcope', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Hysteroscope Set', category: 'SURGICAL', quantity: 2 },
    { name: 'Speculum Set', category: 'SURGICAL', quantity: 20, inMaintenance: 2 },
    { name: 'Ultrasound (Gynaecology)', category: 'DIAGNOSTIC', quantity: 1 },
  ],
  'PHARM-OPD': [
    { name: 'Dispensing Counter', category: 'SUPPORT', quantity: 8 },
    { name: 'Refrigerator (Cold Chain)', category: 'SUPPORT', quantity: 4, nextMaintenanceInDays: -1 },
    { name: 'Cash Register / POS', category: 'OTHER', quantity: 6 },
    { name: 'Prescription Printer', category: 'OTHER', quantity: 4 },
  ],
  'PHARM-INPT': [
    { name: 'Unit-Dose Cart', category: 'SUPPORT', quantity: 6 },
    { name: 'Refrigerator (Cold Chain)', category: 'SUPPORT', quantity: 3 },
    { name: 'Safety Cabinet (Hazardous Drugs)', category: 'SUPPORT', quantity: 1 },
    { name: 'Tablet Counting Machine', category: 'SUPPORT', quantity: 2 },
  ],
  PHARM: [
    { name: 'Dispensing Counter', category: 'SUPPORT', quantity: 6 },
    { name: 'Refrigerator (Cold Chain)', category: 'SUPPORT', quantity: 3, nextMaintenanceInDays: -1 },
    { name: 'Cash Register / POS', category: 'OTHER', quantity: 4 },
    { name: 'Prescription Printer', category: 'OTHER', quantity: 2 },
    { name: 'Safety Cabinet', category: 'SUPPORT', quantity: 1 },
  ],
  'LAB-MAIN': [
    { name: 'Haematology Analyser', category: 'DIAGNOSTIC', quantity: 2, nextMaintenanceInDays: -9 },
    { name: 'Biochemistry Analyser', category: 'DIAGNOSTIC', quantity: 2, inMaintenance: 1 },
    { name: 'Centrifuge', category: 'DIAGNOSTIC', quantity: 6, functional: 5, faulty: 1 },
    { name: 'Microscope (Binocular)', category: 'DIAGNOSTIC', quantity: 8, inMaintenance: 1 },
    { name: 'Autoclave', category: 'SUPPORT', quantity: 2 },
    { name: 'Refrigerator (Sample Storage)', category: 'SUPPORT', quantity: 4 },
    { name: 'Blood Gas Analyser', category: 'DIAGNOSTIC', quantity: 1, nextMaintenanceInDays: -2 },
    { name: 'Urine Analyser', category: 'DIAGNOSTIC', quantity: 2 },
  ],
  'LAB-MICRO': [
    { name: 'Biosafety Cabinet (Class II)', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Microscope (Binocular)', category: 'DIAGNOSTIC', quantity: 4 },
    { name: 'Incubator (Culture)', category: 'DIAGNOSTIC', quantity: 3 },
    { name: 'Autoclave', category: 'SUPPORT', quantity: 2 },
    { name: 'Gram Stain Station', category: 'DIAGNOSTIC', quantity: 2 },
  ],
  LAB: [
    { name: 'Haematology Analyser', category: 'DIAGNOSTIC', quantity: 2, nextMaintenanceInDays: -5 },
    { name: 'Biochemistry Analyser', category: 'DIAGNOSTIC', quantity: 2, inMaintenance: 1 },
    { name: 'Centrifuge', category: 'DIAGNOSTIC', quantity: 4, functional: 3, faulty: 1 },
    { name: 'Microscope (Binocular)', category: 'DIAGNOSTIC', quantity: 6, inMaintenance: 1 },
    { name: 'Urine Analyser', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Refrigerator (Sample Storage)', category: 'SUPPORT', quantity: 3 },
    { name: 'Autoclave', category: 'SUPPORT', quantity: 1 },
  ],
  'RAD-XRAY': [
    { name: 'X-Ray Machine (Fixed)', category: 'DIAGNOSTIC', quantity: 3, functional: 2, inMaintenance: 1 },
    { name: 'Portable X-Ray', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'CR Reader / DR Console', category: 'DIAGNOSTIC', quantity: 3 },
    { name: 'Lead Apron Set', category: 'SUPPORT', quantity: 8, inMaintenance: 1 },
    { name: 'Film / Image Printer', category: 'OTHER', quantity: 2 },
  ],
  'RAD-ULTRA': [
    { name: 'Ultrasound Machine', category: 'DIAGNOSTIC', quantity: 4, functional: 3, inMaintenance: 1, nextMaintenanceInDays: -4 },
    { name: 'Transducer Set', category: 'DIAGNOSTIC', quantity: 8 },
    { name: 'Report Workstation', category: 'OTHER', quantity: 4 },
  ],
  RAD: [
    { name: 'X-Ray Machine (Fixed)', category: 'DIAGNOSTIC', quantity: 2, functional: 1, inMaintenance: 1 },
    { name: 'Ultrasound Machine', category: 'DIAGNOSTIC', quantity: 2, nextMaintenanceInDays: -3 },
    { name: 'CR Reader / DR Console', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Lead Apron Set', category: 'SUPPORT', quantity: 6 },
    { name: 'Transducer Set', category: 'DIAGNOSTIC', quantity: 4 },
  ],
  BLOOD: [
    { name: 'Blood Bank Refrigerator', category: 'SUPPORT', quantity: 3, nextMaintenanceInDays: -1 },
    { name: 'Plasma Freezer', category: 'SUPPORT', quantity: 2 },
    { name: 'Centrifuge (Blood)', category: 'DIAGNOSTIC', quantity: 3, inMaintenance: 1 },
    { name: 'Blood Bag Sealer', category: 'SUPPORT', quantity: 2 },
    { name: 'Agglutination Viewer', category: 'DIAGNOSTIC', quantity: 3 },
    { name: 'Platelet Agitator', category: 'SUPPORT', quantity: 1 },
  ],
  PHYSIO: [
    { name: 'Treatment Table', category: 'SUPPORT', quantity: 8, inMaintenance: 1 },
    { name: 'Ultrasound Therapy Unit', category: 'THERAPY', quantity: 4 },
    { name: 'TENS Unit', category: 'THERAPY', quantity: 6 },
    { name: 'Exercise Bicycle', category: 'THERAPY', quantity: 3 },
    { name: 'Parallel Bars (Gait Training)', category: 'THERAPY', quantity: 1 },
    { name: 'Traction Table', category: 'THERAPY', quantity: 2 },
    { name: 'Walking Frame Set', category: 'SUPPORT', quantity: 10 },
  ],
  DENTAL: [
    { name: 'Dental Chair Unit', category: 'SUPPORT', quantity: 6, inMaintenance: 1 },
    { name: 'Dental X-Ray (RVG)', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Dental Autoclave', category: 'SUPPORT', quantity: 2 },
    { name: 'Handpiece Set (High/Low Speed)', category: 'SURGICAL', quantity: 10 },
    { name: 'Light Cure Unit', category: 'SURGICAL', quantity: 4 },
    { name: 'Dental Suction', category: 'SUPPORT', quantity: 4 },
  ],
  OPHTH: [
    { name: 'Slit Lamp', category: 'DIAGNOSTIC', quantity: 3, nextMaintenanceInDays: -3 },
    { name: 'Ophthalmoscope Set', category: 'DIAGNOSTIC', quantity: 6 },
    { name: 'Retinoscope', category: 'DIAGNOSTIC', quantity: 3 },
    { name: 'Tonometer', category: 'DIAGNOSTIC', quantity: 3 },
    { name: 'Lensometer', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Examination Chair', category: 'SUPPORT', quantity: 4 },
  ],
  ENT: [
    { name: 'ENT Examination Chair', category: 'SUPPORT', quantity: 3 },
    { name: 'Otoscope Set', category: 'DIAGNOSTIC', quantity: 6 },
    { name: 'Laryngoscope Set', category: 'SURGICAL', quantity: 3 },
    { name: 'Nasal Endoscope', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'ENT Suction', category: 'SUPPORT', quantity: 2 },
    { name: 'Audiameter', category: 'DIAGNOSTIC', quantity: 1 },
  ],
  DERMA: [
    { name: 'Dermoscope', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Cryotherapy Unit', category: 'THERAPY', quantity: 1 },
    { name: 'Phototherapy Unit (UV)', category: 'THERAPY', quantity: 1 },
    { name: 'Examination Couch', category: 'SUPPORT', quantity: 4 },
  ],
  PSYCH: [
    { name: 'Consultation Room Set', category: 'SUPPORT', quantity: 4 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 2 },
    { name: 'Weighing Scale', category: 'DIAGNOSTIC', quantity: 1 },
  ],
  NUTRITION: [
    { name: 'Dietary Weighing Scale', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Industrial Blender', category: 'SUPPORT', quantity: 2 },
    { name: 'Refrigerator (Dietary)', category: 'SUPPORT', quantity: 2 },
    { name: 'Diet Planning Workstation', category: 'OTHER', quantity: 2 },
  ],
  RECORDS: [
    { name: 'Filing Cabinet (Medical Records)', category: 'SUPPORT', quantity: 20 },
    { name: 'Computer Workstation', category: 'OTHER', quantity: 6 },
    { name: 'Document Scanner', category: 'OTHER', quantity: 2 },
    { name: 'Barcode / Label Printer', category: 'OTHER', quantity: 2 },
    { name: 'Office Printer', category: 'OTHER', quantity: 2 },
  ],
  'GEN-WARD': [
    { name: 'Ward Bed Set', category: 'SUPPORT', quantity: 24 },
    { name: 'BP Monitor (Ward)', category: 'MONITORING', quantity: 6 },
    { name: 'Pulse Oximeter', category: 'MONITORING', quantity: 8 },
    { name: 'Infusion Pump', category: 'SUPPORT', quantity: 8 },
    { name: 'Patient Monitor (Multi-param)', category: 'MONITORING', quantity: 4 },
    { name: 'Oxygen Concentrator', category: 'LIFE_SUPPORT', quantity: 4 },
    { name: 'Suction Machine', category: 'LIFE_SUPPORT', quantity: 2 },
    { name: 'Weighing Scale', category: 'DIAGNOSTIC', quantity: 2 },
  ],
  MCH: [
    { name: 'Weighing Scale (Infant)', category: 'DIAGNOSTIC', quantity: 2 },
    { name: 'Foetal Doppler', category: 'MONITORING', quantity: 2 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 2 },
    { name: 'Vaccine Refrigerator (Cold Chain)', category: 'SUPPORT', quantity: 1 },
    { name: 'Thermometer (Digital)', category: 'MONITORING', quantity: 4 },
    { name: 'Immunization Tray Set', category: 'SUPPORT', quantity: 2 },
  ],
  CHPS: [
    { name: 'Examination Couch', category: 'SUPPORT', quantity: 1 },
    { name: 'BP Monitor', category: 'MONITORING', quantity: 1 },
    { name: 'Weighing Scale (Infant)', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Thermometer (Digital)', category: 'MONITORING', quantity: 2 },
    { name: 'Glucometer', category: 'DIAGNOSTIC', quantity: 1 },
    { name: 'Vaccine Carrier (Cold Chain)', category: 'SUPPORT', quantity: 2 },
    { name: 'Basic Delivery Kit', category: 'SURGICAL', quantity: 1 },
    { name: 'Portable Weighing Scale', category: 'DIAGNOSTIC', quantity: 1 },
  ],
};

/** Facility class → equipment quantity multiplier (teaching = baseline 1). */
export const EQUIPMENT_SCALE_BY_TYPE: Record<string, number> = {
  TEACHING_HOSPITAL: 1,
  REGIONAL_HOSPITAL: 0.8,
  MUNICIPAL_HOSPITAL: 0.6,
  DISTRICT_HOSPITAL: 0.55,
  MISSION_HOSPITAL: 0.6,
  PRIVATE_HOSPITAL: 0.5,
  POLYCLINIC: 0.4,
  HEALTH_CENTRE: 0.35,
  CHPS_COMPOUND: 0.3,
  DIAGNOSTIC_CENTRE: 0.5,
  PHARMACY: 0.4,
};

/**
 * The kit for a unit, scaled to its facility class. Quantities floor at 1 and
 * the functional / in-maintenance / faulty mix is re-derived so the counts
 * always sum to the scaled quantity.
 */
export function equipmentForUnit(unitCode: string, facilityType: string): SeedEquipmentDef[] {
  const kit = EQUIPMENT_BY_CODE[unitCode];
  if (!kit) return [];
  const factor = EQUIPMENT_SCALE_BY_TYPE[facilityType] ?? 0.5;
  if (factor >= 1) return kit;
  return kit.map((e) => {
    const quantity = Math.max(1, Math.round(e.quantity * factor));
    const inMaintenance = Math.min(quantity, Math.round((e.inMaintenance ?? 0) * factor));
    const faulty = Math.min(quantity - inMaintenance, Math.round((e.faulty ?? 0) * factor));
    const { functional: _f, ...rest } = e;
    void _f;
    return { ...rest, quantity, inMaintenance, faulty, functional: quantity - inMaintenance - faulty };
  });
}
