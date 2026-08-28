// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { exportDrugsPDF, exportDiseasesPDF, exportFullPDF } from './drugPdfExport';

const mockDrugs = [
  { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'ANALGESIC', adultDose: '500mg q6h', whoEssential: true, ghanaEssential: true, prescriptionOnly: false },
  { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'ANTIBIOTIC', adultDose: '500mg q8h', whoEssential: true, ghanaEssential: true, prescriptionOnly: true },
];

const mockDiseases = [
  { name: 'Malaria', icdCode: 'B54', category: 'INFECTIOUS', severity: 'SEVERE', endemicToGhana: true, vaccineAvailable: true, symptoms: 'Fever, chills' },
];

describe('drugPdfExport', () => {
  it('exportDrugsPDF opens a print window', () => {
    const mockWrite = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: mockWrite, close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    } as any);
    exportDrugsPDF(mockDrugs, 'Test Card');
    expect(window.open).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
    const html = mockWrite.mock.calls[0][0] as string;
    expect(html).toContain('Paracetamol');
    expect(html).toContain('Amoxicillin');
    expect(html).toContain('Test Card');
    vi.restoreAllMocks();
  });

  it('exportDiseasesPDF opens a print window', () => {
    const mockWrite = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: mockWrite, close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    } as any);
    exportDiseasesPDF(mockDiseases);
    const html = mockWrite.mock.calls[0][0] as string;
    expect(html).toContain('Malaria');
    expect(html).toContain('Disease Reference');
    vi.restoreAllMocks();
  });

  it('exportFullPDF includes both drugs and diseases', () => {
    const mockWrite = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: mockWrite, close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    } as any);
    exportFullPDF(mockDrugs, mockDiseases);
    const html = mockWrite.mock.calls[0][0] as string;
    expect(html).toContain('Paracetamol');
    expect(html).toContain('Malaria');
    expect(html).toContain('GIHM-HIS');
    vi.restoreAllMocks();
  });

  it('handles window.open failure gracefully', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    expect(() => exportDrugsPDF(mockDrugs)).not.toThrow();
    vi.restoreAllMocks();
  });

  it('includes disclaimer in output', () => {
    const mockWrite = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: mockWrite, close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    } as any);
    exportDrugsPDF(mockDrugs);
    const html = mockWrite.mock.calls[0][0] as string;
    expect(html).toContain('clinical reference only');
    expect(html).toContain('Dr. August');
    vi.restoreAllMocks();
  });
});
