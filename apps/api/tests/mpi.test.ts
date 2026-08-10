import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let admin: { token: string };
let facilityId: string;

const ADMIN_PERMS = ['view_patient', 'create_patient', 'write_clinical_note', 'manage_patient_records', 'view_dashboard'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('MPI Test Facility (synthetic)');
  facilityId = facility.id;
  admin = await makeUser({ email: 'mpi-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id, permissions: ADMIN_PERMS });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function createPatient(fullName: string, opts: { phone?: string; force?: boolean } = {}) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/patients',
    headers: auth(admin.token),
    payload: { fullName, dateOfBirth: '1990-01-01', sex: 'F', phone: opts.phone ?? '0244110000', force: opts.force ?? false },
  });
  expect([200, 409]).toContain(res.statusCode);
  return res.statusCode === 200 ? (res.json().patient as { id: string; mrn: string }) : null;
}

describe('MPI duplicate review + merge/unmerge', () => {
  it('surfaces likely duplicate pairs in the review queue', async () => {
    const a = await createPatient('Akosua Owusu Duplicate', { phone: '0244110001' });
    const b = await createPatient('Akosua Owusu Duplicate', { phone: '0244110001', force: true });
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();

    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/mpi/duplicates', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    const found = body.items.find(
      (p: { a: { patientId: string }; b: { patientId: string } }) =>
        (p.a.patientId === a!.id && p.b.patientId === b!.id) || (p.a.patientId === b!.id && p.b.patientId === a!.id),
    );
    expect(found).toBeTruthy();
    expect(found.score).toBeGreaterThanOrEqual(80);
  });

  it('merges two records and moves all clinical history to the target', async () => {
    const a = await createPatient('Esi Frimpong Merge', { phone: '0244110002' });
    const b = await createPatient('Esi Frimpong Merge', { phone: '0244110002', force: true });
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();

    // Give the source record some clinical history to prove it moves.
    const enc = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${b!.id}/encounters`,
      headers: auth(admin.token),
      payload: { type: 'OPD', presentingComplaint: 'Pre-merge encounter' },
    });
    expect(enc.statusCode).toBe(200);
    const encounterId = (enc.json().encounter as { id: string }).id;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/mpi/merge/${b!.id}/into/${a!.id}`,
      headers: auth(admin.token),
      payload: { reason: 'Test merge' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.merged).toBe(true);
    expect(body.moved.encounter).toContain(encounterId);

    const source = await db.patient.findUnique({ where: { id: b!.id } });
    expect(source?.status).toBe('MERGED');
    expect(source?.mergedIntoId).toBe(a!.id);
    const movedEnc = await db.encounter.findUnique({ where: { id: encounterId } });
    expect(movedEnc?.patientId).toBe(a!.id);

    // Audit trail exists.
    const audit = await db.auditLog.findFirst({ where: { action: 'patient.merge' }, orderBy: { createdAt: 'desc' } });
    expect(audit?.entityId).toBe(a!.id);
  });

  it('unmerges and restores the original records', async () => {
    const a = await createPatient('Yaa Asantewaa Unmerge', { phone: '0244110003' });
    const b = await createPatient('Yaa Asantewaa Unmerge', { phone: '0244110003', force: true });
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();

    const enc = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${b!.id}/encounters`,
      headers: auth(admin.token),
      payload: { type: 'OPD', presentingComplaint: 'Will be restored' },
    });
    const encounterId = (enc.json().encounter as { id: string }).id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/admin/mpi/merge/${b!.id}/into/${a!.id}`,
      headers: auth(admin.token),
      payload: { reason: 'Test merge then unmerge' },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/mpi/unmerge/${b!.id}`,
      headers: auth(admin.token),
      payload: { reason: 'Administrative reversal' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.unmerged).toBe(true);

    const source = await db.patient.findUnique({ where: { id: b!.id } });
    expect(source?.status).toBe('ACTIVE');
    expect(source?.mergedIntoId).toBeNull();
    const restored = await db.encounter.findUnique({ where: { id: encounterId } });
    expect(restored?.patientId).toBe(b!.id);

    const merge = await db.patientMerge.findFirst({ where: { sourcePatientId: b!.id }, orderBy: { mergedAt: 'desc' } });
    expect(merge?.unmergedAt).toBeTruthy();
  });

  it('rejects merging without the manage_patient_records permission', async () => {
    const doctor = await makeUser({ email: 'mpi-doctor@demo.gh', roleCode: 'DOCTOR', facilityId });
    const a = await createPatient('Ama Serwaa NoPerm', { phone: '0244110004' });
    const b = await createPatient('Ama Serwaa NoPerm', { phone: '0244110004', force: true });
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/mpi/merge/${b!.id}/into/${a!.id}`,
      headers: auth(doctor.token),
      payload: { reason: 'nope' },
    });
    expect(res.statusCode).toBe(403);
  });
});
