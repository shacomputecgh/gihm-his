import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Point the photo store at a temp directory (the module resolves the root
// lazily per request) so tests never touch the repo's real uploads dir.
const TMP_UPLOADS = path.join(os.tmpdir(), `gihm-photo-tests-${process.pid}`);
process.env.UPLOADS_DIR = TMP_UPLOADS;

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;
let patientId: string;
const patientIds: string[] = [];

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

// 1x1 red PNG — real magic bytes so the server's sniffer accepts it.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const PNG_B64 = PNG_BYTES.toString('base64');
// Minimal JPEG: FF D8 FF … FF D9
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
const JPEG_B64 = JPEG_BYTES.toString('base64');

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Photo Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ email: 'photo-staff@demo.gh', roleCode: 'DOCTOR', facilityId: facility.id });
  const patient = await db.patient.create({
    data: { mrn: `GH-${Math.floor(Math.random() * 900000) + 100000}`, fullName: 'Photo Patient (synthetic)', facilityId, isSynthetic: true },
  });
  patientId = patient.id;
  patientIds.push(patientId);
});

afterAll(async () => {
  await db.patient.deleteMany({ where: { id: { in: patientIds } } });
  await fs.rm(TMP_UPLOADS, { recursive: true, force: true });
  await db.$disconnect();
  await app.close();
});

describe('patient photograph (photo endpoints)', () => {
  it('404s for a patient with no photograph on file', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/photo`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(404);
  });

  it('uploads a photo — patient updated, file on disk, audited', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(staff.token),
      payload: { data: PNG_B64 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);

    const patient = await db.patient.findUniqueOrThrow({ where: { id: patientId } });
    expect(patient.photoStoredName).toBe(`patients/${patientId}/photo.png`);
    await expect(fs.access(path.join(TMP_UPLOADS, patient.photoStoredName!))).resolves.toBeUndefined();

    const audit = await db.auditLog.findFirst({ where: { action: 'patient.photo.upload', entityId: patientId } });
    expect(audit?.after).toContain('"mimeType":"image/png"');
    expect(audit?.after).toContain(`"sizeBytes":${PNG_BYTES.length}`);
  });

  it('serves the exact bytes with the right content type', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/photo`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect((res.rawPayload as Buffer).equals(PNG_BYTES)).toBe(true);
  });

  it('replaces the photo — new file written, old file removed', async () => {
    const before = await db.patient.findUniqueOrThrow({ where: { id: patientId } });
    const oldPath = path.join(TMP_UPLOADS, before.photoStoredName!);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(staff.token),
      payload: { data: JPEG_B64 },
    });
    expect(res.statusCode).toBe(200);
    const after = await db.patient.findUniqueOrThrow({ where: { id: patientId } });
    expect(after.photoStoredName).toBe(`patients/${patientId}/photo.jpg`);
    // The old PNG is gone, the new JPEG is present.
    await expect(fs.access(oldPath)).rejects.toThrow();
    await expect(fs.access(path.join(TMP_UPLOADS, after.photoStoredName!))).resolves.toBeUndefined();
  });

  it('validates uploads — bad base64 and non-image payloads are 400', async () => {
    const badB64 = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(staff.token),
      payload: { data: '%%%not-base64%%%' },
    });
    expect(badB64.statusCode).toBe(400);

    // A "text/plain" file disguised as base64 is rejected by the magic-byte sniffer.
    const notImage = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(staff.token),
      payload: { data: Buffer.from('hello this is not an image').toString('base64') },
    });
    expect(notImage.statusCode).toBe(400);
    expect(notImage.json().error.message).toContain('not a supported image');

    const missing = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(staff.token),
      payload: { data: '' },
    });
    expect(missing.statusCode).toBe(400);
  });

  it('rejects oversize uploads (400)', async () => {
    // 8.5 MB decoded → ~11.3 MB base64, inside the 12 MB request body limit so
    // the decoded-size check (8 MB) fires with a clean 400.
    const big = Buffer.alloc(8.5 * 1024 * 1024, 0x41).toString('base64');
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(staff.token),
      payload: { data: big },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toContain('8 MB');
  });

  it('view-only roles can view but not write (403)', async () => {
    const viewer = await makeUser({ email: 'photo-viewer@demo.gh', roleCode: 'CASHIER', facilityId, permissions: ['view_patient', 'view_clinical_record'] });
    const get = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/photo`, headers: auth(viewer.token) });
    expect(get.statusCode).toBe(200);

    const up = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(viewer.token),
      payload: { data: PNG_B64 },
    });
    expect(up.statusCode).toBe(403);
    const del = await app.inject({ method: 'DELETE', url: `/api/v1/patients/${patientId}/photo`, headers: auth(viewer.token) });
    expect(del.statusCode).toBe(403);
  });

  it('patient portal (self_access): reads own photo, cannot change it', async () => {
    const portal = await makeUser({
      email: 'photo-portal@demo.gh',
      roleCode: 'PATIENT',
      scope: 'PATIENT',
      permissions: ['self_access'],
      linkPatientId: patientId,
    });
    const get = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/photo`, headers: auth(portal.token) });
    expect(get.statusCode).toBe(200);
    const up = await app.inject({
      method: 'PUT',
      url: `/api/v1/patients/${patientId}/photo`,
      headers: auth(portal.token),
      payload: { data: PNG_B64 },
    });
    expect(up.statusCode).toBe(403);
  });

  it('deletes the photo — row cleared, file gone, audited', async () => {
    const before = await db.patient.findUniqueOrThrow({ where: { id: patientId } });
    const file = path.join(TMP_UPLOADS, before.photoStoredName!);

    const res = await app.inject({ method: 'DELETE', url: `/api/v1/patients/${patientId}/photo`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);
    const after = await db.patient.findUniqueOrThrow({ where: { id: patientId } });
    expect(after.photoStoredName).toBeNull();
    await expect(fs.access(file)).rejects.toThrow();
    const audit = await db.auditLog.findFirst({ where: { action: 'patient.photo.delete', entityId: patientId } });
    expect(audit?.after).toContain('"storedName":');

    // Deleting again is a no-op — nothing to remove.
    const again = await app.inject({ method: 'DELETE', url: `/api/v1/patients/${patientId}/photo`, headers: auth(staff.token) });
    expect(again.statusCode).toBe(200);
    expect(again.json().removed).toBe(false);
  });
});
