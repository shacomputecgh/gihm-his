import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type ConsentTab = 'pending' | 'signed' | 'templates';

interface ConsentForm {
  id: string;
  patientName: string;
  mrn: string;
  date: string;
  type: string;
  procedure: string;
  description: string;
  risks: string[];
  alternatives: string;
  doctorName: string;
  witnessName?: string;
  signedDate?: string;
  status: 'pending' | 'signed' | 'revoked' | 'expired';
  expiryDate?: string;
  parentName?: string;
  notes?: string;
}

const CONSENT_TEMPLATES = [
  { id: 'T001', name: 'General Surgical Consent', category: 'Surgery', description: 'Consent for general surgical procedures', risks: ['Bleeding', 'Infection', 'Reaction to anaesthesia', 'Damage to surrounding tissue', 'Blood clots'] },
  { id: 'T002', name: 'Anaesthesia Consent', category: 'Anaesthesia', description: 'Consent for general or regional anaesthesia', risks: ['Nausea/vomiting', 'Sore throat', 'Allergic reaction', 'Dental damage', 'Awareness during surgery', 'Nerve damage'] },
  { id: 'T003', name: 'Blood Transfusion Consent', category: 'Transfusion', description: 'Consent for blood product transfusion', risks: ['Allergic reaction', 'Fever', 'Infection (rare)', 'Fluid overload', 'Haemolytic reaction'] },
  { id: 'T004', name: 'CT/MRI Scan Consent', category: 'Imaging', description: 'Consent for CT or MRI imaging with contrast', risks: ['Allergic reaction to contrast', 'Kidney damage (rare)', 'Claustrophobia', 'Nerve stimulation (MRI)'] },
  { id: 'T005', name: 'Chemotherapy Consent', category: 'Oncology', description: 'Consent for chemotherapy treatment', risks: ['Nausea/vomiting', 'Hair loss', 'Infection risk', 'Fatigue', 'Mouth sores', 'Long-term effects'] },
  { id: 'T006', name: 'DNR (Do Not Resuscitate)', category: 'End-of-Life', description: 'Do Not Resuscitate order — patient or family decision', risks: [] },
  { id: 'T007', name: 'Clinical Trial Consent', category: 'Research', description: 'Informed consent for participation in clinical research', risks: ['Unknown side effects', 'May not receive treatment', 'Time commitment', 'Data privacy'] },
  { id: 'T008', name: 'Organ Donation Consent', category: 'Donation', description: 'Consent for organ or tissue donation', risks: [] },
  { id: 'T009', name: 'C-Section Consent', category: 'Obstetrics', description: 'Consent for Caesarean section delivery', risks: ['Bleeding', 'Infection', 'Injury to baby', 'Reaction to anaesthesia', 'Future pregnancy risks'] },
  { id: 'T010', name: 'Discharge Against Medical Advice', category: 'Discharge', description: 'Patient chooses to leave hospital against doctor recommendation', risks: ['Worsening condition', 'Treatment complications', 'Readmission'] },
];

const MOCK_CONSENTS: ConsentForm[] = [
  { id: 'CON001', patientName: 'Ama Darko', mrn: 'MRN-002345', date: '2026-05-23', type: 'General Surgical Consent', procedure: 'Laparoscopic Appendectomy', description: 'I consent to undergo laparoscopic appendectomy for acute appendicitis.', risks: ['Bleeding', 'Infection', 'Damage to bowel', 'Conversion to open surgery', 'Blood clots'], alternatives: 'Conservative management with antibiotics (higher recurrence risk)', doctorName: 'Dr. Kofi Boateng', signedDate: '2026-05-23', status: 'signed', witnessName: 'Nurse Kofi' },
  { id: 'CON002', patientName: 'Ama Darko', mrn: 'MRN-002345', date: '2026-05-23', type: 'Anaesthesia Consent', procedure: 'General Anaesthesia for Appendectomy', description: 'I consent to receive general anaesthesia for the planned surgical procedure.', risks: ['Nausea', 'Sore throat', 'Allergic reaction', 'Dental damage', 'Awareness'], alternatives: 'Spinal anaesthesia (not suitable for this procedure)', doctorName: 'Dr. Nana Agyeman', signedDate: '2026-05-23', status: 'signed', witnessName: 'Nurse Kofi' },
  { id: 'CON003', patientName: 'Kofi Asante', mrn: 'MRN-003456', date: '2026-05-23', type: 'Blood Transfusion Consent', procedure: 'Blood Transfusion (if required)', description: 'I consent to receive blood products if clinically indicated during my admission.', risks: ['Allergic reaction', 'Fever', 'Infection', 'Haemolytic reaction'], alternatives: 'Refuse transfusion — accept risks of severe anaemia', doctorName: 'Dr. Abena Osei', status: 'pending', parentName: 'Kwame Asante (Father)', notes: 'Patient is 3 years old — parent consent required' },
  { id: 'CON004', patientName: 'Kwame Asante', mrn: 'MRN-001234', date: '2026-05-22', type: 'CT/MRI Scan Consent', procedure: 'CT Abdomen with contrast', description: 'I consent to undergo CT scan of the abdomen with IV contrast for diagnostic evaluation.', risks: ['Allergic reaction to contrast', 'Kidney damage', 'Contrast extravasation'], alternatives: 'MRI without contrast, or ultrasound (lower resolution)', doctorName: 'Dr. Mensah', signedDate: '2026-05-22', status: 'signed', witnessName: 'Radiographer' },
  { id: 'CON005', patientName: 'Efua Mensah', mrn: 'MRN-004567', date: '2026-05-22', type: 'C-Section Consent', procedure: 'Caesarean Section', description: 'I consent to undergo Caesarean section delivery.', risks: ['Bleeding', 'Infection', 'Injury to baby', 'Reaction to anaesthesia', 'Future pregnancy risks'], alternatives: 'Trial of vaginal birth', doctorName: 'Dr. Nana Agyeman', status: 'revoked', notes: 'Patient decided to try vaginal delivery' },
];

export default function ConsentForms() {
  const [tab, setTab] = useState<ConsentTab>('pending');
  const [selectedConsent, setSelectedConsent] = useState<string | null>(null);

  const pendingConsents = MOCK_CONSENTS.filter(c => c.status === 'pending');
  const signedConsents = MOCK_CONSENTS.filter(c => c.status === 'signed');

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
          title="Add New Consent Form"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"consentType","label":"Consent Type","type":"select","options":["Surgical","Anaesthesia","Blood Transfusion","Research","Data Sharing","Refusal","Other"]},{"name":"procedure","label":"Procedure/Study","type":"text"},{"name":"witness","label":"Witness","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Consent Forms" subtitle="Digital consent management and e-signatures" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{pendingConsents.length}</div><div className="text-xs text-slate-500">Pending Signature</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{signedConsents.length}</div><div className="text-xs text-slate-500">Signed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_CONSENTS.length}</div><div className="text-xs text-slate-500">Total Forms</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{CONSENT_TEMPLATES.length}</div><div className="text-xs text-slate-500">Templates</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['pending', 'signed', 'templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'pending' ? `⏳ Pending (${pendingConsents.length})` : t === 'signed' ? `✅ Signed (${signedConsents.length})` : `📋 Templates (${CONSENT_TEMPLATES.length})`}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pendingConsents.map(c => (
            <Card key={c.id} className={`p-4 border-l-4 border-amber-500 ${selectedConsent === c.id ? 'ring-2 ring-amber-200' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedConsent(selectedConsent === c.id ? null : c.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{c.patientName}</h3>
                    <Badge tone="gold">⏳ PENDING</Badge>
                    {c.parentName && <Badge tone="navy">👨‍👩‍👦 Parent Consent</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{c.type} — {c.procedure}</div>
                  <div className="text-[10px] text-slate-400">Doctor: {c.doctorName} · Date: {c.date}</div>
                </div>
              </div>
              {selectedConsent === c.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-700 leading-relaxed">{c.description}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-red-700">⚠️ Risks</h4>
                    <ul className="mt-1 list-disc list-inside text-xs text-slate-600">
                      {c.risks.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-xs">
                    <span className="font-bold text-blue-700">Alternatives: </span>
                    <span className="text-blue-600">{c.alternatives}</span>
                  </div>
                  {c.parentName && <div className="text-xs text-slate-600">Parent/Guardian: <strong>{c.parentName}</strong></div>}
                  {c.notes && <div className="text-xs text-amber-600">📝 {c.notes}</div>}
                  <div className="flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700 text-xs">✍️ Sign Consent</Button>
                    <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print Form</Button>
                    <Button className="bg-red-100 text-red-700 text-xs">❌ Revoked</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Signed Tab */}
      {tab === 'signed' && (
        <div className="space-y-3">
          {signedConsents.map(c => (
            <Card key={c.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">✅</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800">{c.patientName}</h3>
                    <Badge tone="green">SIGNED</Badge>
                  </div>
                  <div className="text-xs text-slate-500">{c.type} — {c.procedure}</div>
                  <div className="text-[10px] text-slate-400">Signed: {c.signedDate} · Doctor: {c.doctorName} · Witness: {c.witnessName}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CONSENT_TEMPLATES.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{t.name}</h3>
                  <Badge tone="blue">{t.category}</Badge>
                  <p className="mt-1 text-xs text-slate-600">{t.description}</p>
                  {t.risks.length > 0 && (
                    <div className="mt-2 text-[10px] text-red-600">Risks: {t.risks.join(', ')}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📝 Use Template</Button>
                <Button className="bg-slate-100 text-slate-700 text-xs">✏️ Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
