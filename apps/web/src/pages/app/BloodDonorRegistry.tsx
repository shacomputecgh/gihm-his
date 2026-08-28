import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface Donor {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  rhFactor: string;
  phone: string;
  lastDonation: string;
  totalDonations: number;
  nextEligible: string;
  healthScreening: 'Pass' | 'Fail' | 'Pending';
  status: 'Active' | 'Inactive' | 'Deferred' | 'First-Time';
}

const SAMPLE_DONORS: Donor[] = [
  { id: 'DN-001', name: 'Kwame Mensah', age: 32, gender: 'Male', bloodGroup: 'O', rhFactor: '+', phone: '+233201234567', lastDonation: '2026-07-15', totalDonations: 8, nextEligible: '2026-10-15', healthScreening: 'Pass', status: 'Active' },
  { id: 'DN-002', name: 'Ama Osei', age: 28, gender: 'Female', bloodGroup: 'A', rhFactor: '+', phone: '+233245678901', lastDonation: '2026-06-20', totalDonations: 5, nextEligible: '2026-09-20', healthScreening: 'Pass', status: 'Active' },
  { id: 'DN-003', name: 'Kofi Asante', age: 45, gender: 'Male', bloodGroup: 'B', rhFactor: '-', phone: '+233267890123', lastDonation: '2026-08-01', totalDonations: 12, nextEligible: '2026-11-01', healthScreening: 'Pass', status: 'Active' },
  { id: 'DN-004', name: 'Akua Boateng', age: 22, gender: 'Female', bloodGroup: 'AB', rhFactor: '+', phone: '+233501234567', lastDonation: '', totalDonations: 0, nextEligible: '2026-08-27', healthScreening: 'Pending', status: 'First-Time' },
  { id: 'DN-005', name: 'Yaw Darko', age: 38, gender: 'Male', bloodGroup: 'O', rhFactor: '-', phone: '+233278901234', lastDonation: '2026-08-10', totalDonations: 3, nextEligible: '2026-11-10', healthScreening: 'Pass', status: 'Active' },
  { id: 'DN-006', name: 'Esi Kumah', age: 50, gender: 'Female', bloodGroup: 'A', rhFactor: '-', phone: '+233289012345', lastDonation: '2025-12-01', totalDonations: 15, nextEligible: '2026-03-01', healthScreening: 'Fail', status: 'Deferred' },
];

const BLOOD_INVENTORY = [
  { group: 'O+', units: 45, minRequired: 30, expiring: 5 },
  { group: 'O-', units: 12, minRequired: 15, expiring: 2 },
  { group: 'A+', units: 38, minRequired: 25, expiring: 3 },
  { group: 'A-', units: 8, minRequired: 10, expiring: 1 },
  { group: 'B+', units: 22, minRequired: 20, expiring: 4 },
  { group: 'B-', units: 6, minRequired: 8, expiring: 0 },
  { group: 'AB+', units: 15, minRequired: 10, expiring: 2 },
  { group: 'AB-', units: 4, minRequired: 5, expiring: 1 },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Inactive: 'bg-gray-100 text-gray-800', Deferred: 'bg-red-100 text-red-800', 'First-Time': 'bg-blue-100 text-blue-800' };

export default function BloodDonorRegistry() {
  const [donors] = useState<Donor[]>(SAMPLE_DONORS);
  const [tab, setTab] = useState<'overview' | 'donors' | 'inventory' | 'campaigns'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🩸 Blood Donor Registry</h1>
          <p className="text-gray-600 mt-1">Donor management · Blood inventory · Campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Donors', value: donors.length, icon: '👥', color: 'text-blue-600' },
          { label: 'Active Donors', value: donors.filter(d => d.status === 'Active').length, icon: '✅', color: 'text-green-600' },
          { label: 'Total Units', value: BLOOD_INVENTORY.reduce((s, b) => s + b.units, 0), icon: '🩸', color: 'text-red-600' },
          { label: 'Low Stock Groups', value: BLOOD_INVENTORY.filter(b => b.units < b.minRequired).length, icon: '⚠️', color: 'text-yellow-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'donors', 'inventory', 'campaigns'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'donors' ? '👥 Donors' : t === 'inventory' ? '🩸 Inventory' : '📢 Campaigns'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Blood Group Inventory</h3>
            <div className="space-y-3">
              {BLOOD_INVENTORY.map(b => {
                const pct = b.minRequired > 0 ? Math.min((b.units / (b.minRequired * 2)) * 100, 100) : 0;
                const isLow = b.units < b.minRequired;
                return (
                  <div key={b.group}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold">{b.group}</span>
                      <span className={isLow ? 'text-red-600 font-bold' : 'text-gray-600'}>{b.units} units {isLow ? '(LOW!)' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${isLow ? 'bg-red-500' : b.units < b.minRequired * 1.5 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Donor Status</h3>
            <div className="space-y-3">
              {['Active', 'Inactive', 'Deferred', 'First-Time'].map(s => {
                const count = donors.filter(d => d.status === s).length;
                return (
                  <div key={s} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <Badge className={STATUS_COLORS[s]}>{s}</Badge>
                    <span className="font-bold text-lg">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="font-medium text-red-800">⚠️ Blood Groups Below Minimum</div>
              {BLOOD_INVENTORY.filter(b => b.units < b.minRequired).map(b => (
                <div key={b.group} className="text-sm text-red-600 mt-1">{b.group}: {b.units}/{b.minRequired} units — Need {b.minRequired - b.units} more</div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'donors' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Donor</th>
                <th className="px-4 py-3 text-left">Blood Group</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Total Donations</th>
                <th className="px-4 py-3 text-left">Last Donation</th>
                <th className="px-4 py-3 text-left">Next Eligible</th>
                <th className="px-4 py-3 text-left">Screening</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {donors.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{d.name}</div><div className="text-xs text-gray-500">{d.age}y {d.gender} · {d.id}</div></td>
                  <td className="px-4 py-3"><span className="text-lg font-bold text-red-600">{d.bloodGroup}{d.rhFactor}</span></td>
                  <td className="px-4 py-3">{d.phone}</td>
                  <td className="px-4 py-3 text-center font-bold">{d.totalDonations}</td>
                  <td className="px-4 py-3">{d.lastDonation || 'Never'}</td>
                  <td className="px-4 py-3">{d.nextEligible}</td>
                  <td className="px-4 py-3"><Badge className={d.healthScreening === 'Pass' ? 'bg-green-100 text-green-800' : d.healthScreening === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{d.healthScreening}</Badge></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BLOOD_INVENTORY.map(b => (
            <Card key={b.group} className={`p-5 text-center ${b.units < b.minRequired ? 'ring-2 ring-red-500' : ''}`}>
              <div className="text-3xl font-bold text-red-600">{b.group}</div>
              <div className="text-2xl font-bold mt-2">{b.units}</div>
              <div className="text-sm text-gray-500">units available</div>
              <div className="mt-2 text-xs text-gray-500">Min: {b.minRequired} | Expiring: {b.expiring}</div>
              {b.units < b.minRequired && <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">⚠️ BELOW MINIMUM</div>}
            </Card>
          ))}
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'University Blood Drive', date: '2026-09-15', location: 'KNUST Campus', target: 100, collected: 0, status: 'Planned' },
            { name: 'Church Blood Drive', date: '2026-08-30', location: 'Holy Trinity Cathedral', target: 50, collected: 32, status: 'Active' },
            { name: 'Corporate Donation Day', date: '2026-07-20', location: 'Vodafone HQ', target: 80, collected: 75, status: 'Completed' },
          ].map((c, i) => (
            <Card key={i} className="p-5">
              <div className="flex justify-between items-start">
                <div><div className="font-bold">{c.name}</div><div className="text-sm text-gray-500">{c.location} · {c.date}</div></div>
                <Badge className={c.status === 'Completed' ? 'bg-green-100 text-green-800' : c.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>{c.status}</Badge>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1"><span>{c.collected}/{c.target} units</span><span>{c.target > 0 ? (c.collected / c.target * 100).toFixed(0) : 0}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${c.target > 0 ? (c.collected / c.target * 100) : 0}%` }} /></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
