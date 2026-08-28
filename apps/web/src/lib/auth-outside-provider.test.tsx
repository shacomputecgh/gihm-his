// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useAuth } from './auth';

vi.mock('./api', () => ({ api: vi.fn(), setToken: vi.fn(), ApiRequestError: class extends Error { status: number; constructor(s: number, m = 'fail') { super(m); this.status = s; } } }));
vi.mock('./offlineAuth', () => ({ cacheSession: vi.fn(), clearCachedSession: vi.fn(), readValidCachedSession: vi.fn() }));
vi.mock('./deviceStatus', () => ({ clearDeviceRevocationNotice: vi.fn(), readDeviceRevocationNotice: vi.fn() }));

function Outside() {
  useAuth();
  return null;
}

describe('useAuth outside provider', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => render(<Outside />)).toThrow('useAuth must be used within AuthProvider');
  });
});
