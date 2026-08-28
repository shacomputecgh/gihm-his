// =====================================================================
// Insurance registry seed — DEMO / SYNTHETIC DATA ONLY (spec §155)
// The national insurer registry (NHIS + private + corporate schemes) that
// every facility bills against. All names below are public institutions
// or fictional placeholders used only for demonstration.
// =====================================================================

export interface InsuranceSchemeSeed {
  code: string;
  name: string;
  type: 'NHIS' | 'PRIVATE' | 'CORPORATE';
  phone?: string;
  email?: string;
  notes?: string;
}

export const INSURANCE_SCHEMES: InsuranceSchemeSeed[] = [
  {
    code: 'NHIS',
    name: 'National Health Insurance Scheme',
    type: 'NHIS',
    phone: '0302-222345',
    email: 'info@nhis.gov.gh',
    notes: 'National statutory health insurance — members present the NHIS card / Ghana Card-linked membership.',
  },
  {
    code: 'NATIONWIDE',
    name: 'Nationwide Medical Insurance (Nationwide)',
    type: 'PRIVATE',
    phone: '0302-766766',
    email: 'claims@nationwidemedical.com',
    notes: 'Private medical insurer with corporate + individual plans.',
  },
  {
    code: 'GLICO',
    name: 'GLICO Healthcare',
    type: 'PRIVATE',
    phone: '0302-763041',
    email: 'claims@glicohealthcare.com',
    notes: 'Private health insurer — HMO plans across Ghana.',
  },
  {
    code: 'ACACIA',
    name: 'Acacia Health Insurance',
    type: 'PRIVATE',
    phone: '0302-907070',
    email: 'claims@acaciahealth.com',
    notes: 'Private HMO serving individuals, families and employers.',
  },
  {
    code: 'PREMIER',
    name: 'Premier Healthcare (Vanguard)',
    type: 'PRIVATE',
    phone: '0302-252525',
    email: 'claims@premierhealth.gh',
    notes: 'Private health plan with nationwide hospital networks.',
  },
  {
    code: 'GEF-CORP',
    name: 'Golden Exotic Farms Corporate Scheme',
    type: 'CORPORATE',
    phone: '0302-774411',
    email: 'benefits@gef.gh',
    notes: 'Employer-funded health plan for Golden Exotic Farms staff and dependants.',
  },
  {
    code: 'VALCO-CORP',
    name: 'Valco Corporate Health Plan',
    type: 'CORPORATE',
    phone: '0302-766300',
    email: 'benefits@valco.gh',
    notes: 'Employer-funded health plan for VALCO employees.',
  },
];

// Membership coverage for the seeded patient cohort (indexed by patient
// list index — see seed.ts patientDefs). Rows the seed applies when the
// patient exists; membership numbers are synthetic.
export const SEED_MEMBERSHIPS: Array<{ patientIdx: number; schemeCode: string; membershipNumber: string; relationship?: 'SELF' | 'SPOUSE' | 'CHILD' | 'DEPENDENT'; verified?: boolean; status?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'; validYears?: number }> = [
  { patientIdx: 0, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000010', verified: true },
  { patientIdx: 1, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000011', verified: true },
  { patientIdx: 2, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000012', verified: true, status: 'EXPIRED' },
  { patientIdx: 3, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000013', verified: true },
  { patientIdx: 4, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000014', verified: false },
  { patientIdx: 5, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000015', verified: true },
  { patientIdx: 6, schemeCode: 'NATIONWIDE', membershipNumber: 'NWM-2026-0042', verified: true },
  { patientIdx: 7, schemeCode: 'GLICO', membershipNumber: 'GHC-88231', verified: true },
  { patientIdx: 8, schemeCode: 'ACACIA', membershipNumber: 'ACA-55120', verified: false },
  { patientIdx: 9, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000019', verified: true, status: 'SUSPENDED' },
  { patientIdx: 10, schemeCode: 'PREMIER', membershipNumber: 'PMH-7712', verified: true },
  { patientIdx: 11, schemeCode: 'GEF-CORP', membershipNumber: 'GEF-0188', verified: true },
  { patientIdx: 12, schemeCode: 'NHIS', membershipNumber: 'NHIS-10000022', verified: true },
  { patientIdx: 13, schemeCode: 'VALCO-CORP', membershipNumber: 'VLC-0333', verified: true },
];
