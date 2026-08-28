import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Input, PageHeader } from '../../components/ui';

type BloodTab = 'inventory' | 'transfusions' | 'donations' | 'analytics';

interface BloodUnit {
  id: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  unitNumber: string;
  donorName: string;
  collectionDate: string;
  expiryDate: string;
  status: 'available' | 'reserved' | 'issued' | 'expired' | 'discarded' | 'quarantine';
  component: 'whole' | 'packed-rbc' | 'platelets' | 'plasma' | 'cryoprecipitate';
  volume: number;
  screeningResult: 'negative' | 'positive';
  reservedFor?: string;
  issuedTo?: string;
  issuedDate?: string;
}

interface TransfusionRecord {
  id: string;
  patientName: string;
  mrn: string;
  bloodType: string;
  unitNumber: string;
  component: string;
  indication: string;
  crossmatchResult: 'compatible' | 'incompatible';
  preTransfusionHb: number;
  postTransfusionHb?: number;
  volume: number;
  startTime: string;
  endTime?: string;
  rate: string;
  prescribedBy: string;
  nurse: string;
  reactions: string[];
  status: 'ordered' | 'crossmatched' | 'transfusing' | 'completed' | 'reaction';
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MOCK_UNITS: BloodUnit[] = [
  { id: 'BU001', bloodType: 'A+', unitNumber: 'BLD-2026-001', donorName: 'Donor #1234', collectionDate: '2026-05-15', expiryDate: '2026-06-15', status: 'available', component: 'packed-rbc', volume: 300, screeningResult: 'negative' },
  { id: 'BU002', bloodType: 'A+', unitNumber: 'BLD-2026-002', donorName: 'Donor #1235', collectionDate: '2026-05-18', expiryDate: '2026-06-18', status: 'reserved', component: 'packed-rbc', volume: 300, screeningResult: 'negative', reservedFor: 'Kwame Asante (MRN-001)' },
  { id: 'BU003', bloodType: 'O-', unitNumber: 'BLD-2026-003', donorName: 'Donor #1236', collectionDate: '2026-05-20', expiryDate: '2026-06-20', status: 'available', component: 'packed-rbc', volume: 300, screeningResult: 'negative' },
  { id: 'BU004', bloodType: 'O-', unitNumber: 'BLD-2026-004', donorName: 'Donor #1237', collectionDate: '2026-05-20', expiryDate: '2026-06-20', status: 'available', component: 'packed-rbc', volume: 300, screeningResult: 'negative' },
  { id: 'BU005', bloodType: 'B+', unitNumber: 'BLD-2026-005', donorName: 'Donor #1238', collectionDate: '2026-05-10', expiryDate: '2026-06-10', status: 'available', component: 'packed-rbc', volume: 300, screeningResult: 'negative' },
  { id: 'BU006', bloodType: 'A-', unitNumber: 'BLD-2026-006', donorName: 'Donor #1239', collectionDate: '2026-05-22', expiryDate: '2026-06-22', status: 'available', component: 'platelets', volume: 250, screeningResult: 'negative' },
  { id: 'BU007', bloodType: 'AB+', unitNumber: 'BLD-2026-007', donorName: 'Donor #1240', collectionDate: '2026-04-25', expiryDate: '2026-05-25', status: 'expired', component: 'packed-rbc', volume: 300, screeningResult: 'negative' },
  { id: 'BU008', bloodType: 'O+', unitNumber: 'BLD-2026-008', donorName: 'Donor #1241', collectionDate: '2026-05-23', expiryDate: '2026-06-23', status: 'available', component: 'plasma', volume: 200, screeningResult: 'negative' },
  { id: 'BU009', bloodType: 'A+', unitNumber: 'BLD-2026-009', donorName: 'Donor #1242', collectionDate: '2026-05-12', expiryDate: '2026-06-12', status: 'issued', component: 'packed-rbc', volume: 300, screeningResult: 'negative', issuedTo: 'Ama Darko (MRN-002)', issuedDate: '2026-05-23' },
  { id: 'BU010', bloodType: 'O+', unitNumber: 'BLD-2026-010', donorName: 'Donor #1243', collectionDate: '2026-05-01', expiryDate: '2026-06-01', status: 'available', component: 'packed-rbc', volume: 300, screeningResult: 'negative' },
  { id: 'BU011', bloodType: 'B-', unitNumber: 'BLD-2026-011', donorName: 'Donor #1244', collectionDate: '2026-05-08', expiryDate: '2026-06-08', status: 'quarantine', component: 'packed-rbc', volume: 300, screeningResult: 'positive' },
  { id: 'BU012', bloodType: 'A+', unitNumber: 'BLD-2026-012', donorName: 'Donor #1245', collectionDate: '2026-05-21', expiryDate: '2026-06-21', status: 'available', component: 'cryoprecipitate', volume: 100, screeningResult: 'negative' },
];

const MOCK_TRANSFUSIONS: TransfusionRecord[] = [
  { id: 'TF001', patientName: 'Ama Darko', mrn: 'MRN-002', bloodType: 'A+', unitNumber: 'BLD-2026-009', component: 'Packed RBC', indication: 'Post-surgical haemoglobin drop (Hb 7.2)', crossmatchResult: 'compatible', preTransfusionHb: 7.2, postTransfusionHb: 9.8, volume: 300, startTime: '10:00', endTime: '13:00', rate: '30 drops/min', prescribedBy: 'Dr. Boateng', nurse: 'Nurse Kofi', reactions: [], status: 'completed' },
  { id: 'TF002', patientName: 'Kwame Asante', mrn: 'MRN-001', bloodType: 'A+', unitNumber: 'BLD-2026-002', component: 'Packed RBC', indication: 'Severe anaemia (Hb 6.8)', crossmatchResult: 'compatible', preTransfusionHb: 6.8, volume: 300, startTime: '14:00', rate: '30 drops/min', prescribedBy: 'Dr. Mensah', nurse: 'Nurse Ama', reactions: [], status: 'crossmatched' },
];

const STATUS_CONFIG: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'gray' }> = {
  available: { label: 'Available', tone: 'green' },
  reserved: { label: 'Reserved', tone: 'gold' },
  issued: { label: 'Issued', tone: 'blue' },
  expired: { label: 'Expired', tone: 'red' },
  discarded: { label: 'Discarded', tone: 'gray' },
  quarantine: { label: 'Quarantine', tone: 'red' },
};

const BLOOD_TYPE_COLORS: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-50 text-red-600',
  'B+': 'bg-blue-100 text-blue-700', 'B-': 'bg-blue-50 text-blue-600',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-50 text-purple-600',
  'O+': 'bg-green-100 text-green-700', 'O-': 'bg-green-50 text-green-600',
};

export default function BloodBankManagement() {
  const [tab, setTab] = useState<BloodTab>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');

  const filteredUnits = MOCK_UNITS.filter(u => {
    const matchSearch = u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) || u.donorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = bloodTypeFilter === 'all' || u.bloodType === bloodTypeFilter;
    return matchSearch && matchType;
  });

  const availableByType = (type: string) => MOCK_UNITS.filter(u => u.bloodType === type && u.status === 'available').length;
  const totalAvailable = MOCK_UNITS.filter(u => u.status === 'available').length;
  const totalReserved = MOCK_UNITS.filter(u => u.status === 'reserved').length;
  const totalIssued = MOCK_UNITS.filter(u => u.status === 'issued').length;
  const totalExpired = MOCK_UNITS.filter(u => u.status === 'expired').length;

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
          title="Add New Blood Bank Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Blood Bank Management" subtitle="Blood unit inventory, cross-matching, transfusion tracking, and donor management" />

      {/* Blood Type Overview */}
      <Card className="p-4">
        <h3 className="font-bold text-xs text-slate-600 mb-3">🩸 Blood Inventory Overview</h3>
        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
          {BLOOD_TYPES.map(bt => (
            <div key={bt} className={`rounded-lg p-2 text-center ${BLOOD_TYPE_COLORS[bt]}`}>
              <div className="text-lg font-bold">{bt}</div>
              <div className="text-xs">{availableByType(bt)} units</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{totalAvailable}</div><div className="text-xs text-slate-500">Available</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{totalReserved}</div><div className="text-xs text-slate-500">Reserved</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{totalIssued}</div><div className="text-xs text-slate-500">Issued</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{totalExpired}</div><div className="text-xs text-slate-500">Expired</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_TRANSFUSIONS.length}</div><div className="text-xs text-slate-500">Transfusions</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['inventory', 'transfusions', 'donations', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'inventory' ? '🩸 Inventory' : t === 'transfusions' ? '💉 Transfusions' : t === 'donations' ? '🫀 Donations' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input placeholder="Search units..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
            <select value={bloodTypeFilter} onChange={(e) => setBloodTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <option value="all">All Types</option>
              {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          {filteredUnits.map(u => {
            const statusCfg = STATUS_CONFIG[u.status]!;
            return (
              <Card key={u.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-3 py-2 text-lg font-bold ${BLOOD_TYPE_COLORS[u.bloodType]}`}>{u.bloodType}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{u.unitNumber}</span>
                        <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                        <span className="text-[10px] text-slate-400 capitalize">{u.component.replace('-', ' ')}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Donor: {u.donorName} · Collected: {u.collectionDate} · Expires: {u.expiryDate} · Volume: {u.volume}ml</div>
                      {u.reservedFor && <div className="text-[10px] text-amber-600">Reserved for: {u.reservedFor}</div>}
                      {u.issuedTo && <div className="text-[10px] text-blue-600">Issued to: {u.issuedTo} on {u.issuedDate}</div>}
                      {u.screeningResult === 'positive' && <div className="text-[10px] text-red-600 font-bold">⚠️ Screening POSITIVE — Quarantined</div>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          <Button className="bg-red-600 hover:bg-red-700">🫀 Register New Donation</Button>
        </div>
      )}

      {/* Transfusions Tab */}
      {tab === 'transfusions' && (
        <div className="space-y-3">
          {MOCK_TRANSFUSIONS.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm text-slate-800">{t.patientName}</h3>
                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${BLOOD_TYPE_COLORS[t.bloodType]}`}>{t.bloodType}</span>
                <Badge tone={t.status === 'completed' ? 'green' : t.status === 'transfusing' ? 'red' : t.status === 'crossmatched' ? 'blue' : 'gold'}>{t.status.toUpperCase()}</Badge>
                <Badge tone={t.crossmatchResult === 'compatible' ? 'green' : 'red'}>Crossmatch: {t.crossmatchResult}</Badge>
              </div>
              <div className="text-xs text-slate-600 mb-2">{t.indication}</div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Unit</div><div className="text-xs font-bold">{t.unitNumber}</div></div>
                <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Pre-Hb</div><div className={`text-xs font-bold ${t.preTransfusionHb < 8 ? 'text-red-600' : 'text-green-600'}`}>{t.preTransfusionHb} g/dL</div></div>
                <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Volume</div><div className="text-xs font-bold">{t.volume}ml</div></div>
                <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Rate</div><div className="text-xs font-bold">{t.rate}</div></div>
              </div>
              {t.postTransfusionHb && <div className="mt-2 text-xs text-green-600 font-bold">Post-Hb: {t.postTransfusionHb} g/dL ✅</div>}
            </Card>
          ))}
        </div>
      )}

      {/* Donations Tab */}
      {tab === 'donations' && (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">🫀</div>
          <h3 className="font-bold text-lg text-slate-800">Blood Donation Management</h3>
          <p className="mt-2 text-sm text-slate-500">Register donors, conduct screening, and process blood donations.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 text-left">
            <div className="rounded-lg bg-green-50 p-3"><h4 className="font-bold text-xs text-green-700">1. Donor Registration</h4><p className="text-[10px] text-green-600 mt-1">Demographics, medical history, eligibility check</p></div>
            <div className="rounded-lg bg-blue-50 p-3"><h4 className="font-bold text-xs text-blue-700">2. Screening & Collection</h4><p className="text-[10px] text-blue-600 mt-1">Haemoglobin, blood pressure, pulse, screening tests</p></div>
            <div className="rounded-lg bg-purple-50 p-3"><h4 className="font-bold text-xs text-purple-700">3. Processing & Storage</h4><p className="text-[10px] text-purple-600 mt-1">Component separation, labelling, storage at correct temp</p></div>
          </div>
          <Button className="mt-4 bg-red-600 hover:bg-red-700">🫀 Register New Donation</Button>
        </Card>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🩸 Stock by Blood Type</h3>
            {BLOOD_TYPES.map(bt => {
              const available = availableByType(bt);
              const total = MOCK_UNITS.filter(u => u.bloodType === bt).length;
              const pct = total > 0 ? (available / total) * 100 : 0;
              return (
                <div key={bt} className="mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${BLOOD_TYPE_COLORS[bt]} px-2 py-0.5 rounded`}>{bt}</span>
                    <span>{available}/{total} available</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Component Distribution</h3>
            {['packed-rbc', 'platelets', 'plasma', 'cryoprecipitate'].map(comp => {
              const count = MOCK_UNITS.filter(u => u.component === comp).length;
              return (
                <div key={comp} className="flex items-center justify-between py-1 border-b last:border-0 text-xs">
                  <span className="text-slate-600 capitalize">{comp.replace('-', ' ')}</span>
                  <span className="font-bold">{count} units</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
