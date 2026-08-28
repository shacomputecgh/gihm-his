import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PressRelease {
  id: string; title: string; date: string; type: string;
  status: 'Published' | 'Draft' | 'Scheduled'; reach: number;
}

interface MediaContact {
  id: string; name: string; organisation: string; type: string;
  lastContact: string;
}

const PRESS_RELEASES: PressRelease[] = [
  { id: 'PR-001', title: 'Hospital Launches New Cardiac Surgery Programme', date: '2026-08-20', type: 'News', status: 'Published', reach: 45000 },
  { id: 'PR-002', title: 'Free Health Screening — Community Outreach', date: '2026-08-15', type: 'Event', status: 'Published', reach: 12000 },
  { id: 'PR-003', title: 'State-of-the-Art MRI Scanner Commissioned', date: '2026-08-25', type: 'News', status: 'Scheduled', reach: 0 },
  { id: 'PR-004', title: 'World Malaria Day Activities', date: '2026-08-10', type: 'Campaign', status: 'Published', reach: 32000 },
];

const MEDIA_CONTACTS: MediaContact[] = [
  { id: 'MC-001', name: 'Joy News Health Desk', organisation: 'Joy FM/TV', type: 'Broadcast', lastContact: '2026-08-20' },
  { id: 'MC-002', name: 'Daily Graphic Health', organisation: 'Graphic Communications', type: 'Print', lastContact: '2026-08-15' },
  { id: 'MC-003', name: 'GhanaWeb Health', organisation: 'GhanaWeb', type: 'Online', lastContact: '2026-08-18' },
];

const STATUS_COLORS: Record<string, string> = { Published: 'bg-green-100 text-green-800', Draft: 'bg-gray-100 text-gray-800', Scheduled: 'bg-blue-100 text-blue-800' };

export default function PublicRelations() {
  const [tab, setTab] = useState<'press' | 'media' | 'stats'>('press');
  const totalReach = PRESS_RELEASES.reduce((s, p) => s + p.reach, 0);

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
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Public Relations & Media</h1><p className="text-gray-500">Press releases, media relations, events, and public communications</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Press Releases', value: PRESS_RELEASES.length, color: 'text-blue-600' }, { label: 'Published', value: PRESS_RELEASES.filter(p => p.status === 'Published').length, color: 'text-green-600' }, { label: 'Total Reach', value: `${(totalReach/1000).toFixed(0)}K`, color: 'text-purple-600' }, { label: 'Media Contacts', value: MEDIA_CONTACTS.length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['press', 'media', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'press' ? 'Press Releases' : t === 'media' ? 'Media Contacts' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'press' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Title</th><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Reach</th><th className="p-3">Status</th></tr></thead>
            <tbody>{PRESS_RELEASES.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{p.title}</td><td className="p-3 text-xs">{p.date}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{p.type}</Badge></td><td className="p-3">{p.reach > 0 ? `${(p.reach/1000).toFixed(1)}K` : '—'}</td><td className="p-3"><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'media' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Contact</th><th className="p-3">Organisation</th><th className="p-3">Type</th><th className="p-3">Last Contact</th></tr></thead>
            <tbody>{MEDIA_CONTACTS.map(m => (
              <tr key={m.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{m.name}</td><td className="p-3">{m.organisation}</td><td className="p-3"><Badge className="bg-blue-100 text-blue-800">{m.type}</Badge></td><td className="p-3 text-xs">{m.lastContact}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">By Type</h3>
            {['News', 'Event', 'Campaign'].map(t => <div key={t} className="flex items-center justify-between py-2 border-b last:border-0"><span className="text-sm">{t}</span><span className="font-bold">{PRESS_RELEASES.filter(p => p.type === t).length}</span></div>)}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">By Status</h3>
            {Object.keys(STATUS_COLORS).map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{PRESS_RELEASES.filter(p => p.status === s).length}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
