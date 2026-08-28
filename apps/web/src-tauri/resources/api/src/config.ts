import dotenv from 'dotenv';

// Load the developer's .env for runtime/seed runs only. Tests must stay
// hermetic: the developer's live credentials (SMS gateway keys, etc.) must
// never leak into the test environment — vitest already injects DATABASE_URL,
// JWT_SECRET and NODE_ENV=test.
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me-ghm-his-2026',
  // Empty WEB_ORIGIN counts as unset (matches lib/settings.ts conventions) —
  // otherwise an empty value would resolve to '' and disable CORS entirely.
  webOrigin: process.env.WEB_ORIGIN?.trim() ? process.env.WEB_ORIGIN : 'http://localhost:5173,http://tauri.localhost,tauri://localhost,capacitor://localhost,https://localhost',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  timezone: 'Africa/Accra',
  // Digital patient folder (docs/10): where uploaded patient documents are
  // stored on disk. Never served statically — only streamed through the
  // authenticated /patients/:id/documents/:docId/content endpoint.
  uploadsDir: process.env.UPLOADS_DIR ?? 'uploads',
  // Facility edge relay (docs/16 §2): when this deployment is a facility edge
  // with a national/regional upstream, bubble the local mutation log up through
  // the shared /sync/mutations protocol. Inactive unless EDGE_RELAY_URL is set.
  edgeRelay: {
    url: process.env.EDGE_RELAY_URL ?? '',
    username: process.env.EDGE_RELAY_USERNAME ?? '',
    password: process.env.EDGE_RELAY_PASSWORD ?? '',
    deviceId: process.env.EDGE_RELAY_DEVICE_ID ?? `edge-${process.env.HOSTNAME ?? 'local'}`,
    intervalMs: Math.max(5, Number(process.env.EDGE_RELAY_INTERVAL_MINUTES ?? 1)) * 60 * 1000,
    stateFile: process.env.EDGE_RELAY_STATE_FILE ?? 'edge-relay-state.json',
    batchSize: Math.min(200, Math.max(1, Number(process.env.EDGE_RELAY_BATCH ?? 100))),
    // Multi-facility district edge (docs/16 §1): when set, only mutations of
    // this facility are relayed (one relay instance per facility). Unset for a
    // single-facility edge, which relays the whole local log.
    facilityId: process.env.EDGE_RELAY_FACILITY_ID ?? undefined,
  },
  // National integration adapters (docs/08 §3): DHIMS2 (indicator datasets),
  // SORMAS (disease case events), GhiLMIS (logistics stock levels) and HRIMS
  // (workforce) each keep an independent delivery queue; the sweep pushes
  // pending rows to the configured upstream with backoff.
  integrations: {
    dhims2: {
      url: process.env.INTEGRATION_DHIMS2_URL ?? '',
      username: process.env.INTEGRATION_DHIMS2_USERNAME ?? '',
      password: process.env.INTEGRATION_DHIMS2_PASSWORD ?? '',
    },
    sormas: {
      url: process.env.INTEGRATION_SORMAS_URL ?? '',
      username: process.env.INTEGRATION_SORMAS_USERNAME ?? '',
      password: process.env.INTEGRATION_SORMAS_PASSWORD ?? '',
    },
    ghilmis: {
      url: process.env.INTEGRATION_GHILMIS_URL ?? '',
      username: process.env.INTEGRATION_GHILMIS_USERNAME ?? '',
      password: process.env.INTEGRATION_GHILMIS_PASSWORD ?? '',
    },
    hrims: {
      url: process.env.INTEGRATION_HRIMS_URL ?? '',
      username: process.env.INTEGRATION_HRIMS_USERNAME ?? '',
      password: process.env.INTEGRATION_HRIMS_PASSWORD ?? '',
    },
    nhis: {
      url: process.env.INTEGRATION_NHIS_URL ?? '',
      username: process.env.INTEGRATION_NHIS_USERNAME ?? '',
      password: process.env.INTEGRATION_NHIS_PASSWORD ?? '',
    },
    etracker: {
      url: process.env.INTEGRATION_ETRACKER_URL ?? '',
      username: process.env.INTEGRATION_ETRACKER_USERNAME ?? '',
      password: process.env.INTEGRATION_ETRACKER_PASSWORD ?? '',
    },
    lhims: {
      url: process.env.INTEGRATION_LHIMS_URL ?? '',
      username: process.env.INTEGRATION_LHIMS_USERNAME ?? '',
      password: process.env.INTEGRATION_LHIMS_PASSWORD ?? '',
    },
    sweepIntervalMs: Math.max(10, Number(process.env.INTEGRATION_SWEEP_INTERVAL_MINUTES ?? 1)) * 60 * 1000,
    maxAttempts: Math.max(1, Number(process.env.INTEGRATION_MAX_ATTEMPTS ?? 5)),
    batchSize: Math.min(50, Math.max(1, Number(process.env.INTEGRATION_BATCH ?? 10))),
  },
  // Auto reminder sweep (spec §22): recalls due/overdue children on a schedule.
  reminderJob: {
    enabled: process.env.REMINDER_JOB_ENABLED !== 'false',
    intervalMs: Math.max(1, Number(process.env.REMINDER_JOB_INTERVAL_MINUTES ?? 24 * 60)) * 60 * 1000,
    windowDays: Number(process.env.REMINDER_JOB_WINDOW_DAYS ?? 7),
    lookbackDays: Number(process.env.REMINDER_JOB_LOOKBACK_DAYS ?? 7),
  },
};
