// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BarcodeDrugScanner from './BarcodeDrugScanner';

vi.mock('../lib/api', () => ({ api: vi.fn() }));

vi.mock('./ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import { api } from '../lib/api';

describe('BarcodeDrugScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the barcode scanner', () => {
    render(<BarcodeDrugScanner />);
    expect(screen.getAllByText(/Barcode Drug Scanner/).length).toBeGreaterThanOrEqual(1);
  });

  it('has manual barcode input and buttons', () => {
    render(<BarcodeDrugScanner />);
    expect(screen.getAllByPlaceholderText(/Enter barcode/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Look up').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/📷 Scan/).length).toBeGreaterThanOrEqual(1);
  });

  it('performs barcode lookup', async () => {
    (api as any).mockResolvedValue({
      items: [{ id: 'd1', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'ANALGESIC' }],
    });
    render(<BarcodeDrugScanner />);
    const inputs = screen.getAllByPlaceholderText(/Enter barcode/);
    fireEvent.change(inputs[0]!, { target: { value: 'Paracetamol' } });
    const lookBtns = screen.getAllByText('Look up');
    fireEvent.click(lookBtns[0]!);
    await waitFor(() => {
      expect(screen.getByText(/Drug Match Found/)).toBeTruthy();
    });
  });

  it('shows no match for unknown barcode', async () => {
    (api as any).mockResolvedValue({ items: [] });
    render(<BarcodeDrugScanner />);
    const inputs = screen.getAllByPlaceholderText(/Enter barcode/);
    fireEvent.change(inputs[0]!, { target: { value: 'UNKNOWN123' } });
    const lookBtns = screen.getAllByText('Look up');
    fireEvent.click(lookBtns[0]!);
    await waitFor(() => {
      expect(screen.getByText(/No drug found/)).toBeTruthy();
    });
  });

  it('displays drug details when matched', async () => {
    (api as any).mockResolvedValue({
      items: [{
        id: 'd1', name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate',
        category: 'ANTIBIOTIC', dosageForm: 'CAPSULE', strength: '500mg',
        adultDose: '500mg q8h', sideEffects: 'Diarrhoea', pregnancyCategory: 'B',
      }],
    });
    render(<BarcodeDrugScanner />);
    const inputs = screen.getAllByPlaceholderText(/Enter barcode/);
    fireEvent.change(inputs[0]!, { target: { value: 'Amoxicillin' } });
    const lookBtns = screen.getAllByText('Look up');
    fireEvent.click(lookBtns[0]!);
    await waitFor(() => {
      expect(screen.getAllByText('Amoxicillin Trihydrate').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('500mg').length).toBeGreaterThanOrEqual(1);
    });
  });
});
