import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from './service.js';
import { config } from '../../config.js';

/** Folder categories — mirror the admission form's documents checklist. */
export const DOCUMENT_CATEGORIES = [
  'GHANA_CARD',
  'NHIS_CARD',
  'PASSPORT',
  'VISA_PERMIT',
  'IDENTITY',
  'REFERRAL_LETTER',
  'LAB_RESULT',
  'IMAGING',
  'PRESCRIPTION',
  'DISCHARGE_SUMMARY',
  'CONSENT',
  'INSURANCE',
  'MEDICAL_RECORD',
  'OTHER',
] as const;

// Allowed document types (scans, photos, PDFs, office docs). The extension
// drives both the stored suffix and the served Content-Type — the client's
// claimed mimeType is ignored so a mislabelled file can't masquerade.
const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB decoded
const MAX_MB = 10;

/**
 * Uploads root, resolved lazily so tests can point UPLOADS_DIR at a temp
 * directory without the module capturing it at import time.
 */
function uploadsRoot(): string {
  const root = process.env.UPLOADS_DIR ?? config.uploadsDir;
  return path.isAbsolute(root) ? root : path.resolve(process.cwd(), root);
}

async function absPath(storedName: string): Promise<string> {
  const root = path.resolve(uploadsRoot());
  const abs = path.resolve(root, storedName);
  // Canonical containment check (defense-in-depth — storedName is always
  // server-generated as patients/<id>/<uuid>.<ext>).
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw httpErrors.internalServerError('Invalid document path');
  return abs;
}

export function registerPatientDocumentRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  const include = { uploadedBy: { select: { id: true, fullName: true } } } as const;

  // ------------------------------------------------------------- list
  app.get(
    '/patients/:id/documents',
    { preHandler: guards.requirePermission('view_patient', 'view_clinical_record', 'self_access'), schema: { summary: 'List the patient digital folder (documents)', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const docs = await db.patientDocument.findMany({
        where: { patientId: params.id },
        orderBy: { createdAt: 'desc' },
        include,
      });
      return { documents: docs.map(({ storedName: _stored, ...doc }) => ({ ...doc })) };
    },
  );

  // ------------------------------------------------------------ upload
  // Base64-in-JSON (no multipart dependency): fine for scans/PDFs up to 10 MB,
  // with a per-route body limit so the JSON envelope can carry the encoding.
  // Writing to a patient folder is a record edit — write_clinical_note only
  // (view_patient grants read access, never destructive document actions).
  app.post(
    '/patients/:id/documents',
    {
      preHandler: guards.requirePermission('write_clinical_note'),
      bodyLimit: 16 * 1024 * 1024,
      schema: { summary: 'Upload a document to the patient folder (base64 data)', tags: ['patients'] },
    },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;

      const originalName = path.basename(str(body.originalName, 'originalName', { required: true, max: 190 })).trim();
      if (!originalName) throw httpErrors.badRequest('Field "originalName" is required');
      const ext = path.extname(originalName).slice(1).toLowerCase();
      const mimeType = EXT_MIME[ext];
      if (!mimeType) throw httpErrors.badRequest(`Unsupported document type ".${ext || 'unknown'}" — allowed: ${Object.keys(EXT_MIME).join(', ')}`);

      const category = (optStr(body.category)?.toUpperCase() ?? 'OTHER') as string;
      if (!(DOCUMENT_CATEGORIES as readonly string[]).includes(category)) {
        throw httpErrors.badRequest(`Category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`);
      }

      const raw = (optStr(body.data) ?? '').replace(/\s+/g, '');
      if (!raw) throw httpErrors.badRequest('Document data (base64) is required');
      const buffer = Buffer.from(raw, 'base64');
      if (buffer.length === 0 || buffer.toString('base64') !== raw) {
        throw httpErrors.badRequest('Document data is not valid base64');
      }
      if (buffer.length > MAX_BYTES) {
        throw httpErrors.badRequest(`Document exceeds the ${MAX_MB} MB size limit`);
      }

      const storedName = path.join('patients', params.id, `${randomUUID()}.${ext}`);
      const target = path.join(uploadsRoot(), storedName);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, buffer);

      const doc = await db.patientDocument.create({
        data: {
          patientId: params.id,
          category,
          originalName,
          storedName,
          mimeType,
          sizeBytes: buffer.length,
          notes: optStr(body.notes),
          uploadedById: u.id,
        },
        include,
      });
      recordAudit(db, request, {
        action: 'patient.document.upload',
        entityType: 'patientDocument',
        entityId: doc.id,
        after: { patientId: params.id, category, originalName, mimeType, sizeBytes: buffer.length },
      });
      const { storedName: _stored, ...rest } = doc;
      return { document: rest };
    },
  );

  // ----------------------------------------------------------- content
  // Authenticated stream — documents are never served from a static path.
  app.get(
    '/patients/:id/documents/:docId/content',
    { preHandler: guards.requirePermission('view_patient', 'view_clinical_record', 'self_access'), schema: { summary: 'Download a patient document (authenticated)', tags: ['patients'] } },
    async (request, reply) => {
      const u = request.user!;
      const params = request.params as { id: string; docId: string };
      await assertPatientAccess(db, u, params.id);
      const doc = await db.patientDocument.findFirst({ where: { id: params.docId, patientId: params.id } });
      if (!doc) throw httpErrors.notFound('Document not found');
      const abs = await absPath(doc.storedName);
      try {
        await fs.access(abs);
      } catch {
        throw httpErrors.gone('Document file is missing from storage');
      }
      reply.header('Content-Type', doc.mimeType);
      reply.header('Content-Length', String(doc.sizeBytes));
      reply.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`);
      return reply.send(createReadStream(abs));
    },
  );

  // ------------------------------------------------------------- update
  app.patch(
    '/patients/:id/documents/:docId',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Update a document category / notes', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; docId: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const doc = await db.patientDocument.findFirst({ where: { id: params.docId, patientId: params.id } });
      if (!doc) throw httpErrors.notFound('Document not found');

      const categoryRaw = optStr(body.category);
      const category = categoryRaw !== undefined ? (categoryRaw.toUpperCase() as string) : undefined;
      if (category !== undefined && !(DOCUMENT_CATEGORIES as readonly string[]).includes(category)) {
        throw httpErrors.badRequest(`Category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`);
      }
      const notes = optStr(body.notes) ?? null;

      const updated = await db.patientDocument.update({
        where: { id: doc.id },
        data: { ...(category ? { category } : {}), ...(body.notes !== undefined ? { notes } : {}) },
        include,
      });
      recordAudit(db, request, {
        action: 'patient.document.update',
        entityType: 'patientDocument',
        entityId: doc.id,
        after: { category: updated.category, notes: updated.notes ?? null },
      });
      const { storedName: _stored, ...rest } = updated;
      return { document: rest };
    },
  );

  // ------------------------------------------------------------- delete
  app.delete(
    '/patients/:id/documents/:docId',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Delete a patient document (file + record)', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; docId: string };
      await assertPatientAccess(db, u, params.id);
      const doc = await db.patientDocument.findFirst({ where: { id: params.docId, patientId: params.id } });
      if (!doc) throw httpErrors.notFound('Document not found');
      await db.patientDocument.delete({ where: { id: doc.id } });
      try {
        await fs.unlink(await absPath(doc.storedName));
      } catch {
        /* file already gone — row is the source of truth */
      }
      recordAudit(db, request, {
        action: 'patient.document.delete',
        entityType: 'patientDocument',
        entityId: doc.id,
        after: { patientId: params.id, originalName: doc.originalName, category: doc.category },
      });
      return { ok: true };
    },
  );
}
