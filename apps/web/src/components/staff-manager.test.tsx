// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import StaffManager from './StaffManager';
import { Toaster } from './ui';
import type { Staff, AuthUser } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('./UnitsManager', () => ({ unitEditableFacility: () => () => true }));

const staff = (over: Partial<Staff> = {}): Staff => ({
  id: 's1',
  staffNumber: 'KBTH-0142',
  fullName: 'Dr. Ama Owusu',
  role: 'CONSULTANT',
  speciality: 'Cardiology',
  licenseNumber: 'GMC-8821',
  phone: '0244 000 000',
  email: 'ama@hospital.gh',
  employmentStatus: 'ACTIVE',
  headOfUnit: false,
  joinedAt: '2024-03-01T00:00:00.000Z',
  notes: null,
  unit: { id: 'u1', code: 'OPD', name: 'OPD' },
  facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital' },
  user: null,
  ...over,
});

const admin: AuthUser = {
  id: 'u1',
  email: 'admin@demo.gh',
  fullName: 'Admin',
  roleCode: 'HOSPITAL_ADMIN',
  roleName: 'Hospital admin',
  scope: 'FACILITY',
  permissions: ['manage_users'],
  organizationId: null,
  facilityId: 'fac1',
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: null,
};

const renderManager = () =>
  render(
    <Toaster>
      <StaffManager />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) => {
    if (url === '/admin/masterdata/facilities') {
      return Promise.resolve({ facilities: [{ id: 'fac1', name: 'Korle Bu Teaching Hospital' }] });
    }
    if (url.startsWith('/admin/masterdata/units?')) {
      return Promise.resolve({ facilities: [{ departments: [{ units: [{ id: 'u1', code: 'OPD', name: 'OPD' }] }] }] });
    }
    if (url.startsWith('/admin/masterdata/staff?')) {
      return Promise.resolve({
        staff: [staff()],
        summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 },
      });
    }
    if (url === '/admin/users') {
      return Promise.resolve({ roles: [{ code: 'DOCTOR' }, { code: 'NURSE' }] });
    }
    return Promise.resolve(undefined);
  });
  mocks.useAuth.mockReset().mockReturnValue({ user: admin });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('StaffManager', () => {
  it('shows a spinner while the directory loads', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderManager();
    expect(screen.getByText('Loading staff directory…')).toBeTruthy();
  });

  it('shows the empty state when no facilities are in scope', async () => {
    mocks.api.mockImplementation((url: string) =>
      url === '/admin/masterdata/facilities' ? Promise.resolve({ facilities: [] }) : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('No facilities in scope')).toBeTruthy());
  });

  it('renders the directory with summary cards, role badges and linked users', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [
            staff(),
            staff({
              id: 's2',
              fullName: 'Kofi Mensah',
              staffNumber: 'KBTH-0099',
              role: 'NURSE',
              headOfUnit: true,
              user: { id: 'u9', email: 'kofi@hospital.gh', status: 'ACTIVE', roleCode: 'NURSE', roleName: 'Nurse' },
            }),
          ],
          summary: { total: 2, assigned: 2, heads: 1, onLeave: 0 },
        });
      }
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    expect(screen.getByText('Total staff')).toBeTruthy();
    expect(screen.getByText('Heads of unit')).toBeTruthy();
    expect(screen.getByText(/KBTH-0142/)).toBeTruthy();
    expect(screen.getAllByText(/Cardiology/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('★ head of unit').length).toBe(1);
    expect(screen.getByText(/kofi@hospital.gh/)).toBeTruthy();
  });

  it('refetches with role and status filters', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.change(screen.getAllByLabelText(/^Role/)[0]!, { target: { value: 'NURSE' } });
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('masterdata/staff?facilityId=fac1&role=NURSE')),
    );
    fireEvent.change(screen.getAllByLabelText(/^Status/)[0]!, { target: { value: 'ON_LEAVE' } });
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('&status=ON_LEAVE')),
    );
  });

  it('adds a staff member from the form', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Nurse Efua' } });
    fireEvent.change(screen.getByLabelText(/Staff number/), { target: { value: 'kbth-0200' } });
    fireEvent.click(screen.getByRole('button', { name: /Add staff/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ fullName: 'Nurse Efua', staffNumber: 'KBTH-0200', facilityId: 'fac1' }),
        }),
      ),
    );
    expect(screen.getByText('Nurse Efua added')).toBeTruthy();
  });

  it('edits a record and saves via PUT', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getAllByLabelText('Full name')[0]!;
    fireEvent.change(nameInput, { target: { value: 'Dr. Ama Owusu-Danquah' } });
    fireEvent.change(screen.getAllByLabelText('Licence number')[0]!, { target: { value: 'GMC-9999' } });
    fireEvent.change(screen.getAllByLabelText('Phone')[0]!, { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'ama@new.gh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ fullName: 'Dr. Ama Owusu-Danquah' }) }),
      ),
    );
    expect(screen.getByText('Saved Dr. Ama Owusu-Danquah')).toBeTruthy();
  });

  it('promotes and demotes a head of unit', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Make head' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: { headOfUnit: true } }),
      ),
    );
    expect(screen.getByText('Dr. Ama Owusu is now head of unit')).toBeTruthy();
  });

  it('creates a login account from a staff record', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '+ Create login' }));
    const emailInput = screen.getAllByLabelText(/^Email/)[0]!;
    expect(emailInput).toHaveProperty('value', 'ama@hospital.gh');
    fireEvent.change(screen.getByLabelText(/Temporary password/), { target: { value: 'temp-pass-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create login' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1/link-user',
        expect.objectContaining({
          method: 'POST',
          body: { email: 'ama@hospital.gh', roleCode: 'DOCTOR', password: 'temp-pass-1' },
        }),
      ),
    );
    expect(screen.getByText('Login account created for Dr. Ama Owusu')).toBeTruthy();
  });

  it('unlinks a login account and removes a record after confirmation', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staff({ user: { id: 'u9', email: 'ama@hospital.gh', status: 'ACTIVE', roleCode: 'DOCTOR', roleName: 'Doctor' } })],
          summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 },
        });
      }
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/staff/s1/unlink-user', { method: 'POST', body: {} }),
    );
    expect(screen.getByText('Login account unlinked')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/staff/s1/remove', { method: 'POST', body: {} }),
    );
    expect(screen.getByText('Removed Dr. Ama Owusu')).toBeTruthy();
  });

  it('hides the login-account controls without manage_users', async () => {
    mocks.useAuth.mockReturnValue({ user: { ...admin, permissions: [] } });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    expect(screen.queryByRole('button', { name: '+ Create login' })).toBeNull();
    expect(mocks.api).not.toHaveBeenCalledWith('/admin/users');
  });

  it('demotes head of unit and toasts errors on failed API calls', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staff({ headOfUnit: true })],
          summary: { total: 1, assigned: 1, heads: 1, onLeave: 0 },
        });
      }
      if (init?.method === 'POST' && url.includes('/remove')) return Promise.reject(new Error('delete failed'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Remove head' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove head' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: { headOfUnit: false } }),
      ),
    );
    expect(screen.getByText('Head flag removed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.getByText('delete failed')).toBeTruthy());
  });

  it('shows the unmapped-role note in the link form', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '+ Create login' }));
    await waitFor(() => expect(screen.getByText(/Auto-mapped role/)).toBeTruthy());
    expect(screen.getAllByText(/DOCTOR/).length).toBeGreaterThan(0);
  });

  it('shows "none — pick one below" for an unmapped staff role', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staff({ id: 's2', fullName: 'Kofi', staffNumber: 'KB-020', role: 'RADIOGRAPHER', unit: null })],
          summary: { total: 1, assigned: 0, heads: 0, onLeave: 0 },
        });
      }
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Kofi')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '+ Create login' }));
    await waitFor(() => expect(screen.getByText(/none — pick one below/)).toBeTruthy());
  });

  it('toasts error when save-edit fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string; body?: Record<string, unknown> }) => {
      if (init?.method === 'PUT' && url.includes('/staff/') && init.body && 'fullName' in init.body) return Promise.reject(new Error('save broken'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() => expect(screen.getByText('save broken')).toBeTruthy());
  });

  it('toasts error when setHead fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string; body?: Record<string, unknown> }) => {
      if (init?.method === 'PUT' && url.includes('/staff/') && init.body && 'headOfUnit' in init.body) return Promise.reject(new Error('head broken'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Make head' }));
    await waitFor(() => expect(screen.getByText('head broken')).toBeTruthy());
  });

  it('shows linked-account note when removing a staff with a login', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staff({ user: { id: 'u9', email: 'ama@hospital.gh', status: 'ACTIVE', roleCode: 'DOCTOR', roleName: 'Doctor' } })],
          summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 },
        });
      }
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('linked login account'),
    );
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/staff/s1/remove', { method: 'POST', body: {} }),
    );
  });

  it('shows empty staff hint without facility qualifier when filters are active', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [{ id: 'fac1', name: 'Korle Bu Teaching Hospital' }] });
      if (url.startsWith('/admin/masterdata/units?')) return Promise.resolve({ facilities: [{ departments: [{ units: [{ id: 'u1', code: 'OPD', name: 'OPD' }] }] }] });
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [], summary: { total: 0, assigned: 0, heads: 0, onLeave: 0 } });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText(/No staff match/)).toBeTruthy());
    fireEvent.change(screen.getAllByLabelText(/^Role/)[0]!, { target: { value: 'NURSE' } });
    await waitFor(() => expect(screen.getByText(/No staff match this filter\./)).toBeTruthy());
  });

  it('toasts errors when create-login and unlink fail', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.includes('/link-user')) return Promise.reject(new Error('link broken'));
      if (url.includes('/unlink-user')) return Promise.reject(new Error('unlink broken'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '+ Create login' }));
    fireEvent.change(screen.getByLabelText(/Temporary password/), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create login' }));
    await waitFor(() => expect(screen.getByText('link broken')).toBeTruthy());
  });

  it('toasts error when create-staff fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/masterdata/staff' && init?.method === 'POST') return Promise.reject(new Error('create fail'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/Staff number/), { target: { value: 'KB-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Add staff/ }));
    await waitFor(() => expect(screen.getByText('create fail')).toBeTruthy());
  });

  it('toasts error when unlink-user fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staff({ user: { id: 'u9', email: 'ama@hospital.gh', status: 'ACTIVE', roleCode: 'DOCTOR', roleName: 'Doctor' } })],
          summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 },
        });
      }
      if (url.includes('/unlink-user')) return Promise.reject(new Error('unlink broken'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }));
    await waitFor(() => expect(screen.getByText('unlink broken')).toBeTruthy());
  });

  it('exercises all add-form onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    // The add-form fields are below the staff directory card.
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByLabelText(/Staff number/), { target: { value: 'kb-999' } });
    // The add-form Role select (second one — first is the filter).
    fireEvent.change(screen.getAllByLabelText(/^Role/)[1]!, { target: { value: 'NURSE' } });
    fireEvent.change(screen.getByLabelText('Speciality'), { target: { value: 'Paediatrics' } });
    fireEvent.change(screen.getByLabelText('Licence number'), { target: { value: 'GMC-9999' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@hospital.gh' } });
    // Employment status select (add-form only has one).
    fireEvent.change(screen.getAllByLabelText('Employment status')[0]!, { target: { value: 'ON_LEAVE' } });
    // Unit select.
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'u1' } });
    // Joined date.
    fireEvent.change(screen.getByLabelText('Joined'), { target: { value: '2026-01-15' } });
    // Head checkbox — last one in the page (the add form one).
    const headCheckboxes = screen.getAllByRole('checkbox', { name: /Head of unit/ });
    const addFormHead = headCheckboxes[headCheckboxes.length - 1]!;
    expect(addFormHead).toHaveProperty('disabled', false);
    fireEvent.click(addFormHead);
    fireEvent.click(screen.getByRole('button', { name: /Add staff/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            fullName: 'New Person', staffNumber: 'KB-999', role: 'NURSE',
            speciality: 'Paediatrics', licenseNumber: 'GMC-9999',
            phone: '0200 111 222', email: 'new@hospital.gh',
            employmentStatus: 'ON_LEAVE', unitId: 'u1', joinedAt: '2026-01-15', headOfUnit: true,
          }),
        }),
      ),
    );
  });

  it('exercises link-form email and role select onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '+ Create login' }));
    fireEvent.change(screen.getAllByLabelText(/^Email/)[0]!, { target: { value: 'custom@hospital.gh' } });
    fireEvent.change(screen.getByLabelText('Login role'), { target: { value: 'DOCTOR' } });
    fireEvent.change(screen.getByLabelText(/Temporary password/), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create login' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1/link-user',
        expect.objectContaining({ body: { email: 'custom@hospital.gh', roleCode: 'DOCTOR', password: 'pass1234' } }),
      ),
    );
  });

  it('exercises edit-form role, speciality, employment status and unit select onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Edit-form Role select.
    fireEvent.change(screen.getAllByLabelText(/^Role/)[1]!, { target: { value: 'SURGEON' } });
    // Speciality.
    fireEvent.change(screen.getAllByLabelText('Speciality')[0]!, { target: { value: 'Orthopaedics' } });
    // Employment status select.
    fireEvent.change(screen.getAllByLabelText('Employment status')[0]!, { target: { value: 'RETIRED' } });
    // Unit select — set then clear.
    fireEvent.change(screen.getAllByLabelText('Unit')[0]!, { target: { value: 'u1' } });
    fireEvent.change(screen.getAllByLabelText('Unit')[0]!, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ role: 'SURGEON', speciality: 'Orthopaedics', employmentStatus: 'RETIRED' }) }),
      ),
    );
  });

  it('exercises edit-form licence number, phone, and email onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Licence number.
    fireEvent.change(screen.getAllByLabelText('Licence number')[0]!, { target: { value: 'GMC-12345' } });
    // Phone.
    fireEvent.change(screen.getAllByLabelText('Phone')[0]!, { target: { value: '0244000000' } });
    // Email.
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'new@hospital.gh' } });
    // Head checkbox.
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ licenseNumber: 'GMC-12345', phone: '0244000000', email: 'new@hospital.gh' }) }),
      ),
    );
  });

  it('edits staff with populated speciality, licence, phone, email fields', async () => {
    const staffWithDetails = staff({
      speciality: 'Cardiology',
      licenseNumber: 'GMC-12345',
      phone: '0241234567',
      email: 'ama@facility.gh',
    });
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staffWithDetails],
          summary: { total: 1, assigned: 1, heads: 1, onLeave: 0 },
        });
      }
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // All fields should be pre-populated with non-null values
    expect(screen.getAllByLabelText('Speciality')[0]!).toHaveProperty('value', 'Cardiology');
    expect(screen.getAllByLabelText('Licence number')[0]!).toHaveProperty('value', 'GMC-12345');
    expect(screen.getAllByLabelText('Phone')[0]!).toHaveProperty('value', '0241234567');
    expect(screen.getAllByLabelText('Email')[0]!).toHaveProperty('value', 'ama@facility.gh');
    // Change and save
    fireEvent.change(screen.getAllByLabelText('Speciality')[0]!, { target: { value: 'Neurology' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ speciality: 'Neurology' }) }),
      ),
    );
  });

  it('edits staff without a unit and toggles head checkbox', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) {
        return Promise.resolve({
          staff: [staff({ unit: null })],
          summary: { total: 1, assigned: 0, heads: 0, onLeave: 0 },
        });
      }
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const headCheckboxes = screen.getAllByRole('checkbox', { name: /Head of unit/ });
    const headCheckbox = headCheckboxes[0]!;
    expect(headCheckbox).toHaveProperty('disabled', true);
    fireEvent.change(screen.getAllByLabelText('Unit')[0]!, { target: { value: 'u1' } });
    expect(headCheckbox).toHaveProperty('disabled', false);
    fireEvent.click(headCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ headOfUnit: true, unitId: 'u1' }) }),
      ),
    );
  });
});
