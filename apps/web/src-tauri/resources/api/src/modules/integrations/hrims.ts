// -----------------------------------------------------------------------------
// HRIMS adapter (docs/08 §2) — the national human-resource information system.
//
// Exports the facility workforce (the staff directory — docs/25) as a monthly
// register snapshot and delivers it through the shared integration engine
// (idempotent queue + backoff + audit). The platform stays authoritative for
// day-to-day staffing; HRIMS receives the register for national HR planning.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { toCsv } from '../../lib/csv.js';
import type { AuthUser } from '../../types.js';
import { facilityScope } from '../../lib/scope.js';
import { periodRange, resolveOrgUnit } from './dhims2.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

export interface HrimsStaffRow {
  staffNumber: string;
  fullName: string;
  role: string;
  speciality: string | null;
  licenseNumber: string | null;
  phone: string | null;
  email: string | null;
  employmentStatus: string;
  headOfUnit: boolean;
  joinedAt: string | null;
  unitCode: string | null;
  unitName: string | null;
  facilityCode: string;
  facilityName: string;
}

export interface HrimsSubmission {
  dataSet: string;
  period: string; // 'YYYY-MM'
  orgUnit: string; // facility code (or scope label)
  generatedAt: string;
  summary: { total: number; active: number; onLeave: number; heads: number };
  staff: HrimsStaffRow[];
}

/**
 * Build the workforce register snapshot for the caller's scope. orgUnit
 * defaults to the facility code (facility scope) or the scope label, matching
 * the other adapters' convention. Rows are computed live from the staff
 * directory; retired/terminated employees stay in the register (HRIMS needs
 * the full record), but the summary separates the current working roster.
 */
export async function buildWorkforceSnapshot(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  orgUnit?: string,
): Promise<HrimsSubmission> {
  // Validates the period (YYYY-MM) and rejects malformed input up front.
  const { range } = periodRange(period);
  void range;
  const unit = await resolveOrgUnit(db, u, orgUnit);
  const staff = await db.staff.findMany({
    where: { ...facilityScope(u) },
    orderBy: [{ employmentStatus: 'asc' }, { fullName: 'asc' }],
    take: 2000,
    include: {
      unit: { select: { code: true, name: true } },
      facility: { select: { code: true, name: true } },
    },
  });
  return {
    dataSet: 'GIHM-STAFF',
    period,
    orgUnit: unit,
    generatedAt: new Date().toISOString(),
    summary: {
      total: staff.length,
      active: staff.filter((s) => s.employmentStatus === 'ACTIVE').length,
      onLeave: staff.filter((s) => s.employmentStatus === 'ON_LEAVE').length,
      heads: staff.filter((s) => s.headOfUnit).length,
    },
    staff: staff.map((s) => ({
      staffNumber: s.staffNumber,
      fullName: s.fullName,
      role: s.role,
      speciality: s.speciality,
      licenseNumber: s.licenseNumber,
      phone: s.phone,
      email: s.email,
      employmentStatus: s.employmentStatus,
      headOfUnit: s.headOfUnit,
      joinedAt: s.joinedAt ? s.joinedAt.toISOString().slice(0, 10) : null,
      unitCode: s.unit?.code ?? null,
      unitName: s.unit?.name ?? null,
      facilityCode: s.facility.code,
      facilityName: s.facility.name,
    })),
  };
}

/** HRIMS register CSV — one row per staff member (facility/period columns). */
export function workforceToCsv(sub: HrimsSubmission): string {
  const rows: string[][] = sub.staff.map((r) => [
    sub.orgUnit,
    sub.period,
    r.staffNumber,
    r.fullName,
    r.role,
    r.speciality ?? '',
    r.licenseNumber ?? '',
    r.phone ?? '',
    r.email ?? '',
    r.employmentStatus,
    r.headOfUnit ? '1' : '0',
    r.joinedAt ?? '',
    r.unitCode ?? '',
    r.unitName ?? '',
    r.facilityCode,
    r.facilityName,
  ]);
  return toCsv(['orgUnit', 'period', 'staffNumber', 'fullName', 'role', 'speciality', 'licenseNumber', 'phone', 'email', 'employmentStatus', 'headOfUnit', 'joinedAt', 'unitCode', 'unitName', 'facilityCode', 'facilityName'], rows);
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** HRIMS register transport — POST the workforce snapshot to /api/staff (basic auth). */
export async function hrimsTransport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/staff`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure (upstream unreachable) — the engine keeps the row queued
    // with backoff rather than losing it (docs/08 §3).
    return { ok: false, error: `HRIMS unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `HRIMS rejected submission: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  let remoteId: string | undefined;
  try {
    const parsed = (await res.json()) as { submissionId?: string; id?: string };
    remoteId = parsed.submissionId ?? parsed.id;
  } catch {
    /* no acknowledgement id — delivery still succeeded */
  }
  return { ok: true, remoteId };
}
