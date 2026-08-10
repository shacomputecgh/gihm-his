import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Patient Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ email: 'patients-staff@demo.gh', roleCode: 'DOCTOR', facilityId: facility.id });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('patient registration + MPI', () => {
  it('registers a new patient with an MRN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: {
        fullName: 'Kofi Antwi Mensah',
        dateOfBirth: '1990-05-20',
        sex: 'M',
        phone: '0244112233',
        ghanaCard: 'GHA-123456789-0',
        districtId: undefined,
        consentAccepted: true,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.patient.mrn).toMatch(/^GH-\d{6}$/);
    expect(body.mpi).toBe('ok');
    expect(body.patient.facilityId).toBe(facilityId);
  });

  it('flags a likely duplicate via the Master Patient Index (409)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Kofi Antwi Mensah', dateOfBirth: '1990-05-20', phone: '0244112233', ghanaCard: 'GHA-123456789-0' },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error.code).toBe('MPI_DUPLICATE');
    expect(body.error.candidates.length).toBeGreaterThan(0);
    expect(body.error.candidates[0].score).toBeGreaterThanOrEqual(80);
  });

  it('forces creation when the user confirms the duplicate is intended', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Kofi Antwi Mensah', dateOfBirth: '1990-05-20', phone: '0244112233', force: true },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns the longitudinal patient record', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/patients?q=Kofi', headers: auth(staff.token) });
    const first = list.json().items[0];
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${first.id}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('encounters');
  });

  it('rejects access to a patient outside the caller facility scope', async () => {
    const other = await makeUser({ email: 'other-facility@demo.gh', roleCode: 'DOCTOR' }); // no facility
    const list = await app.inject({ method: 'GET', url: '/api/v1/patients', headers: auth(staff.token) });
    const patient = list.json().items[0];
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patient.id}`, headers: auth(other.token) });
    expect(res.statusCode).toBe(403);
  });
});
