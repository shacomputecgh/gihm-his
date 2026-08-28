import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';
import { printPDF, section, field, today, type PDFDocument } from '../../lib/pdfGenerator';

interface LabourPatient {
  id: string; patientName: string; mrn: string; age: number;
  gravida: number; parity: number; gestationalAge: string;
  admissionTime: string; labourStage: string;
  cervix: number; station: string; membranes: string;
  contractions: string; fetalHeartRate: number;
  fluidColour: string; riskFactors: string[];
  midwife: string; consultant: string;
  status: 'Admitted' | 'Latent Labour' | 'Active Labour' | 'Second Stage' | 'Delivered' | 'Postnatal';
}

const INITIAL: LabourPatient[] = [
  { id: 'LB-001', patientName: 'Ama Darko', mrn: 'MRN-2026-300', age: 25, gravida: 2, parity: 1, gestationalAge: '39 weeks', admissionTime: '06:00', labourStage: 'Active Labour', cervix: 7, station: '-1', membranes: 'Intact', contractions: 'Every 3-4 min, 40 sec', fetalHeartRate: 142, fluidColour: 'Clear', riskFactors: [], midwife: 'Midwife Abena', consultant: 'Dr. Afriyie', status: 'Active Labour' },
  { id: 'LB-002', patientName: 'Efua Mensah', mrn: 'MRN-2026-301', age: 32, gravida: 4, parity: 3, gestationalAge: '40 weeks', admissionTime: '04:30', labourStage: 'Second Stage', cervix: 10, station: '+1', membranes: 'Ruptured', contractions: 'Every 2-3 min, 50 sec', fetalHeartRate: 138, fluidColour: 'Meconium-stained', riskFactors: ['Meconium-stained liquor', 'Previous C-section'], midwife: 'Midwife Esi', consultant: 'Dr. Afriyie', status: 'Second Stage' },
  { id: 'LB-003', patientName: 'Akua Osei', mrn: 'MRN-2026-302', age: 20, gravida: 1, parity: 0, gestationalAge: '38 weeks', admissionTime: '22:00', labourStage: 'Latent Labour', cervix: 3, station: '-3', membranes: 'Intact', contractions: 'Every 8-10 min, 30 sec', fetalHeartRate: 145, fluidColour: 'Clear', riskFactors: ['First pregnancy', 'Young age'], midwife: 'Midwife Ama', consultant: 'Dr. Boateng', status: 'Latent Labour' },
];

const STATUS_CONFIG: Record<string, { tone: 'blue' | 'gold' | 'green' | 'red' }> = {
  'Admitted': { tone: 'blue' }, 'Latent Labour': { tone: 'gold' }, 'Active Labour': { tone: 'gold' },
  'Second Stage': { tone: 'red' }, 'Delivered': { tone: 'green' }, 'Postnatal': { tone: 'green' },
};

export default function LabourWardManagement() {
  const [patients] = useState<LabourPatient[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const active = patients.filter((p) => p.status === 'Active Labour' || p.status === 'Second Stage').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Labour Ward Management</h1><p className="text-gray-500">Labour progress tracking, partogram, fetal monitoring, and delivery outcomes</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const doc: PDFDocument = { title: 'LABOUR WARD STATUS', subtitle: `Generated ${today()}`,
              content: patients.map((p) => section(`${p.patientName} — ${p.status}`,
                field('G/P', `G${p.gravida}P${p.parity}`) + field('Gestational Age', p.gestationalAge) +
                field('Cervix', `${p.cervix} cm`) + field('FHR', `${p.fetalHeartRate} bpm`) + field('Contractions', p.contractions)
              )).join(''),
              footer: `Generated on ${today()} · Greater Accra Regional Hospital`
            }; printPDF(doc);
          }}>🖨 Print</Button>
          <Button onClick={() => setShowForm(true)}>+ Admit Patient</Button>
        </div>
      </div>
      {active > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 font-bold">🚨 {active} patient(s) in active/second stage labour</div>}
      <div className="space-y-4">
        {patients.map((p) => (
          <Card key={p.id} className={`p-4 ${p.status === 'Second Stage' ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{p.patientName}</span>
                  <span className="text-sm text-gray-400">{p.mrn} · Age {p.age}</span>
                  <Badge tone={STATUS_CONFIG[p.status]?.tone}>{p.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">G{p.gravida}P{p.parity} · {p.gestationalAge} · Admitted: {p.admissionTime}</p>
                <p className="text-xs text-gray-500">Midwife: {p.midwife} · Consultant: {p.consultant}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-sm bg-gray-50 rounded-lg p-3 mb-2">
              <div><span className="text-gray-500 text-xs">Cervix</span><div className={`font-bold ${p.cervix === 10 ? 'text-green-600' : ''}`}>{p.cervix} cm</div></div>
              <div><span className="text-gray-500 text-xs">Station</span><div className="font-medium">{p.station}</div></div>
              <div><span className="text-gray-500 text-xs">FHR</span><div className={`font-medium ${(p.fetalHeartRate < 110 || p.fetalHeartRate > 160) ? 'text-red-600' : ''}`}>{p.fetalHeartRate} bpm</div></div>
              <div><span className="text-gray-500 text-xs">Contractions</span><div className="font-medium text-xs">{p.contractions}</div></div>
              <div><span className="text-gray-500 text-xs">Membranes</span><div className="font-medium">{p.membranes}</div></div>
            </div>
            {p.riskFactors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                ⚠️ <strong>Risk Factors:</strong> {p.riskFactors.join(', ')}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">Fluid: {p.fluidColour} · Stage: {p.labourStage}</div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Admit to Labour Ward</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Gravida *</label><Input type="number" min="1" /></div>
                <div><label className="block text-sm mb-1">Parity *</label><Input type="number" min="0" /></div>
                <div><label className="block text-sm mb-1">Gestational Age *</label><Input placeholder="e.g. 39 weeks" /></div>
                <div><label className="block text-sm mb-1">Cervix (cm) *</label><Input type="number" min="0" max="10" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Patient admitted to Labour Ward'); }}>Admit</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
