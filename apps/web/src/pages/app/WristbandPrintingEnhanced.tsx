import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Wristband { id: string; patientName: string; mrn: string; dob: string; age: string; sex: string; bloodGroup: string; allergies: string[]; ward: string; bed: string; consultant: string; admissionDate: string; wristbandType: 'Standard' | 'Allergy Alert' | 'Fall Risk' | 'Isolation' | 'Neonatal'; color: string; printed: boolean; printedDate?: string; printer?: string; }

const WRISTBANDS: Wristband[] = [
  { id: 'WB-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', dob: '15/03/1981', age: '45y', sex: 'M', bloodGroup: 'A+', allergies: ['Penicillin'], ward: 'Surgical Ward', bed: 'B-12', consultant: 'Dr. Yaw Boateng', admissionDate: '2026-08-22', wristbandType: 'Allergy Alert', color: 'Red', printed: true, printedDate: '2026-08-22 06:00', printer: 'Ward Printer 1' },
  { id: 'WB-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', dob: '20/07/1998', age: '28y', sex: 'F', bloodGroup: 'O+', allergies: [], ward: 'Maternity', bed: 'M-05', consultant: 'Dr. Ama Darko', admissionDate: '2026-08-25', wristbandType: 'Standard', color: 'White', printed: true, printedDate: '2026-08-25 14:00', printer: 'Maternity Printer' },
  { id: 'WB-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', dob: '08/11/1964', age: '62y', sex: 'M', bloodGroup: 'B+', allergies: ['Sulfa drugs', 'Aspirin', 'Latex'], ward: 'ICU', bed: 'ICU-08', consultant: 'Dr. Ama Darko', admissionDate: '2026-08-18', wristbandType: 'Allergy Alert', color: 'Red', printed: true, printedDate: '2026-08-18 22:00', printer: 'ICU Printer' },
  { id: 'WB-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', dob: '12/05/1991', age: '35y', sex: 'F', bloodGroup: 'AB-', allergies: [], ward: 'Medical Ward B', bed: 'B-12', consultant: 'Dr. Kofi Asante', admissionDate: '2026-08-20', wristbandType: 'Isolation', color: 'Purple', printed: true, printedDate: '2026-08-20 10:00', printer: 'Ward Printer 2' },
  { id: 'WB-005', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', dob: '03/09/2018', age: '8y', sex: 'M', bloodGroup: 'O-', allergies: [], ward: 'Paediatric', bed: 'P-01', consultant: 'Dr. Nana Agyeman', admissionDate: '2026-08-26', wristbandType: 'Standard', color: 'Blue', printed: false },
  { id: 'WB-006', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', dob: '25/01/1956', age: '70y', sex: 'M', bloodGroup: 'A-', allergies: ['Codeine', 'Morphine'], ward: 'ICU', bed: 'ICU-11', consultant: 'Dr. James Mensah', admissionDate: '2026-08-23', wristbandType: 'Fall Risk', color: 'Yellow', printed: true, printedDate: '2026-08-23 22:00', printer: 'ICU Printer' },
];

const WRISTBAND_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'Standard': { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-800' },
  'Allergy Alert': { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800' },
  'Fall Risk': { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800' },
  'Isolation': { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-800' },
  'Neonatal': { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-800' },
};

export default function WristbandPrintingEnhanced() {
  const [selected, setSelected] = useState<Wristband | null>(null);
  const [design, setDesign] = useState<'Standard' | 'Compact' | 'Detailed'>('Detailed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wristband Printing</h1>
          <p className="text-slate-500 text-sm">Patient identification wristbands with barcode and allergy alerts</p>
        </div>
        <div className="flex gap-2">
          {(['Standard', 'Compact', 'Detailed'] as const).map(d => (
            <button key={d} onClick={() => setDesign(d)} className={`px-3 py-1 rounded-lg text-xs font-medium ${design === d ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Patients</p><p className="text-2xl font-bold">{WRISTBANDS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Printed</p><p className="text-2xl font-bold text-green-600">{WRISTBANDS.filter(w => w.printed).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Pending Print</p><p className="text-2xl font-bold text-yellow-600">{WRISTBANDS.filter(w => !w.printed).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Allergy Alerts</p><p className="text-2xl font-bold text-red-600">{WRISTBANDS.filter(w => w.allergies.length > 0).length}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {WRISTBANDS.map(w => {
            const _style = WRISTBAND_STYLES[w.wristbandType] ?? WRISTBAND_STYLES['Standard'];
            return (
              <Card key={w.id} className={`p-4 cursor-pointer hover:shadow transition ${selected?.id === w.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === w.id ? null : w)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{w.patientName}</span>
                      <Badge tone={w.wristbandType === 'Allergy Alert' ? 'red' : w.wristbandType === 'Fall Risk' ? 'gold' : w.wristbandType === 'Isolation' ? 'purple' : 'blue'}>{w.wristbandType}</Badge>
                      {w.allergies.length > 0 && <Badge tone="red">⚠️ {w.allergies.length} allergies</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{w.mrn} · {w.dob} ({w.age} {w.sex}) · {w.bloodGroup}</p>
                    <p className="text-sm">{w.ward} Bed {w.bed} · {w.consultant}</p>
                  </div>
                  <div className="text-right">
                    {w.printed ? <Badge tone="green">Printed</Badge> : <Badge tone="gold">Pending</Badge>}
                    {!w.printed && <button onClick={() => {}} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">🖨️ Print</button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {selected && (
          <div className="space-y-4">
            <Card className={`p-6 ${WRISTBAND_STYLES[selected.wristbandType]?.bg} ${WRISTBAND_STYLES[selected.wristbandType]?.border} border-2`}>
              <div className="text-center mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Ghana Hospital Management System</p>
                <p className="text-2xl font-bold mt-2">{selected.patientName}</p>
              </div>

              {design === 'Detailed' && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">MRN:</span> <strong>{selected.mrn}</strong></div>
                    <div><span className="text-slate-500">DOB:</span> {selected.dob}</div>
                    <div><span className="text-slate-500">Age/Sex:</span> {selected.age} {selected.sex}</div>
                    <div><span className="text-slate-500">Blood Group:</span> <strong className="text-red-600">{selected.bloodGroup}</strong></div>
                  </div>
                  <div className="border-t pt-2">
                    <div><span className="text-slate-500">Ward:</span> {selected.ward} Bed {selected.bed}</div>
                    <div><span className="text-slate-500">Consultant:</span> {selected.consultant}</div>
                    <div><span className="text-slate-500">Admitted:</span> {selected.admissionDate}</div>
                  </div>
                  {selected.allergies.length > 0 && (
                    <div className="p-2 bg-red-100 border border-red-300 rounded mt-2">
                      <p className="font-bold text-red-800">⚠️ ALLERGIES: {selected.allergies.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 text-center">
                <div className="inline-block bg-white px-4 py-2 border">
                  <p className="text-xs text-slate-400">||||| |||| ||||| |||| |||||</p>
                  <p className="text-xs font-mono">{selected.mrn}</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">🖨️ Print Wristband</button>
              <button onClick={() => {}} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">📄 PDF Export</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
