// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ConfigAudit from './ConfigAudit';
import type { ConfigAuditEntry } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  downloadFile: vi.fn(async () => {}),
}));

vi.mock('../lib/api', () => ({ api: mocks.api, downloadFile: mocks.downloadFile }));

const entry = (over: Partial<ConfigAuditEntry> = {}): ConfigAuditEntry => ({
  id: 'e1',
  at: new Date().toISOString(),
  actorEmail: 'admin@demo.gh',
  role: 'SYSTEM_ADMIN',
  action: 'system.settings.update',
  label: 'Settings updated',
  entityType: null,
  entityId: null,
  ip: '127.0.0.1',
  summary: 'changed notification settings',
  after: {},
  ...over,
});

const renderPanel = () => render(<ConfigAudit />);

beforeEach(() => {
  mocks.api.mockReset().mockResolvedValue({ entries: [entry()] });
  mocks.downloadFile.mockClear().mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('ConfigAudit', () => {
  it('shows a spinner while the initial load is in flight', () => {
    renderPanel();
    expect(screen.getByText('Loading configuration audit…')).toBeTruthy();
  });

  it('lists entries with actor, label badge, summary and entity id', async () => {
    mocks.api.mockResolvedValue({
      entries: [
        entry(),
        entry({
          id: 'e2',
          actorEmail: 'nurse@demo.gh',
          action: 'masterdata.facility.update',
          label: 'Facility updated',
          summary: 'added a new facility',
          entityType: 'Facility',
          entityId: 'fac_1234567890',
        }),
      ],
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('admin@demo.gh')).toBeTruthy());
    expect(screen.getByText('nurse@demo.gh')).toBeTruthy();
    expect(screen.getByText('Settings updated')).toBeTruthy();
    expect(screen.getByText('Facility updated')).toBeTruthy();
    expect(screen.getByText('changed notification settings')).toBeTruthy();
    expect(screen.getByText('system.settings.update')).toBeTruthy();
    expect(screen.getByText('Facility')).toBeTruthy();
    expect(screen.getByText(/fac_1234/)).toBeTruthy(); // truncated id
    expect(mocks.api).toHaveBeenCalledWith('/admin/audit/config');
  });

  it('shows the empty state when no entries match', async () => {
    mocks.api.mockResolvedValue({ entries: [] });
    renderPanel();
    await waitFor(() => expect(screen.getByText('No matching changes')).toBeTruthy());
  });

  it('re-fetches with the filter query string on Apply', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('admin@demo.gh')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'masterdata' } });
    fireEvent.change(screen.getByLabelText('Actor'), { target: { value: 'nurse@demo.gh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith('/admin/audit/config?action=masterdata&actor=nurse%40demo.gh'),
    );
  });

  it('exports the current filters as a CSV download', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('admin@demo.gh')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Entity id'), { target: { value: 'fac_abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(mocks.downloadFile).toHaveBeenCalledWith('/admin/audit/config?entityId=fac_abc&format=csv', 'config-audit.csv'),
    );
  });
});
