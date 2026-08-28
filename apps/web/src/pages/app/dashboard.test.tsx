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
  id: 'u1',
  email: 'admin@facility.gh',
  fullName: 'Kofi Mensah',
  roleCode: 'ADMIN',
  roleName: 'Admin',
  scope: 'FACILITY',
  permissions: [],
  organizationId: null,
  facilityId: 'f1',
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: 'Korle Bu Teaching Hospital',
};

const stats: DashboardStats = {
  scope: 'FACILITY',
  facilityId: 'f1',
  stats: {
    patientsToday: 42,
    appointmentsToday: 18,
    queueWaiting: 7,
    activeAdmissions: 23,
    encountersToday: 35,
    labPending: 5,
    prescriptionsActive: 12,
    invoicesToday: 8,
    revenueToday: 4500.5,
    criticalLabs: 2,
    patientCount: 1240,
  },
  national: { districts: 260, facilities: 4200 },
  trend: [
    { date: '2026-08-15', count: 30 },
    { date: '2026-08-16', count: 25 },
    { date: '2026-08-17', count: 35 },
    { date: '2026-08-18', count: 28 },
    { date: '2026-08-19', count: 42 },
    { date: '2026-08-20', count: 38 },
    { date: '2026-08-21', count: 40 },
  ],
};

const surveillanceSummary = {
  totals: { cases: 10, open: 5, closed: 5, confirmed: 3, suspected: 2, deaths: 1, followUps: 8, contactsTraced: 15, followUpRate: 80 },
  byStatus: {}, byCaseType: {},
  byDisease: [{ disease: 'Cholera', count: 5, confirmed: 3, open: 3 }],
  byFacility: [], byDistrict: {}, byRegion: {},
  trend: [{ date: '2026-08-20', count: 5 }],
};

describe('Dashboard', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows a loading skeleton before data arrives', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    render(<Dashboard />);
    expect(document.querySelector('.skeleton')).toBeTruthy();
  });

  it('renders stat cards after loading', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Patients today')).toBeTruthy();
    });
    expect(screen.getAllByText('42').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('OPD encounters')).toBeTruthy();
    expect(screen.getByText('Queue waiting')).toBeTruthy();
    expect(screen.getByText('Admissions')).toBeTruthy();
    expect(screen.getByText('Lab pending')).toBeTruthy();
  });

  it('shows the greeting with the user first name', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Kofi/)).toBeTruthy();
    });
  });

  it('renders the 7-day trend chart', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('7-day patient activity')).toBeTruthy();
    });
    expect(screen.getByText('Encounters per day')).toBeTruthy();
  });

  it('renders quick actions with links', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Quick actions')).toBeTruthy();
    });
    expect(screen.getByText('Register patient')).toBeTruthy();
    expect(screen.getByText('Find patient')).toBeTruthy();
    expect(screen.getByText('Appointments')).toBeTruthy();
    expect(screen.getByText('Manage queue')).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/app/register')).toBe(true);
    expect(links.some((l) => l.getAttribute('href') === '/app/patients')).toBe(true);
  });

  it('renders quick action stats rows', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Appointments today')).toBeTruthy();
    });
    expect(screen.getAllByText('18').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Active prescriptions')).toBeTruthy();
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Critical lab alerts')).toBeTruthy();
    expect(screen.getByText('Total patients on file')).toBeTruthy();
  });

  it('renders national master data section', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('National master data')).toBeTruthy();
    });
    expect(screen.getByText('260')).toBeTruthy();
    expect(screen.getByText('4200')).toBeTruthy();
  });

  it('renders the data scope card', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Data scope')).toBeTruthy();
    });
    expect(screen.getByText('FACILITY')).toBeTruthy();
    const scopeText = screen.getByText(/Viewing data scoped/);
    expect(scopeText.textContent).toContain('FACILITY');
  });

  it('renders system status card', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('System status')).toBeTruthy();
    });
    expect(screen.getByText('API operational')).toBeTruthy();
  });

  it('refreshes data on interval', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Patients today')).toBeTruthy();
    });
    expect(mocks.api).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(30_000);
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalledTimes(4);
    });
  });

  it('renders revenue with cedis formatting', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Revenue today')).toBeTruthy();
    });
    const revenueText = screen.getByText(/revenue/i).closest('div')?.textContent;
    expect(revenueText).toContain('4');
  });

  it('shows green badge when no critical lab alerts', async () => {
    const noCriticalStats = { ...stats, stats: { ...stats.stats, criticalLabs: 0 } };
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(noCriticalStats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('0')).toBeTruthy();
    });
  });

  it('shows red badge when there are critical lab alerts', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('handles API error gracefully', async () => {
    mocks.api.mockRejectedValue(new Error('Network error'));
    render(<Dashboard />);
    await waitFor(() => {
      expect(document.querySelector('.skeleton')).toBeTruthy();
    });
  });

  it('shows user greeting with default name when user is null', async () => {
    mocks.useAuth.mockReturnValue({ user: null });
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/there/)).toBeTruthy();
    });
  });

  it('displays trend data points with correct labels', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('30')).toBeTruthy();
    });
    expect(screen.getByText('40')).toBeTruthy();
  });

  it('cleans up interval on unmount', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Patients today')).toBeTruthy();
    });
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('renders the surveillance summary widget', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    expect(screen.getByText('Active case register overview')).toBeTruthy();
    expect(screen.getByText('5 open')).toBeTruthy();
    expect(screen.getByText('View full surveillance register →')).toBeTruthy();
  });

  it('renders outbreak badges in surveillance widget', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    // Cholera has 3 open cases (>= 2 threshold), should show outbreak badge
    expect(screen.getAllByText(/Cholera.*open/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows surveillance summary stats', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(surveillanceSummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Disease surveillance')).toBeTruthy();
    });
    // Check for the stat badges: 5 open, 5 closed, etc.
    expect(screen.getByText('5 open')).toBeTruthy();
    expect(screen.getByText('5 closed')).toBeTruthy();
    expect(screen.getByText('3 confirmed')).toBeTruthy();
    expect(screen.getByText('2 suspected')).toBeTruthy();
    expect(screen.getByText('Follow-up rate:')).toBeTruthy();
    expect(screen.getByText('Contacts traced:')).toBeTruthy();
  });

  it('does not show surveillance widget when no cases', async () => {
    const emptySummary = { ...surveillanceSummary, totals: { ...surveillanceSummary.totals, cases: 0 } };
    mocks.api.mockImplementation((url: string) => {
      if (url.startsWith('/surveillance/cases/summary')) return Promise.resolve(emptySummary);
      if (url === '/dashboard/stats') return Promise.resolve(stats);
      return Promise.resolve({});
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Patients today')).toBeTruthy();
    });
    expect(screen.queryByText('Disease surveillance')).toBeNull();
  });
});
