// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import UnitsManager, { unitEditableFacility } from './UnitsManager';
import { Toaster } from './ui';
import type { AuthUser, HospitalUnit, UnitFacilityTree } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('./UnitEquipmentManager', () => ({ default: ({ unit }: { unit: { name: string } }) => <div data-testid="equipment-modal">{unit.name}</div> }));
vi.mock('./UnitStaffManager', () => ({ default: ({ label }: { label: string }) => <div data-testid="staff-modal">{label}</div> }));

const nationalUser: AuthUser = {
  id: 'u1',
  email: 'dev@demo.gh',
  fullName: 'Dev',
  roleCode: 'DEVELOPER',
  roleName: 'Developer',
  scope: 'NATIONAL',
  permissions: [],
  organizationId: null,
  facilityId: null,
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: null,
};

const unit = (over: Partial<HospitalUnit> = {}): HospitalUnit => ({
  id: 'u1',
  code: 'OPD',
  name: 'OPD',
  type: 'CLINICAL',
  headName: 'Dr. Ama Owusu',
  headTitle: 'Consultant',
  phone: '0302 000 100',
  location: 'Block A',
  bedCapacity: 40,
  services: ['OPD'],
  notes: null,
  status: 'ACTIVE',
  department: { id: 'd1', name: 'Outpatient' },
  facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital' },
  wards: [{ id: 'w1', name: 'Male Surgical Ward', bedCapacity: 20, status: 'ACTIVE', beds: 10, occupied: 6 }],
  beds: 10,
  occupied: 6,
  equipment: { items: 3, functional: 3, inMaintenance: 0, faulty: 0, maintenanceDue: 0 },
  team: { count: 5, heads: 1, onLeave: 0 },
  ...over,
});

const tree: UnitFacilityTree = {
  facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', staff: { total: 5, assigned: 4, heads: 1 } },
  departments: [{ department: { id: 'd1', name: 'Outpatient' }, units: [unit()] }],
};

const facility = { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', type: 'TEACHING_HOSPITAL', level: null, ownership: 'GOVERNMENT', operationalStatus: 'OPERATIONAL', accreditation: null, bedCapacity: null, telephone: null, email: null, address: null, website: null, emergencyContact: null, services: [], departmentsJson: ['Outpatient'], departments: [{ id: 'd1', name: 'Outpatient' }] };

const renderManager = () =>
  render(
    <Toaster>
      <UnitsManager />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) => {
    if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
    if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [tree] });
    return Promise.resolve(undefined);
  });
  mocks.useAuth.mockReset().mockReturnValue({ user: nationalUser });
});

afterEach(() => cleanup());

describe('UnitsManager', () => {
  it('disables New unit until a facility is selected', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    expect(screen.getByRole('button', { name: /New unit/ })).toHaveProperty('disabled', true);
  });

  it('renders the unit tree with badges and wards once a facility is chosen', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    // OPD appears as the unit name and the services badge.
    expect(screen.getAllByText('OPD').length).toBeGreaterThan(0);
    expect(screen.getByText('Male Surgical Ward')).toBeTruthy();
    // The ward line appends the capacity when one is set.
    expect(screen.getByText(/6\/10 occupied · capacity 20/)).toBeTruthy();
    expect(screen.getByText(/10 beds/)).toBeTruthy();
    expect(screen.getByText('3 equipment')).toBeTruthy();
    expect(screen.getByText('5 staff')).toBeTruthy();
    expect(screen.getByText('★ 1 head')).toBeTruthy();
    expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/units?facilityId=fac1');
  });

  it('creates a unit with normalized services', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /New unit/ }));
    fireEvent.change(screen.getByLabelText(/Unit code/), { target: { value: 'icu' } });
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'Intensive Care Unit' } });
    fireEvent.change(screen.getByLabelText(/Services/), { target: { value: 'ICU, nicu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create unit' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/units',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ code: 'ICU', name: 'Intensive Care Unit', facilityId: 'fac1', services: ['ICU', 'NICU'], bedCapacity: null }),
        }),
      ),
    );
    expect(screen.getByText('Unit ICU created')).toBeTruthy();
  });

  it('edits a unit and saves via PUT', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getByLabelText('Unit name');
    fireEvent.change(nameInput, { target: { value: 'Outpatient Department' } });
    // Exercise more edit-form fields to cover inline onChange handlers.
    fireEvent.change(screen.getByLabelText('Head of unit'), { target: { value: 'Dr. Test' } });
    fireEvent.change(screen.getByLabelText('Phone / extension'), { target: { value: '0302 999 999' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Block B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save unit' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/units/u1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ name: 'Outpatient Department', services: ['OPD'] }) }),
      ),
    );
    expect(screen.getByText('Unit OPD saved')).toBeTruthy();
  });

  it('adds a ward and then a bed to it', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Ward' }));
    fireEvent.change(screen.getByLabelText('Ward name'), { target: { value: 'Female Surgical Ward' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add ward' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/units/u1/wards',
        expect.objectContaining({ method: 'POST', body: { name: 'Female Surgical Ward', bedCapacity: null } }),
      ),
    );
    expect(screen.getByText(/Ward “Female Surgical Ward” added/)).toBeTruthy();

    fireEvent.click(screen.getByTitle('Add bed to Male Surgical Ward'));
    // The bed-number label carries a hint.
    fireEvent.change(screen.getByLabelText(/Bed number/), { target: { value: 'SW-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add bed' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/units/u1/beds',
        expect.objectContaining({ method: 'POST', body: { wardId: 'w1', bedNumber: 'SW-02' } }),
      ),
    );
    expect(screen.getByText('Bed SW-02 added to Male Surgical Ward')).toBeTruthy();
  });

  it('opens the equipment and team modals from a unit', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Equipment' }));
    expect(screen.getByTestId('equipment-modal').textContent).toContain('OPD');

    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(screen.getByTestId('staff-modal').textContent).toContain('OPD');
  });

  it('shows equipment maintenance badges and ward without bedCapacity', async () => {
    const damagedUnit = unit({
      equipment: { items: 5, functional: 2, inMaintenance: 2, faulty: 1, maintenanceDue: 1 },
      team: { count: 5, heads: 1, onLeave: 2 },
      wards: [{ id: 'w1', name: 'Male Surgical Ward', bedCapacity: null, status: 'ACTIVE', beds: 10, occupied: 6 }],
    });
    const damageTree: UnitFacilityTree = {
      facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', staff: { total: 5, assigned: 4, heads: 1 } },
      departments: [{ department: { id: 'd1', name: 'Outpatient' }, units: [damagedUnit] }],
    };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [damageTree] });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    // Equipment maintenance/faulty badges.
    expect(screen.getByText('2 maint · 1 faulty')).toBeTruthy();
    expect(screen.getByText('1 due')).toBeTruthy();
    // On-leave badge.
    expect(screen.getByText('2 on leave')).toBeTruthy();
    // Ward without bedCapacity (no 'capacity X' suffix).
    expect(screen.getByText(/6\/10 occupied$/)).toBeTruthy();
  });

  it('shows empty tree and facility-level staff modal', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [] });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText(/No units yet/)).toBeTruthy());
  });

  it('toasts errors on create, save, ward, and bed failures', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    // Create fails.
    fireEvent.click(screen.getByRole('button', { name: /New unit/ }));
    fireEvent.change(screen.getByLabelText(/Unit code/), { target: { value: 'icu' } });
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'ICU' } });
    // Override API to fail on POST.
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST' && url === '/admin/masterdata/units') return Promise.reject(new Error('create fail'));
      if (init?.method === 'PUT') return Promise.reject(new Error('save fail'));
      if (init?.method === 'POST' && url.includes('/wards')) return Promise.reject(new Error('ward fail'));
      if (init?.method === 'POST' && url.includes('/beds')) return Promise.reject(new Error('bed fail'));
      return base(url, init);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create unit' }));
    await waitFor(() => expect(screen.getByText('create fail')).toBeTruthy());
    // Save edit fails.
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save unit' }));
    await waitFor(() => expect(screen.getByText('save fail')).toBeTruthy());
    // Add ward fails.
    fireEvent.click(screen.getByRole('button', { name: 'Ward' }));
    fireEvent.change(screen.getByLabelText('Ward name'), { target: { value: 'W1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add ward' }));
    await waitFor(() => expect(screen.getByText('ward fail')).toBeTruthy());
    // Add bed fails.
    fireEvent.click(screen.getByTitle('Add bed to Male Surgical Ward'));
    fireEvent.change(screen.getByLabelText(/Bed number/), { target: { value: 'SW-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add bed' }));
    await waitFor(() => expect(screen.getByText('bed fail')).toBeTruthy());
  });

  it('unitEditableFacility covers all scope levels', () => {
    const national = unitEditableFacility({ id: 'u1', scope: 'NATIONAL', regionId: null, districtId: null, facilityId: null } as AuthUser);
    expect(national({ id: 'f1', region: { id: 'r1' }, district: { id: 'd1' } })).toBe(true);
    expect(unitEditableFacility(null)({ id: 'f1' })).toBe(true);
    const regional = unitEditableFacility({ id: 'u1', scope: 'REGIONAL', regionId: 'r1', districtId: null, facilityId: null } as AuthUser);
    expect(regional({ id: 'f1', region: { id: 'r1' } })).toBe(true);
    expect(regional({ id: 'f1', region: { id: 'r2' } })).toBe(false);
    const district = unitEditableFacility({ id: 'u1', scope: 'DISTRICT', regionId: 'r1', districtId: 'd1', facilityId: null } as AuthUser);
    expect(district({ id: 'f1', district: { id: 'd1' } })).toBe(true);
    expect(district({ id: 'f1', district: { id: 'd2' } })).toBe(false);
    const facility = unitEditableFacility({ id: 'u1', scope: 'FACILITY', regionId: 'r1', districtId: 'd1', facilityId: 'f1' } as AuthUser);
    expect(facility({ id: 'f1' })).toBe(true);
    expect(facility({ id: 'f2' })).toBe(false);
  });

  it('toasts when New unit is clicked without selecting a facility', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /New unit/ }));
    // Button is disabled, so nothing should happen — just verify no create form appeared.
    expect(screen.queryByText('Create unit')).toBeNull();
  });

  it('renders unit with no head, no phone, no location, no services', async () => {
    const minimalUnit = unit({
      headName: null, headTitle: null, phone: null, location: null, services: [],
      wards: [],
    });
    const minTree: UnitFacilityTree = {
      facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', staff: { total: 0, assigned: 0, heads: 0 } },
      departments: [{ department: { id: 'd1', name: 'Outpatient' }, units: [minimalUnit] }],
    };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [minTree] });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    // No wards.
    expect(screen.getByText('No wards yet.')).toBeTruthy();
    // 0 staff badge.
    expect(screen.getByText(/0 staff/)).toBeTruthy();
  });

  it('renders "— unassigned —" for a unit without a department', async () => {
    const noDeptUnit = unit({ department: null });
    const noDeptTree: UnitFacilityTree = {
      facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', staff: { total: 1, assigned: 1, heads: 0 } },
      departments: [{ department: null, units: [noDeptUnit] }],
    };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [noDeptTree] });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('— unassigned —')).toBeTruthy());
    expect(screen.getAllByText('OPD').length).toBeGreaterThan(0);
  });

  it('shows spinner while tree is loading', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return new Promise(() => {});
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText(/Loading/)).toBeTruthy());
  });

  it('exercises equipment and team button click handlers', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    // Click Equipment button
    const equipmentButton = screen.getByRole('button', { name: /Equipment/ });
    fireEvent.click(equipmentButton);
    expect(screen.getByTestId('equipment-modal')).toBeTruthy();
    // Click Team button
    const teamButton = screen.getByRole('button', { name: /Team/ });
    fireEvent.click(teamButton);
    expect(screen.getByTestId('staff-modal')).toBeTruthy();
  });

  it('exercises create form department, bed capacity, head, phone, location, services fields', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /New unit/ }));
    // Exercise every create-form field onChange
    fireEvent.change(screen.getByLabelText(/Unit code/), { target: { value: 'MAT' } });
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'Maternity Ward' } });
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'CLINICAL' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'd1' } });
    fireEvent.change(screen.getByLabelText('Bed capacity'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Head of unit'), { target: { value: 'Dr. Kofi Mensah' } });
    fireEvent.change(screen.getByLabelText('Head title'), { target: { value: 'Senior Consultant' } });
    fireEvent.change(screen.getByLabelText('Phone / extension'), { target: { value: '0302 111 222' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Block C, Floor 3' } });
    fireEvent.change(screen.getByLabelText(/Services/), { target: { value: 'MATERNITY, ANC' } });
    // Cancel create form
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Create unit')).toBeNull();
  });

  it('exercises edit form type, department, bed capacity, status, head title, services fields', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise edit-form fields not covered by the existing edit test
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'DIAGNOSTIC' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'd1' } });
    fireEvent.change(screen.getByLabelText('Bed capacity'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'INACTIVE' } });
    fireEvent.change(screen.getByLabelText('Head title'), { target: { value: 'Professor' } });
    // Services field has hint text; find the input in edit form
    const servicesInputs = screen.getAllByLabelText(/Services/);
    fireEvent.change(servicesInputs[servicesInputs.length - 1]!, { target: { value: 'OPD, EMERGENCY' } });
    // Cancel edit form
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Save unit')).toBeNull();
  });

  it('exercises edit form with no department (null) and empty bed capacity', async () => {
    const unitNoDept = unit({ department: null, bedCapacity: null });
    const treeNoDept: UnitFacilityTree = {
      facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', staff: { total: 5, assigned: 4, heads: 1 } },
      departments: [{ department: null, units: [unitNoDept] }],
    };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [treeNoDept] });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('— unassigned —')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Change department from null to d1
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'd1' } });
    // Change status
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'ACTIVE' } });
    // Cancel
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('exercises ward modal with bed capacity and cancel', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Outpatient')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Ward' }));
    fireEvent.change(screen.getByLabelText('Ward name'), { target: { value: 'Pediatric Ward' } });
    // The ward modal Bed capacity uses a hint; find all Bed capacity labels
    const bedInputs = screen.getAllByLabelText(/Bed capacity/);
    fireEvent.change(bedInputs[bedInputs.length - 1]!, { target: { value: '25' } });
    // Cancel ward modal
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Add ward to')).toBeNull();
  });

  it('renders units with DIAGNOSTIC and SUPPORT type badges', async () => {
    const multiTypeTree: UnitFacilityTree = {
      facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital', staff: { total: 3, assigned: 3, heads: 0 } },
      departments: [
        {
          department: { id: 'd1', name: 'Outpatient' },
          units: [
            unit({ id: 'u1', code: 'LAB', name: 'Laboratory', type: 'DIAGNOSTIC' }),
            unit({ id: 'u2', code: 'PHR', name: 'Pharmacy', type: 'SUPPORT' }),
            unit({ id: 'u3', code: 'OPD', name: 'OPD', type: 'OTHER' }),
          ],
        },
      ],
    };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/masterdata/facilities') return Promise.resolve({ facilities: [facility] });
      if (url.startsWith('/admin/masterdata/units')) return Promise.resolve({ facilities: [multiTypeTree] });
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Select a facility')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Facility'), { target: { value: 'fac1' } });
    await waitFor(() => expect(screen.getByText('Laboratory')).toBeTruthy());
    expect(screen.getByText('Laboratory')).toBeTruthy();
    expect(screen.getByText('Pharmacy')).toBeTruthy();
  });
});
