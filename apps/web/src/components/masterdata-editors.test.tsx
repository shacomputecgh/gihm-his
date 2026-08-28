// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EpiScheduleEditor, RolesEditor, FacilitiesEditor } from './MasterdataEditors';
import { Toaster } from './ui';
import type { AuthUser, EpiScheduleAdminItem, GeoRegion, PermissionInfo, RoleRow } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('./ImmunizationCoverage', () => ({ default: () => <div data-testid="coverage-stub" /> }));

const nationalUser: AuthUser = {
  id: 'u1',
  email: 'dev@demo.gh',
  fullName: 'Dev',
  roleCode: 'DEVELOPER',
  roleName: 'Developer',
  scope: 'NATIONAL',
  permissions: ['view_reports', 'manage_masterdata'],
  organizationId: null,
  facilityId: null,
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: null,
};

const epiItem = (over: Partial<EpiScheduleAdminItem> = {}): EpiScheduleAdminItem => ({
  vaccine: 'PENTA',
  dose: '1',
  label: 'Penta 1',
  description: 'First penta dose',
  ageDays: 42,
  intervalDays: 28,
  source: 'default',
  active: true,
  ...over,
});

const role = (over: Partial<RoleRow> = {}): RoleRow => ({
  id: 'r1',
  code: 'LAB_TECH',
  name: 'Lab Technician',
  scope: 'FACILITY',
  permissions: ['view_lab'],
  userCount: 2,
  ...over,
});

const permission: PermissionInfo = { code: 'view_lab', label: 'View lab worklist', group: 'Clinical' };

const region: GeoRegion = {
  id: 'gr1',
  code: 'GR',
  name: 'Greater Accra',
  capital: 'Accra',
  status: 'ACTIVE',
  districts: [{ id: 'gd1', code: 'KMA', name: 'Kpone Katamanso', type: 'MUNICIPAL', capital: 'Kpone', status: 'ACTIVE' }],
};

const renderWith = (el: React.ReactNode) =>
  render(
    <Toaster>{el}</Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
    if (url === '/admin/masterdata/epi-schedule') {
      // GET returns the schedule; the PUT returns the saved-changes summary.
      return init?.method === 'PUT' ? Promise.resolve({ updated: ['PENTA|1'] }) : Promise.resolve({ items: [epiItem()] });
    }
    if (url === '/admin/masterdata/roles') {
      return Promise.resolve({ roles: [role()], catalog: [permission] });
    }
    if (url === '/admin/masterdata/facilities') {
      return Promise.resolve({ facilities: [{ id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', type: 'TEACHING_HOSPITAL', level: null, ownership: 'GOVERNMENT', operationalStatus: 'OPERATIONAL', accreditation: null, bedCapacity: null, telephone: null, email: null, address: null, website: null, emergencyContact: null, services: ['OPD'], departmentsJson: ['OPD', 'MATERNITY'], region: { id: 'gr1', name: 'Greater Accra' }, district: { id: 'gd1', name: 'Kpone Katamanso' } }] });
    }
    if (url === '/admin/masterdata/geography') return Promise.resolve({ regions: [region] });
    return Promise.resolve(undefined);
  });
  mocks.useAuth.mockReset().mockReturnValue({ user: nationalUser });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('EpiScheduleEditor', () => {
  it('shows a spinner while loading and renders the schedule table', async () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderWith(<EpiScheduleEditor />);
    expect(screen.getByText('Loading schedule…')).toBeTruthy();
  });

  it('saves only changed rows with their timing fields', async () => {
    renderWith(<EpiScheduleEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Penta 1')).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue('Penta 1'), { target: { value: 'Penta 1 (updated)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/epi-schedule',
        expect.objectContaining({
          method: 'PUT',
          body: { items: [{ vaccine: 'PENTA', dose: '1', label: 'Penta 1 (updated)', description: 'First penta dose', ageDays: 42, intervalDays: 28, active: true }] },
        }),
      ),
    );
    expect(screen.getByText(/Saved 1 schedule change/)).toBeTruthy();
  });

  it('resets the schedule to defaults after confirmation', async () => {
    renderWith(<EpiScheduleEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Penta 1')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/epi-schedule/reset', { method: 'POST', body: {} }),
    );
    expect(screen.getByText('Schedule reset to defaults')).toBeTruthy();
  });

  it('hides the coverage panel without report permissions', async () => {
    mocks.useAuth.mockReturnValue({ user: { ...nationalUser, permissions: [] } });
    renderWith(<EpiScheduleEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Penta 1')).toBeTruthy());
    expect(screen.queryByTestId('coverage-stub')).toBeNull();
  });

  it('toasts errors when save-schedule and reset-schedule fail', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/masterdata/epi-schedule' && init?.method === 'PUT') return Promise.reject(new Error('save fail'));
      if (url === '/admin/masterdata/epi-schedule/reset') return Promise.reject(new Error('reset fail'));
      return base(url);
    });
    renderWith(<EpiScheduleEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Penta 1')).toBeTruthy());
    // Save fails.
    fireEvent.change(screen.getByDisplayValue('Penta 1'), { target: { value: 'Penta 1 (x)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText('save fail')).toBeTruthy());
    // Reset fails.
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    await waitFor(() => expect(screen.getByText('reset fail')).toBeTruthy());
  });

  it('toasts no-changes when save is clicked without edits', async () => {
    renderWith(<EpiScheduleEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Penta 1')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText('No changes to save')).toBeTruthy());
    expect(mocks.api).not.toHaveBeenCalledWith('/admin/masterdata/epi-schedule', expect.objectContaining({ method: 'PUT' }));
  });

  it('toggles the coverage preview when the button is clicked', async () => {
    renderWith(<EpiScheduleEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Penta 1')).toBeTruthy());
    expect(screen.queryByText('Preview of unsaved changes')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Coverage before/ }));
    expect(screen.getByText('Preview of unsaved changes')).toBeTruthy();
    // Toggle off.
    fireEvent.click(screen.getByRole('button', { name: /Coverage before/ }));
    expect(screen.queryByText('Preview of unsaved changes')).toBeNull();
  });
});

describe('RolesEditor', () => {
  it('renders roles and edits a selected role', async () => {
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Lab Technician')).toBeTruthy());
    fireEvent.click(screen.getByText('Lab Technician'));
    await waitFor(() => expect(screen.getByText('Edit LAB_TECH')).toBeTruthy());
    expect(screen.getByText('View lab worklist')).toBeTruthy();
    expect(screen.getByText(/2 users/)).toBeTruthy();
  });

  it('saves permission toggles via PUT', async () => {
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Lab Technician')).toBeTruthy());
    fireEvent.click(screen.getByText('Lab Technician'));
    await waitFor(() => expect(screen.getByText('Edit LAB_TECH')).toBeTruthy());
    // Toggle the permission off.
    fireEvent.click(screen.getByText('View lab worklist'));
    fireEvent.click(screen.getByRole('button', { name: 'Save role' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/roles/LAB_TECH',
        expect.objectContaining({ method: 'PUT', body: { name: 'Lab Technician', scope: 'FACILITY', permissions: [] } }),
      ),
    );
    expect(screen.getByText('Role LAB_TECH saved — applies on next login')).toBeTruthy();
  });

  it('creates a role and validates the form', async () => {
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Lab Technician')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Create role' })); // opens the form
    const createButtons = screen.getAllByRole('button', { name: 'Create role' });
    fireEvent.click(createButtons[createButtons.length - 1]!); // submit the empty form
    await waitFor(() => expect(screen.getByText('Enter a code and name for the new role')).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Role code/), { target: { value: 'lab tech' } });
    fireEvent.change(screen.getByLabelText(/Role name/), { target: { value: 'Lab Technician' } });
    fireEvent.click(createButtons[createButtons.length - 1]!);
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/roles',
        expect.objectContaining({ method: 'POST', body: { code: 'LAB_TECH', name: 'Lab Technician', scope: 'FACILITY', permissions: [] } }),
      ),
    );
  });

  it('shows delete button for a role with zero users and deletes it', async () => {
    const emptyRole = role({ code: 'NURSE_ROLE', name: 'Nurse Role', userCount: 0 });
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/masterdata/roles' && init?.method !== 'DELETE') return Promise.resolve({ roles: [emptyRole], catalog: [permission] });
      if (url.startsWith('/admin/masterdata/roles/') && init?.method === 'DELETE') return Promise.resolve(undefined);
      return Promise.resolve(undefined);
    });
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Nurse Role')).toBeTruthy());
    fireEvent.click(screen.getByText('Nurse Role'));
    await waitFor(() => expect(screen.getByText('Delete role')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Delete role' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/roles/NURSE_ROLE',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('toasts error when delete-role fails', async () => {
    const emptyRole = role({ code: 'NURSE_ROLE', name: 'Nurse Role', userCount: 0 });
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/masterdata/roles' && init?.method !== 'DELETE') return Promise.resolve({ roles: [emptyRole], catalog: [permission] });
      if (url.startsWith('/admin/masterdata/roles/') && init?.method === 'DELETE') return Promise.reject(new Error('delete fail'));
      return base(url);
    });
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Nurse Role')).toBeTruthy());
    fireEvent.click(screen.getByText('Nurse Role'));
    await waitFor(() => expect(screen.getByText('Delete role')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Delete role' }));
    await waitFor(() => expect(screen.getByText('delete fail')).toBeTruthy());
  });

  it('hides delete button for built-in roles and roles with users', async () => {
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Lab Technician')).toBeTruthy());
    fireEvent.click(screen.getByText('Lab Technician'));
    await waitFor(() => expect(screen.getByText('Edit LAB_TECH')).toBeTruthy());
    // LAB_TECH has userCount: 2, so no delete button.
    expect(screen.queryByRole('button', { name: 'Delete role' })).toBeNull();
  });

  it('toasts error when save-role fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/roles/') && init?.method === 'PUT') return Promise.reject(new Error('save role fail'));
      return base(url);
    });
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Lab Technician')).toBeTruthy());
    fireEvent.click(screen.getByText('Lab Technician'));
    await waitFor(() => expect(screen.getByText('Edit LAB_TECH')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Save role' }));
    await waitFor(() => expect(screen.getByText('save role fail')).toBeTruthy());
  });

  it('toasts error when create-role fails', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/masterdata/roles' && init?.method === 'POST') return Promise.reject(new Error('create role fail'));
      return base(url);
    });
    renderWith(<RolesEditor />);
    await waitFor(() => expect(screen.getByText('Lab Technician')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Create role' }));
    fireEvent.change(screen.getAllByLabelText(/Role code/)[0]!, { target: { value: 'x' } });
    fireEvent.change(screen.getAllByLabelText(/Role name/)[0]!, { target: { value: 'X' } });
    const createButtons = screen.getAllByRole('button', { name: 'Create role' });
    fireEvent.click(createButtons[createButtons.length - 1]!);
    await waitFor(() => expect(screen.getByText('create role fail')).toBeTruthy());
  });
});

describe('FacilitiesEditor', () => {
  it('shows a spinner while loading and lists scoped facilities', async () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderWith(<FacilitiesEditor />);
    expect(screen.getByText('Loading facility registry…')).toBeTruthy();
  });

  it('renders facility cards and edits a selected facility', async () => {
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    expect(screen.getByText('TEACHING HOSPITAL')).toBeTruthy();
    fireEvent.click(screen.getByText('Korle Bu Teaching Hospital'));
    await waitFor(() => expect(screen.getByText('Edit KB')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility name'), { target: { value: 'Korle Bu TH (renamed)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save facility' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/facilities/fac1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ name: 'Korle Bu TH (renamed)', services: ['OPD'], departments: ['OPD', 'MATERNITY'] }) }),
      ),
    );
    expect(screen.getByText('Facility KB saved')).toBeTruthy();
  });

  it('filters the registry by search', async () => {
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText('Search by name or code…'), { target: { value: 'zzz' } });
    await waitFor(() => expect(screen.getByText(/No facilities match/)).toBeTruthy());
  });

  it('edits and saves a region and district', async () => {
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    // Region/district names live in input values, not text nodes.
    await waitFor(() => expect(screen.getByDisplayValue('Greater Accra')).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue('Greater Accra'), { target: { value: 'Greater Accra Region' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save region' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/regions/gr1',
        expect.objectContaining({ method: 'PUT', body: { name: 'Greater Accra Region', capital: 'Accra', status: 'ACTIVE' } }),
      ),
    );
    fireEvent.change(screen.getByDisplayValue('Kpone Katamanso'), { target: { value: 'Kpone Katamanso Municipal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/districts/gd1',
        expect.objectContaining({ method: 'PUT', body: { name: 'Kpone Katamanso Municipal', capital: 'Kpone', type: 'MUNICIPAL', status: 'ACTIVE' } }),
      ),
    );
  });

  it('toasts errors when facility, region, and district saves fail', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/masterdata/facilities/fac1' && init?.method === 'PUT') return Promise.reject(new Error('facility fail'));
      if (url === '/admin/masterdata/regions/gr1' && init?.method === 'PUT') return Promise.reject(new Error('region fail'));
      if (url === '/admin/masterdata/districts/gd1' && init?.method === 'PUT') return Promise.reject(new Error('district fail'));
      return base(url, init);
    });
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    // Facility save fails.
    fireEvent.click(screen.getByText('Korle Bu Teaching Hospital'));
    await waitFor(() => expect(screen.getByText('Edit KB')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Save facility' }));
    await waitFor(() => expect(screen.getByText('facility fail')).toBeTruthy());
    // Region save fails.
    await waitFor(() => expect(screen.getByDisplayValue('Greater Accra')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Save region' }));
    await waitFor(() => expect(screen.getByText('region fail')).toBeTruthy());
    // District save fails.
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByText('district fail')).toBeTruthy());
  });

  it('cancels facility editing and renders non-NATIONAL scope subtitle', async () => {
    mocks.useAuth.mockReturnValue({ user: { ...nationalUser, scope: 'FACILITY', facilityId: 'fac1' } });
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    fireEvent.click(screen.getByText('Korle Bu Teaching Hospital'));
    await waitFor(() => expect(screen.getByText('Edit KB')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Edit KB')).toBeNull();
  });

  it('exercises facility edit-form onChange handlers', async () => {
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    fireEvent.click(screen.getByText('Korle Bu Teaching Hospital'));
    await waitFor(() => expect(screen.getByText('Edit KB')).toBeTruthy());
    // Exercise edit-form field onChange handlers.
    fireEvent.change(screen.getByLabelText('Facility name'), { target: { value: 'KB Renamed' } });
    fireEvent.change(screen.getByLabelText('Telephone'), { target: { value: '0302 999 999' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@hospital.gh' } });
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Hospital Road' } });
    fireEvent.change(screen.getByLabelText('Website'), { target: { value: 'https://hospital.gh' } });
    fireEvent.change(screen.getByLabelText(/Services/), { target: { value: 'OPD, ICU, MATERNITY' } });
    fireEvent.change(screen.getByLabelText(/Departments/), { target: { value: 'Outpatient, ICU, Maternity' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save facility' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/facilities/fac1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ name: 'KB Renamed', telephone: '0302 999 999' }) }),
      ),
    );
  });

  it('exercises facility edit-form accreditation, bed capacity, and GPS fields', async () => {
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    fireEvent.click(screen.getByText('Korle Bu Teaching Hospital'));
    await waitFor(() => expect(screen.getByText('Edit KB')).toBeTruthy());
    // Accreditation select.
    fireEvent.change(screen.getByLabelText('Accreditation'), { target: { value: 'FULL' } });
    // Bed capacity.
    fireEvent.change(screen.getByLabelText('Bed capacity'), { target: { value: '500' } });
    // Clear bed capacity.
    fireEvent.change(screen.getByLabelText('Bed capacity'), { target: { value: '' } });
    // GPS fields if present.
    const latInput = screen.queryByLabelText(/Latitude/);
    if (latInput) fireEvent.change(latInput, { target: { value: '5.6037' } });
    const lngInput = screen.queryByLabelText(/Longitude/);
    if (lngInput) fireEvent.change(lngInput, { target: { value: '-0.1870' } });
    // Emergency contact if present.
    const emergencyInput = screen.queryByLabelText(/Emergency/);
    if (emergencyInput) fireEvent.change(emergencyInput, { target: { value: '0302 111 000' } });
    // Opening hours if present.
    const hoursInput = screen.queryByLabelText(/Opening hours/);
    if (hoursInput) fireEvent.change(hoursInput, { target: { value: 'Mon-Fri 8am-5pm' } });
    // Save
    fireEvent.click(screen.getByRole('button', { name: 'Save facility' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/facilities/fac1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('exercises district type and status onChange handlers', async () => {
    renderWith(<FacilitiesEditor />);
    await waitFor(() => expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy());
    await waitFor(() => expect(screen.getByDisplayValue('Greater Accra')).toBeTruthy());
    // Region status select.
    fireEvent.change(screen.getByDisplayValue('ACTIVE'), { target: { value: 'INACTIVE' } });
    // Region capital.
    fireEvent.change(screen.getByDisplayValue('Accra'), { target: { value: 'Accra City' } });
    // District type select.
    const distTypeSelects = screen.getAllByDisplayValue('Municipal');
    fireEvent.change(distTypeSelects[0]!, { target: { value: 'METROPOLITAN' } });
    // District status select.
    const distStatusSelects = screen.getAllByDisplayValue('Active');
    fireEvent.change(distStatusSelects[0]!, { target: { value: 'INACTIVE' } });
    // District name.
    fireEvent.change(screen.getByDisplayValue('Kpone Katamanso'), { target: { value: 'Kpone Katamanso MMDA' } });
    // Save district.
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/districts/gd1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.objectContaining({ name: 'Kpone Katamanso MMDA', type: 'METROPOLITAN', status: 'INACTIVE' }),
        }),
      ),
    );
  });
});
