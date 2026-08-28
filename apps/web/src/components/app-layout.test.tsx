// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AppLayout from './AppLayout';
import type { AuthUser } from '../types';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  logout: vi.fn(),
  navigate: vi.fn(),
  api: vi.fn(async () => ({ name: 'Korle Bu Teaching Hospital' })),
}));

vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  Outlet: () => <main data-testid="outlet" />,
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/app', search: '', hash: '', state: null, key: 'default' }),
}));
// The header widgets fetch their own data — stub them for the shell test.
vi.mock('./SyncBadge', () => ({ SyncBadge: () => <span data-testid="sync-badge" /> }));
vi.mock('./LicenseBadge', () => ({ default: () => <span data-testid="license-badge" /> }));
vi.mock('./AlertBell', () => ({ default: () => <span data-testid="alert-bell" /> }));

const user = (over: Partial<AuthUser> = {}): AuthUser => ({
  id: 'u1',
  email: 'nurse@demo.gh',
  fullName: 'Ama Serwaa',
  roleCode: 'NURSE',
  roleName: 'Nurse',
  scope: 'FACILITY',
  permissions: ['view_dashboard', 'view_reports'],
  organizationId: null,
  facilityId: 'fac1',
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: null,
  ...over,
});

beforeEach(() => {
  mocks.useAuth.mockReset().mockReturnValue({ user: user(), logout: mocks.logout });
  mocks.logout.mockClear();
  mocks.navigate.mockClear();
  mocks.api.mockClear().mockResolvedValue({ name: 'Korle Bu Teaching Hospital' });
  localStorage.clear();
});

afterEach(() => cleanup());

describe('AppLayout', () => {
  it('renders only the nav items the user has permission for', async () => {
    render(<AppLayout />);
    // 'Dashboard' appears in both the nav and the mobile h1 page title
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Reports')).toBeTruthy();
    expect(screen.queryByText('Queue')).toBeNull();
    expect(screen.queryByText('Blood Bank')).toBeNull();
    expect(screen.queryByText('Developer')).toBeNull();
    expect(screen.getByText('Public portal')).toBeTruthy();
  });

  it('shows the developer console only with developer_mode', () => {
    mocks.useAuth.mockReturnValue({ user: user({ permissions: ['developer_mode'] }), logout: mocks.logout });
    render(<AppLayout />);
    expect(screen.getByText('Developer')).toBeTruthy();
    // Non-permitted nav items (like Reports) should be absent from sidebar
    expect(screen.queryByText('Reports')).toBeNull();
  });

  it('shows no nav items for a patient-scope or anonymous session', () => {
    mocks.useAuth.mockReturnValue({ user: user({ scope: 'PATIENT' }), logout: mocks.logout });
    render(<AppLayout />);
    // No sidebar nav items for PATIENT scope
    expect(screen.queryByText('Reports')).toBeNull();
    expect(screen.queryByText('Queue')).toBeNull();

    mocks.useAuth.mockReturnValue({ user: null, logout: mocks.logout });
    render(<AppLayout />);
    expect(screen.queryByText('Reports')).toBeNull();
    expect(screen.queryByText('Queue')).toBeNull();
  });

  it('shows the alert bell only to the developer scope', () => {
    mocks.useAuth.mockReturnValue({ user: user({ scope: 'DEVELOPER', permissions: [] }), logout: mocks.logout });
    render(<AppLayout />);
    expect(screen.getByTestId('alert-bell')).toBeTruthy();
  });

  it('shows the sector chip chosen at login', () => {
    localStorage.setItem('gihm_sector', 'PRIVATE');
    render(<AppLayout />);
    // The chip text carries an emoji prefix.
    expect(screen.getByText(/Private/)).toBeTruthy();
  });

  it('logs out and returns to the portal', () => {
    render(<AppLayout />);
    fireEvent.click(screen.getByTitle('Log out'));
    expect(mocks.logout).toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('fetches and shows the user facility name in the header', async () => {
    render(<AppLayout />);
    expect(mocks.api).toHaveBeenCalledWith('/facilities/fac1', { public: true });
    expect(await screen.findByText('Korle Bu Teaching Hospital')).toBeTruthy();
  });
});
