import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { PIN_MAX_LENGTH, pinLockoutRemaining } from '../lib/deviceLock';

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
}

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockout, setLockout] = useState(() => pinLockoutRemaining());
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(
    async (value: string) => {
      if (!value || busyRef.current) return;
      if (pinLockoutRemaining() > 0) return; // cooldown active — countdown shown below
      busyRef.current = true;
      setBusy(true);
      setError(null);
      const ok = await onUnlock(value);
      busyRef.current = false;
      setBusy(false);
      if (!ok) {
        setPin('');
        const rem = pinLockoutRemaining(); // may have just engaged the cooldown
        setLockout(rem);
        setError(rem > 0 ? null : 'Incorrect PIN — try again');
      }
    },
    [onUnlock],
  );

  // Live cooldown countdown (always-on 1s tick; setting 0 when already 0 is a
  // no-op re-render, and the lock screen is short-lived anyway).
  useEffect(() => {
    const t = window.setInterval(() => setLockout(pinLockoutRemaining()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Hardware keyboard + physical Enter. The sr-only input handles text entry
  // (so password managers work); the window listener keeps keys working after
  // tapping the on-screen keypad (which moves focus to a button).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lockout > 0) return;
      if (/^\d$/.test(e.key)) {
        setPin((p) => (p.length < PIN_MAX_LENGTH ? p + e.key : p));
        // Auto-submit at max length — same as the keypad path, so hardware
        // keyboards and touch both behave identically for 8-digit PINs.
        if (pin.length + 1 === PIN_MAX_LENGTH) void submit(pin + e.key);
      } else if (e.key === 'Backspace') {
        setPin((p) => p.slice(0, -1));
      } else if (e.key === 'Enter') {
        void submit(pin);
      }
    };
    window.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [pin, submit, lockout]);

  const lockedOut = lockout > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-g-navy px-6">
      <div className="w-full max-w-xs text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="shield" className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-lg font-bold text-white">Device locked</h1>
        <p className="mt-1 text-xs text-slate-300">
          Enter your device PIN to resume. Auto-locked after inactivity — protection lives on this device only.
        </p>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-3">
          {Array.from({ length: PIN_MAX_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition ${i < pin.length ? 'bg-g-red' : 'bg-white/25'}`}
            />
          ))}
        </div>

        {/* Hidden real input so hardware keyboards + password managers work */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoFocus
          disabled={lockedOut}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
          className="sr-only"
          aria-label="Device PIN"
        />

        {lockedOut ? (
          <p className="mt-3 text-xs font-semibold text-amber-300">
            Too many attempts — try again in {Math.ceil(lockout / 1000)}s
          </p>
        ) : error ? (
          <p className="mt-3 text-xs font-semibold text-red-300">{error}</p>
        ) : null}

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {KEYPAD.map((k, i) =>
            k === '' ? (
              <span key={i} />
            ) : k === '⌫' ? (
              <button
                key={i}
                onClick={(e) => {
                  e.currentTarget.blur(); // don't leave focus on the keypad — Enter must mean submit
                  setPin((p) => p.slice(0, -1));
                }}
                disabled={lockedOut}
                className="cursor-pointer rounded-xl bg-white/10 py-3.5 text-lg text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Delete"
              >
                {k}
              </button>
            ) : (
              <button
                key={i}
                onClick={(e) => {
                  if (lockedOut) return;
                  e.currentTarget.blur(); // keep Enter unambiguous (submit, not re-click)
                  const next = pin.length < PIN_MAX_LENGTH ? pin + k : pin;
                  setPin(next);
                  // Auto-submit only at the max length — 4–7 digit PINs need the
                  // Unlock button (auto-submitting at 4 would break longer PINs).
                  if (next.length === PIN_MAX_LENGTH) void submit(next);
                }}
                disabled={lockedOut}
                className="cursor-pointer rounded-xl bg-white/10 py-3.5 text-lg font-semibold text-white transition hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {k}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => void submit(pin)}
          disabled={pin.length < 4 || busy || lockedOut}
          className="mt-6 w-full cursor-pointer rounded-xl bg-g-red px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}
