/**
 * Device lock (docs/26 §6c, spec §97).
 *
 * The device can be protected with a numeric PIN. The PIN is never stored —
 * only `salt + PBKDF2-SHA-256(salt, pin)` is persisted, so localStorage theft
 * does not reveal the PIN. Auto-lock applies after inactivity; unlocking
 * requires the PIN (biometric unlock is a native enhancement the shell can add
 * later). Repeated wrong attempts trigger an escalating device-side cooldown so
 * a stolen device can't be ground through digit-by-digit.
 */

const PIN_KEY = 'gihm_device_pin';
const LOCKOUT_KEY = 'gihm_pin_lockout';
const SALT_BYTES = 16;
const HASH_ITERATIONS = 100_000; // PBKDF2-SHA-256 — native WebCrypto, strong yet fast
const DEFAULT_IDLE_MS = 10 * 60 * 1000; // 10 minutes
const ENROLL_IDLE_MS = 30 * 1000; // 30s while enrolling
const MAX_ATTEMPTS = 5; // wrong PINs before the cooldown engages
const COOLDOWN_MS = 30_000; // first cooldown length
const COOLDOWN_MAX_MS = 15 * 60 * 1000; // cap after repeated failures

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;

function randomSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** PBKDF2-SHA-256 — the standard PIN/password KDF (WebCrypto `deriveBits`). */
async function deriveHash(salt: string, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: HASH_ITERATIONS },
    material,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isNumericPin(pin: string): boolean {
  return /^\d+$/.test(pin) && pin.length >= PIN_MIN_LENGTH && pin.length <= PIN_MAX_LENGTH;
}

export function hasPin(): boolean {
  try {
    return !!localStorage.getItem(PIN_KEY);
  } catch {
    return false;
  }
}

export async function enrollPin(pin: string): Promise<void> {
  if (!isNumericPin(pin)) throw new Error(`PIN must be ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits`);
  const salt = randomSalt();
  const hash = await deriveHash(salt, pin);
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash }));
    clearPinFailures(); // a fresh PIN resets the attempt counter
  } catch {
    throw new Error('Could not save the PIN — storage unavailable');
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return true; // no PIN enrolled → nothing to verify
    const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
    const candidate = await deriveHash(salt, pin);
    return candidate === hash;
  } catch {
    return false;
  }
}

export async function clearPin(): Promise<void> {
  try {
    localStorage.removeItem(PIN_KEY);
    clearPinFailures();
  } catch {
    /* noop */
  }
}

// ------------------------------------------------------------- brute force
// A 4–8 digit PIN has at most 10,000–100,000,000 combinations; the escalating
// on-device cooldown below makes offline grinding impractical on a stolen
// device (it is a deterrent — the JWT session itself lives in localStorage).

interface LockoutState {
  failed: number;
  /** Epoch ms until the device PIN can be tried again (0 = usable now). */
  until: number;
}

function readLockout(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { failed: 0, until: 0 };
    const s = JSON.parse(raw) as Partial<LockoutState>;
    return {
      failed: typeof s.failed === 'number' && s.failed >= 0 ? s.failed : 0,
      until: typeof s.until === 'number' && s.until >= 0 ? s.until : 0,
    };
  } catch {
    return { failed: 0, until: 0 };
  }
}

function writeLockout(state: LockoutState): void {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

/** ms remaining until PIN entry is allowed again (0 = usable now). */
export function pinLockoutRemaining(now = Date.now()): number {
  const { until } = readLockout();
  return until > now ? until - now : 0;
}

/** Record a wrong attempt; returns the cooldown engaged (0 = not locked out). */
export function registerPinFailure(now = Date.now()): number {
  const s = readLockout();
  const failed = s.failed + 1;
  if (failed < MAX_ATTEMPTS) {
    writeLockout({ failed, until: s.until });
    return 0;
  }
  const steps = failed - MAX_ATTEMPTS + 1; // 1 on the first lockout, then escalates
  const cooldown = Math.min(COOLDOWN_MS * 2 ** (steps - 1), COOLDOWN_MAX_MS);
  const until = Math.max(now + cooldown, s.until);
  writeLockout({ failed, until });
  return until - now;
}

/** Reset the counter after a successful unlock (or a fresh PIN enrollment). */
export function clearPinFailures(): void {
  writeLockout({ failed: 0, until: 0 });
}

/** Idle timeout while the app is actively used vs. during PIN enrollment. */
export function idleTimeout(enrolling: boolean): number {
  return enrolling ? ENROLL_IDLE_MS : DEFAULT_IDLE_MS;
}
