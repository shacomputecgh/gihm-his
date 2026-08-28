// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/api', () => ({
  api: vi.fn(),
}));

vi.mock('./ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import DrugInteractionChecker from './DrugInteractionChecker';
import { api } from '../lib/api';

describe('DrugInteractionChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with two drug input fields', () => {
    render(<DrugInteractionChecker />);
    expect(screen.getAllByPlaceholderText(/Enter drug name/).length).toBe(2);
  });

  it('has Add drug and Check interactions buttons', () => {
    render(<DrugInteractionChecker />);
    expect(screen.getAllByText('+ Add drug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Check interactions').length).toBeGreaterThanOrEqual(1);
  });

  it('adds additional drug field on click', () => {
    render(<DrugInteractionChecker />);
    const initialCount = screen.getAllByPlaceholderText(/Enter drug name/).length;
    const addBtns = screen.getAllByText('+ Add drug');
    fireEvent.click(addBtns[addBtns.length - 1]);
    const newCount = screen.getAllByPlaceholderText(/Enter drug name/).length;
    expect(newCount).toBe(initialCount + 1);
  });

  it('shows safe result when no interactions', async () => {
    (api as any).mockResolvedValue({
      drugsChecked: ['Paracetamol', 'Amoxicillin'],
      notFound: [],
      interactions: [],
      warnings: [],
      totalInteractions: 0,
      totalWarnings: 0,
      safe: true,
    });
    render(<DrugInteractionChecker />);
    const inputs = screen.getAllByPlaceholderText(/Enter drug name/);
    fireEvent.change(inputs[0], { target: { value: 'Paracetamol' } });
    fireEvent.change(inputs[1], { target: { value: 'Amoxicillin' } });
    const checkBtns = screen.getAllByText('Check interactions');
    fireEvent.click(checkBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/No interactions found/)).toBeTruthy();
    });
  });

  it('shows interaction warning', async () => {
    (api as any).mockResolvedValue({
      drugsChecked: ['Ibuprofen', 'Aspirin'],
      notFound: [],
      interactions: [
        { drug1: 'Ibuprofen', drug2: 'Aspirin', severity: 'WARNING', description: 'Multiple NSAIDs increase GI bleeding risk' },
      ],
      warnings: [],
      totalInteractions: 1,
      totalWarnings: 0,
      safe: false,
    });
    render(<DrugInteractionChecker />);
    const inputs = screen.getAllByPlaceholderText(/Enter drug name/);
    fireEvent.change(inputs[0], { target: { value: 'Ibuprofen' } });
    fireEvent.change(inputs[1], { target: { value: 'Aspirin' } });
    const checkBtns = screen.getAllByText('Check interactions');
    fireEvent.click(checkBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/1 interaction/)).toBeTruthy();
      expect(screen.getByText(/Multiple NSAIDs/)).toBeTruthy();
    });
  });

  it('shows warnings for controlled substances', async () => {
    (api as any).mockResolvedValue({
      drugsChecked: ['Paracetamol', 'Tramadol'],
      notFound: [],
      interactions: [],
      warnings: ['📋 Tramadol is a controlled substance (SCHEDULE_4).'],
      totalInteractions: 0,
      totalWarnings: 1,
      safe: false,
    });
    render(<DrugInteractionChecker />);
    const inputs = screen.getAllByPlaceholderText(/Enter drug name/);
    fireEvent.change(inputs[0], { target: { value: 'Paracetamol' } });
    fireEvent.change(inputs[1], { target: { value: 'Tramadol' } });
    const checkBtns = screen.getAllByText('Check interactions');
    fireEvent.click(checkBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/controlled substance/)).toBeTruthy();
    });
  });

  it('shows not found drugs', async () => {
    (api as any).mockResolvedValue({
      drugsChecked: ['Paracetamol'],
      notFound: ['FakeDrug123'],
      interactions: [],
      warnings: [],
      totalInteractions: 0,
      totalWarnings: 0,
      safe: true,
    });
    render(<DrugInteractionChecker />);
    const inputs = screen.getAllByPlaceholderText(/Enter drug name/);
    fireEvent.change(inputs[0], { target: { value: 'Paracetamol' } });
    fireEvent.change(inputs[1], { target: { value: 'FakeDrug123' } });
    const checkBtns = screen.getAllByText('Check interactions');
    fireEvent.click(checkBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/FakeDrug123/)).toBeTruthy();
    });
  });
});
