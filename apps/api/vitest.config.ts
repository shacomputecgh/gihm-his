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
    },
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
