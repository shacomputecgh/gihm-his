import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface FireEquip {
  id: string;
  name: string;
  type: 'Extinguisher' | 'Alarm' | 'Sprinkler' | 'Hose Reel' | 'Emergency Light' | 'Exit Sign';
  location: string;
  lastInspection: string;
  nextInspection: string;
  status: 'Pass' | 'Fail' | 'Due';
  expiryDate: string;
}

interface DrillRecord {
  id: string;
  date: string;
  type: 'Fire Drill' | 'Evacuation Drill' | 'Tabletop Exercise';
  ward: string;
  participants: number;
  evacTime: number; // seconds
  targetTime: number;
  outcome: 'Pass' | 'Fail' | 'Partial';
  notes: string;
}

const EQUIPMENT: FireEquip[] = [
  { id: 'FE-001', name: 'Extinguisher - OPD', type: 'Extinguisher', location: 'OPD Reception', lastInspection: '2026-08-01', nextInspection: '2026-11-01', status: 'Pass', expiryDate: '2027-08-01' },
  { id: 'FE-002', name: 'Extinguisher - Theatre', type: 'Extinguisher', location: 'Theatre Corridor', lastInspection: '2026-08-01', nextInspection: '2026-11-01', status: 'Pass', expiryDate: '2027-08-01' },
  { id: 'FE-003', name: 'Alarm Panel - Main', type: 'Alarm', location: 'Main Entrance', lastInspection: '2026-07-15', nextInspection: '2026-10-15', status: 'Pass', expiryDate: '2028-07-15' },
  { id: 'FE-004', name: 'Sprinkler - ICU', type: 'Sprinkler', location: 'ICU Ceiling', lastInspection: '2026-06-20', nextInspection: '2026-09-20', status: 'Due', expiryDate: '2027-06-20' },
  { id: 'FE-005', name: 'Emergency Light - Ward A', type: 'Emergency Light', location: 'Ward A Corridor', lastInspection: '2026-08-10', nextInspection: '2026-11-10', status: 'Fail', expiryDate: '2026-09-10' },
  { id: 'FE-006', name: 'Exit Sign - Kitchen', type: 'Exit Sign', location: 'Kitchen Exit', lastInspection: '2026-08-10', nextInspection: '2026-11-10', status: 'Pass', expiryDate: '2027-08-10' },
  { id: 'FE-007', name: 'Hose Reel - Pharmacy', type: 'Hose Reel', location: 'Pharmacy', lastInspection: '2026-08-05', nextInspection: '2026-11-05', status: 'Pass', expiryDate: '2027-08-05' },
  { id: 'FE-008', name: 'Extinguisher - Lab', type: 'Extinguisher', location: 'Chemistry Lab', lastInspection: '2026-08-01', nextInspection: '2026-11-01', status: 'Pass', expiryDate: '2027-08-01' },
];

const DRILLS: DrillRecord[] = [
  { id: 'FD-001', date: '2026-08-15', type: 'Fire Drill', ward: 'All Wards', participants: 120, evacTime: 180, targetTime: 180, outcome: 'Pass', notes: 'Full evacuation completed in 3 minutes' },
  { id: 'FD-002', date: '2026-07-20', type: 'Evacuation Drill', ward: 'ICU', participants: 25, evacTime: 240, targetTime: 180, outcome: 'Fail', notes: 'Ventilator patient transfer took too long - need more practice' },
  { id: 'FD-003', date: '2026-06-10', type: 'Tabletop Exercise', ward: 'Admin', participants: 15, evacTime: 0, targetTime: 0, outcome: 'Pass', notes: 'Reviewed emergency response plan with management' },
];

const STATUS_COLORS: Record<string, string> = { Pass: 'bg-green-100 text-green-800', Fail: 'bg-red-100 text-red-800', Due: 'bg-yellow-100 text-yellow-800' };

export default function FireSafety() {
  const [tab, setTab] = useState<'overview' | 'equipment' | 'drills' | 'plans'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔥 Fire Safety</h1>
          <p className="text-gray-600 mt-1">Equipment checks · Fire drills · Evacuation plans · Incident tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Equipment', value: EQUIPMENT.length, icon: '🧯', color: 'text-blue-600' },
          { label: 'Passing', value: EQUIPMENT.filter(e => e.status === 'Pass').length, icon: '✅', color: 'text-green-600' },
          { label: 'Failed', value: EQUIPMENT.filter(e => e.status === 'Fail').length, icon: '❌', color: 'text-red-600' },
          { label: 'Drills This Year', value: DRILLS.length, icon: '🏃', color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'equipment', 'drills', 'plans'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'equipment' ? '🧯 Equipment' : t === 'drills' ? '🏃 Drills' : '📋 Plans'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Equipment Status</h3>
            <div className="space-y-2">
              {Object.entries(EQUIPMENT.reduce<Record<string, number>>((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {})).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{type}</span><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Drill Performance</h3>
            <div className="space-y-3">
              {DRILLS.map(d => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div><div className="font-medium">{d.type}</div><div className="text-xs text-gray-500">{d.date} · {d.ward}</div></div>
                    <Badge className={d.outcome === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{d.outcome}</Badge>
                  </div>
                  {d.evacTime > 0 && <div className="text-sm text-gray-600 mt-1">Evac time: {d.evacTime}s (target: {d.targetTime}s) · {d.participants} participants</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'equipment' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Last Inspection</th>
                <th className="px-4 py-3 text-left">Next Due</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPMENT.map(e => (
                <tr key={e.id} className={`border-b hover:bg-gray-50 ${e.status === 'Fail' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">{e.type}</td>
                  <td className="px-4 py-3">{e.location}</td>
                  <td className="px-4 py-3">{e.lastInspection}</td>
                  <td className="px-4 py-3">{e.nextInspection}</td>
                  <td className="px-4 py-3">{e.expiryDate}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'drills' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Ward</th>
                <th className="px-4 py-3 text-left">Participants</th>
                <th className="px-4 py-3 text-left">Evac Time</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {DRILLS.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{d.date}</td>
                  <td className="px-4 py-3">{d.type}</td>
                  <td className="px-4 py-3">{d.ward}</td>
                  <td className="px-4 py-3 text-center">{d.participants}</td>
                  <td className="px-4 py-3">{d.evacTime > 0 ? `${d.evacTime}s` : 'N/A'}</td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate">{d.notes}</td>
                  <td className="px-4 py-3"><Badge className={d.outcome === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{d.outcome}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">🔥 Fire Evacuation Plan</h3>
            <div className="space-y-2 text-sm">
              {['All staff must know 2 exit routes from every area', 'Designated ward fire marshals identified with green armbands', 'Patients evacuated by priority: ICU → NICU → Labour → Wards → OPD', 'Assembly point: Hospital main car park (East side)', 'Fire alarm: Continuous bell pattern = Evacuate immediately', 'Do NOT use lifts during fire evacuation', 'Head count at assembly point within 5 minutes', 'Fire brigade called: Ghana National Fire Service 192'].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded"><span className="text-red-600">🔥</span>{item}</div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">📞 Emergency Contacts</h3>
            <div className="space-y-2 text-sm">
              {[
                { role: 'Fire Safety Officer', name: 'Mr. Kofi Mensah', phone: '+233201234567' },
                { role: 'Hospital Administrator', name: 'Dr. Akua Boateng', phone: '+233245678901' },
                { role: 'National Fire Service', name: 'GFS Station', phone: '192' },
                { role: 'Police Emergency', name: 'Ghana Police', phone: '191' },
                { role: 'Ambulance', name: 'National Ambulance', phone: '193' },
              ].map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div><div className="font-medium">{c.role}</div><div className="text-xs text-gray-500">{c.name}</div></div>
                  <span className="font-mono font-bold text-blue-600">{c.phone}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
