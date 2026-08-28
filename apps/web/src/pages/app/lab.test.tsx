// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Lab from './Lab';
import { Toaster } from '../../components/ui';
import type { AuthUser, LabOrderWorklistRow } from '../../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('../../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a> }));

const user: AuthUser = {
  id: 'u1', email: 'lab@facility.gh', fullName: 'Lab Tech', roleCode: 'LAB_TECHNICIAN',
  roleName: 'Lab Technician', scope: 'FACILITY', permissions: ['verify_lab'],
  organizationId: null, facilityId: 'f1', regionId: 'r1', districtId: 'd1',
  regionName: null, districtName: null, facilityName: 'Korle Bu',
};

const labRow = (over: Partial<LabOrderWorklistRow> = {}): LabOrderWorklistRow => ({
  id: 'lab1',
  test: 'Full Blood Count',
  discipline: 'haematology',
  patient: { id: 'p1', fullName: 'Kofi Mensah', mrn: 'MRN-001', dateOfBirth: '1988-03-10', gender: 'MALE', phone: null, nhis: null, ghanaCard: null, invoices: [] },
  status: 'ORDERED',
  critical: false,
  result: null,
  referenceRange: null,
  createdAt: '2026-08-20T00:00:00.000Z',
  ...over,
});

const renderLab = () => render(<Toaster><Lab /></Toaster>);

const openRow = async () => {
  await waitFor(() => expect(screen.getByText('Full Blood Count')).toBeTruthy());
  // Click the card button that wraps the row
  fireEvent.click(screen.getByText('Full Blood Count').closest('button')!);
};

describe('Lab', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user });
    mocks.api.mockResolvedValue({ items: [labRow()] });
  });
  afterEach(() => cleanup());

  it('renders the page header', () => {
    renderLab();
    expect(screen.getByText('Laboratory')).toBeTruthy();
    expect(screen.getByText(/Test worklist/)).toBeTruthy();
  });

  it('shows spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderLab();
    expect(screen.getByText(/Loading/)).toBeTruthy();
  });

  it('shows empty state when no orders', async () => {
    mocks.api.mockResolvedValue({ items: [] });
    renderLab();
    await waitFor(() => {
      expect(screen.getByText('No pending tests')).toBeTruthy();
    });
  });

  it('renders lab order rows', async () => {
    renderLab();
    await waitFor(() => {
      expect(screen.getByText('Full Blood Count')).toBeTruthy();
    });
    expect(screen.getByText('Kofi Mensah')).toBeTruthy();
    expect(screen.getAllByText(/MRN-001/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ORDERED')).toBeTruthy();
  });

  it('shows segmented filter', async () => {
    renderLab();
    await waitFor(() => expect(screen.getByText('Full Blood Count')).toBeTruthy());
    expect(screen.getByText('Pending results')).toBeTruthy();
    expect(screen.getByText('All orders')).toBeTruthy();
  });

  it('switches filter to ALL', async () => {
    renderLab();
    await waitFor(() => expect(screen.getByText('Full Blood Count')).toBeTruthy());
    fireEvent.click(screen.getByText('All orders'));
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('status=ALL'));
    });
  });

  it('opens a row and shows result form', async () => {
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify/ })).toBeTruthy();
    });
    expect(screen.getByPlaceholderText(/Hb 12.4/)).toBeTruthy();
    expect(screen.getByText('Critical result')).toBeTruthy();
  });

  it('enters a result and verifies', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.resolve(undefined);
      return Promise.resolve({ items: [labRow()] });
    });
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify/ })).toBeTruthy();
    });
    fireEvent.change(screen.getByPlaceholderText(/Hb 12.4/), { target: { value: 'Hb 14.2 g/dL' } });
    fireEvent.change(screen.getByPlaceholderText(/11.5/), { target: { value: '11.5-15.5 g/dL' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify/ }));
    await waitFor(() => {
      expect(screen.getByText('Result verified')).toBeTruthy();
    });
  });

  it('flags a critical result', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.resolve(undefined);
      return Promise.resolve({ items: [labRow()] });
    });
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify/ })).toBeTruthy();
    });
    fireEvent.change(screen.getByPlaceholderText(/Hb 12.4/), { target: { value: 'Hb 6.2 g/dL - CRITICAL LOW' } });
    fireEvent.click(screen.getByLabelText('Critical result'));
    fireEvent.click(screen.getByRole('button', { name: /Verify/ }));
    await waitFor(() => {
      expect(screen.getByText(/Critical result flagged/)).toBeTruthy();
    });
  });

  it('shows error on verify failure', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.reject(new Error('Save failed'));
      return Promise.resolve({ items: [labRow()] });
    });
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify/ })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify/ }));
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeTruthy();
    });
  });

  it('cancels the result entry form', async () => {
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify/ })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText(/Hb 12.4/)).toBeNull();
  });

  it('shows verified result for already-verified orders', async () => {
    const verifiedRow = labRow({ status: 'VERIFIED', result: 'Hb 14.2 g/dL', referenceRange: '11.5-15.5 g/dL' });
    mocks.api.mockResolvedValue({ items: [verifiedRow] });
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByText(/Verified result/)).toBeTruthy();
    });
    expect(screen.getByText('Hb 14.2 g/dL')).toBeTruthy();
    expect(screen.getByText(/11\.5/)).toBeTruthy();
    expect(screen.getByText('Re-enter result')).toBeTruthy();
  });

  it('shows Re-enter result button for verified orders', async () => {
    const verifiedRow = labRow({ status: 'VERIFIED', result: 'Hb 14.2 g/dL' });
    mocks.api.mockResolvedValue({ items: [verifiedRow] });
    renderLab();
    await openRow();
    await waitFor(() => expect(screen.getByText(/Verified result/)).toBeTruthy());
    expect(screen.getByText('Re-enter result')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Re-enter result' }));
    // The verified view stays visible
    expect(screen.getByText(/Verified result/)).toBeTruthy();
  });

  it('shows critical badge on critical orders', async () => {
    const critRow = labRow({ critical: true });
    mocks.api.mockResolvedValue({ items: [critRow] });
    renderLab();
    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeTruthy();
    });
  });

  it('shows permission message for users without verify_lab', async () => {
    mocks.useAuth.mockReturnValue({
      user: { ...user, permissions: [] },
    });
    renderLab();
    await openRow();
    await waitFor(() => {
      expect(screen.getByText(/verify_lab/)).toBeTruthy();
    });
  });
});
