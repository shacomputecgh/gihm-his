import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Input, PageHeader } from '../../components/ui';

type MaternityTab = 'antenatal' | 'labour' | 'postnatal' | 'register';

interface AntenatalRecord {
  id: string;
  patientName: string;
  age: number;
  gravida: number;
  para: number;
  lmp: string;
  edd: string;
  ga: string;
  bookingDate: string;
  bloodGroup: string;
  genotype: string;
  height: number;
  weight: number;
  bp: string;
  hb: number;
  urinalysis: string;
  hivStatus: string;
  hepatitisB: string;
  vdrl: string;
  tbScreening: string;
  visits: Visit[];
  riskFactors: string[];
  status: 'active' | 'completed' | 'referred';
}

interface Visit {
  date: string;
  ga: string;
  weight: number;
  bp: string;
  fundalHeight: number;
  fhs: string;
  urinalysis: string;
  comments: string;
}

interface LabourRecord {
  id: string;
  patientName: string;
  ancNumber: string;
  dateOfAdmission: string;
  timeOfAdmission: string;
  gestationalAge: string;
  membranesStatus: 'intact' | 'ruptured';
  ruptureTime?: string;
  liquorColour: 'clear' | 'meconium' | 'bloodstained' | 'foul';
  contractionsFrequency: string;
  cervixDilation: number;
  cervicalEffacement: string;
  presentation: 'cephalic' | 'breech' | 'transverse' | 'other';
  presentationDetail: string;
  station: string;
  fhs: string;
  fhsRate: number;
  vitalSigns: { bp: string; pulse: number; temp: number; rr: number };
  progress: LabourStage[];
  outcome: 'spontaneous' | 'assisted' | 'caesarean';
  deliveryTime?: string;
  sex: 'male' | 'female';
  birthWeight: number;
  apgarScore1: number;
  apgarScore5: number;
  babyCondition: 'good' | 'fair' | 'poor';
  complications: string[];
  placentaDelivered: boolean;
  placentaTime?: string;
  placentaCondition: string;
  bloodLoss: number;
  status: 'active' | 'delivered' | 'postpartum';
}

interface LabourStage {
  time: string;
  stage: string;
  cervixDilation?: number;
  presentation?: string;
  station?: string;
  fhs?: string;
  comments: string;
}

interface PostnatalRecord {
  id: string;
  patientName: string;
  deliveryDate: string;
  deliveryType: 'vaginal' | 'caesarean';
  babySex: 'male' | 'female';
  babyWeight: number;
  babyCondition: string;
  motherCondition: string;
  complications: string[];
  babyChecks: BabyCheck[];
  motherChecks: MotherCheck[];
  feedingMethod: 'breast' | 'formula' | 'mixed';
  immunizations: string[];
  dischargeDate?: string;
  followUpDate: string;
  status: 'active' | 'discharged';
}

interface BabyCheck {
  time: string;
  date: string;
  temperature: number;
  feeding: string;
  stool: string;
  urine: string;
  jaundice: 'none' | 'mild' | 'moderate' | 'severe';
  cordCondition: string;
  comments: string;
}

interface MotherCheck {
  time: string;
  date: string;
  bp: string;
  pulse: number;
  fundalHeight: number;
  fundalPosition: string;
  lochia: 'scanty' | 'normal' | 'excessive' | 'foul';
  episiotomy: boolean;
  perinealTear: string;
  complaints: string;
  hb: number;
}

const MOCK_ANC: AntenatalRecord[] = [
  { id: 'ANC001', patientName: 'Abena Osei', age: 28, gravida: 3, para: 2, lmp: '2025-12-01', edd: '2026-09-07', ga: '32 weeks', bookingDate: '2025-12-20', bloodGroup: 'O+', genotype: 'AS', height: 162, weight: 72, bp: '118/76', hb: 11.2, urinalysis: 'Normal', hivStatus: 'Negative', hepatitisB: 'Negative', vdrl: 'Non-reactive', tbScreening: 'Negative', visits: [
    { date: '2026-01-15', ga: '16 weeks', weight: 70, bp: '115/75', fundalHeight: 14, fhs: 'Present', urinalysis: 'Normal', comments: 'Routine visit' },
    { date: '2026-02-12', ga: '20 weeks', weight: 71, bp: '120/78', fundalHeight: 20, fhs: 'Present', urinalysis: 'Normal', comments: 'Anatomy scan normal' },
    { date: '2026-03-12', ga: '24 weeks', weight: 72, bp: '118/76', fundalHeight: 24, fhs: 'Present', urinalysis: 'Normal', comments: 'Iron supplement started' },
    { date: '2026-04-09', ga: '28 weeks', weight: 73, bp: '122/80', fundalHeight: 28, fhs: 'Present', urinalysis: 'Normal', comments: 'TT2 given' },
    { date: '2026-05-07', ga: '32 weeks', weight: 72, bp: '118/76', fundalHeight: 32, fhs: 'Present', urinalysis: 'Normal', comments: 'Growth satisfactory' },
  ], riskFactors: [], status: 'active' },
  { id: 'ANC002', patientName: 'Akua Mensah', age: 34, gravida: 5, para: 4, lmp: '2026-01-15', edd: '2026-10-22', ga: '28 weeks', bookingDate: '2026-02-01', bloodGroup: 'A+', genotype: 'AA', height: 158, weight: 78, bp: '130/85', hb: 9.8, urinalysis: 'Trace protein', hivStatus: 'Negative', hepatitisB: 'Negative', vdrl: 'Non-reactive', tbScreening: 'Negative', visits: [
    { date: '2026-03-01', ga: '16 weeks', weight: 76, bp: '128/84', fundalHeight: 15, fhs: 'Present', urinalysis: 'Trace protein', comments: 'Monitor BP closely' },
    { date: '2026-04-01', ga: '20 weeks', weight: 77, bp: '132/86', fundalHeight: 20, fhs: 'Present', urinalysis: 'Trace protein', comments: 'Labetalol started' },
    { date: '2026-05-01', ga: '24 weeks', weight: 78, bp: '130/85', fundalHeight: 24, fhs: 'Present', urinalysis: 'Normal', comments: 'BP controlled' },
    { date: '2026-05-29', ga: '28 weeks', weight: 78, bp: '135/88', fundalHeight: 28, fhs: 'Present', urinalysis: 'Trace protein', comments: 'Increase monitoring' },
  ], riskFactors: ['Hypertension', 'Grand multiparity', 'Advanced maternal age'], status: 'active' },
  { id: 'ANC003', patientName: 'Efua Amoah', age: 22, gravida: 1, para: 0, lmp: '2026-02-10', edd: '2026-11-17', ga: '26 weeks', bookingDate: '2026-03-01', bloodGroup: 'B+', genotype: 'AA', height: 165, weight: 65, bp: '110/70', hb: 12.1, urinalysis: 'Normal', hivStatus: 'Negative', hepatitisB: 'Positive', vdrl: 'Non-reactive', tbScreening: 'Negative', visits: [
    { date: '2026-04-01', ga: '16 weeks', weight: 63, bp: '108/68', fundalHeight: 14, fhs: 'Present', urinalysis: 'Normal', comments: 'First visit — Hep B+ referred for management' },
    { date: '2026-05-01', ga: '20 weeks', weight: 64, bp: '112/72', fundalHeight: 19, fhs: 'Present', urinalysis: 'Normal', comments: 'Hep B treatment ongoing' },
    { date: '2026-05-29', ga: '26 weeks', weight: 65, bp: '110/70', fundalHeight: 25, fhs: 'Present', urinalysis: 'Normal', comments: 'Good progress' },
  ], riskFactors: ['Hepatitis B', 'Primigravida'], status: 'active' },
];

const MOCK_LABOUR: LabourRecord[] = [
  { id: 'LAB001', patientName: 'Adwoa Boateng', ancNumber: 'ANC045', dateOfAdmission: '2026-05-22', timeOfAdmission: '14:30', gestationalAge: '39 weeks', membranesStatus: 'ruptured', ruptureTime: '13:45', liquorColour: 'clear', contractionsFrequency: '3-4 in 10 min', cervixDilation: 6, cervicalEffacement: '80%', presentation: 'cephalic', presentationDetail: 'LOA', station: '-1', fhs: 'Present', fhsRate: 140, vitalSigns: { bp: '120/80', pulse: 88, temp: 37.2, rr: 18 }, progress: [
    { time: '14:30', stage: 'First', cervixDilation: 4, fhs: '140 bpm', comments: 'Admitted in active labour' },
    { time: '16:00', stage: 'First', cervixDilation: 6, fhs: '138 bpm', comments: 'Good progress' },
  ], outcome: 'spontaneous', deliveryTime: '18:45', sex: 'female', birthWeight: 3.2, apgarScore1: 8, apgarScore5: 9, babyCondition: 'good', complications: [], placentaDelivered: true, placentaTime: '19:00', placentaCondition: 'Complete', bloodLoss: 350, status: 'delivered' },
  { id: 'LAB002', patientName: 'Ama Darko', ancNumber: 'ANC032', dateOfAdmission: '2026-05-23', timeOfAdmission: '08:15', gestationalAge: '38 weeks', membranesStatus: 'intact', liquorColour: 'clear', contractionsFrequency: '2 in 10 min', cervixDilation: 3, cervicalEffacement: '60%', presentation: 'cephalic', presentationDetail: 'ROA', station: '-2', fhs: 'Present', fhsRate: 145, vitalSigns: { bp: '115/75', pulse: 82, temp: 36.8, rr: 16 }, progress: [
    { time: '08:15', stage: 'First', cervixDilation: 3, fhs: '145 bpm', comments: 'Admitted — early labour' },
  ], outcome: 'spontaneous', placentaCondition: 'Complete', sex: 'male', birthWeight: 3.5, apgarScore1: 9, apgarScore5: 10, babyCondition: 'good', complications: [], placentaDelivered: true, bloodLoss: 300, status: 'delivered' },
  { id: 'LAB003', patientName: 'Kofi Asante', ancNumber: 'N/A', dateOfAdmission: '2026-05-23', timeOfAdmission: '22:00', gestationalAge: '40 weeks', membranesStatus: 'ruptured', ruptureTime: '20:30', liquorColour: 'meconium', contractionsFrequency: '4-5 in 10 min', cervixDilation: 8, cervicalEffacement: '100%', presentation: 'cephalic', presentationDetail: 'LOA', station: '+1', fhs: 'Present', fhsRate: 110, vitalSigns: { bp: '130/85', pulse: 92, temp: 37.0, rr: 20 }, progress: [
    { time: '22:00', stage: 'First', cervixDilation: 8, fhs: '110 bpm', comments: 'Meconium-stained liquor — alert' },
  ], outcome: 'assisted', sex: 'female', birthWeight: 3.8, apgarScore1: 6, apgarScore5: 8, babyCondition: 'fair', complications: ['Meconium aspiration risk', 'Fetal distress'], placentaDelivered: true, placentaTime: '18:30', placentaCondition: 'Complete', bloodLoss: 450, status: 'delivered' },
];

const MOCK_POSTNATAL: PostnatalRecord[] = [
  { id: 'PNC001', patientName: 'Adwoa Boateng', deliveryDate: '2026-05-22', deliveryType: 'vaginal', babySex: 'female', babyWeight: 3.2, babyCondition: 'Good', motherCondition: 'Stable', complications: [], babyChecks: [
    { time: '20:00', date: '2026-05-22', temperature: 36.8, feeding: 'Breastfed', stool: 'Meconium', urine: 'Passed', jaundice: 'none', cordCondition: 'Dry', comments: 'Baby doing well' },
    { time: '08:00', date: '2026-05-23', temperature: 37.0, feeding: 'Breastfed', stool: 'Meconium', urine: 'Passed', jaundice: 'mild', cordCondition: 'Dry', comments: 'Mild jaundice — monitor' },
  ], motherChecks: [
    { time: '20:00', date: '2026-05-22', bp: '120/80', pulse: 88, fundalHeight: 2, fundalPosition: 'Umbilicus', lochia: 'normal', episiotomy: false, perinealTear: 'None', complaints: 'Mild pain', hb: 11.0 },
    { time: '08:00', date: '2026-05-23', bp: '118/78', pulse: 82, fundalHeight: 3, fundalPosition: 'Below umbilicus', lochia: 'normal', episiotomy: false, perinealTear: 'None', complaints: 'None', hb: 10.8 },
  ], feedingMethod: 'breast', immunizations: ['BCG', 'OPV0', 'HepB0'], status: 'active', followUpDate: '2026-05-29' },
  { id: 'PNC002', patientName: 'Ama Darko', deliveryDate: '2026-05-23', deliveryType: 'vaginal', babySex: 'male', babyWeight: 3.5, babyCondition: 'Good', motherCondition: 'Stable', complications: [], babyChecks: [
    { time: '10:00', date: '2026-05-23', temperature: 36.9, feeding: 'Breastfed', stool: 'Meconium', urine: 'Passed', jaundice: 'none', cordCondition: 'Dry', comments: 'Healthy baby' },
  ], motherChecks: [
    { time: '10:00', date: '2026-05-23', bp: '115/75', pulse: 80, fundalHeight: 2, fundalPosition: 'Umbilicus', lochia: 'normal', episiotomy: false, perinealTear: '1st degree', complaints: 'Mild perineal pain', hb: 11.2 },
  ], feedingMethod: 'breast', immunizations: ['BCG', 'OPV0', 'HepB0'], status: 'active', followUpDate: '2026-05-30' },
];


export default function Maternity() {
  
  const [tab, setTab] = useState<MaternityTab>('antenatal');
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs: { key: MaternityTab; label: string; icon: string; count: number }[] = [
    { key: 'antenatal', label: 'Antenatal (ANC)', icon: '🤰', count: MOCK_ANC.length },
    { key: 'labour', label: 'Labour & Delivery', icon: '👶', count: MOCK_LABOUR.length },
    { key: 'postnatal', label: 'Postnatal (PNC)', icon: '🤱', count: MOCK_POSTNATAL.length },
    { key: 'register', label: 'ANC Register', icon: '📋', count: 0 },
  ];

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
          title="Add New Maternity Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"gravida","label":"Gravida","type":"number"},{"name":"parity","label":"Parity","type":"number"},{"name":"gestationalAge","label":"Gestational Age (weeks)","type":"number"},{"name":"bloodGroup","label":"Blood Group","type":"select","options":["O+","O-","A+","A-","B+","B-","AB+","AB-"]},{"name":"hivStatus","label":"HIV Status","type":"select","options":["Negative","Positive","Unknown"]},{"name":"deliveryType","label":"Delivery Type","type":"select","options":["Normal","Caesarean","Assisted","VBAC"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Maternity Module" subtitle="Antenatal Care, Labour & Delivery, Postnatal Care tracking" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{MOCK_ANC.length}</div>
          <div className="text-xs text-slate-500">Active ANC</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-pink-600">{MOCK_LABOUR.filter(l => l.status === 'active').length}</div>
          <div className="text-xs text-slate-500">In Labour</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{MOCK_LABOUR.filter(l => l.status === 'delivered').length}</div>
          <div className="text-xs text-slate-500">Delivered Today</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{MOCK_POSTNATAL.length}</div>
          <div className="text-xs text-slate-500">Postnatal</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t.key ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t.icon} {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input placeholder="Search by patient name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
      </div>

      {/* ANC Tab */}
      {tab === 'antenatal' && (
        <div className="space-y-4">
          {MOCK_ANC.filter(a => a.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map((anc) => (
            <Card key={anc.id} className={`p-4 transition-all ${selectedRecord === anc.id ? 'ring-2 ring-purple-200' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedRecord(selectedRecord === anc.id ? null : anc.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{anc.patientName}</h3>
                    <Badge tone={anc.status === 'active' ? 'green' : 'gray'}>{anc.status.toUpperCase()}</Badge>
                    {anc.riskFactors.length > 0 && <Badge tone="red">⚠️ RISK</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Age: {anc.age}</span>
                    <span>G{anc.gravida}P{anc.para}</span>
                    <span>GA: {anc.ga}</span>
                    <span>EDD: {anc.edd}</span>
                    <span>Blood: {anc.bloodGroup} ({anc.genotype})</span>
                    <span>Visits: {anc.visits.length}</span>
                  </div>
                  {anc.riskFactors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {anc.riskFactors.map((rf) => (
                        <span key={rf} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{rf}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-slate-400 transition-transform ${selectedRecord === anc.id ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {selectedRecord === anc.id && (
                <div className="mt-4 border-t pt-4 space-y-4">
                  {/* Booking Info */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Booking Date</div><div className="text-xs font-bold">{anc.bookingDate}</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Height</div><div className="text-xs font-bold">{anc.height} cm</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Current Weight</div><div className="text-xs font-bold">{anc.weight} kg</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">BMI</div><div className="text-xs font-bold">{(anc.weight / ((anc.height / 100) ** 2)).toFixed(1)}</div></div>
                  </div>

                  {/* Lab Results */}
                  <h4 className="font-bold text-sm text-slate-700">Booking Laboratory Results</h4>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Hb</div><div className={`text-xs font-bold ${(anc.hb < 10) ? 'text-red-600' : 'text-green-600'}`}>{anc.hb} g/dL</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">HIV</div><div className={`text-xs font-bold ${anc.hivStatus === 'Negative' ? 'text-green-600' : 'text-red-600'}`}>{anc.hivStatus}</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Hepatitis B</div><div className={`text-xs font-bold ${anc.hepatitisB === 'Negative' ? 'text-green-600' : 'text-red-600'}`}>{anc.hepatitisB}</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">VDRL</div><div className="text-xs font-bold">{anc.vdrl}</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">TB Screening</div><div className="text-xs font-bold">{anc.tbScreening}</div></div>
                  </div>

                  {/* Visit History */}
                  <h4 className="font-bold text-sm text-slate-700">Visit History ({anc.visits.length} visits)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b text-left text-slate-500">
                        <th className="p-2">Date</th><th className="p-2">GA</th><th className="p-2">Weight</th><th className="p-2">BP</th><th className="p-2">FH</th><th className="p-2">FHS</th><th className="p-2">Urine</th><th className="p-2">Comments</th>
                      </tr></thead>
                      <tbody>
                        {anc.visits.map((v, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-medium">{v.date}</td><td className="p-2">{v.ga}</td><td className="p-2">{v.weight}kg</td>
                            <td className="p-2">{v.bp}</td><td className="p-2">{v.fundalHeight}cm</td><td className="p-2">{v.fhs}</td>
                            <td className="p-2">{v.urinalysis}</td><td className="p-2 text-slate-500">{v.comments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">➕ Add Visit</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Labour Tab */}
      {tab === 'labour' && (
        <div className="space-y-4">
          {MOCK_LABOUR.map((lab) => (
            <Card key={lab.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{lab.patientName}</h3>
                    <Badge tone={lab.status === 'active' ? 'red' : lab.status === 'delivered' ? 'green' : 'blue'}>
                      {lab.status === 'active' ? '🔴 IN LABOUR' : lab.status === 'delivered' ? '✅ DELIVERED' : '🔵 POSTPARTUM'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>GA: {lab.gestationalAge}</span>
                    <span>Admitted: {lab.timeOfAdmission}</span>
                    <span>Membranes: {lab.membranesStatus === 'ruptured' ? `Ruptured ${lab.ruptureTime}` : 'Intact'}</span>
                    <span>Presentation: {lab.presentationDetail}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
                <div className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Cervix</div><div className="text-sm font-bold text-purple-600">{lab.cervixDilation}cm</div></div>
                <div className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">FHS</div><div className="text-sm font-bold text-green-600">{lab.fhsRate} bpm</div></div>
                <div className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">BP</div><div className="text-sm font-bold">{lab.vitalSigns.bp}</div></div>
                <div className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Liquor</div><div className={`text-sm font-bold ${lab.liquorColour === 'clear' ? 'text-green-600' : 'text-red-600'}`}>{lab.liquorColour}</div></div>
                <div className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Contractions</div><div className="text-xs font-bold">{lab.contractionsFrequency}</div></div>
                <div className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-400">Station</div><div className="text-sm font-bold">{lab.station}</div></div>
              </div>

              {lab.complications.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {lab.complications.map((c) => <span key={c} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">⚠️ {c}</span>)}
                </div>
              )}

              {lab.status === 'delivered' && (
                <div className="mt-3 rounded-lg bg-green-50 p-3">
                  <h4 className="font-bold text-sm text-green-700">Delivery Outcome</h4>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <span>Sex: <strong>{lab.sex === 'male' ? '👦 Male' : '👧 Female'}</strong></span>
                    <span>Weight: <strong>{lab.birthWeight} kg</strong></span>
                    <span>APGAR: <strong>{lab.apgarScore1}/{lab.apgarScore5}</strong></span>
                    <span>Condition: <strong className={lab.babyCondition === 'good' ? 'text-green-600' : 'text-red-600'}>{lab.babyCondition}</strong></span>
                    <span>Outcome: <strong>{lab.outcome}</strong></span>
                    <span>Blood Loss: <strong className={lab.bloodLoss > 500 ? 'text-red-600' : 'text-green-600'}>{lab.bloodLoss}ml</strong></span>
                  </div>
                </div>
              )}

              {lab.status === 'active' && <Button className="mt-3 bg-green-600 hover:bg-green-700">👶 Record Delivery</Button>}
            </Card>
          ))}
        </div>
      )}

      {/* Postnatal Tab */}
      {tab === 'postnatal' && (
        <div className="space-y-4">
          {MOCK_POSTNATAL.map((pnc) => (
            <Card key={pnc.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{pnc.patientName}</h3>
                    <Badge tone={pnc.status === 'active' ? 'blue' : 'green'}>
                      {pnc.status === 'active' ? '🤱 POSTNATAL' : '✅ DISCHARGED'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Delivery: {pnc.deliveryDate}</span>
                    <span>Type: {pnc.deliveryType}</span>
                    <span>Baby: {pnc.babySex === 'male' ? '👦' : '👧'} {pnc.babyWeight}kg</span>
                    <span>Feeding: {pnc.feedingMethod}</span>
                    <span>Follow-up: {pnc.followUpDate}</span>
                  </div>
                </div>
              </div>

              {/* Baby Checks */}
              <div className="mt-3">
                <h4 className="font-bold text-xs text-slate-600 mb-1">👶 Baby Checks ({pnc.babyChecks.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b text-left text-slate-500">
                      <th className="p-1">Date</th><th className="p-1">Temp</th><th className="p-1">Feeding</th><th className="p-1">Stool</th><th className="p-1">Urine</th><th className="p-1">Jaundice</th><th className="p-1">Cord</th>
                    </tr></thead>
                    <tbody>
                      {pnc.babyChecks.map((bc, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-1">{bc.date} {bc.time}</td><td className="p-1">{bc.temperature}°C</td>
                          <td className="p-1">{bc.feeding}</td><td className="p-1">{bc.stool}</td><td className="p-1">{bc.urine}</td>
                          <td className={`p-1 font-bold ${bc.jaundice === 'none' ? 'text-green-600' : bc.jaundice === 'mild' ? 'text-yellow-600' : 'text-red-600'}`}>{bc.jaundice}</td>
                          <td className="p-1">{bc.cordCondition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mother Checks */}
              <div className="mt-3">
                <h4 className="font-bold text-xs text-slate-600 mb-1">👩 Mother Checks ({pnc.motherChecks.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b text-left text-slate-500">
                      <th className="p-1">Date</th><th className="p-1">BP</th><th className="p-1">Fundal</th><th className="p-1">Lochia</th><th className="p-1">Hb</th><th className="p-1">Complaints</th>
                    </tr></thead>
                    <tbody>
                      {pnc.motherChecks.map((mc, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-1">{mc.date} {mc.time}</td><td className="p-1">{mc.bp}</td>
                          <td className="p-1">{mc.fundalPosition}</td><td className="p-1">{mc.lochia}</td>
                          <td className={`p-1 font-bold ${mc.hb < 10 ? 'text-red-600' : 'text-green-600'}`}>{mc.hb}</td>
                          <td className="p-1 text-slate-500">{mc.complaints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immunizations */}
              <div className="mt-3 flex flex-wrap gap-1">
                {pnc.immunizations.map((imm) => (
                  <span key={imm} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">💉 {imm}</span>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700">➕ Add Check</Button>
                {pnc.status === 'active' && <Button className="bg-green-600 hover:bg-green-700">✅ Discharge</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Register Tab */}
      {tab === 'register' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-4">📋 ANC Register</h3>
          <div className="text-sm text-slate-500 mb-4">Register new antenatal patients and track their pregnancy journey.</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input placeholder="Patient Name" />
            <Input placeholder="Age" type="number" />
            <Input placeholder="Gravida" type="number" />
            <Input placeholder="Para" type="number" />
            <Input placeholder="Last Menstrual Period" type="date" />
            <Input placeholder="Expected Date of Delivery" type="date" />
            <Input placeholder="Blood Group" />
            <Input placeholder="Genotype" />
            <Input placeholder="Height (cm)" type="number" />
            <Input placeholder="Weight (kg)" type="number" />
            <Input placeholder="Blood Pressure" />
            <Input placeholder="Haemoglobin" type="number" />
          </div>
          <Button className="mt-4 bg-purple-600 hover:bg-purple-700">➕ Register ANC Patient</Button>
        </Card>
      )}
    </div>
  );
}
