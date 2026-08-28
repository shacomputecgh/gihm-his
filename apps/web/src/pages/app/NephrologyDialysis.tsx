import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DialysisPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  diagnosis: string;
  accessType: 'AVF' | 'AVG' | 'Temporary Catheter' | 'Permcath' | 'PD Catheter';
  accessSite: string;
  dialysisType: 'HD' | 'HDF' | 'PD' | 'SLED';
  schedule: string;
  lastSession: string;
  lastKtV: number;
  lastWeight: number;
  dryWeight: number;
  preBP: string;
  postBP: string;
  urs: number;
  creatinine: number;
  egfr: number;
  potassium: number;
  hb: number;
  pth: number;
  status: 'Active' | 'Missed Session' | 'Hospitalised' | 'Transplant List';
  doctor: string;
  nextSession: string;
  notes: string;
}

const DIALYSIS_PATIENTS: DialysisPatient[] = [
  {
    id: 'DIAL-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0950',
    diagnosis: 'CKD Stage 5 — Diabetic Nephropathy', accessType: 'AVF', accessSite: 'Left Radio-Cephalic',
    dialysisType: 'HD', schedule: 'Mon/Wed/Fri 08:00-12:00', lastSession: '2026-08-22',
    lastKtV: 1.4, lastWeight: 72.5, dryWeight: 70.0, preBP: '165/95', postBP: '120/70',
    urs: 28.5, creatinine: 680, egfr: 7, potassium: 5.8, hb: 9.2, pth: 450,
    status: 'Active', doctor: 'Dr. Efua Darko', nextSession: '2026-08-25',
    notes: 'Good vascular access.超滤目标 2.5L. Dry weight achieved. Manage hyperkalaemia between sessions.'
  },
  {
    id: 'DIAL-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-0952',
    diagnosis: 'CKD Stage 5 — Chronic Glomerulonephritis', accessType: 'AVF', accessSite: 'Left Brachiocephalic',
    dialysisType: 'HDF', schedule: 'Tue/Thu/Sat 14:00-18:00', lastSession: '2026-08-23',
    lastKtV: 1.6, lastWeight: 62.0, dryWeight: 60.5, preBP: '145/88', postBP: '118/68',
    urs: 22.0, creatinine: 520, egfr: 10, potassium: 4.8, hb: 10.1, pth: 320,
    status: 'Active', doctor: 'Dr. Efua Darko', nextSession: '2026-08-25',
    notes: 'On HDF — better phosphate control. Vascular access well-functioning. Target weight 60.5kg.'
  },
  {
    id: 'DIAL-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-0954',
    diagnosis: 'CKD Stage 5 — Hypertensive Nephrosclerosis', accessType: 'Permcath', accessSite: 'Right Internal Jugular',
    dialysisType: 'HD', schedule: 'Mon/Wed/Fri 08:00-12:00', lastSession: '2026-08-22',
    lastKtV: 1.2, lastWeight: 85.0, dryWeight: 82.0, preBP: '178/100', postBP: '130/78',
    urs: 32.0, creatinine: 750, egfr: 5, potassium: 6.1, hb: 8.5, pth: 520,
    status: 'Missed Session', doctor: 'Dr. Efua Darko', nextSession: '2026-08-25',
    notes: 'Missed Friday session — transport issues. Temporary catheter in situ — plan AVF creation. Hyperkalaemia — emergency session may be needed.'
  },
  {
    id: 'DIAL-004', name: 'Efua Nyarko', age: 42, gender: 'Female', mrn: 'MRN-2026-0956',
    diagnosis: 'CKD Stage 5 — Lupus Nephritis', accessType: 'PD Catheter', accessSite: 'Abdominal',
    dialysisType: 'PD', schedule: 'CAPD — 4 exchanges daily', lastSession: '2026-08-24',
    lastKtV: 1.8, lastWeight: 58.0, dryWeight: 57.0, preBP: '130/82', postBP: '128/80',
    urs: 18.0, creatinine: 380, egfr: 14, potassium: 4.2, hb: 11.0, pth: 280,
    status: 'Transplant List', doctor: 'Dr. Efua Darko', nextSession: '2026-08-24',
    notes: 'On transplant waiting list — HLA typing complete. Living donor evaluation in progress. Good technique — independent CAPD.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800', 'Missed Session': 'bg-red-100 text-red-800',
  'Hospitalised': 'bg-yellow-100 text-yellow-800', 'Transplant List': 'bg-purple-100 text-purple-800',
};

function getKtVColor(ktv: number): string {
  if (ktv >= 1.4) return 'text-green-600';
  if (ktv >= 1.2) return 'text-yellow-600';
  return 'text-red-600';
}

function getPotassiumColor(k: number): string {
  if (k >= 5.0) return 'bg-red-50';
  if (k >= 4.5) return 'bg-yellow-50';
  return 'bg-green-50';
}

export default function NephrologyDialysis() {
  const [selected, setSelected] = useState<DialysisPatient | null>(DIALYSIS_PATIENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = DIALYSIS_PATIENTS.filter(p => filterStatus === 'All' || p.status === filterStatus);
  const missedCount = DIALYSIS_PATIENTS.filter(p => p.status === 'Missed Session').length;
  const transplantCount = DIALYSIS_PATIENTS.filter(p => p.status === 'Transplant List').length;

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
          title="Add New Dialysis Session"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Nephrology & Dialysis Unit</h1>
        <p className="text-gray-500">Dialysis scheduling, renal function monitoring, vascular access, and transplant management</p>
      </div>

      {missedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">⚠️</span>
          <div>
            <div className="font-semibold text-red-800">{missedCount > 1 ? `${missedCount} Missed Sessions` : '1 Missed Session'}</div>
            <div className="text-sm text-red-600">Patient requires follow-up — reschedule urgently</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Patients', value: DIALYSIS_PATIENTS.length, color: 'text-blue-600' },
          { label: 'Active', value: DIALYSIS_PATIENTS.filter(p => p.status === 'Active').length, color: 'text-green-600' },
          { label: 'Missed', value: missedCount, color: 'text-red-600' },
          { label: 'Transplant List', value: transplantCount, color: 'text-purple-600' },
          { label: 'Avg KtV', value: (DIALYSIS_PATIENTS.reduce((s, p) => s + p.lastKtV, 0) / DIALYSIS_PATIENTS.length).toFixed(1), color: 'text-teal-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        <option value="All">All Status</option>
        {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === p.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                    <Badge className="text-[10px] bg-blue-100 text-blue-800">{p.accessType}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{p.diagnosis}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.dialysisType} — {p.schedule}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${getKtVColor(p.lastKtV)}`}>KtV {p.lastKtV}</div>
                  <div className={`text-sm font-bold ${p.potassium >= 5.0 ? 'text-red-600' : 'text-gray-600'}`}>K+ {p.potassium}</div>
                  <div className="text-xs text-gray-400">Hb {p.hb}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <div><span className="text-gray-500">Access:</span> <span className="font-semibold">{selected.accessType}</span> — {selected.accessSite}</div>
                <div><span className="text-gray-500">Type:</span> {selected.dialysisType}</div>
                <div><span className="text-gray-500">Schedule:</span> {selected.schedule}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className={`text-lg font-bold ${getKtVColor(selected.lastKtV)}`}>{selected.lastKtV}</div>
                  <div className="text-[10px] text-gray-500">KtV (target ≥1.4)</div>
                </div>
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-blue-600">{selected.lastWeight}kg</div>
                  <div className="text-[10px] text-gray-500">Dry: {selected.dryWeight}kg</div>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <div><span className="text-gray-500">Pre-dialysis BP:</span> {selected.preBP}</div>
                <div><span className="text-gray-500">Post-dialysis BP:</span> {selected.postBP}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Blood Results</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`rounded p-2 text-center ${getPotassiumColor(selected.potassium)}`}>
                    <div className="font-bold">K+ {selected.potassium}</div>
                    <div className="text-[10px]">mmol/L</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.creatinine}</div>
                    <div className="text-[10px]">Creat (µmol/L)</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.urs}</div>
                    <div className="text-[10px]">Urea (mmol/L)</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.hb}</div>
                    <div className="text-[10px]">Hb (g/dL)</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.egfr}</div>
                    <div className="text-[10px]">eGFR</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.pth}</div>
                    <div className="text-[10px]">PTH (pg/mL)</div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
