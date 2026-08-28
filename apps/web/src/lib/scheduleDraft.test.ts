import { describe, expect, it } from 'vitest';
import { scheduleBody } from './scheduleDraft';

/**
 * Regression tests for the default-path create bug (fixed in 584c8e9): the
 * draft is empty until a field is touched, so the derived body must always
 * carry the day-of-week/day-of-month the UI *shows* (Monthly selected, day 1)
 * — never silently omit them.
 */
describe('scheduleBody', () => {
  it('an untouched draft defaults to monthly with dayOfMonth 1 and no dayOfWeek', () => {
    expect(scheduleBody({})).toEqual({
      name: undefined,
      reportType: 'summary',
      cadence: 'monthly',
      runTime: '08:00',
      dayOfWeek: undefined,
      dayOfMonth: 1,
      recipients: undefined,
    });
  });

  it('preserves typed fields and drops the irrelevant day fields', () => {
    expect(
      scheduleBody({ name: 'Ops summary', cadence: 'daily', runTime: '17:30', recipients: 'ops@ghs.gov.gh' }),
    ).toEqual({
      name: 'Ops summary',
      reportType: 'summary',
      cadence: 'daily',
      runTime: '17:30',
      dayOfWeek: undefined,
      dayOfMonth: undefined,
      recipients: 'ops@ghs.gov.gh',
    });
  });

  it('weekly cadence derives dayOfWeek (default 1) and never dayOfMonth', () => {
    expect(scheduleBody({ cadence: 'weekly' })).toMatchObject({ cadence: 'weekly', dayOfWeek: 1, dayOfMonth: undefined });
    expect(scheduleBody({ cadence: 'weekly', dayOfWeek: '5' })).toMatchObject({ dayOfWeek: 5 });
  });

  it('monthly, quarterly and annual cadences derive dayOfMonth (default 1)', () => {
    for (const c of ['monthly', 'quarterly', 'annual'] as const) {
      expect(scheduleBody({ cadence: c })).toMatchObject({ cadence: c, dayOfMonth: 1, dayOfWeek: undefined });
    }
    expect(scheduleBody({ cadence: 'monthly', dayOfMonth: '14' })).toMatchObject({ dayOfMonth: 14 });
  });
});
