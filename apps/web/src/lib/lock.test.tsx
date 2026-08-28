// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { LockProvider, useLock } from './lock';

const mocks = vi.hoisted(() => ({
  hasPin: vi.fn(() => false),
  enrollPin: vi.fn(async () => {}),
  verifyPin: vi.fn(async () => true),
  clearPin: vi.fn(async () => {}),
  clearPinFailures: vi.fn(),
  registerPinFailure: vi.fn(),
  pinLockoutRemaining: vi.fn(() => 0),
  idleTimeout: vi.fn(() => 1000),
}));

vi.mock('./deviceLock', () => ({
  hasPin: mocks.hasPin,
  enrollPin: mocks.enrollPin,
  verifyPin: mocks.verifyPin,
  clearPin: mocks.clearPin,
  clearPinFailures: mocks.clearPinFailures,
  registerPinFailure: mocks.registerPinFailure,
  pinLockoutRemaining: mocks.pinLockoutRemaining,
  idleTimeout: mocks.idleTimeout,
  // LockScreen reads these directly from the module.
  PIN_MAX_LENGTH: 8,
  PIN_MIN_LENGTH: 4,
}));

function Probe() {
  const l = useLock();
  return (
    <div>
      <span data-testid="locked">{String(l.locked)}</span>
      <span data-testid="enabled">{String(l.pinEnabled)}</span>
      <span data-testid="enrolling">{String(l.enrolling)}</span>
      <button onClick={() => l.lock()}>lock</button>
      <button onClick={() => void l.unlock('1234')}>unlock</button>
      <button onClick={() => l.startEnroll()}>enroll</button>
      <button onClick={() => l.cancelEnroll()}>cancel-enroll</button>
      <button onClick={() => l.setPin('4321').catch(() => {})}>setpin</button>
      <button onClick={() => void l.disablePin()}>disable</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <LockProvider>
      <Probe />
    </LockProvider>,
  );

beforeEach(() => {
  mocks.hasPin.mockReset().mockReturnValue(false);
  mocks.enrollPin.mockClear().mockResolvedValue(undefined);
  mocks.verifyPin.mockClear().mockResolvedValue(true);
  mocks.clearPin.mockClear().mockResolvedValue(undefined);
  mocks.clearPinFailures.mockClear();
  mocks.registerPinFailure.mockClear();
  mocks.pinLockoutRemaining.mockClear().mockReturnValue(0);
  mocks.idleTimeout.mockClear().mockReturnValue(1000);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LockProvider', () => {
  it('throws when used outside the provider', () => {
    function Outside() {
      useLock();
      return null;
    }
    expect(() => render(<Outside />)).toThrow('useLock must be used within LockProvider');
  });

  it('starts unlocked and reports whether a PIN is enrolled', () => {
    renderProbe();
    expect(screen.getByTestId('locked').textContent).toBe('false');
    expect(screen.getByTestId('enabled').textContent).toBe('false');
    expect(screen.queryByText('Device locked')).toBeNull();
  });

  it('starts with the PIN enabled when one is already stored', () => {
    mocks.hasPin.mockReturnValue(true);
    renderProbe();
    expect(screen.getByTestId('enabled').textContent).toBe('true');
  });

  it('enrolls a PIN: enabling, exiting enrollment mode and staying unlocked', async () => {
    renderProbe();
    act(() => screen.getByRole('button', { name: 'enroll' }).click());
    expect(screen.getByTestId('enrolling').textContent).toBe('true');
    act(() => screen.getByRole('button', { name: 'setpin' }).click());
    await waitFor(() => expect(screen.getByTestId('enabled').textContent).toBe('true'));
    expect(mocks.enrollPin).toHaveBeenCalledWith('4321');
    expect(screen.getByTestId('enrolling').textContent).toBe('false');
    expect(screen.getByTestId('locked').textContent).toBe('false');
  });

  it('leaves the PIN disabled when enrollment fails (invalid input)', async () => {
    mocks.enrollPin.mockRejectedValue(new Error('PIN must be 4-8 digits'));
    renderProbe();
    act(() => screen.getByRole('button', { name: 'setpin' }).click());
    // The provider rethrows (callers validate the input), so the PIN must not
    // be half-enabled on failure.
    await waitFor(() => expect(mocks.enrollPin).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('enabled').textContent).toBe('false'));
  });

  it('locks the screen and unlocks with the correct PIN, clearing failures', async () => {
    renderProbe();
    act(() => screen.getByRole('button', { name: 'lock' }).click());
    expect(screen.getByText('Device locked')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Device PIN'), { target: { value: '1234' } });
    act(() => screen.getByRole('button', { name: 'Unlock' }).click());
    await waitFor(() => expect(screen.getByTestId('locked').textContent).toBe('false'));
    expect(screen.queryByText('Device locked')).toBeNull();
    expect(mocks.verifyPin).toHaveBeenCalledWith('1234');
    expect(mocks.clearPinFailures).toHaveBeenCalled();
  });

  it('stays locked on a wrong PIN and registers the failure', async () => {
    mocks.verifyPin.mockResolvedValue(false);
    renderProbe();
    act(() => screen.getByRole('button', { name: 'lock' }).click());

    fireEvent.change(screen.getByLabelText('Device PIN'), { target: { value: '9999' } });
    act(() => screen.getByRole('button', { name: 'Unlock' }).click());
    await waitFor(() => expect(mocks.registerPinFailure).toHaveBeenCalled());
    expect(screen.getByTestId('locked').textContent).toBe('true');
    expect(screen.getByText('Incorrect PIN — try again')).toBeTruthy();
    expect(mocks.clearPinFailures).not.toHaveBeenCalled();
  });

  it('does not attempt verification while a lockout cooldown is active', async () => {
    mocks.pinLockoutRemaining.mockReturnValue(15_000);
    renderProbe();
    act(() => screen.getByRole('button', { name: 'lock' }).click());
    fireEvent.change(screen.getByLabelText('Device PIN'), { target: { value: '1234' } });
    act(() => screen.getByRole('button', { name: 'Unlock' }).click());
    // Cooldown gate in the provider returns false before verifyPin is consulted.
    await waitFor(() => expect(mocks.verifyPin).not.toHaveBeenCalled());
    expect(screen.getByTestId('locked').textContent).toBe('true');
  });

  it('disables the PIN, clearing the stored credential', async () => {
    mocks.hasPin.mockReturnValue(true);
    renderProbe();
    expect(screen.getByTestId('enabled').textContent).toBe('true');
    act(() => screen.getByRole('button', { name: 'disable' }).click());
    await waitFor(() => expect(mocks.clearPin).toHaveBeenCalled());
    expect(screen.getByTestId('enabled').textContent).toBe('false');
  });

  it('cancelEnroll exits enrollment mode', async () => {
    renderProbe();
    act(() => screen.getByRole('button', { name: 'enroll' }).click());
    expect(screen.getByTestId('enrolling').textContent).toBe('true');
    act(() => screen.getByRole('button', { name: 'cancel-enroll' }).click());
    expect(screen.getByTestId('enrolling').textContent).toBe('false');
  });

  it('simulating user activity resets the idle timer', async () => {
    vi.useFakeTimers();
    mocks.hasPin.mockReturnValue(true);
    renderProbe();
    // After 20s, the device should NOT be locked because user activity happened.
    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.queryByText('Device locked')).toBeNull();
    // Simulate a user activity event.
    act(() => window.dispatchEvent(new PointerEvent('pointerdown')));
    // Advance past the idle timeout — should still be unlocked since activity was recent.
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByText('Device locked')).toBeNull();
    // Now advance past the idle timeout since last activity.
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.getByText('Device locked')).toBeTruthy();
  });

  it('auto-locks after the idle timeout when a PIN is enrolled', async () => {
    vi.useFakeTimers();
    mocks.hasPin.mockReturnValue(true);
    renderProbe();
    expect(screen.queryByText('Device locked')).toBeNull();
    // The poll ticks every 30s; the mocked idle timeout is 1s, so the first
    // tick after mount must already exceed it.
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.getByText('Device locked')).toBeTruthy();
    expect(screen.getByTestId('locked').textContent).toBe('true');
  });
});
