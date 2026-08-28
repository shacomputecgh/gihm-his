import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { config } from '../src/config.js';

/**
 * CORS allow-list (docs/26 §6b): the Tauri desktop shell serves the SPA from
 * the WebView2 `tauri://localhost` / `http://tauri.localhost` origins, so the
 * API must allow them — otherwise every desktop-client request is blocked by
 * the browser's same-origin policy. This suite pins both the boot default and
 * the live per-request behaviour (including the admin DB override).
 */

const TAURI_ORIGINS = ['tauri://localhost', 'http://tauri.localhost'];

let app: FastifyInstance;
let admin: { token: string };

beforeAll(async () => {
  // Fresh start — a leftover app.webOrigin row from another file would shadow
  // the boot default below.
  await db.systemSetting.deleteMany();
  app = await createTestApp();
  // Random email (makeUser default) — a fixed one could collide with an
  // orphaned row from a crashed run and fail beforeAll on the unique constraint.
  admin = await makeUser({
    roleCode: 'HOSPITAL_ADMIN',
    permissions: ['manage_system_settings'],
  });
});

afterAll(async () => {
  await db.systemSetting.deleteMany(); // leave the shared DB pristine for other files
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('CORS allow-list', () => {
  it('includes the Tauri desktop-shell origins in the boot default', () => {
    const origins = config.webOrigin.split(',').map((s) => s.trim());
    for (const origin of TAURI_ORIGINS) {
      expect(origins).toContain(origin);
    }
    expect(origins).toContain('http://localhost:5173'); // browser PWA dev origin
  });

  it('echoes the Tauri origins on allowed browser requests', async () => {
    for (const origin of [...TAURI_ORIGINS, 'http://localhost:5173']) {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin } });
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
    }
  });

  it('does not set the CORS header for origins outside the allow-list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://evil.example' } });
    expect(res.statusCode).toBe(200); // request still served; the browser blocks it
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers Tauri-origin preflight requests', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/health',
      headers: {
        origin: 'tauri://localhost',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization,content-type',
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('tauri://localhost');
    expect(String(res.headers['access-control-allow-methods'] ?? '')).toContain('GET');
  });

  it('serves server-to-server requests with no Origin header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('applies an admin app.webOrigin override live, then clears back to the default', async () => {
    // Lock the list to the Tauri origins only (e.g. a prod shell-only policy).
    await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: auth(admin.token),
      payload: { updates: [{ key: 'app.webOrigin', value: TAURI_ORIGINS.join(',') }] },
    });

    const allowed = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'tauri://localhost' } });
    expect(allowed.headers['access-control-allow-origin']).toBe('tauri://localhost');

    // The browser dev origin is no longer listed → header must disappear live.
    const denied = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'http://localhost:5173' } });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();

    // Empty value clears the row → the boot default (with all three origins) resumes.
    await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: auth(admin.token),
      payload: { updates: [{ key: 'app.webOrigin', value: '' }] },
    });
    const restored = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'http://localhost:5173' } });
    expect(restored.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
