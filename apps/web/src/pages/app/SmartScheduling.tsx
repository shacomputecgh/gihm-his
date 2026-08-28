import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type ShiftType = 'morning' | 'afternoon' | 'night' | 'on_call';
type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'absent';

interface StaffSchedule {
  id: string;
  staffName: string;
  role: string;
  department: string;
  shift: ShiftType;
  date: string;
  status: ScheduleStatus;
  startTime: string;
  endTime: string;
  overtime: number;
}

interface TheatreSlot {
  id: string;
  theatre: string;
  date: string;
  time: string;
  duration: number;
  procedure: string;
  surgeon: string;
  patientName: string;
  status: 'booked' | 'available' | 'cancelled';
}

interface RoomBooking {
  id: string;
  room: string;
  date: string;
  time: string;
  event: string;
  department: string;
  attendees: number;
}

const SHIFT_CONFIG: Record<ShiftType, { label: string; color: string; bg: string; time: string }> = {
  morning: { label: 'Morning', color: 'text-blue-600', bg: 'bg-blue-50', time: '06:00-14:00' },
  afternoon: { label: 'Afternoon', color: 'text-amber-600', bg: 'bg-amber-50', time: '14:00-22:00' },
  night: { label: 'Night', color: 'text-purple-600', bg: 'bg-purple-50', time: '22:00-06:00' },
  on_call: { label: 'On-Call', color: 'text-red-600', bg: 'bg-red-50', time: '24h' }
};

const MOCK_SCHEDULES: StaffSchedule[] = [
  { id: 'SS001', staffName: 'Dr. Akua Osei', role: 'Doctor', department: 'Emergency', shift: 'morning', date: '2024-01-16', status: 'confirmed', startTime: '06:00', endTime: '14:00', overtime: 0 },
  { id: 'SS002', staffName: 'Dr. Kofi Asante', role: 'Doctor', department: 'Surgery', shift: 'morning', date: '2024-01-16', status: 'confirmed', startTime: '06:00', endTime: '14:00', overtime: 0 },
  { id: 'SS003', staffName: 'Nurse Ama', role: 'Nurse', department: 'Medical Ward', shift: 'morning', date: '2024-01-16', status: 'confirmed', startTime: '06:00', endTime: '14:00', overtime: 0 },
  { id: 'SS004', staffName: 'Nurse Kofi', role: 'Nurse', department: 'Surgical Ward', shift: 'afternoon', date: '2024-01-16', status: 'scheduled', startTime: '14:00', endTime: '22:00', overtime: 0 },
  { id: 'SS005', staffName: 'Dr. Nana Agyeman', role: 'Doctor', department: 'Paediatrics', shift: 'night', date: '2024-01-16', status: 'scheduled', startTime: '22:00', endTime: '06:00', overtime: 0 },
  { id: 'SS006', staffName: 'Nurse Esi', role: 'Nurse', department: 'ICU', shift: 'night', date: '2024-01-16', status: 'scheduled', startTime: '22:00', endTime: '06:00', overtime: 0 },
  { id: 'SS007', staffName: 'Dr. Emergency', role: 'Doctor', department: 'Emergency', shift: 'on_call', date: '2024-01-16', status: 'confirmed', startTime: '00:00', endTime: '23:59', overtime: 0 },
  { id: 'SS008', staffName: 'Pharmacist Akua', role: 'Pharmacist', department: 'Pharmacy', shift: 'morning', date: '2024-01-16', status: 'absent', startTime: '06:00', endTime: '14:00', overtime: 0 }
];

const THEATRE_SLOTS: TheatreSlot[] = [
  { id: 'TS001', theatre: 'Theatre 1', date: '2024-01-16', time: '08:00', duration: 120, procedure: 'Appendectomy', surgeon: 'Dr. Osei', patientName: 'Kwame Mensah', status: 'booked' },
  { id: 'TS002', theatre: 'Theatre 1', date: '2024-01-16', time: '10:30', duration: 90, procedure: 'Hernia Repair', surgeon: 'Dr. Osei', patientName: 'Yaw Boateng', status: 'booked' },
  { id: 'TS003', theatre: 'Theatre 1', date: '2024-01-16', time: '14:00', duration: 60, procedure: 'Cataract Surgery', surgeon: 'Dr. Eye', patientName: 'Efua Adjei', status: 'available' },
  { id: 'TS004', theatre: 'Theatre 2', date: '2024-01-16', time: '08:00', duration: 90, procedure: 'Caesarean Section', surgeon: 'Dr. Agyeman', patientName: 'Ama Darko', status: 'booked' },
  { id: 'TS005', theatre: 'Theatre 2', date: '2024-01-16', time: '10:00', duration: 60, procedure: 'D&C', surgeon: 'Dr. Agyeman', patientName: 'Abena Boateng', status: 'booked' },
  { id: 'TS006', theatre: 'Theatre 2', date: '2024-01-16', time: '14:00', duration: 120, procedure: 'Knee Arthroscopy', surgeon: 'Dr. Ortho', patientName: 'Nana Kwame', status: 'available' }
];

const ROOM_BOOKINGS: RoomBooking[] = [
  { id: 'RB001', room: 'Conference Room A', date: '2024-01-16', time: '09:00', event: 'Morning Briefing', department: 'All', attendees: 25 },
  { id: 'RB002', room: 'Meeting Room 1', date: '2024-01-16', time: '10:00', event: 'Cardiology Case Review', department: 'Cardiology', attendees: 8 },
  { id: 'RB003', room: 'Conference Room A', date: '2024-01-16', time: '14:00', event: 'M&M Conference', department: 'All', attendees: 30 },
  { id: 'RB004', room: 'Training Room', date: '2024-01-16', time: '13:00', event: 'CPR Training', department: 'Nursing', attendees: 15 }
];

export default function SmartScheduling() {
  const [activeTab, setActiveTab] = useState<'staff' | 'theatre' | 'rooms' | 'ai_suggestions'>('staff');

  const stats = {
    staffOnDuty: MOCK_SCHEDULES.filter(s => s.status === 'confirmed' || s.status === 'scheduled').length,
    staffAbsent: MOCK_SCHEDULES.filter(s => s.status === 'absent').length,
    theatreBookings: THEATRE_SLOTS.filter(t => t.status === 'booked').length,
    theatreAvailable: THEATRE_SLOTS.filter(t => t.status === 'available').length
  };

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
          title="Add New Schedule Entry"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Scheduling</h1>
          <p className="text-gray-500">AI-powered staff and resource scheduling</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Schedule</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Staff On Duty', value: stats.staffOnDuty, color: 'bg-blue-500' },
          { label: 'Staff Absent', value: stats.staffAbsent, color: 'bg-red-500' },
          { label: 'Theatre Booked', value: stats.theatreBookings, color: 'bg-purple-500' },
          { label: 'Theatre Available', value: stats.theatreAvailable, color: 'bg-emerald-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['staff', 'theatre', 'rooms', 'ai_suggestions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'staff' ? 'Staff Schedule' : tab === 'theatre' ? 'Theatre' : tab === 'rooms' ? 'Rooms' : 'AI Suggestions'}
          </button>
        ))}
      </div>

      {/* Staff Schedule Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {Object.entries(SHIFT_CONFIG).map(([shift, config]) => {
            const staff = MOCK_SCHEDULES.filter(s => s.shift === shift);
            return (
              <div key={shift} className={`border rounded-xl p-4 ${config.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{config.label} Shift</h3>
                    <p className="text-sm text-gray-500">{config.time} | {staff.length} staff</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {staff.map(s => (
                    <div key={s.id} className={`p-3 rounded-lg border ${
                      s.status === 'absent' ? 'bg-red-50 border-red-200' :
                      s.status === 'confirmed' ? 'bg-white border-emerald-200' : 'bg-white border-gray-200'
                    }`}>
                      <p className="font-medium text-sm">{s.staffName}</p>
                      <p className="text-xs text-gray-500">{s.role} | {s.department}</p>
                      <Badge className={s.status === 'confirmed' ? 'text-emerald-600 bg-emerald-50' : s.status === 'absent' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}>
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Theatre Tab */}
      {activeTab === 'theatre' && (
        <div className="space-y-3">
          {THEATRE_SLOTS.map(slot => (
            <div key={slot.id} className={`border rounded-xl p-4 ${
              slot.status === 'booked' ? 'bg-blue-50 border-blue-200' :
              slot.status === 'available' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{slot.theatre}</span>
                    <Badge className={slot.status === 'booked' ? 'text-blue-600 bg-blue-100' : slot.status === 'available' ? 'text-emerald-600 bg-emerald-100' : 'text-red-600 bg-red-100'}>
                      {slot.status}
                    </Badge>
                  </div>
                  {slot.status === 'booked' ? (
                    <>
                      <p className="text-sm text-gray-700 mt-1">{slot.procedure} — {slot.patientName}</p>
                      <p className="text-xs text-gray-500">Surgeon: {slot.surgeon} | Time: {slot.time} | Duration: {slot.duration} min</p>
                    </>
                  ) : (
                    <p className="text-sm text-emerald-600 mt-1">Available from {slot.time}</p>
                  )}
                </div>
                {slot.status === 'available' && (
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Book</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-3">
          {ROOM_BOOKINGS.map(booking => (
            <div key={booking.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{booking.room}</span>
                    <Badge className="bg-blue-50 text-blue-600">{booking.department}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{booking.event}</p>
                  <p className="text-xs text-gray-500">{booking.date} {booking.time} | {booking.attendees} attendees</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Suggestions Tab */}
      {activeTab === 'ai_suggestions' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">🤖 AI Scheduling Suggestions</h3>
          <div className="space-y-3">
            {[
              { priority: 'high', title: 'Staff Absence Coverage', description: 'Pharmacist Akua is absent. Suggest covering with locum or redistributing workload.', action: 'View Coverage Options' },
              { priority: 'high', title: 'Theatre Optimization', description: 'Theatre 1 has a 30-min gap at 12:30. Consider moving the 14:00 case earlier to improve utilization.', action: 'Optimize Schedule' },
              { priority: 'medium', title: 'Night Shift Balance', description: 'ICU is understaffed for night shift. Recommend requesting 1 additional nurse from Medical Ward.', action: 'Request Staff' },
              { priority: 'low', title: 'Room Booking Conflict', description: 'Conference Room A has overlapping bookings at 14:00. Consider moving M&M Conference to Training Room.', action: 'Resolve Conflict' }
            ].map((suggestion, idx) => (
              <div key={idx} className={`border rounded-xl p-4 ${
                suggestion.priority === 'high' ? 'bg-red-50 border-red-200' :
                suggestion.priority === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={suggestion.priority === 'high' ? 'text-red-600 bg-red-100' : suggestion.priority === 'medium' ? 'text-amber-600 bg-amber-100' : 'text-blue-600 bg-blue-100'}>
                        {suggestion.priority}
                      </Badge>
                      <span className="font-bold">{suggestion.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">{suggestion.action}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
