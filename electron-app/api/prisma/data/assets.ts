// =====================================================================
// Fixed-asset register seed — DEMO / SYNTHETIC DATA ONLY (spec §155)
// Facility-level assets (buildings, vehicles, IT, plant, furniture) with
// realistic Ghanaian acquisition costs. All rows are fictional placeholders
// for demonstration. Depreciation is derived at read time, so the seed only
// supplies purchase facts.
// =====================================================================

export interface AssetSeed {
  name: string;
  category: 'BUILDING' | 'VEHICLE' | 'IT' | 'MEDICAL' | 'PLANT' | 'FURNITURE' | 'OTHER';
  description?: string;
  manufacturer?: string;
  model?: string;
  /** Acquisition date as days ago (negative = future, not used). */
  acquiredDaysAgo: number;
  purchaseCost: number;
  salvageValue?: number;
  usefulLifeYears: number;
  location?: string;
  custodian?: string;
  status?: 'ACTIVE' | 'IN_STORAGE' | 'DISPOSED';
  disposalNote?: string;
  notes?: string;
}

export const FACILITY_ASSETS: Array<{ facilityCode: string; assets: AssetSeed[] }> = [
  {
    facilityCode: 'GH-KBTH',
    assets: [
      // --- Buildings ---
      { name: 'Maternity Block', category: 'BUILDING', description: 'Maternity & obstetric ward block', acquiredDaysAgo: 5400, purchaseCost: 4200000, salvageValue: 500000, usefulLifeYears: 40, location: 'Main campus', custodian: 'Estates Dept' },
      { name: 'Surgical Theatre Block', category: 'BUILDING', description: 'Operating theatres + CSSD', acquiredDaysAgo: 4200, purchaseCost: 3800000, salvageValue: 400000, usefulLifeYears: 40, location: 'Main campus', custodian: 'Estates Dept' },
      { name: 'Outpatient Department Building', category: 'BUILDING', description: 'OPD consulting + records wing', acquiredDaysAgo: 3000, purchaseCost: 1900000, salvageValue: 200000, usefulLifeYears: 40, location: 'Main campus', custodian: 'Estates Dept' },
      { name: 'Administration Block', category: 'BUILDING', description: 'Hospital administration offices', acquiredDaysAgo: 6500, purchaseCost: 1500000, salvageValue: 150000, usefulLifeYears: 40, location: 'Main campus', custodian: 'Estates Dept' },
      // --- Vehicles ---
      { name: 'Staff Shuttle Bus 1', category: 'VEHICLE', manufacturer: 'Toyota', model: 'Coaster 30-seater', acquiredDaysAgo: 2100, purchaseCost: 420000, salvageValue: 40000, usefulLifeYears: 10, location: 'Transport yard', custodian: 'Transport Officer' },
      { name: 'Staff Shuttle Bus 2', category: 'VEHICLE', manufacturer: 'Hyundai', model: 'County 29-seater', acquiredDaysAgo: 1200, purchaseCost: 380000, salvageValue: 30000, usefulLifeYears: 10, location: 'Transport yard', custodian: 'Transport Officer' },
      { name: 'Utility Pickup (Estates)', category: 'VEHICLE', manufacturer: 'Isuzu', model: 'D-Max', acquiredDaysAgo: 900, purchaseCost: 210000, salvageValue: 20000, usefulLifeYears: 8, location: 'Estates yard', custodian: 'Estates Dept' },
      { name: 'Cold-chain Delivery Van', category: 'VEHICLE', manufacturer: 'Toyota', model: 'Hiace Refrigerated', acquiredDaysAgo: 1600, purchaseCost: 260000, salvageValue: 20000, usefulLifeYears: 8, location: 'Transport yard', custodian: 'Pharmacy' },
      // --- IT ---
      { name: 'Hospital Core Server', category: 'IT', manufacturer: 'Dell', model: 'PowerEdge R750', acquiredDaysAgo: 700, purchaseCost: 180000, salvageValue: 10000, usefulLifeYears: 6, location: 'Server room', custodian: 'IT Dept' },
      { name: 'Backup Storage Array', category: 'IT', manufacturer: 'NetApp', model: 'FAS2750', acquiredDaysAgo: 500, purchaseCost: 140000, salvageValue: 8000, usefulLifeYears: 6, location: 'Server room', custodian: 'IT Dept' },
      { name: 'Network Core Switches (2x)', category: 'IT', manufacturer: 'Cisco', model: 'Catalyst 9500', acquiredDaysAgo: 800, purchaseCost: 90000, salvageValue: 5000, usefulLifeYears: 7, location: 'Server room', custodian: 'IT Dept' },
      { name: 'Desktop Workstation Fleet (50x)', category: 'IT', manufacturer: 'HP', model: 'ProDesk 400', acquiredDaysAgo: 1100, purchaseCost: 160000, salvageValue: 15000, usefulLifeYears: 5, location: 'Across departments', custodian: 'IT Dept' },
      { name: 'EMR Server (Ward Terminals)', category: 'IT', manufacturer: 'Lenovo', model: 'ThinkSystem SR650', acquiredDaysAgo: 350, purchaseCost: 130000, salvageValue: 8000, usefulLifeYears: 6, location: 'Server room', custodian: 'IT Dept' },
      // --- Plant / utilities ---
      { name: 'Standby Diesel Generator 500kVA', category: 'PLANT', manufacturer: 'Caterpillar', model: 'C18', acquiredDaysAgo: 2600, purchaseCost: 520000, salvageValue: 50000, usefulLifeYears: 20, location: 'Power house', custodian: 'Works Dept' },
      { name: 'Backup Generator 250kVA', category: 'PLANT', manufacturer: 'Perkins', model: '2506', acquiredDaysAgo: 1800, purchaseCost: 310000, salvageValue: 30000, usefulLifeYears: 20, location: 'Power house', custodian: 'Works Dept' },
      { name: 'Medical Air Compressor Plant', category: 'PLANT', manufacturer: 'Atlas Copco', model: 'GA 37', acquiredDaysAgo: 1400, purchaseCost: 160000, salvageValue: 12000, usefulLifeYears: 15, location: 'Theatre annex', custodian: 'Works Dept' },
      { name: 'Boiler House Equipment', category: 'PLANT', manufacturer: 'Miura', model: 'EX-100', acquiredDaysAgo: 2300, purchaseCost: 240000, salvageValue: 20000, usefulLifeYears: 18, location: 'Boiler house', custodian: 'Works Dept' },
      { name: 'Passenger Lift (OPD Block)', category: 'PLANT', manufacturer: 'KONE', model: 'N Mini Space', acquiredDaysAgo: 1500, purchaseCost: 220000, salvageValue: 15000, usefulLifeYears: 20, location: 'OPD block', custodian: 'Works Dept' },
      { name: 'Ward Lifts (2x Maternity)', category: 'PLANT', manufacturer: 'Otis', model: 'Gen2', acquiredDaysAgo: 2000, purchaseCost: 380000, salvageValue: 25000, usefulLifeYears: 20, location: 'Maternity block', custodian: 'Works Dept' },
      // --- Furniture & fittings ---
      { name: 'Ward Bed Base Fleet (120x)', category: 'FURNITURE', manufacturer: 'Stryker', model: 'Prime Series', acquiredDaysAgo: 1300, purchaseCost: 360000, salvageValue: 40000, usefulLifeYears: 10, location: 'All wards', custodian: 'Nursing Services' },
      { name: 'Office Desk & Chair Set (80x)', category: 'FURNITURE', description: 'Administrative office furniture', manufacturer: 'Multiline', model: 'Executive Range', acquiredDaysAgo: 1700, purchaseCost: 120000, salvageValue: 15000, usefulLifeYears: 8, location: 'Admin block', custodian: 'Admin Services' },
      { name: 'Reception & Waiting Area Seating', category: 'FURNITURE', manufacturer: 'Concept', model: 'Public Range', acquiredDaysAgo: 1000, purchaseCost: 85000, salvageValue: 8000, usefulLifeYears: 8, location: 'OPD reception', custodian: 'Admin Services' },
      { name: 'Laboratory Bench & Cabinetry', category: 'FURNITURE', manufacturer: 'LabPro', model: 'Modular', acquiredDaysAgo: 900, purchaseCost: 95000, salvageValue: 8000, usefulLifeYears: 12, location: 'Laboratory', custodian: 'Laboratory' },
    ],
  },
  {
    facilityCode: 'GH-KATH',
    assets: [
      { name: 'Paediatric Ward Block', category: 'BUILDING', acquiredDaysAgo: 3900, purchaseCost: 2600000, salvageValue: 250000, usefulLifeYears: 40, location: 'Main campus', custodian: 'Estates' },
      { name: 'Staff Transport Bus', category: 'VEHICLE', manufacturer: 'Toyota', model: 'Coaster', acquiredDaysAgo: 1500, purchaseCost: 380000, salvageValue: 30000, usefulLifeYears: 10, location: 'Transport yard', custodian: 'Transport' },
      { name: 'Imaging Wing Server & PACS', category: 'IT', manufacturer: 'Fujitsu', model: 'Primergy', acquiredDaysAgo: 600, purchaseCost: 150000, salvageValue: 10000, usefulLifeYears: 6, location: 'Imaging', custodian: 'IT' },
      { name: 'Standby Generator 300kVA', category: 'PLANT', manufacturer: 'Cummins', model: 'C300', acquiredDaysAgo: 1900, purchaseCost: 340000, salvageValue: 30000, usefulLifeYears: 20, location: 'Power house', custodian: 'Works' },
      { name: 'Ward Bed Fleet (90x)', category: 'FURNITURE', manufacturer: 'Stryker', model: 'Prime Series', acquiredDaysAgo: 1100, purchaseCost: 270000, salvageValue: 25000, usefulLifeYears: 10, location: 'All wards', custodian: 'Nursing' },
      { name: 'Pharmacy Cold Room', category: 'PLANT', manufacturer: 'GEA', model: 'Coldstore', acquiredDaysAgo: 800, purchaseCost: 190000, salvageValue: 15000, usefulLifeYears: 15, location: 'Pharmacy', custodian: 'Pharmacy' },
    ],
  },
  {
    facilityCode: 'GH-GARH',
    assets: [
      { name: 'Outpatient Services Building', category: 'BUILDING', acquiredDaysAgo: 2800, purchaseCost: 1500000, salvageValue: 150000, usefulLifeYears: 40, location: 'Main campus', custodian: 'Estates' },
      { name: 'Regional Health Van', category: 'VEHICLE', manufacturer: 'Ford', model: 'Transit', acquiredDaysAgo: 1300, purchaseCost: 240000, salvageValue: 20000, usefulLifeYears: 8, location: 'Transport yard', custodian: 'Transport' },
      { name: 'District Records Server', category: 'IT', manufacturer: 'Dell', model: 'PowerEdge T550', acquiredDaysAgo: 450, purchaseCost: 90000, salvageValue: 6000, usefulLifeYears: 6, location: 'Records office', custodian: 'IT' },
      { name: 'Water Treatment Plant', category: 'PLANT', manufacturer: 'Grundfos', model: 'Hydro 2000', acquiredDaysAgo: 1600, purchaseCost: 130000, salvageValue: 10000, usefulLifeYears: 15, location: 'Utility yard', custodian: 'Works' },
    ],
  },
];
