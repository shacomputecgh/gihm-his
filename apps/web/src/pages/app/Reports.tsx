import { useCallback, useEffect, useMemo, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api, downloadFile, ApiRequestError } from '../../lib/api';
import type { AnomalyResult, ReportCompleteness, ReportSummary, ScheduledReport, ScheduledReportDelivery, ScheduledReportList } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Spinner } from '../../components/ui';
import { Icon, type IconName } from '../../components/icons';
import { cedis, fmtDate, fmtDateTime, scopeLabel } from '../../lib/format';
import { loadReportSnapshot, saveReportSnapshot } from '../../lib/reportCache';
import { scheduleBody } from '../../lib/scheduleDraft';
import { useAuth } from '../../lib/auth';

type GroupBy = 'none' | 'facility' | 'district' | 'region';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(days: number | 'month'): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (days === 'month') from.setDate(1);
  else from.setDate(to.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

const PRESETS: { label: string; value: number | 'month' }[] = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'This month', value: 'month' },
];

const fmtValue = (ind: { unit: string; value: number | null }): string => {
  if (ind.value === null) return '—';
  if (ind.unit === '%') return `${ind.value}%`;
  if (ind.unit === 'GHS') return cedis(ind.value);
  return ind.value.toLocaleString('en-GB');
};

export default function Reports() {
  const { user } = useAuth();
  const [range, setRange] = useState(() => presetRange(30));
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [completeness, setCompleteness] = useState<ReportCompleteness | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult | null>(null);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduledReportList | null>(null);
  const [deliveries, setDeliveries] = useState<ScheduledReportDelivery[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState<{ savedAt: string } | 'miss' | null>(null);
  const [exporting, setExporting] = useState<'indicators' | 'completeness' | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const q = { from: range.from, to: range.to, groupBy };
      const [s, c] = await Promise.all([
        api<ReportSummary>('/reports/summary', { query: q }),
        api<ReportCompleteness>('/reports/completeness', { query: { from: range.from, to: range.to } }),
      ]);
      setSummary(s);
      setCompleteness(c);
      setOffline(null);
      // Mirror the latest snapshot locally (IndexedDB + shell SQLite) so the
      // page can render offline (docs/26 §6c).
      const kind = `summary:${range.from}:${range.to}:${groupBy}`;
      void saveReportSnapshot(kind, { summary: s, completeness: c }).catch(() => undefined);
    } catch (err) {
      // Network down → fall back to the locally mirrored snapshot, marking it
      // clearly so cached numbers are never mistaken for live ones.
      if (err instanceof ApiRequestError && err.status === 0) {
        const snap = await loadReportSnapshot(`summary:${range.from}:${range.to}:${groupBy}`);
        if (snap && typeof snap.payload === 'object' && snap.payload && 'summary' in snap.payload) {
          const p = snap.payload as { summary: ReportSummary; completeness: ReportCompleteness };
          setSummary(p.summary);
          setCompleteness(p.completeness);
          setOffline({ savedAt: snap.savedAt });
        } else {
          // No snapshot for this exact period — clear the previous in-memory
          // figures rather than presenting stale data as live.
          setSummary(null);
          setCompleteness(null);
          setOffline('miss');
        }
      }
      /* keep previous data */
    } finally {
      setBusy(false);
    }
    // Anomaly detection needs ≥6 non-null weeks (MIN_POINTS) to score — only
    // run it for ranges long enough (6 weeks + a few days of slack). The
    // scheduled-report list must load regardless of the range: an early return
    // here would leave the section silently empty on the default 30-day view.
    const days = (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86_400_000;
    if (days < 42) {
      setAnomalies(null);
      setAnomalyError(null);
    } else {
      try {
        const a = await api<AnomalyResult>('/reports/anomalies', { query: { from: range.from, to: range.to } });
        setAnomalies(a);
        setAnomalyError(null);
      } catch (err) {
        setAnomalies(null);
        setAnomalyError(err instanceof Error ? err.message : 'Anomaly detection failed');
      }
    }
    // Scheduled-report subscriptions + their delivery log (silent on failure —
    // the section renders its own error state).
    try {
      const [sl, dl] = await Promise.all([
        api<ScheduledReportList>('/reports/schedules'),
        api<{ deliveries: ScheduledReportDelivery[] }>('/reports/schedules/deliveries'),
      ]);
      setSchedules(sl);
      setDeliveries(dl.deliveries);
      setScheduleError(null);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Could not load scheduled reports');
    }
  }, [range, groupBy]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const g = summary?.groups ?? [];
    return g.map((grp) => {
      const value = (code: string) => grp.indicators[code] ?? null;
      return {
        name: grp.name,
        opd: value('OPD_ATTENDANCE'),
        admissions: value('ADMISSIONS'),
        revenue: value('REVENUE'),
        imm: value('IMM_PENTA3'),
        labs: value('LAB_TESTS'),
        cases: value('DISEASE_CASES'),
      };
    });
  }, [summary]);

  const headline = useMemo(() => {
    const idx = new Map((summary?.indicators ?? []).map((i) => [i.code, i]));
    return {
      opd: idx.get('OPD_ATTENDANCE'),
      admissions: idx.get('ADMISSIONS'),
      revenue: idx.get('REVENUE'),
      cases: idx.get('DISEASE_CASES'),
    };
  }, [summary]);

  const sections = useMemo(() => {
    const list = summary?.indicators ?? [];
    const order: string[] = [];
    const byGroup = new Map<string, typeof list>();
    for (const ind of list) {
      if (!byGroup.has(ind.group)) {
        byGroup.set(ind.group, []);
        order.push(ind.group);
      }
      byGroup.get(ind.group)!.push(ind);
    }
    return order.map((g) => ({ group: g, indicators: byGroup.get(g)! }));
  }, [summary]);

  async function exportCsv(report: 'indicators' | 'completeness') {
    setExporting(report);
    try {
      const q = report === 'indicators' ? `from=${range.from}&to=${range.to}&groupBy=${groupBy}` : `from=${range.from}&to=${range.to}`;
      await downloadFile(`/reports/export?report=${report}&${q}`, report === 'indicators' ? 'report-indicators.csv' : 'reporting-completeness.csv');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(null);
    }
  }

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Reports"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      {offline && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-g-gold/30 bg-g-gold/10 px-4 py-2.5 text-xs text-yellow-900">
          <Icon name="info" className="h-4 w-4 shrink-0" />
          {offline === 'miss'
            ? 'The platform is unreachable and there is no cached snapshot for this period — reconnect to load the report.'
            : `Showing the locally cached snapshot from ${fmtDateTime(offline.savedAt)} — the platform is unreachable. Figures will refresh automatically when you reconnect.`}
        </div>
      )}
      <PageHeader
        title="Reports & analytics"
        subtitle="DHIMS-II mapped indicators computed live from platform records — no manual re-entry (docs/14)."
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon="download" loading={exporting === 'indicators'} onClick={() => void exportCsv('indicators')}>
              Export CSV
            </Button>
            <Button variant="outline" icon="download" loading={exporting === 'completeness'} onClick={() => void exportCsv('completeness')}>
              Completeness
            </Button>
          </div>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From">
            <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          </Field>
          <Field label="To">
            <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </Field>
          <div className="flex flex-wrap gap-1.5 pb-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setRange(presetRange(p.value))}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-g-red/40 hover:text-g-red"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Field label="Breakdown by">
              <Segmented
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'facility', label: 'Facility' },
                  { value: 'district', label: 'District' },
                  { value: 'region', label: 'Region' },
                ]}
                value={groupBy}
                onChange={setGroupBy}
              />
            </Field>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Period {fmtDate(range.from)} → {fmtDate(range.to)} · scope {scopeLabel(summary?.scope, user ?? {})} · generated {summary ? fmtDate(summary.generatedAt) : '…'}
        </p>
      </Card>

      {busy && !summary ? (
        <Spinner />
      ) : !summary ? (
        <EmptyState
          icon="chart"
          title={offline === 'miss' ? 'No cached report' : 'No report data'}
          message={offline === 'miss' ? 'The platform is unreachable and nothing was cached for this period — reconnect to load it.' : 'Pick a period above to generate the indicator summary.'}
        />
      ) : (
        <>
          {/* Headline cards */}
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'OPD attendance', value: headline.opd ? fmtValue(headline.opd) : '—', icon: 'users' as IconName, cls: 'text-g-navy' },
              { label: 'Admissions', value: headline.admissions ? fmtValue(headline.admissions) : '—', icon: 'bed' as IconName, cls: 'text-g-red' },
              { label: 'Revenue collected', value: headline.revenue ? fmtValue(headline.revenue) : '—', icon: 'card' as IconName, cls: 'text-emerald-600' },
              { label: 'Disease cases', value: headline.cases ? fmtValue(headline.cases) : '—', icon: 'activity' as IconName, cls: 'text-amber-600' },
            ].map((c) => (
              <Card key={c.label} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
                  <Icon name={c.icon} className={`h-4.5 w-4.5 ${c.cls}`} />
                </div>
                <p className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value}</p>
              </Card>
            ))}
          </div>

          {/* Indicator table by group */}
          <Card title="DHIMS-II indicators" pad={false}>
            <div className="divide-y divide-slate-100">
              {sections.map(({ group, indicators }) => (
                <div key={group}>
                  <h3 className="bg-g-mist/60 px-5 py-2 text-xs font-bold uppercase tracking-wide text-g-navy">{group}</h3>
                  {indicators.map((ind) => (
                    <div key={ind.code} className={`flex items-center justify-between gap-3 px-5 py-2.5 ${ind.collected ? '' : 'opacity-45'}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-g-ink">{ind.name}</p>
                        <p className="text-xs text-slate-400">DHIMS-II {ind.dhims2Code} · {ind.unit}</p>
                      </div>
                      {ind.collected ? (
                        <span className="shrink-0 font-mono text-lg font-bold text-g-ink">{fmtValue(ind)}</span>
                      ) : (
                        <Badge tone="gray">Not yet collected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          {/* Group breakdown matrix */}
          {groupBy !== 'none' && (
            <Card title={`Breakdown by ${groupBy}`} className="mt-5" pad={false}>
              {summary.truncated ? (
                <p className="px-5 pt-3 text-xs text-amber-600">Showing the first 60 groups — narrow the scope for a full breakdown.</p>
              ) : null}
              {groups.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400">No facilities in scope for this breakdown.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-2.5">Indicator</th>
                        {groups.map((g) => (
                          <th key={g.name} className="px-4 py-2.5 text-right">{g.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'OPD attendance', key: 'opd' as const, unit: 'visits' },
                        { label: 'Admissions', key: 'admissions' as const, unit: 'admissions' },
                        { label: 'Penta 3 doses', key: 'imm' as const, unit: 'doses' },
                        { label: 'Lab tests', key: 'labs' as const, unit: 'tests' },
                        { label: 'Disease cases', key: 'cases' as const, unit: 'cases' },
                        { label: 'Revenue', key: 'revenue' as const, unit: 'GHS' },
                      ].map((row) => (
                        <tr key={row.key}>
                          <td className="px-5 py-2.5 font-semibold text-g-ink">
                            {row.label}
                            <span className="ml-2 text-xs font-normal text-slate-400">{row.unit}</span>
                          </td>
                          {groups.map((g) => {
                            const v = g[row.key];
                            return (
                              <td key={g.name} className="px-4 py-2.5 text-right font-mono">
                                {v === null ? '—' : row.unit === 'GHS' ? cedis(v) : v.toLocaleString('en-GB')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Reporting completeness */}
          <Card title="Reporting completeness" className="mt-5" pad={false}>
            <div className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-g-mist">
                <span className="text-xl font-bold text-g-navy">{completeness?.completenessPct ?? 0}%</span>
              </div>
              <div className="text-sm text-slate-500">
                <p className="font-semibold text-g-ink">
                  {completeness?.facilities.reported ?? 0} of {completeness?.facilities.expected ?? 0} facilities reported activity
                </p>
                <p className="text-xs">A facility counts as reporting when it recorded OPD encounters, admissions, lab tests, disease cases or immunizations in the period.</p>
              </div>
            </div>
            {completeness && completeness.rows.length > 0 && (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-2.5">Facility</th>
                      <th className="px-4 py-2.5">District</th>
                      <th className="px-4 py-2.5">Region</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-5 py-2.5">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completeness.rows.slice(0, 100).map((r) => (
                      <tr key={r.facilityId}>
                        <td className="px-5 py-2.5">
                          <p className="font-semibold text-g-ink">{r.name}</p>
                          <p className="font-mono text-xs text-slate-400">{r.code}</p>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{r.district ?? '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500">{r.region ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={r.reported ? 'green' : 'red'}>{r.reported ? 'Reported' : 'No activity'}</Badge>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">{r.activity ?? 'No clinical activity recorded in period'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Anomaly detection (docs/14 §4) */}
          <Card title="Anomaly detection" className="mt-5" pad={false}>
            {anomalyError ? (
              <p className="px-5 py-4 text-sm text-red-600">{anomalyError}</p>
            ) : !anomalies ? (
              <p className="px-5 py-4 text-sm text-slate-400">Select a period of at least 3 weeks to run anomaly detection on the indicator trends.</p>
            ) : anomalies.summary.analyzed === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">Not enough weekly data to score — anomaly detection needs at least {anomalies.minPoints} non-null weeks within the period.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-g-mist">
                    <span className={`text-xl font-bold ${anomalies.summary.anomalies > 0 ? 'text-g-red' : 'text-g-navy'}`}>{anomalies.summary.anomalies}</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p className="font-semibold text-g-ink">
                      {anomalies.summary.anomalies > 0 ? 'Unusual activity detected' : 'No anomalies flagged'}
                      {anomalies.summary.high > 0 && (
                        <Badge tone="red" className="ml-2">{anomalies.summary.high} high</Badge>
                      )}
                    </p>
                    <p className="text-xs">
                      {anomalies.summary.analyzed} indicators scored weekly over the period — flagged when a week deviates ≥2σ from the series mean.
                    </p>
                  </div>
                </div>
                {anomalies.indicators.some((i) => i.flags.length > 0) ? (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-2.5">Indicator</th>
                          <th className="px-4 py-2.5">Week starting</th>
                          <th className="px-4 py-2.5">Value</th>
                          <th className="px-4 py-2.5">Expected</th>
                          <th className="px-4 py-2.5">σ</th>
                          <th className="px-5 py-2.5">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {anomalies.indicators
                          .filter((i) => i.flags.length > 0)
                          .flatMap((i) => i.flags.map((f) => ({ ...f, code: i.code, name: i.name, unit: i.unit })))
                          .slice(0, 100)
                          .map((f, idx) => (
                            <tr key={`${f.code}-${f.weekStart}-${idx}`}>
                              <td className="px-5 py-2.5">
                                <p className="font-semibold text-g-ink">{f.name}</p>
                                <p className="font-mono text-xs text-slate-400">{f.code}</p>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">{fmtDate(f.weekStart)}</td>
                              <td className="px-4 py-2.5 font-mono font-bold text-g-ink">{f.value.toLocaleString('en-GB')} {f.unit}</td>
                              <td className="px-4 py-2.5 text-slate-500">{f.expected.toLocaleString('en-GB')}</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">{f.z.toFixed(1)}</td>
                              <td className="px-5 py-2.5">
                                <Badge tone={f.severity === 'high' ? 'red' : 'gold'}>{f.severity === 'high' ? 'High' : 'Medium'}</Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-t border-slate-100">
                    <p className="px-5 py-4 text-sm text-slate-500">Weekly values stayed within expected variation for every scored indicator.</p>
                  </div>
                )}
                <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">{anomalies.method}</p>
              </>
            )}
          </Card>

          {/* Scheduled reports (docs/14 §5) */}
          <ScheduledReportsSection schedules={schedules} deliveries={deliveries} error={scheduleError} onChanged={() => void load()} />
        </>
      )}
    </div>
  );
}

const CADENCE_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  summary: 'Indicator summary',
  completeness: 'Reporting completeness',
  anomalies: 'Anomaly detection',
};

function ScheduledReportsSection({ schedules, deliveries, error, onChanged }: { schedules: ScheduledReportList | null; deliveries: ScheduledReportDelivery[]; error: string | null; onChanged: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  async function retryDelivery(d: ScheduledReportDelivery) {
    setRetrying(d.id);
    try {
      await api(`/reports/schedules/deliveries/${d.id}/retry`, { method: 'POST' });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not retry delivery');
    } finally {
      setRetrying(null);
    }
  }

  async function create() {
    setSaving(true);
    try {
      // Body derivation lives in lib/scheduleDraft.ts so the defaults are
      // unit-tested (the cadence defaults are derived from the same source
      // the UI displays — see the regression note there).
      await api('/reports/schedules', { method: 'POST', body: scheduleBody(draft) });
      setDraft({});
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create schedule');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(s: ScheduledReport) {
    try {
      await api(`/reports/schedules/${s.id}`, { method: 'PATCH', body: { active: !s.active } });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update schedule');
    }
  }

  async function remove(s: ScheduledReport) {
    if (!window.confirm(`Delete schedule “${s.name}”?`)) return;
    try {
      await api(`/reports/schedules/${s.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete schedule');
    }
  }

  async function runNow(s: ScheduledReport) {
    setRunning(s.id);
    try {
      await api(`/reports/schedules/${s.id}/run`, { method: 'POST' });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not run schedule');
    } finally {
      setRunning(null);
    }
  }

  const cadence = draft.cadence ?? 'monthly';
  const needsDayOfWeek = cadence === 'weekly';
  const needsDayOfMonth = cadence === 'monthly' || cadence === 'quarterly' || cadence === 'annual';

  return (
    <Card title="Scheduled reports" className="mt-5" pad={false}>
      <p className="border-b border-slate-100 px-5 py-3 text-xs text-slate-400">
        Emails an authorised recipient list on a cadence — computed live from platform records at run time (spec §149). SMTP is configured under Admin & Sync → Settings → Email.
      </p>
      {error ? (
        <p className="px-5 py-4 text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Name">
                <Input placeholder="Monthly OPD summary" value={draft.name ?? ''} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </Field>
              <Field label="Report">
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={draft.reportType ?? 'summary'}
                  onChange={(e) => setDraft((d) => ({ ...d, reportType: e.target.value }))}
                >
                  <option value="summary">Indicator summary</option>
                  <option value="completeness">Reporting completeness</option>
                  <option value="anomalies">Anomaly detection</option>
                </select>
              </Field>
              <Field label="Cadence">
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={cadence}
                  onChange={(e) => setDraft((d) => ({ ...d, cadence: e.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </Field>
              <Field label="Time (24h)">
                <Input type="time" value={draft.runTime ?? '08:00'} onChange={(e) => setDraft((d) => ({ ...d, runTime: e.target.value }))} />
              </Field>
              {needsDayOfWeek && (
                <Field label="Day of week">
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={draft.dayOfWeek ?? '1'}
                    onChange={(e) => setDraft((d) => ({ ...d, dayOfWeek: e.target.value }))}
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dow, i) => (
                      <option key={dow} value={i}>{dow}</option>
                    ))}
                  </select>
                </Field>
              )}
              {needsDayOfMonth && (
                <Field label="Day of month">
                  <Input type="number" min={1} max={28} value={draft.dayOfMonth ?? '1'} onChange={(e) => setDraft((d) => ({ ...d, dayOfMonth: e.target.value }))} />
                </Field>
              )}
              <Field label="Recipients (comma-separated)">
                <Input placeholder="ops@ghs.gov.gh, medsup@facility.gh" value={draft.recipients ?? ''} onChange={(e) => setDraft((d) => ({ ...d, recipients: e.target.value }))} />
              </Field>
              <div className="flex items-end">
                <Button icon="plus" loading={saving} onClick={() => void create()}>
                  Create schedule
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5">Schedule</th>
                  <th className="px-4 py-2.5">Cadence</th>
                  <th className="px-4 py-2.5">Recipients</th>
                  <th className="px-4 py-2.5">Next run</th>
                  <th className="px-4 py-2.5">Last run</th>
                  <th className="px-5 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(schedules?.schedules ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-400">No scheduled reports yet — create one above.</td>
                  </tr>
                ) : (
                  schedules!.schedules.map((s) => (
                    <tr key={s.id} className={s.active ? '' : 'opacity-50'}>
                      <td className="px-5 py-2.5">
                        <p className="font-semibold text-g-ink">{s.name}</p>
                        <p className="text-xs text-slate-400">{REPORT_TYPE_LABEL[s.reportType] ?? s.reportType}{s.lastError ? ` · ${s.lastError}` : ''}</p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {CADENCE_LABEL[s.cadence] ?? s.cadence}
                        <span className="block font-mono text-xs text-slate-400">{s.runTime}{s.dayOfWeek !== null && s.dayOfWeek !== undefined ? ` · ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.dayOfWeek]}` : s.dayOfMonth ? ` · day ${s.dayOfMonth}` : ''}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{s.recipients}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.active ? fmtDate(s.nextRunAt) : <Badge tone="gray">Paused</Badge>}</td>
                      <td className="px-4 py-2.5">
                        {s.lastRunAt ? (
                          <>
                            <p className="text-slate-500">{fmtDate(s.lastRunAt)}</p>
                            {s.lastStatus === 'sent' && <Badge tone="green">Sent</Badge>}
                            {s.lastStatus === 'skipped' && <Badge tone="gold">Skipped</Badge>}
                            {s.lastStatus === 'failed' && <Badge tone="red">Failed</Badge>}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Button variant="ghost" size="sm" icon="refresh" loading={running === s.id} onClick={() => void runNow(s)}>Run now</Button>
                          <Button variant="ghost" size="sm" onClick={() => void toggle(s)}>{s.active ? 'Pause' : 'Resume'}</Button>
                          <Button variant="ghost" size="sm" icon="trash" onClick={() => void remove(s)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {deliveries.length > 0 && (
            <div className="border-t border-slate-100">
              <h3 className="bg-g-mist/60 px-5 py-2 text-xs font-bold uppercase tracking-wide text-g-navy">Delivery log</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-2.5">Run at</th>
                      <th className="px-4 py-2.5">Period</th>
                      <th className="px-4 py-2.5">Recipients</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-5 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveries.slice(0, 20).map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-2.5 text-slate-500">{fmtDate(d.runAt)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{fmtDate(d.periodFrom)} → {fmtDate(d.periodTo)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{d.recipients}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={d.status === 'sent' ? 'green' : d.status === 'skipped' ? 'gold' : 'red'}>{d.status}</Badge>
                          {d.attempts > 0 ? <span className="ml-2 text-xs text-slate-400">attempt {d.attempts + 1}</span> : null}
                          {d.note ? <span className="ml-2 text-xs text-slate-400">{d.note}</span> : null}
                        </td>
                        <td className="px-5 py-2.5">
                          {d.status !== 'sent' && (
                            <Button variant="ghost" size="sm" icon="refresh" loading={retrying === d.id} onClick={() => void retryDelivery(d)}>
                              Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
