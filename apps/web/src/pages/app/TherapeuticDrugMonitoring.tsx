import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface TDMRecord {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  drug: string;
  indication: string;
  dose: string;
  route: string;
  frequency: string;
  level: number;
  unit: string;
  therapeuticRange: [number, number];
  timing: 'Trough' | 'Peak' | 'Random';
  sampleTime: string;
  resultTime: string;
  adjusted: boolean;
  newDose: string;
  toxicitySigns: string[];
  status: 'Normal' | 'Low' | 'High' | 'Toxic';
}

const SAMPLE: TDMRecord[] = [
  { id: 'TDM-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', ward: 'ICU', drug: 'Vancomycin', indication: 'MRSA Bacteremia', dose: '1000mg', route: 'IV', frequency: 'Q12h', level: 18.5, unit: 'mg/L', therapeuticRange: [15, 20], timing: 'Trough', sampleTime: '2026-08-25 06:00', resultTime: '2026-08-25 09:30', adjusted: false, newDose: '', toxicitySigns: [], status: 'Normal' },
  { id: 'TDM-002', patientName: 'Ama Osei', mrn: 'MRN-12350', ward: 'Medical', drug: 'Phenytoin', indication: 'Epilepsy', dose: '300mg', route: 'Oral', frequency: 'BID', level: 32, unit: 'mg/L', therapeuticRange: [10, 20], timing: 'Trough', sampleTime: '2026-08-25 07:00', resultTime: '2026-08-25 10:00', adjusted: true, newDose: '200mg BID', toxicitySigns: ['Nystagmus', 'Ataxia'], status: 'Toxic' },
  { id: 'TDM-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', ward: 'Cardiac', drug: 'Digoxin', indication: 'Heart Failure / AF', dose: '0.25mg', route: 'Oral', frequency: 'Daily', level: 0.6, unit: 'ng/mL', therapeuticRange: [0.8, 2.0], timing: 'Trough', sampleTime: '2026-08-25 06:00', resultTime: '2026-08-25 11:00', adjusted: true, newDose: '0.5mg daily x3 then 0.25mg', toxicitySigns: [], status: 'Low' },
  { id: 'TDM-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', ward: 'ICU', drug: 'Gentamicin', indication: 'Gram-negative sepsis', dose: '5mg/kg', route: 'IV', frequency: 'OD', level: 8.2, unit: 'mg/L', therapeuticRange: [1, 2], timing: 'Peak', sampleTime: '2026-08-25 14:00', resultTime: '2026-08-25 15:30', adjusted: true, newDose: '3mg/kg OD', toxicitySigns: [], status: 'Normal' },
  { id: 'TDM-005', patientName: 'Yaw Darko', mrn: 'MRN-12380', ward: 'Renal', drug: 'Lithium', indication: 'Bipolar Disorder', dose: '900mg', route: 'Oral', frequency: 'TID', level: 1.4, unit: 'mmol/L', therapeuticRange: [0.6, 1.2], timing: 'Trough', sampleTime: '2026-08-25 07:00', resultTime: '2026-08-25 09:00', adjusted: true, newDose: '600mg BID', toxicitySigns: ['Tremor', 'Mild confusion'], status: 'High' },
  { id: 'TDM-006', patientName: 'Esi Kumah', mrn: 'MRN-12390', ward: 'Theatre', drug: 'Tacrolimus', indication: 'Post-Renal Transplant', dose: '3mg', route: 'Oral', frequency: 'BID', level: 5.5, unit: 'ng/mL', therapeuticRange: [8, 15], timing: 'Trough', sampleTime: '2026-08-25 06:30', resultTime: '2026-08-25 12:00', adjusted: true, newDose: '5mg BID', toxicitySigns: [], status: 'Low' },
];

const STATUS_COLORS: Record<string, string> = { Normal: 'bg-green-100 text-green-800', Low: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Toxic: 'bg-red-100 text-red-800' };

export default function TherapeuticDrugMonitoring() {
  const [tab, setTab] = useState<'overview' | 'levels' | 'adjustments' | 'toxicity'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💊 Therapeutic Drug Monitoring</h1>
          <p className="text-gray-600 mt-1">Drug levels · Dosing adjustments · Toxicity monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monitored', value: SAMPLE.length, icon: '💊', color: 'text-blue-600' },
          { label: 'Normal', value: SAMPLE.filter(s => s.status === 'Normal').length, icon: '✅', color: 'text-green-600' },
          { label: 'Abnormal', value: SAMPLE.filter(s => s.status !== 'Normal').length, icon: '⚠️', color: 'text-yellow-600' },
          { label: 'Toxic', value: SAMPLE.filter(s => s.status === 'Toxic').length, icon: '🚨', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'levels', 'adjustments', 'toxicity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'levels' ? '📈 Drug Levels' : t === 'adjustments' ? '💉 Adjustments' : '⚠️ Toxicity'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Current Levels</h3>
            <div className="space-y-3">
              {SAMPLE.map(s => {
                const [low, high] = s.therapeuticRange;
                const _pct = s.status === 'Toxic' || s.status === 'High' ? 100 : s.status === 'Low' ? 20 : 50;
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.patientName} — <strong>{s.drug}</strong></span>
                      <span className={`font-bold ${s.status === 'Normal' ? 'text-green-600' : s.status === 'Toxic' ? 'text-red-600' : 'text-yellow-600'}`}>{s.level} {s.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div className="absolute bg-green-200 h-3 rounded" style={{ left: `${(low / (high * 1.5)) * 100}%`, width: `${((high - low) / (high * 1.5)) * 100}%` }} />
                      <div className={`h-3 rounded-full ${s.status === 'Normal' ? 'bg-green-500' : s.status === 'Toxic' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min((s.level / (high * 1.5)) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>{low}</span><span>Therapeutic: {low}-{high} {s.unit}</span><span>{(high * 1.5).toFixed(0)}</span></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Drug Summary</h3>
            <div className="space-y-2">
              {Object.entries(SAMPLE.reduce<Record<string, { count: number; normal: number }>>((a, s) => {
                if (!a[s.drug]) a[s.drug] = { count: 0, normal: 0 };
                a[s.drug].count++;
                if (s.status === 'Normal') a[s.drug].normal++;
                return a;
              }, {})).map(([drug, data]) => (
                <div key={drug} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{drug}</span><span className="text-sm text-gray-600">{data.normal}/{data.count} normal</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'levels' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Drug</th>
                <th className="px-4 py-3 text-left">Dose</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Range</th>
                <th className="px-4 py-3 text-left">Timing</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.sort((a, b) => { const order = { Toxic: 0, High: 1, Low: 2, Normal: 3 }; return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4); }).map(s => (
                <tr key={s.id} className={`border-b hover:bg-gray-50 ${s.status === 'Toxic' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3"><div className="font-medium">{s.patientName}</div><div className="text-xs text-gray-500">{s.ward}</div></td>
                  <td className="px-4 py-3 font-bold">{s.drug}</td>
                  <td className="px-4 py-3">{s.dose} {s.route} {s.frequency}</td>
                  <td className="px-4 py-3"><span className={`font-bold ${s.status === 'Normal' ? 'text-green-600' : s.status === 'Toxic' ? 'text-red-600' : 'text-yellow-600'}`}>{s.level} {s.unit}</span></td>
                  <td className="px-4 py-3 text-gray-500">{s.therapeuticRange[0]}-{s.therapeuticRange[1]}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{s.timing}</Badge></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'adjustments' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Drug</th>
                <th className="px-4 py-3 text-left">Current Dose</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Adjusted?</th>
                <th className="px-4 py-3 text-left">New Dose</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.filter(s => s.adjusted).map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.patientName}</td>
                  <td className="px-4 py-3 font-bold">{s.drug}</td>
                  <td className="px-4 py-3">{s.dose} {s.route} {s.frequency}</td>
                  <td className="px-4 py-3"><span className={`font-bold ${s.status === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>{s.level} {s.unit}</span></td>
                  <td className="px-4 py-3"><Badge className="bg-blue-100 text-blue-800">Yes</Badge></td>
                  <td className="px-4 py-3 font-bold text-blue-600">{s.newDose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'toxicity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">🚨 Active Toxicity Alerts</h3>
            <div className="space-y-3">
              {SAMPLE.filter(s => s.status === 'Toxic').map(s => (
                <div key={s.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div><div className="font-bold text-red-800">{s.patientName} — {s.drug}</div><div className="text-sm text-red-600">Level: {s.level} {s.unit} (Range: {s.therapeuticRange[0]}-{s.therapeuticRange[1]})</div></div>
                    <Badge className="bg-red-200 text-red-900">TOXIC</Badge>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-red-800">Signs:</div>
                    <div className="flex gap-1 mt-1">{s.toxicitySigns.map((sign, i) => <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">⚠️ {sign}</span>)}</div>
                  </div>
                  <div className="mt-2 p-2 bg-white rounded text-sm"><span className="text-gray-500">Action:</span> Dose adjusted to <strong>{s.newDose}</strong></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">⚠️ High Levels</h3>
            <div className="space-y-3">
              {SAMPLE.filter(s => s.status === 'High').map(s => (
                <div key={s.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div><div className="font-bold text-orange-800">{s.patientName} — {s.drug}</div><div className="text-sm text-orange-600">Level: {s.level} {s.unit}</div></div>
                    <Badge className="bg-orange-200 text-orange-900">HIGH</Badge>
                  </div>
                  <div className="mt-2">{s.toxicitySigns.length > 0 && <div className="flex gap-1">{s.toxicitySigns.map((sign, i) => <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">⚠️ {sign}</span>)}</div>}</div>
                  <div className="mt-2 p-2 bg-white rounded text-sm"><span className="text-gray-500">Action:</span> Dose adjusted to <strong>{s.newDose}</strong></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
