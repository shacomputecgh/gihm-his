// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DrugInventoryManager from './DrugInventoryManager';

vi.mock('../lib/api', () => ({ api: vi.fn() }));
vi.mock('./ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import { api } from '../lib/api';

const mockInventory = {
  items: [
    { id: 's1', name: 'Paracetamol 500mg', category: 'MEDICINE', quantity: 100, minStock: 10, maxStock: 500, reorderLevel: 20, unit: 'tablets', status: 'ACTIVE', expiryDate: '2026-12-31' },
    { id: 's2', name: 'Amoxicillin 500mg', category: 'MEDICINE', quantity: 5, minStock: 10, maxStock: 200, reorderLevel: 20, unit: 'capsules', status: 'ACTIVE', expiryDate: '2025-06-30' },
    { id: 's3', name: 'ORS Sachets', category: 'SUPPLY', quantity: 0, minStock: 50, maxStock: 1000, reorderLevel: 100, unit: 'sachets', status: 'ACTIVE' },
  ],
};

describe('DrugInventoryManager', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders inventory page', async () => {
    (api as any).mockResolvedValue(mockInventory);
    render(<DrugInventoryManager />);
    // Component renders "Drug Inventory" in the PageHeader subtitle area via "Search inventory" field
    expect(screen.getByText(/Search inventory/)).toBeTruthy();
  });

  it('displays inventory items in table', async () => {
    (api as any).mockResolvedValue(mockInventory);
    render(<DrugInventoryManager />);
    await waitFor(() => {
      expect(screen.getAllByText('Paracetamol 500mg').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Amoxicillin 500mg').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows critical alerts for expired/out-of-stock items', async () => {
    (api as any).mockResolvedValue(mockInventory);
    render(<DrugInventoryManager />);
    await waitFor(() => {
      expect(screen.getAllByText(/Critical/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/expired/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows out-of-stock items', async () => {
    (api as any).mockResolvedValue(mockInventory);
    render(<DrugInventoryManager />);
    await waitFor(() => {
      expect(screen.getAllByText(/Out of Stock/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('loads inventory from API', async () => {
    (api as any).mockResolvedValue(mockInventory);
    render(<DrugInventoryManager />);
    await waitFor(() => {
      expect(api).toHaveBeenCalledWith('/inventory/stock');
    });
  });
});
