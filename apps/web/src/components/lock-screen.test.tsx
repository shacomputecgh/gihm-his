// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import LockScreen from '../components/LockScreen';

const mocks = vi.hoisted(() => ({
  pinLockoutRemaining: vi.fn(() => 0),
}));

vi.mock('../lib/deviceLock', () => ({
  pinLockoutRemaining: mocks.pinLockoutRemaining,
  PIN_MAX_LENGTH: 8,
  PIN_MIN_LENGTH: 4,
}));

const onUnlock = vi.fn(async () => true);

const renderScreen = () => render(<LockScreen onUnlock={onUnlock} />);

beforeEach(() => {
  mocks.pinLockoutRemaining.mockClear().mockReturnValue(0);
  onUnlock.mockClear().mockResolvedValue(true);
});

afterEach(() => cleanup());

describe('LockScreen', () => {
  it('renders the keypad and an unlock button that starts disabled', () => {
    renderScreen();
    expect(screen.getByText('Device locked')).toBeTruthy();
    // 8 PIN dots (max length).
    expect(screen.getAllByRole('button').length).toBe(12); // 10 digits + delete + unlock
    expect(screen.getByRole('button', { name: 'Unlock' })).toHaveProperty('disabled', true);
  });

  it('enables unlock once 4 digits are typed and submits the PIN', async () => {
    renderScreen();
    const input = screen.getByLabelText('Device PIN');
    fireEvent.change(input, { target: { value: '1234' } });
    const unlock = screen.getByRole('button', { name: 'Unlock' });
    expect(unlock).toHaveProperty('disabled', false);
    act(() => unlock.click());
    expect(onUnlock).toHaveBeenCalledWith('1234');
    await act(async () => {});
  });

  it('shows an error and clears the entry on a wrong PIN', async () => {
    onUnlock.mockResolvedValue(false);
    renderScreen();
    fireEvent.change(screen.getByLabelText('Device PIN'), { target: { value: '9999' } });
    act(() => screen.getByRole('button', { name: 'Unlock' }).click());
    await screen.findByText('Incorrect PIN — try again');
    expect(onUnlock).toHaveBeenCalledWith('9999');
    // Entry is cleared and the button goes back to disabled.
    expect(screen.getByLabelText('Device PIN')).toHaveProperty('value', '');
    expect(screen.getByRole('button', { name: 'Unlock' })).toHaveProperty('disabled', true);
  });

  it('builds the PIN from the on-screen keypad and deletes with backspace', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(screen.getByRole('button', { name: 'Unlock' })).toHaveProperty('disabled', false);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    // Back to 3 digits — unlock disabled again.
    expect(screen.getByRole('button', { name: 'Unlock' })).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(screen.getByRole('button', { name: 'Unlock' })).toHaveProperty('disabled', false);
  });

  it('auto-submits when the PIN reaches the max length via the keyboard', async () => {
    renderScreen();
    // The keydown path appends a digit per key and submits at the 8th.
    for (const d of '12345678') {
      fireEvent.keyDown(window, { key: d });
    }
    expect(onUnlock).toHaveBeenCalledWith('12345678');
    await act(async () => {});
  });

  it('submits the current entry on the hardware Enter key', () => {
    renderScreen();
    fireEvent.change(screen.getByLabelText('Device PIN'), { target: { value: '4321' } });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onUnlock).toHaveBeenCalledWith('4321');
  });

  it('enters a lockout countdown that disables the keypad and blocks submission', async () => {
    mocks.pinLockoutRemaining.mockReturnValue(15_000);
    renderScreen();
    expect(screen.getByText(/Too many attempts — try again in 15s/)).toBeTruthy();
    // The hidden input is disabled during the cooldown.
    expect(screen.getByLabelText('Device PIN')).toHaveProperty('disabled', true);
    // Keypad presses do nothing while locked out.
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByLabelText('Device PIN')).toHaveProperty('value', '');
    // The unlock button cannot submit either.
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(onUnlock).not.toHaveBeenCalled();
    await act(async () => {});
  });
});
