import type { LocalBackendStatus } from './desktop';

/**
 * Bundled local edge backend (docs/26 §6 6d) — pure presentation mapping so
 * the Admin card and tests share one source of truth.
 */

export type BackendStatusKind = 'unavailable' | 'not-provisioned' | 'running' | 'stopped';

export function backendStatusKind(status: LocalBackendStatus | null): BackendStatusKind {
  if (!status) return 'unavailable'; // browser PWA / bridge failed
  if (!status.provisioned) return 'not-provisioned';
  return status.running ? 'running' : 'stopped';
}
