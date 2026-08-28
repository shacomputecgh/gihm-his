// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Surveillance from './Surveillance';
import { Toaster } from '../../components/ui';
import type { AuthUser, SurveillanceCase, SurveillanceSummary, CaseFollowUp } from '../../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('../../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../components/ContactTracing', () => ({
  default: ({ disease }: { disease?: string }) => (
    <div data-testid="contact-tracing">{disease ? `Disease: ${disease}` : 'Contact Tracing'}</div>
  ),
}));
vi.mock('../../components/PatientLocationTracker', () => ({
  default: () => <div data-testid="patient-location-tracker">Patient Location Tracker</div>,
}));

const managerUser: AuthUser = {
  id: 'u1', email: 'admin@facility.gh', fullName: 'Admin User', roleCode: 'ADMIN',
  roleName: 'Admin', scope: 'FACILITY', permissions: ['manage_surveillance', 'view_surveillance'],
  organizationId: null, facilityId: 'f1', regionId: null, districtId: null,
  regionName: null, districtName: null, facilityName: 'Test Facility',
};

const cases: SurveillanceCase[] = [
  {
    id: 'c1', patient: { id: 'p1', fullName: 'Kwame Asante', mrn: 'MRN-001' },
    facility: { id: 'f1', code: 'FAC', name: 'Test Facility', district: 'Accra', region: 'Greater Accra' },
    reporter: { id: 'u1', fullName: 'Admin User' },
    disease: 'Cholera', caseType: 'CONFIRMED', severity: 'SEVERE', status: 'OPEN',
    outcome: null, notes: 'Patient presenting with severe diarrhea', reportedAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z', followUpCount: 2,
  },
  {
    id: 'c2', patient: null, facility: null, reporter: null,
    disease: 'Measles', caseType: 'SUSPECTED', severity: 'MILD', status: 'INVESTIGATED',
    outcome: null, notes: null, reportedAt: '2026-08-16T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z', followUpCount: 0,
  },
];

const summary: SurveillanceSummary = {
  totals: { cases: 10, open: 5, closed: 5, confirmed: 3, suspected: 2, deaths: 1, followUps: 8, contactsTraced: 15, followUpRate: 80 },
  byStatus: { OPEN: 5, CLOSED: 5 },
  byCaseType: { CONFIRMED: 3, SUSPECTED: 2 },
  byDisease: [{ disease: 'Cholera', count: 5, confirmed: 3, open: 3 }, { disease: 'Measles', count: 3, confirmed: 0, open: 2 }],
  byFacility: [{ id: 'f1', name: 'Test Facility', count: 8 }],
  byDistrict: { Accra: 8 },
  byRegion: { 'Greater Accra': 8 },
  trend: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, '0')}`, count: i % 5,
  })),
};

const followUps: CaseFollowUp[] = [
  { id: 'fu1', followUpAt: '2026-08-16T00:00:00.000Z', status: 'IMPROVING', temperature: 37.2, contactsTraced: 5, notes: 'Patient improving', by: { id: 'u1', fullName: 'Admin User' } },
];

const renderSurveillance = () => render(<Toaster><Surveillance /></Toaster>);

/** Wait for the cases to load (the register tab shows the case data) */
const waitForCases = () => waitFor(() => {
  expect(screen.getAllByText('Kwame Asante').length).toBeGreaterThanOrEqual(1);
});

describe('Surveillance', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user: managerUser });
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the page header', async () => {
    renderSurveillance();
    expect(screen.getByText('Disease Surveillance')).toBeTruthy();
  });

  it('shows access denied for users without permissions', () => {
    mocks.useAuth.mockReturnValue({ user: { ...managerUser, permissions: [] } });
    renderSurveillance();
    expect(screen.getByText('No access')).toBeTruthy();
  });

  it('renders all three tabs', async () => {
    renderSurveillance();
    expect(screen.getByText(/Case Register/)).toBeTruthy();
    expect(screen.getByText(/Contact Tracing/)).toBeTruthy();
    expect(screen.getByText(/Location Tracking/)).toBeTruthy();
  });

  it('shows summary stat cards', async () => {
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('Open cases')).toBeTruthy();
    });
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Follow-up rate')).toBeTruthy();
    expect(screen.getByText('Deaths')).toBeTruthy();
  });

  it('displays case register by default', async () => {
    renderSurveillance();
    await waitForCases();
    expect(screen.getAllByText('Kwame Asante').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Measles').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to contact tracing tab', async () => {
    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getByText(/Contact Tracing/));
    expect(screen.getByTestId('contact-tracing')).toBeTruthy();
  });

  it('switches to location tracking tab', async () => {
    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getByText(/Location Tracking/));
    expect(screen.getByTestId('patient-location-tracker')).toBeTruthy();
  });

  it('switches back to register tab', async () => {
    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getByText(/Contact Tracing/));
    fireEvent.click(screen.getByText(/Case Register/));
    expect(screen.getAllByText('Kwame Asante').length).toBeGreaterThanOrEqual(1);
  });

  it('filters cases by status', async () => {
    renderSurveillance();
    await waitForCases();
    const statusSelect = screen.getAllByDisplayValue('All statuses')[0]!;
    fireEvent.change(statusSelect, { target: { value: 'OPEN' } });
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('status=OPEN'));
    });
  });

  it('filters cases by case type', async () => {
    renderSurveillance();
    await waitForCases();
    const selects = screen.getAllByDisplayValue('All case types');
    fireEvent.change(selects[0]!, { target: { value: 'CONFIRMED' } });
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('caseType=CONFIRMED'));
    });
  });

  it('shows the disease breakdown by region', async () => {
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('By disease')).toBeTruthy();
    });
    // Region appears as 'Greater Accra · 8' in a Badge
    expect(screen.getAllByText(/Greater Accra/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows outbreak warning when 3+ open cases for a disease', async () => {
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getAllByText(/Possible outbreak/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens case detail drawer when clicking a case row', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url === '/surveillance/cases/c1') return Promise.resolve({ case: cases[0], followUps });
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });

    renderSurveillance();
    await waitForCases();

    fireEvent.click(screen.getAllByText('Kwame Asante')[0]!);

    await waitFor(() => {
      expect(screen.getByText('Patient presenting with severe diarrhea')).toBeTruthy();
    });
    expect(screen.getAllByText('Case workflow').length).toBeGreaterThanOrEqual(1);
  });

  it('displays the report a case form', async () => {
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('Report a case')).toBeTruthy();
    });
    expect(screen.getAllByText('Disease').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Case type').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Severity').length).toBeGreaterThanOrEqual(1);
  });

  it('submits a new case report', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') return Promise.resolve({ id: 'c3' });
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });

    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('Report a case')).toBeTruthy();
    });

    const diseaseInput = screen.getByPlaceholderText(/Cholera/);
    fireEvent.change(diseaseInput, { target: { value: 'Malaria' } });

    fireEvent.click(screen.getByRole('button', { name: /Report case/ }));

    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith('/surveillance/cases', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('shows 30-day trend chart', async () => {
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('Cases reported — last 30 days')).toBeTruthy();
    });
  });

  it('shows empty state when no cases', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve({ ...summary, byDisease: [] });
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: [] });
      return Promise.resolve({});
    });
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('No cases')).toBeTruthy();
    });
  });

  it('shows severity and case type badges', async () => {
    renderSurveillance();
    await waitForCases();
    expect(screen.getAllByText('Severe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Suspected').length).toBeGreaterThanOrEqual(1);
  });

  it('shows follow-up details in the detail drawer', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url === '/surveillance/cases/c1') return Promise.resolve({ case: cases[0], followUps });
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });

    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getAllByText('Kwame Asante')[0]!);
    await waitFor(() => {
      expect(screen.getByText('Patient presenting with severe diarrhea')).toBeTruthy();
    });
    expect(screen.getAllByText('Improving').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Patient improving')).toBeTruthy();
  });

  it('shows no follow-ups message when empty', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url === '/surveillance/cases/c1') return Promise.resolve({ case: cases[0], followUps: [] });
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });

    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getAllByText('Kwame Asante')[0]!);
    await waitFor(() => {
      expect(screen.getByText('No follow-ups recorded yet.')).toBeTruthy();
    });
  });

  it('shows close and investigate buttons in the detail drawer', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url === '/surveillance/cases/c1') return Promise.resolve({ case: cases[0], followUps: [] });
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });

    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getAllByText('Kwame Asante')[0]!);
    await waitFor(() => {
      expect(screen.getByText('Close case')).toBeTruthy();
    });
    expect(screen.getByText('Mark investigated')).toBeTruthy();
  });

  it('closes a case', async () => {
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'PATCH') return Promise.resolve({});
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url === '/surveillance/cases/c1') return Promise.resolve({ case: cases[0], followUps: [] });
      if (url.startsWith('/surveillance/cases')) return Promise.resolve({ items: cases });
      return Promise.resolve({});
    });

    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getAllByText('Kwame Asante')[0]!);
    await waitFor(() => {
      expect(screen.getByText('Close case')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Close case/ }));

    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledWith('/surveillance/cases/c1', expect.objectContaining({ method: 'PATCH' }));
    });
  });

  it('passes disease prop to ContactTracing when outbreak is detected', async () => {
    renderSurveillance();
    await waitForCases();
    fireEvent.click(screen.getByText(/Contact Tracing/));
    // When there's an outbreak (3+ open cases for Cholera), it passes the disease
    expect(screen.getByTestId('contact-tracing').textContent).toContain('Cholera');
  });

  it('shows community report for cases without patient', async () => {
    renderSurveillance();
    await waitForCases();
    expect(screen.getByText('Community report')).toBeTruthy();
  });

  it('shows the case count badge in page header', async () => {
    renderSurveillance();
    await waitFor(() => {
      expect(screen.getByText('Disease Surveillance')).toBeTruthy();
    });
    expect(screen.getByText('10 cases in scope')).toBeTruthy();
  });
});
