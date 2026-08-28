import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

export const db = new PrismaClient();

export async function createTestApp(): Promise<FastifyInstance> {
  return buildApp({ db, logger: false });
}

export interface TestUser {
  email: string;
  password: string;
  token: string;
  userId: string;
}

export async function makeUser(opts: {
  email?: string;
  roleCode?: string;
  scope?: string;
  permissions?: string[];
  facilityId?: string | null;
  regionId?: string | null;
  districtId?: string | null;
  linkPatientId?: string | null;
}): Promise<TestUser> {
  const roleCode = opts.roleCode ?? 'DOCTOR';
  const password = 'Demo@123';
  // Each test user gets its OWN role row (unique code) so that test files sharing a
  // roleCode never race on the same role row and silently inherit another file's permissions.
  const uniqueCode = `TST-${roleCode}-${Math.random().toString(36).slice(2, 10)}`;
  const role = await db.role.create({
    data: {
      code: uniqueCode,
      name: roleCode.replace(/_/g, ' '),
      scope: opts.scope ?? 'FACILITY',
      permissions: JSON.stringify(opts.permissions ?? ['view_patient', 'create_patient', 'view_clinical_record', 'write_clinical_note', 'prescribe', 'order_lab', 'verify_lab', 'order_imaging', 'verify_imaging', 'dispense', 'sync_data', 'view_dashboard', 'view_appointments', 'book_appointment', 'view_queue', 'manage_queue']),
    },
  });
  const email = opts.email ?? `user-${Math.random().toString(36).slice(2, 8)}@demo.gh`;
  const user = await db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 4),
      fullName: 'Test User',
      roleId: role.id,
      facilityId: opts.facilityId ?? null,
      regionId: opts.regionId ?? null,
      districtId: opts.districtId ?? null,
      status: 'ACTIVE',
      isSynthetic: true,
      patient: opts.linkPatientId ? { connect: { id: opts.linkPatientId } } : undefined,
    },
  });

  const app = await createTestApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login failed for test user: ${res.statusCode} ${res.body}`);
  }
  await app.close();
  return { email, password, token: (res.json() as { token: string }).token, userId: user.id };
}

export async function makeFacility(name = 'Test Facility (synthetic)') {
  const region = await db.region.upsert({
    where: { code: 'TST' },
    create: { code: 'TST', name: 'Test Region (synthetic)', capital: 'Test City' },
    update: {},
  });
  const district = await db.district.upsert({
    where: { code: 'TST-01' },
    create: { code: 'TST-01', name: 'Test District (synthetic)', type: 'DISTRICT', regionId: region.id },
    update: { regionId: region.id },
  });
  return db.facility.create({
    data: {
      code: `TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name,
      type: 'CLINIC',
      level: 'PRIMARY',
      ownership: 'PRIVATE',
      regionId: region.id,
      districtId: district.id,
      services: '["OPD"]',
      departmentsJson: '[]',
      openingHours: '{}',
      isSynthetic: true,
      status: 'ACTIVE',
    },
  });
}
