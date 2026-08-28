import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/global-setup.ts',
    // Tests share one SQLite file — run files sequentially to avoid lock contention.
    fileParallelism: false,
    env: {
      DATABASE_URL: 'file:./tests/.tmp/test.db',
      JWT_SECRET: 'test-secret-gihm-his',
      NODE_ENV: 'test',
      // Vitest injects the developer's .env into process.env. Tests must stay
      // hermetic — null out live gateway credentials so no test ever dispatches
      // (or even resolves) against a real SMS provider.
      // NOTE: any future gateway credential env var must be added to this list.
      // WEB_ORIGIN is not a credential, but the developer's .env sets it and
      // would shadow the boot default under test — null it so CORS tests see
      // the real default allow-list (which includes the Tauri shell origins).
      WEB_ORIGIN: '',
      SMS_PROVIDER: '',
      SMSONLINEGH_API_KEY: '',
      SMSONLINEGH_SENDER_ID: '',
      HUBTEL_CLIENT_ID: '',
      HUBTEL_CLIENT_SECRET: '',
      HUBTEL_SENDER_ID: '',
      WHATSAPP_PROVIDER: '',
      HUBTEL_WHATSAPP_CLIENT_ID: '',
      HUBTEL_WHATSAPP_CLIENT_SECRET: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN: '',
      TWILIO_PHONE_NUMBER: '',
    },
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
