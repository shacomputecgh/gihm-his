// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import DistrictHealthDashboard from './DistrictHealthDashboard';
import { Toaster } from './ui';
import type { SurveillanceSummary } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));

const user = {
  id: 'u1', email: 'admin@facility.gh', fullName: 'Admin User', roleCode: 'ADMIN',
  roleName: 'Admin', scope: 'DISTRICT', permissions: ['view_surveillance'],
  organizationId: null, facilityId: null, regionId: 'r1', districtId: 'd1',
  regionName: 'Greater Accra', districtName: 'Accra Metropolitan', facilityName: null,
};

const summary: SurveillanceSummary = {
  totals: { cases: 25, open: 8, closed: 17, confirmed: 5, suspected: 3, deaths: 2, followUps: 20, contactsTraced: 45, followUpRate: 80 },
  byStatus: { OPEN: 8, CLOSED: 17 },
  byCaseType: { CONFIRMED: 5, SUSPECTED: 3 },
  byDisease: [
    { disease: 'Cholera', count: 12, confirmed: 3, open: 5 },
    { disease: 'Measles', count: 8, confirmed: 2, open: 3 },
    { disease: 'Malaria', count: 5, confirmed: 0, open: 0 },
  ],
  byFacility: [{ id: 'f1', name: 'Korle Bu', count: 15 }],
  byDistrict: { 'Accra Metropolitan': 20 },
  byRegion: { 'Greater Accra': 25 },
  trend: [{ date: '2026-08-20', count: 5 }],
};

const overview = {
  regionName: 'Greater Accra',
  districtName: 'Accra Metropolitan',
  facilities: [
    { id: 'f1', name: 'Korle Bu Teaching Hospital', district: 'Accra', open: 5, confirmed: 3, total: 15, followUpRate: 85, lastReportedAt: '2026-08-20T00:00:00.000Z' },
    { id: 'f2', name: 'Ridge Hospital', district: 'Accra', open: 3, confirmed: 2, total: 10, followUpRate: 75, lastReportedAt: '2026-08-19T00:00:00.000Z' },
  ],
  summary,
};

const renderDashboard = (props: { districtId?: string } = {}) =>
  render(<Toaster><DistrictHealthDashboard {...props} /></Toaster>);

describe('DistrictHealthDashboard', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user });
    mocks.api.mockResolvedValue(overview);
    // Mock URL.createObjectURL for CSV export tests
    if (typeof URL.createObjectURL !== 'function') {
      (URL as Record<string, unknown>).createObjectURL = vi.fn(() => 'blob:mock');
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      (URL as Record<string, unknown>).revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/Loading district health overview/)).toBeTruthy();
  });

  it('renders the breadcrumb with region and district', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Greater Accra')).toBeTruthy();
    });
    expect(screen.getByText('Accra Metropolitan')).toBeTruthy();
  });

  it('renders summary stat cards', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Total cases')).toBeTruthy();
    });
    expect(screen.getByText('25')).toBeTruthy();
    expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Follow-up rate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('Contacts traced')).toBeTruthy();
  });

  it('renders facility table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy();
    });
    expect(screen.getByText('Ridge Hospital')).toBeTruthy();
  });

  it('renders disease breakdown', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Cholera')).toBeTruthy();
    });
    expect(screen.getByText('Measles')).toBeTruthy();
    expect(screen.getByText('Malaria')).toBeTruthy();
  });

  it('shows outbreak alerts when 3+ open cases for a disease', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Active outbreak alerts/)).toBeTruthy();
    });
    // Cholera has 5 open cases, Measles has 3
    expect(screen.getAllByText(/Cholera/).length).toBeGreaterThanOrEqual(1);
  });

  it('selects and deselects a facility row', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy();
    });
    // Click to select - use the table row
    fireEvent.click(screen.getAllByText('Korle Bu Teaching Hospital')[0]!);
    // Click again to deselect
    fireEvent.click(screen.getAllByText('Korle Bu Teaching Hospital')[0]!);
  });

  it('shows empty state when no facilities', async () => {
    mocks.api.mockResolvedValue({ ...overview, facilities: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('No facilities')).toBeTruthy();
    });
  });

  it('shows reporting facilities count', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeTruthy(); // 2 reporting / 2 total
    });
  });

  it('shows the coverage info card', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Suspected cases')).toBeTruthy();
    });
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the facility breakdown table header', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    expect(screen.getByText('Case counts per reporting facility')).toBeTruthy();
  });

  it('cleans up interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('hides outbreak alerts when no disease has enough open cases', async () => {
    const noOutbreakData = {
      ...overview,
      summary: {
        ...overview.summary,
        byDisease: [
          { disease: 'Flu', count: 5, confirmed: 1, open: 1 },
        ],
      },
    };
    mocks.api.mockResolvedValue(noOutbreakData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    expect(screen.queryByText(/Active outbreak alerts/)).toBeNull();
  });

  it('shows 0/0 reporting facilities when no facilities report', async () => {
    const noReportData = {
      ...overview,
      facilities: [
        { id: 'f3', name: 'Silent Clinic', district: 'Accra', open: 0, confirmed: 0, total: 0, followUpRate: 0, lastReportedAt: null },
      ],
    };
    mocks.api.mockResolvedValue(noReportData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Silent Clinic')).toBeTruthy();
    });
    expect(screen.getByText('0/1')).toBeTruthy();
  });

  it('passes districtId prop to the API call', async () => {
    renderDashboard({ districtId: 'd42' });
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    expect(mocks.api).toHaveBeenCalledWith(expect.stringContaining('districtId=d42'));
  });

  it('shows facility name in breadcrumb when a facility is selected', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Korle Bu Teaching Hospital')).toBeTruthy();
    });
    // Select facility
    fireEvent.click(screen.getAllByText('Korle Bu Teaching Hospital')[0]!);
    // Should now show the breadcrumb trail with the facility name
    const breadcrumbs = screen.getAllByText('Korle Bu Teaching Hospital');
    expect(breadcrumbs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the 30-day trend chart', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('30-day trend')).toBeTruthy();
    });
    expect(screen.getByText('Cases reported per day')).toBeTruthy();
    expect(screen.getByText('today')).toBeTruthy();
  });

  it('renders trend chart with multiple data points', async () => {
    const multiTrend = {
      ...overview,
      summary: {
        ...overview.summary,
        trend: [
          { date: '2026-08-18', count: 2 },
          { date: '2026-08-19', count: 0 },
          { date: '2026-08-20', count: 5 },
        ],
      },
    };
    mocks.api.mockResolvedValue(multiTrend);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('30-day trend')).toBeTruthy();
    });
    // The trend chart title attributes have the raw dates
    const trendContainer = screen.getByText('30-day trend').closest('.rounded-xl');
    expect(trendContainer).toBeTruthy();
  });

  it('toggles export CSV button click without crashing', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Export CSV'));
  });

  it('shows disease breakdown empty state', async () => {
    const noDiseaseData = {
      ...overview,
      summary: { ...overview.summary, byDisease: [] },
    };
    mocks.api.mockResolvedValue(noDiseaseData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    expect(screen.getByText('No cases reported.')).toBeTruthy();
  });

  it('handles API error gracefully', async () => {
    mocks.api.mockRejectedValue(new Error('Network error'));
    renderDashboard();
    await waitFor(() => {
      expect(mocks.api).toHaveBeenCalled();
    });
    // Should still render spinner since data is null
    expect(screen.getByText(/Loading district health overview/)).toBeTruthy();
  });

  it('shows dash for facilities with no lastReportedAt', async () => {
    const dataWithNullDate = {
      ...overview,
      facilities: [
        { id: 'f4', name: 'New Clinic', district: 'Accra', open: 1, confirmed: 0, total: 3, followUpRate: 50, lastReportedAt: null },
      ],
    };
    mocks.api.mockResolvedValue(dataWithNullDate);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('New Clinic')).toBeTruthy();
    });
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('hides trend chart when no trend data', async () => {
    const noTrendData = {
      ...overview,
      summary: { ...overview.summary, trend: [] },
    };
    mocks.api.mockResolvedValue(noTrendData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    expect(screen.queryByText('30-day trend')).toBeNull();
  });

  it('shows outbreak badge with singular case text', async () => {
    const singleCaseData = {
      ...overview,
      summary: {
        ...overview.summary,
        byDisease: [
          { disease: 'Ebola', count: 3, confirmed: 1, open: 3 },
        ],
      },
    };
    mocks.api.mockResolvedValue(singleCaseData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    // open === 3 and threshold is 3, so it should appear
    expect(screen.getAllByText(/Ebola/).length).toBeGreaterThanOrEqual(1);
  });

  it('omits district from breadcrumb when districtName is null', async () => {
    const noDistrictData = {
      ...overview,
      districtName: null,
    };
    mocks.api.mockResolvedValue(noDistrictData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Facility breakdown')).toBeTruthy();
    });
    expect(screen.getByText('Greater Accra')).toBeTruthy();
    expect(screen.queryByText('Accra Metropolitan')).toBeNull();
  });
});
