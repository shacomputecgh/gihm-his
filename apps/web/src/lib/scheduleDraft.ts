/**
 * Scheduled-report create-form derivation (docs/14 §5). The draft state is
 * empty until a field is touched, so every default must be derived from the
 * same source the UI displays — regressed in e2e/reports-schedules.spec.ts
 * when the day-of-month condition read draft.cadence directly and a default
 * create silently omitted dayOfMonth (API: "monthly schedules need
 * dayOfMonth 1–28").
 */

export interface ScheduleDraft {
  name?: string;
  reportType?: string;
  cadence?: string;
  runTime?: string;
  dayOfWeek?: string;
  dayOfMonth?: string;
  recipients?: string;
}

export interface ScheduleBody {
  name?: string;
  reportType: string;
  cadence: string;
  runTime: string;
  dayOfWeek: number | undefined;
  dayOfMonth: number | undefined;
  recipients?: string;
}

export const REPORT_TYPES = ['summary', 'completeness', 'anomalies'] as const;
export const CADENCES = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as const;

export function scheduleBody(draft: ScheduleDraft): ScheduleBody {
  // The cadence shown in the select is the effective one — draft.cadence is
  // undefined until the select is touched, so the day-of-week/day-of-month
  // conditions must use this default or a default-path create sends neither.
  const cadence = draft.cadence ?? 'monthly';
  return {
    name: draft.name,
    reportType: draft.reportType ?? 'summary',
    cadence,
    runTime: draft.runTime ?? '08:00',
    dayOfWeek: cadence === 'weekly' ? Number(draft.dayOfWeek ?? 1) : undefined,
    dayOfMonth: cadence === 'monthly' || cadence === 'quarterly' || cadence === 'annual' ? Number(draft.dayOfMonth ?? 1) : undefined,
    recipients: draft.recipients,
  };
}
