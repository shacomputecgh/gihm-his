import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from './service.js';
import { config } from '../../config.js';

// One ID photograph per patient record (admission-form checklist): stored on
// disk as patients/<patientId>/photo.<ext>, the path kept on Patient.photoStoredName.
// Served only through the authenticated endpoint — never from a static path.

const PHOTO_EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB decoded

function uploadsRoot(): string {
  const root = process.env.UPLOADS_DIR ?? config.uploadsDir;
  return path.isAbsolute(root) ? root : path.resolve(process.cwd(), root);
}

async function absPath(storedName: string): Promise<string> {
  const root = path.resolve(uploadsRoot());
  const abs = path.resolve(root, storedName);
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw httpErrors.internalServerError('Invalid photo path');
  return abs;
}

export function registerPatientPhotoRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ upload
  // Replaces any previous photo (one photo per patient). Uploading is a record
  // edit — write_clinical_note only; viewing stays view-level.
  app.put(
    '/patients/:id/photo',
    {
      preHandler: guards.requirePermission('write_clinical_note'),
      bodyLimit: 12 * 1024 * 1024,
      schema: { summary: 'Upload (or replace) the patient photograph (base64 data)', tags: ['patients'] },
    },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;

      const raw = (optStr(body.data) ?? '').replace(/\s+/g, '');
      if (!raw) throw httpErrors.badRequest('Photo data (base64) is required');
      const buffer = Buffer.from(raw, 'base64');
      if (buffer.length === 0 || buffer.toString('base64') !== raw) {
        throw httpErrors.badRequest('Photo data is not valid base64');
      }
      if (buffer.length > MAX_BYTES) throw httpErrors.badRequest('Photo exceeds the 8 MB size limit');

      // Sniff the real image type from the magic bytes (client-declared names
      // are ignored — a mislabelled file can't masquerade as an image).
      const sniffed = sniffImageType(buffer);
      if (!sniffed) throw httpErrors.badRequest('File is not a supported image (jpg, png, webp, gif)');
      const ext = sniffed;

      const patient = await db.patient.findUnique({ where: { id: params.id } });
      if (!patient) throw httpErrors.notFound('Patient not found');

      const storedName = path.join('patients', params.id, `photo.${ext}`);
      const target = path.join(uploadsRoot(), storedName);
      await fs.mkdir(path.dirname(target), { recursive: true });
      // Write the new file first, then remove any previous photo with a
      // different extension — a failed write never orphans the old photo.
      await fs.writeFile(target, buffer);
      if (patient.photoStoredName && patient.photoStoredName !== storedName) {
        try {
          await fs.unlink(await absPath(patient.photoStoredName));
        } catch {
          /* old file already gone — the new write is the source of truth */
        }
      }

      await db.patient.update({ where: { id: params.id }, data: { photoStoredName: storedName } });
      recordAudit(db, request, {
        action: 'patient.photo.upload',
        entityType: 'patient',
        entityId: params.id,
        after: { mrn: patient.mrn, storedName, mimeType: PHOTO_EXT_MIME[ext], sizeBytes: buffer.length },
      });
      return { ok: true, photoStoredName: storedName };
    },
  );

  // -------------------------------------------------------------- serve
  app.get(
    '/patients/:id/photo',
    { preHandler: guards.requirePermission('view_patient', 'view_clinical_record', 'self_access'), schema: { summary: 'Download the patient photograph (authenticated)', tags: ['patients'] } },
    async (request, reply) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const patient = await db.patient.findUnique({ where: { id: params.id } });
      if (!patient?.photoStoredName) throw httpErrors.notFound('No photograph on file');
      const abs = await absPath(patient.photoStoredName);
      try {
        await fs.access(abs);
      } catch {
        throw httpErrors.gone('Photo file is missing from storage');
      }
      const ext = path.extname(patient.photoStoredName).slice(1).toLowerCase();
      reply.header('Content-Type', PHOTO_EXT_MIME[ext] ?? 'application/octet-stream');
      reply.header('Cache-Control', 'private, max-age=3600');
      return reply.send(createReadStream(abs));
    },
  );

  // ------------------------------------------------------------- delete
  app.delete(
    '/patients/:id/photo',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Remove the patient photograph (file + reference)', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const patient = await db.patient.findUnique({ where: { id: params.id } });
      if (!patient?.photoStoredName) return { ok: true, removed: false };
      await db.patient.update({ where: { id: params.id }, data: { photoStoredName: null } });
      try {
        await fs.unlink(await absPath(patient.photoStoredName));
      } catch {
        /* file already gone — the row is the source of truth */
      }
      recordAudit(db, request, {
        action: 'patient.photo.delete',
        entityType: 'patient',
        entityId: params.id,
        after: { mrn: patient.mrn, storedName: patient.photoStoredName },
      });
      return { ok: true, removed: true };
    },
  );
}

/** Detect the image format from magic bytes — returns the extension or null. */
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'png';
  // WEBP: RIFF .... WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  // GIF: GIF87a / GIF89a
  if (buf.toString('ascii', 0, 6) === 'GIF87a' || buf.toString('ascii', 0, 6) === 'GIF89a') return 'gif';
  return null;
}
