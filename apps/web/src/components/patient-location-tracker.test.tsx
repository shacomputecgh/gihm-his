// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PatientLocationTracker from './PatientLocationTracker';
import { Toaster } from './ui';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));

const locations = {
  items: [
    { id: 'loc1', patientId: 'P-1001', patientName: 'John Doe', mrn: 'MRN-001', ward: 'Ward A', bed: 'B-12', department: 'Emergency', unit: null, status: 'ADMITTED', isolationRequired: false, phone: '+233501234567', admittedAt: '2026-08-20T00:00:00.000Z', dischargedAt: null },
    { id: 'loc2', patientId: 'P-1002', patientName: 'Jane Doe', mrn: 'MRN-002', ward: 'Isolation Unit', bed: null, department: 'ICU', unit: null, status: 'ISOLATED', isolationRequired: true, phone: null, admittedAt: '2026-08-19T00:00:00.000Z', dischargedAt: null },
  ],
};

const summary = {
  currentInHospital: 2,
  isolated: 1,
  transferred: 0,
  discharged: 0,
  byWard: [
    { ward: 'Ward A', count: 1, isolated: 0 },
    { ward: 'Isolation Unit', count: 1, isolated: 1 },
  ],
  recentMoves: [
    { patientName: 'John Doe', from: 'Ward A', to: 'Ward B', at: '2026-08-21T00:00:00.000Z' },
  ],
};

const renderTracker = () => render(<Toaster><PatientLocationTracker /></Toaster>);

describe('PatientLocationTracker', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.api.mockImplementation((url: string) => {
      if (url.includes('/surveillance/locations/summary')) return Promise.resolve(summary);
      if (url.includes('/surveillance/locations')) return Promise.resolve(locations);
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders summary cards with counts', async () => {
    renderTracker();
    await waitFor(() => {
      expect(screen.getByText('Currently in hospital')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('renders patient names from location list', async () => {
    renderTracker();
    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows isolation badge', async () => {
    renderTracker();
    await waitFor(() => {
      expect(screen.getAllByText(/ISOLATION|ISOLATED/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty state when no patients tracked', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.includes('/surveillance/locations/summary')) return Promise.resolve({ ...summary, currentInHospital: 0, isolated: 0, byWard: [], recentMoves: [] });
      if (url.includes('/surveillance/locations')) return Promise.resolve({ items: [] });
      return Promise.resolve({});
    });
    renderTracker();
    await waitFor(() => {
      expect(screen.getByText('No patients tracked')).toBeTruthy();
    });
  });

  it('exercises transfer form onChange handlers', async () => {
    renderTracker();
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1));

    // Fire onChange on each unique placeholder - use getAll + [0]
    fireEvent.change(screen.getAllByPlaceholderText('Patient ID')[0], { target: { value: 'P-1001' } });
    fireEvent.change(screen.getAllByPlaceholderText('Current ward')[0], { target: { value: 'Ward A' } });
    fireEvent.change(screen.getAllByPlaceholderText('Destination ward')[0], { target: { value: 'Ward C' } });
    fireEvent.change(screen.getAllByPlaceholderText('Bed number')[0], { target: { value: 'B-5' } });
    fireEvent.change(screen.getAllByPlaceholderText('Transfer reason')[0], { target: { value: 'Specialist care' } });

    // Exercise the checkbox
    const checkboxes = screen.getAllByLabelText('Mark as isolation transfer');
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
  });

  it('exercises filter onChange handlers', async () => {
    renderTracker();
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1));

    const filterInputs = screen.getAllByPlaceholderText(/Filter by ward/);
    fireEvent.change(filterInputs[0], { target: { value: 'Ward A' } });

    const allStatusSelects = screen.queryAllByDisplayValue('All statuses');
    if (allStatusSelects.length > 0) fireEvent.change(allStatusSelects[0], { target: { value: 'ADMITTED' } });

    const allIsoSelects = screen.queryAllByDisplayValue('All');
    if (allIsoSelects.length > 0) fireEvent.change(allIsoSelects[0], { target: { value: 'true' } });
  });

  it('submits transfer form', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.resolve({ ok: true });
      if (url.includes('/surveillance/locations/summary')) return Promise.resolve(summary);
      if (url.includes('/surveillance/locations')) return Promise.resolve(locations);
      return Promise.resolve({});
    });

    renderTracker();
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1));

    fireEvent.change(screen.getAllByPlaceholderText('Patient ID')[0], { target: { value: 'P-1001' } });
    fireEvent.change(screen.getAllByPlaceholderText('Current ward')[0], { target: { value: 'Ward A' } });
    fireEvent.change(screen.getAllByPlaceholderText('Destination ward')[0], { target: { value: 'Ward C' } });

    fireEvent.click(screen.getAllByRole('button', { name: /Transfer patient/ })[0]);

    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(
        '/surveillance/locations/transfer',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('clicks Transfer button on isolated patient to pre-fill form', async () => {
    renderTracker();
    await waitFor(() => expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(1));

    const transferButtons = screen.getAllByText('Transfer');
    fireEvent.click(transferButtons[0]);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('Patient ID');
      const filledInput = inputs.find((i) => (i as HTMLInputElement).value === 'P-1002');
      expect(filledInput).toBeTruthy();
    });
  });

  it('handles transfer API error', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.reject(new Error('Transfer failed'));
      if (url.includes('/surveillance/locations/summary')) return Promise.resolve(summary);
      if (url.includes('/surveillance/locations')) return Promise.resolve(locations);
      return Promise.resolve({});
    });

    renderTracker();
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1));

    fireEvent.change(screen.getAllByPlaceholderText('Patient ID')[0], { target: { value: 'P-1001' } });
    fireEvent.change(screen.getAllByPlaceholderText('Current ward')[0], { target: { value: 'Ward A' } });
    fireEvent.change(screen.getAllByPlaceholderText('Destination ward')[0], { target: { value: 'Ward C' } });

    fireEvent.click(screen.getAllByRole('button', { name: /Transfer patient/ })[0]);

    await waitFor(() => {
      expect(screen.getByText('Transfer failed')).toBeTruthy();
    });
  });

  it('handles transfer with non-Error exception', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.reject('string error');
      if (url.includes('/surveillance/locations/summary')) return Promise.resolve(summary);
      if (url.includes('/surveillance/locations')) return Promise.resolve(locations);
      return Promise.resolve({});
    });

    renderTracker();
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1));

    fireEvent.change(screen.getAllByPlaceholderText('Patient ID')[0], { target: { value: 'P-1001' } });
    fireEvent.change(screen.getAllByPlaceholderText('Current ward')[0], { target: { value: 'Ward A' } });
    fireEvent.change(screen.getAllByPlaceholderText('Destination ward')[0], { target: { value: 'Ward C' } });

    fireEvent.click(screen.getAllByRole('button', { name: /Transfer patient/ })[0]);

    await waitFor(() => {
      expect(screen.getByText('Transfer failed')).toBeTruthy();
    });
  });

  it('renders ward breakdown and recent moves', async () => {
    renderTracker();
    await waitFor(() => {
      expect(screen.getByText('By ward')).toBeTruthy();
    });
    expect(screen.getAllByText('Ward A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Recent moves')).toBeTruthy();
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
  });

  it('renders isolation alert card when patients are isolated', async () => {
    renderTracker();
    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
    });
    // The isolation alert shows the count and isolated patient names
    expect(screen.getAllByText(/patient.*in isolation/).length).toBeGreaterThanOrEqual(1);
  });
});
