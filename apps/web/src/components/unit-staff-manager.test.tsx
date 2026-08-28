// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import UnitStaffManager from './UnitStaffManager';
import { Toaster } from './ui';
import type { Staff } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));

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

const onClose = vi.fn();
const onChanged = vi.fn();

const renderManager = () =>
  render(
    <Toaster>
      <UnitStaffManager facilityId="fac1" unitId="u1" label="OPD" onClose={onClose} onChanged={onChanged} />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) =>
    url.startsWith('/admin/masterdata/staff?')
      ? Promise.resolve({ staff: [staff()], summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 } })
      : Promise.resolve(undefined),
  );
  onClose.mockClear();
  onChanged.mockClear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('UnitStaffManager', () => {
  it('shows a spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderManager();
    expect(screen.getByText('Loading staff…')).toBeTruthy();
  });

  it('loads the unit-scoped team and renders the summary + rows', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    expect(screen.getByText('Team — OPD')).toBeTruthy();
    expect(screen.getByText('Total staff')).toBeTruthy();
    // The speciality is part of the mono line under the name.
    expect(screen.getAllByText(/Cardiology/).length).toBeGreaterThan(0);
    expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/staff?facilityId=fac1&unitId=u1');
  });

  it('filters the team client-side by role', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/staff?')
        ? Promise.resolve({
            staff: [staff(), staff({ id: 's2', fullName: 'Kofi Mensah', role: 'NURSE' })],
            summary: { total: 2, assigned: 2, heads: 0, onLeave: 0 },
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    // The filter select comes before the add-form role select.
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'NURSE' } });
    expect(screen.queryByText('Dr. Ama Owusu')).toBeNull();
    expect(screen.getByText('Kofi Mensah')).toBeTruthy();
  });

  it('adds a staff member to the unit', async () => {
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
          body: expect.objectContaining({ fullName: 'Nurse Efua', staffNumber: 'KBTH-0200', facilityId: 'fac1', unitId: 'u1' }),
        }),
      ),
    );
    expect(screen.getByText('Nurse Efua added')).toBeTruthy();
    expect(onChanged).toHaveBeenCalled();
  });

  it('edits a record and saves via PUT', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getAllByLabelText('Full name')[0]!;
    fireEvent.change(nameInput, { target: { value: 'Dr. Ama Owusu-Danquah' } });
    // Exercise more edit-form fields to cover inline onChange handlers.
    fireEvent.change(screen.getAllByLabelText('Licence number')[0]!, { target: { value: 'GMC-9999' } });
    fireEvent.change(screen.getAllByLabelText('Phone')[0]!, { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'new@hospital.gh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ fullName: 'Dr. Ama Owusu-Danquah' }) }),
      ),
    );
    expect(screen.getByText('Saved Dr. Ama Owusu-Danquah')).toBeTruthy();
  });

  it('promotes a head of unit and removes a record after confirmation', async () => {
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

    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mocks.api).not.toHaveBeenCalledWith(expect.stringContaining('/remove'), expect.anything());

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/staff/s1/remove', { method: 'POST', body: {} }),
    );
    expect(screen.getByText('Removed Dr. Ama Owusu')).toBeTruthy();
  });

  it('closes via the close button and the backdrop', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('.fixed.inset-0')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('toasts an error when create fails', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [], summary: { total: 0, assigned: 0, heads: 0, onLeave: 0 } });
      if (init?.method === 'POST') return Promise.reject(new Error('network')); return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('No staff recorded here yet. Add the first member below.')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/Staff number/), { target: { value: 'KB-001' } });
    fireEvent.click(screen.getByRole('button', { name: /Add staff/ }));
    await waitFor(() => expect(screen.getByText('network')).toBeTruthy());
  });

  it('toasts an error when save-edit fails', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [staff()], summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 } });
      if (init?.method === 'PUT') return Promise.reject(new Error('save failed')); return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() => expect(screen.getByText('save failed')).toBeTruthy());
  });

  it('demotes head of unit and toasts on remove error', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [staff({ headOfUnit: true })], summary: { total: 1, assigned: 1, heads: 1, onLeave: 0 } });
      if (init?.method === 'POST' && url.includes('/remove')) return Promise.reject(new Error('nope')); return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    // The staff row should show 'Remove head' instead of 'Make head'.
    expect(screen.getByRole('button', { name: 'Remove head' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove head' }));
    await waitFor(() => expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('/admin/masterdata/staff/s1'), expect.objectContaining({ body: { headOfUnit: false } })));
    // Now remove → error.
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.getByText('nope')).toBeTruthy());
  });

  it('renders staff with no phone/email and no speciality gracefully', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/staff?')
        ? Promise.resolve({
            staff: [staff({ phone: null, email: null, speciality: null, joinedAt: null, unit: null })],
            summary: { total: 1, assigned: 0, heads: 0, onLeave: 0 },
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    expect(screen.getByText('Unassigned')).toBeTruthy();
    // No phone/email line rendered.
    expect(screen.queryByText('0244 000 000')).toBeNull();
  });

  it('shows empty filter hint when role filter matches nothing', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/staff?')
        ? Promise.resolve({ staff: [staff()], summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 } })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'NURSE' } });
    expect(screen.getByText('No staff match this role filter.')).toBeTruthy();
  });

  it('loads in facility-wide mode when no unitId is given', async () => {
    const units = [{ id: 'u1', code: 'OPD', name: 'OPD' }];
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [staff()], summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 } });
      if (url.startsWith('/admin/masterdata/units?')) return Promise.resolve({ facilities: [{ departments: [{ units }] }] });
      return Promise.resolve(undefined);
    });
    render(
      <Toaster>
        <UnitStaffManager facilityId="fac1" label="All staff" onClose={onClose} onChanged={onChanged} />
      </Toaster>,
    );
    await waitFor(() => expect(screen.getByText('Staff directory — All staff')).toBeTruthy());
    // Should render the staff row and the unit selector in the add form.
    expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy();
    expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/staff?facilityId=fac1');
    expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/units?facilityId=fac1');
  });

  it('toasts error when setHead fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string; body?: Record<string, unknown> }) => {
      if (init?.method === 'PUT' && init.body && 'headOfUnit' in init.body) return Promise.reject(new Error('head fail'));
      return base(url);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Make head' }));
    await waitFor(() => expect(screen.getByText('head fail')).toBeTruthy());
  });

  it('exercises add-form role, employment status, and head checkbox onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByLabelText(/Staff number/), { target: { value: 'kb-999' } });
    fireEvent.change(screen.getByLabelText('Speciality'), { target: { value: 'Paediatrics' } });
    fireEvent.change(screen.getByLabelText('Licence number'), { target: { value: 'GMC-9999' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0200 111 222' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@hospital.gh' } });
    fireEvent.click(screen.getByRole('button', { name: /Add staff/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ fullName: 'New Person', staffNumber: 'KB-999' }) }),
      ),
    );
  });

  it('exercises facility-wide edit form Unit select and Head checkbox onChange handlers', async () => {
    const units = [{ id: 'u1', code: 'OPD', name: 'OPD' }];
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [staff()], summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 } });
      if (url.startsWith('/admin/masterdata/units?')) return Promise.resolve({ facilities: [{ departments: [{ units }] }] });
      return Promise.resolve(undefined);
    });
    render(
      <Toaster>
        <UnitStaffManager facilityId="fac1" label="All staff" onClose={onClose} onChanged={onChanged} />
      </Toaster>,
    );
    await waitFor(() => expect(screen.getByText('Staff directory — All staff')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // In facility-wide mode, the edit form shows the Unit select — last one on the page.
    const unitSelects = screen.getAllByLabelText('Unit');
    fireEvent.change(unitSelects[unitSelects.length - 1]!, { target: { value: 'u1' } });
    // The head checkbox should now be enabled.
    const headCheckbox = screen.getAllByRole('checkbox', { name: /Head of unit/ })[0]!;
    expect(headCheckbox).toHaveProperty('disabled', false);
    fireEvent.click(headCheckbox);
    // Clear the unit to exercise the null branch.
    fireEvent.change(unitSelects[unitSelects.length - 1]!, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('exercises edit-form role and employment status select onChange handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Dr. Ama Owusu')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise role select in edit form — filter is first, edit-form is second.
    fireEvent.change(screen.getAllByLabelText(/^Role/)[1]!, { target: { value: 'SURGEON' } });
    // Exercise employment status select in edit form.
    fireEvent.change(screen.getAllByLabelText('Employment status')[0]!, { target: { value: 'ON_LEAVE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('exercises edit-form licence, phone, email and speciality onChange in facility-wide mode', async () => {
    const units = [{ id: 'u1', code: 'OPD', name: 'OPD' }];
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/admin/masterdata/staff?')) return Promise.resolve({ staff: [staff()], summary: { total: 1, assigned: 1, heads: 0, onLeave: 0 } });
      if (url.startsWith('/admin/masterdata/units?')) return Promise.resolve({ facilities: [{ departments: [{ units }] }] });
      return Promise.resolve(undefined);
    });
    render(
      <Toaster>
        <UnitStaffManager facilityId="fac1" label="All staff" onClose={onClose} onChanged={onChanged} />
      </Toaster>,
    );
    await waitFor(() => expect(screen.getByText('Staff directory — All staff')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise edit-form onChange handlers for licence, phone, email, speciality
    fireEvent.change(screen.getAllByLabelText('Speciality')[0]!, { target: { value: 'Cardiology' } });
    fireEvent.change(screen.getAllByLabelText('Licence number')[0]!, { target: { value: 'GMC-12345' } });
    fireEvent.change(screen.getAllByLabelText('Phone')[0]!, { target: { value: '0200111222' } });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'doc@hospital.gh' } });
    // Exercise the Unit select with a valid unit id
    const unitSelects = screen.getAllByLabelText('Unit');
    fireEvent.change(unitSelects[unitSelects.length - 1]!, { target: { value: 'u1' } });
    // Exercise employment status in edit form
    fireEvent.change(screen.getAllByLabelText('Employment status')[0]!, { target: { value: 'RETIRED' } });
    // Save the edit
    fireEvent.click(screen.getByRole('button', { name: 'Save staff' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/staff/s1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });
});
