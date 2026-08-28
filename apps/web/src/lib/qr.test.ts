import { describe, it, expect } from 'vitest';
import { generateQrMatrix, qrToSvg, qrSvgDataUrl } from './qr';

// The minimal QR encoder (ISO/IEC 18004, byte mode, ECC level M, versions
// 1-10) powers the patient MRN/badge QR. Pure functions — structure-level
// checks below pin the format invariants; round-trip decoding was verified
// externally against jsQR (not a repo dependency).
describe('generateQrMatrix', () => {
  it('picks version 1 for a short payload and grows the module size with length', () => {
    const short = generateQrMatrix('A'.repeat(14)); // v1 byte capacity (level M)
    expect(short).not.toBeNull();
    expect(short!.version).toBe(1);
    expect(short!.size).toBe(21);

    const next = generateQrMatrix('A'.repeat(15)); // first payload past v1 capacity
    expect(next!.version).toBe(2);
    expect(next!.size).toBe(25);

    const long = generateQrMatrix('A'.repeat(100));
    expect(long!.version).toBeGreaterThan(2);
    expect(long!.size).toBe(21 + 4 * (long!.version - 1)); // 21 + 4·(v-1) modules
  });

  it('returns null for a payload past version-10 capacity', () => {
    expect(generateQrMatrix('A'.repeat(214))).toBeNull(); // v10 holds 213 bytes
  });

  it('encodes an empty payload as a valid version-1 matrix', () => {
    const m = generateQrMatrix('');
    expect(m).not.toBeNull();
    expect(m!.version).toBe(1);
  });

  it('is deterministic for the same input and distinct for different inputs', () => {
    const a = generateQrMatrix('MRN-000123');
    const b = generateQrMatrix('MRN-000123');
    const c = generateQrMatrix('MRN-000124');
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('draws the three 7×7 finder patterns at the top-left, top-right and bottom-left corners', () => {
    const m = generateQrMatrix('MRN-000123')!;
    const finder = [
      '1111111',
      '1000001',
      '1011101',
      '1011101',
      '1011101',
      '1000001',
      '1111111',
    ];
    const block = (r0: number, c0: number) =>
      Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => (m.modules[r0 + r]![c0 + c] ? '1' : '0')).join(''),
      );
    expect(block(0, 0)).toEqual(finder);
    expect(block(0, m.size - 7)).toEqual(finder);
    expect(block(m.size - 7, 0)).toEqual(finder);
  });

  it('marks the finder patterns as function modules and leaves data modules unmarked', () => {
    const m = generateQrMatrix('MRN-000123')!;
    const cornerIsFunction = (r0: number, c0: number) =>
      Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => m.isFunction[r0 + r]![c0 + c]).every(Boolean)).every(Boolean);
    expect(cornerIsFunction(0, 0)).toBe(true);
    expect(cornerIsFunction(0, m.size - 7)).toBe(true);
    expect(cornerIsFunction(m.size - 7, 0)).toBe(true);
    // Somewhere in the data region there must be non-function modules.
    const hasData = m.isFunction.some((row) => row.some((fn) => !fn));
    expect(hasData).toBe(true);
  });

  it('produces a matrix that is neither empty nor full', () => {
    const m = generateQrMatrix('MRN-000123')!;
    const dark = m.modules.flat().filter(Boolean).length;
    expect(dark).toBeGreaterThan(0);
    expect(dark).toBeLessThan(m.size * m.size);
  });

  it('places the version-info blocks for versions ≥ 7 (long payloads)', () => {
    // v7 (level M) is the first version carrying the 18-bit version info.
    const m = generateQrMatrix('A'.repeat(160));
    expect(m).not.toBeNull();
    expect(m!.version).toBeGreaterThanOrEqual(7);
    expect(m!.size).toBe(21 + 4 * (m!.version - 1));
    // The version-info cells sit in the function area (top-right / bottom-left).
    for (let i = 0; i < 18; i++) {
      const a = Math.floor(i / 3);
      const b = (i % 3) + m!.size - 11;
      expect(m!.isFunction[a]![b]).toBe(true);
      expect(m!.isFunction[b]![a]).toBe(true);
    }
  });
});

describe('qrToSvg / qrSvgDataUrl', () => {
  it('renders a quiet-zone SVG whose viewBox matches size × scale', () => {
    const m = generateQrMatrix('MRN-000123')!;
    const svg = qrToSvg(m, 4, 4);
    const total = (m.size + 8) * 4;
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${total} ${total}"`);
    expect(svg).toContain('shape-rendering="crispEdges"');
    // The top-left finder's first dark module is offset by the quiet zone.
    expect(svg).toContain('<rect x="16" y="16" width="4" height="4"/>');
  });

  it('exposes an SVG data URL for a payload and null when it is too long', () => {
    const url = qrSvgDataUrl('MRN-000123');
    expect(url).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(qrSvgDataUrl('A'.repeat(214))).toBeNull();
  });
});
