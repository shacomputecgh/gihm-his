import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clearPin,
  clearPinFailures,
  enrollPin,
  hasPin,
  idleTimeout,
  isNumericPin,
  pinLockoutRemaining,
  registerPinFailure,
  verifyPin,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
} from './deviceLock';

describe('isNumericPin', () => {
  it('accepts 4–8 digit numeric PINs', () => {
    expect(isNumericPin('1234')).toBe(true);
    expect(isNumericPin('12345678')).toBe(true);
    expect(isNumericPin('0'.repeat(PIN_MAX_LENGTH))).toBe(true);
  });

  it('rejects non-numeric, too short, and too long PINs', () => {
    expect(isNumericPin('123')).toBe(false); // < min
    expect(isNumericPin('123456789')).toBe(false); // > max
    expect(isNumericPin('12a4')).toBe(false); // letters
    expect(isNumericPin('')).toBe(false);
    expect(isNumericPin('1234 ')).toBe(false);
  });
});

describe('PIN enrollment & verification', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('enrolls then verifies the correct PIN', async () => {
    expect(hasPin()).toBe(false);
    await enrollPin('4321');
    expect(hasPin()).toBe(true);
    expect(await verifyPin('4321')).toBe(true);
  });

  it('rejects the wrong PIN', async () => {
    await enrollPin('4321');
    expect(await verifyPin('4320')).toBe(false);
    expect(await verifyPin('')).toBe(false);
  });

  it('never stores the plaintext PIN', async () => {
    await enrollPin('9876');
    const raw = localStorage.getItem('gihm_device_pin');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('9876');
    const parsed = JSON.parse(raw!) as { salt: string; hash: string };
    expect(parsed.salt.length).toBeGreaterThan(10);
    expect(parsed.hash).not.toBe(parsed.salt);
  });

  it('mints a fresh salt per enrollment (hashes differ)', async () => {
    await enrollPin('1234');
    const first = localStorage.getItem('gihm_device_pin');
    await clearPin();
    await enrollPin('1234');
    const second = localStorage.getItem('gihm_device_pin');
    expect(first).not.toBe(second);
  });

  it('rejects invalid PINs at enroll', async () => {
    await expect(enrollPin('12')).rejects.toThrow();
    await expect(enrollPin('abcd')).rejects.toThrow();
  });

  it('verifies true when no PIN is enrolled (nothing to protect)', async () => {
    expect(await verifyPin('0000')).toBe(true);
  });

  it('clears the PIN', async () => {
    await enrollPin('1234');
    await clearPin();
    expect(hasPin()).toBe(false);
    expect(localStorage.getItem('gihm_device_pin')).toBeNull();
  });

  it('returns false for corrupted stored data instead of throwing', async () => {
    localStorage.setItem('gihm_device_pin', '{broken');
    expect(await verifyPin('1234')).toBe(false);
  });

  it('treats a PIN length of exactly PIN_MIN_LENGTH as valid', () => {
    expect(PIN_MIN_LENGTH).toBe(4);
    expect(PIN_MAX_LENGTH).toBe(8);
    expect(isNumericPin('4'.repeat(PIN_MIN_LENGTH))).toBe(true);
  });
});

describe('PIN brute-force cooldown', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('allows attempts below the threshold without locking', () => {
    for (let i = 0; i < 4; i++) expect(registerPinFailure()).toBe(0);
    expect(pinLockoutRemaining()).toBe(0);
  });

  it('locks after MAX attempts and can be reset', () => {
    for (let i = 0; i < 5; i++) registerPinFailure();
    expect(pinLockoutRemaining()).toBeGreaterThan(0);
    clearPinFailures();
    expect(pinLockoutRemaining()).toBe(0);
  });

  it('escalates the cooldown on further failures', () => {
    for (let i = 0; i < 5; i++) registerPinFailure();
    const first = pinLockoutRemaining();
    registerPinFailure();
    expect(pinLockoutRemaining()).toBeGreaterThanOrEqual(first);
  });

  it('enrolling a fresh PIN resets the failure counter', async () => {
    for (let i = 0; i < 5; i++) registerPinFailure();
    expect(pinLockoutRemaining()).toBeGreaterThan(0);
    await enrollPin('1234');
    expect(pinLockoutRemaining()).toBe(0);
  });

  it('removing the PIN also clears the lockout', async () => {
    for (let i = 0; i < 5; i++) registerPinFailure();
    await clearPin();
    expect(pinLockoutRemaining()).toBe(0);
  });
});

describe('idleTimeout', () => {
  it('returns the enrollment idle timeout when enrolling', () => {
    expect(idleTimeout(true)).toBe(30_000);
  });

  it('returns the default idle timeout when not enrolling', () => {
    expect(idleTimeout(false)).toBe(10 * 60 * 1000);
  });
});

describe('lockout edge cases', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('treats corrupted lockout data as zero failures', () => {
    localStorage.setItem('gihm_pin_lockout', '{broken');
    expect(pinLockoutRemaining()).toBe(0);
    expect(registerPinFailure()).toBe(0);
  });

  it('tolerates localStorage write failures silently', () => {
    const orig = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('quota'); };
    // Should not throw
    registerPinFailure();
    clearPinFailures();
    localStorage.setItem = orig;
  });

  it('hasPin returns false when localStorage.getItem throws', () => {
    const orig = localStorage.getItem;
    localStorage.getItem = vi.fn(() => { throw new Error('storage error'); });
    expect(hasPin()).toBe(false);
    localStorage.getItem = orig;
  });

  it('enrollPin throws when localStorage.setItem throws', async () => {
    const orig = localStorage.setItem;
    localStorage.setItem = vi.fn(() => { throw new Error('quota exceeded'); });
    await expect(enrollPin('1234')).rejects.toThrow('Could not save the PIN');
    localStorage.setItem = orig;
  });

  it('clearPin does not throw when localStorage.removeItem throws', async () => {
    const orig = localStorage.removeItem;
    localStorage.removeItem = vi.fn(() => { throw new Error('storage error'); });
    await expect(clearPin()).resolves.toBeUndefined();
    localStorage.removeItem = orig;
  });
});
