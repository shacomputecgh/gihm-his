import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type MARTab = 'schedule' | 'administered' | 'patients';

interface MedicationOrder {
  id: string;
  patientName: string;
  ward: string;
  bed: string;
  mrn: string;
  drug: string;
  dose: string;
  route: 'oral' | 'IV' | 'IM' | 'SC' | 'topical' | 'inhalation' | 'rectal';
  frequency: string;
  startTime: string;
  lastAdministered?: string;
  nextDue: string;
  status: 'pending' | 'due' | 'overdue' | 'administered' | 'held' | 'cancelled';
  prescribedBy: string;
  indication: string;
  specialInstructions?: string;
  prn: boolean;
  startDate: string;
  endDate?: string;
  administrations: Administration[];
}

interface Administration {
  id: string;
  time: string;
  date: string;
  nurse: string;
  given: boolean;
  held: boolean;
  holdReason?: string;
  site?: string;
  notes?: string;
}

const MOCK_MEDS: MedicationOrder[] = [
  { id: 'MAR001', patientName: 'Kwame Asante', ward: 'Medical', bed: 'M-12', mrn: 'MRN-001', drug: 'Amlodipine', dose: '5mg', route: 'oral', frequency: 'OD (morning)', startTime: '08:00', nextDue: '08:00', status: 'due', prescribedBy: 'Dr. Mensah', indication: 'Hypertension', prn: false, startDate: '2026-05-20', administrations: [
    { id: 'A001', time: '08:15', date: '2026-05-22', nurse: 'Nurse Ama', given: true, held: false },
    { id: 'A002', time: '08:10', date: '2026-05-23', nurse: 'Nurse Ama', given: true, held: false },
  ] },
  { id: 'MAR002', patientName: 'Kwame Asante', ward: 'Medical', bed: 'M-12', mrn: 'MRN-001', drug: 'Enalapril', dose: '10mg', route: 'oral', frequency: 'BD', startTime: '08:00', nextDue: '20:00', status: 'pending', prescribedBy: 'Dr. Mensah', indication: 'Hypertension', prn: false, startDate: '2026-05-20', administrations: [
    { id: 'A003', time: '08:20', date: '2026-05-23', nurse: 'Nurse Ama', given: true, held: false },
  ] },
  { id: 'MAR003', patientName: 'Kwame Asante', ward: 'Medical', bed: 'M-12', mrn: 'MRN-001', drug: 'Paracetamol', dose: '1g', route: 'oral', frequency: 'QDS (PRN)', startTime: '08:00', nextDue: 'NOW', status: 'overdue', prescribedBy: 'Dr. Mensah', indication: 'Headache', specialInstructions: 'For headache > 5/10', prn: true, startDate: '2026-05-23', administrations: [] },
  { id: 'MAR004', patientName: 'Ama Darko', ward: 'Surgical', bed: 'S-05', mrn: 'MRN-002', drug: 'Cefuroxime', dose: '750mg', route: 'IV', frequency: 'TDS', startTime: '06:00', nextDue: '14:00', status: 'pending', prescribedBy: 'Dr. Boateng', indication: 'Appendicitis — prophylaxis', prn: false, startDate: '2026-05-23', administrations: [
    { id: 'A004', time: '06:30', date: '2026-05-23', nurse: 'Nurse Kofi', given: true, held: false, site: 'Left antecubital fossa' },
  ] },
  { id: 'MAR005', patientName: 'Ama Darko', ward: 'Surgical', bed: 'S-05', mrn: 'MRN-002', drug: 'Metronidazole', dose: '500mg', route: 'IV', frequency: 'TDS', startTime: '06:00', nextDue: '14:00', status: 'pending', prescribedBy: 'Dr. Boateng', indication: 'Appendicitis', prn: false, startDate: '2026-05-23', administrations: [
    { id: 'A005', time: '06:45', date: '2026-05-23', nurse: 'Nurse Kofi', given: true, held: false, site: 'Right hand' },
  ] },
  { id: 'MAR006', patientName: 'Ama Darko', ward: 'Surgical', bed: 'S-05', mrn: 'MRN-002', drug: 'Paracetamol IV', dose: '1g', route: 'IV', frequency: 'QDS', startTime: '06:00', nextDue: '14:00', status: 'pending', prescribedBy: 'Dr. Boateng', indication: 'Pain management', specialInstructions: 'Infuse over 15 minutes', prn: false, startDate: '2026-05-23', administrations: [] },
  { id: 'MAR007', patientName: 'Kofi Asante', ward: 'Paediatrics', bed: 'P-03', mrn: 'MRN-003', drug: 'Amoxicillin-Clav', dose: '250mg', route: 'oral', frequency: 'TDS', startTime: '08:00', nextDue: '16:00', status: 'pending', prescribedBy: 'Dr. Osei', indication: 'Pneumonia', prn: false, startDate: '2026-05-23', administrations: [
    { id: 'A006', time: '08:30', date: '2026-05-23', nurse: 'Nurse Abena', given: true, held: false },
  ] },
  { id: 'MAR008', patientName: 'Kofi Asante', ward: 'Paediatrics', bed: 'P-03', mrn: 'MRN-003', drug: 'Salbutamol Inhaler', dose: '2 puffs', route: 'inhalation', frequency: 'QDS', startTime: '08:00', nextDue: '12:00', status: 'due', prescribedBy: 'Dr. Osei', indication: 'Bronchospasm', specialInstructions: 'Use spacer', prn: false, startDate: '2026-05-23', administrations: [] },
  { id: 'MAR009', patientName: 'Efua Mensah', ward: 'Maternity', bed: 'MT-02', mrn: 'MRN-004', drug: 'Iron Supplement', dose: '200mg', route: 'oral', frequency: 'OD', startTime: '08:00', nextDue: '08:00', status: 'due', prescribedBy: 'Dr. Agyeman', indication: 'Postnatal anaemia prevention', prn: false, startDate: '2026-05-23', administrations: [] },
  { id: 'MAR010', patientName: 'Efua Mensah', ward: 'Maternity', bed: 'MT-02', mrn: 'MRN-004', drug: 'Paracetamol', dose: '1g', route: 'oral', frequency: 'QDS (PRN)', startTime: '08:00', nextDue: 'NOW', status: 'overdue', prescribedBy: 'Dr. Agyeman', indication: 'Post-delivery pain', prn: true, startDate: '2026-05-23', administrations: [] },
];

const ROUTES: Record<string, { color: string; bg: string }> = {
  oral: { color: 'text-green-700', bg: 'bg-green-50' },
  IV: { color: 'text-red-700', bg: 'bg-red-50' },
  IM: { color: 'text-blue-700', bg: 'bg-blue-50' },
  SC: { color: 'text-purple-700', bg: 'bg-purple-50' },
  topical: { color: 'text-orange-700', bg: 'bg-orange-50' },
  inhalation: { color: 'text-cyan-700', bg: 'bg-cyan-50' },
  rectal: { color: 'text-pink-700', bg: 'bg-pink-50' },
};

export default function MedicationAdministration() {
  
  const [tab, setTab] = useState<MARTab>('schedule');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const wards = [...new Set(MOCK_MEDS.map((m) => m.ward))];
  const filteredMeds = MOCK_MEDS.filter((m) => {
    const matchWard = wardFilter === 'all' || m.ward === wardFilter;
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchWard && matchStatus;
  });

  const overdueMeds = MOCK_MEDS.filter((m) => m.status === 'overdue').length;
  const dueMeds = MOCK_MEDS.filter((m) => m.status === 'due').length;
  const administeredToday = MOCK_MEDS.reduce((acc, m) => acc + m.administrations.filter(a => a.date === '2026-05-23').length, 0);

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
          title="Add New Medication Administration"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"drugName","label":"Drug Name","type":"text","required":true},{"name":"dose","label":"Dose","type":"text","required":true},{"name":"route","label":"Route","type":"select","options":["Oral","IV","IM","SC","Topical","Inhaled","Rectal","Sublingual"]},{"name":"frequency","label":"Frequency","type":"select","options":["Once","BD","TDS","QDS","PRN","STAT"]},{"name":"nurse","label":"Administering Nurse","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Medication Administration Records (MAR)" subtitle="Ward medication tracking — prescribed, due, administered, held" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-slate-700">{MOCK_MEDS.length}</div><div className="text-xs text-slate-500">Total Orders</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{overdueMeds}</div><div className="text-xs text-slate-500">Overdue ⚠️</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{dueMeds}</div><div className="text-xs text-slate-500">Due Now</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{administeredToday}</div><div className="text-xs text-slate-500">Administered Today</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{wards.length}</div><div className="text-xs text-slate-500">Wards</div></Card>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(['schedule', 'administered', 'patients'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {t === 'schedule' ? '📋 Schedule' : t === 'administered' ? '✅ Administered' : '👥 By Patient'}
            </button>
          ))}
        </div>
        <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
          <option value="all">All Wards</option>
          {wards.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
          <option value="all">All Status</option>
          <option value="overdue">Overdue</option>
          <option value="due">Due Now</option>
          <option value="pending">Pending</option>
          <option value="administered">Administered</option>
        </select>
      </div>

      {/* Schedule View */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          {filteredMeds.map((med) => {
            const routeCfg = ROUTES[med.route] ?? { color: 'text-slate-700', bg: 'bg-slate-50' };
            return (
              <Card key={med.id} className={`p-4 transition-all ${med.status === 'overdue' ? 'border-l-4 border-red-500 bg-red-50/30' : med.status === 'due' ? 'border-l-4 border-amber-500 bg-amber-50/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{med.drug}</h3>
                      <Badge tone={med.status === 'overdue' ? 'red' : med.status === 'due' ? 'gold' : med.status === 'administered' ? 'green' : 'gray'}>
                        {med.status === 'overdue' ? '🔴 OVERDUE' : med.status === 'due' ? '🟡 DUE NOW' : med.status === 'administered' ? '✅ DONE' : '⏳ PENDING'}
                      </Badge>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${routeCfg.bg} ${routeCfg.color}`}>{med.route.toUpperCase()}</span>
                      {med.prn && <Badge tone="navy">PRN</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>👤 {med.patientName}</span>
                      <span>🏥 {med.ward} {med.bed}</span>
                      <span>💊 {med.dose}</span>
                      <span>⏰ {med.frequency}</span>
                      <span>👨‍⚕️ {med.prescribedBy}</span>
                      <span>📅 Since {med.startDate}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Indication: {med.indication}
                      {med.specialInstructions && <span className="ml-2 text-amber-600">⚠️ {med.specialInstructions}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {med.status !== 'administered' && (
                      <>
                        <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Give</Button>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-xs">⏸️ Hold</Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Administration History */}
                {med.administrations.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">ADMINISTRATION HISTORY</div>
                    <div className="flex flex-wrap gap-1">
                      {med.administrations.map((a) => (
                        <span key={a.id} className={`rounded px-2 py-0.5 text-[10px] ${a.given ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {a.date} {a.time} — {a.nurse} {a.given ? '✅' : '⏸️'} {a.site && `(${a.site})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Administered View */}
      {tab === 'administered' && (
        <Card className="p-4">
          <h3 className="font-bold text-sm text-slate-700 mb-3">✅ Today's Administered Medications</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left text-slate-500">
                <th className="p-2">Time</th><th className="p-2">Patient</th><th className="p-2">Drug</th><th className="p-2">Dose</th><th className="p-2">Route</th><th className="p-2">Nurse</th><th className="p-2">Notes</th>
              </tr></thead>
              <tbody>
                {MOCK_MEDS.flatMap((m) => m.administrations.filter(a => a.date === '2026-05-23').map(a => ({ ...a, drug: m.drug, dose: m.dose, route: m.route, patient: m.patientName }))).map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="p-2 font-medium">{a.time}</td><td className="p-2">{a.patient}</td><td className="p-2 font-medium">{a.drug}</td>
                    <td className="p-2">{a.dose}</td><td className="p-2">{a.route}</td><td className="p-2">{a.nurse}</td><td className="p-2 text-slate-500">{a.notes ?? a.site ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* By Patient View */}
      {tab === 'patients' && (
        <div className="space-y-4">
          {[...new Set(MOCK_MEDS.map(m => m.patientName))].map((patient) => {
            const patientMeds = MOCK_MEDS.filter(m => m.patientName === patient);
            const ward = patientMeds[0]?.ward ?? '';
            return (
              <Card key={patient} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-slate-800">{patient}</h3>
                  <Badge tone="blue">{ward}</Badge>
                  <Badge tone="gray">{patientMeds.length} medications</Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {patientMeds.map((med) => {
                    const routeCfg = ROUTES[med.route] ?? { color: 'text-slate-700', bg: 'bg-slate-50' };
                    return (
                      <div key={med.id} className={`rounded-lg border p-2 ${med.status === 'overdue' ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">{med.drug} {med.dose}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${routeCfg.bg} ${routeCfg.color}`}>{med.route}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{med.frequency} · {med.indication}</div>
                        <div className="text-[10px] mt-1">
                          {med.administrations.length > 0
                            ? <span className="text-green-600">Last: {med.administrations[med.administrations.length - 1]?.date} {med.administrations[med.administrations.length - 1]?.time}</span>
                            : <span className="text-amber-600">Not yet administered today</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
