// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import DeviceLockSettings from './DeviceLockSettings';
import { Toaster } from './ui';

const mocks = vi.hoisted(() => ({
  useLock: vi.fn(),
  readCachedSession: vi.fn(),
  clearCachedSession: vi.fn(),
}));

vi.mock('../lib/lock', () => ({ useLock: mocks.useLock }));
vi.mock('../lib/deviceLock', () => ({ PIN_MAX_LENGTH: 8, PIN_MIN_LENGTH: 4 }));
vi.mock('../lib/offlineAuth', () => ({
  readCachedSession: mocks.readCachedSession,
  clearCachedSession: mocks.clearCachedSession,
}));

const lockState = (over: Partial<ReturnType<typeof mocks.useLock>['mock']['results'][number]['value']> = {}) => ({
  pinEnabled: false,
  lock: vi.fn(),
  startEnroll: vi.fn(),
  setPin: vi.fn(async () => {}),
  disablePin: vi.fn(async () => {}),
  ...over,
});

const renderCard = () =>
  render(
    <Toaster>
      <DeviceLockSettings />
    </Toaster>,
  );

beforeEach(() => {
  mocks.useLock.mockReset().mockReturnValue(lockState());
  mocks.readCachedSession.mockReset().mockReturnValue(null);
  mocks.clearCachedSession.mockReset();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DeviceLockSettings', () => {
  it('shows the no-PIN state with Set PIN and a disabled Lock now', () => {
    renderCard();
    expect(screen.getByText('No PIN set')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Set PIN' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lock now' })).toHaveProperty('disabled', true);
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
  });

  it('shows the PIN-enabled state with Change PIN, Remove and an armed Lock now', () => {
    mocks.useLock.mockReturnValue(lockState({ pinEnabled: true }));
    renderCard();
    expect(screen.getByText('PIN enabled')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change PIN' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lock now' })).toHaveProperty('disabled', false);
  });

  it('locks immediately on demand', () => {
    const lock = vi.fn();
    mocks.useLock.mockReturnValue(lockState({ pinEnabled: true, lock }));
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Lock now' }));
    expect(lock).toHaveBeenCalled();
  });

  it('enrolls a PIN: matching entries enable Save and success closes the panel', async () => {
    const setPin = vi.fn(async () => {});
    mocks.useLock.mockReturnValue(lockState({ setPin }));
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Set PIN' }));

    const pinInput = screen.getByLabelText('New PIN (4–8 digits)');
    const confirmInput = screen.getByLabelText('Confirm PIN');
    const save = screen.getByRole('button', { name: 'Save PIN' });
    expect(save).toHaveProperty('disabled', true);

    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.change(confirmInput, { target: { value: '9999' } });
    expect(screen.getByText('PINs do not match')).toBeTruthy();
    expect(save).toHaveProperty('disabled', true);

    fireEvent.change(confirmInput, { target: { value: '1234' } });
    expect(screen.queryByText('PINs do not match')).toBeNull();
    expect(save).toHaveProperty('disabled', false);

    fireEvent.click(save);
    await waitFor(() => expect(setPin).toHaveBeenCalledWith('1234'));
    expect(screen.getByText('Device PIN saved — the device now auto-locks after inactivity')).toBeTruthy();
    // The enrollment panel closes on success.
    await waitFor(() => expect(screen.queryByLabelText('New PIN (4–8 digits)')).toBeNull());
  });

  it('keeps the panel open and toasts the error when enrollment fails', async () => {
    const setPin = vi.fn(async () => {
      throw new Error('PIN must be 4-8 digits');
    });
    mocks.useLock.mockReturnValue(lockState({ setPin }));
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Set PIN' }));
    fireEvent.change(screen.getByLabelText('New PIN (4–8 digits)'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('Confirm PIN'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save PIN' }));
    await waitFor(() => expect(screen.getByText('PIN must be 4-8 digits')).toBeTruthy());
    expect(screen.getByLabelText('New PIN (4–8 digits)')).toBeTruthy();
  });

  it('removes the PIN only after confirmation', async () => {
    const disablePin = vi.fn(async () => {});
    mocks.useLock.mockReturnValue(lockState({ pinEnabled: true, disablePin }));

    vi.mocked(window.confirm).mockReturnValue(false);
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(disablePin).not.toHaveBeenCalled();

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(disablePin).toHaveBeenCalled());
    expect(screen.getByText('Device PIN removed')).toBeTruthy();
  });

  it('surfaces the offline session cache and clears it on demand', async () => {
    mocks.readCachedSession.mockReturnValue({
      token: 'tok',
      user: { id: 'u1' } as never,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    // Clearing the cache empties the storage the next read sees.
    mocks.clearCachedSession.mockImplementation(() => mocks.readCachedSession.mockReturnValue(null));
    renderCard();
    expect(screen.getByText(/Resumable until/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(mocks.clearCachedSession).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('Offline session cleared')).toBeTruthy());
    // The cache display refreshes to the empty state.
    await waitFor(() => expect(screen.getByText(/No cached session/)).toBeTruthy());
  });

  it('toasts error when disablePin fails', async () => {
    const disablePin = vi.fn(async () => { throw new Error('storage error'); });
    mocks.useLock.mockReturnValue(lockState({ pinEnabled: true, disablePin }));
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.getByText('Could not remove PIN')).toBeTruthy());
  });

  it('shows the empty cache hint when no session is stored', () => {
    renderCard();
    expect(screen.getByText(/No cached session — sign in once to enable offline resume/)).toBeTruthy();
  });
});
