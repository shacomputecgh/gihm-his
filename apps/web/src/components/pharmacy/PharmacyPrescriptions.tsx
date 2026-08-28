import { useState } from 'react';
import { Card, Badge, Button, EmptyState, Input, Select, Field, useToast } from '../ui';
import { searchDrugs, type Drug } from '../../lib/drugDatabase';
import { fmtDateTime } from '../../lib/format';

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  ward: string;
  drugName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  quantity: number;
  dispensedQty: number;
  status: 'ACTIVE' | 'PARTIAL' | 'DISPENSED' | 'CANCELLED' | 'VERIFIED';
  priority: 'STAT' | 'URGENT' | 'ROUTINE';
  notes: string;
  createdAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
  verifiedBy?: string;
  batchNumber?: string;
}

const STATUS_COLORS: Record<string, 'green' | 'gold' | 'navy' | 'red' | 'gray' | 'blue'> = {
  ACTIVE: 'gold',
  PARTIAL: 'blue',
  DISPENSED: 'green',
  CANCELLED: 'red',
  VERIFIED: 'navy',
};

const PRIORITY_COLORS: Record<string, 'red' | 'gold' | 'gray'> = {
  STAT: 'red',
  URGENT: 'gold',
  ROUTINE: 'gray',
};

// Sample prescriptions for demo
const SAMPLE_PRESCRIPTIONS: Prescription[] = [
  { id: 'RX-001', patientId: 'P001', patientName: 'Ama Mensah', patientMrn: 'GH-000001', doctorName: 'Dr. Kwame Asante', ward: 'Medical Ward', drugName: 'Amoxicillin', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', dosage: '500mg', frequency: 'TDS', route: 'Oral', duration: '7 days', quantity: 21, dispensedQty: 0, status: 'ACTIVE', priority: 'ROUTINE', notes: 'Take with food', createdAt: '2026-08-22T08:30:00' },
  { id: 'RX-002', patientId: 'P002', patientName: 'Kofi Ansah', patientMrn: 'GH-000002', doctorName: 'Dr. Akosua Boateng', ward: 'Surgical Ward', drugName: 'Ceftriaxone', genericName: 'Ceftriaxone', strength: '1g', dosageForm: 'Injection', dosage: '1g', frequency: 'OD', route: 'IV', duration: '5 days', quantity: 5, dispensedQty: 0, status: 'ACTIVE', priority: 'URGENT', notes: 'Pre-operative prophylaxis', createdAt: '2026-08-22T09:15:00' },
  { id: 'RX-003', patientId: 'P003', patientName: 'Esi Darko', patientMrn: 'GH-000003', doctorName: 'Dr. Nana Agyeman', ward: 'Maternity', drugName: 'Ferrous Sulfate', genericName: 'Ferrous Sulfate', strength: '200mg', dosageForm: 'Tablet', dosage: '200mg', frequency: 'TDS', route: 'Oral', duration: '3 months', quantity: 270, dispensedQty: 90, status: 'PARTIAL', priority: 'ROUTINE', notes: 'Iron supplementation in pregnancy', createdAt: '2026-08-20T10:00:00' },
  { id: 'RX-004', patientId: 'P004', patientName: 'Yaw Boateng', patientMrn: 'GH-000004', doctorName: 'Dr. Faustina Quarshie', ward: 'Emergency', drugName: 'Morphine Sulfate', genericName: 'Morphine', strength: '10mg/ml', dosageForm: 'Injection', dosage: '5mg', frequency: 'PRN', route: 'IM', duration: 'As needed', quantity: 5, dispensedQty: 2, status: 'PARTIAL', priority: 'STAT', notes: 'Severe pain management — CONTROLLED', createdAt: '2026-08-22T06:45:00' },
  { id: 'RX-005', patientId: 'P005', patientName: 'Abena Osei', patientMrn: 'GH-000005', doctorName: 'Dr. Kwame Asante', ward: 'OPD', drugName: 'Artemether/Lumefantrine', genericName: 'Coartem', strength: '20/120mg', dosageForm: 'Tablet', dosage: '4 tablets', frequency: 'BD x3 days', route: 'Oral', duration: '3 days', quantity: 24, dispensedQty: 24, status: 'DISPENSED', priority: 'ROUTINE', notes: 'Malaria treatment', createdAt: '2026-08-21T14:20:00', dispensedAt: '2026-08-21T15:00:00', dispensedBy: 'Pharm. Osei' },
  { id: 'RX-006', patientId: 'P006', patientName: 'Kwesi Appiah', patientMrn: 'GH-000006', doctorName: 'Dr. Akosua Boateng', ward: 'ICU', drugName: 'Insulin Human', genericName: 'Insulin', strength: '100IU/ml', dosageForm: 'Injection', dosage: '10IU', frequency: 'TDS (AC)', route: 'SC', duration: 'Ongoing', quantity: 30, dispensedQty: 10, status: 'ACTIVE', priority: 'URGENT', notes: 'Blood sugar monitoring required', createdAt: '2026-08-22T07:00:00' },
  { id: 'RX-007', patientId: 'P007', patientName: 'Akua Sarpong', patientMrn: 'GH-000007', doctorName: 'Dr. Nana Agyeman', ward: 'Paediatric', drugName: 'Amoxicillin', genericName: 'Amoxicillin', strength: '250mg/5ml', dosageForm: 'Suspension', dosage: '5ml', frequency: 'TDS', route: 'Oral', duration: '5 days', quantity: 45, dispensedQty: 0, status: 'CANCELLED', priority: 'ROUTINE', notes: 'Allergy discovered — penicillin allergy', createdAt: '2026-08-22T10:30:00' },
];

const FREQUENCIES = ['OD', 'BD', 'TDS', 'QDS', 'PRN', 'STAT', 'Nocte', 'Mane', 'HS', '4-6 hourly', '8 hourly', '12 hourly'];
const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'PR', 'PV', 'Rectal', 'Nasal', 'Ophthalmic', 'Intrathecal'];
const DURATIONS = ['1 day', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months', '6 months', 'Ongoing', 'PRN'];
const WARDS = ['OPD', 'Emergency', 'Medical Ward', 'Surgical Ward', 'Paediatric Ward', 'Maternity Ward', 'ICU', 'NICU', 'Theatre', 'Oncology', 'Psychiatric Unit', 'Dialysis Unit'];

export default function PharmacyPrescriptions() {
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(SAMPLE_PRESCRIPTIONS);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  // New prescription form
  const [form, setForm] = useState({
    patientName: '', patientMrn: '', doctorName: '', ward: 'OPD',
    drugSearch: '', selectedDrug: null as Drug | null,
    dosage: '', frequency: 'TDS', route: 'Oral', duration: '7 days',
    quantity: 10, priority: 'ROUTINE' as 'STAT' | 'URGENT' | 'ROUTINE', notes: '',
  });

  const filtered = prescriptions.filter((rx) => {
    if (filter !== 'ALL' && rx.status !== filter) return false;
    if (search && !rx.patientName.toLowerCase().includes(search.toLowerCase()) &&
        !rx.drugName.toLowerCase().includes(search.toLowerCase()) &&
        !rx.patientMrn.toLowerCase().includes(search.toLowerCase()) &&
        !rx.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    active: prescriptions.filter((r) => r.status === 'ACTIVE').length,
    partial: prescriptions.filter((r) => r.status === 'PARTIAL').length,
    dispensed: prescriptions.filter((r) => r.status === 'DISPENSED').length,
    cancelled: prescriptions.filter((r) => r.status === 'CANCELLED').length,
    stat: prescriptions.filter((r) => r.priority === 'STAT' && r.status !== 'DISPENSED' && r.status !== 'CANCELLED').length,
  };

  function handleDrugSearch(q: string) {
    setForm((f) => ({ ...f, drugSearch: q, selectedDrug: null }));
  }

  function selectDrug(drug: Drug) {
    setForm((f) => ({
      ...f,
      drugSearch: `${drug.brandName} ${drug.strength}`,
      selectedDrug: drug,
      dosage: drug.dosage,
      route: drug.route,
    }));
  }

  function createPrescription() {
    if (!form.patientName || !form.selectedDrug) {
      toast('Please fill in patient name and select a drug', 'error');
      return;
    }
    const newRx: Prescription = {
      id: `RX-${String(prescriptions.length + 1).padStart(3, '0')}`,
      patientId: `P${String(prescriptions.length + 1).padStart(3, '0')}`,
      patientName: form.patientName,
      patientMrn: form.patientMrn || 'GH-WALK-IN',
      doctorName: form.doctorName || 'Self-prescribed',
      ward: form.ward,
      drugName: form.selectedDrug.brandName,
      genericName: form.selectedDrug.genericName,
      strength: form.selectedDrug.strength,
      dosageForm: form.selectedDrug.dosageForm,
      dosage: form.dosage || form.selectedDrug.dosage,
      frequency: form.frequency,
      route: form.route || form.selectedDrug.route,
      duration: form.duration,
      quantity: form.quantity,
      dispensedQty: 0,
      status: form.priority === 'STAT' ? 'ACTIVE' : 'ACTIVE',
      priority: form.priority,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    setPrescriptions((prev) => [newRx, ...prev]);
    setShowNew(false);
    setForm({ patientName: '', patientMrn: '', doctorName: '', ward: 'OPD', drugSearch: '', selectedDrug: null, dosage: '', frequency: 'TDS', route: 'Oral', duration: '7 days', quantity: 10, priority: 'ROUTINE', notes: '' });
    toast(`Prescription ${newRx.id} created successfully`, 'success');
  }

  function dispenseRx(rx: Prescription) {
    const remaining = rx.quantity - rx.dispensedQty;
    setPrescriptions((prev) =>
      prev.map((r) =>
        r.id === rx.id ? { ...r, dispensedQty: r.quantity, status: 'DISPENSED' as const, dispensedAt: new Date().toISOString(), dispensedBy: 'Current Pharmacist' } : r
      )
    );
    toast(`Dispensed ${remaining} × ${rx.drugName} for ${rx.patientName}`, 'success');
  }

  function verifyRx(rx: Prescription) {
    setPrescriptions((prev) =>
      prev.map((r) => r.id === rx.id ? { ...r, status: 'ACTIVE' as const, verifiedBy: 'Current Pharmacist' } : r)
    );
    toast(`Prescription ${rx.id} verified by pharmacist`, 'success');
  }

  const drugResults = form.drugSearch.length >= 2 ? searchDrugs(form.drugSearch).slice(0, 8) : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Active', value: stats.active, color: 'bg-gold/10 text-gold border-gold/20' },
          { label: 'Partial', value: stats.partial, color: 'bg-blue-50 text-blue-600 border-blue-200' },
          { label: 'Dispensed', value: stats.dispensed, color: 'bg-green-50 text-green-600 border-green-200' },
          { label: 'Cancelled', value: stats.cancelled, color: 'bg-red-50 text-red-600 border-red-200' },
          { label: 'STAT', value: stats.stat, color: 'bg-red-100 text-red-700 border-red-300' },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border p-3 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label="Search prescriptions">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, drug, MRN, or Rx ID…" />
            </Field>
          </div>
          <Field label="Status filter">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PARTIAL">Partial</option>
              <option value="VERIFIED">Verified</option>
              <option value="DISPENSED">Dispensed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
          <Button variant="green" onClick={() => setShowNew(!showNew)}>
            {showNew ? '✕ Cancel' : '+ New Prescription'}
          </Button>
        </div>
      </Card>

      {/* New Prescription Form */}
      {showNew && (
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">New Prescription</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Patient Name *">
              <Input value={form.patientName} onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))} placeholder="Full name" />
            </Field>
            <Field label="MRN">
              <Input value={form.patientMrn} onChange={(e) => setForm((f) => ({ ...f, patientMrn: e.target.value }))} placeholder="GH-XXXXXX" />
            </Field>
            <Field label="Prescriber">
              <Input value={form.doctorName} onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))} placeholder="Dr. Name" />
            </Field>
            <Field label="Ward/Unit">
              <Select value={form.ward} onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}>
                {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as 'STAT' | 'URGENT' | 'ROUTINE' }))}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT (Immediate)</option>
              </Select>
            </Field>
            <div className="relative">
              <Field label="Search Drug *">
                <Input value={form.drugSearch} onChange={(e) => handleDrugSearch(e.target.value)} placeholder="Type drug name…" />
              </Field>
              {drugResults.length > 0 && !form.selectedDrug && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {drugResults.map((d) => (
                    <button key={d.id} onClick={() => selectDrug(d)} className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700">
                      <div>
                        <p className="font-medium">{d.brandName} {d.strength}</p>
                        <p className="text-xs text-slate-400">{d.genericName} · {d.dosageForm} · {d.category}</p>
                      </div>
                      <span className="text-xs text-slate-400">GH₵ {d.sellingPrice}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Field label="Dose">
              <Input value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" />
            </Field>
            <Field label="Frequency">
              <Select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Route">
              <Select value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}>
                {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Duration">
              <Select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Quantity">
              <Input type="number" value={String(form.quantity)} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Special instructions" />
            </Field>
          </div>
          {form.selectedDrug && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs font-bold text-blue-600">Selected: {form.selectedDrug.brandName} {form.selectedDrug.strength}</p>
              <p className="text-xs text-blue-500">{form.selectedDrug.genericName} · {form.selectedDrug.category} · GH₵ {form.selectedDrug.sellingPrice}</p>
              {form.selectedDrug.controlledStatus !== 'None' && (
                <p className="mt-1 text-xs font-bold text-red-600">⚠️ CONTROLLED: {form.selectedDrug.controlledStatus}</p>
              )}
              {form.selectedDrug.drugInteractions.length > 0 && (
                <p className="mt-1 text-xs text-amber-600">Interactions: {form.selectedDrug.drugInteractions.join(', ')}</p>
              )}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="green" onClick={createPrescription}>Create Prescription</Button>
          </div>
        </Card>
      )}

      {/* Prescriptions Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="pill" title="No prescriptions found" message="Adjust filters or create a new prescription." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                  {['Rx ID', 'Patient', 'Medication', 'Dose/Route', 'Freq', 'Qty', 'Status', 'Priority', 'Ward', ''].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-g-green">{rx.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-g-ink dark:text-white">{rx.patientName}</p>
                      <p className="text-xs text-slate-400">{rx.patientMrn}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-g-ink dark:text-white">{rx.drugName}</p>
                      <p className="text-xs text-slate-400">{rx.genericName} · {rx.strength} · {rx.dosageForm}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rx.dosage} · {rx.route}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rx.frequency}</td>
                    <td className="px-4 py-3 tabular-nums text-xs">
                      <span className="text-slate-500">{rx.dispensedQty}/{rx.quantity}</span>
                    </td>
                    <td className="px-4 py-3"><Badge tone={STATUS_COLORS[rx.status] ?? 'gray'}>{rx.status}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={PRIORITY_COLORS[rx.priority] ?? 'gray'}>{rx.priority}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rx.ward}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {(rx.status === 'ACTIVE' || rx.status === 'PARTIAL') && (
                          <Button size="sm" variant="green" onClick={() => dispenseRx(rx)}>Dispense</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedRx(rx)}>Details</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-700">
            {filtered.length} prescription(s) · {filtered.filter((r) => r.status === 'ACTIVE').length} awaiting dispensing
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedRx(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-lg font-bold text-g-ink dark:text-white">Prescription {selectedRx.id}</h3>
              <button onClick={() => setSelectedRx(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs font-bold uppercase text-slate-400">Patient</p><p className="text-g-ink dark:text-white">{selectedRx.patientName}</p><p className="text-xs text-slate-400">{selectedRx.patientMrn}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Prescriber</p><p className="text-g-ink dark:text-white">{selectedRx.doctorName}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Medication</p><p className="text-g-ink dark:text-white">{selectedRx.drugName} {selectedRx.strength}</p><p className="text-xs text-slate-400">{selectedRx.dosageForm}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Dose / Route</p><p className="text-g-ink dark:text-white">{selectedRx.dosage} · {selectedRx.route}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Frequency</p><p className="text-g-ink dark:text-white">{selectedRx.frequency}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Duration</p><p className="text-g-ink dark:text-white">{selectedRx.duration}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Ward</p><p className="text-g-ink dark:text-white">{selectedRx.ward}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Status</p><Badge tone={STATUS_COLORS[selectedRx.status]}>{selectedRx.status}</Badge></div>
              </div>
              {selectedRx.notes && (
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-bold uppercase text-slate-400">Notes</p><p className="text-slate-600 dark:text-slate-300">{selectedRx.notes}</p></div>
              )}
              {selectedRx.dispensedAt && (
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-xs font-bold text-green-600">Dispensed: {fmtDateTime(selectedRx.dispensedAt)}</p>
                  {selectedRx.dispensedBy && <p className="text-xs text-green-500">By: {selectedRx.dispensedBy}</p>}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {(selectedRx.status === 'ACTIVE' || selectedRx.status === 'PARTIAL') && (
                  <Button variant="green" onClick={() => { dispenseRx(selectedRx); setSelectedRx(null); }}>Dispense</Button>
                )}
                {selectedRx.status === 'ACTIVE' && !selectedRx.verifiedBy && (
                  <Button variant="green" onClick={() => { verifyRx(selectedRx); setSelectedRx(null); }}>Verify</Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRx(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
