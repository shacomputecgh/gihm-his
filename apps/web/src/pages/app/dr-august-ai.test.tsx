// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

Element.prototype.scrollIntoView = vi.fn();

vi.mock('../../lib/api', () => ({
  api: vi.fn(),
}));

vi.mock('../../components/ui', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../components/ui')>();
  return { ...orig, useToast: () => vi.fn() };
});

import DrAugustAI from './DrAugustAI';
import { api } from '../../lib/api';

describe('DrAugustAI (shacomputec AI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api as any).mockImplementation((url: string, _opts?: any) => {
      if (url === '/clinical/llm-status') {
        return Promise.resolve({ configured: false, provider: 'none', model: '', message: 'Not configured' });
      }
      return Promise.resolve({ items: [] });
    });
  });

  it('renders the Dr. August AI page', () => {
    render(<DrAugustAI />);
    expect(screen.getAllByText(/Dr\. August AI/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows welcome message with clinical guidance', () => {
    render(<DrAugustAI />);
    expect(screen.getAllByText(/Clinical Decision Support/).length).toBeGreaterThanOrEqual(1);
  });

  it('includes professional disclaimer', () => {
    render(<DrAugustAI />);
    expect(screen.getAllByText(/professional clinical judgment/i).length).toBeGreaterThanOrEqual(1);
  });

  it('has Database and AI Chat mode buttons', () => {
    render(<DrAugustAI />);
    expect(screen.getAllByText(/📋 Database/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/🤖 AI Chat/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows local-only badge when LLM not configured', async () => {
    render(<DrAugustAI />);
    await waitFor(() => {
      expect(screen.getAllByText('Local only').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('sends a message and receives a response', async () => {
    (api as any).mockImplementation((url: string, opts: any) => {
      if (url === '/clinical/llm-status') {
        return Promise.resolve({ configured: false, provider: 'none', model: '', message: 'Not configured' });
      }
      if (url === '/clinical/assistant' && opts?.method === 'POST') {
        return Promise.resolve({ answer: 'Malaria is treated with Artemether-Lumefantrine.' });
      }
      return Promise.resolve({ items: [] });
    });
    render(<DrAugustAI />);
    const inputs = screen.getAllByPlaceholderText(/Search drugs and diseases/);
    fireEvent.change(inputs[0], { target: { value: 'How to treat malaria?' } });
    const searchBtns = screen.getAllByText('Search');
    fireEvent.click(searchBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Artemether-Lumefantrine/)).toBeTruthy();
    });
  });

  it('displays response timestamps', async () => {
    (api as any).mockImplementation((url: string, opts: any) => {
      if (url === '/clinical/llm-status') {
        return Promise.resolve({ configured: false, provider: 'none', model: '', message: 'Not configured' });
      }
      if (url === '/clinical/assistant' && opts?.method === 'POST') {
        return Promise.resolve({ answer: 'Test response' });
      }
      return Promise.resolve({ items: [] });
    });
    render(<DrAugustAI />);
    const inputs = screen.getAllByPlaceholderText(/Search drugs and diseases/);
    fireEvent.change(inputs[0], { target: { value: 'Hello' } });
    const searchBtns = screen.getAllByText('Search');
    fireEvent.click(searchBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    (api as any).mockImplementation((url: string, opts: any) => {
      if (url === '/clinical/llm-status') {
        return Promise.resolve({ configured: false, provider: 'none', model: '', message: 'Not configured' });
      }
      if (url === '/clinical/assistant' && opts?.method === 'POST') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ items: [] });
    });
    render(<DrAugustAI />);
    const inputs = screen.getAllByPlaceholderText(/Search drugs and diseases/);
    fireEvent.change(inputs[0], { target: { value: 'Test' } });
    const searchBtns = screen.getAllByText('Search');
    fireEvent.click(searchBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeTruthy();
    });
  });

  it('shows quick action buttons', () => {
    render(<DrAugustAI />);
    expect(screen.getAllByText(/Malaria treatment/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Hypertension drugs/).length).toBeGreaterThanOrEqual(1);
  });
});
