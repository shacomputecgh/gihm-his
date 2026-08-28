import { httpErrors } from './http.js';

export function str(v: unknown, field: string, opts: { required?: boolean; max?: number } = {}): string {
  if (v === undefined || v === null || v === '') {
    if (opts.required) throw httpErrors.badRequest(`Field "${field}" is required`);
    return '';
  }
  if (typeof v !== 'string') throw httpErrors.badRequest(`Field "${field}" must be a string`);
  const s = v.trim();
  if (opts.required && !s) throw httpErrors.badRequest(`Field "${field}" is required`);
  if (opts.max && s.length > opts.max) throw httpErrors.badRequest(`Field "${field}" exceeds ${opts.max} characters`);
  return s;
}

export function optStr(v: unknown): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  return String(v).trim() || undefined;
}

export function num(v: unknown, field: string, opts: { required?: boolean; min?: number; max?: number } = {}): number | undefined {
  if (v === undefined || v === null || v === '') {
    if (opts.required) throw httpErrors.badRequest(`Field "${field}" is required`);
    return undefined;
  }
  const n = Number(v);
  if (Number.isNaN(n)) throw httpErrors.badRequest(`Field "${field}" must be a number`);
  if (opts.min !== undefined && n < opts.min) throw httpErrors.badRequest(`Field "${field}" must be >= ${opts.min}`);
  if (opts.max !== undefined && n > opts.max) throw httpErrors.badRequest(`Field "${field}" must be <= ${opts.max}`);
  return n;
}

export function dateIso(v: unknown, field: string, opts: { required?: boolean } = {}): Date | undefined {
  if (v === undefined || v === null || v === '') {
    if (opts.required) throw httpErrors.badRequest(`Field "${field}" is required`);
    return undefined;
  }
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw httpErrors.badRequest(`Field "${field}" must be a valid ISO date`);
  return d;
}

/** Parse a JSON-array column defensively. */
export function parseJsonArr<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function stringifyJsonArr(v: unknown): string {
  try {
    return JSON.stringify(v ?? []);
  } catch {
    return '[]';
  }
}
