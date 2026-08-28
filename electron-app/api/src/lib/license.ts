import type { PrismaClient } from '@prisma/client';
import { getSetting } from './settings.js';
import { httpErrors } from './http.js';

/**
 * Licensing (docs/25). The developer activates a license from the Developer
 * panel: edition, expiry, and facility/user limits. `licenseStatus` computes
 * the effective status from the settings store (env vars are the boot
 * defaults). Enforcement is applied at the write boundaries that create
 * capacity-consuming resources: new user accounts and approved facilities.
 */

export interface LicenseStatus {
  activated: boolean;
  edition: string | null;
  keySuffix: string | null;
  expiresAt: string | null;
  expired: boolean;
  daysLeft: number | null;
  facilities: { used: number; max: number | null };
  users: { used: number; max: number | null };
  /** True when activated, not expired and within all limits. */
  compliant: boolean;
  limitsExceeded: string[];
}

export async function licenseStatus(db: PrismaClient): Promise<LicenseStatus> {
  const key = getSetting('license.key') ?? '';
  const edition = getSetting('license.edition') ?? null;
  const expiresRaw = getSetting('license.expiresAt');
  const maxFacilitiesRaw = getSetting('license.maxFacilities');
  const maxUsersRaw = getSetting('license.maxUsers');

  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000))) : null;

  // 0 and unparseable values mean UNLIMITED (the UI labels 0 as unlimited);
  // only a positive number is an enforced capacity limit.
  const parseLimit = (raw: string | null | undefined): number | null => {
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };
  const maxFacilities = parseLimit(maxFacilitiesRaw);
  const maxUsers = parseLimit(maxUsersRaw);
  const [facilityCount, userCount] = await Promise.all([
    db.facility.count(),
    db.user.count({ where: { status: 'ACTIVE' } }),
  ]);

  const limitsExceeded: string[] = [];
  if (maxFacilities !== null && facilityCount > maxFacilities) limitsExceeded.push(`facilities (${facilityCount}/${maxFacilities})`);
  if (maxUsers !== null && userCount > maxUsers) limitsExceeded.push(`users (${userCount}/${maxUsers})`);

  const activated = key.length > 0;
  return {
    activated,
    edition: activated ? edition : null,
    keySuffix: activated ? key.slice(-4) : null,
    expiresAt: activated ? (expiresAt?.toISOString() ?? null) : null,
    expired: activated && expired,
    daysLeft: activated ? daysLeft : null,
    facilities: { used: facilityCount, max: maxFacilities },
    users: { used: userCount, max: maxUsers },
    compliant: !activated || (!expired && limitsExceeded.length === 0),
    limitsExceeded,
  };
}

/** Reject when an active license is over its user capacity. */
export async function assertUserCapacity(db: PrismaClient): Promise<void> {
  const s = await licenseStatus(db);
  if (s.activated && s.users.max !== null && s.users.used >= s.users.max) {
    throw httpErrors.forbidden(`License user limit reached (${s.users.used}/${s.users.max}) — raise the limit or activate a larger license`);
  }
}

/** Reject when an active license is over its facility capacity. */
export async function assertFacilityCapacity(db: PrismaClient): Promise<void> {
  const s = await licenseStatus(db);
  if (s.activated && s.facilities.max !== null && s.facilities.used >= s.facilities.max) {
    throw httpErrors.forbidden(`License facility limit reached (${s.facilities.used}/${s.facilities.max}) — raise the limit or activate a larger license`);
  }
}
