import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Room {
  id: string; name: string; capacity: number; floor: string;
  equipment: string[]; status: 'Available' | 'Booked' | 'Maintenance';
}

interface Booking {
  id: string; room: string; title: string; organizer: string;
  date: string; startTime: string; endTime: string; attendees: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

const ROOMS: Room[] = [
  { id: 'CR-001', name: 'Conference Room A', capacity: 30, floor: '3rd Floor', equipment: ['Projector', 'Whiteboard', 'Video Conferencing', 'Microphone'], status: 'Booked' },
  { id: 'CR-002', name: 'Board Room', capacity: 20, floor: '5th Floor', equipment: ['Projector', 'Smart TV', 'Video Conferencing', 'Catering Station'], status: 'Available' },
  { id: 'CR-003', name: 'Seminar Hall', capacity: 100, floor: 'Ground Floor', equipment: ['Stage', 'Sound System', 'Projector', 'Recording Equipment'], status: 'Available' },
  { id: 'CR-004', name: 'Meeting Room B', capacity: 10, floor: '2nd Floor', equipment: ['Whiteboard', 'TV Screen'], status: 'Maintenance' },
  { id: 'CR-005', name: 'Telemedicine Studio', capacity: 6, floor: '1st Floor', equipment: ['Camera', 'Ring Light', 'Video Conferencing', 'Medical Instruments'], status: 'Available' },
];

const BOOKINGS: Booking[] = [
  { id: 'BK-001', room: 'Conference Room A', title: 'Grand Rounds — Cardiology', organizer: 'Dr. Sarah Johnson', date: '2026-08-25', startTime: '08:00', endTime: '10:00', attendees: 25, status: 'Confirmed' },
  { id: 'BK-002', room: 'Board Room', title: 'Quality Committee Meeting', organizer: 'Nurse Director Abena', date: '2026-08-25', startTime: '14:00', endTime: '16:00', attendees: 12, status: 'Confirmed' },
  { id: 'BK-003', room: 'Seminar Hall', title: 'CME — Malaria Management', organizer: 'Dr. Kofi Appiah', date: '2026-08-26', startTime: '09:00', endTime: '12:00', attendees: 80, status: 'Pending' },
  { id: 'BK-004', room: 'Telemedicine Studio', title: 'Teleconsult — Dr. London', organizer: 'Dr. Sarah Johnson', date: '2026-08-25', startTime: '11:00', endTime: '11:30', attendees: 3, status: 'Confirmed' },
];

const STATUS_COLORS: Record<string, string> = { Available: 'bg-green-100 text-green-800', Booked: 'bg-yellow-100 text-yellow-800', Maintenance: 'bg-red-100 text-red-800', Confirmed: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Cancelled: 'bg-red-100 text-red-800' };

export default function ConferenceBooking() {
  const [tab, setTab] = useState<'rooms' | 'bookings' | 'stats'>('rooms');

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
      <div><h1 className="text-2xl font-bold">Conference Room Booking</h1><p className="text-gray-500">Meeting room scheduling, equipment tracking, and event coordination</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Rooms', value: ROOMS.length, color: 'text-blue-600' }, { label: 'Available', value: ROOMS.filter(r => r.status === 'Available').length, color: 'text-green-600' }, { label: 'Bookings Today', value: BOOKINGS.length, color: 'text-purple-600' }, { label: 'Total Capacity', value: ROOMS.reduce((s, r) => s + r.capacity, 0), color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['rooms', 'bookings', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'rooms' ? 'Rooms' : t === 'bookings' ? 'Bookings' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROOMS.map(r => (
            <div key={r.id} className={`bg-white rounded-lg border p-4 ${r.status === 'Available' ? 'border-green-200' : r.status === 'Maintenance' ? 'border-red-200' : 'border-yellow-200'}`}>
              <div className="flex items-center justify-between mb-2"><span className="font-bold">{r.name}</span><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
              <div className="text-sm space-y-1 mb-2"><div><span className="text-gray-500">Floor:</span> {r.floor}</div><div><span className="text-gray-500">Capacity:</span> {r.capacity}</div></div>
              <div className="flex flex-wrap gap-1">{r.equipment.map(e => <span key={e} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">{e}</span>)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Room</th><th className="p-3">Title</th><th className="p-3">Organizer</th><th className="p-3">Date</th><th className="p-3">Time</th><th className="p-3">Attendees</th><th className="p-3">Status</th></tr></thead>
            <tbody>{BOOKINGS.map(b => (
              <tr key={b.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{b.room}</td><td className="p-3">{b.title}</td><td className="p-3 text-xs">{b.organizer}</td><td className="p-3 text-xs">{b.date}</td><td className="p-3 text-xs">{b.startTime} - {b.endTime}</td><td className="p-3 text-center">{b.attendees}</td><td className="p-3"><Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Room Status</h3>
            {['Available', 'Booked', 'Maintenance'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{ROOMS.filter(r => r.status === s).length}</span></div>)}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Booking Status</h3>
            {['Confirmed', 'Pending', 'Cancelled'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{BOOKINGS.filter(b => b.status === s).length}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
