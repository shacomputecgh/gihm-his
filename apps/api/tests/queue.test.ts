import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let clerk: { token: string };
let facilityId: string;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Queue Test Facility (synthetic)');
  facilityId = facility.id;
  await db.department.create({ data: { name: 'Outpatient Department', facilityId } });
  clerk = await makeUser({ email: 'queue-clerk@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: ['view_queue', 'manage_queue', 'create_patient'] });
});

afterAll(async () => {
  const deptIds = (await db.department.findMany({ where: { facilityId }, select: { id: true } })).map((d) => d.id);
  await db.queueSequence.deleteMany({ where: { departmentId: { in: deptIds } } });
  await db.queueEntry.deleteMany({ where: { facilityId } });
  await db.department.deleteMany({ where: { facilityId } });
  await db.patient.deleteMany({ where: { facilityId } });
  await db.$disconnect();
  await app.close();
});

// The department is recreated per run (new UUID) but ticket-sequence rows are
// keyed by departmentId and outlive the department across runs — wipe any
// orphaned rows from earlier runs so the first check-in is always OUT-001.
beforeEach(async () => {
  await db.queueSequence.deleteMany({});
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makePatient(name = `Queue Patient (synthetic)`) {
  const res = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(clerk.token), payload: { fullName: name, force: true } });
  expect(res.statusCode).toBe(200);
  return (res.json().patient as { id: string }).id;
}

describe('queue ticket generation', () => {
  it('issues monotonic tickets across days — a fresh check-in never collides with yesterday\'s ticket', async () => {
    const dept = await db.department.findFirstOrThrow({ where: { facilityId, name: 'Outpatient Department' } });
    const patientId = await makePatient('Queue Day-2 Patient (synthetic)');

    // Seed yesterday's tickets exactly as the demo seed does (OUT-001…OUT-006).
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    for (let i = 1; i <= 6; i++) {
      await db.queueEntry.create({
        data: { facilityId, departmentId: dept.id, patientId, ticket: `OUT-${String(i).padStart(3, '0')}`, status: 'WAITING', createdAt: yesterday },
      });
    }

    // The old per-day counter would compute seq = 1 (no entries today) and
    // attempt OUT-001 again → unique violation (facilityId, departmentId, ticket).
    // The counter must count ALL rows so the next ticket is OUT-007.
    const res = await app.inject({ method: 'POST', url: '/api/v1/queue', headers: auth(clerk.token), payload: { departmentId: dept.id, patientId } });
    expect(res.statusCode).toBe(200);
    const { entry } = res.json() as { entry: { ticket: string; status: string } };
    expect(entry.ticket).toBe('OUT-007');
    expect(entry.status).toBe('WAITING');

    // A second check-in the same day continues the sequence.
    const second = await app.inject({ method: 'POST', url: '/api/v1/queue', headers: auth(clerk.token), payload: { departmentId: dept.id, patientId } });
    expect(second.statusCode).toBe(200);
    expect((second.json() as { entry: { ticket: string } }).entry.ticket).toBe('OUT-008');
  });

  it('rejects a check-in to an unknown department', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/queue', headers: auth(clerk.token), payload: { departmentId: 'does-not-exist', patientId: null } });
    expect(res.statusCode).toBe(404);
  });
});

describe('queue lifecycle', () => {
  it('runs a ticket through WAITING → CALLED → IN_SERVICE → COMPLETED', async () => {
    const dept = await db.department.findFirstOrThrow({ where: { facilityId, name: 'Outpatient Department' } });
    const patientId = await makePatient('Queue Lifecycle Patient (synthetic)');

    const checkIn = await app.inject({ method: 'POST', url: '/api/v1/queue', headers: auth(clerk.token), payload: { departmentId: dept.id, patientId } });
    expect(checkIn.statusCode).toBe(200);
    const { entry } = checkIn.json() as { entry: { id: string; ticket: string; status: string } };
    expect(entry.status).toBe('WAITING');

    // The board lists it.
    const board = await app.inject({ method: 'GET', url: '/api/v1/queue', headers: auth(clerk.token) });
    expect(board.statusCode).toBe(200);
    const { entries } = board.json() as { entries: { id: string; ticket: string }[] };
    expect(entries.some((e) => e.id === entry.id)).toBe(true);

    // Call next → CALLED.
    const called = await app.inject({ method: 'POST', url: `/api/v1/queue/${dept.id}/call-next`, headers: auth(clerk.token) });
    expect(called.statusCode).toBe(200);
    expect((called.json() as { entry: { id: string; status: string } }).entry.status).toBe('CALLED');

    // Start → IN_SERVICE.
    const started = await app.inject({ method: 'POST', url: `/api/v1/queue/${entry.id}/status`, headers: auth(clerk.token), payload: { status: 'IN_SERVICE' } });
    expect(started.statusCode).toBe(200);
    expect((started.json() as { entry: { status: string } }).entry.status).toBe('IN_SERVICE');

    // Complete → COMPLETED with servedAt.
    const done = await app.inject({ method: 'POST', url: `/api/v1/queue/${entry.id}/status`, headers: auth(clerk.token), payload: { status: 'COMPLETED' } });
    expect(done.statusCode).toBe(200);
    const completed = done.json() as { entry: { status: string; servedAt: string | null } };
    expect(completed.entry.status).toBe('COMPLETED');
    expect(completed.entry.servedAt).not.toBeNull();

    // Invalid status is rejected.
    const bad = await app.inject({ method: 'POST', url: `/api/v1/queue/${entry.id}/status`, headers: auth(clerk.token), payload: { status: 'NOPE' } });
    expect(bad.statusCode).toBe(400);
  });
});
