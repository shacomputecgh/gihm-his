/**
 * Shared CSV export helper. Every cell is fully quoted, embedded quotes are
 * doubled, and spreadsheet formula injection is neutralized: a cell beginning
 * with = + - or @ gets a leading apostrophe so Excel/Sheets never evaluate it.
 */
export function toCsv(header: string[], rows: string[][]): string {
  const cell = (c: string): string => `"${String(c).replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\n');
}
