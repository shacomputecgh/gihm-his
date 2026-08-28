import { useState } from 'react';
import { Link } from 'react-router-dom';

interface TimeSlot {
  time: string;
  available: boolean;
}

const DEPARTMENTS = [
  { id: 'general', name: 'General Medicine', doctors: ['Dr. Kwame Asante', 'Dr. Yaw Frimpong'] },
  { id: 'pediatrics', name: 'Pediatrics', doctors: ['Dr. Akosua Boateng'] },
  { id: 'surgery', name: 'Surgery', doctors: ['Dr. Nana Agyeman'] },
  { id: 'maternity', name: 'Maternity', doctors: ['Dr. Akosua Boateng'] },
  { id: 'dental', name: 'Dental', doctors: ['Dr. Esi Mensah'] },
  { id: 'eye', name: 'Ophthalmology', doctors: ['Dr. Kofi Asare'] },
  { id: 'dermatology', name: 'Dermatology', doctors: ['Dr. Abena Osei'] },
];

const TIME_SLOTS: TimeSlot[] = [
  { time: '08:00 AM', available: true },
  { time: '08:30 AM', available: false },
  { time: '09:00 AM', available: true },
  { time: '09:30 AM', available: true },
  { time: '10:00 AM', available: false },
  { time: '10:30 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '11:30 AM', available: true },
  { time: '02:00 PM', available: true },
  { time: '02:30 PM', available: false },
  { time: '03:00 PM', available: true },
  { time: '03:30 PM', available: true },
];

export default function BookAppointment() {
  const [step, setStep] = useState<'dept' | 'doctor' | 'datetime' | 'details' | 'confirm' | 'success'>('dept');
  const [dept, setDept] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '', priority: 'routine' });
  const [bookedRef, setBookedRef] = useState('');

  const selectedDept = DEPARTMENTS.find((d) => d.id === dept);

  function handleBook() {
    const ref = `APT-${Date.now().toString(36).toUpperCase()}`;
    setBookedRef(ref);
    setStep('success');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <img src="/shacomputec-logo.png" alt="GIHM-HIS" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
          <h1 className="text-3xl font-extrabold">📅 Book an Appointment</h1>
          <p className="mt-1 text-blue-100">Schedule your visit in a few easy steps</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(['dept', 'doctor', 'datetime', 'details', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step === s ? 'bg-blue-600 text-white' : ['dept', 'doctor', 'datetime', 'details', 'confirm'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{i + 1}</div>
              {i < 4 && <div className="mx-1 h-0.5 w-6 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Department */}
        {step === 'dept' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Select Department</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {DEPARTMENTS.map((d) => (
                <button key={d.id} onClick={() => { setDept(d.id); setStep('doctor'); }}
                  className="rounded-xl border-2 border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50">
                  <p className="font-bold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.doctors.length} doctor{d.doctors.length > 1 ? 's' : ''} available</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Doctor */}
        {step === 'doctor' && selectedDept && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-1 text-xl font-bold text-slate-800">Select Doctor</h2>
            <p className="mb-4 text-sm text-slate-500">{selectedDept.name} Department</p>
            <div className="space-y-3">
              {selectedDept.doctors.map((doc) => (
                <button key={doc} onClick={() => { setDoctor(doc); setStep('datetime'); }}
                  className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">{doc.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-800">{doc}</p>
                      <p className="text-xs text-slate-500">{selectedDept.name}</p>
                    </div>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('dept')} className="mt-4 text-sm font-semibold text-blue-600 hover:underline">← Back</button>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 'datetime' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Select Date & Time</h2>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred Date</label>
              <input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Available Time Slots</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {TIME_SLOTS.map((slot) => (
                  <button key={slot.time} disabled={!slot.available}
                    onClick={() => { setTime(slot.time); setStep('details'); }}
                    className={`rounded-xl border-2 px-3 py-2.5 text-center text-sm font-semibold transition ${
                      time === slot.time ? 'border-blue-500 bg-blue-50 text-blue-700' :
                      slot.available ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50' : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}>
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('doctor')} className="mt-4 text-sm font-semibold text-blue-600 hover:underline">← Back</button>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 'details' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Your Details</h2>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-semibold text-slate-700">Full Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kwame Mensah"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1 block text-sm font-semibold text-slate-700">Phone *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none" /></div>
                <div><label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none" /></div>
              </div>
              <div><label className="mb-1 block text-sm font-semibold text-slate-700">Reason for Visit *</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe your symptoms or reason..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none" rows={3} /></div>
              <div><label className="mb-1 block text-sm font-semibold text-slate-700">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency (Call ahead)</option>
                </select></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setStep('datetime')} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">← Back</button>
              <button onClick={() => setStep('confirm')} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Review Booking →</button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 'confirm' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Confirm Your Booking</h2>
            <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Department</span><span className="font-semibold text-slate-800">{selectedDept?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Doctor</span><span className="font-semibold text-slate-800">{doctor}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-semibold text-slate-800">{date}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Time</span><span className="font-semibold text-slate-800">{time}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Patient</span><span className="font-semibold text-slate-800">{form.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Phone</span><span className="font-semibold text-slate-800">{form.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Reason</span><span className="font-semibold text-slate-800">{form.reason}</span></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setStep('details')} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600">← Back</button>
              <button onClick={() => void handleBook()} className="rounded-xl bg-green-600 px-8 py-3 text-sm font-bold text-white hover:bg-green-700">✅ Confirm Booking</button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="rounded-2xl border border-green-200 bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-green-700">Appointment Booked! 🎉</h2>
            <p className="mb-4 text-slate-600">Your appointment has been confirmed</p>
            <div className="mx-auto mb-6 max-w-sm rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-bold uppercase text-slate-400">Booking Reference</p>
              <p className="text-xl font-mono font-bold text-blue-600">{bookedRef}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>📅 {date} at {time}</p>
                <p>👨‍⚕️ {doctor}</p>
                <p>🏥 {selectedDept?.name}</p>
              </div>
            </div>
            <p className="mb-4 text-xs text-slate-400">A confirmation will be sent to {form.phone} via SMS</p>
            <Link to="/" className="inline-block rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700">← Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
