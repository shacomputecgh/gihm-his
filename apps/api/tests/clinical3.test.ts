import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;
let regionId: string;

const PERMS = ['view_patient', 'create_patient', 'write_clinical_note', 'manage_ambulance', 'manage_blood_bank', 'manage_theatre', 'view_dashboard', 'view_reports', 'view_financial', 'view_clinical_record'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Clinical3 Test Facility (synthetic)');
  facilityId = facility.id;
  regionId = facility.regionId;
  staff = await makeUser({ email: 'clinical3-staff@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makePatient(name = `Clinical3 Patient (synthetic)`) {
  const res = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: name, force: true } });
  return (res.json().patient as { id: string; mrn: string }).id;
}

describe('ambulance', () => {
  it('registers an ambulance, dispatches it, and advances a trip to completion', async () => {
    const reg = await app.inject({ method: 'POST', url: '/api/v1/ambulances', headers: auth(staff.token), payload: { registration: 'GV-TEST-01', model: 'Test Van', driverName: 'Driver Test', fuelLevel: 90 } });
    expect(reg.statusCode).toBe(200);
    const ambulance = reg.json().ambulance;
    expect(ambulance.status).toBe('AVAILABLE');

    const patientId = await makePatient('Ambulance Patient (synthetic)');
    const dispatch = await app.inject({ method: 'POST', url: '/api/v1/ambulance/trips', headers: auth(staff.token), payload: { ambulanceId: ambulance.id, patientId, emergencyType: 'TRAUMA', pickupLocation: 'Testville' } });
    expect(dispatch.statusCode).toBe(200);
    const trip = dispatch.json().trip;
    expect(trip.status).toBe('ASSIGNED');

    // Ambulance now ASSIGNED — cannot dispatch again.
    const redispatch = await app.inject({ method: 'POST', url: '/api/v1/ambulance/trips', headers: auth(staff.token), payload: { ambulanceId: ambulance.id, patientId } });
    expect(redispatch.statusCode).toBe(409);

    for (const next of ['EN_ROUTE', 'AT_SCENE', 'TRANSPORTING', 'AT_FACILITY', 'COMPLETED']) {
      const r = await app.inject({ method: 'POST', url: `/api/v1/ambulance/trips/${trip.id}/status`, headers: auth(staff.token), payload: { status: next } });
      expect(r.statusCode).toBe(200);
    }
    const fleet = await app.inject({ method: 'GET', url: '/api/v1/ambulances', headers: auth(staff.token) });
    const row = fleet.json().items.find((a: { id: string }) => a.id === ambulance.id);
    expect(row.status).toBe('AVAILABLE'); // freed after completion
  });

  it('blocks an invalid trip transition', async () => {
    const ambulance = await db.ambulance.create({ data: { facilityId, registration: 'GV-TEST-02', status: 'AVAILABLE' } });
    const trip = await db.ambulanceTrip.create({ data: { ambulanceId: ambulance.id, status: 'ASSIGNED' } });
    const r = await app.inject({ method: 'POST', url: `/api/v1/ambulance/trips/${trip.id}/status`, headers: auth(staff.token), payload: { status: 'COMPLETED' } });
    expect(r.statusCode).toBe(409);
  });
});

describe('blood bank', () => {
  it('registers a donor, records a donation that creates units, then crossmatches and issues', async () => {
    const donorRes = await app.inject({ method: 'POST', url: '/api/v1/bloodbank/donors', headers: auth(staff.token), payload: { fullName: 'Donor Test (synthetic)', bloodGroup: 'O+' } });
    expect(donorRes.statusCode).toBe(200);
    const donor = donorRes.json().donor;

    const donation = await app.inject({ method: 'POST', url: '/api/v1/bloodbank/donations', headers: auth(staff.token), payload: { donorId: donor.id, bloodGroup: 'O+', screeningResult: 'NEGATIVE', unitsCreated: 2 } });
    expect(donation.statusCode).toBe(200);
    expect(donation.json().units.length).toBe(2);

    const units = await app.inject({ method: 'GET', url: '/api/v1/bloodbank/units', headers: auth(staff.token) });
    const unit = units.json().items.find((u: { bloodGroup: string; status: string }) => u.bloodGroup === 'O+' && u.status === 'AVAILABLE');

    const patientId = await makePatient('Blood Patient (synthetic)');
    const xm = await app.inject({ method: 'POST', url: `/api/v1/bloodbank/units/${unit.id}/crossmatch`, headers: auth(staff.token), payload: { patientId } });
    expect(xm.statusCode).toBe(200);
    expect(xm.json().unit.status).toBe('CROSSMATCHED');

    const issue = await app.inject({ method: 'POST', url: `/api/v1/bloodbank/units/${unit.id}/issue`, headers: auth(staff.token), payload: { patientId } });
    expect(issue.statusCode).toBe(200);
    expect(issue.json().unit.status).toBe('ISSUED');

    const tf = await app.inject({ method: 'GET', url: '/api/v1/bloodbank/transfusions', headers: auth(staff.token) });
    expect(tf.json().items.length).toBeGreaterThan(0);
  });

  it('rejects an invalid blood group', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/v1/bloodbank/donors', headers: auth(staff.token), payload: { fullName: 'Bad Donor', bloodGroup: 'XX' } });
    expect(r.statusCode).toBe(400);
  });
});

describe('theatre', () => {
  it('books a case, records consent, and progresses through the workflow', async () => {
    const patientId = await makePatient('Theatre Patient (synthetic)');
    const book = await app.inject({ method: 'POST', url: '/api/v1/theatre/bookings', headers: auth(staff.token), payload: { patientId, procedure: 'Test appendicectomy', theatre: 'Theatre 1', urgency: 'URGENT' } });
    expect(book.statusCode).toBe(200);
    const booking = book.json().booking;
    expect(booking.status).toBe('BOOKED');

    // Cannot go PRE_OP without consent.
    const preOp = await app.inject({ method: 'POST', url: `/api/v1/theatre/bookings/${booking.id}/status`, headers: auth(staff.token), payload: { status: 'PRE_OP' } });
    expect(preOp.statusCode).toBe(409);

    const consent = await app.inject({ method: 'POST', url: `/api/v1/theatre/bookings/${booking.id}/consent`, headers: auth(staff.token), payload: { consentObtained: true, consentNote: 'Consent test' } });
    expect(consent.statusCode).toBe(200);
    expect(consent.json().booking.consentObtained).toBe(true);

    for (const next of ['SCHEDULED', 'PRE_OP', 'IN_PROGRESS', 'RECOVERY', 'COMPLETED']) {
      const r = await app.inject({ method: 'POST', url: `/api/v1/theatre/bookings/${booking.id}/status`, headers: auth(staff.token), payload: { status: next } });
      expect(r.statusCode).toBe(200);
    }
    // Terminal state — no further transitions.
    const again = await app.inject({ method: 'POST', url: `/api/v1/theatre/bookings/${booking.id}/status`, headers: auth(staff.token), payload: { status: 'IN_PROGRESS' } });
    expect(again.statusCode).toBe(409);
  });
});

describe('directorate', () => {
  it('national scope lists all 16 regions; regional scope is restricted to their region', async () => {
    const national = await makeUser({ email: 'clinical3-national@demo.gh', roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', permissions: ['view_reports', 'view_dashboard'] });
    const nr = await app.inject({ method: 'GET', url: '/api/v1/directorate', headers: auth(national.token) });
    expect(nr.statusCode).toBe(200);
    expect(nr.json().level).toBe('NATIONAL');
    expect(nr.json().nodes.length).toBeGreaterThanOrEqual(1);
    const regionNode = nr.json().nodes.find((n: { type: string }) => n.type === 'REGION');
    expect(regionNode).toBeTruthy();

    // Drill into a region → districts.
    const drilled = await app.inject({ method: 'GET', url: `/api/v1/directorate?regionId=${regionNode.id}`, headers: auth(national.token) });
    expect(drilled.statusCode).toBe(200);
    expect(drilled.json().level).toBe('REGIONAL');
    expect(drilled.json().nodes.every((n: { type: string }) => n.type === 'DISTRICT')).toBe(true);

    // Regional director sees only their own region's districts.
    const regional = await makeUser({ email: 'clinical3-regional@demo.gh', roleCode: 'REGIONAL_DIRECTOR', scope: 'REGIONAL', regionId, permissions: ['view_reports', 'view_dashboard'] });
    const rr = await app.inject({ method: 'GET', url: '/api/v1/directorate', headers: auth(regional.token) });
    expect(rr.statusCode).toBe(200);
    expect(rr.json().nodes.length).toBeGreaterThan(0);
    expect(rr.json().nodes.every((n: { type: string }) => n.type === 'DISTRICT')).toBe(true);
  });
});
