import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface MenuItem {
  id: string; name: string; category: string; price: number;
  available: boolean; calories: number;
}

interface DailySales {
  item: string; quantity: number; revenue: number;
}

const MENU: MenuItem[] = [
  { id: 'MN-001', name: 'Jollof Rice with Chicken', category: 'Main', price: 25, available: true, calories: 520 },
  { id: 'MN-002', name: 'Banku with Tilapia', category: 'Main', price: 30, available: true, calories: 480 },
  { id: 'MN-003', name: 'Kelewele with Groundnuts', category: 'Snack', price: 10, available: true, calories: 350 },
  { id: 'MN-004', name: 'Waakye with Gari', category: 'Main', price: 20, available: true, calories: 450 },
  { id: 'MN-005', name: 'Fried Rice with Fish', category: 'Main', price: 28, available: false, calories: 510 },
  { id: 'MN-006', name: 'Spring Rolls (6 pcs)', category: 'Snack', price: 15, available: true, calories: 280 },
  { id: 'MN-007', name: 'Fresh Fruit Salad', category: 'Dessert', price: 8, available: true, calories: 120 },
  { id: 'MN-008', name: 'Sobolo', category: 'Drink', price: 5, available: true, calories: 80 },
  { id: 'MN-009', name: 'Orange Juice', category: 'Drink', price: 8, available: true, calories: 110 },
  { id: 'MN-010', name: 'Coffee / Tea', category: 'Drink', price: 5, available: true, calories: 45 },
];

const DAILY_SALES: DailySales[] = [
  { item: 'Jollof Rice with Chicken', quantity: 45, revenue: 1125 },
  { item: 'Waakye with Gari', quantity: 38, revenue: 760 },
  { item: 'Kelewele with Groundnuts', quantity: 25, revenue: 250 },
  { item: 'Banku with Tilapia', quantity: 20, revenue: 600 },
  { item: 'Sobolo', quantity: 60, revenue: 300 },
];

const CATEGORY_COLORS: Record<string, string> = { Main: 'bg-blue-100 text-blue-800', Snack: 'bg-yellow-100 text-yellow-800', Dessert: 'bg-pink-100 text-pink-800', Drink: 'bg-green-100 text-green-800' };

export default function CafeteriaManagement() {
  const [tab, setTab] = useState<'menu' | 'sales' | 'stats'>('menu');
  const totalRevenue = DAILY_SALES.reduce((s, d) => s + d.revenue, 0);
  const totalMeals = DAILY_SALES.reduce((s, d) => s + d.quantity, 0);

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
          title="Add New Staff"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "Staff full name", "required": true}, {"name": "role", "label": "Role", "type": "select", "options": ["Doctor", "Nurse", "Pharmacist", "Lab Tech", "Admin", "Other"]}, {"name": "department", "label": "Department", "type": "select", "options": ["Emergency", "Surgery", "Medicine", "Paediatrics", "Obstetrics", "Pharmacy", "Laboratory", "Administration"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "email", "label": "Email", "type": "email", "placeholder": "staff@hospital.com"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Cafeteria Management</h1><p className="text-gray-500">Staff and visitor food services, menu management, POS, and daily sales</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Menu Items', value: MENU.length, color: 'text-blue-600' }, { label: 'Today\'s Revenue', value: `GH₵ ${totalRevenue}`, color: 'text-green-600' }, { label: 'Meals Served', value: totalMeals, color: 'text-purple-600' }, { label: 'Available', value: MENU.filter(m => m.available).length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['menu', 'sales', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'menu' ? 'Menu' : t === 'sales' ? 'Daily Sales' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENU.map(m => (
            <div key={m.id} className={`bg-white rounded-lg border p-4 ${!m.available ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-2"><span className="font-semibold">{m.name}</span><Badge className={CATEGORY_COLORS[m.category]}>{m.category}</Badge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-lg font-bold text-green-600">GH₵ {m.price}</span><span className="text-gray-500">{m.calories} cal</span></div>
              <div className="mt-2"><Badge className={m.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{m.available ? 'Available' : 'Sold Out'}</Badge></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sales' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold">Today's Sales — {new Date().toLocaleDateString()}</h3></div>
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Item</th><th className="p-3">Quantity</th><th className="p-3">Revenue</th></tr></thead>
            <tbody>{DAILY_SALES.map((d, i) => (
              <tr key={i} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{d.item}</td><td className="p-3 text-center font-bold">{d.quantity}</td><td className="p-3 text-green-600 font-bold">GH₵ {d.revenue}</td></tr>
            ))}</tbody>
            <tfoot><tr className="bg-gray-50 font-bold"><td className="p-3">Total</td><td className="p-3 text-center">{totalMeals}</td><td className="p-3 text-green-600">GH₵ {totalRevenue}</td></tr></tfoot>
          </table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">By Category</h3>{Object.keys(CATEGORY_COLORS).map(c => <div key={c} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={CATEGORY_COLORS[c]}>{c}</Badge><span className="font-bold">{MENU.filter(m => m.category === c).length} items</span></div>)}</div>
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">Top Sellers</h3>{DAILY_SALES.sort((a, b) => b.quantity - a.quantity).slice(0, 5).map((d, i) => <div key={i} className="flex items-center justify-between py-2 border-b last:border-0"><span className="text-sm">{d.item}</span><span className="font-bold">{d.quantity} sold</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
