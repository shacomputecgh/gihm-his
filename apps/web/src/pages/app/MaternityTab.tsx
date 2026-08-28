import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { AntenatalVisit, DeliveryRecord, Partograph, PartographObservation, PostnatalVisit } from '../../types';
import { Badge, Button, Card, Field, Input, Select, Textarea, useToast } from '../../components/ui';
import { fmtDate, fmtDateTime } from '../../lib/format';

/**
 * Maternity & obstetrics (spec §20, docs/13 §7–8) — the patient's antenatal
 * visits, deliveries, postnatal follow-ups and WHO labour partograph, with
 * record forms for clinical staff. A recorded delivery closes the active ANC
 * visits and any open partograph (server-enforced).
 */
export default function MaternityTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const canWrite = !!user?.permissions.includes('write_clinical_note');

  const [anc, setAnc] = useState<AntenatalVisit[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [pnc, setPnc] = useState<PostnatalVisit[]>([]);
  const [partographs, setPartographs] = useState<Partograph[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<'' | 'anc' | 'delivery' | 'pnc' | 'partograph'>('');

  // Partograph observations (loaded lazily when a chart is expanded).
  const [chartId, setChartId] = useState<string | null>(null);
  const [chart, setChart] = useState<{ labourStartedAt: string; items: PartographObservation[] } | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [a, d, p, pg] = await Promise.all([
        api<{ items: AntenatalVisit[] }>(`/patients/${patientId}/antenatal`),
        api<{ items: DeliveryRecord[] }>(`/patients/${patientId}/deliveries`),
        api<{ items: PostnatalVisit[] }>(`/patients/${patientId}/postnatal`),
        api<{ items: Partograph[] }>(`/patients/${patientId}/partographs`),
      ]);
      setAnc(a.items);
      setDeliveries(d.items);
      setPnc(p.items);
      setPartographs(pg.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load maternity record', 'error');
    } finally {
      setBusy(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openChart(partographId: string, labourStartedAt: string) {
    setChartId(partographId);
    setChart(null);
    try {
      const res = await api<{ labourStartedAt: string; items: PartographObservation[] }>(`/patients/${patientId}/partographs/${partographId}/observations`);
      setChart({ labourStartedAt: res.labourStartedAt ?? labourStartedAt, items: res.items });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load chart', 'error');
      setChartId(null);
    }
  }

  async function submit(path: string, payload: Record<string, unknown>, ok: string) {
    try {
      await api(path, { method: 'POST', body: payload });
      toast(ok, 'success');
      setOpen('');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  const riskTone = (r: string) => (r === 'HIGH' ? 'red' : r === 'LOW' ? 'green' : 'gold');

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Maternity Tab Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      {/* ------------------------------------------------------------ ANC */}
      <Card
        title="Antenatal care"
        subtitle={`${anc.length} visit(s) — a recorded delivery closes the active ANC`}
        action={canWrite ? (
          <Button size="sm" variant={open === 'anc' ? 'ghost' : 'green'} onClick={() => setOpen(open === 'anc' ? '' : 'anc')}>
            {open === 'anc' ? 'Close' : 'Record visit'}
          </Button>
        ) : undefined}
      >
        {open === 'anc' && (
          <AncForm onSave={(p) => void submit(`/patients/${patientId}/antenatal`, p, 'ANC visit recorded')} />
        )}
        {anc.length === 0 && !busy ? (
          <p className="py-4 text-center text-sm text-slate-400">No antenatal visits recorded.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {anc.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-semibold text-g-ink">Visit {v.visitNumber}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-600">GA {v.gaWeeks} wks</span>
                  {v.edd && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">EDD {fmtDate(v.edd)}</span></>}
                  {v.fetalHeartRate && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">FHR {v.fetalHeartRate}</span></>}
                  {v.weightKg != null && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">{v.weightKg} kg</span></>}
                  {v.systolicBp && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">BP {v.systolicBp}/{v.diastolicBp}</span></>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={riskTone(v.riskAssessment)}>{v.riskAssessment}</Badge>
                  <Badge tone={v.status === 'ACTIVE' ? 'gold' : 'gray'}>{v.status}</Badge>
                  <span className="text-xs text-slate-400">{fmtDate(v.visitedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* --------------------------------------------------------- delivery */}
      <Card
        title="Deliveries"
        subtitle={`${deliveries.length} recorded — closes active ANC visits + open partographs`}
        action={canWrite ? (
          <Button size="sm" variant={open === 'delivery' ? 'ghost' : 'green'} onClick={() => setOpen(open === 'delivery' ? '' : 'delivery')}>
            {open === 'delivery' ? 'Close' : 'Record delivery'}
          </Button>
        ) : undefined}
      >
        {open === 'delivery' && (
          <DeliveryForm onSave={(p) => void submit(`/patients/${patientId}/deliveries`, p, 'Delivery recorded — ANC and partograph closed')} />
        )}
        {deliveries.length === 0 && !busy ? (
          <p className="py-4 text-center text-sm text-slate-400">No deliveries recorded.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {deliveries.map((d) => (
              <div key={d.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-g-ink">{d.deliveryType}</span>
                  {d.mode && <Badge tone="blue">{d.mode}</Badge>}
                  {d.outcome && <Badge tone={d.outcome === 'STILLBIRTH' ? 'red' : 'green'}>{d.outcome}</Badge>}
                  {d.birthWeightKg != null && <span className="text-slate-600">{d.birthWeightKg} kg</span>}
                  {d.apgar1 != null && <span className="text-slate-600">APGAR {d.apgar1}/{d.apgar5}</span>}
                  <span className="text-slate-400 text-xs">{fmtDateTime(d.deliveredAt)}</span>
                </div>
                {(d.complications || d.attendedByName) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {d.attendedByName && `Attended by ${d.attendedByName}`}
                    {d.attendedByName && d.complications && ' · '}
                    {d.complications && `Complications: ${d.complications}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------------ PNC */}
      <Card
        title="Postnatal care"
        subtitle={`${pnc.length} follow-up visit(s)`}
        action={canWrite ? (
          <Button size="sm" variant={open === 'pnc' ? 'ghost' : 'green'} onClick={() => setOpen(open === 'pnc' ? '' : 'pnc')}>
            {open === 'pnc' ? 'Close' : 'Record visit'}
          </Button>
        ) : undefined}
      >
        {open === 'pnc' && (
          <PncForm onSave={(p) => void submit(`/patients/${patientId}/postnatal`, p, 'Postnatal visit recorded')} />
        )}
        {pnc.length === 0 && !busy ? (
          <p className="py-4 text-center text-sm text-slate-400">No postnatal visits recorded.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pnc.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-semibold text-g-ink">Visit {v.visitNumber}</span>
                  {v.breastfeeding && <><span className="mx-2 text-slate-300">·</span><Badge tone="blue">{v.breastfeeding}</Badge></>}
                  {v.contraception && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">{v.contraception}</span></>}
                  {v.immunization && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">{v.immunization}</span></>}
                </div>
                <span className="text-xs text-slate-400">{fmtDate(v.visitedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------- partograph */}
      <Card
        title="Labour partograph"
        subtitle="WHO chart — the server computes each observation's position against the alert/action lines"
        action={canWrite ? (
          <Button size="sm" variant={open === 'partograph' ? 'ghost' : 'green'} onClick={() => setOpen(open === 'partograph' ? '' : 'partograph')}>
            {open === 'partograph' ? 'Close' : 'Start partograph'}
          </Button>
        ) : undefined}
      >
        {open === 'partograph' && (
          <PartographForm onSave={(p) => void submit(`/patients/${patientId}/partographs`, p, 'Partograph started')} />
        )}
        {partographs.length === 0 && !busy ? (
          <p className="py-4 text-center text-sm text-slate-400">No partographs.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {partographs.map((pg) => (
              <div key={pg.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-g-ink">Started {fmtDateTime(pg.labourStartedAt)}</span>
                    <Badge tone={pg.status === 'ACTIVE' ? 'gold' : 'gray'}>{pg.status}</Badge>
                    <span className="text-xs text-slate-400">{pg._count?.observations ?? 0} observation(s)</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => (chartId === pg.id ? setChartId(null) : void openChart(pg.id, pg.labourStartedAt))}>
                    {chartId === pg.id ? 'Hide chart' : pg._count && pg._count.observations > 0 ? 'View chart' : 'Chart'}
                  </Button>
                </div>
                {pg.notes && <p className="mt-1 text-xs text-slate-500">{pg.notes}</p>}
                {chartId === pg.id && chart && (
                  <div className="mt-3">
                    <ChartTable rows={chart.items} partographId={pg.id} patientId={patientId} canWrite={canWrite} onRecorded={() => { void openChart(pg.id, chart.labourStartedAt); void load(); }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Record forms
// ---------------------------------------------------------------------------

function AncForm({ onSave }: { onSave: (p: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ gaWeeks: '12', weightKg: '', systolicBp: '', diastolicBp: '', fetalHeartRate: '', riskAssessment: 'LOW', supplements: '', nextVisitAt: '' });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, edd: undefined, supplements: f.supplements || undefined, nextVisitAt: f.nextVisitAt || undefined, weightKg: f.weightKg ? Number(f.weightKg) : undefined, systolicBp: f.systolicBp ? Number(f.systolicBp) : undefined, diastolicBp: f.diastolicBp ? Number(f.diastolicBp) : undefined, fetalHeartRate: f.fetalHeartRate ? Number(f.fetalHeartRate) : undefined, gaWeeks: Number(f.gaWeeks) }); }}>
      <Field label="GA weeks"><Input type="number" min={1} max={45} required value={f.gaWeeks} onChange={(e) => set('gaWeeks', e.target.value)} /></Field>
      <Field label="Weight (kg)"><Input type="number" step="0.1" value={f.weightKg} onChange={(e) => set('weightKg', e.target.value)} /></Field>
      <Field label="Systolic BP"><Input type="number" value={f.systolicBp} onChange={(e) => set('systolicBp', e.target.value)} /></Field>
      <Field label="Diastolic BP"><Input type="number" value={f.diastolicBp} onChange={(e) => set('diastolicBp', e.target.value)} /></Field>
      <Field label="Fetal heart rate"><Input type="number" value={f.fetalHeartRate} onChange={(e) => set('fetalHeartRate', e.target.value)} /></Field>
      <Field label="Risk assessment">
        <Select value={f.riskAssessment} onChange={(e) => set('riskAssessment', e.target.value)}>
          <option value="LOW">Low</option>
          <option value="HIGH">High</option>
        </Select>
      </Field>
      <Field label="Supplements"><Input value={f.supplements} onChange={(e) => set('supplements', e.target.value)} placeholder="e.g. Iron + folic acid" /></Field>
      <Field label="Next visit"><Input type="date" value={f.nextVisitAt} onChange={(e) => set('nextVisitAt', e.target.value)} /></Field>
      <div className="col-span-full"><Button type="submit" variant="green">Save ANC visit</Button></div>
    </form>
  );
}

function DeliveryForm({ onSave }: { onSave: (p: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ deliveryType: 'NORMAL', mode: 'VAGINAL', outcome: 'LIVE_BIRTH', birthWeightKg: '', apgar1: '', apgar5: '', maternalOutcome: 'WELL', newbornOutcome: 'WELL', attendedByName: '' });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, birthWeightKg: f.birthWeightKg ? Number(f.birthWeightKg) : undefined, apgar1: f.apgar1 ? Number(f.apgar1) : undefined, apgar5: f.apgar5 ? Number(f.apgar5) : undefined, attendedByName: f.attendedByName || undefined }); }}>
      <Field label="Type">
        <Select value={f.deliveryType} onChange={(e) => set('deliveryType', e.target.value)}>
          <option value="NORMAL">Normal</option>
          <option value="ASSISTED">Assisted</option>
          <option value="CAESAREAN">Caesarean</option>
        </Select>
      </Field>
      <Field label="Mode">
        <Select value={f.mode} onChange={(e) => set('mode', e.target.value)}>
          <option value="VAGINAL">Vaginal</option>
          <option value="INSTRUMENTAL">Instrumental</option>
          <option value="C_SECTION">C-section</option>
        </Select>
      </Field>
      <Field label="Outcome">
        <Select value={f.outcome} onChange={(e) => set('outcome', e.target.value)}>
          <option value="LIVE_BIRTH">Live birth</option>
          <option value="STILLBIRTH">Stillbirth</option>
        </Select>
      </Field>
      <Field label="Birth weight (kg)"><Input type="number" step="0.01" value={f.birthWeightKg} onChange={(e) => set('birthWeightKg', e.target.value)} /></Field>
      <Field label="APGAR 1 min"><Input type="number" min={0} max={10} value={f.apgar1} onChange={(e) => set('apgar1', e.target.value)} /></Field>
      <Field label="APGAR 5 min"><Input type="number" min={0} max={10} value={f.apgar5} onChange={(e) => set('apgar5', e.target.value)} /></Field>
      <Field label="Maternal outcome">
        <Select value={f.maternalOutcome} onChange={(e) => set('maternalOutcome', e.target.value)}>
          <option value="WELL">Well</option>
          <option value="COMPLICATION">Complication</option>
          <option value="DEATH">Death</option>
        </Select>
      </Field>
      <Field label="Newborn outcome">
        <Select value={f.newbornOutcome} onChange={(e) => set('newbornOutcome', e.target.value)}>
          <option value="WELL">Well</option>
          <option value="NICU">NICU</option>
          <option value="DEATH">Death</option>
        </Select>
      </Field>
      <Field label="Attended by"><Input value={f.attendedByName} onChange={(e) => set('attendedByName', e.target.value)} placeholder="e.g. Midwife Efua Acquah" /></Field>
      <div className="col-span-full"><Button type="submit" variant="green">Save delivery</Button></div>
    </form>
  );
}

function PncForm({ onSave }: { onSave: (p: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ maternalReview: '', newbornReview: '', breastfeeding: 'EXCLUSIVE', contraception: '', immunization: '' });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, maternalReview: f.maternalReview || undefined, newbornReview: f.newbornReview || undefined, contraception: f.contraception || undefined, immunization: f.immunization || undefined }); }}>
      <Field label="Maternal review"><Textarea rows={2} value={f.maternalReview} onChange={(e) => set('maternalReview', e.target.value)} /></Field>
      <Field label="Newborn review"><Textarea rows={2} value={f.newbornReview} onChange={(e) => set('newbornReview', e.target.value)} /></Field>
      <Field label="Breastfeeding">
        <Select value={f.breastfeeding} onChange={(e) => set('breastfeeding', e.target.value)}>
          <option value="EXCLUSIVE">Exclusive</option>
          <option value="MIXED">Mixed</option>
          <option value="NONE">None</option>
        </Select>
      </Field>
      <Field label="Contraception"><Input value={f.contraception} onChange={(e) => set('contraception', e.target.value)} placeholder="e.g. Depo-Provera" /></Field>
      <Field label="Infant immunization"><Input value={f.immunization} onChange={(e) => set('immunization', e.target.value)} placeholder="e.g. BCG + OPV0" /></Field>
      <div className="col-span-full"><Button type="submit" variant="green">Save PNC visit</Button></div>
    </form>
  );
}

function PartographForm({ onSave }: { onSave: (p: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ labourStartedAt: new Date().toISOString().slice(0, 10), notes: '' });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); onSave({ labourStartedAt: f.labourStartedAt ? new Date(f.labourStartedAt).toISOString() : undefined, notes: f.notes || undefined }); }}>
      <Field label="Labour onset"><Input type="date" required value={f.labourStartedAt} onChange={(e) => set('labourStartedAt', e.target.value)} /></Field>
      <Field label="Notes"><Input value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="col-span-full"><Button type="submit" variant="green">Start partograph</Button></div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Chart table + observation entry
// ---------------------------------------------------------------------------

function ChartTable({ rows, partographId, patientId, canWrite, onRecorded }: {
  rows: PartographObservation[];
  partographId: string;
  patientId: string;
  canWrite: boolean;
  onRecorded: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState({ cervicalDilationCm: '', fetalHeartRateBpm: '', contractionsPer10Min: '', descentFifths: '' });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function record() {
    try {
      await api(`/patients/${patientId}/partographs/${partographId}/observations`, {
        method: 'POST',
        body: {
          cervicalDilationCm: f.cervicalDilationCm ? Number(f.cervicalDilationCm) : undefined,
          fetalHeartRateBpm: f.fetalHeartRateBpm ? Number(f.fetalHeartRateBpm) : undefined,
          contractionsPer10Min: f.contractionsPer10Min ? Number(f.contractionsPer10Min) : undefined,
          descentFifths: f.descentFifths ? Number(f.descentFifths) : undefined,
        },
      });
      toast('Observation recorded', 'success');
      setF({ cervicalDilationCm: '', fetalHeartRateBpm: '', contractionsPer10Min: '', descentFifths: '' });
      onRecorded();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-xs text-slate-400">No observations yet — record the first one below.</p>}
      <div className="overflow-x-auto rounded-md border border-slate-100 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
              {['Time', 'Cx (cm)', 'FHR', 'Contr/10m', 'Descent', 'Alert line', 'Action line'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="px-3 py-2 text-slate-500">{fmtDateTime(o.observedAt)}</td>
                <td className="px-3 py-2 font-semibold text-g-ink">{o.cervicalDilationCm ?? '—'}</td>
                <td className="px-3 py-2">{o.fetalHeartRateBpm ?? '—'}</td>
                <td className="px-3 py-2">{o.contractionsPer10Min ?? '—'}</td>
                <td className="px-3 py-2">{o.descentFifths ?? '—'}</td>
                <td className="px-3 py-2">{o.beyondAlertLine === null ? '—' : o.beyondAlertLine ? <Badge tone="gold">At/below</Badge> : <Badge tone="red">Beyond</Badge>}</td>
                <td className="px-3 py-2">{o.beyondActionLine === null ? '—' : o.beyondActionLine ? <Badge tone="red">Beyond</Badge> : <Badge tone="green">OK</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canWrite && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <Field label="Cervix (cm)"><Input type="number" min={0} max={10} value={f.cervicalDilationCm} onChange={(e) => set('cervicalDilationCm', e.target.value)} /></Field>
          <Field label="FHR (bpm)"><Input type="number" value={f.fetalHeartRateBpm} onChange={(e) => set('fetalHeartRateBpm', e.target.value)} /></Field>
          <Field label="Contractions /10m"><Input type="number" value={f.contractionsPer10Min} onChange={(e) => set('contractionsPer10Min', e.target.value)} /></Field>
          <Field label="Descent (fifths)"><Input type="number" min={0} max={5} value={f.descentFifths} onChange={(e) => set('descentFifths', e.target.value)} /></Field>
          <Button variant="green" onClick={() => void record()}>Record observation</Button>
        </div>
      )}
    </div>
  );
}
