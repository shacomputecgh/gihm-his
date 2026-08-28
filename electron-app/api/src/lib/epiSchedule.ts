import type { PrismaClient } from '@prisma/client';
import { GHANA_EPI_SCHEDULE, type ScheduleItem } from '../modules/immunization/schedule.js';

/**
 * Editable Ghana EPI schedule (docs/24). The default schedule lives in
 * schedule.ts; `EpiScheduleItem` rows override matching vaccine+dose entries,
 * so the schedule can be edited from the admin UI without code changes.
 *
 * Resolution: a row for "VACCINE|DOSE" wins; otherwise the built-in default.
 * `initEpiSchedule` loads rows at app boot; the admin API refreshes the overlay
 * after every edit. A fresh test DB has no rows, so existing tests keep seeing
 * the defaults exactly as before.
 */

let overlay = new Map<string, ScheduleItem>(); // active rows override defaults
let removed = new Set<string>(); // inactive rows explicitly drop the entry
let loaded = false;

/** Load (or reload) DB rows into the overlay. Called at app boot + after edits. */
export async function initEpiSchedule(db: PrismaClient): Promise<void> {
  const rows = await db.epiScheduleItem.findMany();
  overlay = new Map();
  removed = new Set();
  for (const r of rows) {
    const item: ScheduleItem = { vaccine: r.vaccine, dose: r.dose, label: r.label, description: r.description, ageDays: r.ageDays, intervalDays: r.intervalDays };
    if (r.active) overlay.set(`${r.vaccine}|${r.dose}`, item);
    else removed.add(`${r.vaccine}|${r.dose}`);
  }
  loaded = true;
}

/** The effective schedule (defaults, minus removed, plus overrides — default order). */
export function getSchedule(): ScheduleItem[] {
  const merged = new Map(GHANA_EPI_SCHEDULE.map((s) => [`${s.vaccine}|${s.dose}`, s]));
  if (loaded) {
    for (const k of removed) merged.delete(k);
    for (const [k, v] of overlay) merged.set(k, v);
  }
  return [...merged.values()];
}

export function scheduleItem(vaccine: string, dose: string): ScheduleItem | undefined {
  const k = `${vaccine}|${dose}`;
  if (loaded) {
    if (removed.has(k)) return undefined; // explicitly deactivated
    const v = overlay.get(k);
    if (v) return v;
  }
  return GHANA_EPI_SCHEDULE.find((s) => s.vaccine === vaccine && s.dose === dose);
}

/** Next dose of the same vaccine later in the schedule. */
export function nextScheduleItem(vaccine: string, dose: string): ScheduleItem | undefined {
  const list = getSchedule();
  const idx = list.findIndex((s) => s.vaccine === vaccine && s.dose === dose);
  if (idx === -1) return undefined;
  for (let i = idx + 1; i < list.length; i++) {
    if (list[i]!.vaccine === vaccine) return list[i];
  }
  return undefined;
}
