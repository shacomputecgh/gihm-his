// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ContactTracing from './ContactTracing';
import { Toaster } from './ui';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));

const network = {
  nodes: [
    { id: 'n1', patientId: 'p1', patientName: 'Kwame Asante', mrn: 'MRN-001', phone: '+233240000001', caseId: 'c1', disease: 'Cholera', status: 'CONFIRMED', exposureDate: '2026-08-15T00:00:00.000Z', exposureType: 'DIRECT', notes: 'Close contact', facility: { id: 'f1', name: 'Korle Bu' } },
    { id: 'n2', patientId: 'p2', patientName: 'Ama Mensah', mrn: 'MRN-002', phone: '+233240000002', caseId: 'c1', disease: 'Cholera', status: 'CONTACT', exposureDate: '2026-08-16T00:00:00.000Z', exposureType: 'HOUSEHOLD', notes: null, facility: null },
    { id: 'n3', patientId: 'p3', patientName: 'Kofi Obeng', mrn: 'MRN-003', phone: null, caseId: 'c1', disease: 'Cholera', status: 'RECOVERED', exposureDate: '2026-08-14T00:00:00.000Z', exposureType: 'COMMUNITY', notes: 'Market contact', facility: null },
  ],
  edges: [
    { id: 'e1', sourceId: 'n1', targetId: 'n2', relationship: 'HOUSEHOLD', exposureDate: '2026-08-15T00:00:00.000Z', durationMinutes: 120, notes: null },
    { id: 'e2', sourceId: 'n1', targetId: 'n3', relationship: 'COMMUNITY', exposureDate: '2026-08-14T00:00:00.000Z', durationMinutes: 15, notes: 'Market stall' },
  ],
  summary: { totalContacts: 3, confirmedCases: 1, pendingContacts: 1, recovered: 1, deceased: 0 },
};

const alerts = {
  items: [
    { id: 'a1', caseId: 'c1', disease: 'Cholera', patientName: 'Ama Mensah', contactPhone: '+233240000002', contactName: 'Ama Mensah', alertType: 'SMS', message: 'You have been exposed', status: 'DELIVERED', sentAt: '2026-08-16T10:00:00.000Z', deliveredAt: '2026-08-16T10:01:00.000Z', error: null, createdAt: '2026-08-16T10:00:00.000Z' },
  ],
  total: 1, sent: 1, delivered: 1, failed: 0, pending: 0,
  byDisease: [{ disease: 'Cholera', alerts: 1, delivered: 1 }],
};

const renderTracing = (props: { caseId?: string; disease?: string } = {}) =>
  render(
    <Toaster>
      <ContactTracing {...props} />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) => {
    if (url.startsWith('/surveillance/contact-tracing')) return Promise.resolve(network);
    if (url.startsWith('/surveillance/exposure-alerts/summary')) return Promise.resolve(alerts);
    if (url.startsWith('/surveillance/exposure-alerts')) return Promise.resolve({ items: alerts.items });
    return Promise.resolve(undefined);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ContactTracing', () => {
  it('shows a spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderTracing();
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders the contact network with nodes and edges', async () => {
    renderTracing({ caseId: 'c1' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Kofi Obeng')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy(); // Total contacts
    expect(screen.getAllByText('Household').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Community').length).toBeGreaterThanOrEqual(1);
  });

  it('renders summary cards', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Total contacts')).toBeTruthy());
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Recovered').length).toBeGreaterThanOrEqual(1);
  });

  it('filters by status', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    const selects = screen.getAllByDisplayValue('All statuses');
    fireEvent.change(selects[0], { target: { value: 'CONFIRMED' } });
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('status=CONFIRMED'));
    });
  });

  it('filters by exposure type', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    const selects = screen.getAllByDisplayValue('All exposure types');
    fireEvent.change(selects[0], { target: { value: 'DIRECT' } });
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('exposure=DIRECT'));
    });
  });

  it('adds a new contact', async () => {
    renderTracing({ caseId: 'c1' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    const phoneInputs = screen.getAllByPlaceholderText('+233 24 000 0000');
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'New Contact' } });
    fireEvent.change(phoneInputs[0], { target: { value: '+233240000099' } });
    fireEvent.change(screen.getByPlaceholderText('Patient MRN'), { target: { value: 'MRN-099' } });
    fireEvent.change(screen.getByPlaceholderText('Circumstances of exposure'), { target: { value: 'Test note' } });
    fireEvent.click(screen.getByRole('button', { name: /Add contact/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/surveillance/contact-tracing',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('sends an SMS alert', async () => {
    renderTracing({ caseId: 'c1' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    const phoneInputs = screen.getAllByPlaceholderText('+233 24 000 0000');
    fireEvent.change(phoneInputs[1], { target: { value: '+233240000099' } });
    fireEvent.change(screen.getByPlaceholderText('Optional'), { target: { value: 'Test Contact' } });
    fireEvent.change(screen.getByPlaceholderText(/You have been identified/), { target: { value: 'Alert message' } });
    fireEvent.click(screen.getByRole('button', { name: /Send SMS alert/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/surveillance/exposure-alerts',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('sends bulk alerts', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST' && url.includes('bulk')) return Promise.resolve({ sent: 5, failed: 0 });
      if (url.startsWith('/surveillance/contact-tracing')) return Promise.resolve(network);
      if (url.startsWith('/surveillance/exposure-alerts/summary')) return Promise.resolve(alerts);
      if (url.startsWith('/surveillance/exposure-alerts')) return Promise.resolve({ items: alerts.items });
      return Promise.resolve(undefined);
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderTracing({ disease: 'Cholera' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Send bulk SMS alerts/ }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/surveillance/exposure-alerts/bulk',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ disease: 'Cholera' }) }),
      ),
    );
  });

  it('clicks SMS button on a contact to pre-fill the alert form', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getAllByText('SMS')[0]!);
    await waitFor(() => {
      expect(screen.getByDisplayValue('+233240000001')).toBeTruthy();
    });
  });

  it('shows alert log table', async () => {
    renderTracing({ caseId: 'c1' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('DELIVERED')).toBeTruthy();
  });

  it('shows empty state when no contacts', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/contact-tracing')) return Promise.resolve({ nodes: [], edges: [], summary: { totalContacts: 0, confirmedCases: 0, pendingContacts: 0, recovered: 0, deceased: 0 } });
      if (url.startsWith('/surveillance/exposure-alerts/summary')) return Promise.resolve({ total: 0, sent: 0, delivered: 0, failed: 0, pending: 0, byDisease: [] });
      if (url.startsWith('/surveillance/exposure-alerts')) return Promise.resolve({ items: [] });
      return Promise.resolve(undefined);
    });
    renderTracing();
    await waitFor(() => expect(screen.getByText('No contacts traced')).toBeTruthy());
  });

  it('shows validation error when sending alert without phone or message', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    // Submit the alert form with empty fields
    fireEvent.click(screen.getByRole('button', { name: /Send SMS alert/ }));
    await waitFor(() => {
      expect(screen.getByText('Phone number and message are required')).toBeTruthy();
    });
    // Should not have called api
    expect(mocks.api).not.toHaveBeenCalledWith('/surveillance/exposure-alerts', expect.anything());
  });

  it('handles add contact API error', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST' && url === '/surveillance/contact-tracing') return Promise.reject(new Error('Network error'));
      if (url.startsWith('/surveillance/contact-tracing')) return Promise.resolve(network);
      if (url.startsWith('/surveillance/exposure-alerts/summary')) return Promise.resolve(alerts);
      if (url.startsWith('/surveillance/exposure-alerts')) return Promise.resolve({ items: alerts.items });
      return Promise.resolve(undefined);
    });
    renderTracing({ caseId: 'c1' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Error Contact' } });
    fireEvent.click(screen.getByRole('button', { name: /Add contact/ }));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('handles send alert API error', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST' && url === '/surveillance/exposure-alerts') return Promise.reject(new Error('Send failed'));
      if (url.startsWith('/surveillance/contact-tracing')) return Promise.resolve(network);
      if (url.startsWith('/surveillance/exposure-alerts/summary')) return Promise.resolve(alerts);
      if (url.startsWith('/surveillance/exposure-alerts')) return Promise.resolve({ items: alerts.items });
      return Promise.resolve(undefined);
    });
    renderTracing({ caseId: 'c1' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    const phoneInputs = screen.getAllByPlaceholderText('+233 24 000 0000');
    fireEvent.change(phoneInputs[1], { target: { value: '+233240000099' } });
    fireEvent.change(screen.getByPlaceholderText(/You have been identified/), { target: { value: 'Alert message' } });
    fireEvent.click(screen.getByRole('button', { name: /Send SMS alert/ }));
    await waitFor(() => {
      expect(screen.getByText('Send failed')).toBeTruthy();
    });
  });

  it('cancels bulk alerts when confirm is rejected', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderTracing({ disease: 'Cholera' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Send bulk SMS alerts/ }));
    // Should not have made a POST to bulk
    await waitFor(() => {
      const postCalls = mocks.api.mock.calls.filter((c: [string, { method?: string }]) => c[1]?.method === 'POST' && c[0].includes('bulk'));
      expect(postCalls).toHaveLength(0);
    });
  });

  it('handles bulk alert API error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST' && url.includes('bulk')) return Promise.reject(new Error('Bulk failed'));
      if (url.startsWith('/surveillance/contact-tracing')) return Promise.resolve(network);
      if (url.startsWith('/surveillance/exposure-alerts/summary')) return Promise.resolve(alerts);
      if (url.startsWith('/surveillance/exposure-alerts')) return Promise.resolve({ items: alerts.items });
      return Promise.resolve(undefined);
    });
    renderTracing({ disease: 'Cholera' });
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Send bulk SMS alerts/ }));
    await waitFor(() => {
      expect(screen.getByText('Bulk failed')).toBeTruthy();
    });
  });

  it('renders exposure links with duration', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    expect(screen.getByText('Exposure links')).toBeTruthy();
    // Duration text is rendered as '· 120min' inside a span
    const exposureSection = screen.getByText('Exposure links').closest('div')!;
    expect(exposureSection.textContent).toContain('120min');
    expect(exposureSection.textContent).toContain('15min');
  });

  it('does not render SMS button for contact without phone', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    // Kofi Obeng has phone: null — only 2 SMS buttons should exist (Kwame + Ama)
    const smsButtons = screen.getAllByText('SMS');
    expect(smsButtons.length).toBe(2);
  });

  it('does not show bulk alerts card when no disease prop', async () => {
    renderTracing();
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeTruthy());
    expect(screen.queryByText('Send bulk SMS alerts')).toBeNull();
  });
});
