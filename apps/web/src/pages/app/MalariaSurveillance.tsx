import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface MalariaCase {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  dateDiagnosed: string; species: string; parasitaemia: string;
  classification: string; treatment: string; bedNetUsed: boolean;
  pregnant: boolean; referred: boolean;
  status: 'Diagnosed' | 'On Treatment' | 'Recovery' | 'Severe - ICU' | 'Cured';
}

const INITIAL: MalariaCase[] = [
  { id: 'MAL-001', patientName: 'Baby Kofi', mrn: 'MRN-2026-110', age: 2, sex: 'M', dateDiagnosed: '2026-08-25', species: 'P. falciparum', parasitaemia: 'High (>100k/µL)', classification: 'Severe Malaria', treatment: 'IV Artesunate 2.4mg/kg at 0, 12, 24h', bedNetUsed: false, pregnant: false, referred: true, status: 'Severe - ICU' },
  { id: 'MAL-002', patientName: 'Akua Mensah', mrn: 'MRN-2026-111', age: 25, sex: 'F', dateDiagnosed: '2026-08-24', species: 'P. falciparum', parasitaemia: 'Moderate (10,000-100,000/µL)', classification: 'Uncomplicated Malaria', treatment: 'ACT (Artemether-Lumefantrine) 3 days', bedNetUsed: true, pregnant: false, referred: false, status: 'Recovery' },
  { id: 'MAL-003', patientName: 'Kwaku Asante', mrn: 'MRN-2026-112', age: 8, sex: 'M', dateDiagnosed: '2026-08-23', species: 'P. falciparum', parasitaemia: 'Low (<10k/µL)', classification: 'Uncomplicated Malaria', treatment: 'ACT 3 days + Paracetamol', bedNetUsed: true, pregnant: false, referred: false, status: 'Cured' },
];

const SPECIES = ['P. falciparum', 'P. vivax', 'P. ovale', 'P. malariae', 'Mixed'];
const TREATMENTS = ['ACT (Artemether-Lumefantrine)', 'IV Artesunate', 'Quinine', 'Chloroquine', 'Primaquine'];
const STATUS_CONFIG: Record<string, { color: string; tone: 'red' | 'gold' | 'blue' | 'green' }> = {
  Diagnosed: { color: 'bg-blue-100 text-blue-800', tone: 'blue' },
  'On Treatment': { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Recovery: { color: 'bg-green-100 text-green-800', tone: 'green' },
  'Severe - ICU': { color: 'bg-red-100 text-red-800', tone: 'red' },
  Cured: { color: 'bg-green-200 text-green-900', tone: 'green' },
};

export default function MalariaSurveillance() {
  const [cases] = useState<MalariaCase[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const severe = cases.filter((c) => c.classification === 'Severe Malaria').length;
  const noBedNet = cases.filter((c) => !c.bedNetUsed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Malaria Surveillance</h1><p className="text-gray-500">Malaria case management, treatment tracking, and epidemiological surveillance</p></div>
        <Button onClick={() => setShowForm(true)}>+ Register Case</Button>
      </div>
      {severe > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 font-bold">🚨 {severe} severe malaria case(s) in ICU</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{cases.length}</div><div className="text-xs text-gray-500">Total Cases</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{severe}</div><div className="text-xs text-gray-500">Severe</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{cases.filter((c) => c.status === 'On Treatment').length}</div><div className="text-xs text-gray-500">On Treatment</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{noBedNet}</div><div className="text-xs text-gray-500">No Bed Net</div></Card>
      </div>
      <div className="space-y-4">
        {cases.map((c) => (
          <Card key={c.id} className={`p-4 ${c.classification === 'Severe Malaria' ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{c.patientName}</span>
                  <span className="text-sm text-gray-400">{c.mrn} · {c.age}{c.sex}</span>
                  <Badge tone={STATUS_CONFIG[c.status]?.tone}>{c.status}</Badge>
                  {c.classification === 'Severe Malaria' && <Badge tone="red">Severe</Badge>}
                </div>
                <p className="text-sm text-gray-600">{c.species} · Parasitaemia: {c.parasitaemia} · Diagnosed: {c.dateDiagnosed}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 rounded-lg p-3">
              <div><span className="text-gray-500">Treatment:</span><div className="font-medium">{c.treatment}</div></div>
              <div><span className="text-gray-500">Bed Net:</span><div className="font-medium">{c.bedNetUsed ? '✅ Yes' : '❌ No'}</div></div>
              <div><span className="text-gray-500">Referred:</span><div className="font-medium">{c.referred ? 'Yes' : 'No'}</div></div>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Register Malaria Case</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Species *</label><select className="w-full border rounded-lg p-2 text-sm">{SPECIES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm mb-1">Classification *</label><select className="w-full border rounded-lg p-2 text-sm"><option>Uncomplicated Malaria</option><option>Severe Malaria</option></select></div>
                <div><label className="block text-sm mb-1">Treatment *</label><select className="w-full border rounded-lg p-2 text-sm">{TREATMENTS.map((t) => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Malaria case registered'); }}>Register</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
