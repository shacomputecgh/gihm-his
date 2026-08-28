import { useEffect, useState } from 'react';
import { api, downloadFile } from '../lib/api';
import type { ImmunizationCoverage } from '../types';
import { Badge, Button, EmptyState, Spinner } from './ui';
import { titleCase } from '../lib/format';
import { cn } from './ui';

function toneFor(pct: number): string {
  if (pct >= 90) return 'bg-g-green';
  if (pct >= 70) return 'bg-g-gold';
  return 'bg-g-red';
}

/**
 * Immunization coverage panel. Full mode renders every dose indicator with a
 * coverage bar; compact mode (directorate dashboard) shows the headline KPIs.
 *
 * When `previewItems` is provided, the panel renders coverage as it WOULD look
 * under an unsaved schedule draft (an overlay of { vaccine, dose, ageDays,
 * active } entries) — used by the EPI schedule editor's before/after preview.
 */
export default function ImmunizationCoverage({
  compact = false,
  previewItems,
}: {
  compact?: boolean;
  previewItems?: { vaccine: string; dose: string; ageDays: number | null; active?: boolean }[];
}) {
  const [data, setData] = useState<ImmunizationCoverage | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (previewItems) {
      void api<ImmunizationCoverage>(`/immunizations/coverage?previewItems=${encodeURIComponent(JSON.stringify(previewItems))}`)
        .then(setData)
        .catch(() => setData(null));
    } else {
      void api<ImmunizationCoverage>('/immunizations/coverage').then(setData).catch(() => setData(null));
    }
  }, [previewItems]);

  if (!data) return <Spinner label="Loading coverage…" />;
  if (data.indicators.length === 0) {
    return <EmptyState icon="syringe" title="No coverage data" message="Record child doses to see coverage indicators." />;
  }

  const headline = data.indicators.filter((i) => ['PENTA_1', 'PENTA_3', 'MR_1'].includes(i.key));
  const shown = compact ? headline : data.indicators;

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadFile('/immunizations/export/coverage', 'immunization-coverage.csv');
    } catch (err) {
      console.error('[coverage] export failed', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {previewItems && (
        <p className="flex items-center gap-2 text-xs font-semibold text-g-navy">
          <Badge tone="navy">PREVIEW</Badge> Coverage under your unsaved schedule draft — not yet applied.
        </p>
      )}
      {/* Dropout + fully immunized headline */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-g-mist px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">PENTA1 → PENTA3 dropout</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', data.dropoutRate >= 10 ? 'text-g-red' : 'text-g-green')}>
            {data.dropoutRate}%
          </p>
        </div>
        <div className="rounded-lg bg-g-mist px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Fully immunized (12 mo)</p>
          <p className="mt-1 text-2xl font-bold text-g-ink tabular-nums">{data.fullyImmunized.coveragePct}%</p>
          <p className="text-xs text-slate-400">{data.fullyImmunized.vaccinated}/{data.fullyImmunized.eligible} children</p>
        </div>
        {!previewItems && (
          <div className="flex items-center justify-end">
            <Button size="sm" variant="outline" loading={exporting} onClick={() => void exportCsv()}>Export CSV</Button>
          </div>
        )}
      </div>

      {/* Indicator bars */}
      <div className="grid gap-x-6 gap-y-2.5 lg:grid-cols-2">
        {shown.map((i) => (
          <div key={i.key} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-slate-600" title={i.label}>{i.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn('h-full rounded-full transition-all duration-500', toneFor(i.coveragePct))}
                style={{ width: `${Math.max(2, i.coveragePct)}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs tabular-nums text-slate-500">
              <strong className="text-sm text-g-ink">{i.coveragePct}%</strong> · {i.vaccinated}/{i.eligible}
            </span>
          </div>
        ))}
      </div>

      {compact && (
        <p className="text-xs text-slate-400">
          Scope: {titleCase(data.scope)} · generated {new Date(data.generatedAt).toLocaleString('en-GB')}. Denominators are children
          old enough for each dose; see the <Badge tone="navy">Coverage</Badge> tab in the immunization registry for the full view.
        </p>
      )}
    </div>
  );
}
