import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Blood bank (spec §27): the donor registry, donations that mint blood units
// (reactive donations are discarded, never usable), scoped unit inventory with
// crossmatch-before-issue safety, and transfusion completion (a reaction
// discards the unit). The happy path lives in clinical3.test.ts — these cover
// the scope boundaries, permission guards, validation and blood-safety rules.
let app: FastifyInstance;
let facilityUser: TestUser;
let otherFacility: TestUser;
let noPerm: TestUser;

let r1: { id: string };
let r2: { id: string };
let d1: { id: string };
let d2: { id: string };
let a1f: { id: string };
let a2f: { id: string };
let p1Id = '';
const userIds: string[] = [];
const donorIds: string[] = [];
const donationIds: string[] = [];
const unitIds: string[] = [];
const transfusionIds: string[] = [];

async function createRegion(code: string, name: string) {
  return db.region.create({ data: { code, name, capital: 'Test Capital' } });
}
async function createDistrict(code: string, name: string, regionId: string) {
  return db.district.create({ data: { code, name, type: 'DISTRICT', regionId } });
}
async function createFacility(code: string, name: string, regionId: string, districtId: string) {
  return db.facility.create({
    data: {
      code,
      name,
      type: 'CLINIC',
      level: 'PRIMARY',
      ownership: 'PRIVATE',
      regionId,
      districtId,
      services: '["OPD"]',
      departmentsJson: '[]',
      openingHours: '{}',
      isSynthetic: true,
      status: 'ACTIVE',
    },
  });
}

const PERMS = ['view_patient', 'manage_blood_bank', 'order_lab', 'verify_lab', 'dispense', 'write_clinical_note', 'view_financial'];

beforeAll(async () => {
  r1 = await createRegion('BBK-1', 'Blood Bank Region One (synthetic)');
  r2 = await createRegion('BBK-2', 'Blood Bank Region Two (synthetic)');
  d1 = await createDistrict('BBK-1-01', 'Blood Bank District One (synthetic)', r1.id);
  d2 = await createDistrict('BBK-2-01', 'Blood Bank District Two (synthetic)', r2.id);
  a1f = await createFacility('BBK-1-F', 'Blood Bank Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('BBK-2-F', 'Blood Bank Facility Two (synthetic)', r2.id, d2.id);

  const p1 = await db.patient.create({
    data: { mrn: 'BBK-0001', fullName: 'Blood Bank Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;

  facilityUser = await makeUser({ email: 'bbk-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: PERMS });
  otherFacility = await makeUser({ email: 'bbk-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: PERMS });
  noPerm = await makeUser({ email: 'bbk-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_dashboard'] });
  userIds.push(facilityUser.userId, otherFacility.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  // Facility-scoped cleanup: every blood-bank row in this file belongs to the
  // two facilities created in beforeAll, and deleting by facility also catches
  // rows the tests never tracked (e.g. the IN_PROGRESS transfusion records
  // minted by issue).
  await db.transfusionRecord.deleteMany({ where: { facilityId: { in: [a1f.id, a2f.id] } } });
  await db.bloodUnit.deleteMany({ where: { facilityId: { in: [a1f.id, a2f.id] } } });
  await db.bloodDonation.deleteMany({ where: { facilityId: { in: [a1f.id, a2f.id] } } });
  await db.bloodDonor.deleteMany({ where: { facilityId: { in: [a1f.id, a2f.id] } } });
  await db.patient.deleteMany({ where: { id: p1Id } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const donors = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/bloodbank/donors${q}`, headers: auth(t) });
const addDonor = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/bloodbank/donors', headers: auth(t), payload });
const donations = (t: string) => app.inject({ method: 'GET', url: '/api/v1/bloodbank/donations', headers: auth(t) });
const donate = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/bloodbank/donations', headers: auth(t), payload });
const units = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/bloodbank/units${q}`, headers: auth(t) });
const crossmatch = (t: string, id: string, patientId: string) =>
  app.inject({ method: 'POST', url: `/api/v1/bloodbank/units/${id}/crossmatch`, headers: auth(t), payload: { patientId } });
const issue = (t: string, id: string, patientId: string) =>
  app.inject({ method: 'POST', url: `/api/v1/bloodbank/units/${id}/issue`, headers: auth(t), payload: { patientId } });
const transfusions = (t: string) => app.inject({ method: 'GET', url: '/api/v1/bloodbank/transfusions', headers: auth(t) });
const complete = (t: string, id: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: `/api/v1/bloodbank/transfusions/${id}/complete`, headers: auth(t), payload });

async function makeDonor(bloodGroup = 'O+', by: TestUser = facilityUser) {
  const res = await addDonor(by.token, { fullName: `Donor ${Math.random().toString(36).slice(2, 8)} (synthetic)`, bloodGroup, sex: 'M' });
  expect(res.statusCode).toBe(200);
  const donor = res.json().donor;
  donorIds.push(donor.id);
  return donor;
}

describe('donor registry', () => {
  it('registers a donor and lists with bloodGroup/status filters', async () => {
    const donor = await makeDonor('A-');
    expect(donor.status).toBe('ACTIVE');
    expect(donor.bloodGroup).toBe('A-');
    const list = await donors(facilityUser.token, '?bloodGroup=A-');
    expect(list.json().items.some((d: { id: string }) => d.id === donor.id)).toBe(true);
    const none = await donors(facilityUser.token, '?bloodGroup=AB%2B');
    expect(none.json().items.some((d: { id: string }) => d.id === donor.id)).toBe(false);
  });

  it('rejects an invalid blood group and callers without manage_blood_bank', async () => {
    const bad = await addDonor(facilityUser.token, { fullName: 'Bad Donor (synthetic)', bloodGroup: 'XX' });
    expect(bad.statusCode).toBe(400);
    const noPermRes = await addDonor(noPerm.token, { fullName: 'No Perm Donor (synthetic)', bloodGroup: 'O+' });
    expect(noPermRes.statusCode).toBe(403);
  });
});

describe('donations', () => {
  it('creates sequential AVAILABLE units and bumps the donor’s totals', async () => {
    const donor = await makeDonor('O+');
    const res = await donate(facilityUser.token, { donorId: donor.id, bloodGroup: 'O+', screeningResult: 'NEGATIVE', unitsCreated: 2, volumeMl: 450 });
    expect(res.statusCode).toBe(200);
    const { donation, units: created } = res.json();
    donationIds.push(donation.id);
    created.forEach((u: { id: string }) => unitIds.push(u.id));
    expect(created).toHaveLength(2);
    expect(created.map((u: { status: string }) => u.status)).toEqual(['AVAILABLE', 'AVAILABLE']);
    expect(created[0].unitCode).toMatch(/^BL-\d{4}-0001$/);
    expect(created[1].unitCode).toMatch(/^BL-\d{4}-0002$/);
    const refreshed = await db.bloodDonor.findUnique({ where: { id: donor.id } });
    expect(refreshed?.totalDonations).toBe(1);
    expect(refreshed?.lastDonationAt).toBeTruthy();
  });

  it('discards units from a reactive donation — never usable inventory', async () => {
    const donor = await makeDonor('B+');
    const res = await donate(facilityUser.token, { donorId: donor.id, bloodGroup: 'B+', screeningResult: 'REACTIVE', unitsCreated: 1 });
    expect(res.statusCode).toBe(200);
    const { donation, units: created } = res.json();
    donationIds.push(donation.id);
    unitIds.push(created[0].id);
    expect(created[0].status).toBe('DISCARDED');
    const inv = await units(facilityUser.token, '?bloodGroup=B%2B');
    expect(inv.json().items.some((u: { id: string }) => u.id === created[0].id)).toBe(false);
  });
});

describe('unit inventory', () => {
  it('summarises availability by blood group and scopes to the caller’s facility', async () => {
    const donor = await makeDonor('AB+');
    const res = await donate(facilityUser.token, { donorId: donor.id, bloodGroup: 'AB+', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(res.json().donation.id);
    const unit = res.json().units[0];
    unitIds.push(unit.id);

    const inv = await units(facilityUser.token);
    const summary = inv.json().summary as { bloodGroup: string; available: number }[];
    expect(summary.find((s) => s.bloodGroup === 'AB+')?.available).toBe(1);
    expect(inv.json().items.some((u: { id: string }) => u.id === unit.id)).toBe(true);

    // The a2f user must not see a1f inventory.
    const other = await units(otherFacility.token);
    expect(other.json().items.some((u: { id: string }) => u.id === unit.id)).toBe(false);
  });

  it('rejects callers without a unit-inventory permission', async () => {
    expect((await units(noPerm.token)).statusCode).toBe(403);
    expect((await donors(noPerm.token)).statusCode).toBe(403);
    expect((await donations(noPerm.token)).statusCode).toBe(403);
    expect((await transfusions(noPerm.token)).statusCode).toBe(403);
  });
});

describe('crossmatch and issue', () => {
  it('crossmatches an AVAILABLE unit, then issues it; a non-crossmatched unit cannot be issued', async () => {
    const donor = await makeDonor('O-');
    const res = await donate(facilityUser.token, { donorId: donor.id, bloodGroup: 'O-', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(res.json().donation.id);
    const unit = res.json().units[0];
    unitIds.push(unit.id);

    // Safety: an AVAILABLE unit must not be issued without a crossmatch.
    const early = await issue(facilityUser.token, unit.id, p1Id);
    expect(early.statusCode).toBe(409);

    const xm = await crossmatch(facilityUser.token, unit.id, p1Id);
    expect(xm.statusCode).toBe(200);
    expect(xm.json().unit.status).toBe('CROSSMATCHED');
    const xmRecord = await db.transfusionRecord.findFirst({ where: { unitId: unit.id, status: 'CROSSMATCHED' } });
    expect(xmRecord).toBeTruthy();
    if (xmRecord) transfusionIds.push(xmRecord.id);

    const issueRes = await issue(facilityUser.token, unit.id, p1Id);
    expect(issueRes.statusCode).toBe(200);
    expect(issueRes.json().unit.status).toBe('ISSUED');

    // An ISSUED unit cannot be crossmatched again.
    const again = await crossmatch(facilityUser.token, unit.id, p1Id);
    expect(again.statusCode).toBe(409);
  });

  it('refuses crossmatch on a discarded unit, an unknown patient, and an out-of-scope unit', async () => {
    const donor = await makeDonor('A+');
    const res = await donate(facilityUser.token, { donorId: donor.id, bloodGroup: 'A+', screeningResult: 'REACTIVE', unitsCreated: 1 });
    donationIds.push(res.json().donation.id);
    const discarded = res.json().units[0];
    unitIds.push(discarded.id);
    const onDiscarded = await crossmatch(facilityUser.token, discarded.id, p1Id);
    expect(onDiscarded.statusCode).toBe(409);

    const donor2 = await makeDonor('A+');
    const res2 = await donate(facilityUser.token, { donorId: donor2.id, bloodGroup: 'A+', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(res2.json().donation.id);
    const unit = res2.json().units[0];
    unitIds.push(unit.id);
    const unknownPatient = await crossmatch(facilityUser.token, unit.id, 'no-such-patient');
    expect(unknownPatient.statusCode).toBe(404);

    const otherDonor = await makeDonor('O+', otherFacility);
    const otherDonation = await donate(otherFacility.token, { donorId: otherDonor.id, bloodGroup: 'O+', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(otherDonation.json().donation.id);
    const otherUnit = otherDonation.json().units[0];
    unitIds.push(otherUnit.id);
    const outOfScope = await crossmatch(facilityUser.token, otherUnit.id, p1Id);
    expect(outOfScope.statusCode).toBe(404);
  });
});

describe('transfusions', () => {
  it('completes a transfusion and marks a reaction, discarding the unit', async () => {
    const donor = await makeDonor('B-');
    const res = await donate(facilityUser.token, { donorId: donor.id, bloodGroup: 'B-', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(res.json().donation.id);
    const unit = res.json().units[0];
    unitIds.push(unit.id);
    await crossmatch(facilityUser.token, unit.id, p1Id);
    const issueRes = await issue(facilityUser.token, unit.id, p1Id);
    const record = (await transfusions(facilityUser.token)).json().items.find((r: { unitId: string }) => r.unitId === unit.id);
    expect(record).toBeTruthy();
    transfusionIds.push(record.id);

    const clean = await complete(facilityUser.token, record.id, {});
    expect(clean.statusCode).toBe(200);
    expect(clean.json().record.status).toBe('COMPLETED');

    // A reaction on the second transfusion of a fresh unit discards it.
    const donor2 = await makeDonor('B-');
    const res2 = await donate(facilityUser.token, { donorId: donor2.id, bloodGroup: 'B-', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(res2.json().donation.id);
    const unit2 = res2.json().units[0];
    unitIds.push(unit2.id);
    await crossmatch(facilityUser.token, unit2.id, p1Id);
    await issue(facilityUser.token, unit2.id, p1Id);
    const record2 = (await transfusions(facilityUser.token)).json().items.find((r: { unitId: string }) => r.unitId === unit2.id);
    transfusionIds.push(record2.id);
    const reacted = await complete(facilityUser.token, record2.id, { reaction: 'Fever and chills' });
    expect(reacted.statusCode).toBe(200);
    expect(reacted.json().record.status).toBe('REACTION');
    expect((await db.bloodUnit.findUnique({ where: { id: unit2.id } }))?.status).toBe('DISCARDED');
  });

  it('refuses to complete a transfusion out of scope', async () => {
    const otherDonor = await makeDonor('O+', otherFacility);
    const otherRes = await donate(otherFacility.token, { donorId: otherDonor.id, bloodGroup: 'O+', screeningResult: 'NEGATIVE', unitsCreated: 1 });
    donationIds.push(otherRes.json().donation.id);
    const otherUnit = otherRes.json().units[0];
    unitIds.push(otherUnit.id);
    // p1 is a1f's patient but the crossmatch endpoint looks the patient up
    // unscoped; the record still belongs to a2f, so completing it must 403.
    await crossmatch(otherFacility.token, otherUnit.id, p1Id);
    await issue(otherFacility.token, otherUnit.id, p1Id);
    const record = (await transfusions(otherFacility.token)).json().items.find((r: { unitId: string }) => r.unitId === otherUnit.id);
    transfusionIds.push(record.id);
    const outOfScope = await complete(facilityUser.token, record.id, {});
    expect(outOfScope.statusCode).toBe(403);
  });
});
