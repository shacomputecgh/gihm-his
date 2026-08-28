// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PortalLayout, { Logo } from './PortalLayout';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  Outlet: () => <main data-testid="portal-outlet" />,
}));

beforeEach(() => {
  mocks.useAuth.mockReset().mockReturnValue({ user: null });
});

afterEach(() => cleanup());

describe('PortalLayout', () => {
  it('renders the logo and the public navigation', () => {
    render(<PortalLayout />);
    // The logo appears in both the header and the footer.
    expect(screen.getAllByText('GIHM-HIS').length).toBeGreaterThan(0);
    // Nav labels appear in both the header and footer navigation.
    for (const label of ['Home', 'Find Healthcare', 'Facilities', 'Health Info', 'Register Facility', 'Contact']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByTestId('portal-outlet')).toBeTruthy();
  });

  it('renders the logo link to the home page', () => {
    render(<Logo />);
    expect(screen.getByText('GIHM-HIS')).toBeTruthy();
    expect(screen.getByText(/Ghana Health Platform/)).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/');
  });

  it('shows the login link when no user is authenticated', () => {
    mocks.useAuth.mockReturnValue({ user: null });
    render(<PortalLayout />);
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Login').closest('a')?.getAttribute('href')).toBe('/login');
  });

  it('links to /patient when the user scope is PATIENT', () => {
    mocks.useAuth.mockReturnValue({
      user: { id: 'u1', fullName: 'Jane Patient', scope: 'PATIENT' },
    });
    render(<PortalLayout />);
    const userLink = screen.getByText('Jane');
    expect(userLink.closest('a')?.getAttribute('href')).toBe('/patient');
  });

  it('links to /app when the user scope is FACILITY', () => {
    mocks.useAuth.mockReturnValue({
      user: { id: 'u2', fullName: 'Dr. Smith', scope: 'FACILITY' },
    });
    render(<PortalLayout />);
    const userLink = screen.getByText('Dr.');
    expect(userLink.closest('a')?.getAttribute('href')).toBe('/app');
  });

  it('renders the dark logo variant', () => {
    render(<Logo dark />);
    expect(screen.getByText('GIHM-HIS')).toBeTruthy();
    expect(screen.getByText(/Ghana Health Platform/)).toBeTruthy();
  });

  it('renders all navigation links', () => {
    render(<PortalLayout />);
    expect(screen.getByText('News')).toBeTruthy();
  });

  it('renders footer content', () => {
    render(<PortalLayout />);
    expect(screen.getByText(/DEMO.*SYNTHETIC DATA ONLY/)).toBeTruthy();
    expect(screen.getByText(/Offline-first/)).toBeTruthy();
  });
});
