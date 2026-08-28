// =====================================================================
// Offline-first drug/disease database cache
// Stores reference data in localStorage for offline access in rural clinics
// =====================================================================

const DRUG_CACHE_KEY = 'gihm_drug_cache';
const DISEASE_CACHE_KEY = 'gihm_disease_cache';
const CACHE_VERSION_KEY = 'gihm_cache_version';
const CACHE_EXPIRY_HOURS = 24;
const CURRENT_VERSION = 1;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  if (entry.version !== CURRENT_VERSION) return false;
  const ageMs = Date.now() - entry.timestamp;
  return ageMs < CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
}

function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (!isCacheValid(entry)) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CURRENT_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function getCachedDrugs(): any[] | null {
  return getFromCache<any[]>(DRUG_CACHE_KEY);
}

export function setCachedDrugs(drugs: any[]): void {
  setToCache(DRUG_CACHE_KEY, drugs);
}

export function getCachedDiseases(): any[] | null {
  return getFromCache<any[]>(DISEASE_CACHE_KEY);
}

export function setCachedDiseases(diseases: any[]): void {
  setToCache(DISEASE_CACHE_KEY, diseases);
}

export function isCacheStale(): boolean {
  const drugs = getFromCache<any[]>(DRUG_CACHE_KEY);
  const diseases = getFromCache<any[]>(DISEASE_CACHE_KEY);
  return !drugs || !diseases;
}

export function getCacheInfo(): { drugsCached: boolean; diseasesCached: boolean; lastUpdated: string | null } {
  try {
    const drugRaw = localStorage.getItem(DRUG_CACHE_KEY);
    const diseaseRaw = localStorage.getItem(DISEASE_CACHE_KEY);
    const drugEntry = drugRaw ? JSON.parse(drugRaw) : null;
    const diseaseEntry = diseaseRaw ? JSON.parse(diseaseRaw) : null;
    return {
      drugsCached: isCacheValid(drugEntry),
      diseasesCached: isCacheValid(diseaseEntry),
      lastUpdated: drugEntry ? new Date(drugEntry.timestamp).toISOString() : null,
    };
  } catch {
    return { drugsCached: false, diseasesCached: false, lastUpdated: null };
  }
}

export function clearCache(): void {
  localStorage.removeItem(DRUG_CACHE_KEY);
  localStorage.removeItem(DISEASE_CACHE_KEY);
  localStorage.removeItem(CACHE_VERSION_KEY);
}

/**
 * Search drugs from cache (offline-capable)
 */
export function searchCachedDrugs(query: string): any[] {
  const drugs = getCachedDrugs();
  if (!drugs) return [];
  const q = query.toLowerCase();
  return drugs.filter((d: any) =>
    d.name?.toLowerCase().includes(q) ||
    d.genericName?.toLowerCase().includes(q) ||
    d.brandNames?.toLowerCase().includes(q) ||
    d.description?.toLowerCase().includes(q) ||
    d.category?.toLowerCase().includes(q)
  );
}

/**
 * Search diseases from cache (offline-capable)
 */
export function searchCachedDiseases(query: string): any[] {
  const diseases = getCachedDiseases();
  if (!diseases) return [];
  const q = query.toLowerCase();
  return diseases.filter((d: any) =>
    d.name?.toLowerCase().includes(q) ||
    d.icdCode?.toLowerCase().includes(q) ||
    d.symptoms?.toLowerCase().includes(q) ||
    d.category?.toLowerCase().includes(q)
  );
}

/**
 * Get cached drug by ID
 */
export function getCachedDrugById(id: string): any | null {
  const drugs = getCachedDrugs();
  if (!drugs) return null;
  return drugs.find((d: any) => d.id === id) ?? null;
}

/**
 * Get cached disease by ID
 */
export function getCachedDiseaseById(id: string): any | null {
  const diseases = getCachedDiseases();
  if (!diseases) return null;
  return diseases.find((d: any) => d.id === id) ?? null;
}

/**
 * Get all cached drugs by category
 */
export function getCachedDrugsByCategory(category: string): any[] {
  const drugs = getCachedDrugs();
  if (!drugs) return [];
  return drugs.filter((d: any) => d.category === category);
}

/**
 * Get all cached diseases endemic to Ghana
 */
export function getCachedEndemicDiseases(): any[] {
  const diseases = getCachedDiseases();
  if (!diseases) return [];
  return diseases.filter((d: any) => d.endemicToGhana);
}

/**
 * Get cached drug categories with counts
 */
export function getCachedDrugCategories(): Array<{ category: string; count: number }> {
  const drugs = getCachedDrugs();
  if (!drugs) return [];
  const counts = new Map<string, number>();
  for (const d of drugs) {
    counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get cached disease categories with counts
 */
export function getCachedDiseaseCategories(): Array<{ category: string; count: number }> {
  const diseases = getCachedDiseases();
  if (!diseases) return [];
  const counts = new Map<string, number>();
  for (const d of diseases) {
    counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Pre-cache all drug and disease data from API
 */
export async function prefetchCache(apiFn: (url: string) => Promise<any>): Promise<void> {
  try {
    const [drugsRes, diseasesRes] = await Promise.all([
      apiFn('/drugs?pageSize=500'),
      apiFn('/diseases?pageSize=500'),
    ]);
    if (drugsRes?.items) setCachedDrugs(drugsRes.items);
    if (diseasesRes?.items) setCachedDiseases(diseasesRes.items);
  } catch {
    // Offline or API error — cache remains as-is
  }
}
