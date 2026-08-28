import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';
import { printPDF, section, field, table, signatureBlock, today, type PDFDocument } from '../../lib/pdfGenerator';

interface DischargeRecord {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  admissionDate: string; dischargeDate: string; consultant: string;
  diagnosis: string; procedure: string;
  dischargeMedications: { name: string; dose: string; frequency: string; duration: string }[];
  followUp: string; followUpDate: string;
  warnings: string[]; instructions: string;
  status: 'Draft' | 'Completed' | 'Printed';
}

const INITIAL: DischargeRecord[] = [
  { id: 'DC-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', age: 62, sex: 'M', admissionDate: '2026-08-20', dischargeDate: '2026-08-27', consultant: 'Dr. Osei',
    diagnosis: 'Community-Acquired Pneumonia', procedure: 'None',
    dischargeMedications: [{ name: 'Amoxicillin', dose: '500mg', frequency: '8-hourly', duration: '5 days' }, { name: 'Paracetamol', dose: '1g', frequency: '6-hourly PRN', duration: 'As needed' }],
    followUp: 'OPD review in 2 weeks. Repeat CXR in 6 weeks.', followUpDate: '2026-09-10',
    warnings: ['Complete full antibiotic course', 'Seek medical attention if fever returns', 'Drink plenty of fluids'], instructions: 'Rest for 1 week. Avoid strenuous activity. Return to emergency if breathing worsens.', status: 'Draft' },
  { id: 'DC-002', patientName: 'Ama Darko', mrn: 'MRN-2026-041', age: 28, sex: 'F', admissionDate: '2026-08-22', dischargeDate: '2026-08-25', consultant: 'Dr. Afriyie',
    diagnosis: 'Normal Vaginal Delivery — Male Baby 3.2kg', procedure: 'Episiotomy repair',
    dischargeMedications: [{ name: 'Paracetamol', dose: '1g', frequency: '6-hourly PRN', duration: '3 days' }, { name: 'Ibuprofen', dose: '400mg', frequency: '8-hourly', duration: '5 days' }],
    followUp: 'Postnatal clinic in 6 weeks. Baby immunisation schedule as per road map.', followUpDate: '2026-10-06',
    warnings: ['Perineal hygiene — bath daily', 'Seek care for heavy vaginal bleeding', 'Exclusive breastfeeding for 6 months'], instructions: 'Rest. Adequate nutrition and hydration. Family planning counselling available at PNC.', status: 'Completed' },
];

export default function DischargeLetter() {
  const [records, setRecords] = useState<DischargeRecord[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<DischargeRecord | null>(null);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Discharge Letters</h1><p className="text-gray-500">Generate formal discharge documentation with medications, follow-up, and instructions</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Discharge Letter</Button>
      </div>
      <div className="space-y-4">
        {records.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{r.patientName}</span>
                  <span className="text-sm text-gray-400">{r.mrn} · {r.age}{r.sex}</span>
                  <Badge tone={r.status === 'Draft' ? 'gold' : r.status === 'Completed' ? 'green' : 'blue'}>{r.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">Admitted: {r.admissionDate} → Discharged: {r.dischargeDate} · {r.consultant}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-sm"><strong>Diagnosis:</strong> {r.diagnosis}</div>
              {r.procedure !== 'None' && <div className="text-sm"><strong>Procedure:</strong> {r.procedure}</div>}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="font-medium text-sm text-blue-700 mb-1">Discharge Medications</h4>
                {r.dischargeMedications.map((m, i) => (
                  <div key={i} className="text-xs text-gray-700">• {m.name} {m.dose} — {m.frequency} for {m.duration}</div>
                ))}
              </div>
              <div>
                <div className="bg-green-50 rounded-lg p-3 mb-2">
                  <h4 className="font-medium text-sm text-green-700 mb-1">Follow-Up</h4>
                  <div className="text-xs text-gray-700">{r.followUp}</div>
                  <div className="text-xs text-green-600 mt-1">Date: {r.followUpDate}</div>
                </div>
                {r.warnings.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-medium text-sm text-red-700 mb-1">⚠️ Warning Signs — Return If:</h4>
                    {r.warnings.map((w, i) => <div key={i} className="text-xs text-red-600">• {w}</div>)}
                  </div>
                )}
              </div>
            </div>
            {r.instructions && <div className="mt-2 bg-yellow-50 rounded-lg p-2 text-xs text-gray-700"><strong>Instructions:</strong> {r.instructions}</div>}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setPreview(preview?.id === r.id ? null : r)}>👁 Preview</Button>
              <Button onClick={() => {
                const doc: PDFDocument = {
                  title: 'DISCHARGE SUMMARY',
                  content: 
                    section('Patient Information',
                      field('Name', r.patientName) +
                      field('MRN', r.mrn) +
                      field('Age/Sex', `${r.age} years / ${r.sex}`) +
                      field('Admitted', r.admissionDate) +
                      field('Discharged', r.dischargeDate) +
                      field('Consultant', r.consultant)
                    ) +
                    section('Diagnosis', field('Diagnosis', r.diagnosis) + (r.procedure !== 'None' ? field('Procedure', r.procedure) : '')) +
                    section('Discharge Medications',
                      table(['Medication', 'Dose', 'Frequency', 'Duration'],
                        r.dischargeMedications.map((m) => [m.name, m.dose, m.frequency, m.duration])
                      )
                    ) +
                    section('Follow-Up', field('Instructions', r.followUp) + field('Date', r.followUpDate)) +
                    section('Warning Signs', r.warnings.map((w) => `<div style='margin-bottom:5px'>• ${w}</div>`).join('')) +
                    section('Instructions', `<p>${r.instructions}</p>`) +
                    signatureBlock(),
                  footer: `Generated on ${today()} · Greater Accra Regional Hospital · Confidential`
                };
                printPDF(doc);
                setRecords(records.map((x) => x.id === r.id ? { ...x, status: 'Printed' as const } : x));
              }}>🖨 Print PDF</Button>
            </div>
            {preview?.id === r.id && (
              <div className="mt-4 border-2 border-dashed rounded-lg p-6 bg-white">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold">🏥 Greater Accra Regional Hospital</h2>
                  <p className="text-xs text-gray-500">Korle-Bu, Accra · +233 302 775 611</p>
                  <hr className="my-2" />
                  <h3 className="font-bold">DISCHARGE SUMMARY</h3>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Patient:</strong> {r.patientName} ({r.mrn}) · {r.age} years · {r.sex}</p>
                  <p><strong>Admitted:</strong> {r.admissionDate} · <strong>Discharged:</strong> {r.dischargeDate}</p>
                  <p><strong>Consultant:</strong> {r.consultant}</p>
                  <p><strong>Diagnosis:</strong> {r.diagnosis}</p>
                  {r.procedure !== 'None' && <p><strong>Procedure:</strong> {r.procedure}</p>}
                  <hr className="my-2" />
                  <p className="font-bold">DISCHARGE MEDICATIONS:</p>
                  {r.dischargeMedications.map((m, i) => <p key={i}>{i + 1}. {m.name} {m.dose} — {m.frequency} for {m.duration}</p>)}
                  <p className="font-bold mt-2">FOLLOW-UP:</p>
                  <p>{r.followUp} — {r.followUpDate}</p>
                  <p className="font-bold mt-2">INSTRUCTIONS:</p>
                  <p>{r.instructions}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Discharge Letter</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Consultant *</label><Input placeholder="Dr. name" /></div>
                <div><label className="block text-sm mb-1">Discharge Date *</label><Input type="date" /></div>
              </div>
              <div><label className="block text-sm mb-1">Diagnosis *</label><Input placeholder="Final diagnosis" /></div>
              <div><label className="block text-sm mb-1">Discharge Instructions *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={3} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Discharge letter created'); }}>Create Letter</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
