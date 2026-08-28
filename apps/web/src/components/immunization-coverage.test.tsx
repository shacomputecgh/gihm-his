// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ImmunizationCoverage from './ImmunizationCoverage';
import type { ImmunizationCoverage as Coverage } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  downloadFile: vi.fn(async () => {}),
}));

vi.mock('../lib/api', () => ({ api: mocks.api, downloadFile: mocks.downloadFile }));

const indicator = (key: string, label: string, coveragePct: number) => ({
  key,
  vaccine: key.split('_')[0] ?? key,
  dose: key.split('_')[1] ?? '',
  label,
  coveragePct,
  vaccinated: Math.round(coveragePct),
  eligible: 100,
});

const coverage = (over: Partial<Coverage> = {}): Coverage => ({
  scope: 'Korle Bu Teaching Hospital',
  indicators: [indicator('PENTA_1', 'Penta 1', 92), indicator('PENTA_3', 'Penta 3', 74), indicator('MR_1', 'MR 1', 55), indicator('OPV_2', 'OPV 2', 88)],
  dropoutRate: 12,
  fullyImmunized: { eligible: 100, vaccinated: 80, coveragePct: 80 },
  generatedAt: new Date().toISOString(),
  ...over,
});

beforeEach(() => {
  mocks.api.mockReset().mockResolvedValue(coverage());
  mocks.downloadFile.mockClear().mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('ImmunizationCoverage', () => {
  it('shows a spinner while loading', () => {
    render(<ImmunizationCoverage />);
    expect(screen.getByText('Loading coverage…')).toBeTruthy();
  });

  it('shows the empty state when no indicators exist', async () => {
    mocks.api.mockResolvedValue(coverage({ indicators: [] }));
    render(<ImmunizationCoverage />);
    await waitFor(() => expect(screen.getByText('No coverage data')).toBeTruthy());
  });

  it('renders every indicator with the dropout and fully-immunized headlines', async () => {
    render(<ImmunizationCoverage />);
    await waitFor(() => expect(screen.getByText('Penta 1')).toBeTruthy());
    expect(screen.getByText('Penta 3')).toBeTruthy();
    expect(screen.getByText('MR 1')).toBeTruthy();
    expect(screen.getByText('OPV 2')).toBeTruthy();
    expect(screen.getByText('12%')).toBeTruthy(); // dropout rate
    expect(screen.getByText(/80\/100 children/)).toBeTruthy();
    expect(mocks.api).toHaveBeenCalledWith('/immunizations/coverage');
  });

  it('compact mode shows only the headline indicators and the scope note', async () => {
    render(<ImmunizationCoverage compact />);
    await waitFor(() => expect(screen.getByText('Penta 1')).toBeTruthy());
    expect(screen.getByText('Penta 3')).toBeTruthy();
    expect(screen.getByText('MR 1')).toBeTruthy();
    expect(screen.queryByText('OPV 2')).toBeNull();
    expect(screen.getByText(/Korle Bu Teaching Hospital/)).toBeTruthy();
  });

  it('preview mode fetches with the draft schedule and shows the PREVIEW banner', async () => {
    const previewItems = [{ vaccine: 'PENTA', dose: '1', ageDays: 42, active: true }];
    render(<ImmunizationCoverage previewItems={previewItems} />);
    await waitFor(() => expect(mocks.api).toHaveBeenCalled());
    expect(mocks.api).toHaveBeenCalledWith(
      `/immunizations/coverage?previewItems=${encodeURIComponent(JSON.stringify(previewItems))}`,
    );
    await waitFor(() => expect(screen.getByText('PREVIEW')).toBeTruthy());
    // No export button in preview mode.
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
  });

  it('exports the coverage as a CSV download', async () => {
    render(<ImmunizationCoverage />);
    await waitFor(() => expect(screen.getByText('Penta 1')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(mocks.downloadFile).toHaveBeenCalledWith('/immunizations/export/coverage', 'immunization-coverage.csv'),
    );
  });
});
