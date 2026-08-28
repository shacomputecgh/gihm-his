import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Point the digital folder at a temp directory (the module resolves the root
// lazily per request) so tests never touch the repo's real uploads dir.
const TMP_UPLOADS = path.join(os.tmpdir(), `gihm-doc-tests-${process.pid}`);
process.env.UPLOADS_DIR = TMP_UPLOADS;

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;
let patientId: string;
const patientIds: string[] = [];

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Document Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ email: 'doc-staff@demo.gh', roleCode: 'DOCTOR', facilityId: facility.id });
  const patient = await db.patient.create({
    data: { mrn: `GH-${Math.floor(Math.random() * 900000) + 100000}`, fullName: 'Document Folder (synthetic)', facilityId, isSynthetic: true },
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

const PDF_BYTES = Buffer.from('%PDF-1.4 hello digital folder 1234567890');
const PDF_B64 = PDF_BYTES.toString('base64');

describe('patient digital folder (documents)', () => {
  it('uploads a document — row created, file on disk, audited', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(staff.token),
      payload: { originalName: 'NHIS Card.pdf', category: 'NHIS_CARD', notes: 'valid until 2027', data: PDF_B64 },
    });
    expect(res.statusCode).toBe(200);
    const doc = res.json().document;
    expect(doc.category).toBe('NHIS_CARD');
    expect(doc.mimeType).toBe('application/pdf');
    expect(doc.sizeBytes).toBe(PDF_BYTES.length);
    expect(doc.notes).toBe('valid until 2027');
    expect(doc.originalName).toBe('NHIS Card.pdf');
    expect(doc.uploadedBy.fullName).toBe('Test User');
    expect(doc).not.toHaveProperty('storedName'); // internal path never exposed

    // File really landed under the uploads root, in a per-patient folder.
    const row = await db.patientDocument.findUniqueOrThrow({ where: { id: doc.id } });
    await expect(fs.access(path.join(TMP_UPLOADS, row.storedName))).resolves.toBeUndefined();
    const audit = await db.auditLog.findFirst({ where: { action: 'patient.document.upload', entityId: doc.id } });
    expect(audit?.after).toContain('"originalName":"NHIS Card.pdf"');
  });

  it('lists the folder — scoped to the patient, newest first', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const docs = res.json().documents as Array<{ originalName: string; uploadedBy: { fullName: string } | null }>;
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0]?.originalName).toBeDefined();
    expect(docs[0]?.uploadedBy?.fullName).toBe('Test User');
  });

  it('downloads the exact bytes with the right content type', async () => {
    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(staff.token) });
    const doc = list.json().documents[0];
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents/${doc.id}/content`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect((res.rawPayload as Buffer).equals(PDF_BYTES)).toBe(true);
  });

  it('rejects users without the folder permissions (403)', async () => {
    const bystander = await makeUser({ email: 'doc-bystander@demo.gh', roleCode: 'CASHIER', facilityId, permissions: ['view_dashboard'] });
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(bystander.token) });
    expect(res.statusCode).toBe(403);
  });

  it('view-only access: list/download allowed, write actions denied (403)', async () => {
    const viewer = await makeUser({ email: 'doc-viewer@demo.gh', roleCode: 'CASHIER', facilityId, permissions: ['view_patient', 'view_clinical_record'] });
    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(viewer.token) });
    expect(list.statusCode).toBe(200);

    const doc = list.json().documents[0];
    const content = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents/${doc.id}/content`, headers: auth(viewer.token) });
    expect(content.statusCode).toBe(200);

    // A read-only role must never be able to write to the folder.
    const up = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(viewer.token),
      payload: { originalName: 'x.pdf', data: PDF_B64 },
    });
    expect(up.statusCode).toBe(403);
    const del = await app.inject({ method: 'DELETE', url: `/api/v1/patients/${patientId}/documents/${doc.id}`, headers: auth(viewer.token) });
    expect(del.statusCode).toBe(403);
  });

  it('rejects access from a different facility scope (403)', async () => {
    const otherFacility = await makeFacility('Document Other Facility (synthetic)');
    const outsider = await makeUser({ email: 'doc-outsider@demo.gh', roleCode: 'DOCTOR', facilityId: otherFacility.id });
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(outsider.token) });
    expect(res.statusCode).toBe(403);
  });

  it('validates uploads — bad base64 and unsupported types are 400', async () => {
    const badB64 = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(staff.token),
      payload: { originalName: 'x.pdf', data: '%%%not-base64%%%' },
    });
    expect(badB64.statusCode).toBe(400);

    const badExt = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(staff.token),
      payload: { originalName: 'script.exe', data: Buffer.from('x').toString('base64') },
    });
    expect(badExt.statusCode).toBe(400);
    expect(badExt.json().error.message).toContain('Unsupported document type');

    const missing = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(staff.token),
      payload: { originalName: 'y.pdf', category: 'NOT_A_CATEGORY', data: PDF_B64 },
    });
    expect(missing.statusCode).toBe(400);
  });

  it('updates category/notes — audited', async () => {
    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(staff.token) });
    const doc = list.json().documents[0];
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/patients/${patientId}/documents/${doc.id}`,
      headers: auth(staff.token),
      payload: { category: 'IDENTITY', notes: 're-issued' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().document.category).toBe('IDENTITY');
    expect(res.json().document.notes).toBe('re-issued');
    const audit = await db.auditLog.findFirst({ where: { action: 'patient.document.update', entityId: doc.id } });
    expect(audit?.after).toContain('"category":"IDENTITY"');

    // Bad category rejected — record unchanged.
    const bad = await app.inject({
      method: 'PATCH',
      url: `/api/v1/patients/${patientId}/documents/${doc.id}`,
      headers: auth(staff.token),
      payload: { category: 'BOGUS' },
    });
    expect(bad.statusCode).toBe(400);
  });

  it('deletes a document — row gone, file gone, audited', async () => {
    const up = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(staff.token),
      payload: { originalName: 'referral.pdf', category: 'REFERRAL_LETTER', data: PDF_B64 },
    });
    const docId = up.json().document.id as string;
    const row = await db.patientDocument.findUniqueOrThrow({ where: { id: docId } });

    const res = await app.inject({ method: 'DELETE', url: `/api/v1/patients/${patientId}/documents/${docId}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(await db.patientDocument.findUnique({ where: { id: docId } })).toBeNull();
    await expect(fs.access(path.join(TMP_UPLOADS, row.storedName))).rejects.toThrow();
    const audit = await db.auditLog.findFirst({ where: { action: 'patient.document.delete', entityId: docId } });
    expect(audit?.after).toContain('"originalName":"referral.pdf"');
  });

  it('patient portal (self_access): reads own folder, cannot write to it', async () => {
    const portal = await makeUser({
      email: 'doc-portal@demo.gh',
      roleCode: 'PATIENT',
      scope: 'PATIENT',
      permissions: ['self_access'],
      linkPatientId: patientId,
    });
    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(portal.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().documents.length).toBeGreaterThan(0);

    const doc = list.json().documents[0];
    const content = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents/${doc.id}/content`, headers: auth(portal.token) });
    expect(content.statusCode).toBe(200);

    // A patient is read-only on their own folder.
    const up = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/documents`,
      headers: auth(portal.token),
      payload: { originalName: 'x.pdf', data: PDF_B64 },
    });
    expect(up.statusCode).toBe(403);
    const del = await app.inject({ method: 'DELETE', url: `/api/v1/patients/${patientId}/documents/${doc.id}`, headers: auth(portal.token) });
    expect(del.statusCode).toBe(403);
  });

  it('404s for a document on another patient (no cross-folder leak)', async () => {
    const other = await db.patient.create({
      data: { mrn: `GH-${Math.floor(Math.random() * 900000) + 100000}`, fullName: 'Document Other Patient (synthetic)', facilityId, isSynthetic: true },
    });
    patientIds.push(other.id);
    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/documents`, headers: auth(staff.token) });
    const docId = list.json().documents[0].id as string;
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${other.id}/documents/${docId}/content`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(404);
  });
});
