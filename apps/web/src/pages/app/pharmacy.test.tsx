// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Pharmacy from './Pharmacy';
import { Toaster } from '../../components/ui';
import type { PrescriptionWorklistRow } from '../../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('../../lib/auth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a> }));

const rx = (over: Partial<PrescriptionWorklistRow> = {}): PrescriptionWorklistRow => ({
  id: 'rx1',
  patient: { id: 'p1', fullName: 'Ama Darko', mrn: 'MRN-001', dateOfBirth: '1995-06-15', gender: 'FEMALE', phone: null, nhis: null, ghanaCard: null, invoices: [] },
  medicine: 'Amoxicillin',
  dosage: '500mg',
  frequency: 'TDS',
  duration: '7 days',
  route: 'Oral',
  quantity: 21,
  dispensedQty: 0,
  status: 'ACTIVE',
  createdAt: '2026-08-20T00:00:00.000Z',
  ...over,
});

const renderPharmacy = () => render(<Toaster><Pharmacy /></Toaster>);

describe('Pharmacy', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.api.mockResolvedValue({ items: [rx()] });
  });
  afterEach(() => cleanup());

  it('renders the page header', () => {
    renderPharmacy();
    expect(screen.getByText('Pharmacy')).toBeTruthy();
    expect(screen.getByText(/Prescription worklist/)).toBeTruthy();
  });

  it('shows spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderPharmacy();
    expect(screen.getByText(/Loading/)).toBeTruthy();
  });

  it('shows empty state when no prescriptions', async () => {
    mocks.api.mockResolvedValue({ items: [] });
    renderPharmacy();
    await waitFor(() => {
      expect(screen.getByText('Nothing to dispense')).toBeTruthy();
    });
  });

  it('renders prescription rows', async () => {
    renderPharmacy();
    await waitFor(() => {
      expect(screen.getByText('Amoxicillin')).toBeTruthy();
    });
    expect(screen.getByText('Ama Darko')).toBeTruthy();
    expect(screen.getAllByText(/MRN-001/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0 / 21')).toBeTruthy();
  });

  it('shows segmented filter', async () => {
    renderPharmacy();
    await waitFor(() => {
      expect(screen.getByText('To dispense')).toBeTruthy();
    });
    expect(screen.getByText('All prescriptions')).toBeTruthy();
  });

  it('switches filter to ALL', async () => {
    renderPharmacy();
    await waitFor(() => expect(screen.getByText('Amoxicillin')).toBeTruthy());
    fireEvent.click(screen.getByText('All prescriptions'));
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('status=ALL'));
    });
  });

  it('dispenses a prescription', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.resolve(undefined);
      return Promise.resolve({ items: [rx()] });
    });
    renderPharmacy();
    await waitFor(() => expect(screen.getByText('Amoxicillin')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Dispense' }));
    await waitFor(() => {
      expect(screen.getByText('Dispensed Amoxicillin')).toBeTruthy();
    });
  });

  it('shows error on dispense failure', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.reject(new Error('Stock depleted'));
      return Promise.resolve({ items: [rx()] });
    });
    renderPharmacy();
    await waitFor(() => expect(screen.getByText('Amoxicillin')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Dispense' }));
    await waitFor(() => {
      expect(screen.getByText('Stock depleted')).toBeTruthy();
    });
  });

  it('shows partial and dispensed statuses with Done badge', async () => {
    const partialRx = rx({ id: 'rx2', status: 'PARTIAL', dispensedQty: 10 });
    const dispensedRx = rx({ id: 'rx3', status: 'DISPENSED', dispensedQty: 21 });
    mocks.api.mockResolvedValue({ items: [partialRx, dispensedRx] });
    renderPharmacy();
    await waitFor(() => {
      expect(screen.getByText('PARTIAL')).toBeTruthy();
    });
    expect(screen.getByText('DISPENSED')).toBeTruthy();
    expect(screen.getAllByText('Done').length).toBeGreaterThanOrEqual(1);
  });

  it('shows cancelled status', async () => {
    const cancelledRx = rx({ id: 'rx4', status: 'CANCELLED' });
    mocks.api.mockResolvedValue({ items: [cancelledRx] });
    renderPharmacy();
    await waitFor(() => {
      expect(screen.getByText('CANCELLED')).toBeTruthy();
    });
  });

  it('shows active count when filter is ACTIVE', async () => {
    const active1 = rx({ id: 'rx1', status: 'ACTIVE' });
    const active2 = rx({ id: 'rx2', status: 'PARTIAL' });
    mocks.api.mockResolvedValue({ items: [active1, active2] });
    renderPharmacy();
    await waitFor(() => {
      expect(screen.getByText(/2 prescription.*awaiting/)).toBeTruthy();
    });
  });
});
