// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClinicalGuidelines from './ClinicalGuidelines';

vi.mock('../../lib/api', () => ({ api: vi.fn() }));
vi.mock('../../components/ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../components/ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

describe('ClinicalGuidelines', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the guidelines page header', () => {
    render(<ClinicalGuidelines />);
    expect(screen.getAllByText(/Clinical Guidelines/).length).toBeGreaterThanOrEqual(1);
  });

  it('displays guideline cards for common conditions', () => {
    render(<ClinicalGuidelines />);
    expect(screen.getAllByText(/Uncomplicated Malaria/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Pulmonary Tuberculosis/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Cholera Management/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Childhood Pneumonia/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows severity badges on guidelines', () => {
    render(<ClinicalGuidelines />);
    expect(screen.getAllByText('MODERATE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SEVERE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('LIFE THREATENING').length).toBeGreaterThanOrEqual(1);
  });

  it('expands guideline details on click', () => {
    render(<ClinicalGuidelines />);
    const malariaButtons = screen.getAllByText(/Uncomplicated Malaria/);
    fireEvent.click(malariaButtons[0]);
    expect(screen.getAllByText(/First-Line Treatment/).length).toBeGreaterThanOrEqual(1);
  });

  it('has search input and category filter', () => {
    render(<ClinicalGuidelines />);
    expect(screen.getAllByPlaceholderText(/Search by condition/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/All categories/).length).toBeGreaterThanOrEqual(1);
  });
});
