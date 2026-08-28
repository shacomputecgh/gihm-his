import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Donation { id: string; donorName: string; age: number; sex: string; bloodGroup: string; organs: string[]; status: 'Registered' | 'Consented' | 'Deceased Donor' | 'Living Donor' | 'Transplanted'; dateRegistered: string; hospital: string; notes: string; }

const DONATIONS: Donation[] = [
  { id: 'OD-001', donorName: 'Kwame Asante', age: 45, sex: 'Male', bloodGroup: 'O+', organs: ['Kidney', 'Liver', 'Cornea'], status: 'Registered', dateRegistered: '2026-08-20', hospital: 'Korle-Bu Teaching Hospital', notes: 'Living donor — kidney for spouse' },
  { id: 'OD-002', donorName: 'Akua Mensah', age: 32, sex: 'Female', bloodGroup: 'A+', organs: ['Heart', 'Lungs', 'Kidneys', 'Liver'], status: 'Consented', dateRegistered: '2026-08-15', hospital: 'Korle-Bu Teaching Hospital', notes: 'Deceased donor consent — family notified' },
  { id: 'OD-003', donorName: 'Nana Osei', age: 28, sex: 'Male', bloodGroup: 'B+', organs: ['Kidney'], status: 'Transplanted', dateRegistered: '2026-07-01', hospital: 'Komfo Anokye Teaching Hospital', notes: 'Kidney transplant completed successfully' },
];

const STATUS_COLORS: Record<string, string> = { Registered: 'bg-blue-100 text-blue-800', Consented: 'bg-green-100 text-green-800', 'Deceased Donor': 'bg-red-100 text-red-800', 'Living Donor': 'bg-purple-100 text-purple-800', Transplanted: 'bg-emerald-100 text-emerald-800' };

export default function OrganDonationRegistry() {
  const [donations] = useState<Donation[]>(DONATIONS);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Organ Donation Registry</h1><p className="text-gray-500">Organ donor registration, consent management, and transplant tracking</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ Register Donor'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Register Organ Donor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Donor Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Age *</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Sex *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Male</option><option>Female</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Blood Group *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Donor Type *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Living Donor</option><option>Deceased Donor (Consent)</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Hospital *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Organs for Donation *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Kidney, Liver, Cornea (comma separated)" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} /></div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Register Donor</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['Registered', 'Consented', 'Living Donor', 'Transplanted'].map((s) => <div key={s} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{donations.filter((d) => d.status === s).length}</div><div className="text-xs text-slate-500">{s}</div></div>)}
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{donations.reduce((s, d) => s + d.organs.length, 0)}</div><div className="text-xs text-slate-500">Organs Registered</div></div>
      </div>
      <div className="space-y-3">
        {donations.map((d) => (
          <div key={d.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{d.id}</span><span className="font-semibold">{d.donorName}</span><span className="text-xs text-slate-500">{d.age}y {d.sex} · {d.bloodGroup}</span></div>
              <Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{d.organs.map((o) => <span key={o} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full">{o}</span>)}</div>
            <div className="text-xs text-slate-400 mt-2">🏥 {d.hospital} · 📅 {d.dateRegistered}</div>
            {d.notes && <div className="text-xs text-slate-500 mt-1 italic">{d.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
