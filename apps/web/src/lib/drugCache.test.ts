// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedDrugs, setCachedDrugs, getCachedDiseases, setCachedDiseases,
  isCacheStale, getCacheInfo, clearCache,
  searchCachedDrugs, searchCachedDiseases,
  getCachedDrugById, getCachedDiseaseById,
  getCachedDrugsByCategory, getCachedEndemicDiseases,
  getCachedDrugCategories, getCachedDiseaseCategories,
  prefetchCache,
} from './drugCache';

const mockDrugs = [
  { id: 'd1', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'ANALGESIC', whoEssential: true },
  { id: 'd2', name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', category: 'ANTIBIOTIC', whoEssential: true },
  { id: 'd3', name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'ANALGESIC', whoEssential: true },
];

const mockDiseases = [
  { id: 'dis1', name: 'Malaria', icdCode: 'B54', category: 'INFECTIOUS', endemicToGhana: true, symptoms: 'Fever, chills' },
  { id: 'dis2', name: 'Hypertension', icdCode: 'I10', category: 'NON_COMMUNICABLE', endemicToGhana: true },
];

describe('drugCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty cache', () => {
    expect(getCachedDrugs()).toBeNull();
    expect(getCachedDiseases()).toBeNull();
    expect(isCacheStale()).toBe(true);
  });

  it('stores and retrieves drugs', () => {
    setCachedDrugs(mockDrugs);
    const cached = getCachedDrugs();
    expect(cached).toBeTruthy();
    expect(cached!.length).toBe(3);
    expect(cached![0].name).toBe('Paracetamol');
  });

  it('stores and retrieves diseases', () => {
    setCachedDiseases(mockDiseases);
    const cached = getCachedDiseases();
    expect(cached).toBeTruthy();
    expect(cached!.length).toBe(2);
    expect(cached![0].name).toBe('Malaria');
  });

  it('reports cache info', () => {
    expect(getCacheInfo().drugsCached).toBe(false);
    setCachedDrugs(mockDrugs);
    const info = getCacheInfo();
    expect(info.drugsCached).toBe(true);
    expect(info.lastUpdated).toBeTruthy();
  });

  it('clears cache', () => {
    setCachedDrugs(mockDrugs);
    setCachedDiseases(mockDiseases);
    clearCache();
    expect(getCachedDrugs()).toBeNull();
    expect(getCachedDiseases()).toBeNull();
  });

  it('searches drugs by name', () => {
    setCachedDrugs(mockDrugs);
    expect(searchCachedDrugs('Paracetamol')).toHaveLength(1);
    expect(searchCachedDrugs('amox')).toHaveLength(1);
    expect(searchCachedDrugs('xyz')).toHaveLength(0);
  });

  it('searches diseases by name', () => {
    setCachedDiseases(mockDiseases);
    expect(searchCachedDiseases('Malaria')).toHaveLength(1);
    expect(searchCachedDiseases('B54')).toHaveLength(1);
    expect(searchCachedDiseases('xyz')).toHaveLength(0);
  });

  it('gets drug by ID', () => {
    setCachedDrugs(mockDrugs);
    expect(getCachedDrugById('d1')?.name).toBe('Paracetamol');
    expect(getCachedDrugById('nonexistent')).toBeNull();
  });

  it('gets disease by ID', () => {
    setCachedDiseases(mockDiseases);
    expect(getCachedDiseaseById('dis1')?.name).toBe('Malaria');
    expect(getCachedDiseaseById('nonexistent')).toBeNull();
  });

  it('filters drugs by category', () => {
    setCachedDrugs(mockDrugs);
    const analgesics = getCachedDrugsByCategory('ANALGESIC');
    expect(analgesics).toHaveLength(2);
  });

  it('filters endemic diseases', () => {
    setCachedDiseases(mockDiseases);
    const endemic = getCachedEndemicDiseases();
    expect(endemic).toHaveLength(2);
  });

  it('gets drug categories with counts', () => {
    setCachedDrugs(mockDrugs);
    const cats = getCachedDrugCategories();
    expect(cats.length).toBeGreaterThanOrEqual(2);
    const analgesicCat = cats.find((c) => c.category === 'ANALGESIC');
    expect(analgesicCat?.count).toBe(2);
  });

  it('gets disease categories with counts', () => {
    setCachedDiseases(mockDiseases);
    const cats = getCachedDiseaseCategories();
    expect(cats.length).toBeGreaterThanOrEqual(2);
  });

  it('prefetches cache from API', async () => {
    const mockApi = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/drugs')) return Promise.resolve({ items: mockDrugs });
      if (url.includes('/diseases')) return Promise.resolve({ items: mockDiseases });
      return Promise.resolve({ items: [] });
    });
    await prefetchCache(mockApi);
    expect(getCachedDrugs()).toEqual(mockDrugs);
    expect(getCachedDiseases()).toEqual(mockDiseases);
  });

  it('handles prefetch API failure gracefully', async () => {
    const mockApi = vi.fn().mockRejectedValue(new Error('Network error'));
    await prefetchCache(mockApi);
    expect(getCachedDrugs()).toBeNull();
  });

  it('returns empty results for empty cache', () => {
    expect(searchCachedDrugs('test')).toHaveLength(0);
    expect(searchCachedDiseases('test')).toHaveLength(0);
    expect(getCachedDrugsByCategory('ANALGESIC')).toHaveLength(0);
    expect(getCachedEndemicDiseases()).toHaveLength(0);
    expect(getCachedDrugCategories()).toHaveLength(0);
    expect(getCachedDiseaseCategories()).toHaveLength(0);
  });
});
