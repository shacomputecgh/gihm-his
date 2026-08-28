// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Billing from './Billing';
import { Toaster } from '../../components/ui';
import type { AuthUser, Patient, Invoice, PaymentAttempt } from '../../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('../../lib/auth', () => ({ useAuth: mocks.useAuth }));

const user: AuthUser = {
  id: 'u1', email: 'admin@facility.gh', fullName: 'Admin User', roleCode: 'ADMIN',
  roleName: 'Admin', scope: 'FACILITY', permissions: ['process_payment'],
  organizationId: null, facilityId: 'f1', regionId: 'r1', districtId: 'd1',
  regionName: null, districtName: null, facilityName: 'Korle Bu',
};

const patient: Patient = {
  id: 'p1', fullName: 'Kwame Asante', mrn: 'MRN-001', dateOfBirth: '1990-01-01',
  gender: 'MALE', phone: '0241234567', nhis: null, ghanaCard: null,
  invoices: [{ id: 'inv1', amount: 500, paidAmount: 200, status: 'PARTIAL', issuedAt: '2026-08-20T00:00:00.000Z', paymentMethod: null }],
};

const invoice: Invoice = patient.invoices![0]!;

const renderBilling = () =>
  render(<Toaster><Billing /></Toaster>);

describe('Billing', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user });
  });
  afterEach(() => cleanup());

  it('renders the page header', () => {
    renderBilling();
    expect(screen.getByText('Billing')).toBeTruthy();
    expect(screen.getByText(/Find a patient/)).toBeTruthy();
  });

  it('shows search form and empty state initially', () => {
    renderBilling();
    expect(screen.getByPlaceholderText(/Search name/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('searches for patients and shows results', async () => {
    mocks.api.mockResolvedValue({ items: [patient] });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    expect(screen.getByText('MRN-001')).toBeTruthy();
  });

  it('shows empty search results', async () => {
    mocks.api.mockResolvedValue({ items: [] });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'nobody' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalled();
    });
  });

  it('shows error toast on search failure', async () => {
    mocks.api.mockRejectedValue(new Error('Network error'));
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'fail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('picks a patient and loads invoices', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ items: [patient] });
      if (url === '/patients/p1') return Promise.resolve(patient);
      if (url === '/invoices/inv1/payments') return Promise.resolve({ items: [] });
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => {
      expect(screen.getByText(/Invoices — Kwame Asante/)).toBeTruthy();
    });
  });

  it('shows empty invoice state', async () => {
    const noInvoicePatient = { ...patient, invoices: [] };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ items: [patient] });
      if (url === '/patients/p1') return Promise.resolve(noInvoicePatient);
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => {
      expect(screen.getByText('No invoices')).toBeTruthy();
    });
  });

  it('initiates a payment and refreshes', async () => {
    const withPayments: PaymentAttempt = {
      id: 'a1', invoiceId: 'inv1', provider: 'SIMULATED', providerRef: 'REF-1',
      amount: 300, status: 'PENDING', createdAt: '2026-08-20T00:00:00.000Z', error: null,
    };
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/patients/p1')) return Promise.resolve(patient);
      if (url.startsWith('/patients') && !init?.method) return Promise.resolve({ items: [patient] });
      if (url === '/invoices/inv1/payments' && init?.method === 'POST') return Promise.resolve({ attempt: withPayments, instructions: 'Dial *170# to pay', provider: { id: 'SIMULATED', name: 'Simulated' } });
      if (url === '/invoices/inv1/payments') return Promise.resolve({ items: [] });
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => expect(screen.getByText(/Invoices — Kwame Asante/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Collect payment/ }));
    await waitFor(() => {
      expect(screen.getByText('Dial *170# to pay')).toBeTruthy();
    });
  });

  it('shows error on payment initiation failure', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/patients/p1')) return Promise.resolve(patient);
      if (url.startsWith('/patients') && !init?.method) return Promise.resolve({ items: [patient] });
      if (url === '/invoices/inv1/payments' && !init) return Promise.resolve({ items: [] });
      if (url === '/invoices/inv1/payments' && init?.method === 'POST') return Promise.reject(new Error('Payment gateway down'));
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => expect(screen.getByText(/Invoices — Kwame Asante/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Collect payment/ }));
    await waitFor(() => {
      expect(screen.getByText('Payment gateway down')).toBeTruthy();
    });
  });

  it('confirms a pending payment attempt', async () => {
    const pending: PaymentAttempt = {
      id: 'a1', invoiceId: 'inv1', provider: 'SIMULATED', providerRef: 'REF-1',
      amount: 300, status: 'PENDING', createdAt: '2026-08-20T00:00:00.000Z', error: null,
    };
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/patients/p1')) return Promise.resolve(patient);
      if (url.startsWith('/patients') && !init?.method) return Promise.resolve({ items: [patient] });
      if (url === '/invoices/inv1/payments' && !init) return Promise.resolve({ items: [pending] });
      if (url === '/payments/webhook/SIMULATED') return Promise.resolve({ attempt: { ...pending, status: 'SUCCESS' } });
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => expect(screen.getByText(/Invoices — Kwame Asante/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Confirm payment received/ }));
    await waitFor(() => {
      expect(screen.getByText('Payment confirmed — invoice updated')).toBeTruthy();
    });
  });

  it('shows error on confirm failure', async () => {
    const pending: PaymentAttempt = {
      id: 'a1', invoiceId: 'inv1', provider: 'SIMULATED', providerRef: 'REF-1',
      amount: 300, status: 'PENDING', createdAt: '2026-08-20T00:00:00.000Z', error: null,
    };
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url.startsWith('/patients/p1')) return Promise.resolve(patient);
      if (url.startsWith('/patients') && !init?.method) return Promise.resolve({ items: [patient] });
      if (url === '/invoices/inv1/payments' && !init) return Promise.resolve({ items: [pending] });
      if (url === '/payments/webhook/SIMULATED') return Promise.reject(new Error('Confirm failed'));
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => expect(screen.getByText(/Invoices — Kwame Asante/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Confirm payment received/ }));
    await waitFor(() => {
      expect(screen.getByText('Confirm failed')).toBeTruthy();
    });
  });

  it('renders paid and failed attempt statuses', async () => {
    const paidAttempt: PaymentAttempt = {
      id: 'a2', invoiceId: 'inv1', provider: 'SIMULATED', providerRef: 'REF-2',
      amount: 200, status: 'SUCCESS', createdAt: '2026-08-19T00:00:00.000Z', error: null,
    };
    const failedAttempt: PaymentAttempt = {
      id: 'a3', invoiceId: 'inv1', provider: 'SIMULATED', providerRef: 'REF-3',
      amount: 100, status: 'FAILED', createdAt: '2026-08-18T00:00:00.000Z', error: 'Insufficient funds',
    };
    const paidInvoice: Invoice = { id: 'inv2', amount: 1000, paidAmount: 1000, status: 'PAID', issuedAt: '2026-08-10T00:00:00.000Z', paymentMethod: 'MOMO' };
    mocks.api.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ items: [patient] });
      if (url === '/patients/p1') return Promise.resolve({ ...patient, invoices: [paidInvoice] });
      if (url === '/invoices/inv2/payments') return Promise.resolve({ items: [paidAttempt, failedAttempt] });
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => {
      expect(screen.getByText('SUCCESS')).toBeTruthy();
    });
    expect(screen.getByText('FAILED')).toBeTruthy();
    expect(screen.getByText('Insufficient funds')).toBeTruthy();
  });

  it('shows change patient button', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ items: [patient] });
      if (url === '/patients/p1') return Promise.resolve({ ...patient, invoices: [] });
      return Promise.resolve(undefined);
    });
    renderBilling();
    fireEvent.change(screen.getByPlaceholderText(/Search name/), { target: { value: 'Kwame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByText('Kwame Asante'));
    await waitFor(() => expect(screen.getByText('No invoices')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Change patient/ }));
    // After changing patient, the invoices card should be gone
    await waitFor(() => {
      expect(screen.queryByText(/Invoices —/)).toBeNull();
    });
  });

  it('renders the footer disclaimer', () => {
    renderBilling();
    expect(screen.getByText(/Payments go through the provider abstraction/)).toBeTruthy();
    expect(screen.getByText(/SIMULATED provider is test\/demo only/)).toBeTruthy();
  });
});
