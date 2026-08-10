import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

describe('auth', () => {
  it('logs in with valid credentials and returns a JWT + user', async () => {
    const u = await makeUser({ email: 'auth-test@demo.gh', roleCode: 'DOCTOR' });
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'auth-test@demo.gh', password: 'Demo@123' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe('auth-test@demo.gh');
    // Test users get isolated role rows (unique code), but the role name maps from the requested roleCode.
    expect(body.user.roleName).toBe('DOCTOR');
    void u;
  });

  it('rejects a wrong password', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'auth-test@demo.gh', password: 'wrong-password' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns the current user via /auth/me', async () => {
    const u = await makeUser({ email: 'auth-me@demo.gh' });
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${u.token}` } });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.email).toBe('auth-me@demo.gh');
  });

  it('rejects protected routes without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});
