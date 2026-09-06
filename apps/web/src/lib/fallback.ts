/**
 * Fallback data for when the API backend is not available (e.g. on Vercel static hosting).
 * Loaded from /fallback-data.json which is bundled at build time.
 */

import type { Region, District, Facility, Page } from '../types';

type FallbackData = {
  regions: Region[];
  districts: District[];
  facilities: Facility[];
  facilityTotal: number;
};

let cache: FallbackData | null = null;

async function loadFallback(): Promise<FallbackData | null> {
  if (cache) return cache;
  try {
    const res = await fetch('/fallback-data.json');
    if (!res.ok) return null;
    // Static hosts rewrite unknown paths to the SPA shell (HTTP 200 + HTML).
    // Verify we actually got JSON before caching — otherwise every fallback
    // consumer would receive an HTML string and break downstream.
    const contentType = res.headers.get('content-type') ?? '';
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== 'object' || contentType.includes('text/html')) return null;
    const cand = parsed as { regions?: unknown[]; districts?: unknown[]; facilities?: unknown[] };
    if (!Array.isArray(cand.regions) || !Array.isArray(cand.districts) || !Array.isArray(cand.facilities)) return null;
    cache = cand as unknown as FallbackData;
    return cache;
  } catch {
    return null;
  }
}

/** Try the API first; if it fails (network/HTML response), fall back to static data. */
export async function apiWithFallback<T>(
  path: string,
  extract: (data: unknown) => T,
  fallbackExtract: (fb: NonNullable<Awaited<ReturnType<typeof loadFallback>>>) => T,
): Promise<T> {
  try {
    const { api } = await import('./api');
    const data = await api(path, { public: true });
    // Verify we got JSON, not HTML (Vercel SPA rewrite)
    if (typeof data === 'object' && data !== null && !('error' in data && typeof (data as Record<string,unknown>).error === 'string' && (data as Record<string,unknown>).error === 'NOT_FOUND')) {
      return extract(data);
    }
  } catch {
    // API unreachable — fall through to fallback
  }

  const fb = await loadFallback();
  if (fb) return fallbackExtract(fb);
  throw new Error('No data available');
}

export async function getRegionsFallback(): Promise<Region[]> {
  const fb = await loadFallback();
  return fb?.regions ?? [];
}

export async function getDistrictsFallback(regionId?: string): Promise<District[]> {
  const fb = await loadFallback();
  if (!fb) return [];
  if (regionId) return fb.districts.filter(d => d.regionId === regionId);
  return fb.districts;
}

export async function getFacilitiesFallback(query?: {
  q?: string; regionId?: string; districtId?: string; type?: string; ownership?: string;
  page?: number; pageSize?: number;
}): Promise<Page<Facility>> {
  const fb = await loadFallback();
  if (!fb) return { items: [], total: 0, pages: 0, page: 1, pageSize: 9 };
  
  let items = [...fb.facilities];
  
  if (query?.q) {
    const q = query.q.toLowerCase();
    items = items.filter(f => 
      (f.name ?? '').toLowerCase().includes(q) ||
      (String((f as unknown as Record<string, unknown>).districtName ?? '')).toLowerCase().includes(q) ||
      (String((f as unknown as Record<string, unknown>).regionName ?? '')).toLowerCase().includes(q)
    );
  }
  if (query?.regionId) {
    items = items.filter(f => f.regionId === query.regionId);
  }
  if (query?.districtId) {
    items = items.filter(f => f.districtId === query.districtId);
  }
  if (query?.type) {
    items = items.filter(f => f.type === query.type);
  }
  if (query?.ownership) {
    items = items.filter(f => f.ownership === query.ownership);
  }
  
  const total = items.length;
  const pageSize = query?.pageSize ?? 9;
  const page = query?.page ?? 1;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  
  return {
    items: items.slice(start, start + pageSize),
    total,
    pages,
    page,
    pageSize,
  };
}
