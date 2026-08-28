// =====================================================================
// Ghana Expanded Programme on Immunization (EPI) schedule.
// Shared single source of truth for the API routes and the seed script.
//
// ageDays      = due age measured from date of birth (child doses)
// intervalDays = due offset measured from the previous dose (repeat/adult
//                doses such as tetanus boosters and HPV 2nd dose)
// ---------------------------------------------------------------------

export interface ScheduleItem {
  vaccine: string;
  dose: string;
  label: string;
  description: string;
  ageDays: number | null;
  intervalDays: number | null;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export const GHANA_EPI_SCHEDULE: ScheduleItem[] = [
  { vaccine: 'BCG', dose: '0', label: 'At birth', description: 'BCG (tuberculosis)', ageDays: 0, intervalDays: null },
  { vaccine: 'OPV', dose: '0', label: 'At birth', description: 'Polio (OPV) — birth dose', ageDays: 0, intervalDays: null },
  { vaccine: 'OPV', dose: '1', label: '6 weeks', description: 'Polio (OPV) — 1st dose', ageDays: 42, intervalDays: null },
  { vaccine: 'PENTA', dose: '1', label: '6 weeks', description: 'Pentavalent (DTP-HepB-Hib) — 1st dose', ageDays: 42, intervalDays: null },
  { vaccine: 'PCV', dose: '1', label: '6 weeks', description: 'Pneumococcal (PCV) — 1st dose', ageDays: 42, intervalDays: null },
  { vaccine: 'ROTA', dose: '1', label: '6 weeks', description: 'Rotavirus — 1st dose', ageDays: 42, intervalDays: null },
  { vaccine: 'OPV', dose: '2', label: '10 weeks', description: 'Polio (OPV) — 2nd dose', ageDays: 70, intervalDays: null },
  { vaccine: 'PENTA', dose: '2', label: '10 weeks', description: 'Pentavalent (DTP-HepB-Hib) — 2nd dose', ageDays: 70, intervalDays: null },
  { vaccine: 'PCV', dose: '2', label: '10 weeks', description: 'Pneumococcal (PCV) — 2nd dose', ageDays: 70, intervalDays: null },
  { vaccine: 'ROTA', dose: '2', label: '10 weeks', description: 'Rotavirus — 2nd dose', ageDays: 70, intervalDays: null },
  { vaccine: 'OPV', dose: '3', label: '14 weeks', description: 'Polio (OPV) — 3rd dose', ageDays: 98, intervalDays: null },
  { vaccine: 'PENTA', dose: '3', label: '14 weeks', description: 'Pentavalent (DTP-HepB-Hib) — 3rd dose', ageDays: 98, intervalDays: null },
  { vaccine: 'PCV', dose: '3', label: '14 weeks', description: 'Pneumococcal (PCV) — 3rd dose', ageDays: 98, intervalDays: null },
  { vaccine: 'IPV', dose: '1', label: '14 weeks', description: 'Inactivated polio (IPV)', ageDays: 98, intervalDays: null },
  { vaccine: 'MEASLES_RUBELLA', dose: '1', label: '9 months', description: 'Measles-rubella — 1st dose', ageDays: 273, intervalDays: null },
  { vaccine: 'YF', dose: '1', label: '9 months', description: 'Yellow fever', ageDays: 273, intervalDays: null },
  { vaccine: 'MEASLES_RUBELLA', dose: '2', label: '18 months', description: 'Measles-rubella — 2nd dose (booster)', ageDays: 548, intervalDays: null },
  { vaccine: 'HPV', dose: '1', label: '9 years (girls)', description: 'HPV — 1st dose', ageDays: 3287, intervalDays: null },
  { vaccine: 'HPV', dose: '2', label: '6 months after 1st', description: 'HPV — 2nd dose', ageDays: null, intervalDays: 180 },
  { vaccine: 'TT', dose: '1', label: 'First ANC visit', description: 'Tetanus toxoid — 1st dose', ageDays: null, intervalDays: null },
  { vaccine: 'TT', dose: '2', label: '4 weeks after 1st', description: 'Tetanus toxoid — 2nd dose', ageDays: null, intervalDays: 28 },
  { vaccine: 'TT', dose: '3', label: '6 months after 2nd', description: 'Tetanus toxoid — 3rd dose', ageDays: null, intervalDays: 180 },
  { vaccine: 'TT', dose: '4', label: '12 months after 3rd', description: 'Tetanus toxoid — 4th dose', ageDays: null, intervalDays: 365 },
  { vaccine: 'TT', dose: '5', label: '12 months after 4th', description: 'Tetanus toxoid — 5th dose', ageDays: null, intervalDays: 365 },
  { vaccine: 'COVID19', dose: '1', label: 'Adult (catch-up)', description: 'COVID-19 — 1st dose', ageDays: null, intervalDays: null },
  { vaccine: 'COVID19', dose: '2', label: '12 weeks after 1st', description: 'COVID-19 — 2nd dose', ageDays: null, intervalDays: 84 },
  { vaccine: 'COVID19', dose: '3', label: '6 months after 2nd', description: 'COVID-19 — booster', ageDays: null, intervalDays: 180 },
];

export function scheduleItem(vaccine: string, dose: string): ScheduleItem | undefined {
  return GHANA_EPI_SCHEDULE.find((s) => s.vaccine === vaccine && s.dose === dose);
}

/** Next dose of the same vaccine later in the schedule (the schedule is age-ordered, not per-vaccine grouped). */
export function nextScheduleItem(vaccine: string, dose: string): ScheduleItem | undefined {
  const idx = GHANA_EPI_SCHEDULE.findIndex((s) => s.vaccine === vaccine && s.dose === dose);
  if (idx === -1) return undefined;
  for (let i = idx + 1; i < GHANA_EPI_SCHEDULE.length; i++) {
    if (GHANA_EPI_SCHEDULE[i]!.vaccine === vaccine) return GHANA_EPI_SCHEDULE[i];
  }
  return undefined;
}
