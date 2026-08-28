import type { AuthUser } from '../../types.js';
import { DAY_MS } from './schedule.js';

/** Whole-day offset from today (positive = future, negative = past). */
export function daysUntil(d: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

/**
 * Data scope for immunization rows: national sees all; regional/district scope
 * through the patient's geography; facility users see doses given at their
 * facility OR registered at their facility (mirrors the referral OR-scope).
 */
export function immunizationScope(u: AuthUser): Record<string, unknown> {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { patient: { regionId: u.regionId } } : { patient: { regionId: '__deny__' } };
    case 'DISTRICT':
      return u.districtId ? { patient: { districtId: u.districtId } } : { patient: { districtId: '__deny__' } };
    case 'FACILITY':
      return u.facilityId ? { OR: [{ facilityId: u.facilityId }, { patient: { facilityId: u.facilityId } }] } : { facilityId: '__deny__' };
    case 'PATIENT':
      return { patient: { user: { id: u.id } } };
    default:
      return {};
  }
}

export const PATIENT_SELECT = {
  select: { id: true, mrn: true, fullName: true, dateOfBirth: true, phone: true, reminderOptOut: true, district: { select: { name: true } } },
} as const;
