import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface AntibioticUse { antibiotic: string; class: string; ddd: number; definedDays: number; patients: number; spectrum: 'Narrow' | 'Broad' | 'Extended'; appropriateness: number; restricted: boolean; }
interface ResistanceData { organism: string; amoxicillin: number; ciprofloxacin: number; ceftriaxone: number; meropenem: number; vancomycin: number; Gentamicin: number; }
interface StewardshipCase { id: string; patient: string; ward: string; antibiotic: string; indication: string; day: number; review: string; recommendation: string; status: 'Under Review' | 'Optimised' | 'Switched' | 'Stopped'; }

const ANTIBIOTIC_USE: AntibioticUse[] = [
  { antibiotic: 'Amoxicillin', class: 'Penicillin', ddd: 3.0, definedDays: 450, patients: 85, spectrum: 'Narrow', appropriateness: 88, restricted: false },
  { antibiotic: 'Ceftriaxone', class: 'Cephalosporin', ddd: 2.0, definedDays: 320, patients: 62, spectrum: 'Broad', appropriateness: 72, restricted: false },
  { antibiotic: 'Meropenem', class: 'Carbapenem', ddd: 3.0, definedDays: 180, patients: 15, spectrum: 'Extended', appropriateness: 65, restricted: true },
  { antibiotic: 'Metronidazole', class: 'Nitroimidazole', ddd: 2.0, definedDays: 210, patients: 45, spectrum: 'Narrow', appropriateness: 92, restricted: false },
  { antibiotic: 'Vancomycin', class: 'Glycopeptide', ddd: 2.0, definedDays: 120, patients: 12, spectrum: 'Narrow', appropriateness: 78, restricted: true },
  { antibiotic: 'Ciprofloxacin', class: 'Fluoroquinolone', ddd: 1.5, definedDays: 150, patients: 30, spectrum: 'Broad', appropriateness: 68, restricted: false },
  { antibiotic: 'Clindamycin', class: 'Lincosamide', ddd: 1.8, definedDays: 90, patients: 20, spectrum: 'Broad', appropriateness: 85, restricted: false },
];

const RESISTANCE: ResistanceData[] = [
  { organism: 'E. coli', amoxicillin: 62, ciprofloxacin: 28, ceftriaxone: 15, meropenem: 2, vancomycin: 0, Gentamicin: 12 },
  { organism: 'K. pneumoniae', amoxicillin: 78, ciprofloxacin: 35, ceftriaxone: 25, meropenem: 8, vancomycin: 0, Gentamicin: 18 },
  { organism: 'S. aureus (MSSA)', amoxicillin: 85, ciprofloxacin: 12, ceftriaxone: 5, meropenem: 0, vancomycin: 0, Gentamicin: 8 },
  { organism: 'S. aureus (MRSA)', amoxicillin: 100, ciprofloxacin: 85, ceftriaxone: 100, meropenem: 100, vancomycin: 0, Gentamicin: 45 },
  { organism: 'P. aeruginosa', amoxicillin: 100, ciprofloxacin: 22, ceftriaxone: 100, meropenem: 5, vancomycin: 0, Gentamicin: 15 },
  { organism: 'E. faecalis', amoxicillin: 15, ciprofloxacin: 45, ceftriaxone: 100, meropenem: 100, vancomycin: 3, Gentamicin: 55 },
];

const CASES: StewardshipCase[] = [
  { id: 'AS-001', patient: 'Kwame Asante', ward: 'ICU', antibiotic: 'Meropenem', indication: 'Sepsis — rule out ESBL', day: 3, review: 'Blood culture: E. coli sensitive to Ceftriaxone. CRP falling.', recommendation: 'Step down to Ceftriaxone 2g OD', status: 'Optimised' },
  { id: 'AS-002', patient: 'Akua Mensah', ward: 'Medical Ward A', antibiotic: 'Ceftriaxone', indication: 'Community-acquired pneumonia', day: 2, review: 'Clinical improvement. Oral tolerance good. CRP 45.', recommendation: 'Switch to oral Amoxicillin-Clavulanate', status: 'Switched' },
  { id: 'AS-003', patient: 'Nana Osei', ward: 'Surgical Ward', antibiotic: 'Ceftriaxone + Metronidazole', indication: 'Post-operative prophylaxis', day: 1, review: 'Prophylaxis exceeded 24h limit. Clean surgical wound.', recommendation: 'Stop antibiotics — no indication for continued prophylaxis', status: 'Stopped' },
  { id: 'AS-004', patient: 'Efua Nyarko', ward: 'Maternity', antibiotic: 'Amoxicillin', indication: 'Urinary tract infection', day: 1, review: 'Urine culture pending. Empiric therapy appropriate.', recommendation: 'Await culture results — review in 48h', status: 'Under Review' },
];

export default function AntibioticStewardshipEnhanced() {
  const [tab, setTab] = useState<'overview' | 'resistance' | 'cases'>('overview');
  const totalDDD = ANTIBIOTIC_USE.reduce((s, a) => s + a.definedDays, 0);
  const restrictedUse = ANTIBIOTIC_USE.filter(a => a.restricted).reduce((s, a) => s + a.definedDays, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Antibiotic Stewardship</h1>
        <p className="text-slate-500 text-sm">Prescribing optimisation, resistance surveillance, and stewardship reviews</p>
      </div>

      <div className="flex gap-2">
        {(['overview', 'resistance', 'cases'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t === 'overview' ? 'Usage Overview' : t === 'resistance' ? 'Resistance Patterns' : 'Stewardship Cases'}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total DDD (30d)</p><p className="text-2xl font-bold">{totalDDD.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Restricted Use</p><p className="text-2xl font-bold text-orange-600">{Math.round(restrictedUse / totalDDD * 100)}%</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Appropriate Prescribing</p><p className="text-2xl font-bold text-green-600">{Math.round(ANTIBIOTIC_USE.reduce((s, a) => s + a.appropriateness, 0) / ANTIBIOTIC_USE.length)}%</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Active Reviews</p><p className="text-2xl font-bold text-blue-600">{CASES.filter(c => c.status === 'Under Review').length}</p></Card>
      </div>

      {tab === 'overview' && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Antibiotic Usage — DDD per 1000 Bed-Days</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="p-2">Antibiotic</th><th className="p-2">Class</th><th className="p-2">Spectrum</th><th className="p-2 text-right">DDD</th><th className="p-2 text-right">Patients</th><th className="p-2 text-right">Appropriate</th><th className="p-2">Status</th>
            </tr></thead>
            <tbody>
              {ANTIBIOTIC_USE.sort((a, b) => b.definedDays - a.definedDays).map(a => (
                <tr key={a.antibiotic} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{a.antibiotic}</td>
                  <td className="p-2 text-slate-500">{a.class}</td>
                  <td className="p-2"><Badge tone={a.spectrum === 'Narrow' ? 'green' : a.spectrum === 'Broad' ? 'gold' : 'red'}>{a.spectrum}</Badge></td>
                  <td className="p-2 text-right">{a.definedDays}</td>
                  <td className="p-2 text-right">{a.patients}</td>
                  <td className="p-2 text-right"><span className={a.appropriateness >= 80 ? 'text-green-600' : a.appropriateness >= 70 ? 'text-orange-600' : 'text-red-600'}>{a.appropriateness}%</span></td>
                  <td className="p-2">{a.restricted ? <Badge tone="red">Restricted</Badge> : <Badge tone="green">Open</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'resistance' && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Resistance Patterns (% resistant)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500">
                <th className="p-2">Organism</th><th className="p-2 text-center">Amoxicillin</th><th className="p-2 text-center">Ciprofloxacin</th><th className="p-2 text-center">Ceftriaxone</th><th className="p-2 text-center">Meropenem</th><th className="p-2 text-center">Vancomycin</th><th className="p-2 text-center">Gentamicin</th>
              </tr></thead>
              <tbody>
                {RESISTANCE.map(r => (
                  <tr key={r.organism} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{r.organism}</td>
                    {[r.amoxicillin, r.ciprofloxacin, r.ceftriaxone, r.meropenem, r.vancomycin, r.Gentamicin].map((v, i) => (
                      <td key={i} className="p-2 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${v >= 50 ? 'bg-red-100 text-red-800' : v >= 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{v}%</span></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'cases' && (
        <div className="space-y-3">
          {CASES.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.patient}</span>
                    <Badge tone={c.status === 'Optimised' ? 'green' : c.status === 'Switched' ? 'blue' : c.status === 'Stopped' ? 'red' : 'gold'}>{c.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{c.antibiotic} — {c.indication}</p>
                  <p className="text-xs text-slate-500">Ward: {c.ward} · Day {c.day}</p>
                  <p className="text-sm mt-2"><strong>Review:</strong> {c.review}</p>
                  <p className="text-sm text-blue-600 mt-1"><strong>Recommendation:</strong> {c.recommendation}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
