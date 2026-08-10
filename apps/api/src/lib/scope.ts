import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../types.js';

/** Sentinel value that never matches a real UUID — used to deny when a scope id is missing. */
const DENY = '__deny__';

/**
 * Patient-level where clause based on the caller's role scope.
 *  - NATIONAL  → all records (authorized aggregate access)
 *  - REGIONAL  → patients in the user's region
 *  - DISTRICT  → patients in the user's district
 *  - FACILITY  → patients registered at the user's facility
 *  - PATIENT   → the user's own record only
 *
 * A scope user whose geographic/facility anchor is missing is denied (matches
 * assertPatientAccess, which throws) — never silently widened to "all records".
 */
export function patientScope(u: AuthUser): Prisma.PatientWhereInput {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { regionId: u.regionId } : { id: DENY };
    case 'DISTRICT':
      return u.districtId ? { districtId: u.districtId } : { id: DENY };
    case 'FACILITY':
      return u.facilityId ? { facilityId: u.facilityId } : { id: DENY };
    case 'PATIENT':
      return { user: { id: u.id } };
    default:
      return {};
  }
}

/** Where clause for facility-tagged clinical entities (encounters, orders…). */
export function clinicalScope(u: AuthUser): Prisma.EncounterWhereInput {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { patient: { regionId: u.regionId } } : { patient: { regionId: DENY } };
    case 'DISTRICT':
      return u.districtId ? { patient: { districtId: u.districtId } } : { patient: { districtId: DENY } };
    case 'FACILITY':
      return u.facilityId ? { facilityId: u.facilityId } : { facilityId: DENY };
    case 'PATIENT':
      return { patient: { user: { id: u.id } } };
    default:
      return {};
  }
}

/**
 * Where clause for dashboard aggregates. Facility-tagged entities are scoped
 * through the patient record (region/district) or the facilityId directly, so a
 * regional director sees regional numbers — never national totals.
 *
 * Returned as a partial object that is assignable to any Prisma where-input
 * when spread (each entity's where type accepts facilityId/patient relation
 * filters). A missing anchor yields the deny sentinel, never "all records".
 */
export function dashboardScope(u: AuthUser): {
  facilityId?: string;
  patient?: { regionId?: string; districtId?: string };
} {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { patient: { regionId: u.regionId } } : { patient: { regionId: DENY } };
    case 'DISTRICT':
      return u.districtId ? { patient: { districtId: u.districtId } } : { patient: { districtId: DENY } };
    case 'FACILITY':
      return u.facilityId ? { facilityId: u.facilityId } : { facilityId: DENY };
    default:
      return {};
  }
}

/** Facility id used for dashboard-style aggregates. */
export function facilityScopeId(u: AuthUser): string | null {
  if (u.scope === 'FACILITY') return u.facilityId;
  return null;
}

/**
 * Where clause for facility-tagged entities that have NO patient relation
 * (stock items, beds, assets…). Scopes through the `facility` relation for
 * regional/district users. A missing anchor yields the deny sentinel, never
 * "all records".
 */
export function facilityScope(u: AuthUser): {
  facilityId?: string;
  facility?: { regionId?: string; districtId?: string };
} {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { facility: { regionId: u.regionId } } : { facility: { regionId: DENY } };
    case 'DISTRICT':
      return u.districtId ? { facility: { districtId: u.districtId } } : { facility: { districtId: DENY } };
    case 'FACILITY':
      return u.facilityId ? { facilityId: u.facilityId } : { facilityId: DENY };
    default:
      return {};
  }
}
