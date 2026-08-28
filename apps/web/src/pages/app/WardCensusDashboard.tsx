import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface WardCensus {
  ward: string; totalBeds: number; occupied: number;
  awaiting: number; discharges: number;
  status: string;
}

const WARD_DATA: WardCensus[] = [
  { ward: 'ICU', totalBeds: 12, occupied: 10, awaiting: 2, discharges: 1, status: 'Critical' },
  { ward: 'Surgery', totalBeds: 30, occupied: 24, awaiting: 3, discharges: 4, status: 'High' },
  { ward: 'Medicine', totalBeds: 40, occupied: 32, awaiting: 5, discharges: 6, status: 'High' },
  { ward: 'Maternity', totalBeds: 25, occupied: 18, awaiting: 2, discharges: 3, status: 'Moderate' },
  { ward: 'Paediatrics', totalBeds: 20, occupied: 12, awaiting: 1, discharges: 2, status: 'Moderate' },
  { ward: 'Emergency', totalBeds: 15, occupied: 14, awaiting: 8, discharges: 5, status: 'Critical' },
  { ward: 'Oncology', totalBeds: 18, occupied: 14, awaiting: 2, discharges: 1, status: 'High' },
  { ward: 'Orthopaedics', totalBeds: 20, occupied: 15, awaiting: 2, discharges: 3, status: 'Moderate' },
];

const STATUS_COLORS: Record<string, string> = { Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-800', Moderate: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };

export default function WardCensusDashboard() {
  const totalBeds = WARD_DATA.reduce((s, w) => s + w.totalBeds, 0);
  const totalOccupied = WARD_DATA.reduce((s, w) => s + w.occupied, 0);
  const totalAwaiting = WARD_DATA.reduce((s, w) => s + w.awaiting, 0);

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
          title="Add New Census Entry"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Ward Census Dashboard</h1><p className="text-gray-500">Real-time bed occupancy, patient flow, and capacity management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Beds', value: totalBeds, color: 'text-blue-600' }, { label: 'Occupied', value: totalOccupied, color: 'text-red-600' }, { label: 'Available', value: totalBeds - totalOccupied, color: 'text-green-600' }, { label: 'Awaiting Admission', value: totalAwaiting, color: 'text-yellow-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-5">
        <div className="w-full bg-gray-200 rounded-full h-6 mb-2"><div className="bg-red-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${Math.round((totalOccupied / totalBeds) * 100)}%` }}>{Math.round((totalOccupied / totalBeds) * 100)}% Occupied</div></div>
      </div>
      <div className="space-y-3">
        {WARD_DATA.sort((a, b) => (b.occupied/b.totalBeds) - (a.occupied/a.totalBeds)).map(w => {
          const pct = Math.round((w.occupied / w.totalBeds) * 100);
          return (
            <div key={w.ward} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-bold">{w.ward}</span><Badge className={STATUS_COLORS[w.status]}>{w.status}</Badge></div><span className="text-sm font-bold">{w.occupied}/{w.totalBeds} ({pct}%)</span></div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2"><div className={`h-3 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} /></div>
              <div className="flex gap-4 text-xs text-gray-500"><span>Available: {w.totalBeds - w.occupied}</span><span>Awaiting: {w.awaiting}</span><span>Discharges Today: {w.discharges}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
