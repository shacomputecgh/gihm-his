/**
 * Shared application constants.
 *
 * OUTBREAK_THRESHOLD — the minimum number of open cases for a single disease
 * that triggers the outbreak alert.  District/regional dashboards and the
 * facility-level Surveillance register all use this value so alerts are
 * consistent across the app.  Change it here to adjust globally.
 */
const OUTBREAK_THRESHOLD_KEY = 'gihm_outbreak_threshold';
const DEFAULT_OUTBREAK_THRESHOLD = 3;

/** Minimum open cases to trigger an outbreak alert. Stored in localStorage. */
export function getOutbreakThreshold(): number {
  try {
    const raw = localStorage.getItem(OUTBREAK_THRESHOLD_KEY);
    if (!raw) return DEFAULT_OUTBREAK_THRESHOLD;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 && n <= 100 ? n : DEFAULT_OUTBREAK_THRESHOLD;
  } catch {
    return DEFAULT_OUTBREAK_THRESHOLD;
  }
}

/** Set the outbreak threshold (persisted to localStorage). */
export function setOutbreakThreshold(n: number): void {
  try {
    localStorage.setItem(OUTBREAK_THRESHOLD_KEY, String(n));
  } catch { /* best effort */ }
}

/**
 * Export a list of objects as a CSV file download.
 *
 * @param rows - Array of objects to export.  Keys become headers.
 * @param filename - Name of the downloaded file (without extension).
 */
export function exportCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = r[h];
        const str = val === null || val === undefined ? '' : String(val);
        // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
