// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Admissions from './Admissions';
import { Toaster } from '../../components/ui';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api', () => ({ api: mocks.api }));
vi.mock('../../lib/auth', () => ({ useAuth: mocks.useAuth }));

const user = {
  id: 'u1', email: 'admin@facility.gh', fullName: 'Admin User', roleCode: 'ADMIN',
  roleName: 'Admin', scope: 'FACILITY',  permissions: ['write_clinical_note', 'view_clinical_record'],
  organizationId: null, facilityId: 'f1', regionId: null, districtId: null,
  regionName: null, districtName: null, facilityName: 'Test Facility',
};

const admissions = {
  items: [
    { id: 'a1', patient: { id: 'p1', fullName: 'Kwame Asante', mrn: 'MRN-001' }, status: 'ADMITTED', admissionType: 'EMERGENCY', admissionDate: '2026-08-20T00:00:00.000Z', dischargeDate: null, ward: 'Emergency', bed: 'B-1', department: 'Emergency', paymentMethod: 'NHIS', notes: null },
    { id: 'a2', patient: { id: 'p2', fullName: 'Ama Mensah', mrn: 'MRN-002' }, status: 'DISCHARGED', admissionType: 'ELECTIVE', admissionDate: '2026-08-18T00:00:00.000Z', dischargeDate: '2026-08-20T00:00:00.000Z', ward: 'Surgical', bed: 'B-5', department: 'Surgery', paymentMethod: 'CASH', notes: null },
  ],
  total: 2,
  page: 1,
  pageSize: 25,
  pages: 1,
};

const renderAdmissions = () => render(<Toaster><Admissions /></Toaster>);

describe('Admissions', () => {
  beforeEach(() => {
    mocks.api.mockReset();
    mocks.useAuth.mockReturnValue({ user });
    mocks.api.mockResolvedValue(admissions);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the page header', async () => {
    renderAdmissions();
    await waitFor(() => {
      expect(screen.getByText('Admissions')).toBeTruthy();
    });
  });

  it('renders admission records with patient names', async () => {
    renderAdmissions();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThanOrEqual(1);
  });

  it('shows admission status badges', async () => {
    renderAdmissions();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    expect(screen.getAllByText('Admitted').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Discharged').length).toBeGreaterThanOrEqual(1);
  });

  it('shows ward and bed info', async () => {
    renderAdmissions();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    expect(screen.getAllByText('Emergency').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no admissions', async () => {
    mocks.api.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25, pages: 0 });
    renderAdmissions();
    await waitFor(() => {
      expect(screen.getAllByText(/No admissions/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('has a new admission button', async () => {
    renderAdmissions();
    await waitFor(() => {
      expect(screen.getByText('Kwame Asante')).toBeTruthy();
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons.some((b) => b.textContent?.toLowerCase().includes('new admission'))).toBe(true);
  });


});
