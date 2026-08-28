import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { facilityScope } from '../../lib/scope.js';
import { parsePage, pageEnvelope } from '../../lib/pagination.js';
import type { Guards } from '../../lib/guards.js';

/**
 * Disease surveillance (spec §36) — the register of reportable conditions
 * (24-hour-reportable and weekly-reportable) that public health teams use to
 * detect and contain outbreaks, plus per-case contact-tracing follow-ups.
 *
 * Scope discipline: cases are facility-tagged, so regional/district users see
 * cases reported in their geography via the facility relation (facility →
 * district → region), facility users only their own facility, and the
 * facilityId filter can never widen the caller's scope. The reported patient
 * is informational — a district team may report a community case for a patient
 * registered elsewhere in the district — so the case itself is scoped, never
 * the patient relation.
 *
 * Permissions: reading requires `view_surveillance`; reporting, updating and
 * recording follow-ups require `manage_surveillance` (docs/06).
 */

const CASE_TYPES = ['SUSPECTED', 'CONFIRMED'];
const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];
const OUTCOMES = ['RECOVERED', 'DECEASED', 'STABLE', 'REFERRED'];
const FOLLOW_UP_STATUSES = ['STABLE', 'IMPROVING', 'WORSENING', 'RECOVERED', 'DECEASED'];
// A case advances through the investigation pipeline; reopening a closed case
// is allowed when new information surfaces (e.g. a lab result reverses a
// closure), but a case can never slip silently between investigation states.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['INVESTIGATED', 'CLOSED'],
  INVESTIGATED: ['CLOSED', 'OPEN'],
  CLOSED: ['OPEN'],
};

const CASE_INCLUDE = {
  patient: { select: { id: true, fullName: true, mrn: true } },
  facility: {
    select: {
      id: true,
      code: true,
      name: true,
      district: { select: { id: true, name: true, region: { select: { id: true, name: true } } } },
    },
  },
  reporter: { select: { id: true, fullName: true } },
  _count: { select: { followUps: true } },
} as const;

function toCasePayload(c: {
  id: string;
  disease: string;
  caseType: string;
  severity: string | null;
  status: string;
  outcome: string | null;
  notes: string | null;
  reportedAt: Date;
  updatedAt: Date;
  patient?: { id: string; fullName: string; mrn: string } | null;
  facility?: { id: string; code: string; name: string; district?: { id: string; name: string; region?: { id: string; name: string } } | null } | null;
  reporter?: { id: string; fullName: string } | null;
  _count?: { followUps: number };
}) {
  return {
    id: c.id,
    patient: c.patient ?? null,
    facility: c.facility ? { id: c.facility.id, code: c.facility.code, name: c.facility.name, district: c.facility.district?.name ?? null, region: c.facility.district?.region?.name ?? null } : null,
    reporter: c.reporter ?? null,
    disease: c.disease,
    caseType: c.caseType,
    severity: c.severity,
    status: c.status,
    outcome: c.outcome,
    notes: c.notes,
    reportedAt: c.reportedAt,
    updatedAt: c.updatedAt,
    followUpCount: c._count?.followUps ?? 0,
  };
}

/** Local-calendar day key (YYYY-MM-DD) — the trend buckets reports by the
 * day they happened where the facility sits, never by UTC date. */
function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function toFollowUpPayload(f: {
  id: string;
  followUpAt: Date;
  status: string;
  temperature: number | null;
  contactsTraced: number;
  notes: string | null;
  by?: { id: string; fullName: string } | null;
}) {
  return { id: f.id, followUpAt: f.followUpAt, status: f.status, temperature: f.temperature, contactsTraced: f.contactsTraced, notes: f.notes, by: f.by ?? null };
}

/** Throws unless the caller may manage surveillance data for the given facility. */
function assertFacilityScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, facility: { id: string; regionId: string; districtId: string }): void {
  if (u.scope === 'FACILITY' && u.facilityId !== facility.id) throw httpErrors.forbidden('You can only report cases for your own facility');
  if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only report cases for facilities in your region');
  if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only report cases for facilities in your district');
}

export function registerSurveillanceRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ============================================================ register
  app.get(
    '/surveillance/cases',
    { preHandler: guards.requirePermission('view_surveillance'), schema: { summary: 'Disease case register (scoped, filterable, paginated)', tags: ['surveillance'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      const disease = optStr(q.disease);
      if (disease) where.disease = { contains: disease };
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!STATUS_TRANSITIONS[status]) throw httpErrors.badRequest(`Case status must be one of: OPEN, INVESTIGATED, CLOSED`);
        where.status = status;
      }
      const caseType = optStr(q.caseType)?.toUpperCase();
      if (caseType) {
        if (!CASE_TYPES.includes(caseType)) throw httpErrors.badRequest(`caseType must be one of: ${CASE_TYPES.join(', ')}`);
        where.caseType = caseType;
      }
      const severity = optStr(q.severity)?.toUpperCase();
      if (severity) {
        if (!SEVERITIES.includes(severity)) throw httpErrors.badRequest(`severity must be one of: ${SEVERITIES.join(', ')}`);
        where.severity = severity;
      }
      // The facilityId filter must never widen the caller's scope (same
      // discipline as insurance claims and the units tree).
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertFacilityScope(u, requested);
        where.facilityId = facilityId;
      }
      // Date filters validate loudly — a mistyped range is a caller bug, not
      // something to silently ignore.
      const from = optStr(q.from);
      if (from) {
        const parsed = dateIso(from, 'from');
        if (!parsed) throw httpErrors.badRequest('from must be a valid date (YYYY-MM-DD)');
        where.reportedAt = { ...(where.reportedAt as object ?? {}), gte: parsed };
      }
      const to = optStr(q.to);
      if (to) {
        const parsed = dateIso(to, 'to');
        if (!parsed) throw httpErrors.badRequest('to must be a valid date (YYYY-MM-DD)');
        parsed.setHours(23, 59, 59, 999);
        where.reportedAt = { ...(where.reportedAt as object ?? {}), lte: parsed };
      }
      const search = optStr(q.q);
      if (search) {
        where.OR = [
          { disease: { contains: search } },
          { patient: { is: { fullName: { contains: search } } } },
          { patient: { is: { mrn: { contains: search } } } },
          { notes: { contains: search } },
        ];
      }
      const page = parsePage(q);
      const [rows, total] = await Promise.all([
        db.diseaseCase.findMany({ where, include: CASE_INCLUDE, orderBy: { reportedAt: 'desc' }, skip: page.skip, take: page.take }),
        db.diseaseCase.count({ where }),
      ]);
      return pageEnvelope(rows.map(toCasePayload), total, page);
    },
  );

  // ============================================================= summary
  app.get(
    '/surveillance/cases/summary',
    { preHandler: guards.requirePermission('view_surveillance'), schema: { summary: 'Surveillance dashboard: outbreak indicators + disease/geography roll-ups (scoped)', tags: ['surveillance'] } },
    async (request) => {
      const u = request.user!;
      const scope = facilityScope(u);
      const [cases, followUpAgg] = await Promise.all([
        db.diseaseCase.findMany({
          where: scope,
          select: {
            id: true,
            disease: true,
            caseType: true,
            status: true,
            outcome: true,
            reportedAt: true,
            facility: { select: { id: true, name: true, district: { select: { name: true, region: { select: { name: true } } } } } },
            _count: { select: { followUps: true } },
          },
        }),
        db.caseFollowUp.aggregate({ where: { case: scope }, _sum: { contactsTraced: true }, _count: true }),
      ]);
      const byStatus: Record<string, number> = {};
      const byCaseType: Record<string, number> = {};
      const byDisease: Record<string, { count: number; confirmed: number; open: number }> = {};
      const byFacility = new Map<string, { id: string; name: string; count: number }>();
      const byDistrict: Record<string, number> = {};
      const byRegion: Record<string, number> = {};
      const trend: Record<string, number> = {};
      let withFollowUps = 0;
      for (const c of cases) {
        byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
        byCaseType[c.caseType] = (byCaseType[c.caseType] ?? 0) + 1;
        const disease = byDisease[c.disease] ?? { count: 0, confirmed: 0, open: 0 };
        disease.count++;
        if (c.caseType === 'CONFIRMED') disease.confirmed++;
        if (c.status !== 'CLOSED') disease.open++;
        byDisease[c.disease] = disease;
        if (c.facility) {
          const fac = byFacility.get(c.facility.id) ?? { id: c.facility.id, name: c.facility.name, count: 0 };
          fac.count++;
          byFacility.set(c.facility.id, fac);
          const district = c.facility.district?.name ?? 'Unspecified';
          const region = c.facility.district?.region?.name ?? 'Unspecified';
          byDistrict[district] = (byDistrict[district] ?? 0) + 1;
          byRegion[region] = (byRegion[region] ?? 0) + 1;
        }
        if (c._count.followUps > 0) withFollowUps++;
        const day = dayKey(c.reportedAt);
        trend[day] = (trend[day] ?? 0) + 1;
      }
      // A dense 30-day trend — every day present, zero-filled — so the chart
      // never has misleading gaps.
      const denseTrend: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        denseTrend.push({ date: dayKey(d), count: trend[dayKey(d)] ?? 0 });
      }
      const open = (byStatus.OPEN ?? 0) + (byStatus.INVESTIGATED ?? 0);
      return {
        totals: {
          cases: cases.length,
          open,
          closed: byStatus.CLOSED ?? 0,
          confirmed: byCaseType.CONFIRMED ?? 0,
          suspected: byCaseType.SUSPECTED ?? 0,
          deaths: cases.filter((c) => c.outcome === 'DECEASED').length,
          followUps: followUpAgg._count,
          contactsTraced: followUpAgg._sum.contactsTraced ?? 0,
          followUpRate: cases.length > 0 ? Math.round((withFollowUps / cases.length) * 100) : 0,
        },
        byStatus,
        byCaseType,
        byDisease: Object.entries(byDisease)
          .map(([disease, v]) => ({ disease, ...v }))
          .sort((a, b) => b.count - a.count),
        byFacility: [...byFacility.values()].sort((a, b) => b.count - a.count),
        byDistrict,
        byRegion,
        trend: denseTrend,
      };
    },
  );

  // ============================================================== report
  app.post(
    '/surveillance/cases',
    { preHandler: guards.requirePermission('manage_surveillance'), schema: { summary: 'Report a disease case (facility-scoped)', tags: ['surveillance'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertFacilityScope(u, facility);
      const disease = str(body.disease, 'disease', { required: true, max: 120 }).trim();
      if (disease.length < 2) throw httpErrors.badRequest('Disease name is too short');
      const caseType = (optStr(body.caseType) ?? 'SUSPECTED').toUpperCase();
      if (!CASE_TYPES.includes(caseType)) throw httpErrors.badRequest(`caseType must be one of: ${CASE_TYPES.join(', ')}`);
      const severity = optStr(body.severity)?.toUpperCase();
      if (severity !== undefined && !SEVERITIES.includes(severity)) throw httpErrors.badRequest(`severity must be one of: ${SEVERITIES.join(', ')}`);
      const status = (optStr(body.status) ?? 'OPEN').toUpperCase();
      if (!STATUS_TRANSITIONS[status]) throw httpErrors.badRequest(`status must be one of: OPEN, INVESTIGATED, CLOSED`);
      if (status === 'CLOSED') throw httpErrors.badRequest('A new case must be reported OPEN — close it after investigation');
      const patientId = optStr(body.patientId);
      if (patientId) {
        const patient = await db.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw httpErrors.notFound('Patient not found');
        // A facility user may only link patients registered at their own
        // facility — linking a foreign patient would leak that patient's
        // name/MRN to every case viewer. District/regional teams keep the
        // documented community-reporting workflow across their geography.
        if (u.scope === 'FACILITY' && patient.facilityId && patient.facilityId !== facilityId) {
          throw httpErrors.forbidden('Patient is not registered at this facility — report the case at their facility');
        }
      }
      const notes = optStr(body.notes);
      if (notes !== undefined && notes.length > 2000) throw httpErrors.badRequest('Notes are too long (max 2000 characters)');
      const reportedAt = body.reportedAt ? (dateIso(body.reportedAt, 'reportedAt') ?? new Date()) : new Date();
      const created = await db.diseaseCase.create({
        data: {
          patientId: patientId ?? null,
          facilityId,
          reporterId: u.id,
          disease,
          caseType,
          severity: severity ?? null,
          status,
          notes: notes ?? null,
          reportedAt,
        },
        include: CASE_INCLUDE,
      });
      recordAudit(db, request, {
        action: 'surveillance.case.report',
        entityType: 'diseaseCase',
        entityId: created.id,
        after: { disease, caseType, severity: severity ?? null, facilityCode: facility.code, patientId: patientId ?? null },
      });
      return { case: toCasePayload(created) };
    },
  );

  // ============================================================== detail
  app.get(
    '/surveillance/cases/:id',
    { preHandler: guards.requirePermission('view_surveillance'), schema: { summary: 'Disease case detail with contact-tracing follow-ups', tags: ['surveillance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const found = await db.diseaseCase.findFirst({
        where: { id: params.id, ...facilityScope(u) },
        include: { ...CASE_INCLUDE, followUps: { include: { by: { select: { id: true, fullName: true } } }, orderBy: { followUpAt: 'desc' } } },
      });
      if (!found) throw httpErrors.notFound('Case not found in scope');
      return { case: toCasePayload(found), followUps: found.followUps.map(toFollowUpPayload) };
    },
  );

  // ============================================================== update
  app.patch(
    '/surveillance/cases/:id',
    { preHandler: guards.requirePermission('manage_surveillance'), schema: { summary: 'Update a case (status transitions, caseType, outcome, notes)', tags: ['surveillance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const found = await db.diseaseCase.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!found) throw httpErrors.notFound('Case not found in scope');
      const data: Record<string, unknown> = {};
      const changes: string[] = [];
      const status = optStr(body.status)?.toUpperCase();
      if (status !== undefined) {
        const allowed = STATUS_TRANSITIONS[found.status] ?? [];
        if (!allowed.includes(status)) throw httpErrors.badRequest(`Cannot move a ${found.status} case to ${status} (allowed: ${allowed.join(', ') || 'none'})`);
        data.status = status;
        changes.push(`status → ${status}`);
      }
      const caseType = optStr(body.caseType)?.toUpperCase();
      if (caseType !== undefined) {
        if (!CASE_TYPES.includes(caseType)) throw httpErrors.badRequest(`caseType must be one of: ${CASE_TYPES.join(', ')}`);
        data.caseType = caseType;
        changes.push(`caseType → ${caseType}`);
      }
      const severity = optStr(body.severity)?.toUpperCase();
      if (severity !== undefined) {
        if (!SEVERITIES.includes(severity)) throw httpErrors.badRequest(`severity must be one of: ${SEVERITIES.join(', ')}`);
        data.severity = severity;
        changes.push(`severity → ${severity}`);
      }
      const outcome = optStr(body.outcome)?.toUpperCase();
      if (outcome !== undefined) {
        if (!OUTCOMES.includes(outcome)) throw httpErrors.badRequest(`outcome must be one of: ${OUTCOMES.join(', ')}`);
        data.outcome = outcome;
        changes.push(`outcome → ${outcome}`);
      }
      // A case may only be closed with a documented outcome — never silently.
      const nextStatus = (data.status as string | undefined) ?? found.status;
      if (nextStatus === 'CLOSED' && (data.outcome as string | undefined) === undefined && !found.outcome) {
        throw httpErrors.badRequest('Closing a case requires an outcome (e.g. RECOVERED, DECEASED)');
      }
      const disease = optStr(body.disease);
      if (disease !== undefined) {
        const d = disease.trim();
        if (d.length < 2) throw httpErrors.badRequest('Disease name is too short');
        data.disease = d;
        changes.push(`disease → ${d}`);
      }
      const notes = optStr(body.notes);
      if (notes !== undefined) {
        if (notes.length > 2000) throw httpErrors.badRequest('Notes are too long (max 2000 characters)');
        data.notes = notes;
        changes.push('notes updated');
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.diseaseCase.update({ where: { id: found.id }, data, include: CASE_INCLUDE });
      recordAudit(db, request, {
        action: 'surveillance.case.update',
        entityType: 'diseaseCase',
        entityId: found.id,
        after: { disease: updated.disease, changes },
      });
      return { case: toCasePayload(updated) };
    },
  );

  // ======================================================== follow-ups
  app.post(
    '/surveillance/cases/:id/follow-ups',
    { preHandler: guards.requirePermission('manage_surveillance'), schema: { summary: 'Record a contact-tracing follow-up for a case', tags: ['surveillance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const found = await db.diseaseCase.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!found) throw httpErrors.notFound('Case not found in scope');
      const status = (optStr(body.status) ?? '').toUpperCase();
      if (!FOLLOW_UP_STATUSES.includes(status)) throw httpErrors.badRequest(`Follow-up status must be one of: ${FOLLOW_UP_STATUSES.join(', ')}`);
      const temperature = body.temperature === undefined ? null : (num(body.temperature, 'temperature') ?? null);
      if (temperature !== null && (temperature < 30 || temperature > 45)) throw httpErrors.badRequest('Temperature must be between 30 and 45 °C');
      const contactsTraced = body.contactsTraced === undefined ? 0 : Math.max(0, Math.floor(num(body.contactsTraced, 'contactsTraced') ?? 0));
      if (contactsTraced > 1000) throw httpErrors.badRequest('contactsTraced is unreasonably large');
      const notes = optStr(body.notes);
      if (notes !== undefined && notes.length > 2000) throw httpErrors.badRequest('Notes are too long (max 2000 characters)');
      const followUp = await db.caseFollowUp.create({
        data: { caseId: found.id, byId: u.id, status, temperature, contactsTraced, notes: notes ?? null },
        include: { by: { select: { id: true, fullName: true } } },
      });
      recordAudit(db, request, {
        action: 'surveillance.case.followUp',
        entityType: 'diseaseCase',
        entityId: found.id,
        after: { status, temperature, contactsTraced },
      });
      return { followUp: toFollowUpPayload(followUp) };
    },
  );
}
