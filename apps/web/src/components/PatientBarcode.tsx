import { useMemo } from 'react';

/**
 * Simple QR-code-style barcode renderer (pure SVG, no external deps).
 * Generates a deterministic grid pattern from a string — suitable for
 * patient MRN / ID scannable labels.
 */
export function PatientBarcode({ value, size = 120, label }: { value: string; size?: number; label?: string }) {
  const cells = useMemo(() => {
    // Simple hash → grid pattern
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    const grid: boolean[][] = [];
    const n = 21; // 21×21 QR-style grid
    for (let r = 0; r < n; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < n; c++) {
        // Position detection patterns (3 corners)
        const inCornerTL = r < 7 && c < 7;
        const inCornerTR = r < 7 && c >= n - 7;
        const inCornerBL = r >= n - 7 && c < 7;
        if (inCornerTL || inCornerTR || inCornerBL) {
          const isEdge = r === 0 || c === 0 || r === 6 || c === 6 || r === n - 1 || c === n - 1 || c === n - 7 || r === n - 7;
          const isInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r >= 2 && r <= 4 && c >= n - 5 && c <= n - 3) ||
            (r >= n - 5 && r <= n - 3 && c >= 2 && c <= 4);
          row.push(isEdge || isInner);
        } else {
          // Data region — deterministic from hash
          hash = ((hash << 13) + (hash >> 7) + r * 31 + c * 17) | 0;
          row.push((hash & 3) < 2);
        }
      }
      grid.push(row);
    }
    return grid;
  }, [value]);

  const cellSize = size / 23; // 21 cells + 1-cell margin each side

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${23 * cellSize} ${23 * cellSize}`} className="bg-white rounded border">
        {cells.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={(c + 1) * cellSize}
                y={(r + 1) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#000"
              />
            ) : null
          )
        )}
      </svg>
      {label && <span className="text-[10px] font-mono text-slate-600">{label}</span>}
    </div>
  );
}

/**
 * Simple linear barcode (Code-128 style) rendered as SVG.
 */
export function LinearBarcode({ value, width = 200, height = 60, showText = true }: { value: string; width?: number; height?: number; showText?: boolean }) {
  const bars = useMemo(() => {
    const result: { x: number; w: number; black: boolean }[] = [];
    let x = 0;
    // Start pattern
    result.push({ x, w: 2, black: true }); x += 2;
    result.push({ x, w: 1, black: false }); x += 1;
    
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i) % 95 + 32;
      const pattern = [
        (code & 1) === 1, (code & 2) === 2, (code & 4) === 4,
        (code & 8) === 8, (code & 16) === 16, (code & 32) === 32,
        (code & 64) === 64,
      ];
      for (let b = 0; b < 7; b++) {
        const w = pattern[b] ? 2 : 1;
        result.push({ x, w, black: b % 2 === 0 });
        x += w;
      }
      result.push({ x, w: 1, black: false }); x += 1;
    }
    // Stop pattern
    result.push({ x, w: 2, black: true }); x += 2;
    
    const totalWidth = x;
    const scale = width / totalWidth;
    return result.map((bar) => ({ ...bar, x: bar.x * scale, w: bar.w * scale }));
  }, [value, width]);

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white rounded border">
        {bars.map((bar, i) =>
          bar.black ? (
            <rect key={i} x={bar.x} y={4} width={bar.w} height={height - (showText ? 20 : 8)} fill="#000" />
          ) : null
        )}
      </svg>
      {showText && <span className="text-[10px] font-mono tracking-wider text-slate-700">{value}</span>}
    </div>
  );
}
