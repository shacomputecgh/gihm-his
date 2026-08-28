// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiseaseReference from './DiseaseReference';

vi.mock('../../lib/api', () => ({
  api: vi.fn(),
}));

vi.mock('../../components/ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../components/ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import { api } from '../../lib/api';

const mockDiseases = {
  items: [
    {
      id: 'dis1',
      name: 'Malaria',
      icdCode: 'B54',
      category: 'INFECTIOUS',
      subCategory: 'Vector-borne',
      type: 'PARASITIC',
      symptoms: 'Fever, chills, headache, sweating',
      severity: 'SEVERE',
      endemicToGhana: true,
      vaccineAvailable: true,
      prevention: 'Insecticide-treated nets',
    },
    {
      id: 'dis2',
      name: 'Hypertension',
      icdCode: 'I10',
      category: 'NON_COMMUNICABLE',
      type: 'METABOLIC',
      symptoms: 'Often asymptomatic, headache',
      severity: 'MODERATE',
      endemicToGhana: true,
      vaccineAvailable: false,
    },
  ],
};

const mockCategories = [
  { category: 'INFECTIOUS', count: 30 },
  { category: 'NON_COMMUNICABLE', count: 15 },
];

function mockApi(url: string) {
  if (url.startsWith('/diseases?')) return Promise.resolve(mockDiseases);
  if (url === '/diseases/categories/list') return Promise.resolve(mockCategories);
  if (url === '/diseases/dis1') return Promise.resolve({
    ...mockDiseases.items[0],
    transmission: 'Mosquito bite',
    diagnosis: 'Blood smear, RDT',
    complications: 'Cerebral malaria, death',
    drugLinks: [
      { id: 'link1', efficacy: 'FIRST_LINE', dosageNote: 'Per weight schedule', drug: { id: 'd1', name: 'Artemether-Lumefantrine', dosageForm: 'TABLET', route: 'ORAL' } },
    ],
  });
  return Promise.resolve({ items: [] });
}

describe('DiseaseReference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api as any).mockImplementation(mockApi);
  });

  it('renders page header', async () => {
    render(<DiseaseReference />);
    expect(screen.getByText(/Disease Reference/)).toBeTruthy();
  });

  it('displays disease cards', async () => {
    render(<DiseaseReference />);
    await waitFor(() => {
      expect(screen.getAllByText(/Malaria/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Hypertension/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows endemic badge', async () => {
    render(<DiseaseReference />);
    await waitFor(() => {
      const badges = screen.getAllByText('Endemic');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows vaccine badge', async () => {
    render(<DiseaseReference />);
    await waitFor(() => {
      expect(screen.getAllByText('Vaccine').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows severity badges', async () => {
    render(<DiseaseReference />);
    await waitFor(() => {
      expect(screen.getAllByText('SEVERE').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('MODERATE').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens disease detail modal on click', async () => {
    render(<DiseaseReference />);
    await waitFor(() => expect(screen.getAllByText(/Malaria/).length).toBeGreaterThanOrEqual(1));
    const malariaEl = screen.getAllByText(/Malaria/)[0];
    const card = malariaEl.closest('button');
    if (card) fireEvent.click(card);
    await waitFor(() => {
      expect(screen.getByText(/Artemether-Lumefantrine/)).toBeTruthy();
    });
  });

  it('shows empty state when no diseases found', async () => {
    (api as any).mockImplementation((url: string) => {
      if (url.startsWith('/diseases?')) return Promise.resolve({ items: [] });
      if (url === '/diseases/categories/list') return Promise.resolve([]);
      return Promise.resolve({ items: [] });
    });
    render(<DiseaseReference />);
    await waitFor(() => {
      expect(screen.getByText('No diseases found')).toBeTruthy();
    });
  });

  it('displays symptoms on disease cards', async () => {
    render(<DiseaseReference />);
    await waitFor(() => {
      expect(screen.getAllByText(/Fever, chills, headache/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
