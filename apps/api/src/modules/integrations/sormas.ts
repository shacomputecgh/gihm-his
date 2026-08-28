// -----------------------------------------------------------------------------
// SORMAS adapter (docs/08 §2) — the national outbreak surveillance system.
//
// Exports disease cases from the surveillance register as SORMAS case-import
// JSON and delivers them through the shared integration engine (idempotent
// queue + backoff + audit). The platform remains authoritative for case
// management; SORMAS receives an event feed for national outbreak response.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { toCsv } from '../../lib/csv.js';
import type { AuthUser } from '../../types.js';
import { facilityScope } from '../../lib/scope.js';
import { dayStart } from '../reports/compute.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

// Platform disease label → SORMAS disease enum. Unknown/rare diseases map to
// OTHER so a reporting mismatch never blocks the queue (SORMAS also accepts
// free-text in some endpoints, but the enum is the import contract).
const SORMAS_DISEASES: Array<[RegExp, string]> = [
  [/cholera/i, 'CHOLERA'],
  [/measles/i, 'MEASLES'],
  [/yellow fever/i, 'YELLOW_FEVER'],
  [/malaria/i, 'MALARIA'],
  [/flaccid paralysis/i, 'AFP'],
  [/dengue/i, 'DENGUE'],
  [/meningitis/i, 'MENINGITIS'],
  [/ebola/i, 'EBOLA'],
  [/covid/i, 'CORONAVIRUS'],
];

export function toSormasDisease(disease: string): string {
  for (const [re, code] of SORMAS_DISEASES) if (re.test(disease)) return code;
  return 'OTHER';
}

function toSormasSex(sex: string | null | undefined): string {
  if (sex === 'F') return 'FEMALE';
  if (sex === 'M') return 'MALE';
  return 'UNKNOWN';
}

export interface SormasCaseExport {
  externalId: string;
  disease: string;
  caseClassification: 'SUSPECTED' | 'CONFIRMED';
  reportDate: string;
  facilityName: string | null;
  person: {
    firstName: string | null;
    lastName: string | null;
    sex: string;
    birthdate: string | null;
  } | null;
}

/** Export confirmed/suspected cases reported in the range, scoped to the caller. */
export async function buildCaseExport(
  db: PrismaClient,
  u: AuthUser,
  from: string,
  to: string,
): Promise<SormasCaseExport[]> {
  const gte = dayStart(from);
  const lt = new Date(dayStart(to).getTime() + 24 * 60 * 60 * 1000);
  if (lt <= gte) throw httpErrors.badRequest('"to" must be after "from"');
  if (lt.getTime() - gte.getTime() > 366 * 24 * 60 * 60 * 1000) throw httpErrors.badRequest('Range cannot exceed 366 days');

  const cases = await db.diseaseCase.findMany({
    where: { ...facilityScope(u), reportedAt: { gte, lt } },
    include: {
      facility: { select: { name: true } },
      patient: { select: { fullName: true, sex: true, dateOfBirth: true } },
    },
    orderBy: { reportedAt: 'asc' },
  });
  return cases.map((c) => {
    const fullName = c.patient?.fullName ?? null;
    const [firstName, ...rest] = (fullName ?? '').split(' ');
    return {
      externalId: c.id,
      disease: toSormasDisease(c.disease),
      caseClassification: c.caseType === 'CONFIRMED' ? 'CONFIRMED' : 'SUSPECTED',
      reportDate: c.reportedAt.toISOString(),
      facilityName: c.facility?.name ?? null,
      person: c.patient
        ? {
            firstName: firstName || null,
            lastName: rest.length > 0 ? rest.join(' ') : null,
            sex: toSormasSex(c.patient.sex),
            birthdate: c.patient.dateOfBirth ? c.patient.dateOfBirth.toISOString().slice(0, 10) : null,
          }
        : null,
    };
  });
}

export function casesToCsv(cases: SormasCaseExport[]): string {
  const rows: string[][] = cases.map((c) => [
    c.externalId,
    c.disease,
    c.caseClassification,
    c.reportDate,
    c.facilityName ?? '',
    c.person?.firstName ?? '',
    c.person?.lastName ?? '',
    c.person?.sex ?? '',
    c.person?.birthdate ?? '',
  ]);
  return toCsv(['externalId', 'disease', 'caseClassification', 'reportDate', 'facility', 'firstName', 'lastName', 'sex', 'birthdate'], rows);
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** SORMAS case-import transport — POST the case array to /api/cases (basic auth). */
export async function sormasTransport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/cases`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { ok: false, error: `SORMAS unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `SORMAS rejected cases: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  return { ok: true };
}
