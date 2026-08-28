// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import UsersManager from './UsersManager';
import { Toaster } from './ui';
import type { AdminUserRow, RoleBrief } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));

const user = (over: Partial<AdminUserRow> = {}): AdminUserRow => ({
  id: 'u1',
  email: 'nurse@demo.gh',
  fullName: 'Ama Serwaa',
  status: 'ACTIVE',
  roleCode: 'NURSE',
  roleName: 'Nurse',
  roleScope: 'FACILITY',
  facility: { id: 'fac1', name: 'Korle Bu Teaching Hospital' },
  lastLoginAt: '2026-08-17T09:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const suspended = user({ id: 'u2', email: 'cashier@demo.gh', fullName: 'Kofi Mensah', status: 'SUSPENDED', roleCode: 'CASHIER', roleName: 'Cashier' });

const roles: RoleBrief[] = [
  { code: 'NURSE', name: 'Nurse', scope: 'FACILITY' },
  { code: 'CASHIER', name: 'Cashier', scope: 'FACILITY' },
];

const renderManager = () =>
  render(
    <Toaster>
      <UsersManager />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) =>
    url === '/admin/users' ? Promise.resolve({ users: [user(), suspended], roles, passwordMinLength: 8 }) : Promise.resolve(undefined),
  );
  vi.spyOn(window, 'prompt').mockReturnValue('new-pass-1');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('UsersManager', () => {
  it('shows a spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderManager();
    expect(screen.getByText('Loading users…')).toBeTruthy();
  });

  it('renders the account table with roles, status and facility', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    expect(screen.getByText('nurse@demo.gh')).toBeTruthy();
    expect(screen.getByText('Kofi Mensah')).toBeTruthy();
    expect(screen.getByText('ACTIVE')).toBeTruthy();
    expect(screen.getByText('SUSPENDED')).toBeTruthy();
    // Both seeded rows sit at the same facility.
    expect(screen.getAllByText('Korle Bu Teaching Hospital').length).toBe(2);
    expect(mocks.api).toHaveBeenCalledWith('/admin/users');
  });

  it('creates an account from the form and resets it on success', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Yaa Asantewaa' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'yaa@demo.gh' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'NURSE' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({
          method: 'POST',
          body: { email: 'yaa@demo.gh', fullName: 'Yaa Asantewaa', roleCode: 'NURSE', password: 'secret-123' },
        }),
      ),
    );
    expect(screen.getByText('User created')).toBeTruthy();
    // The form collapses back.
    await waitFor(() => expect(screen.queryByLabelText('Full name')).toBeNull());
  });

  it('refuses to create with missing fields', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByText('Complete all fields')).toBeTruthy());
    expect(mocks.api).not.toHaveBeenCalledWith('/admin/users', expect.objectContaining({ method: 'POST' }));
  });

  it('suspends and reactivates an account', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/users/u1/status', {
        method: 'PUT',
        body: { status: 'SUSPENDED' },
      }),
    );
    expect(screen.getByText('User suspended')).toBeTruthy();

    // The suspended row offers Activate.
    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/users/u2/status', {
        method: 'PUT',
        body: { status: 'ACTIVE' },
      }),
    );
    expect(screen.getByText('User active')).toBeTruthy();
  });

  it('changes a role through the row select', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    const roleSelects = screen.getAllByRole('combobox');
    fireEvent.change(roleSelects[0]!, { target: { value: 'CASHIER' } });
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/users/u1/role', { method: 'PUT', body: { roleCode: 'CASHIER' } }),
    );
    expect(screen.getByText('Role changed')).toBeTruthy();
  });

  it('resets a password via the prompt and skips on cancel', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    const resetButtons = screen.getAllByRole('button', { name: 'Reset password' });
    fireEvent.click(resetButtons[0]!);
    expect(window.prompt).toHaveBeenCalledWith('New password for nurse@demo.gh (min 8 characters):');
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/users/u1/password', { method: 'POST', body: { password: 'new-pass-1' } }),
    );
    expect(screen.getByText('Password reset')).toBeTruthy();

    vi.mocked(window.prompt).mockReturnValue(null);
    fireEvent.click(resetButtons[0]!);
    // The cancelled prompt adds no further password call (load + one POST).
    expect(mocks.api).toHaveBeenCalledTimes(2);
  });

  it('toasts errors when suspend, change-role, and reset-password fail', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string; body?: Record<string, unknown> }) => {
      if (url.includes('/admin/users/u1') && init?.method === 'PUT' && init.body && 'status' in init.body) return Promise.reject(new Error('suspend fail'));
      if (url.includes('/admin/users/u1') && init?.method === 'PUT' && init.body && 'roleCode' in init.body) return Promise.reject(new Error('role fail'));
      if (url.includes('/admin/users/') && url.includes('/password')) return Promise.reject(new Error('reset fail'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Ama Serwaa')).toBeTruthy());
    // Suspend fails.
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await waitFor(() => expect(screen.getByText('suspend fail')).toBeTruthy());
    // Change role fails.
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'CASHIER' } });
    await waitFor(() => expect(screen.getByText('role fail')).toBeTruthy());
    // Reset password fails.
    vi.mocked(window.prompt).mockReturnValue('new-pass-1');
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset password' })[0]!);
    await waitFor(() => expect(screen.getByText('reset fail')).toBeTruthy());
  });
});
