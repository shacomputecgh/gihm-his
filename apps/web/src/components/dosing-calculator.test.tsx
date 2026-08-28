// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DosingCalculator from './DosingCalculator';

vi.mock('../lib/api', () => ({ api: vi.fn() }));

vi.mock('./ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import { api } from '../lib/api';

const mockDrugs = {
  items: [
    { id: 'd1', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'ANALGESIC', adultDose: '500mg-1g q6h', pediatricDose: '10-15mg/kg q4-6h', route: 'ORAL', frequency: 'q6h' },
  ],
};

describe('DosingCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api as any).mockResolvedValue(mockDrugs);
  });

  it('renders the dosing calculator', () => {
    render(<DosingCalculator />);
    expect(screen.getAllByText(/Dosing Calculator/).length).toBeGreaterThanOrEqual(1);
  });

  it('has drug search input', () => {
    render(<DosingCalculator />);
    expect(screen.getAllByPlaceholderText(/Search drug name/).length).toBeGreaterThanOrEqual(1);
  });

  it('has weight and age inputs', () => {
    render(<DosingCalculator />);
    expect(screen.getAllByPlaceholderText(/70/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText(/35/).length).toBeGreaterThanOrEqual(1);
  });

  it('has renal function selector with options', () => {
    render(<DosingCalculator />);
    expect(screen.getAllByText(/Normal \(eGFR/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Severe impairment/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Dialysis/).length).toBeGreaterThanOrEqual(1);
  });

  it('has Calculate dose button', () => {
    render(<DosingCalculator />);
    expect(screen.getAllByText('Calculate dose').length).toBeGreaterThanOrEqual(1);
  });

  it('loads drug list from API on mount', async () => {
    render(<DosingCalculator />);
    await waitFor(() => {
      expect(api).toHaveBeenCalledWith('/drugs?pageSize=500');
    });
  });

  it('shows dropdown when searching for a drug', async () => {
    render(<DosingCalculator />);
    const searchInputs = screen.getAllByPlaceholderText(/Search drug name/);
    fireEvent.change(searchInputs[0], { target: { value: 'Para' } });
    await waitFor(() => {
      expect(screen.getAllByText('Paracetamol').length).toBeGreaterThanOrEqual(1);
    });
  });
});
