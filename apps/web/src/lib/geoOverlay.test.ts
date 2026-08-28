import { describe, it, expect } from 'vitest';
import {
  aggregateAreas,
  bucketCounts,
  bucketOf,
  bucketRanges,
  indicatorValue,
  quantileBreaks,
  radiusForArea,
  type AreaSummary,
} from './geoOverlay';
import type { MapPoint } from '../types';

function point(over: Partial<MapPoint>): MapPoint {
  return {
    id: 'f1',
    code: 'F1',
    name: 'Facility 1',
    type: 'HEALTH_CENTRE',
    level: null,
    ownership: 'GHS',
    operationalStatus: 'OPERATIONAL',
    bedCapacity: 10,
    lat: 5.5,
    lng: -0.2,
    regionId: 'r1',
    region: 'Greater Accra',
    districtId: 'd1',
    district: 'Accra Metropolitan',
    activity30d: 0,
    ...over,
  };
}

describe('aggregateAreas', () => {
  it('groups points per region and averages the centroid', () => {
    const areas = aggregateAreas(
      [
        point({ id: 'a', lat: 5.0, lng: -0.1, activity30d: 4, bedCapacity: 20 }),
        point({ id: 'b', lat: 6.0, lng: -0.3, activity30d: 8, bedCapacity: 30 }),
      ],
      'region',
    );
    expect(areas).toHaveLength(1);
    const r = areas[0]!;
    expect(r.name).toBe('Greater Accra');
    expect(r.kind).toBe('region');
    expect(r.facilities).toBe(2);
    expect(r.activity30d).toBe(12);
    expect(r.bedCapacity).toBe(50);
    expect(r.lat).toBeCloseTo(5.5);
    expect(r.lng).toBeCloseTo(-0.2);
  });

  it('aggregates per district with the parent region name', () => {
    const areas = aggregateAreas(
      [
        point({ districtId: 'd1', district: 'Accra Metropolitan' }),
        point({ districtId: 'd2', district: 'Tema', region: 'Greater Accra' }),
      ],
      'district',
    );
    expect(areas.map((a) => a.name).sort()).toEqual(['Accra Metropolitan', 'Tema']);
    const tema = areas.find((a) => a.name === 'Tema')!;
    expect(tema.parentName).toBe('Greater Accra');
  });

  it('excludes points without the requested area', () => {
    const areas = aggregateAreas([point({ regionId: null, region: null })], 'region');
    expect(areas).toHaveLength(0);
  });
});

describe('quantileBreaks / bucketOf', () => {
  it('splits a spread of values into five balanced buckets', () => {
    const values = [0, 0, 0, 5, 10, 12, 30, 60, 100, 200];
    const breaks = quantileBreaks(values);
    expect(breaks).toHaveLength(5);
    // 10 values / 5 buckets → 2 per group, breaks are the max of each group.
    expect(breaks).toEqual([0, 5, 12, 60, 200]);
    expect(bucketOf(0, breaks)).toBe(0);
    expect(bucketOf(5, breaks)).toBe(1);
    expect(bucketOf(12, breaks)).toBe(2);
    expect(bucketOf(60, breaks)).toBe(3);
    expect(bucketOf(100, breaks)).toBe(4);
    expect(bucketOf(999, breaks)).toBe(4);
    const counts = bucketCounts(values, breaks);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it('keeps every value in bucket 0 when they are all equal (e.g. all zero)', () => {
    const breaks = quantileBreaks([0, 0, 0, 0]);
    expect(breaks).toEqual([0, 0, 0, 0, 0]);
    expect(bucketOf(0, breaks)).toBe(0);
    expect(bucketCounts([0, 0, 0, 0], breaks)).toEqual([4, 0, 0, 0, 0]);
  });

  it('returns empty breaks for no values', () => {
    expect(quantileBreaks([])).toEqual([]);
  });
});

describe('bucketRanges / radiusForArea', () => {
  it('derives legend ranges from the breaks', () => {
    expect(bucketRanges([0, 5, 12, 60, 200])).toEqual([
      { lo: 0, hi: 0 },
      { lo: 0, hi: 5 },
      { lo: 5, hi: 12 },
      { lo: 12, hi: 60 },
      { lo: 60, hi: 200 },
    ]);
  });

  it('scales radius with the value up to a maximum', () => {
    expect(radiusForArea(0, 100)).toBe(10);
    expect(radiusForArea(50, 100)).toBe(21);
    expect(radiusForArea(100, 100)).toBe(32);
    expect(radiusForArea(50, 0)).toBe(12); // no spread → fixed size
  });
});

describe('indicatorValue', () => {
  it('reads the requested indicator', () => {
    const a: AreaSummary = { id: 'r1', kind: 'region', name: 'X', parentName: null, lat: 1, lng: 1, facilities: 3, activity30d: 9, bedCapacity: 40 };
    expect(indicatorValue(a, 'activity30d')).toBe(9);
    expect(indicatorValue(a, 'bedCapacity')).toBe(40);
    expect(indicatorValue(a, 'facilities')).toBe(3);
  });
});
