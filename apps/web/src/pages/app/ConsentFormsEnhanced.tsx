import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Consent { id: string; patientName: string; mrn: string; formType: string; procedure: string; doctor: string; dateGenerated: string; signedBy?: string; signedDate?: string; witness?: string; status: 'Pending' | 'Signed' | 'Declined' | 'Expired'; expiryDate?: string; language: string; notes: string; }

const CONSENTS: Consent[] = [
  { id: 'CON-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', formType: 'Surgical Consent', procedure: 'Appendectomy', doctor: 'Dr. Yaw Boateng', dateGenerated: '2026-08-22', signedBy: 'Kwame Asante', signedDate: '2026-08-22 06:30', witness: 'Nurse Akua', status: 'Signed', language: 'English', notes: 'Patient understood procedure, risks, and alternatives.' },
  { id: 'CON-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', formType: 'Anaesthesia Consent', procedure: 'Caesarean Section — Spinal', doctor: 'Dr. Ama Darko', dateGenerated: '2026-08-25', signedBy: 'Akua Mensah', signedDate: '2026-08-25 14:00', witness: 'Midwife Abena', status: 'Signed', language: 'English / Twi', notes: 'Explained spinal anaesthesia risks including headache, bleeding.' },
  { id: 'CON-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', formType: 'Blood Transfusion Consent', procedure: 'Packed Red Blood Cells × 2 units', doctor: 'Dr. Ama Darko', dateGenerated: '2026-08-26', status: 'Pending', language: 'English', notes: 'Patient currently intubated. Family to be approached.' },
  { id: 'CON-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', formType: 'General Consent', procedure: 'Hospital admission and treatment', doctor: 'Dr. Kofi Asante', dateGenerated: '2026-08-20', signedBy: 'Efua Nyarko', signedDate: '2026-08-20 10:30', witness: 'Nurse Esi', status: 'Signed', language: 'English / Ga', notes: 'Standard admission consent signed.' },
  { id: 'CON-005', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', formType: 'Parental Consent', procedure: 'IV Artesunate for severe malaria', doctor: 'Dr. Nana Agyeman', dateGenerated: '2026-08-26', status: 'Pending', language: 'English / Twi', notes: 'Father consented by phone. Written signature pending.' },
  { id: 'CON-006', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', formType: 'Chemotherapy Consent', procedure: 'Cycle 3 — CAF regimen', doctor: 'Dr. Yaw Boateng', dateGenerated: '2026-08-18', signedBy: 'Ama Boateng', signedDate: '2026-08-18 09:00', witness: 'Nurse Abena', status: 'Signed', language: 'English', notes: 'Risks of hair loss, nausea, infection explained. Patient understands.' },
  { id: 'CON-007', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', formType: 'DNR / Advance Directive', procedure: 'Do Not Resuscitate Order', doctor: 'Dr. James Mensah', dateGenerated: '2026-08-24', status: 'Pending', language: 'English', notes: 'Family discussion ongoing. Ethics committee referral.' },
];

const _STATUS_STYLE: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', Signed: 'bg-green-100 text-green-800', Declined: 'bg-red-100 text-red-800', Expired: 'bg-gray-100 text-gray-600' };

export default function ConsentFormsEnhanced() {
  const toast = useToast();
  const [consents] = useState<Consent[]>(CONSENTS);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? consents : consents.filter(c => c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consent Forms</h1>
          <p className="text-slate-500 text-sm">Informed consent tracking with multi-language support</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Generate Consent</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total</p><p className="text-2xl font-bold">{consents.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Signed</p><p className="text-2xl font-bold text-green-600">{consents.filter(c => c.status === 'Signed').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{consents.filter(c => c.status === 'Pending').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Declined</p><p className="text-2xl font-bold text-red-600">{consents.filter(c => c.status === 'Declined').length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Pending', 'Signed', 'Declined'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.formType}</span>
                  <Badge tone={c.status === 'Signed' ? 'green' : c.status === 'Pending' ? 'gold' : 'red'}>{c.status}</Badge>
                  <span className="text-xs text-slate-400">{c.language}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{c.patientName} ({c.mrn}) — {c.procedure}</p>
                <p className="text-xs text-slate-500 mt-1">Doctor: {c.doctor} · Generated: {c.dateGenerated}</p>
                {c.signedBy && <p className="text-sm text-green-700 mt-1">✅ Signed by {c.signedBy} on {c.signedDate} · Witness: {c.witness}</p>}
                <p className="text-xs text-slate-500 mt-1 italic">📝 {c.notes}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">View</button>
                {c.status === 'Pending' && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Sign</button>}
                <button onClick={() => {}} className="px-3 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200">🖨️ Print</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
