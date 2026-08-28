// =============================================================================
// Live indicator computation (docs/14 §3) — shared by the report builder
// (/reports) and the DHIMS2 national adapter (/integrations/dhims2).
//
// Values are computed live from this platform's own records — never re-entered
// manually (spec §50). The demo DHIMS-II codes are synthetic: the authoritative
// national indicator register would replace them at deployment.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { optStr } from '../../lib/validate.js';
import { dashboardScope, facilityScope, patientScope } from '../../lib/scope.js';
import { immunizationScope } from '../immunization/scope.js';
import type { AuthUser } from '../../types.js';

export interface IndicatorDef {
  code: string;
  name: string;
  group: string;
  unit: string;
  /** Synthetic DHIMS-II area code (1A…12C) — see docs/14. */
  dhims2Code: string;
  /** False = the underlying data is not yet collected on the platform. */
  collected: boolean;
}

export const INDICATORS: IndicatorDef[] = [
  // ---- Outpatient
  { code: 'OPD_ATTENDANCE', name: 'OPD attendance', group: 'Outpatient', unit: 'visits', dhims2Code: '1A', collected: true },
  { code: 'OPD_NEW', name: 'New OPD patients', group: 'Outpatient', unit: 'patients', dhims2Code: '1B', collected: true },
  { code: 'OPD_REVISIT', name: 'Revisit attendance', group: 'Outpatient', unit: 'visits', dhims2Code: '1C', collected: true },
  // ---- Inpatient
  { code: 'ADMISSIONS', name: 'Inpatient admissions', group: 'Inpatient', unit: 'admissions', dhims2Code: '4A', collected: true },
  { code: 'DISCHARGES', name: 'Inpatient discharges', group: 'Inpatient', unit: 'discharges', dhims2Code: '4B', collected: true },
  { code: 'BED_OCCUPANCY_RATE', name: 'Bed occupancy rate (current)', group: 'Inpatient', unit: '%', dhims2Code: '4E', collected: true },
  // ---- Maternity & reproductive health
  { code: 'MATERNITY_ADMISSIONS', name: 'Maternity admissions', group: 'Maternity & RH', unit: 'admissions', dhims2Code: '2D', collected: true },
  { code: 'CAESAREAN_SECTIONS', name: 'Caesarean sections', group: 'Maternity & RH', unit: 'procedures', dhims2Code: '2I', collected: false },
  { code: 'ANC_REGISTRATIONS', name: 'ANC registrations', group: 'Maternity & RH', unit: 'registrations', dhims2Code: '2A', collected: false },
  // ---- Immunization (doses administered in the period)
  { code: 'IMM_BCG', name: 'BCG doses given', group: 'Immunization', unit: 'doses', dhims2Code: '3A', collected: true },
  { code: 'IMM_PENTA1', name: 'Pentavalent 1 doses', group: 'Immunization', unit: 'doses', dhims2Code: '3B', collected: true },
  { code: 'IMM_PENTA3', name: 'Pentavalent 3 doses', group: 'Immunization', unit: 'doses', dhims2Code: '3C', collected: true },
  { code: 'IMM_OPV3', name: 'OPV 3 doses', group: 'Immunization', unit: 'doses', dhims2Code: '3D', collected: true },
  { code: 'IMM_MEASLES1', name: 'Measles-Rubella 1 doses', group: 'Immunization', unit: 'doses', dhims2Code: '3E', collected: true },
  // ---- Laboratory
  { code: 'LAB_TESTS', name: 'Laboratory tests ordered', group: 'Laboratory', unit: 'tests', dhims2Code: '6A', collected: true },
  { code: 'LAB_VERIFIED', name: 'Verified results', group: 'Laboratory', unit: 'results', dhims2Code: '6B', collected: true },
  { code: 'CRITICAL_LABS', name: 'Critical results', group: 'Laboratory', unit: 'results', dhims2Code: '6C', collected: true },
  // ---- Blood bank
  { code: 'BLOOD_DONATIONS', name: 'Blood donations', group: 'Blood bank', unit: 'donations', dhims2Code: '8A', collected: true },
  { code: 'BLOOD_UNITS_ISSUED', name: 'Blood units issued', group: 'Blood bank', unit: 'units', dhims2Code: '8B', collected: true },
  // ---- Public health & surveillance
  { code: 'DISEASE_CASES', name: 'Disease cases reported', group: 'Public health', unit: 'cases', dhims2Code: '12A', collected: true },
  { code: 'CONFIRMED_CASES', name: 'Confirmed cases', group: 'Public health', unit: 'cases', dhims2Code: '12B', collected: true },
  // ---- Referrals & transport
  { code: 'REFERRALS_OUT', name: 'Referrals sent', group: 'Referrals & transport', unit: 'referrals', dhims2Code: '10A', collected: true },
  { code: 'REFERRALS_IN', name: 'Referrals received', group: 'Referrals & transport', unit: 'referrals', dhims2Code: '10B', collected: true },
  { code: 'AMBULANCE_TRIPS', name: 'Ambulance trips', group: 'Referrals & transport', unit: 'trips', dhims2Code: '10C', collected: true },
  // ---- Finance
  { code: 'PATIENTS_REGISTERED', name: 'Patients registered', group: 'Finance', unit: 'patients', dhims2Code: '1D', collected: true },
  { code: 'INVOICES', name: 'Invoices issued', group: 'Finance', unit: 'invoices', dhims2Code: '7A', collected: true },
  { code: 'REVENUE', name: 'Revenue collected', group: 'Finance', unit: 'GHS', dhims2Code: '7B', collected: true },
];

export interface Range {
  gte: Date;
  lt: Date;
}

export function dayStart(s: string): Date {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw httpErrors.badRequest('Invalid date (use YYYY-MM-DD)');
  return d;
}

export function parseRange(q: Record<string, unknown>): Range {
  const fromRaw = optStr(q.from) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const toRaw = optStr(q.to) ?? new Date().toISOString().slice(0, 10);
  const gte = dayStart(fromRaw);
  const lt = new Date(dayStart(toRaw).getTime() + 24 * 60 * 60 * 1000);
  if (lt.getTime() - gte.getTime() > 366 * 24 * 60 * 60 * 1000) throw httpErrors.badRequest('Report period cannot exceed 366 days');
  if (lt <= gte) throw httpErrors.badRequest('"to" must be after "from"');
  return { gte, lt };
}

/** Resolve every entity's where clause for one data scope. */
export type ScopeOf = (entity: string) => Promise<Record<string, unknown>>;

export function facilityScopeOf(facilityId: string): ScopeOf {
  return async (entity: string) => {
    switch (entity) {
      case 'patient': return { facilityId };
      case 'referralOut': return { fromFacilityId: facilityId };
      case 'referralIn': return { toFacilityId: facilityId };
      case 'ambulanceTrip': return { ambulance: { facilityId } };
      case 'immunization': return { OR: [{ facilityId }, { patient: { facilityId } }] };
      default: return { facilityId };
    }
  };
}

/** Where clause for the Facility rows themselves (no `facility` self-relation). */
export function facilityListScope(u: AuthUser): Record<string, unknown> {
  switch (u.scope) {
    case 'FACILITY': return u.facilityId ? { id: u.facilityId } : { id: '__deny__' };
    case 'REGIONAL': return u.regionId ? { regionId: u.regionId } : { regionId: '__deny__' };
    case 'DISTRICT': return u.districtId ? { districtId: u.districtId } : { districtId: '__deny__' };
    default: return {};
  }
}

export function callerScopeOf(db: PrismaClient, u: AuthUser): ScopeOf {
  return async (entity: string) => {
    switch (entity) {
      case 'patient': return patientScope(u);
      case 'encounter':
      case 'admission':
      case 'labOrder':
      case 'invoice':
        return dashboardScope(u);
      case 'bed':
      case 'bloodDonation':
      case 'bloodUnit':
      case 'diseaseCase':
        return facilityScope(u);
      case 'immunization': return immunizationScope(u);
      case 'ambulanceTrip': return { ambulance: { ...facilityScope(u) } };
      case 'referralOut':
      case 'referralIn': {
        // Referrals carry the from/to facility ids — scope through the caller's
        // facilities for geographic roles (national → all facilities).
        const ids = await db.facility.findMany({ where: facilityListScope(u), select: { id: true } });
        const list = ids.map((f) => f.id);
        return { [entity === 'referralOut' ? 'fromFacilityId' : 'toFacilityId']: list.length ? { in: list } : '__none__' };
      }
      default: return {};
    }
  };
}

/**
 * Compute every collected indicator for one scope. Resolves all entity scopes
 * up front, then issues the (parallel) aggregate queries.
 */
export async function computeIndicators(
  db: PrismaClient,
  u: AuthUser,
  r: Range,
  scopeOf: ScopeOf,
): Promise<Record<string, number | null>> {
  const [wEncounter, wAdmission, wLabOrder, wInvoice, wPatient, wBed, wDonation, wUnit, wCase, wImm, wAmbulanceTrip, wReferralOut, wReferralIn] = await Promise.all([
    scopeOf('encounter'), scopeOf('admission'), scopeOf('labOrder'), scopeOf('invoice'), scopeOf('patient'),
    scopeOf('bed'), scopeOf('bloodDonation'), scopeOf('bloodUnit'), scopeOf('diseaseCase'), scopeOf('immunization'),
    scopeOf('ambulanceTrip'), scopeOf('referralOut'), scopeOf('referralIn'),
  ]);
  const inRange = (col: string): Record<string, unknown> => ({ [col]: r });

  const encounters = await db.encounter.findMany({ where: { ...wEncounter, ...inRange('createdAt') }, select: { patientId: true } });
  const opdAttendance = encounters.length;
  const opdNew = new Set(encounters.map((e) => e.patientId)).size;

  const [admissions, discharges, maternity, labOrders, labVerified, criticalLabs, donations, unitsIssued, diseaseCases, confirmedCases, invoices, revenue, patientsRegistered, immBcg, immPenta1, immPenta3, immOpv3, immMeasles1, referralsOut, referralsIn, ambulanceTrips, bedsTotal, bedsOccupied] = await Promise.all([
    db.admission.count({ where: { ...wAdmission, admittedAt: r } }),
    db.admission.count({ where: { ...wAdmission, dischargedAt: r } }),
    db.admission.count({ where: { ...wAdmission, admissionType: 'MATERNITY', admittedAt: r } }),
    db.labOrder.count({ where: { ...wLabOrder, ...inRange('createdAt') } }),
    db.labOrder.count({ where: { ...wLabOrder, status: 'VERIFIED', ...inRange('createdAt') } }),
    db.labOrder.count({ where: { ...wLabOrder, critical: true, ...inRange('createdAt') } }),
    db.bloodDonation.count({ where: { ...wDonation, donatedAt: r } }),
    db.bloodUnit.count({ where: { ...wUnit, issuedAt: r } }),
    db.diseaseCase.count({ where: { ...wCase, reportedAt: r } }),
    db.diseaseCase.count({ where: { ...wCase, caseType: 'CONFIRMED', reportedAt: r } }),
    db.invoice.count({ where: { ...wInvoice, issuedAt: r } }),
    db.invoice.aggregate({ where: { ...wInvoice, issuedAt: r, paidAmount: { gt: 0 } }, _sum: { paidAmount: true } }),
    db.patient.count({ where: { ...wPatient, createdAt: r } }),
    db.immunization.count({ where: { ...wImm, vaccine: 'BCG', dose: '0', status: 'GIVEN', administeredAt: r } }),
    db.immunization.count({ where: { ...wImm, vaccine: 'PENTA', dose: '1', status: 'GIVEN', administeredAt: r } }),
    db.immunization.count({ where: { ...wImm, vaccine: 'PENTA', dose: '3', status: 'GIVEN', administeredAt: r } }),
    db.immunization.count({ where: { ...wImm, vaccine: 'OPV', dose: '3', status: 'GIVEN', administeredAt: r } }),
    db.immunization.count({ where: { ...wImm, vaccine: 'MEASLES_RUBELLA', dose: '1', status: 'GIVEN', administeredAt: r } }),
    db.referral.count({ where: { ...wReferralOut, createdAt: r } }),
    db.referral.count({ where: { ...wReferralIn, createdAt: r } }),
    db.ambulanceTrip.count({ where: { ...wAmbulanceTrip, dispatchedAt: r } }),
    db.bed.count({ where: wBed }),
    db.bed.count({ where: { ...wBed, status: 'OCCUPIED' } }),
  ]);

  const values: Record<string, number | null> = {
    OPD_ATTENDANCE: opdAttendance,
    OPD_NEW: opdNew,
    OPD_REVISIT: Math.max(0, opdAttendance - opdNew),
    ADMISSIONS: admissions,
    DISCHARGES: discharges,
    BED_OCCUPANCY_RATE: bedsTotal > 0 ? Math.round((bedsOccupied / bedsTotal) * 100) : null,
    MATERNITY_ADMISSIONS: maternity,
    IMM_BCG: immBcg,
    IMM_PENTA1: immPenta1,
    IMM_PENTA3: immPenta3,
    IMM_OPV3: immOpv3,
    IMM_MEASLES1: immMeasles1,
    LAB_TESTS: labOrders,
    LAB_VERIFIED: labVerified,
    CRITICAL_LABS: criticalLabs,
    BLOOD_DONATIONS: donations,
    BLOOD_UNITS_ISSUED: unitsIssued,
    DISEASE_CASES: diseaseCases,
    CONFIRMED_CASES: confirmedCases,
    REFERRALS_OUT: referralsOut,
    REFERRALS_IN: referralsIn,
    AMBULANCE_TRIPS: ambulanceTrips,
    PATIENTS_REGISTERED: patientsRegistered,
    INVOICES: invoices,
    REVENUE: revenue._sum.paidAmount ?? 0,
  };
  // Not-yet-collected indicators stay null.
  for (const def of INDICATORS) if (!def.collected) values[def.code] = null;
  return values;
}

export function present(rows: Record<string, number | null>): (IndicatorDef & { value: number | null })[] {
  return INDICATORS.map((def) => ({ ...def, value: rows[def.code] ?? null }));
}

/**
 * Roll per-facility rows up into group buckets. Bed occupancy is a rate, not a
 * count — it is intentionally left null per group (shown per-facility only).
 */
export async function groupRows(
  db: PrismaClient,
  u: AuthUser,
  r: Range,
  facilities: Array<{ id: string; name: string; district: { id: string; name: string } | null; region: { id: string; name: string } | null }>,
  groupBy: 'facility' | 'district' | 'region',
): Promise<Array<{ id: string; name: string; indicators: Record<string, number | null> }>> {
  const results = await Promise.all(
    facilities.map(async (f) => ({
      key: groupBy === 'facility' ? f.id : groupBy === 'district' ? (f.district?.id ?? 'unassigned') : (f.region?.id ?? 'unassigned'),
      name: groupBy === 'facility' ? f.name : groupBy === 'district' ? (f.district?.name ?? 'Unassigned') : (f.region?.name ?? 'Unassigned'),
      rows: await computeIndicators(db, u, r, facilityScopeOf(f.id)),
    })),
  );
  const byGroup = new Map<string, { id: string; name: string; indicators: Record<string, number | null> }>();
  for (const { key, name, rows } of results) {
    let group = byGroup.get(key);
    if (!group) {
      group = { id: key, name, indicators: {} };
      for (const def of INDICATORS) group.indicators[def.code] = null;
      byGroup.set(key, group);
    }
    for (const [code, v] of Object.entries(rows)) {
      if (code === 'BED_OCCUPANCY_RATE') continue;
      const cur = group.indicators[code] ?? null;
      group.indicators[code] = typeof v === 'number' && cur !== null ? cur + v : (v ?? cur);
    }
  }
  return [...byGroup.values()];
}
