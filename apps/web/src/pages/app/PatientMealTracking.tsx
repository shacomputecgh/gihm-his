import { useState } from 'react';
import { Badge } from '../../components/ui';

interface MealOrder { id: string; patientName: string; ward: string; bed: string; diet: string; mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'; allergies: string; status: 'Ordered' | 'Preparing' | 'Served' | 'Consumed' | 'Refused'; timeOrdered: string; timeServed?: string; }

const ORDERS: MealOrder[] = [
  { id: 'MO-001', patientName: 'Kwame Asante', ward: 'Medical Ward A', bed: 'A-12', diet: 'Diabetic Diet', mealType: 'Lunch', allergies: 'None', status: 'Ordered', timeOrdered: '10:30' },
  { id: 'MO-002', patientName: 'Akua Mensah', ward: 'Maternity Ward', bed: 'M-05', diet: 'Normal Diet', mealType: 'Lunch', allergies: 'None', status: 'Preparing', timeOrdered: '10:00' },
  { id: 'MO-003', patientName: 'Nana Osei', ward: 'Surgical Ward', bed: 'S-08', diet: 'Soft Diet', mealType: 'Lunch', allergies: 'Lactose', status: 'Served', timeOrdered: '10:15', timeServed: '11:45' },
  { id: 'MO-004', patientName: 'Efua Nyarko', ward: 'ICU', bed: 'ICU-03', diet: 'NG Tube Feeding', mealType: 'Lunch', allergies: 'None', status: 'Consumed', timeOrdered: '11:00', timeServed: '11:30' },
  { id: 'MO-005', patientName: 'Yaw Boateng', ward: 'Medical Ward B', bed: 'B-20', diet: 'Renal Diet', mealType: 'Breakfast', allergies: 'None', status: 'Refused', timeOrdered: '07:00' },
];

const STATUS_COLORS: Record<string, string> = { Ordered: 'bg-blue-100 text-blue-800', Preparing: 'bg-yellow-100 text-yellow-800', Served: 'bg-green-100 text-green-800', Consumed: 'bg-emerald-100 text-emerald-800', Refused: 'bg-red-100 text-red-800' };

export default function PatientMealTracking() {
  const [orders] = useState<MealOrder[]>(ORDERS);
  const [mealFilter, setMealFilter] = useState('');

  const filtered = orders.filter((o) => !mealFilter || o.mealType === mealFilter);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Patient Meal Tracking</h1><p className="text-gray-500">Inpatient diet management, meal ordering, and consumption tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{orders.length}</div><div className="text-xs text-slate-500">Total Orders</div></div>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => <div key={m} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{orders.filter((o) => o.mealType === m).length}</div><div className="text-xs text-slate-500">{m}</div></div>)}
      </div>
      <div className="flex gap-2">
        {['', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((f) => <button key={f} onClick={() => setMealFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${mealFilter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f || 'All'}</button>)}
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Patient</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Ward / Bed</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Diet</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Meal</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Allergies</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs font-mono text-slate-500">{o.id}</td>
                <td className="px-4 py-2 text-sm font-medium">{o.patientName}</td>
                <td className="px-4 py-2 text-sm text-slate-600">{o.ward} / {o.bed}</td>
                <td className="px-4 py-2 text-xs">{o.diet}</td>
                <td className="px-4 py-2 text-xs">{o.mealType}</td>
                <td className="px-4 py-2 text-xs">{o.allergies === 'None' ? <span className="text-slate-400">None</span> : <span className="text-red-600 font-medium">⚠ {o.allergies}</span>}</td>
                <td className="px-4 py-2"><Badge className={STATUS_COLORS[o.status]}>{o.status}</Badge></td>
                <td className="px-4 py-2"><div className="flex gap-1">
                  {o.status === 'Ordered' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded">Preparing</button>}
                  {o.status === 'Preparing' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">Served</button>}
                  {o.status === 'Served' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">Consumed</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
