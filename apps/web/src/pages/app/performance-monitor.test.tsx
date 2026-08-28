// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PerformanceMonitor from './PerformanceMonitor';
import { Toaster } from '../../components/ui';
import { recordPerf, clearPerfEntries } from '../../lib/perfTracker';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', roleCode: 'ADMIN', permissions: ['view_reports'] },
  }),
}));

const renderMonitor = () =>
  render(<Toaster><PerformanceMonitor /></Toaster>);

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    clearPerfEntries();
  });

  afterEach(() => {
    clearPerfEntries();
    cleanup();
  });

  it('renders the page header', () => {
    renderMonitor();
    expect(screen.getByText('Performance Monitor')).toBeTruthy();
    expect(screen.getByText(/Real-time client-side API performance tracking/)).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    renderMonitor();
    expect(screen.getByText(/No API requests recorded yet/)).toBeTruthy();
  });

  it('renders stat cards when data exists', () => {
    recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 150, cached: false, error: false });
    recordPerf({ path: '/appointments', method: 'GET', status: 200, durationMs: 300, cached: false, error: false });
    renderMonitor();
    expect(screen.getByText('Total requests')).toBeTruthy();
    expect(screen.getByText('Avg response')).toBeTruthy();
    expect(screen.getByText('P95 response')).toBeTruthy();
  });

  it('renders status code breakdown', () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    recordPerf({ path: '/b', method: 'POST', status: 404, durationMs: 10, cached: false, error: true });
    renderMonitor();
    expect(screen.getByText('Status codes')).toBeTruthy();
    expect(screen.getAllByText('200').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('404').length).toBeGreaterThanOrEqual(1);
  });

  it('renders endpoint breakdown', () => {
    recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 100, cached: false, error: false });
    recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 200, cached: false, error: false });
    renderMonitor();
    expect(screen.getByText('Top endpoints')).toBeTruthy();
    expect(screen.getByText('/patients')).toBeTruthy();
  });

  it('renders recent errors', () => {
    recordPerf({ path: '/patients', method: 'GET', status: 500, durationMs: 10, cached: false, error: true });
    renderMonitor();
    expect(screen.getByText('Recent errors')).toBeTruthy();
    expect(screen.getByText('/patients')).toBeTruthy();
  });

  it('clears data when clear button is clicked', () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    renderMonitor();
    expect(screen.getByText('Total requests')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Clear data/ }));
    expect(screen.getByText(/No API requests recorded yet/)).toBeTruthy();
  });

  it('shows error rate and cache hit rate', () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 10, cached: true, error: false });
    recordPerf({ path: '/b', method: 'GET', status: 404, durationMs: 10, cached: false, error: true });
    renderMonitor();
    expect(screen.getByText('Error rate')).toBeTruthy();
    expect(screen.getByText('Cache hit rate')).toBeTruthy();
  });

  it('shows response time timeline', () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 100, cached: false, error: false });
    renderMonitor();
    expect(screen.getByText('Response time timeline')).toBeTruthy();
    expect(screen.getByText(/Average response time per minute/)).toBeTruthy();
  });
});
