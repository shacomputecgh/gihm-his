import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/lib/testSetup.ts'],
    // Pages are covered by the Playwright suite, not unit tests — the
    // threshold applies to the libs, contexts and components unit-tested here.
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/components/**', 'src/types.ts'],
      thresholds: {
        statements: 95,
        branches: 80,
        functions: 72,
        lines: 95,
      },
    },
  },
});
