import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { nextRunAt, periodForCadence, validateSchedule, reportRetryMaxAttempts, runReportRetrySweep } from '../src/modules/reports/schedule.js';

// ---------------------------------------------------------------------------
// Scheduled reports (spec §149, docs/14 §5): cadence math, period derivation,
// CRUD + scope visibility, the due-run sweep with email delivery (captured via
// a test transport), and the permission gate.
// ---------------------------------------------------------------------------

const PERMS = ['view_reports', 'view_dashboard', 'manage_scheduled_reports', 'view_patient', 'create_patient', 'write_clinical_note'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

let app: FastifyInstance;
let admin: { token: string; userId: string };
let nurse: { token: string };
let facilityId: string;

const DAY = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Scheduled Reports Facility (synthetic)');
  facilityId = facility.id;
  admin = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS, scope: 'FACILITY' });
  const n = await makeUser({ roleCode: 'NURSE', facilityId, permissions: ['view_patient', 'write_clinical_note'] });
  nurse = { token: n.token };
});

afterAll(async () => {
  await db.scheduledReport.deleteMany({});
  await db.reportDelivery.deleteMany({});
  await db.facility.deleteMany({ where: { id: facilityId } });
  await db.$disconnect();
  await app.close();
});

function makeSchedule(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Monthly OPD summary',
    reportType: 'summary',
    cadence: 'monthly',
    runTime: '08:00',
    dayOfMonth: 1,
    recipients: 'ops@demo.gh, manager@demo.gh',
    groupBy: 'none',
    ...overrides,
  };
}

describe('cadence math (pure)', () => {
  it('daily: next run after the run time today is tomorrow', () => {
    const after = new Date('2026-01-15T09:00:00Z');
    const next = nextRunAt(after, { cadence: 'daily', runTime: '08:00', dayOfWeek: null, dayOfMonth: null });
    expect(next.toISOString()).toBe('2026-01-16T08:00:00.000Z');
  });

  it('daily: before the run time, the run is today', () => {
    const after = new Date('2026-01-15T07:00:00Z');
    const next = nextRunAt(after, { cadence: 'daily', runTime: '08:00', dayOfWeek: null, dayOfMonth: null });
    expect(next.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('weekly: lands on the configured weekday', () => {
    // 2026-01-15 is a Thursday. dayOfWeek 1 = Monday.
    const after = new Date('2026-01-15T09:00:00Z');
    const next = nextRunAt(after, { cadence: 'weekly', runTime: '09:30', dayOfWeek: 1, dayOfMonth: null });
    expect(next.getUTCDay()).toBe(1);
    expect(next.toISOString()).toBe('2026-01-19T09:30:00.000Z');
  });

  it('monthly: honours dayOfMonth and moves to next month once passed', () => {
    const after = new Date('2026-01-05T09:00:00Z');
    const next = nextRunAt(after, { cadence: 'monthly', runTime: '08:00', dayOfWeek: null, dayOfMonth: 1 });
    expect(next.toISOString()).toBe('2026-02-01T08:00:00.000Z');
  });

  it('quarterly: only Jan/Apr/Jul/Oct', () => {
    const after = new Date('2026-01-05T09:00:00Z');
    const next = nextRunAt(after, { cadence: 'quarterly', runTime: '08:00', dayOfWeek: null, dayOfMonth: 1 });
    expect(next.getUTCMonth()).toBe(3); // April
    expect(next.getUTCDate()).toBe(1);
  });

  it('annual: only January', () => {
    const after = new Date('2026-06-05T09:00:00Z');
    const next = nextRunAt(after, { cadence: 'annual', runTime: '08:00', dayOfWeek: null, dayOfMonth: 15 });
    expect(next.getUTCMonth()).toBe(0);
    expect(next.getUTCDate()).toBe(15);
    expect(next.getUTCFullYear()).toBe(2027);
  });
});

describe('period derivation (pure)', () => {
  it('daily covers the previous day', () => {
    const { from, to } = periodForCadence('daily', new Date('2026-01-15T08:00:00Z'));
    expect(from.toISOString().slice(0, 10)).toBe('2026-01-14');
    expect(to.toISOString().slice(0, 10)).toBe('2026-01-15');
  });

  it('monthly covers the previous calendar month', () => {
    const { from, to } = periodForCadence('monthly', new Date('2026-03-01T08:00:00Z'));
    expect(from.toISOString().slice(0, 10)).toBe('2026-02-01');
    expect(to.toISOString().slice(0, 10)).toBe('2026-03-01');
  });

  it('quarterly covers the previous quarter', () => {
    const { from, to } = periodForCadence('quarterly', new Date('2026-04-01T08:00:00Z'));
    expect(from.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(to.toISOString().slice(0, 10)).toBe('2026-04-01');
  });

  it('annual covers the previous year', () => {
    const { from, to } = periodForCadence('annual', new Date('2026-01-15T08:00:00Z'));
    expect(from.toISOString().slice(0, 10)).toBe('2025-01-01');
    expect(to.toISOString().slice(0, 10)).toBe('2026-01-01');
  });
});

describe('validation', () => {
  it('rejects an empty recipient list', () => {
    expect(() => validateSchedule(makeSchedule({ recipients: '' }))).toThrow(/recipient email/);
  });
  it('rejects malformed runTime', () => {
    expect(() => validateSchedule(makeSchedule({ runTime: '25:99' }))).toThrow(/HH:MM/);
  });
  it('rejects weekly without dayOfWeek', () => {
    expect(() => validateSchedule(makeSchedule({ cadence: 'weekly' }))).toThrow(/dayOfWeek/);
  });
  it('accepts a valid schedule and dedupes recipients', () => {
    const v = validateSchedule(makeSchedule({ recipients: 'a@demo.gh, a@demo.gh' }));
    expect(v.recipients).toEqual(['a@demo.gh']);
  });
});

describe('scheduled report CRUD', () => {
  let scheduleId: string;

  it('creates a schedule with a nextRunAt in the future', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/reports/schedules', headers: auth(admin.token), payload: makeSchedule() });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    scheduleId = body.id;
    expect(body.scope).toBe('FACILITY');
    expect(body.facilityId).toBe(facilityId);
    expect(new Date(body.nextRunAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('lists schedules in scope', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/reports/schedules', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.schedules.some((s: { id: string }) => s.id === scheduleId)).toBe(true);
  });

  it('hides schedules from a caller in another facility', async () => {
    const other = await makeUser({ roleCode: 'NURSE', permissions: ['view_reports'], scope: 'FACILITY' }); // no facility
    const res = await app.inject({ method: 'GET', url: '/api/v1/reports/schedules', headers: auth(other.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().schedules).toHaveLength(0);
  });

  it('hides regional schedules from a director in another region', async () => {
    // Unique code AND name per run — the Region model constrains both, and a
    // leftover from a previously failed run must never collide with this one.
    const suffix = Math.random().toString(36).slice(2, 8);
    const region = await db.region.create({ data: { code: `TST2-${suffix}`, name: `Second Test Region (synthetic) ${suffix}`, capital: 'X' } });
    try {
      const regional = await makeUser({ roleCode: 'REGIONAL_DIRECTOR', permissions: PERMS, scope: 'REGIONAL', regionId: region.id });
      const sched = await db.scheduledReport.create({
        data: { name: 'Other region monthly', reportType: 'summary', cadence: 'monthly', runTime: '08:00', dayOfMonth: 1, recipients: 'other@demo.gh', scope: 'REGIONAL', regionId: region.id, createdById: admin.userId, nextRunAt: new Date(Date.now() + 30 * DAY) },
      });
      // The admin user (FACILITY scope) never sees REGIONAL schedules.
      const res = await app.inject({ method: 'GET', url: '/api/v1/reports/schedules', headers: auth(admin.token) });
      expect(res.json().schedules.some((s: { id: string }) => s.id === sched.id)).toBe(false);
      await db.scheduledReport.delete({ where: { id: sched.id } });
    } finally {
      await db.region.deleteMany({ where: { code: { startsWith: 'TST2-' } } }).catch(() => {});
    }
  });

  it('pauses and resumes a schedule', async () => {
    const res = await app.inject({ method: 'PATCH', url: `/api/v1/reports/schedules/${scheduleId}`, headers: auth(admin.token), payload: { active: false } });
    expect(res.statusCode).toBe(200);
    expect(res.json().active).toBe(false);
    const resumed = await app.inject({ method: 'PATCH', url: `/api/v1/reports/schedules/${scheduleId}`, headers: auth(admin.token), payload: { active: true } });
    expect(resumed.json().active).toBe(true);
  });

  it('requires the manage permission', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/reports/schedules', headers: auth(nurse.token), payload: makeSchedule() });
    expect(res.statusCode).toBe(403);
  });

  it('runs a schedule now and records a delivery', async () => {
    let captured: Array<{ to: string; subject: string; text: string; html: string }> = [];
    const mailToTest = async (to: string, subject: string, text: string, html: string) => {
      captured.push({ to, subject, text, html });
      return { dispatched: true, note: `emailed ${to}`, messageId: 'test-1' };
    };
    const { runSchedule } = await import('../src/modules/reports/schedule.js');
    const schedule = await db.scheduledReport.findUnique({ where: { id: scheduleId } });
    const result = await runSchedule(db, schedule!, new Date(), { mailToTest });
    expect(result.status).toBe('sent');
    expect(captured).toHaveLength(2); // two recipients
    const delivery = await db.reportDelivery.findFirst({ where: { scheduleId } });
    expect(delivery!.status).toBe('sent');
    expect(delivery!.recipients).toContain('ops@demo.gh');
  });

  it('deletes a schedule', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/api/v1/reports/schedules/${scheduleId}`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const gone = await app.inject({ method: 'GET', url: '/api/v1/reports/schedules', headers: auth(admin.token) });
    expect(gone.json().schedules.some((s: { id: string }) => s.id === scheduleId)).toBe(false);
  });
});

describe('sweep', () => {
  it('runs only due schedules and reports a summary', async () => {
    const now = new Date();
    const due = await db.scheduledReport.create({
      data: {
        name: 'Due daily summary',
        reportType: 'summary',
        cadence: 'daily',
        runTime: '08:00',
        recipients: 'due@demo.gh',
        groupBy: 'none',
        scope: 'FACILITY',
        facilityId,
        createdById: admin.userId,
        active: true,
        nextRunAt: new Date(now.getTime() - 1000), // due
      },
    });
    const future = await db.scheduledReport.create({
      data: {
        name: 'Not yet due',
        reportType: 'summary',
        cadence: 'daily',
        runTime: '08:00',
        recipients: 'future@demo.gh',
        groupBy: 'none',
        scope: 'FACILITY',
        facilityId,
        createdById: admin.userId,
        active: true,
        nextRunAt: new Date(now.getTime() + 86_400_000), // not due
      },
    });

    let mails = 0;
    const { runDueSchedules } = await import('../src/modules/reports/schedule.js');
    const summary = await runDueSchedules(db, {
      now,
      mailToTest: async (to) => {
        mails++;
        return { dispatched: true, note: `emailed ${to}`, messageId: 'x' };
      },
    });
    expect(summary.ran).toBe(1);
    expect(summary.sent).toBe(1);
    expect(mails).toBe(1); // only the due schedule's single recipient

    const ran = await db.scheduledReport.findUnique({ where: { id: due.id } });
    expect(ran!.lastStatus).toBe('sent');
    expect(new Date(ran!.nextRunAt).getTime()).toBeGreaterThan(now.getTime()); // advanced

    const untouched = await db.scheduledReport.findUnique({ where: { id: future.id } });
    expect(untouched!.lastStatus).toBeNull();

    await db.scheduledReport.deleteMany({ where: { id: { in: [due.id, future.id] } } });
  });

  it('marks the run skipped when one of several recipients fails', async () => {
    const now = new Date();
    const sched = await db.scheduledReport.create({
      data: { name: 'Partial fan-out', reportType: 'summary', cadence: 'daily', runTime: '08:00', recipients: 'ok@demo.gh,bad@demo.gh', scope: 'FACILITY', facilityId, createdById: admin.userId, active: true, nextRunAt: new Date(now.getTime() - 1000) },
    });
    const { runSchedule } = await import('../src/modules/reports/schedule.js');
    const result = await runSchedule(db, sched, now, {
      mailToTest: async (to) => (to.startsWith('bad') ? { dispatched: false, note: 'SMTP rejected' } : { dispatched: true, note: 'sent', messageId: 'm1' }),
    });
    expect(result.status).toBe('skipped');
    expect(result.note).toContain('bad@demo.gh');
    expect(result.note).toContain('ok@demo.gh');
    await db.scheduledReport.delete({ where: { id: sched.id } });
  });

  it('records a skip (not a failure) when SMTP is not configured', async () => {
    const now = new Date();
    const sched = await db.scheduledReport.create({
      data: {
        name: 'No SMTP summary',
        reportType: 'summary',
        cadence: 'daily',
        runTime: '08:00',
        recipients: 'nobody@demo.gh',
        groupBy: 'none',
        scope: 'FACILITY',
        facilityId,
        createdById: admin.userId,
        active: true,
        nextRunAt: new Date(now.getTime() - 1000),
      },
    });
    const { runSchedule } = await import('../src/modules/reports/schedule.js');
    // A transport that declines (as the real lib does without MAIL_HOST).
    const result = await runSchedule(db, sched, now, {
      mailToTest: async () => ({ dispatched: false, note: 'SMTP not connected' }),
    });
    expect(result.status).toBe('skipped');
    const delivery = await db.reportDelivery.findFirst({ where: { scheduleId: sched.id } });
    expect(delivery!.status).toBe('skipped');
    await db.scheduledReport.delete({ where: { id: sched.id } });
  });
});

describe('delivery retries', () => {
  let schedId: string;

  beforeEach(async () => {
    const now = new Date();
    const sched = await db.scheduledReport.create({
      data: {
        name: 'Retry me',
        reportType: 'summary',
        cadence: 'daily',
        runTime: '08:00',
        recipients: 'retry@demo.gh',
        groupBy: 'none',
        scope: 'FACILITY',
        facilityId,
        createdById: admin.userId,
        active: true,
        nextRunAt: new Date(now.getTime() + 86_400_000),
      },
    });
    schedId = sched.id;
  });

  async function failedDelivery(): Promise<string> {
    const to = new Date();
    const from = new Date(to.getTime() - DAY);
    const row = await db.reportDelivery.create({
      data: { scheduleId: schedId, reportType: 'summary', periodFrom: from, periodTo: to, recipients: 'retry@demo.gh', status: 'failed', note: 'Report build failed: boom' },
    });
    return row.id;
  }

  it('retries a failed delivery and flips it to sent', async () => {
    const id = await failedDelivery();
    let mails = 0;
    const summary = await runReportRetrySweep(db, {
      mailToTest: async (to) => {
        mails++;
        return { dispatched: true, note: `emailed ${to}`, messageId: 'r1' };
      },
    });
    expect(summary.retried).toBe(1);
    expect(summary.delivered).toBe(1);
    expect(mails).toBe(1);
    const row = await db.reportDelivery.findUnique({ where: { id } });
    expect(row!.status).toBe('sent');
    expect(row!.attempts).toBe(1);
    expect(row!.nextAttemptAt).toBeNull();
    // The schedule's last status reflects the successful retry.
    const sched = await db.scheduledReport.findUnique({ where: { id: schedId } });
    expect(sched!.lastStatus).toBe('sent');
    expect(sched!.lastError).toBeNull();
  });

  it('backs off and stops retrying after reports.retryMaxAttempts', async () => {
    const id = await failedDelivery();
    const max = reportRetryMaxAttempts();
    // Already at the final attempt: the next retry is the last allowed one.
    await db.reportDelivery.update({ where: { id }, data: { attempts: max - 1, nextAttemptAt: null } });
    const failing = async () => ({ dispatched: false, note: 'SMTP down' });
    const first = await runReportRetrySweep(db, { mailToTest: failing });
    expect(first.retried).toBe(1);
    expect(first.delivered).toBe(0);
    expect(first.failed).toBe(1);
    const row = await db.reportDelivery.findUnique({ where: { id } });
    expect(row!.attempts).toBe(max);
    expect(row!.nextAttemptAt).not.toBeNull(); // backoff scheduled (but max reached)
    // A later sweep must not touch the exhausted row again.
    const second = await runReportRetrySweep(db, { mailToTest: failing });
    expect(second.retried).toBe(0);
  });

  it('manual retry endpoint retries a delivery and needs the manage permission', async () => {
    const id = await failedDelivery();
    const res = await app.inject({ method: 'POST', url: `/api/v1/reports/schedules/deliveries/${id}/retry`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    // No SMTP in tests → the retry rebuilds and re-fans out, landing as skipped
    // (attempts bumped) instead of sent; the sweep test covers full delivery.
    expect(res.json().delivered).toBe(false);
    const row = await db.reportDelivery.findUnique({ where: { id } });
    expect(row!.status).toBe('skipped');
    expect(row!.attempts).toBe(1);
    expect(row!.nextAttemptAt).not.toBeNull();
    expect(row!.note).toContain('SMTP');
    // The nurse lacks manage_scheduled_reports → 403.
    const denied = await app.inject({ method: 'POST', url: `/api/v1/reports/schedules/deliveries/${id}/retry`, headers: auth(nurse.token) });
    expect(denied.statusCode).toBe(403);
    // A delivery outside the caller's scope is not found.
    const other = await makeUser({ roleCode: 'NURSE', permissions: ['manage_scheduled_reports'], scope: 'FACILITY' }); // no facility
    const hidden = await app.inject({ method: 'POST', url: `/api/v1/reports/schedules/deliveries/${id}/retry`, headers: auth(other.token) });
    expect(hidden.statusCode).toBe(404);
  });
});
