import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  clearPin,
  clearPinFailures,
  enrollPin,
  hasPin,
  idleTimeout,
  pinLockoutRemaining,
  registerPinFailure,
  verifyPin,
} from './deviceLock';
import LockScreen from '../components/LockScreen';

/**
 * Device lock state (docs/26 §6c, spec §97).
 *
 * Wraps the staff app: when a PIN is enrolled the device auto-locks after a
 * period of inactivity (or instantly via "Lock now"), and a full-screen
 * LockScreen requires the PIN to resume. Enrollment itself gets a shorter
 * idle timeout so an abandoned enrollment doesn't leave the device unlocked
 * for long.
 */

interface LockState {
  locked: boolean;
  pinEnabled: boolean;
  enrolling: boolean;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  startEnroll: () => void;
  cancelEnroll: () => void;
  /** Enroll or change the PIN (throws on invalid input). */
  setPin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
}

const LockContext = createContext<LockState | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(() => hasPin());
  const lastActivityRef = useRef(Date.now());
  const lockedRef = useRef(false);

  const applyLock = useCallback(() => {
    lockedRef.current = true;
    setLocked(true);
    setEnrolling(false);
  }, []);

  // Inactivity auto-lock: reset on real user activity, lock when idle exceeds
  // the timeout for the current mode (enrolling shortens it).
  useEffect(() => {
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'];
    for (const e of events) window.addEventListener(e, bump, { passive: true });
    const timer = window.setInterval(() => {
      if (!hasPin()) return;
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= idleTimeout(enrolling) && !lockedRef.current) applyLock();
    }, 30_000);
    return () => {
      for (const e of events) window.removeEventListener(e, bump);
      window.clearInterval(timer);
    };
  }, [enrolling, applyLock]);

  const lock = useCallback(() => applyLock(), [applyLock]);

  const unlock = useCallback(async (pin: string) => {
    if (pinLockoutRemaining() > 0) return false; // cooldown active — LockScreen shows the countdown
    const ok = await verifyPin(pin);
    if (ok) {
      clearPinFailures();
      lockedRef.current = false;
      lastActivityRef.current = Date.now();
      setLocked(false);
    } else {
      registerPinFailure();
    }
    return ok;
  }, []);

  const startEnroll = useCallback(() => {
    setEnrolling(true);
    lastActivityRef.current = Date.now();
  }, []);

  const cancelEnroll = useCallback(() => setEnrolling(false), []);

  const setPin = useCallback(async (pin: string) => {
    await enrollPin(pin);
    setPinEnabled(true);
    setEnrolling(false);
    lockedRef.current = false;
    setLocked(false);
  }, []);

  const disablePin = useCallback(async () => {
    await clearPin();
    setPinEnabled(false);
    setEnrolling(false);
    lockedRef.current = false;
    setLocked(false);
  }, []);

  const value = useMemo(
    () => ({ locked, pinEnabled, enrolling, lock, unlock, startEnroll, cancelEnroll, setPin, disablePin }),
    [locked, pinEnabled, enrolling, lock, unlock, startEnroll, cancelEnroll, setPin, disablePin],
  );

  return (
    <LockContext.Provider value={value}>
      {children}
      {locked && <LockScreen onUnlock={unlock} />}
    </LockContext.Provider>
  );
}

export function useLock(): LockState {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used within LockProvider');
  return ctx;
}
