import { useState } from 'react';
import { Card, Badge, Button, Input, Select, Field, StatCard } from '../ui';
import { getControlledDrugs } from '../../lib/drugDatabase';

interface ControlledLog {
  id: string;
  drugName: string;
  strength: string;
  schedule: string;
  action: 'ISSUED' | 'RETURNED' | 'DESTROYED' | 'RECONCILED' | 'TRANSFERRED';
  quantity: number;
  patientName?: string;
  patientMrn?: string;
  prescriber?: string;
  witness: string;
  pharmacist: string;
  date: string;
  notes: string;
}

const SAMPLE_LOGS: ControlledLog[] = [
  { id: 'CL-001', drugName: 'Morphine Sulfate', strength: '10mg/ml', schedule: 'Schedule II', action: 'ISSUED', quantity: 5, patientName: 'Yaw Boateng', patientMrn: 'GH-000004', prescriber: 'Dr. Faustina Quarshie', witness: 'Nurse Ama', pharmacist: 'Pharm. Osei', date: '2026-08-22', notes: 'Post-operative pain management' },
  { id: 'CL-002', drugName: 'Tramadol', strength: '50mg', schedule: 'Schedule IV', action: 'ISSUED', quantity: 20, patientName: 'Kwesi Appiah', patientMrn: 'GH-000006', prescriber: 'Dr. Akosua Boateng', witness: 'Nurse Kofi', pharmacist: 'Pharm. Mensah', date: '2026-08-22', notes: 'Chronic pain management' },
  { id: 'CL-003', drugName: 'Morphine Sulfate', strength: '10mg/ml', schedule: 'Schedule II', action: 'RECONCILED', quantity: 45, witness: 'Store Manager', pharmacist: 'Pharm. Osei', date: '2026-08-21', notes: 'Monthly reconciliation — all accounted for' },
  { id: 'CL-004', drugName: 'Codeine Phosphate', strength: '30mg', schedule: 'Schedule III', action: 'ISSUED', quantity: 30, patientName: 'Esi Darko', patientMrn: 'GH-000003', prescriber: 'Dr. Nana Agyeman', witness: 'Nurse Abena', pharmacist: 'Pharm. Mensah', date: '2026-08-20', notes: 'Post-surgical cough and pain' },
  { id: 'CL-005', drugName: 'Diazepam', strength: '5mg', schedule: 'Schedule IV', action: 'TRANSFERRED', quantity: 100, witness: 'ICU In-charge', pharmacist: 'Pharm. Osei', date: '2026-08-19', notes: 'Transfer to ICU controlled cabinet' },
  { id: 'CL-006', drugName: 'Morphine Sulfate', strength: '10mg/ml', schedule: 'Schedule II', action: 'DESTROYED', quantity: 3, witness: 'FDA Inspector', pharmacist: 'Pharm. Osei', date: '2026-08-18', notes: 'Expired ampoules — witnessed destruction' },
];

const SCHEDULE_COLORS: Record<string, 'red' | 'gold' | 'navy' | 'blue'> = {
  'Schedule I': 'red', 'Schedule II': 'red', 'Schedule III': 'gold', 'Schedule IV': 'blue',
};

const ACTION_COLORS: Record<string, 'green' | 'gold' | 'red' | 'navy' | 'blue'> = {
  ISSUED: 'blue', RETURNED: 'green', DESTROYED: 'red', RECONCILED: 'navy', TRANSFERRED: 'gold',
};

export default function PharmacyControlled() {
  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [showNew, setShowNew] = useState(false);
  const controlledDrugs = getControlledDrugs();

  const stats = {
    totalControlled: controlledDrugs.length,
    scheduleI_II: controlledDrugs.filter((d) => d.controlledStatus === 'Schedule I' || d.controlledStatus === 'Schedule II').length,
    todayIssued: logs.filter((l) => l.action === 'ISSUED' && l.date === '2026-08-22').length,
    lastReconciliation: '2026-08-21',
  };

  const [newLog, setNewLog] = useState({
    drugName: '', strength: '', schedule: 'Schedule II', action: 'ISSUED' as ControlledLog['action'],
    quantity: 1, patientName: '', patientMrn: '', prescriber: '', witness: '', notes: '',
  });

  function handleDrugSelect(name: string) {
    const drug = controlledDrugs.find((d) => d.brandName === name || d.genericName === name);
    if (drug) {
      setNewLog((f) => ({ ...f, drugName: drug.brandName, strength: drug.strength, schedule: drug.controlledStatus }));
    } else {
      setNewLog((f) => ({ ...f, drugName: name }));
    }
  }

  function addLog() {
    if (!newLog.drugName || !newLog.witness) return;
    const entry: ControlledLog = {
      id: `CL-${String(logs.length + 1).padStart(3, '0')}`,
      drugName: newLog.drugName, strength: newLog.strength, schedule: newLog.schedule,
      action: newLog.action, quantity: newLog.quantity, patientName: newLog.patientName || undefined,
      patientMrn: newLog.patientMrn || undefined, prescriber: newLog.prescriber || undefined,
      witness: newLog.witness, pharmacist: 'Current Pharmacist',
      date: new Date().toISOString().slice(0, 10), notes: newLog.notes,
    };
    setLogs([entry, ...logs]);
    setShowNew(false);
    setNewLog({ drugName: '', strength: '', schedule: 'Schedule II', action: 'ISSUED', quantity: 1, patientName: '', patientMrn: '', prescriber: '', witness: '', notes: '' });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Controlled Drugs" value={stats.totalControlled} tone="navy" icon="shield" />
        <StatCard label="Schedule I–II" value={stats.scheduleI_II} tone="red" icon="alert" />
        <StatCard label="Today Issued" value={stats.todayIssued} tone="blue" icon="pill" />
        <StatCard label="Last Reconciliation" value={stats.lastReconciliation} tone="green" icon="check" />
      </div>

      <div className="flex justify-end">
        <Button variant="green" onClick={() => setShowNew(!showNew)}>
          {showNew ? '✕ Cancel' : '+ New Controlled Entry'}
        </Button>
      </div>

      {/* Controlled Drug Stock */}
      <Card>
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Controlled Drug Stock</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                {['Drug', 'Schedule', 'Stock', 'Batch', 'Location', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {controlledDrugs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2">
                    <p className="font-medium text-g-ink dark:text-white">{d.brandName} {d.strength}</p>
                    <p className="text-xs text-slate-400">{d.genericName} · {d.dosageForm}</p>
                  </td>
                  <td className="px-4 py-2">  <Badge tone={SCHEDULE_COLORS[d.controlledStatus] ?? ('gray' as const)}>{d.controlledStatus}</Badge></td>
                  <td className="px-4 py-2 tabular-nums font-bold text-g-ink dark:text-white">{d.availableQuantity}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{d.batchNumber}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{d.storageLocation}</td>
                  <td className="px-4 py-2"><Badge tone="green">Locked</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Entry Form */}
      {showNew && (
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">New Controlled Drug Entry</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Drug *">
              <select value={newLog.drugName} onChange={(e) => handleDrugSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option value="">Select controlled drug</option>
                {controlledDrugs.map((d) => <option key={d.id} value={d.brandName}>{d.brandName} {d.strength} ({d.controlledStatus})</option>)}
              </select>
            </Field>
            <Field label="Action *">
              <Select value={newLog.action} onChange={(e) => setNewLog((f) => ({ ...f, action: e.target.value as ControlledLog['action'] }))}>
                <option value="ISSUED">Issue to Patient/Ward</option>
                <option value="RETURNED">Return to Stock</option>
                <option value="TRANSFERRED">Transfer Between Units</option>
                <option value="DESTROYED">Destroy/Waste</option>
                <option value="RECONCILED">Reconciliation Count</option>
              </Select>
            </Field>
            <Field label="Quantity *">
              <Input type="number" value={String(newLog.quantity)} onChange={(e) => setNewLog((f) => ({ ...f, quantity: Number(e.target.value) }))} />
            </Field>
            {newLog.action === 'ISSUED' && (
              <>
                <Field label="Patient Name">
                  <Input value={newLog.patientName} onChange={(e) => setNewLog((f) => ({ ...f, patientName: e.target.value }))} />
                </Field>
                <Field label="MRN">
                  <Input value={newLog.patientMrn} onChange={(e) => setNewLog((f) => ({ ...f, patientMrn: e.target.value }))} />
                </Field>
                <Field label="Prescriber">
                  <Input value={newLog.prescriber} onChange={(e) => setNewLog((f) => ({ ...f, prescriber: e.target.value }))} placeholder="Dr. Name" />
                </Field>
              </>
            )}
            <Field label="Witness *">
              <Input value={newLog.witness} onChange={(e) => setNewLog((f) => ({ ...f, witness: e.target.value }))} placeholder="Witness name (required)" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes">
                <Input value={newLog.notes} onChange={(e) => setNewLog((f) => ({ ...f, notes: e.target.value }))} placeholder="Reason / notes" />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="green" onClick={addLog}>Save Entry</Button>
          </div>
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Controlled Drug Audit Log</h3>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={ACTION_COLORS[l.action]}>{l.action}</Badge>
                <div>
                  <p className="text-sm font-medium text-g-ink dark:text-white">{l.drugName} {l.strength}</p>
                  <p className="text-xs text-slate-400">
                    {l.schedule} · Qty: {l.quantity} · {l.date}
                    {l.patientName && ` · Patient: ${l.patientName}`}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Pharmacist: {l.pharmacist}</p>
                <p>Witness: {l.witness}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
