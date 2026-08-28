// ---------------------------------------------------------------------
// Minimal QR Code encoder — byte mode, ECC level M, versions 1-10.
// Pure TypeScript, no dependencies (the patient MRN/badge QR is short, so
// version 1-10 covers every realistic payload). Renders to SVG or PNG.
// Implemented from the ISO/IEC 18004 algorithm — function patterns, data
// zig-zag placement, all 8 masks with penalty scoring.
// Verified end-to-end against an independent decoder (jsQR): every sample
// payload round-trips. Index accesses below carry `!` because the project
// compiles with noUncheckedIndexedAccess — every index is in-bounds by
// construction.
// ---------------------------------------------------------------------

const VERSION_SIZE = [21, 25, 29, 33, 37, 41, 45, 49, 53, 57]; // v1..v10 module count

/** Alignment pattern centre coordinates per version (0-indexed). */
const ALIGN_POS: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/**
 * RS block layout for ECC level M: groups of [blockCount, totalCodewords,
 * dataCodewords] — the interleaving groups differ from version 8 onward.
 */
const RS_BLOCKS_M: Array<Array<[number, number, number]>> = [
  [[1, 26, 16]],
  [[1, 44, 28]],
  [[1, 70, 44]],
  [[2, 50, 32]],
  [[2, 67, 43]],
  [[4, 43, 27]],
  [[4, 49, 31]],
  [[2, 60, 38], [2, 61, 39]],
  [[3, 58, 36], [2, 59, 37]],
  [[4, 69, 43], [1, 70, 44]],
];

/** Byte-mode payload capacity per version (level M) — used for version pick. */
const BYTE_CAPACITY_M = RS_BLOCKS_M.map((groups, i) => {
  const data = groups.reduce((acc, [n, , d]) => acc + n * d, 0);
  return data - (i + 1 >= 10 ? 3 : 2); // 4-bit mode + (8 | 16)-bit char count
});

// ---------------------------------------------------------------- GF(256)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]!;
}
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a]! + GF_LOG[b]!]!;
}

function rsEncode(data: number[], ecLen: number): number[] {
  // Generator polynomial g(x) = ∏(x + α^i) for i in 0..ecLen-1, stored
  // lowest-degree-first (gen[gen.length-1] is the leading 1).
  let gen: number[] = [1];
  for (let i = 0; i < ecLen; i++) {
    const next: number[] = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j]! ^= gfMul(gen[j]!, GF_EXP[i]!);
      next[j + 1]! ^= gen[j]!;
    }
    gen = next;
  }
  // LFSR division: reverse so gen[0] is the leading 1, then cancel each data
  // byte against the remaining coefficients — the leading term itself is the
  // quotient canceller and must NOT be added back into the remainder.
  const rev = gen.slice().reverse();
  const res = new Uint8Array(data.length + ecLen);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i]!;
    if (coef === 0) continue;
    for (let j = 1; j < rev.length; j++) res[i + j]! ^= gfMul(rev[j]!, coef);
  }
  return Array.from(res.slice(data.length));
}

// ------------------------------------------------------------ bit stream
function buildDataCodewords(text: string, version: number, dataCapacity: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code < 128 ? code : 0x3f); // byte mode is Latin-1; non-ASCII → '?'
  }
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4); // byte mode indicator
  push(bytes.length, version >= 10 ? 16 : 8); // character count
  for (const b of bytes) push(b, 8);
  // Terminator (up to 4 zero bits) then pad to a byte boundary.
  const capacityBits = dataCapacity * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  for (let i = 0; i < terminator; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad codewords: 0xEC, 0x11 alternating.
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]!;
    out.push(b);
  }
  let pad = 0xec;
  while (out.length < dataCapacity) {
    out.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }
  return out;
}

// ------------------------------------------------------------- matrix map
interface QRMatrix {
  size: number;
  version: number;
  /** true = dark module. */
  modules: boolean[][];
  /** true = reserved for a function pattern (finder/timing/alignment/format…). */
  isFunction: boolean[][];
}

function drawFunctionPatterns(m: QRMatrix): void {
  const { size } = m;
  const set = (r: number, c: number, dark: boolean, func = true) => {
    m.modules[r]![c] = dark;
    m.isFunction[r]![c] = func;
  };

  // Finder pattern 7×7 at a corner (centre + separators).
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inCenter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        set(rr, cc, inCenter && (border || core));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns (row 6 and column 6), alternating, starting dark.
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // Alignment patterns (skip the ones overlapping finder corners).
  const positions = ALIGN_POS[m.version - 1]!;
  for (const r of positions) {
    for (const c of positions) {
      const nearFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (nearFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const border = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const core = Math.abs(dr) === 0 && Math.abs(dc) === 0;
          set(r + dr, c + dc, border || core);
        }
      }
    }
  }

  // Dark module: (size-8, 8) is always dark.
  set(size - 8, 8, true);

  // Version info (18 bits) for versions ≥ 7 — two copies.
  if (m.version >= 7) {
    let rem = m.version << 12;
    for (let i = 17; i >= 12; i--) {
      if (((rem >>> i) & 1) !== 0) rem ^= 0x1f25 << (i - 12);
    }
    const bits = (m.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      set(a, b, dark); // top-right block
      set(b, a, dark); // bottom-left block
    }
  }
}

function placeData(m: QRMatrix, data: number[], ec: number[], mask: number): void {
  const { size } = m;
  const formatBits = (maskIdx: number): number => {
    const d = (0b00 << 3) | maskIdx;
    let rem = d << 10;
    for (let i = 14; i >= 10; i--) {
      if (((rem >>> i) & 1) !== 0) rem ^= 0x537 << (i - 10);
    }
    return ((d << 10) | rem) ^ 0x5412;
  };

  // All codewords interleaved: data blocks first (column-wise across blocks),
  // then EC blocks (column-wise across blocks).
  const all: number[] = [...data, ...ec];
  const bits: number[] = [];
  for (const b of all) for (let i = 7; i >= 0; i--) bits.push((b >>> i) & 1);

  const maskDark = (r: number, c: number): boolean => {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  };

  // Format info (15 bits, bit 0 = LSB) placed in two copies: a vertical copy
  // in column 8 and a horizontal copy in row 8 (mirrors the qrcode-generator
  // reference layout, verified against an independent decoder).
  const fmt = formatBits(mask);
  const setFmt = (r: number, c: number, dark: boolean) => {
    m.modules[r]![c] = dark;
    m.isFunction[r]![c] = true;
  };
  // Vertical copy — column 8: bits 0-5 in rows 0-5, bits 6-7 in rows 7-8,
  // bits 8-14 in rows (size-7)..(size-1) (bottom edge).
  for (let i = 0; i < 15; i++) {
    const dark = ((fmt >>> i) & 1) === 1;
    if (i < 6) setFmt(i, 8, dark);
    else if (i < 8) setFmt(i + 1, 8, dark);
    else setFmt(m.size - 15 + i, 8, dark);
  }
  // Horizontal copy — row 8: bits 0-7 in cols (size-1)..(size-8) (right edge),
  // bit 8 at col 7, bits 9-14 in cols 5..0 (around the top-left finder).
  for (let i = 0; i < 15; i++) {
    const dark = ((fmt >>> i) & 1) === 1;
    if (i < 8) setFmt(8, m.size - 1 - i, dark);
    else if (i === 8) setFmt(8, 15 - i - 1 + 1, dark);
    else setFmt(8, 15 - i - 1, dark);
  }

  // Zig-zag placement from the bottom-right corner.
  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let k = 0; k < 2; k++) {
        const col = right - k;
        if (col < 0 || m.isFunction[row]![col]) continue;
        if (bitIdx < bits.length) {
          m.modules[row]![col] = bits[bitIdx++] !== 0 ? !maskDark(row, col) : maskDark(row, col);
        } else {
          m.modules[row]![col] = maskDark(row, col); // remainder bits: mask only
        }
        m.isFunction[row]![col] = false;
      }
    }
    upward = !upward;
  }
}

// ------------------------------------------------------------- penalty
function penalty(m: QRMatrix): number {
  const { size, modules } = m;
  const dark = (r: number, c: number): number => (modules[r]![c] ? 1 : 0);
  let score = 0;

  // Rule 1: runs of ≥5 same colour in rows and columns.
  const runScore = (run: number): number => (run >= 5 ? 3 + (run - 5) : 0);
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r]![c] === modules[r]![c - 1]) run++;
      else { score += runScore(run); run = 1; }
    }
    score += runScore(run);
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r]![c] === modules[r - 1]![c]) run++;
      else { score += runScore(run); run = 1; }
    }
    score += runScore(run);
  }

  // Rule 2: 2×2 blocks of the same colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (modules[r]![c] === modules[r]![c + 1] && modules[r]![c] === modules[r + 1]![c] && modules[r]![c] === modules[r + 1]![c + 1]) score += 3;
    }
  }

  // Rule 3: finder-like pattern 1 0 1 1 1 0 1 with 4 light modules either side.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 10; c++) {
      const pat = [dark(r, c), dark(r, c + 1), dark(r, c + 2), dark(r, c + 3), dark(r, c + 4), dark(r, c + 5), dark(r, c + 6)];
      if (pat[0] === 1 && pat[1] === 0 && pat[2] === 1 && pat[3] === 1 && pat[4] === 1 && pat[5] === 0 && pat[6] === 1) {
        const before = dark(r, c - 1) + dark(r, c - 2) + dark(r, c - 3) + dark(r, c - 4);
        const after = dark(r, c + 7) + dark(r, c + 8) + dark(r, c + 9) + dark(r, c + 10);
        if (before === 0 || after === 0) score += 40;
      }
    }
  }

  // Rule 4: dark-module proportion.
  let darkCount = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) darkCount += modules[r]![c] ? 1 : 0;
  const pct = (darkCount * 100) / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return score;
}

// ------------------------------------------------------------ entry point
/**
 * Encode `text` into a QR module matrix (ECC level M). Returns the best-mask
 * matrix, or null if the payload exceeds version 10 (213 bytes).
 */
export function generateQrMatrix(text: string): QRMatrix | null {
  let version = -1;
  for (let v = 0; v < BYTE_CAPACITY_M.length; v++) {
    if (text.length <= BYTE_CAPACITY_M[v]!) { version = v + 1; break; }
  }
  if (version < 0) return null;

  const groups = RS_BLOCKS_M[version - 1]!;
  const totalCodewords = groups.reduce((a, [n, t]) => a + n * t, 0);
  const dataCapacity = groups.reduce((a, [n, , d]) => a + n * d, 0);
  const data = buildDataCodewords(text, version, dataCapacity);

  // Split into RS blocks and interleave data then EC codewords.
  const blocks: { data: number[]; ec: number[] }[] = [];
  for (const [n, , d] of groups) {
    for (let i = 0; i < n; i++) {
      const slice = data.splice(0, d);
      blocks.push({ data: slice, ec: rsEncode(slice, totalCodewords - d) });
    }
  }
  const interleaved: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.data.length) interleaved.push(b.data[i]!);
  }
  const maxEc = Math.max(...blocks.map((b) => b.ec.length));
  for (let i = 0; i < maxEc; i++) {
    for (const b of blocks) if (i < b.ec.length) interleaved.push(b.ec[i]!);
  }

  // Try every mask, keep the lowest penalty.
  let best: QRMatrix | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const size = VERSION_SIZE[version - 1]!;
    const m: QRMatrix = {
      size,
      version,
      modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
      isFunction: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    };
    drawFunctionPatterns(m);
    placeData(m, interleaved.slice(0, dataCapacity), interleaved.slice(dataCapacity), mask);
    const s = penalty(m);
    if (s < bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}

/** Render a QR matrix to an SVG string with a quiet zone. */
export function qrToSvg(m: QRMatrix, scale = 4, quiet = 4): string {
  const size = m.size + quiet * 2;
  const cells: string[] = [];
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (m.modules[r]![c]) cells.push(`<rect x="${(c + quiet) * scale}" y="${(r + quiet) * scale}" width="${scale}" height="${scale}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * scale} ${size * scale}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#0f172a">${cells.join('')}</g></svg>`;
}

/** Encode text → SVG data URL (white quiet zone, crisp edges). */
export function qrSvgDataUrl(text: string, scale = 4): string | null {
  const m = generateQrMatrix(text);
  if (!m) return null;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrToSvg(m, scale))}`;
}

/** Encode text → PNG data URL (renders the SVG on a canvas). */
export async function qrPngDataUrl(text: string, scale = 8): Promise<string | null> {
  const m = generateQrMatrix(text);
  if (!m) return null;
  const svg = qrToSvg(m, scale);
  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not render QR'));
      img.src = url;
    });
    const size = (m.size + 8) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
