import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  scopeLabel,
  cedis,
  fmtDate,
  fmtDateTime,
  fmtBytes,
  fmtTime,
  ageFromDob,
  todayIso,
  titleCase,
} from './format';

// scopeLabel powers the named-scope display on the Reports and GIS pages (and
// the directorate/dashboard pattern): "Kumasi Metropolitan (District)" instead
// of a bare "District". docs/22 Phase 5, docs/14 §6a.
describe('scopeLabel', () => {
  it('names a facility-scope caller by facility', () => {
    expect(scopeLabel('FACILITY', { facilityName: 'Korle-Bu Teaching Hospital (DEMO)' })).toBe('Korle-Bu Teaching Hospital (DEMO) (Facility)');
  });

  it('names a regional-scope caller by region', () => {
    expect(scopeLabel('REGIONAL', { regionName: 'Ashanti' })).toBe('Ashanti (Regional)');
  });

  it('names a district-scope caller by district, falling back to the region', () => {
    expect(scopeLabel('DISTRICT', { districtName: 'Kumasi Metropolitan', regionName: 'Ashanti' })).toBe('Kumasi Metropolitan (District)');
    expect(scopeLabel('DISTRICT', { regionName: 'Ashanti' })).toBe('Ashanti (District)');
  });

  it('prefers the facility name when a facility user also holds region/district ids', () => {
    expect(scopeLabel('FACILITY', { facilityName: 'Lister Private Hospital (DEMO)', regionName: 'Ashanti', districtName: 'Kumasi Metropolitan' })).toBe('Lister Private Hospital (DEMO) (Facility)');
  });

  it('renders a bare level when the scope has no name (national, or unnamed user)', () => {
    expect(scopeLabel('NATIONAL', {})).toBe('National');
    expect(scopeLabel('FACILITY', {})).toBe('Facility');
    expect(scopeLabel('REGIONAL', { regionName: null })).toBe('Regional');
  });

  it('renders an em dash for a missing scope', () => {
    expect(scopeLabel(null, {})).toBe('—');
    expect(scopeLabel(undefined, {})).toBe('—');
  });
});

describe('currency and numbers', () => {
  it('cedis formats with the GH₵ symbol and two decimals', () => {
    expect(cedis(12.5)).toBe('GH₵ 12.50');
    expect(cedis(0)).toBe('GH₵ 0.00');
    expect(cedis(1234.567)).toBe('GH₵ 1,234.57');
  });

  it('cedis treats nullish as zero', () => {
    expect(cedis(null)).toBe('GH₵ 0.00');
    expect(cedis(undefined)).toBe('GH₵ 0.00');
  });

  it('fmtBytes picks B, KB and MB by magnitude', () => {
    expect(fmtBytes(512)).toBe('512 B');
    expect(fmtBytes(2048)).toBe('2.0 KB');
    expect(fmtBytes(5 * 1024 * 1024)).toBe('5.00 MB');
    expect(fmtBytes(null)).toBe('—');
    expect(fmtBytes(undefined)).toBe('—');
  });
});

describe('dates and times', () => {
  const ISO = '2026-08-17T10:00:00.000Z';

  it('fmtDate renders a short date and dashes for nullish', () => {
    expect(fmtDate(ISO)).toContain('Aug');
    expect(fmtDate(ISO)).toContain('2026');
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate(undefined)).toBe('—');
  });

  it('fmtDateTime adds the time', () => {
    expect(fmtDateTime(ISO)).toContain('Aug');
    expect(fmtDateTime(ISO)).toMatch(/\d{2}:\d{2}/);
    expect(fmtDateTime(null)).toBe('—');
  });

  it('fmtTime renders just the time', () => {
    expect(fmtTime(ISO)).toMatch(/\d{2}:\d{2}/);
    expect(fmtTime(null)).toBe('—');
  });

  it('ageFromDob reports years for adults and months for infants', () => {
    vi.setSystemTime(new Date('2026-08-17T10:00:00.000Z'));
    expect(ageFromDob('2000-01-15')).toBe('26 yrs');
    expect(ageFromDob('2026-06-01')).toBe('2 mo');
    expect(ageFromDob(null)).toBe('—');
  });

  it('todayIso returns the current UTC date', () => {
    vi.setSystemTime(new Date('2026-08-17T10:00:00.000Z'));
    expect(todayIso()).toBe('2026-08-17');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('titleCase', () => {
  it('capitalizes words and turns underscores into spaces', () => {
    expect(titleCase('LAB_TECH')).toBe('Lab Tech');
    expect(titleCase('operational')).toBe('Operational');
    expect(titleCase('OPD')).toBe('Opd');
    expect(titleCase(null)).toBe('—');
    expect(titleCase(undefined)).toBe('—');
  });
});
