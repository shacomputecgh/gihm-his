import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface Prescription {
  id: string; patientName: string; mrn: string; doctor: string;
  date: string; medications: { name: string; dose: string; frequency: string; duration: string; instructions: string }[];
  diagnosis: string; status: 'Active' | 'Printed' | 'Dispensed' | 'Expired';
}

const PRESCRIPTIONS: Prescription[] = [
  { id: 'RX-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', doctor: 'Dr. Sarah Johnson', date: '2026-08-23', diagnosis: 'Malaria (P. falciparum)', status: 'Active',
    medications: [
      { name: 'Artemether-Lumefantrine 20/120mg', dose: '4 tablets', frequency: 'BD × 3 days', duration: '3 days', instructions: 'Take with fatty food' },
      { name: 'Paracetamol 500mg', dose: '2 tablets', frequency: 'TDS PRN', duration: '5 days', instructions: 'For fever > 38.5°C' },
    ] },
  { id: 'RX-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', doctor: 'Dr. James Mensah', date: '2026-08-23', diagnosis: 'Hypertension', status: 'Printed',
    medications: [
      { name: 'Amlodipine 5mg', dose: '1 tablet', frequency: 'OD', duration: '30 days', instructions: 'Take in the morning' },
      { name: 'Enalapril 10mg', dose: '1 tablet', frequency: 'OD', duration: '30 days', instructions: 'Take in the morning' },
    ] },
  { id: 'RX-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', doctor: 'Dr. Ama Darko', date: '2026-08-22', diagnosis: 'Type 2 Diabetes', status: 'Dispensed',
    medications: [
      { name: 'Metformin 500mg', dose: '1 tablet', frequency: 'BD', duration: '30 days', instructions: 'Take with meals' },
      { name: 'Glibenclamide 5mg', dose: '1 tablet', frequency: 'OD', duration: '30 days', instructions: 'Take before breakfast' },
    ] },
  { id: 'RX-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', doctor: 'Dr. Kofi Appiah', date: '2026-08-21', diagnosis: 'Lower respiratory tract infection', status: 'Active',
    medications: [
      { name: 'Amoxicillin 500mg', dose: '1 capsule', frequency: 'TDS', duration: '7 days', instructions: 'Take every 8 hours' },
      { name: 'Salbutamol Inhaler', dose: '2 puffs', frequency: 'QDS PRN', duration: '14 days', instructions: 'For wheezing' },
    ] },
];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-blue-100 text-blue-800', Printed: 'bg-yellow-100 text-yellow-800',
  Dispensed: 'bg-green-100 text-green-800', Expired: 'bg-gray-100 text-gray-800',
};

export default function PrescriptionPrinting() {
  const [prescriptions] = useState<Prescription[]>(PRESCRIPTIONS);
  const [selected, setSelected] = useState<Prescription | null>(PRESCRIPTIONS[0] ?? null);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const filtered = prescriptions.filter((p) =>
    !search || p.patientName.toLowerCase().includes(search.toLowerCase()) || p.mrn.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  function printPrescription(rx: Prescription) {
    const html = `<!DOCTYPE html><html><head><title>Prescription ${rx.id}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; margin: 0; } .header p { font-size: 12px; color: #666; margin: 2px 0; }
  .rx-symbol { font-size: 24px; font-weight: bold; color: #16a34a; }
  .patient-info { background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; }
  .patient-info strong { display: inline-block; width: 120px; }
  .meds { margin: 20px 0; }
  .med { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
  .med .name { font-weight: bold; font-size: 14px; }
  .med .details { font-size: 12px; color: #555; margin-top: 4px; }
  .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; color: #999; }
  .signature { margin-top: 40px; border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; }
</style></head><body>
<div class="header">
  <div class="rx-symbol">℞</div>
  <h2>GIHM-HIS Hospital Pharmacy</h2>
  <p>Ghana Integrated Health Management System</p>
  <p>Prescription ID: ${rx.id}</p>
</div>
<div class="patient-info">
  <strong>Patient:</strong> ${rx.patientName}<br/>
  <strong>MRN:</strong> ${rx.mrn}<br/>
  <strong>Diagnosis:</strong> ${rx.diagnosis}<br/>
  <strong>Date:</strong> ${rx.date}
</div>
<h3 style="font-size:14px;">Medications:</h3>
<div class="meds">
${rx.medications.map((m) => `<div class="med"><div class="name">${m.name}</div><div class="details"><strong>Dose:</strong> ${m.dose} | <strong>Frequency:</strong> ${m.frequency} | <strong>Duration:</strong> ${m.duration}<br/><strong>Instructions:</strong> ${m.instructions}</div></div>`).join('\n')}
</div>
<div class="signature">
  <strong>${rx.doctor}</strong><br/>Signature & Stamp
</div>
<div class="footer">
  <p>This prescription is generated by GIHM-HIS (ShaComputeC). Valid for dispensing at any registered hospital pharmacy.</p>
  <p>Generated: ${new Date().toLocaleString()}</p>
</div>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Prescription Printing</h1><p className="text-gray-500">Generate and print prescriptions, medication labels, and pharmacy receipts</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Active', 'Printed', 'Dispensed', 'Expired'].map((s) => (
          <div key={s} className="bg-white rounded-lg border p-3 text-center">
            <div className="text-xl font-bold">{prescriptions.filter((p) => p.status === s).length}</div>
            <div className="text-xs text-slate-500">{s}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient, MRN, or diagnosis..." className="flex-1 max-w-md border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {filtered.map((rx) => (
            <div key={rx.id} onClick={() => setSelected(rx)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === rx.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-slate-400">{rx.id}</span>
                <Badge className={STATUS_COLORS[rx.status]}>{rx.status}</Badge>
              </div>
              <div className="font-semibold text-sm">{rx.patientName}</div>
              <div className="text-xs text-slate-500">{rx.diagnosis} · {rx.medications.length} medications</div>
              <div className="text-xs text-slate-400">{rx.doctor} · {rx.date}</div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-bold">℞ Prescription {selected.id}</h3><p className="text-sm text-gray-500">{selected.patientName} ({selected.mrn})</p></div>
              <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
            </div>

            <div className="bg-slate-50 rounded p-3 text-sm">
              <div><strong>Diagnosis:</strong> {selected.diagnosis}</div>
              <div><strong>Doctor:</strong> {selected.doctor}</div>
              <div><strong>Date:</strong> {selected.date}</div>
            </div>

            <div className="space-y-2">
              {selected.medications.map((m, i) => (
                <div key={i} className="border rounded-lg p-3 bg-green-50/50">
                  <div className="font-semibold text-sm text-green-800">{m.name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    <span className="font-medium">Dose:</span> {m.dose} · <span className="font-medium">Frequency:</span> {m.frequency} · <span className="font-medium">Duration:</span> {m.duration}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 italic">{m.instructions}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => printPrescription(selected)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">🖨️ Print Prescription</button>
              <button onClick={() => toast(`📧 Prescription ${selected.id} sent to pharmacy`, 'success')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">📧 Send to Pharmacy</button>
              <button onClick={() => { navigator.clipboard.writeText(selected.medications.map(m => `${m.name} ${m.dose} ${m.frequency} ${m.duration}`).join('\n')).then(() => toast('📋 Copied to clipboard', 'success')); }} className="border px-4 py-2 rounded-lg text-sm font-medium">📋 Copy to Clipboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
