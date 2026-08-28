import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface MealOrder {
  id: string; patientName: string; ward: string; bed: string;
  mealType: string; diet: string; allergies: string[];
  status: 'Pending' | 'Preparing' | 'Delivered' | 'Consumed' | 'Returned';
  orderedAt: string; deliveredAt?: string;
}

const MEAL_ORDERS: MealOrder[] = [
  { id: 'MO-001', patientName: 'Kwame Asante', ward: 'Cardiology', bed: 'C-12', mealType: 'Breakfast', diet: 'Cardiac Diet (Low Salt)', allergies: ['Shellfish'], status: 'Delivered', orderedAt: '06:30', deliveredAt: '07:05' },
  { id: 'MO-002', patientName: 'Akua Mensah', ward: 'Maternity', bed: 'M-05', mealType: 'Breakfast', diet: 'Normal Diet', allergies: [], status: 'Consumed', orderedAt: '06:30', deliveredAt: '07:10' },
  { id: 'MO-003', patientName: 'Kofi Appiah', ward: 'Diabetes', bed: 'D-08', mealType: 'Breakfast', diet: 'Diabetic Diet (1800 kcal)', allergies: ['Nuts'], status: 'Preparing', orderedAt: '06:45' },
  { id: 'MO-004', patientName: 'Ama Osei', ward: 'Nephrology', bed: 'N-03', mealType: 'Lunch', diet: 'Renal Diet (Low K+, Low Na+)', allergies: [], status: 'Pending', orderedAt: '10:30' },
  { id: 'MO-005', patientName: 'Yaw Boateng', ward: 'Oncology', bed: 'O-10', mealType: 'Lunch', diet: 'High Protein Soft Diet', allergies: ['Lactose'], status: 'Pending', orderedAt: '10:30' },
  { id: 'MO-006', patientName: 'Efua Nyarko', ward: 'ICU', bed: 'ICU-02', mealType: 'Lunch', diet: 'NG Tube Feeding (Nutrison)', allergies: [], status: 'Preparing', orderedAt: '11:00' },
  { id: 'MO-007', patientName: 'Nana Agyeman', ward: 'Surgery', bed: 'S-15', mealType: 'Dinner', diet: 'Post-Op Soft Diet', allergies: ['Eggs'], status: 'Pending', orderedAt: '14:00' },
  { id: 'MO-008', patientName: 'Adwoa Serwaa', ward: 'Paediatrics', bed: 'P-07', mealType: 'Snack', diet: 'Normal Paediatric Diet', allergies: [], status: 'Delivered', orderedAt: '10:00', deliveredAt: '10:25' },
];

const DIET_TYPES = [
  { name: 'Normal Diet', count: 45, icon: '🍽️' },
  { name: 'Cardiac Diet', count: 12, icon: '❤️' },
  { name: 'Diabetic Diet', count: 18, icon: '🩸' },
  { name: 'Renal Diet', count: 8, icon: '🫘' },
  { name: 'Soft Diet', count: 15, icon: '🥣' },
  { name: 'NG Tube Feeding', count: 5, icon: '🔬' },
  { name: 'High Protein', count: 10, icon: '🥩' },
  { name: 'Allergy-Modified', count: 7, icon: '⚠️' },
];

const STATUS_COLORS: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', Preparing: 'bg-blue-100 text-blue-800', Delivered: 'bg-green-100 text-green-800', Consumed: 'bg-gray-100 text-gray-800', Returned: 'bg-red-100 text-red-800' };

export default function NutritionKitchen() {
  const [tab, setTab] = useState<'orders' | 'diets' | 'stats'>('orders');

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
          title="Add New Kitchen Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Nutrition Kitchen & Dietary Services</h1><p className="text-gray-500">Meal planning, diet management, nutritional support, and hospital kitchen operations</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Meals Today', value: MEAL_ORDERS.length, color: 'text-blue-600' }, { label: 'Pending', value: MEAL_ORDERS.filter(m => m.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'Delivered', value: MEAL_ORDERS.filter(m => m.status === 'Delivered' || m.status === 'Consumed').length, color: 'text-green-600' }, { label: 'Special Diets', value: DIET_TYPES.filter(d => d.name !== 'Normal Diet').length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['orders', 'diets', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'orders' ? 'Meal Orders' : t === 'diets' ? 'Diet Types' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Patient</th><th className="p-3">Ward/Bed</th><th className="p-3">Meal</th><th className="p-3">Diet</th><th className="p-3">Allergies</th><th className="p-3">Status</th><th className="p-3">Time</th></tr></thead>
            <tbody>{MEAL_ORDERS.map(m => (
              <tr key={m.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{m.id}</td><td className="p-3 font-medium">{m.patientName}</td><td className="p-3 text-xs">{m.ward}/{m.bed}</td><td className="p-3">{m.mealType}</td><td className="p-3 text-xs">{m.diet}</td><td className="p-3">{m.allergies.length > 0 ? m.allergies.map(a => <Badge key={a} className="bg-red-100 text-red-800 mr-1">{a}</Badge>) : <span className="text-gray-400">None</span>}</td><td className="p-3"><Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge></td><td className="p-3 text-xs">{m.orderedAt}{m.deliveredAt ? ` → ${m.deliveredAt}` : ''}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'diets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DIET_TYPES.map(d => (
            <div key={d.name} className="bg-white rounded-lg border p-4 text-center">
              <div className="text-3xl mb-2">{d.icon}</div>
              <h3 className="font-semibold text-sm">{d.name}</h3>
              <div className="text-2xl font-bold text-blue-600 mt-1">{d.count}</div>
              <div className="text-xs text-gray-500">patients</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Order Status</h3>
            {['Pending', 'Preparing', 'Delivered', 'Consumed', 'Returned'].map(s => (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0">
                <Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{MEAL_ORDERS.filter(m => m.status === s).length}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Orders by Meal Type</h3>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => (
              <div key={meal} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{meal}</span><span className="font-bold">{MEAL_ORDERS.filter(m => m.mealType === meal).length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
