// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Toaster } from './ui';

/**
 * Basic accessibility test suite.
 *
 * These tests verify common a11y patterns without requiring a real browser:
 * proper heading hierarchy, labels on form controls, semantic HTML,
 * accessible button text, and no duplicate IDs.
 */

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../lib/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  NavLink: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Outlet: () => <main />,
  useLocation: () => ({ pathname: '/' }),
}));

const user = {
  id: 'u1', email: 'admin@facility.gh', fullName: 'Admin User', roleCode: 'ADMIN',
  roleName: 'Admin', scope: 'FACILITY', permissions: ['view_surveillance'],
  organizationId: null, facilityId: 'f1', regionId: 'r1', districtId: 'd1',
  regionName: null, districtName: null, facilityName: 'Korle Bu',
};

beforeEach(() => {
  mocks.api.mockReset();
  mocks.useAuth.mockReturnValue({ user });
  mocks.api.mockResolvedValue({ items: [] });
});

afterEach(() => cleanup());

describe('Accessibility — form controls have labels', () => {
  it('Billing page inputs have accessible labels or placeholders', async () => {
    const { default: Billing } = await import('../pages/app/Billing');
    render(<Toaster><Billing /></Toaster>);

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((el) => {
      const hasAccessibleName =
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.getAttribute('placeholder') ||
        (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
        el.closest('label');
      expect(hasAccessibleName).toBeTruthy();
    });
  });

  it('Pharmacy page inputs have accessible labels', async () => {
    const { default: Pharmacy } = await import('../pages/app/Pharmacy');
    render(<Toaster><Pharmacy /></Toaster>);

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((el) => {
      const hasAccessibleName =
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.getAttribute('placeholder') ||
        (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
        el.closest('label');
      expect(hasAccessibleName).toBeTruthy();
    });
  });
});

describe('Accessibility — heading hierarchy', () => {
  it('Billing page headings are properly nested', async () => {
    const { default: Billing } = await import('../pages/app/Billing');
    render(<Toaster><Billing /></Toaster>);

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const levels = headings.map((h) => parseInt(h.tagName[1]!));
    if (levels.length > 0) {
      expect(levels[0]!).toBeLessThanOrEqual(2);
    }
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(2);
    }
  });

  it('Pharmacy page has a heading', async () => {
    const { default: Pharmacy } = await import('../pages/app/Pharmacy');
    render(<Toaster><Pharmacy /></Toaster>);
    expect(document.querySelectorAll('h1').length).toBeGreaterThanOrEqual(1);
  });

  it('Lab page has a heading', async () => {
    const { default: Lab } = await import('../pages/app/Lab');
    render(<Toaster><Lab /></Toaster>);
    expect(document.querySelectorAll('h1').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Accessibility — buttons and links', () => {
  it('all buttons have accessible text', async () => {
    const { default: Billing } = await import('../pages/app/Billing');
    render(<Toaster><Billing /></Toaster>);

    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn) => {
      const hasText = btn.textContent?.trim();
      const hasAriaLabel = btn.getAttribute('aria-label');
      const hasTitle = btn.getAttribute('title');
      expect(hasText || hasAriaLabel || hasTitle).toBeTruthy();
    });
  });

  it('all links have href attributes', async () => {
    const { default: Billing } = await import('../pages/app/Billing');
    render(<Toaster><Billing /></Toaster>);

    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBeTruthy();
    });
  });
});

describe('Accessibility — semantic HTML', () => {
  it('Billing page uses form elements for search', async () => {
    const { default: Billing } = await import('../pages/app/Billing');
    render(<Toaster><Billing /></Toaster>);
    const forms = document.querySelectorAll('form');
    expect(forms.length).toBeGreaterThanOrEqual(1);
  });

  it('no duplicate IDs in the document', async () => {
    const { default: Billing } = await import('../pages/app/Billing');
    render(<Toaster><Billing /></Toaster>);
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('no duplicate IDs in Pharmacy', async () => {
    const { default: Pharmacy } = await import('../pages/app/Pharmacy');
    render(<Toaster><Pharmacy /></Toaster>);
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Accessibility — ARIA patterns', () => {
  it('inputs without type hidden are not inside aria-hidden', async () => {
    const { default: Pharmacy } = await import('../pages/app/Pharmacy');
    render(<Toaster><Pharmacy /></Toaster>);
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach((input) => {
      const inAriaHidden = input.closest('[aria-hidden="true"]');
      expect(inAriaHidden).toBeNull();
    });
  });

  it('PageHeader renders as h1', async () => {
    const { PageHeader } = await import('./ui');
    render(<Toaster><PageHeader title="Test Page" subtitle="Test subtitle" /></Toaster>);
    const h1 = document.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBe('Test Page');
  });

  it('Card title renders as h3', async () => {
    const { Card } = await import('./ui');
    render(
      <Toaster>
        <Card title="Test Card" subtitle="Card subtitle">
          <p>Content</p>
        </Card>
      </Toaster>,
    );
    const h3 = document.querySelector('h3');
    expect(h3).toBeTruthy();
    expect(h3?.textContent).toBe('Test Card');
  });
});
