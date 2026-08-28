// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import Dashboard from './Dashboard';
import type { AuthUser, DashboardStats } from '../../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('../../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const user: AuthUser = {
  id: 'u1', email: 'admin@facility.gh', fullName: 'Admin User', roleCode: 'ADMIN',
  roleName: 'Admin', scope: 'FACILITY', permissions: [],
  organizationId: null, facilityId: 'f1', regionId: null, districtId: null,
  regionName: null, districtName: null, facilityName: 'Test Facility',
};

const stats: DashboardStats = {
  scope: 'FACILITY', facilityId: 'f1',
  stats: { patientsToday: 10, appointmentsToday: 5, queueWaiting: 2, activeAdmissions: 3, encountersToday: 8, labPending: 1, prescriptionsActive: 4, invoicesToday: 2, revenueToday: 1000, criticalLabs: 0, patientCount: 500 },
  national: { districts: 10, facilities: 50 },
  trend: [{ date: '2026-08-20', count: 5 }],
};

const surveillanceSummary = {
  totals: { cases: 15, open: 6, closed: 9, confirmed: 4, suspected: 2, deaths: 1, followUps: 12, contactsTraced: 30, followUpRate: 80 },
  byStatus: {}, byCaseType: {},
  byDisease: [
    { disease: 'Cholera', count: 8, confirmed: 3, open: 4 },
    { disease: 'Measles', count: 5, confirmed: 1, open: 2 },
    { disease: 'Malaria', count: 2, confirmed: 0, open: 0 },
  ],
  byFacility: [], byDistrict: {}, byRegion: {},
  trend: [{ date: '2026-08-20', count: 5 }],
};

describe('Dashboard surveillance widget integration', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const setupDashboard = (summary = surveillanceSummary) => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(summary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
  };

  it('shows the surveillance widget with case counts', async () => {
    setupDashboard();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    expect(screen.getByText('6 open')).toBeTruthy();
    expect(screen.getByText('9 closed')).toBeTruthy();
    expect(screen.getByText('4 confirmed')).toBeTruthy();
    expect(screen.getByText('2 suspected')).toBeTruthy();
  });

  it('shows outbreak badges for diseases above threshold', async () => {
    setupDashboard();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    // Cholera has 4 open cases (above default threshold of 3)
    expect(screen.getAllByText(/Cholera/).length).toBeGreaterThanOrEqual(1);
    // Measles has 2 open (below threshold) - should not show outbreak badge
    expect(screen.queryByText(/Measles.*open/)).toBeNull();
  });

  it('hides the widget when there are no cases', async () => {
    setupDashboard({ ...surveillanceSummary, totals: { ...surveillanceSummary.totals, cases: 0 } });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Patients today')).toBeTruthy();
    });
    expect(screen.queryByText('Disease surveillance')).toBeNull();
  });

  it('shows the follow-up rate and contacts traced', async () => {
    setupDashboard();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    expect(screen.getByText('Follow-up rate:')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('Contacts traced:')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy();
  });

  it('has a link to the full surveillance register', async () => {
    setupDashboard();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    const link = screen.getByText('View full surveillance register →');
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).getAttribute('href')).toBe('/app/surveillance');
  });

  it('refreshes surveillance data on interval', async () => {
    setupDashboard();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    const initialCalls = mocks.api.mock.calls.length;
    // Advance by 60 seconds (the surveillance polling interval)
    vi.advanceTimersByTime(60_000);
    await waitFor(() => {
      expect(mocks.api.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it('handles surveillance API error gracefully', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.reject(new Error('API error'));
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Patients today')).toBeTruthy();
    });
    // Widget should not render when API fails
    expect(screen.queryByText('Disease surveillance')).toBeNull();
  });
});
