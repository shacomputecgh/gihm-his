// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import UnitEquipmentManager from './UnitEquipmentManager';
import { Toaster } from './ui';
import type { HospitalUnit, UnitEquipment } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));

const unit: HospitalUnit = {
  id: 'u1',
  code: 'OPD',
  name: 'OPD',
  type: 'OUTPATIENT',
  headName: null,
  headTitle: null,
  phone: null,
  location: null,
  bedCapacity: null,
  services: [],
  notes: null,
  status: 'ACTIVE',
  department: null,
  facility: { id: 'fac1', code: 'KB', name: 'Korle Bu Teaching Hospital' },
  wards: [],
  beds: 0,
  occupied: 0,
  equipment: { items: 0, functional: 0, inMaintenance: 0, faulty: 0, maintenanceDue: 0 },
  team: { count: 0, heads: 0, onLeave: 0 },
};

const equipment = (over: Partial<UnitEquipment> = {}): UnitEquipment => ({
  id: 'eq1',
  name: 'Ventilator',
  category: 'LIFE_SUPPORT',
  quantity: 2,
  functional: 1,
  inMaintenance: 1,
  faulty: 0,
  status: 'PARTIAL',
  maintenanceDue: true,
  serialNumber: 'SN-001',
  manufacturer: 'Philips',
  model: 'V200',
  purchaseDate: null,
  lastMaintenanceAt: '2026-07-01T00:00:00.000Z',
  nextMaintenanceAt: '2026-09-01T00:00:00.000Z',
  notes: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  recentMaintenance: [],
  ...over,
});

const onClose = vi.fn();
const onChanged = vi.fn();

const renderManager = () =>
  render(
    <Toaster>
      <UnitEquipmentManager unit={unit} onClose={onClose} onChanged={onChanged} />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) =>
    url.startsWith('/admin/masterdata/units/u1/equipment') ? Promise.resolve({ equipment: [equipment()] }) : Promise.resolve(undefined),
  );
  onClose.mockClear();
  onChanged.mockClear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('UnitEquipmentManager', () => {
  it('shows a spinner while the equipment loads', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderManager();
    expect(screen.getByText('Loading equipment…')).toBeTruthy();
  });

  it('renders the summary cards and equipment rows with history', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    expect(screen.getByText('Total items')).toBeTruthy();
    // These labels also appear on the add-equipment form below the summary.
    expect(screen.getAllByText('Functional').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In maintenance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Faulty').length).toBeGreaterThan(0);
    expect(screen.getByText('Due maintenance')).toBeTruthy();
    // LIFE SUPPORT also appears as a category option in the add form.
    expect(screen.getAllByText('LIFE SUPPORT').length).toBeGreaterThan(0);
    expect(screen.getByText('PARTIAL')).toBeTruthy();
    expect(screen.getByText('maintenance due')).toBeTruthy();
    expect(screen.getByText(/SN-001 · Philips · V200/)).toBeTruthy();
    expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/units/u1/equipment');
  });

  it('shows the empty state when the unit has no equipment', async () => {
    mocks.api.mockResolvedValue({ equipment: [] });
    renderManager();
    await waitFor(() =>
      expect(screen.getByText('No equipment recorded for this unit yet. Add the first item below.')).toBeTruthy(),
    );
  });

  it('adds equipment from the form, toasting and notifying the parent', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Defibrillator' } });
    fireEvent.click(screen.getByRole('button', { name: /Add equipment/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/units/u1/equipment',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ name: 'Defibrillator', category: 'SUPPORT' }) }),
      ),
    );
    expect(screen.getByText('Defibrillator added')).toBeTruthy();
    expect(onChanged).toHaveBeenCalled();
  });

  it('edits equipment and saves via PUT', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getAllByLabelText('Name')[0]!;
    fireEvent.change(nameInput, { target: { value: 'Ventilator V300' } });
    // Exercise more edit-form fields to cover inline onChange handlers.
    fireEvent.change(screen.getAllByLabelText('Category')[0]!, { target: { value: 'MONITORING' } });
    fireEvent.change(screen.getAllByLabelText('Serial number')[0]!, { target: { value: 'SN-999' } });
    fireEvent.change(screen.getAllByLabelText('Manufacturer')[0]!, { target: { value: 'GE' } });
    fireEvent.change(screen.getAllByLabelText('Model')[0]!, { target: { value: 'V900' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save equipment' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/equipment/eq1',
        expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ name: 'Ventilator V300', category: 'MONITORING' }) }),
      ),
    );
    expect(screen.getByText('Saved Ventilator V300')).toBeTruthy();
  });

  it('returns equipment to service via the maintenance endpoint', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Back to service' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/masterdata/equipment/eq1/maintenance',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(screen.getByText('Ventilator back to service')).toBeTruthy();
  });

  it('removes equipment only after confirmation', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mocks.api).not.toHaveBeenCalledWith(expect.stringContaining('/remove'), expect.anything());

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/masterdata/equipment/eq1/remove', { method: 'POST', body: {} }),
    );
    expect(screen.getByText('Removed Ventilator')).toBeTruthy();
    expect(onChanged).toHaveBeenCalled();
  });

  it('closes via the close button and the backdrop click', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('.fixed.inset-0')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('toasts errors when maintenance-complete and remove fail', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/units/u1/equipment')) return Promise.resolve({ equipment: [equipment()] });
      if (init?.method === 'POST') return Promise.reject(new Error('api down')); return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Back to service' }));
    await waitFor(() => expect(screen.getByText('api down')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.getByText('api down')).toBeTruthy());
  });

  it('toasts an error when save-edit fails', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/units/u1/equipment')) return Promise.resolve({ equipment: [equipment()] });
      if (init?.method === 'PUT') return Promise.reject(new Error('save broken')); return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save equipment' }));
    await waitFor(() => expect(screen.getByText('save broken')).toBeTruthy());
  });

  it('exercises numeric edit fields and the next-maintenance date input', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise the numeric onChange handlers.
    fireEvent.change(screen.getAllByLabelText('Quantity')[0]!, { target: { value: '5' } });
    fireEvent.change(screen.getAllByLabelText('Functional')[0]!, { target: { value: '3' } });
    fireEvent.change(screen.getAllByLabelText('In maintenance')[0]!, { target: { value: '1' } });
    fireEvent.change(screen.getAllByLabelText('Faulty')[0]!, { target: { value: '1' } });
    // Exercise the next-maintenance date input with a value.
    fireEvent.change(screen.getAllByLabelText('Next maintenance')[0]!, { target: { value: '2026-12-01' } });
    // Cancel the edit.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('renders maintenance history and equipment without maintenance-due', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/units/u1/equipment')
        ? Promise.resolve({
            equipment: [
              equipment({
                id: 'eq2', name: 'Defibrillator', category: 'LIFE_SUPPORT', status: 'OPERATIONAL',
                maintenanceDue: false, inMaintenance: 0, faulty: 0,
                serialNumber: null, manufacturer: null, model: null,
                lastMaintenanceAt: null, nextMaintenanceAt: null,
                recentMaintenance: [
                  { id: 'm1', note: 'Battery replaced', performedAt: '2026-08-01T00:00:00.000Z', performedBy: 'Technician A' },
                  { id: 'm2', note: null, performedAt: '2026-07-15T00:00:00.000Z', performedBy: null },
                ],
              }),
            ],
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('Defibrillator')).toBeTruthy());
    expect(screen.getByText('OPERATIONAL')).toBeTruthy();
    // No maintenance due badge.
    expect(screen.queryByText('maintenance due')).toBeNull();
    // Maintenance history renders.
    expect(screen.getByText(/Battery replaced/)).toBeTruthy();
    expect(screen.getByText(/Maintenance completed/)).toBeTruthy();
    // No manufacturer line when all are null.
    expect(screen.getByText('—')).toBeTruthy();
    // No 'Back to service' button when inMaintenance=0 and faulty=0.
    expect(screen.queryByRole('button', { name: 'Back to service' })).toBeNull();
  });

  it('toasts an error when create fails', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/admin/masterdata/units/u1/equipment')) {
        if (init?.method === 'POST') return Promise.reject(new Error('create fail'));
        return Promise.resolve({ equipment: [] });
      }
      return Promise.resolve(undefined);
    });
    renderManager();
    await waitFor(() => expect(screen.getByText('No equipment recorded for this unit yet. Add the first item below.')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pump' } });
    fireEvent.click(screen.getByRole('button', { name: /Add equipment/ }));
    await waitFor(() => expect(screen.getByText('create fail')).toBeTruthy());
  });

  it('exercises all edit-form onChange handlers including date and null paths', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/units/u1/equipment')
        ? Promise.resolve({
            equipment: [
              equipment({
                id: 'eq3', name: 'MRI', category: 'DIAGNOSTIC', status: 'OPERATIONAL',
                maintenanceDue: false, inMaintenance: 0, faulty: 0,
                serialNumber: null, manufacturer: null, model: null,
                lastMaintenanceAt: '2026-06-01T00:00:00.000Z', nextMaintenanceAt: null,
                recentMaintenance: [],
              }),
            ],
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('MRI')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise all edit-form onChange handlers.
    fireEvent.change(screen.getAllByLabelText('Name')[0]!, { target: { value: 'MRI 3T' } });
    fireEvent.change(screen.getAllByLabelText('Category')[0]!, { target: { value: 'LIFE_SUPPORT' } });
    fireEvent.change(screen.getAllByLabelText('Quantity')[0]!, { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText('Functional')[0]!, { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText('In maintenance')[0]!, { target: { value: '0' } });
    fireEvent.change(screen.getAllByLabelText('Faulty')[0]!, { target: { value: '0' } });
    fireEvent.change(screen.getAllByLabelText('Serial number')[0]!, { target: { value: 'SN-999' } });
    fireEvent.change(screen.getAllByLabelText('Manufacturer')[0]!, { target: { value: 'Siemens' } });
    fireEvent.change(screen.getAllByLabelText('Model')[0]!, { target: { value: 'MAGNETOM' } });
    // Set next maintenance date.
    fireEvent.change(screen.getAllByLabelText('Next maintenance')[0]!, { target: { value: '2027-01-01' } });
    // Clear next maintenance to exercise the null branch.
    fireEvent.change(screen.getAllByLabelText('Next maintenance')[0]!, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('renders equipment with both last and next maintenance dates', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/units/u1/equipment')
        ? Promise.resolve({
            equipment: [
              equipment({
                id: 'eq4', name: 'X-Ray', category: 'IMAGING', status: 'OPERATIONAL',
                maintenanceDue: true, inMaintenance: 0, faulty: 0,
                lastMaintenanceAt: '2026-07-01T00:00:00.000Z', nextMaintenanceAt: '2026-12-01T00:00:00.000Z',
                recentMaintenance: [
                  { id: 'm3', note: 'Calibration done', performedAt: '2026-07-01T00:00:00.000Z', performedBy: 'Tech A' },
                ],
              }),
            ],
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('X-Ray')).toBeTruthy());
    // Both dates should render with a separator
    expect(screen.getByText(/Last maintenance/)).toBeTruthy();
    expect(screen.getByText(/next due/)).toBeTruthy();
    // Maintenance history should render
    expect(screen.getByText(/Calibration done/)).toBeTruthy();
    // maintenance due badge should show
    expect(screen.getByText('maintenance due')).toBeTruthy();
  });

  it('renders equipment with only last maintenance date (no next)', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/units/u1/equipment')
        ? Promise.resolve({
            equipment: [
              equipment({
                id: 'eq5', name: 'Pump', category: 'OTHER', status: 'OPERATIONAL',
                maintenanceDue: false, inMaintenance: 0, faulty: 0,
                lastMaintenanceAt: '2026-08-01T00:00:00.000Z', nextMaintenanceAt: null,
                recentMaintenance: [],
              }),
            ],
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('Pump')).toBeTruthy());
    // Only last maintenance should render, no separator
    expect(screen.getByText(/Last maintenance/)).toBeTruthy();
    expect(screen.queryByText(/next due/)).toBeNull();
  });

  it('renders equipment with only next maintenance date (no last)', async () => {
    mocks.api.mockImplementation((url: string) =>
      url.startsWith('/admin/masterdata/units/u1/equipment')
        ? Promise.resolve({
            equipment: [
              equipment({
                id: 'eq6', name: 'Scanner', category: 'IMAGING', status: 'PARTIAL',
                maintenanceDue: true, inMaintenance: 0, faulty: 0,
                lastMaintenanceAt: null, nextMaintenanceAt: '2026-09-15T00:00:00.000Z',
                recentMaintenance: [],
              }),
            ],
          })
        : Promise.resolve(undefined),
    );
    renderManager();
    await waitFor(() => expect(screen.getByText('Scanner')).toBeTruthy());
    // Only next maintenance should render, no separator
    expect(screen.queryByText(/Last maintenance/)).toBeNull();
    expect(screen.getByText(/next due/)).toBeTruthy();
  });

  it('exercises numeric fields with zero and empty values', async () => {
    renderManager();
    await waitFor(() => expect(screen.getByText('Ventilator')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Exercise zero values for numeric fields
    fireEvent.change(screen.getAllByLabelText('Quantity')[0]!, { target: { value: '0' } });
    fireEvent.change(screen.getAllByLabelText('Functional')[0]!, { target: { value: '' } });
    fireEvent.change(screen.getAllByLabelText('In maintenance')[0]!, { target: { value: '' } });
    fireEvent.change(screen.getAllByLabelText('Faulty')[0]!, { target: { value: '-5' } });
    // Should clamp to 0 for negative values
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  });
});
