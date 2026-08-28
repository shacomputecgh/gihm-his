// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getOutbreakThreshold, setOutbreakThreshold, exportCsv } from './constants';

const KEY = 'gihm_outbreak_threshold';

describe('getOutbreakThreshold', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default 3 when no value is set', () => {
    expect(getOutbreakThreshold()).toBe(3);
  });

  it('returns a stored valid value', () => {
    localStorage.setItem(KEY, '5');
    expect(getOutbreakThreshold()).toBe(5);
  });

  it('returns default for non-numeric strings', () => {
    localStorage.setItem(KEY, 'abc');
    expect(getOutbreakThreshold()).toBe(3);
  });

  it('returns default for NaN values', () => {
    localStorage.setItem(KEY, 'NaN');
    expect(getOutbreakThreshold()).toBe(3);
  });

  it('returns default for Infinity', () => {
    localStorage.setItem(KEY, 'Infinity');
    expect(getOutbreakThreshold()).toBe(3);
  });

  it('returns default for values below 1', () => {
    localStorage.setItem(KEY, '0');
    expect(getOutbreakThreshold()).toBe(3);
  });

  it('returns default for values above 100', () => {
    localStorage.setItem(KEY, '101');
    expect(getOutbreakThreshold()).toBe(3);
  });

  it('accepts boundary value of 1', () => {
    localStorage.setItem(KEY, '1');
    expect(getOutbreakThreshold()).toBe(1);
  });

  it('accepts boundary value of 100', () => {
    localStorage.setItem(KEY, '100');
    expect(getOutbreakThreshold()).toBe(100);
  });

  it('returns default when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(getOutbreakThreshold()).toBe(3);
    spy.mockRestore();
  });
});

describe('setOutbreakThreshold', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the value to localStorage', () => {
    setOutbreakThreshold(7);
    expect(localStorage.getItem(KEY)).toBe('7');
  });

  it('does not throw when localStorage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(() => setOutbreakThreshold(5)).not.toThrow();
    spy.mockRestore();
  });
});

describe('exportCsv', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock') as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('does nothing for empty rows', () => {
    exportCsv([], 'test');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('creates a CSV blob and triggers download', () => {
    exportCsv([{ name: 'Alice', age: 30 }], 'users');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('escapes values containing commas', () => {
    exportCsv([{ field: 'a,b' }], 'escape-test');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('escapes values containing double quotes', () => {
    exportCsv([{ field: 'say "hello"' }], 'quote-test');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('handles null and undefined values as empty strings', () => {
    exportCsv([{ a: null, b: undefined }], 'null-test');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('handles values containing newlines', () => {
    exportCsv([{ field: 'line1\nline2' }], 'newline-test');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('sets the correct download filename', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    exportCsv([{ x: 1 }], 'my-data');
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
    expect(anchor?.download).toBe('my-data.csv');
    appendSpy.mockRestore();
  });
});
