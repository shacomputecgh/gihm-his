import { useState } from 'react';
import { Badge } from '../../components/ui';
import { PatientBarcode } from '../../components/PatientBarcode';

interface Wristband { id: string; patientName: string; mrn: string; dob: string; sex: string; bloodGroup: string; ward: string; allergies: string; datePrinted: string; status: 'Active' | 'Expired' | 'Replaced'; }

const WRISTBANDS: Wristband[] = [
  { id: 'WB-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', dob: '1985-03-15', sex: 'Male', bloodGroup: 'O+', ward: 'Medical Ward A', allergies: 'Penicillin', datePrinted: '2026-08-23 08:30', status: 'Active' },
  { id: 'WB-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', dob: '1992-07-22', sex: 'Female', bloodGroup: 'A+', ward: 'Maternity Ward', allergies: 'None', datePrinted: '2026-08-23 09:15', status: 'Active' },
  { id: 'WB-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', dob: '1978-11-08', sex: 'Male', bloodGroup: 'B-', ward: 'Surgical Ward', allergies: 'Sulfa drugs', datePrinted: '2026-08-22 14:00', status: 'Active' },
  { id: 'WB-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', dob: '2000-01-30', sex: 'Female', bloodGroup: 'AB+', ward: 'ICU', allergies: 'Latex', datePrinted: '2026-08-20 16:00', status: 'Expired' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Expired: 'bg-gray-100 text-gray-800', Replaced: 'bg-blue-100 text-blue-800' };

export default function WristbandPrinting() {
  const [records] = useState<Wristband[]>(WRISTBANDS);
  const [selected, setSelected] = useState<Wristband | null>(WRISTBANDS[0] ?? null);
  const [showForm, setShowForm] = useState(false);

  function printWristband(w: Wristband) {
    const html = `<!DOCTYPE html><html><head><title>Wristband ${w.mrn}</title>
<style>@media print{body{margin:0;padding:0;}.wristband{width:200mm;height:50mm;border:2px solid #000;padding:5mm;font-family:Arial;display:flex;align-items:center;gap:5mm;}}.wristband .left{flex:1;}.wristband .barcode{flex:0 0 40mm;}.wristband .name{font-size:14px;font-weight:bold;}.wristband .info{font-size:9px;color:#333;}.wristband .allergy{font-size:10px;font-weight:bold;color:red;border:1px solid red;padding:1px 3px;display:inline-block;margin-top:2px;}</style></head><body><div class="wristband"><div class="left"><div class="name">${w.patientName}</div><div class="info">MRN: ${w.mrn} · DOB: ${w.dob} · ${w.sex}</div><div class="info">Blood: ${w.bloodGroup} · Ward: ${w.ward}</div>${w.allergies !== 'None' ? `<div class="allergy">⚠ ALLERGY: ${w.allergies}</div>` : ''}</div><div class="barcode"><div style="font-size:8px;text-align:center;margin-bottom:2px;">SCAN TO IDENTIFY</div><div style="font-size:10px;font-family:monospace;text-align:center;border:1px solid #000;padding:2px;">||||| ${w.mrn} |||||</div></div></div></body></html>`;
    const pw = window.open('', '_blank');
    if (pw) { pw.document.write(html); pw.document.close(); pw.print(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Wristband Printing</h1><p className="text-gray-500">Print patient identification wristbands with barcodes and allergy alerts</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ Print New Wristband'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Print New Wristband</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Kwame Asante" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">MRN *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="MRN-2024-XXXX" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Sex *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Blood Group *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Ward</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Medical Ward A" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Allergies</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Penicillin (or None)" /></div>
          </div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">🖨️ Print Wristband</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {records.map((w) => (
            <div key={w.id} onClick={() => setSelected(w)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === w.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{w.patientName}</span><Badge className={STATUS_COLORS[w.status]}>{w.status}</Badge></div>
              <div className="text-xs text-slate-500"><div>MRN: {w.mrn} · {w.bloodGroup}</div><div>DOB: {w.dob} · {w.sex}</div>{w.allergies !== 'None' && <div className="text-red-600 font-bold mt-1">⚠ {w.allergies}</div>}</div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.mrn}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="bg-slate-50 rounded-lg p-4 border-2 border-dashed border-slate-300">
              <h4 className="text-xs font-bold text-slate-400 mb-2 text-center">Wristband Preview</h4>
              <div className="flex items-center gap-4 bg-white rounded-lg border-2 border-black p-4">
                <div className="flex-1">
                  <div className="font-bold text-lg">{selected.patientName}</div>
                  <div className="text-xs text-slate-600">MRN: {selected.mrn} · DOB: {selected.dob}</div>
                  <div className="text-xs text-slate-600">{selected.sex} · Blood: {selected.bloodGroup} · Ward: {selected.ward}</div>
                  {selected.allergies !== 'None' && <div className="mt-1 inline-block border border-red-500 text-red-600 text-xs font-bold px-2 py-0.5">⚠ ALLERGY: {selected.allergies}</div>}
                </div>
                <div className="text-center">
                  <PatientBarcode value={selected.mrn} size={80} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => printWristband(selected)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">🖨️ Print Wristband</button>
              <button onClick={() => {}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">📋 Print Label</button>
              <button onClick={() => {}} className="border px-4 py-2 rounded-lg text-sm font-medium">🔄 Replace</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
