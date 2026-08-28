// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DrugDatabase from './DrugDatabase';

vi.mock('../../lib/api', () => ({
  api: vi.fn(),
}));

vi.mock('../../components/ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../components/ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import { api } from '../../lib/api';

const mockDrugs = {
  items: [
    {
      id: 'drug1',
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      brandNames: 'Panadol, Tylenol',
      category: 'ANALGESIC',
      dosageForm: 'TABLET',
      strength: '500mg',
      whoEssential: true,
      ghanaEssential: true,
      prescriptionOnly: false,
      otc: true,
      adultDose: '500mg - 1g q6h',
      route: 'ORAL',
      sideEffects: 'Nausea, rash',
      description: 'First-line analgesic',
    },
    {
      id: 'drug2',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin Trihydrate',
      category: 'ANTIBIOTIC',
      dosageForm: 'CAPSULE',
      strength: '500mg',
      whoEssential: true,
      ghanaEssential: true,
      prescriptionOnly: true,
      otc: false,
      adultDose: '500mg q8h',
      route: 'ORAL',
    },
  ],
};

const mockCategories = [
  { category: 'ANALGESIC', count: 10 },
  { category: 'ANTIBIOTIC', count: 15 },
];

function mockApi(url: string, _opts?: any) {
  if (url.startsWith('/drugs?')) return Promise.resolve(mockDrugs);
  if (url === '/drugs/categories/list') return Promise.resolve(mockCategories);
  if (url === '/drugs/drug1') return Promise.resolve({ ...mockDrugs.items[0], diseaseLinks: [] });
  return Promise.resolve({ items: [] });
}

describe('DrugDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api as any).mockImplementation(mockApi);
  });

  it('renders page header', async () => {
    render(<DrugDatabase />);
    expect(screen.getByText(/Drug Reference Database/)).toBeTruthy();
  });

  it('displays drugs in table', async () => {
    render(<DrugDatabase />);
    await waitFor(() => {
      expect(screen.getAllByText('Paracetamol').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Amoxicillin').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows WHO Essential badge', async () => {
    render(<DrugDatabase />);
    await waitFor(() => {
      const badges = screen.getAllByText('Yes');
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows drug count', async () => {
    render(<DrugDatabase />);
    await waitFor(() => {
      expect(screen.getAllByText(/2 drug\(s\) found/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens drug detail modal on click', async () => {
    render(<DrugDatabase />);
    await waitFor(() => expect(screen.getAllByText('Paracetamol').length).toBeGreaterThanOrEqual(1));
    // Click the View button for Paracetamol
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    await waitFor(() => {
      // In the modal, the drug name and description should appear
      expect(screen.getAllByText('First-line analgesic').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty state when no drugs found', async () => {
    (api as any).mockImplementation((url: string) => {
      if (url.startsWith('/drugs?')) return Promise.resolve({ items: [] });
      if (url === '/drugs/categories/list') return Promise.resolve([]);
      return Promise.resolve({ items: [] });
    });
    render(<DrugDatabase />);
    await waitFor(() => {
      expect(screen.getByText('No drugs found')).toBeTruthy();
    });
  });

  it('shows category filter options', async () => {
    render(<DrugDatabase />);
    await waitFor(() => {
      // The category dropdown should contain both categories
      expect(screen.getAllByText(/ANALGESIC/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/ANTIBIOTIC/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
