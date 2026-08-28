// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import NationalServiceManager from './NationalServiceManager';
import { Toaster } from './ui';
import type { NationalServiceStaff, AuthUser } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('./UnitsManager', () => ({ unitEditableFacility: () => () => true }));

const staff = (over: Partial<NationalServiceStaff> = {}): NationalServiceStaff => ({
  id: 'p1',
  nssNumber: 'NSS-2026-0042',
  fullName: 'Abena Owusu-Ansah',
  institution: 'University of Ghana',
  programme: 'BSc Nursing',
  placement: 'Ward nurse support',
  supervisor: 'Nurse Ama Serwaa',
  phone: '0244 000 000',
  email: 'abena@uni.edu.gh',
  startDate: '2026-08-01T00:00:00.000Z',
  endDate: null,
  status: 'ACTIVE',
  notes: null,
  unit: { id: 'u1', code: 'OPD', name: 'OPD' },
  facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital' },
  ...over,
});

const user: AuthUser = {
  id: 'u1',
  email: 'admin@demo.gh',
  fullName: 'Admin',
  roleCode: 'SYSTEM_ADMIN',
  roleName: 'System admin',
  scope: 'NATIONAL',
  permissions: [],
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
      <NationalServiceManager />
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
    if (url.startsWith('/admin/masterdata/national-service?')) {
      return Promise.resolve({ personnel: [staff()], summary: { total: 1, active: 1 } });
    }
    return Promise.resolve(undefined);
  });
  mocks.useAuth.mockReset().mockReturnValue({ user });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('NationalServiceManager', () => {
  it('shows a spinner while the facilities load', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderManager();
    expect(screen.getByText('Loading national service register…')).toBeTruthy();
  });

  it('shows the empty state when no facilities are in scope', async () => {
    mocks.api.mockImplementation((url: string) =>
      url === '/admin/masterdata/facilities' ? Promise.resolve({ facilities: [] }) : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('No facilities in scope')).toBeTruthy());
  });

  it('renders the register with stats, personnel rows and facility name', async () => {
    // Override with a person that has endDate, supervisor, and unit to cover display branches.
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [{ id: 'fac1', name: 'Korle Bu Teaching Hospital' }] });
      if (url.startsWith('/admin/masterdata/units?')) return Promise.resolve({ facilities: [{ departments: [{ units: [{ id: 'u1', code: 'OPD', name: 'OPD' }] }] }] });
      if (url.startsWith('/admin/masterdata/national-service?')) return Promise.resolve({
        personnel: [staff({ endDate: '2027-07-31T00:00:00.000Z', supervisor: 'Nurse Kofi', placement: 'Ward nurse support' })],
        summary: { total: 1, active: 1 },
      });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    expect(screen.getByText('On the register')).toBeTruthy();
    expect(screen.getByText('Active postings')).toBeTruthy();
    // Facility name appears both in the facility selector and the summary card.
    expect(screen.getAllByText('Korle Bu Teaching Hospital').length).toBeGreaterThan(0);
    // ACTIVE also appears as an option in the status selects.
    expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0);
    expect(screen.getByText(/NSS-2026-0042/)).toBeTruthy();
    expect(screen.getByText('OPD')).toBeTruthy();
  });

  it('shows the empty personnel hint when the register has nobody', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/national-service?')) {
        return Promise.resolve({ personnel: [], summary: { total: 0, active: 0 } });
      }
      if (url === '/admin/masterdata/facilities') {
        return Promise.resolve({ facilities: [{ id: 'fac1', name: 'Korle Bu Teaching Hospital' }] });
      }
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() =>
      expect(screen.getByText('No national service personnel match this view. Post the first graduate below.')).toBeTruthy(),
    );
  });

  it('refetches with the status filter applied', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    const statusSelect = screen.getAllByLabelText('Status')[0]!;
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('national-service?facilityId=fac1&status=COMPLETED')),
    );
  });

  it('posts a new person from the form and reloads the register', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Kofi Mensah' } });
    fireEvent.click(screen.getByRole('button', { name: /Post person/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ fullName: 'Kofi Mensah' }) }),
      ),
    );
    expect(screen.getByText('Kofi Mensah posted')).toBeTruthy();
  });

  it('edits a person and saves via PUT', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getAllByLabelText('Full name')[0]!;
    fireEvent.change(nameInput, { target: { value: 'Abena Owusu' } });
    // Exercise more edit-form fields to cover inline onChange handlers.
    fireEvent.change(screen.getAllByLabelText('Institution')[0]!, { target: { value: 'KNUST' } });
    fireEvent.change(screen.getAllByLabelText('Programme')[0]!, { target: { value: 'BSc Midwifery' } });
    fireEvent.change(screen.getAllByLabelText('Placement')[0]!, { target: { value: 'Labour ward' } });
    fireEvent.change(screen.getAllByLabelText('Supervisor')[0]!, { target: { value: 'Nurse Kofi' } });
    fireEvent.change(screen.getAllByLabelText('Phone')[0]!, { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'abena@uni.edu.gh' } });
    // Exercise the Unit select in the edit form.
    fireEvent.change(screen.getAllByLabelText('Unit')[0]!, { target: { value: 'u1' } });
    // Exercise the date inputs.
    fireEvent.change(screen.getAllByLabelText('Start date')[0]!, { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getAllByLabelText('End date')[0]!, { target: { value: '2027-07-31' } });
    // Exercise the Status select in the edit form.
    fireEvent.change(screen.getAllByLabelText('Status')[0]!, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service/p1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ fullName: 'Abena Owusu', institution: 'KNUST' }) }),
      ),
    );
    expect(screen.getByText('Saved Abena Owusu')).toBeTruthy();
  });

  it('marks an active posting as completed', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Mark completed' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service/p1',
        expect.objectContaining({ method: 'PUT', body: { status: 'COMPLETED' } }),
      ),
    );
    expect(screen.getByText('Abena Owusu-Ansah → completed')).toBeTruthy();
  });

  it('removes a person only after confirmation', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mocks.api).not.toHaveBeenCalledWith(expect.stringContaining('/remove'), expect.anything());

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/national-service/p1/remove', { method: 'POST', body: {} }),
    );
    expect(screen.getByText('Removed Abena Owusu-Ansah')).toBeTruthy();
  });

  it('toasts errors on create, save, status-change, and remove failures', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string; body?: Record<string, unknown> }) => {
      if (url === '/admin/masterdata/national-service' && init?.method === 'POST') return Promise.reject(new Error('create fail'));
      if (init?.method === 'PUT' && url.includes('/national-service/p1') && init.body?.fullName !== undefined) return Promise.reject(new Error('save fail'));
      if (init?.method === 'PUT' && init.body?.status) return Promise.reject(new Error('status fail'));
      if (url.includes('/remove')) return Promise.reject(new Error('remove fail'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    // Create fails.
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Kofi' } });
    fireEvent.click(screen.getByRole('button', { name: /Post person/ }));
    await waitFor(() => expect(screen.getByText('create fail')).toBeTruthy());
    // Save edit fails.
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('save fail')).toBeTruthy());
    // Status change fails.
    fireEvent.click(screen.getByRole('button', { name: 'Mark completed' }));
    await waitFor(() => expect(screen.getByText('status fail')).toBeTruthy());
    // Remove fails.
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.getByText('remove fail')).toBeTruthy());
  });

  it('terminates an active person and reactivates a terminated one', async () => {
    const terminated = staff({ id: 'p2', fullName: 'Kofi Asante', status: 'TERMINATED' });
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [{ id: 'fac1', name: 'Korle Bu Teaching Hospital' }] });
      if (url.startsWith('/admin/masterdata/units?')) return Promise.resolve({ facilities: [{ departments: [{ units: [{ id: 'u1', code: 'OPD', name: 'OPD' }] }] }] });
      if (url.startsWith('/admin/masterdata/national-service?')) return Promise.resolve({ personnel: [staff(), terminated], summary: { total: 2, active: 1 } });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    // Terminate.
    fireEvent.click(screen.getByRole('button', { name: 'Terminate' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service/p1',
        expect.objectContaining({ method: 'PUT', body: { status: 'TERMINATED' } }),
      ),
    );
    expect(screen.getByText('Abena Owusu-Ansah → terminated')).toBeTruthy();
    // Reactivate.
    fireEvent.click(screen.getByRole('button', { name: 'Reactivate' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service/p2',
        expect.objectContaining({ method: 'PUT', body: { status: 'ACTIVE' } }),
      ),
    );
  });

  it('exercises all add-form onChange handlers (NSS, institution, programme, placement, supervisor, phone, email, unit, dates, status)', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    // Exercise every add-form field handler.
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Kofi Mensah' } });
    fireEvent.change(screen.getByLabelText(/NSS/), { target: { value: 'NSS-2026-0100' } });
    fireEvent.change(screen.getByLabelText('Institution'), { target: { value: 'KNUST' } });
    fireEvent.change(screen.getByLabelText('Programme'), { target: { value: 'BSc Midwifery' } });
    fireEvent.change(screen.getByLabelText('Placement'), { target: { value: 'Labour ward' } });
    fireEvent.change(screen.getByLabelText('Supervisor'), { target: { value: 'Nurse Kofi' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'kofi@uni.edu.gh' } });
    // Unit select.
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'u1' } });
    // Date fields.
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2027-08-31' } });
    // Status select.
    // Status select in the add form — filter select comes first.
    fireEvent.change(screen.getAllByLabelText('Status')[1]!, { target: { value: 'ACTIVE' } });
    fireEvent.click(screen.getByRole('button', { name: /Post person/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ fullName: 'Kofi Mensah', nssNumber: 'NSS-2026-0100', institution: 'KNUST' }) }),
      ),
    );
  });

  it('filters by search term', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText('Name…'), { target: { value: 'Kofi' } });
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('national-service?facilityId=fac1&q=Kofi')),
    );
  });

  it('exercises all edit-form field onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Abena Owusu-Ansah')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise every onChange handler in the edit form.
    fireEvent.change(screen.getAllByLabelText('Full name')[0]!, { target: { value: 'A' } });
    fireEvent.change(screen.getAllByLabelText('Institution')[0]!, { target: { value: 'KNUST' } });
    fireEvent.change(screen.getAllByLabelText('Programme')[0]!, { target: { value: 'BSc Nursing' } });
    fireEvent.change(screen.getAllByLabelText('Placement')[0]!, { target: { value: 'OPD' } });
    fireEvent.change(screen.getAllByLabelText('Supervisor')[0]!, { target: { value: 'Nurse Ama' } });
    fireEvent.change(screen.getAllByLabelText('Phone')[0]!, { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getAllByLabelText('Unit')[0]!, { target: { value: 'u1' } });
    fireEvent.change(screen.getAllByLabelText('Start date')[0]!, { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getAllByLabelText('End date')[0]!, { target: { value: '2026-12-31' } });
    fireEvent.change(screen.getAllByLabelText('Status')[0]!, { target: { value: 'COMPLETED' } });
    // Clear the unit selection to exercise the null branch.
    fireEvent.change(screen.getAllByLabelText('Unit')[0]!, { target: { value: '' } });
    // Save.
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/national-service/p1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });
});
