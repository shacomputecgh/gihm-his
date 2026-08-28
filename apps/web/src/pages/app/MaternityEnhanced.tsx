import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface Delivery {
  id: string;
  motherName: string;
  mrn: string;
  age: number;
  gravida: number;
  para: number;
  gestationalAge: string;
  bloodGroup: string;
  HIV: string;
  HBsAg: string;
  VDRL: string;
  admissionDate: string;
  laborOnset: string;
  membranes: string;
  liquorColor: string;
  cervicalDilation: number;
  station: string;
  presentation: string;
  fetalHeartRate: number;
  contractionsPer10min: number;
  pushStage: string;
  deliveryType: 'Normal' | 'Assisted' | 'C-Section' | 'Vacuum' | 'Breech';
  deliveryTime?: string;
  babySex: 'Male' | 'Female';
  birthWeight: number;
  apgar1: number;
  apgar5: number;
  apgar10?: number;
  cryAtBirth: 'Yes' | 'No' | 'Weak';
  cordClamped: boolean;
  skinToSkin: boolean;
  breastFed1hr: boolean;
  oxytocinGiven: boolean;
  placentaComplete: 'Yes' | 'No';
  bloodLoss: number;
  episiotomy: boolean;
  laceration: string;
  motherCondition: 'Stable' | 'Monitoring' | 'Critical' | 'Recovery';
  babyCondition: 'Healthy' | 'NICU' | 'Monitoring' | 'Critical';
  assignedMidwife: string;
  assignedDoctor: string;
  notes: string;
}

const SAMPLE_DELIVERIES: Delivery[] = [
  { id: 'DLV-001', motherName: 'Abena Mensah', mrn: 'MRN-2024-0045', age: 28, gravida: 2, para: 1, gestationalAge: '39+2', bloodGroup: 'O+', HIV: 'Negative', HBsAg: 'Negative', VDRL: 'Non-reactive', admissionDate: '2024-01-15 06:30', laborOnset: '04:00', membranes: 'Intact', liquorColor: 'Clear', cervicalDilation: 10, station: '+2', presentation: 'Cephalic', fetalHeartRate: 138, contractionsPer10min: 4, pushStage: 'Completed', deliveryType: 'Normal', deliveryTime: '09:45', babySex: 'Female', birthWeight: 3200, apgar1: 8, apgar5: 9, apgar10: 10, cryAtBirth: 'Yes', cordClamped: true, skinToSkin: true, breastFed1hr: true, oxytocinGiven: true, placentaComplete: 'Yes', bloodLoss: 350, episiotomy: true, laceration: 'None', motherCondition: 'Stable', babyCondition: 'Healthy', assignedMidwife: 'Sr. Midwife Agyemang', assignedDoctor: 'Dr. Koomson', notes: 'Normal vaginal delivery, uncomplicated' },
  { id: 'DLV-002', motherName: 'Akosua Boateng', mrn: 'MRN-2024-0078', age: 34, gravida: 4, para: 3, gestationalAge: '38+5', bloodGroup: 'A-', HIV: 'Negative', HBsAg: 'Negative', VDRL: 'Non-reactive', admissionDate: '2024-01-15 08:00', laborOnset: '06:00', membranes: 'Ruptured', liquorColor: 'Meconium-stained', cervicalDilation: 8, station: '+1', presentation: 'Cephalic', fetalHeartRate: 165, contractionsPer10min: 5, pushStage: 'In progress', deliveryType: 'Assisted', babySex: 'Male', birthWeight: 3800, apgar1: 7, apgar5: 8, cryAtBirth: 'Yes', cordClamped: true, skinToSkin: false, breastFed1hr: false, oxytocinGiven: true, placentaComplete: 'Yes', bloodLoss: 500, episiotomy: true, laceration: '1st degree', motherCondition: 'Monitoring', babyCondition: 'Monitoring', assignedMidwife: 'Sr. Midwire Osei', assignedDoctor: 'Dr. Koomson', notes: 'Meconium-stained liquor, baby transferred to special care for observation' },
  { id: 'DLV-003', motherName: 'Efua Adjei', mrn: 'MRN-2024-0092', age: 22, gravida: 1, para: 0, gestationalAge: '40+1', bloodGroup: 'B+', HIV: 'Negative', HBsAg: 'Positive', VDRL: 'Non-reactive', admissionDate: '2024-01-14 14:00', laborOnset: '12:00', membranes: 'Intact', liquorColor: 'Clear', cervicalDilation: 6, station: '0', presentation: 'Cephalic', fetalHeartRate: 142, contractionsPer10min: 3, pushStage: 'In progress', deliveryType: 'C-Section', babySex: 'Female', birthWeight: 3100, apgar1: 9, apgar5: 10, cryAtBirth: 'Yes', cordClamped: true, skinToSkin: true, breastFed1hr: false, oxytocinGiven: true, placentaComplete: 'Yes', bloodLoss: 200, episiotomy: false, laceration: 'None', motherCondition: 'Recovery', babyCondition: 'Healthy', assignedMidwife: 'Sr. Midwire Owusu', assignedDoctor: 'Dr. Ansah', notes: 'Emergency C-section for failure to progress. HBsAg positive - neonatal vaccine given.' },
];

const _RISK_COLORS: Record<string, string> = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-orange-100 text-orange-800',
  'Critical': 'bg-red-100 text-red-800',
};

const CONDITION_COLORS: Record<string, string> = {
  'Healthy': 'bg-green-100 text-green-800',
  'Stable': 'bg-blue-100 text-blue-800',
  'Monitoring': 'bg-yellow-100 text-yellow-800',
  'NICU': 'bg-orange-100 text-orange-800',
  'Recovery': 'bg-purple-100 text-purple-800',
  'Critical': 'bg-red-100 text-red-800',
};

export default function MaternityEnhanced() {
  const [deliveries, _setDeliveries] = useState<Delivery[]>(SAMPLE_DELIVERIES);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDelivery, _setSelectedDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'active' | 'postnatal' | 'records'>('dashboard');

  const activeLabors = deliveries.filter(d => d.motherCondition === 'Monitoring' || d.motherCondition === 'Critical');
  const postnatal = deliveries.filter(d => d.motherCondition === 'Recovery' || d.motherCondition === 'Stable');
  const todayDeliveries = deliveries.filter(d => d.deliveryTime);
  const nicuBabies = deliveries.filter(d => d.babyCondition === 'NICU' || d.babyCondition === 'Critical');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maternity Unit</h1>
          <p className="text-slate-500">Labor tracking, delivery records, postnatal care, and neonatal assessment</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Icon name="plus" className="h-4 w-4" /> Register Labor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Active Labors</p>
          <p className="text-2xl font-bold text-orange-600">{activeLabors.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Delivered Today</p>
          <p className="text-2xl font-bold text-green-600">{todayDeliveries.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">NICU Babies</p>
          <p className="text-2xl font-bold text-red-600">{nicuBabies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Postnatal Ward</p>
          <p className="text-2xl font-bold text-blue-600">{postnatal.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['dashboard', 'active', 'postnatal', 'records'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Maternity Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Today's Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Registered Labors</span><span className="font-medium">{deliveries.length}</span></div>
                <div className="flex justify-between"><span>Deliveries Completed</span><span className="font-medium text-green-600">{todayDeliveries.length}</span></div>
                <div className="flex justify-between"><span>C-Sections</span><span className="font-medium">{deliveries.filter(d => d.deliveryType === 'C-Section').length}</span></div>
                <div className="flex justify-between"><span>Vacuum/Assisted</span><span className="font-medium">{deliveries.filter(d => d.deliveryType === 'Assisted' || d.deliveryType === 'Vacuum').length}</span></div>
                <div className="flex justify-between"><span>Episiotomies</span><span className="font-medium">{deliveries.filter(d => d.episiotomy).length}</span></div>
                <div className="flex justify-between"><span>Postpartum Hemorrhage (&gt;500ml)</span><span className="font-medium text-red-600">{deliveries.filter(d => d.bloodLoss > 500).length}</span></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-medium mb-3">Neonatal Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Babies Born</span><span className="font-medium">{todayDeliveries.length}</span></div>
                <div className="flex justify-between"><span>Healthy</span><span className="font-medium text-green-600">{deliveries.filter(d => d.babyCondition === 'Healthy').length}</span></div>
                <div className="flex justify-between"><span>NICU Admissions</span><span className="font-medium text-red-600">{nicuBabies.length}</span></div>
                <div className="flex justify-between"><span>Skin-to-Skin Done</span><span className="font-medium">{deliveries.filter(d => d.skinToSkin).length}</span></div>
                <div className="flex justify-between"><span>BF Within 1 Hour</span><span className="font-medium">{deliveries.filter(d => d.breastFed1hr).length}</span></div>
                <div className="flex justify-between"><span>Apgar &lt; 7 at 1 min</span><span className="font-medium text-orange-600">{deliveries.filter(d => d.apgar1 < 7).length}</span></div>
              </div>
            </Card>
          </div>
          <Card className="p-4">
            <h3 className="font-medium mb-3">Risk Screening</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {deliveries.map(d => {
                const risks: string[] = [];
                if (d.HBsAg === 'Positive') risks.push('Hepatitis B');
                if (d.HIV === 'Positive') risks.push('HIV');
                if (d.liquorColor !== 'Clear') risks.push('Meconium');
                if (d.bloodLoss > 500) risks.push('PPH Risk');
                if (d.age > 35) risks.push('Advanced Maternal Age');
                if (risks.length === 0) return null;
                return (
                  <div key={d.id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <span className="font-medium">{d.motherName}</span>
                    <div className="flex gap-1">
                      {risks.map(r => <Badge key={r} className="text-xs bg-red-100 text-red-700">{r}</Badge>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Labors</h2>
          {activeLabors.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <Icon name="heart" className="h-8 w-8 mx-auto mb-2" />
              <p>No active labors at this time</p>
            </Card>
          ) : activeLabors.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{d.motherName}</h3>
                  <p className="text-sm text-slate-500">{d.mrn} • Age {d.age} • G{d.gravida}P{d.para}</p>
                </div>
                <Badge className={CONDITION_COLORS[d.motherCondition] || 'bg-gray-100'}>{d.motherCondition}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-blue-50 rounded p-2">
                  <span className="text-xs text-blue-600 font-medium">Gestational Age</span>
                  <p className="font-bold">{d.gestationalAge}</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <span className="text-xs text-green-600 font-medium">Cervical Dilation</span>
                  <p className="font-bold">{d.cervicalDilation} cm</p>
                </div>
                <div className="bg-orange-50 rounded p-2">
                  <span className="text-xs text-orange-600 font-medium">Fetal Heart Rate</span>
                  <p className="font-bold">{d.fetalHeartRate} bpm</p>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <span className="text-xs text-purple-600 font-medium">Contractions</span>
                  <p className="font-bold">{d.contractionsPer10min}/10min</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs">
                <span>Presentation: <strong>{d.presentation}</strong></span>
                <span>Station: <strong>{d.station}</strong></span>
                <span>Liquor: <strong className={d.liquorColor !== 'Clear' ? 'text-orange-600' : ''}>{d.liquorColor}</strong></span>
                <span>Blood Group: <strong>{d.bloodGroup}</strong></span>
                <span>HIV: <strong className={d.HIV === 'Positive' ? 'text-red-600' : ''}>{d.HIV}</strong></span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => setSelectedDelivery(d)} className="text-xs">View Details</Button>
                <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Record Delivery</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'postnatal' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Postnatal Care</h2>
          {postnatal.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{d.motherName}</h3>
                  <p className="text-sm text-slate-500">Baby: {d.babySex}, {d.birthWeight}g • Apgar {d.apgar1}/{d.apgar5}/{d.apgar10 ?? '-'}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={CONDITION_COLORS[d.motherCondition]}>{d.motherCondition}</Badge>
                  <Badge className={CONDITION_COLORS[d.babyCondition]}>{d.babyCondition}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-slate-500">Delivery:</span> <strong>{d.deliveryType}</strong></div>
                <div><span className="text-slate-500">Blood Loss:</span> <strong className={d.bloodLoss > 500 ? 'text-red-600' : ''}>{d.bloodLoss}ml</strong></div>
                <div><span className="text-slate-500">Oxytocin:</span> <strong>{d.oxytocinGiven ? '✓' : '✗'}</strong></div>
                <div><span className="text-slate-500">Placenta:</span> <strong>{d.placentaComplete}</strong></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 rounded p-2 text-center">
                  <p className="text-xs text-slate-500">Skin-to-Skin</p>
                  <p className={`font-bold ${d.skinToSkin ? 'text-green-600' : 'text-red-600'}`}>{d.skinToSkin ? '✓ Done' : '✗ Not Done'}</p>
                </div>
                <div className="bg-slate-50 rounded p-2 text-center">
                  <p className="text-xs text-slate-500">Breastfed 1hr</p>
                  <p className={`font-bold ${d.breastFed1hr ? 'text-green-600' : 'text-red-600'}`}>{d.breastFed1hr ? '✓ Yes' : '✗ No'}</p>
                </div>
                <div className="bg-slate-50 rounded p-2 text-center">
                  <p className="text-xs text-slate-500">Midwife</p>
                  <p className="font-medium text-xs">{d.assignedMidwife}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Delivery Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Mother</th>
                  <th className="pb-2 font-medium">GA</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Sex</th>
                  <th className="pb-2 font-medium">Weight</th>
                  <th className="pb-2 font-medium">Apgar</th>
                  <th className="pb-2 font-medium">Condition</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 font-mono text-xs">{d.id}</td>
                    <td className="py-2">{d.motherName}</td>
                    <td className="py-2">{d.gestationalAge}</td>
                    <td className="py-2"><Badge className="bg-blue-100 text-blue-800 text-xs">{d.deliveryType}</Badge></td>
                    <td className="py-2">{d.babySex}</td>
                    <td className="py-2">{d.birthWeight}g</td>
                    <td className="py-2">{d.apgar1}/{d.apgar5}/{d.apgar10 ?? '-'}</td>
                    <td className="py-2"><Badge className={`${CONDITION_COLORS[d.babyCondition]} text-xs`}>{d.babyCondition}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Register Labor</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Mother's Name</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">MRN</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Age</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Blood Group</label><select className="w-full border rounded-lg px-3 py-2"><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
              <div><label className="block text-slate-600 mb-1">Gravida</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Para</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Gestational Age</label><input placeholder="e.g. 39+2" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">HIV Status</label><select className="w-full border rounded-lg px-3 py-2"><option>Negative</option><option>Positive</option><option>Unknown</option></select></div>
              <div><label className="block text-slate-600 mb-1">HBsAg</label><select className="w-full border rounded-lg px-3 py-2"><option>Negative</option><option>Positive</option></select></div>
              <div><label className="block text-slate-600 mb-1">Presentation</label><select className="w-full border rounded-lg px-3 py-2"><option>Cephalic</option><option>Breech</option><option>Transverse</option></select></div>
              <div><label className="block text-slate-600 mb-1">Assigned Midwife</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Assigned Doctor</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Notes</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => { setShowAdd(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
