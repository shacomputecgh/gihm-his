// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AlertBell from './AlertBell';
import type { SecurityAlertInbox } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/' }) }));

const alert = (over: Partial<SecurityAlertInbox['alerts'][number]> = {}): SecurityAlertInbox['alerts'][number] => ({
  id: 'a1',
  event: 'auth.fail',
  severity: 'warning',
  title: 'Many failed logins',
  message: 'Repeated login failures detected',
  read: false,
  createdAt: new Date().toISOString(),
  ...over,
});

const inbox = (over: Partial<SecurityAlertInbox> = {}): SecurityAlertInbox => ({
  unread: 1,
  alerts: [alert()],
  deliveryStats: [{ channel: 'email', total: 1, delivered: 1, pending: 0, exhausted: 0 }],
  ...over,
});

beforeEach(() => {
  mocks.api.mockReset();
  // The GET returns the inbox; the read endpoints resolve without a body.
  mocks.api.mockImplementation((url: string) =>
    String(url).includes('/read') ? Promise.resolve(undefined) : Promise.resolve(inbox()),
  );
});

afterEach(() => cleanup());

describe('AlertBell', () => {
  it('fetches the inbox on mount and shows the unread count on the bell', async () => {
    mocks.api.mockResolvedValue(inbox({ unread: 3 }));
    render(<AlertBell />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalledWith('/admin/developer/alerts'));
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows no badge when everything is read', async () => {
    mocks.api.mockResolvedValue(inbox({ unread: 0, alerts: [alert({ read: true })] }));
    render(<AlertBell />);
    await waitFor(() => expect(screen.queryByText(/99\+|^[0-9]+$/)).toBeNull());
  });

  it('opens the panel listing the alert title and message', async () => {
    render(<AlertBell />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle('Security alerts'));
    expect(screen.getByText('Many failed logins')).toBeTruthy();
    expect(screen.getByText('Repeated login failures detected')).toBeTruthy();
  });

  it('filters by severity and reports an empty result', async () => {
    mocks.api.mockResolvedValue(
      inbox({ alerts: [alert({ id: 'c1', severity: 'critical', title: 'Breach attempt' })] }),
    );
    render(<AlertBell />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle('Security alerts'));
    fireEvent.click(screen.getByRole('button', { name: 'Critical' }));
    expect(screen.getByText('Breach attempt')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Info' }));
    expect(screen.getByText('No alerts at this severity.')).toBeTruthy();
  });

  it('marks a single alert read, decrementing the unread count', async () => {
    render(<AlertBell />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle('Security alerts'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
    expect(mocks.api).toHaveBeenCalledWith('/admin/developer/alerts/a1/read', { method: 'POST' });
    // The alert is dimmed and the unread badge disappears; with nothing left
    // unread the "Mark all read" action also disappears.
    await waitFor(() => expect(screen.queryByText('1')).toBeNull());
    expect(screen.queryByText('Mark all read')).toBeNull();
  });

  it('marks everything read in one action', async () => {
    mocks.api.mockResolvedValue(
      inbox({ unread: 2, alerts: [alert({ id: 'c1', severity: 'critical' }), alert({ id: 'c2', severity: 'info' })] }),
    );
    render(<AlertBell />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle('Security alerts'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(mocks.api).toHaveBeenCalledWith('/admin/developer/alerts/read-all', { method: 'POST' });
    await waitFor(() => expect(screen.queryByText('2')).toBeNull());
  });

  it('shows the empty state when there are no alerts', async () => {
    mocks.api.mockResolvedValue(inbox({ unread: 0, alerts: [] }));
    render(<AlertBell />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle('Security alerts'));
    expect(screen.getByText('No security alerts yet.')).toBeTruthy();
  });

  it('survives a failed fetch without crashing', async () => {
    mocks.api.mockRejectedValue(new Error('network down'));
    render(<AlertBell />);
    await new Promise((r) => setTimeout(r, 10));
    fireEvent.click(screen.getByTitle('Security alerts'));
    // With no inbox loaded the panel shows the loading placeholder.
    expect(screen.getByText('Loading alerts…')).toBeTruthy();
  });
});
