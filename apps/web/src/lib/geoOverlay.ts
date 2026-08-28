// ---------------------------------------------------------------------------
// GIS choropleth overlay (docs/14 §6) — the thematic area layer for the
// national map. There is no GeoJSON boundary data in the platform, so the
// honest choropleth substitute shades each region/district bubble by an
// indicator value: areas are aggregated from the in-scope facility points the
// map already serves (same scope filter, same cap disclosure) and positioned
// at the facility centroid (mean GPS). Values are split into quantile buckets
// so the legend always carries a balanced colour ramp. Pure functions — the
// GIS page renders what these compute.
// ---------------------------------------------------------------------------

import type { MapPoint } from '../types';

export const BUCKET_COUNT = 5;

export type OverlayKind = 'region' | 'district';
export type OverlayIndicator = 'activity30d' | 'bedCapacity' | 'facilities';

/** Sequential red ramp matching the platform theme — bucket 0 (lowest) to 4. */
export const CHOROPLETH_COLORS = ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#b91c1c'];

export interface AreaSummary {
  id: string;
  kind: OverlayKind;
  name: string;
  parentName: string | null;
  lat: number;
  lng: number;
  facilities: number;
  activity30d: number;
  bedCapacity: number;
}

/**
 * Group in-scope facility points into region/district summaries positioned at
 * the facility centroid (mean GPS of the area's points). Points without the
 * requested area (null regionId/districtId) are excluded — they cannot be
 * placed on the map. Aggregates the same scope-filtered payload the markers
 * render, so the choropleth always matches what the map is showing.
 */
export function aggregateAreas(points: MapPoint[], kind: OverlayKind): AreaSummary[] {
  const byId = new Map<string, AreaSummary>();
  for (const p of points) {
    const areaId = kind === 'region' ? p.regionId : p.districtId;
    if (!areaId) continue;
    const id = `${kind}-${areaId}`;
    const name = kind === 'region' ? p.region : p.district;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, {
        id,
        kind,
        name: name ?? areaId,
        parentName: kind === 'district' ? p.region : null,
        lat: p.lat,
        lng: p.lng,
        facilities: 1,
        activity30d: p.activity30d,
        bedCapacity: p.bedCapacity ?? 0,
      });
    } else {
      existing.facilities += 1;
      existing.activity30d += p.activity30d;
      existing.bedCapacity += p.bedCapacity ?? 0;
      existing.lat += p.lat;
      existing.lng += p.lng;
    }
  }
  const areas = [...byId.values()];
  for (const a of areas) {
    a.lat /= a.facilities;
    a.lng /= a.facilities;
  }
  return areas;
}

/** The indicator value of an area — the shading key. */
export function indicatorValue(a: AreaSummary, indicator: OverlayIndicator): number {
  return a[indicator];
}

/**
 * Quantile breaks for the indicator values: sorted values are split into
 * BUCKET_COUNT groups of (as close as possible) equal size, and each break is
 * the largest value of its group. With all-equal values (e.g. every area at
 * zero) every break is that value, so every area lands in bucket 0.
 */
export function quantileBreaks(values: number[]): number[] {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const size = Math.max(1, Math.ceil(sorted.length / BUCKET_COUNT));
  const breaks: number[] = [];
  for (let i = 0; i < BUCKET_COUNT; i++) {
    const idx = Math.min(sorted.length - 1, (i + 1) * size - 1);
    breaks.push(sorted[idx]!);
  }
  return breaks;
}

/** Bucket index (0..BUCKET_COUNT-1) for a value given the breaks. */
export function bucketOf(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]!) return i;
  }
  return breaks.length - 1;
}

/** How many values fall into each bucket. */
export function bucketCounts(values: number[], breaks: number[]): number[] {
  const counts = new Array<number>(BUCKET_COUNT).fill(0);
  for (const v of values) {
    const b = bucketOf(v, breaks);
    counts[b] = (counts[b] ?? 0) + 1;
  }
  return counts;
}

/** Display range [lo, hi] per bucket for the legend. */
export function bucketRanges(breaks: number[]): Array<{ lo: number; hi: number }> {
  const lo = (i: number) => (i === 0 ? 0 : breaks[i - 1]!);
  return breaks.map((hi, i) => ({ lo: lo(i), hi: hi! }));
}

/** Bubble radius (map px) for an area, scaled by its indicator value. */
export function radiusForArea(value: number, max: number): number {
  if (max <= 0) return 12;
  return 10 + (value / max) * 22;
}
