import { describe, it, expect } from 'vitest';
import { backendStatusKind } from './localBackend';
import type { LocalBackendStatus } from './desktop';

function status(partial: Partial<LocalBackendStatus>): LocalBackendStatus {
  return { provisioned: false, running: false, pid: null, port: 4000, dir: 'C:\\GIHM-HIS\\local-backend', ...partial };
}

describe('backendStatusKind', () => {
  it('maps null (browser PWA / bridge down) to unavailable', () => {
    expect(backendStatusKind(null)).toBe('unavailable');
  });

  it('maps unprovisioned to not-provisioned', () => {
    expect(backendStatusKind(status({ provisioned: false }))).toBe('not-provisioned');
  });

  it('maps provisioned + running to running', () => {
    expect(backendStatusKind(status({ provisioned: true, running: true, pid: 4242 }))).toBe('running');
  });

  it('maps provisioned + stopped to stopped', () => {
    expect(backendStatusKind(status({ provisioned: true, running: false, pid: null }))).toBe('stopped');
  });
});
