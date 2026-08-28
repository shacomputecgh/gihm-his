// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Patients from './Patients';
import { Toaster } from '../../components/ui';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const patients = {
  items: [
    { id: 'p1', fullName: 'Kwame Asante', mrn: 'MRN-001', sex: 'Male', dateOfBirth: '1990-05-15T00:00:00.000Z', phone: '+233240000001', email: null, ghanaCard: 'GH-001', nhisNumber: null, allergies: [], documentsCount: 2, district: { name: 'Accra' }, createdAt: '2026-01-15T00:00:00.000Z' },
    { id: 'p2', fullName: 'Ama Mensah', mrn: 'MRN-002', sex: 'Female', dateOfBirth: '1985-08-20T00:00:00.000Z', phone: '+233240000002', email: null, ghanaCard: null, nhisNumber: 'NHIS-002', allergies: ['Penicillin'], documentsCount: 0, district: null, createdAt: '2026-02-10T00:00:00.000Z' },
    { id: 'p3', fullName: 'Kofi Obeng', mrn: 'MRN-003', sex: null, dateOfBirth: null, phone: null, email: null, ghanaCard: null, nhisNumber: null, allergies: [], documentsCount: 0, district: null, createdAt: '2026-03-01T00:00:00.000Z' },
  ],
  total: 3,
  page: 1,
  pageSize: 25,
  pages: 1,
};

const renderPatients = () => render(<Toaster><Patients /></Toaster>);

describe('Patients', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.api.mockResolvedValue(patients);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a loading spinner while searching', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderPatients();
    expect(screen.getByText(/Searching patient records/)).toBeTruthy();
  });

  it('renders the page header', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Patient Registry')).toBeTruthy();
    });
    expect(screen.getByText(/Search the Master Patient Index/)).toBeTruthy();
  });

  it('renders patient list with names and MRNs', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Kofi Obeng')).toBeTruthy();
    expect(screen.getByText('MRN-001')).toBeTruthy();
    expect(screen.getByText('MRN-002')).toBeTruthy();
  });

  it('renders patient badges (Ghana Card, NHIS, Allergy, Documents)', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    expect(screen.getAllByText('Ghana Card').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('NHIS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Allergy').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no patients match', async () => {
    mocks.api.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25, pages: 0 });
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeTruthy();
    });
  });

  it('shows empty state when API returns null', async () => {
    mocks.api.mockResolvedValue(null);
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeTruthy();
    });
  });

  it('has a register patient link', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Register patient')).toBeTruthy();
    });
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/app/register')).toBe(true);
  });

  it('renders patient links to detail page', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/app/patients/p1')).toBe(true);
  });

  it('shows "no phone" for patients without phone', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Kofi Obeng')).toBeTruthy();
    });
    expect(screen.getByText('no phone')).toBeTruthy();
  });

  it('shows district name when available', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Accra')).toBeTruthy();
    });
  });

  it('search input is present and functional', async () => {
    renderPatients();
    await waitFor(() => {
      expect(screen.getByText('Patient Registry')).toBeTruthy();
    });
    const searchInput = screen.getByPlaceholderText(/Search name/);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect((searchInput as HTMLInputElement).value).toBe('test');
  });
});
