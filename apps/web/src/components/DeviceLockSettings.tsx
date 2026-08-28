import { useMemo, useState } from 'react';
import { Badge, Button, Card, Field, Input, useToast } from './ui';
import { Icon } from './icons';
import { useLock } from '../lib/lock';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../lib/deviceLock';
import { clearCachedSession, readCachedSession } from '../lib/offlineAuth';
import { fmtDateTime } from '../lib/format';

/** Device PIN + offline session cache controls (docs/26 §6c). */
export default function DeviceLockSettings() {
  const { pinEnabled, lock, startEnroll, setPin, disablePin } = useLock();
  const toast = useToast();
  const [enrolling, setEnrolling] = useState(false);
  const [pin, setPinValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [cacheTick, setCacheTick] = useState(0);
  const cached = useMemo(() => readCachedSession(), [cacheTick]);

  async function savePin() {
    setBusy(true);
    try {
      await setPin(pin);
      toast('Device PIN saved — the device now auto-locks after inactivity', 'success');
      setPinValue('');
      setConfirm('');
      setEnrolling(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save PIN', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removePin() {
    if (!window.confirm('Remove the device PIN? The device will no longer auto-lock.')) return;
    setBusy(true);
    try {
      await disablePin();
      toast('Device PIN removed', 'success');
    } catch {
      toast('Could not remove PIN', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Device lock & offline session" subtitle="Protect this workstation — PIN lives on this device only (spec §97, §108)">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={pinEnabled ? 'green' : 'gray'}>{pinEnabled ? 'PIN enabled' : 'No PIN set'}</Badge>
        <div className="ml-auto flex gap-2">
          {!enrolling && (
            <Button size="sm" variant="outline" onClick={() => { setEnrolling(true); startEnroll(); }}>
              {pinEnabled ? 'Change PIN' : 'Set PIN'}
            </Button>
          )}
          {pinEnabled && (
            <Button size="sm" variant="outline" onClick={() => void removePin()} disabled={busy}>
              Remove
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => lock()}
            disabled={!pinEnabled}
            title={pinEnabled ? undefined : 'Set a PIN first — nothing to lock without one'}
          >
            <Icon name="shield" className="h-3.5 w-3.5" /> Lock now
          </Button>
        </div>
      </div>

      {enrolling && (
        <div className="mt-4 grid gap-3 rounded-xl border border-g-navy/10 bg-g-mist/50 p-4 sm:grid-cols-2">
          <Field label={`New PIN (${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits)`}>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={PIN_MAX_LENGTH}
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </Field>
          <Field label="Confirm PIN">
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={PIN_MAX_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              onKeyDown={(e) => { if (e.key === 'Enter' && pin === confirm && pin.length >= PIN_MIN_LENGTH) void savePin(); }}
            />
          </Field>
          {pin !== confirm && confirm.length > 0 && <p className="text-xs font-semibold text-g-red">PINs do not match</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button size="sm" variant="green" disabled={pin.length < PIN_MIN_LENGTH || pin !== confirm || busy} onClick={() => void savePin()}>
              Save PIN
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEnrolling(false); setPinValue(''); setConfirm(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold text-g-ink">Offline session cache</p>
            <p className="text-xs text-slate-400">
              {cached
                ? `Resumable until ${fmtDateTime(new Date(cached.expiresAt).toISOString())} — the device can keep working without internet within the session lifetime.`
                : 'No cached session — sign in once to enable offline resume.'}
            </p>
          </div>
          {cached && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { clearCachedSession(); setCacheTick((t) => t + 1); toast('Offline session cleared', 'success'); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
