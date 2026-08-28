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

  it('captures reminder consent and preferred language at registration', async () => {
    // SMS consent unchecked → reminderOptOut true; preferred language persisted.
    const noSms = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Consent Decline (synthetic)', dateOfBirth: '1995-01-01', sex: 'F', phone: '0244000111', preferredLanguage: 'TW', reminderOptOut: true, force: true },
    });
    expect(noSms.statusCode).toBe(200);
    expect(noSms.json().patient.reminderOptOut).toBe(true);
    expect(noSms.json().patient.preferredLanguage).toBe('TW');

    // Default: consent given (reminderOptOut false), language defaults to EN.
    const defaulted = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Consent Default (synthetic)', dateOfBirth: '1995-01-01', sex: 'M', phone: '0244000222', force: true },
    });
    expect(defaulted.statusCode).toBe(200);
    expect(defaulted.json().patient.reminderOptOut).toBe(false);
    expect(defaulted.json().patient.preferredLanguage).toBe('EN');
  });

  it('updates the preferred language from the patient record (validated + audited)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Language Edit (synthetic)', dateOfBirth: '1995-01-01', sex: 'F', phone: '0244000444', force: true },
    });
    const pid = created.json().patient.id as string;
    const changed = await app.inject({
      method: 'PATCH',
      url: `/api/v1/patients/${pid}/preferred-language`,
      headers: auth(staff.token),
      payload: { preferredLanguage: 'EE' },
    });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().preferredLanguage).toBe('EE');
    const patient = await db.patient.findUnique({ where: { id: pid } });
    expect(patient?.preferredLanguage).toBe('EE');
    const audit = await db.auditLog.findFirst({ where: { action: 'patient.preferred-language.change', entityId: pid } });
    expect(audit?.after).toContain('"preferredLanguage":"EE"');

    // Unknown codes are rejected with a clear 400 — the record keeps its value.
    const bad = await app.inject({
      method: 'PATCH',
      url: `/api/v1/patients/${pid}/preferred-language`,
      headers: auth(staff.token),
      payload: { preferredLanguage: 'ZZ' },
    });
    expect(bad.statusCode).toBe(400);
    const unchanged = await db.patient.findUnique({ where: { id: pid } });
    expect(unchanged?.preferredLanguage).toBe('EE');

    // Input is case-insensitive — lowercase codes normalize to the stored form.
    const lower = await app.inject({
      method: 'PATCH',
      url: `/api/v1/patients/${pid}/preferred-language`,
      headers: auth(staff.token),
      payload: { preferredLanguage: 'ga' },
    });
    expect(lower.statusCode).toBe(200);
    expect(lower.json().preferredLanguage).toBe('GA');
  });

  it('registers a foreign national with passport / visa / international insurance', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: {
        fullName: 'Pierre Dubois',
        dateOfBirth: '1985-11-02',
        sex: 'M',
        phone: '0244778899',
        patientType: 'FOREIGN',
        nationality: 'French',
        passport: 'FR1234567',
        passportIssueDate: '2020-03-10',
        passportExpiryDate: '2030-03-09',
        visaPermitType: 'WORK',
        visaPermitNumber: 'V-889900',
        visaPermitExpiry: '2027-06-30',
        countryOfResidence: 'Ghana',
        permanentAddress: '12 Rue de Paris, Lyon, France',
        internationalInsurer: 'AXA Global',
        internationalPolicyNumber: 'AXA-4471',
        interpreterRequired: true,
        interpreterLanguage: 'French',
        preferredContactMethod: 'WHATSAPP',
      },
    });
    expect(res.statusCode).toBe(200);
    const patient = res.json().patient;
    expect(patient.patientType).toBe('FOREIGN');

    const saved = await db.patient.findUnique({ where: { id: patient.id } });
    expect(saved?.patientType).toBe('FOREIGN');
    expect(saved?.nationality).toBe('French');
    expect(saved?.passport).toBe('FR1234567');
    expect(saved?.passportIssueDate?.toISOString().slice(0, 10)).toBe('2020-03-10');
    expect(saved?.passportExpiryDate?.toISOString().slice(0, 10)).toBe('2030-03-09');
    expect(saved?.visaPermitType).toBe('WORK');
    expect(saved?.visaPermitNumber).toBe('V-889900');
    expect(saved?.visaPermitExpiry?.toISOString().slice(0, 10)).toBe('2027-06-30');
    expect(saved?.countryOfResidence).toBe('Ghana');
    expect(saved?.permanentAddress).toContain('Lyon');
    expect(saved?.internationalInsurer).toBe('AXA Global');
    expect(saved?.internationalPolicyNumber).toBe('AXA-4471');
    expect(saved?.interpreterRequired).toBe(true);
    expect(saved?.interpreterLanguage).toBe('French');
    expect(saved?.preferredContactMethod).toBe('WHATSAPP');
    // A foreigner needs no Ghana Card / NHIS.
    expect(saved?.ghanaCard).toBeNull();
    expect(saved?.nhisNumber).toBeNull();
  });

  it('requires a passport for foreign nationals (server-side rule)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'No Passport (synthetic)', patientType: 'FOREIGN', nationality: 'Togolese' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toContain('passport');
  });

  it('flags a duplicate foreigner by passport via the Master Patient Index', async () => {
    // Pierre Dubois (FR1234567) already exists from the foreigner test above.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Pierre Dubois', dateOfBirth: '1985-11-02', patientType: 'FOREIGN', passport: 'FR1234567', force: false },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('MPI_DUPLICATE');
    expect(res.json().error.candidates[0].matchedOn).toContain('passport');
    expect(res.json().error.candidates[0].score).toBe(100);
  });

  it('rejects an unknown patientType and visaPermitType with a clear 400', async () => {
    const badType = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Alien X (synthetic)', patientType: 'MARTIAN' },
    });
    expect(badType.statusCode).toBe(400);
    expect(badType.json().error.message).toContain('patientType');

    const badVisa = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(staff.token),
      payload: { fullName: 'Visa Test (synthetic)', patientType: 'FOREIGN', visaPermitType: 'OVERSTAY' },
    });
    expect(badVisa.statusCode).toBe(400);
    expect(badVisa.json().error.message).toContain('visaPermitType');
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
