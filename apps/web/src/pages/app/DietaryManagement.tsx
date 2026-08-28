import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface MealOrder {
  id: string;
  patientName: string;
  ward: string;
  bed: string;
  dietType: 'Normal' | 'Diabetic' | 'Renal' | 'Cardiac' | 'Soft' | 'Liquid' | 'NPO' | 'Paediatric' | 'Vegetarian' | 'Allergy';
  meal: string;
  allergies: string[];
  orderTime: string;
  deliveryTime: string;
  status: 'Ordered' | 'Preparing' | 'Delivered' | 'Returned';
  deliveredBy: string;
}

const MEAL_ORDERS: MealOrder[] = [
  { id: 'MO-001', patientName: 'Kwame Mensah', ward: 'Medical', bed: 'Bed 5', dietType: 'Diabetic', meal: 'Grilled fish, steamed vegetables, brown rice, fruit salad', allergies: ['Nuts'], orderTime: '07:00', deliveryTime: '08:30', status: 'Delivered', deliveredBy: 'Kitchen Staff A' },
  { id: 'MO-002', patientName: 'Ama Osei', ward: 'Maternity', bed: 'Bed 3', dietType: 'Normal', meal: 'Banku with okra soup, fruit juice, sliced oranges', allergies: [], orderTime: '07:30', deliveryTime: '', status: 'Preparing', deliveredBy: '' },
  { id: 'MO-003', patientName: 'Kofi Asante', ward: 'ICU', bed: 'Bed 2', dietType: 'Liquid', meal: 'Tube feed - Jevity 1.5 (500mL)', allergies: ['Lactose'], orderTime: '06:00', deliveryTime: '06:30', status: 'Delivered', deliveredBy: 'Kitchen Staff B' },
  { id: 'MO-004', patientName: 'Akua Boateng', ward: 'Renal', bed: 'Bed 1', dietType: 'Renal', meal: 'Low-potassium meal: White rice, grilled chicken (no salt), steamed cabbage', allergies: [], orderTime: '07:15', deliveryTime: '', status: 'Ordered', deliveredBy: '' },
  { id: 'MO-005', patientName: 'Yaw Darko', ward: 'Cardiac', bed: 'Bed 4', dietType: 'Cardiac', meal: 'Low-fat meal: Steamed fish, mixed vegetables, whole wheat bread, apple', allergies: ['Shellfish'], orderTime: '06:45', deliveryTime: '08:15', status: 'Delivered', deliveredBy: 'Kitchen Staff A' },
  { id: 'MO-006', patientName: 'Esi Kumah', ward: 'Paediatrics', bed: 'Bed 8', dietType: 'Paediatric', meal: 'Chicken porridge, banana puree, warm milk', allergies: ['Eggs'], orderTime: '08:00', deliveryTime: '', status: 'Preparing', deliveredBy: '' },
];

const MENU_TEMPLATES = [
  { type: 'Normal', meals: ['Banku & Okra Soup', 'Jollof Rice & Chicken', 'Fufu & Light Soup', 'Rice & Stew'] },
  { type: 'Diabetic', meals: ['Grilled Fish & Vegetables', 'Brown Rice & Stewed Chicken', 'Whole Wheat Meal & Beans'] },
  { type: 'Renal', meals: ['Low-Potassium Rice & Grilled Chicken', 'White Bread & Egg', 'Low-Sodium Vegetable Soup'] },
  { type: 'Cardiac', meals: ['Steamed Fish & Vegetables', 'Low-Fat Chicken Soup', 'Whole Wheat Pasta & Tomato Sauce'] },
  { type: 'Soft', meals: ['Porridge & Fruit Puree', 'Mashed Vegetables & Chicken', 'Soft Bread & Soup'] },
  { type: 'Liquid', meals: ['Tube Feed - Jevity', 'Clear Broth', 'Fruit Juice & Gelatin'] },
];

const STATUS_COLORS: Record<string, string> = { Ordered: 'bg-gray-100 text-gray-800', Preparing: 'bg-blue-100 text-blue-800', Delivered: 'bg-green-100 text-green-800', Returned: 'bg-red-100 text-red-800' };

export default function DietaryManagement() {
  const [tab, setTab] = useState<'overview' | 'orders' | 'menu' | 'nutrition'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍽️ Dietary Management</h1>
          <p className="text-gray-600 mt-1">Meal planning · Patient diets · Kitchen operations · Nutrition tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: MEAL_ORDERS.length, icon: '🍽️', color: 'text-blue-600' },
          { label: 'Delivered', value: MEAL_ORDERS.filter(m => m.status === 'Delivered').length, icon: '✅', color: 'text-green-600' },
          { label: 'Preparing', value: MEAL_ORDERS.filter(m => m.status === 'Preparing').length, icon: '👨‍🍳', color: 'text-orange-600' },
          { label: 'Allergy Alerts', value: MEAL_ORDERS.filter(m => m.allergies.length > 0).length, icon: '⚠️', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'orders', 'menu', 'nutrition'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'orders' ? '🍽️ Orders' : t === 'menu' ? '📋 Menu' : '🥗 Nutrition'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Diet Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(MEAL_ORDERS.reduce<Record<string, number>>((a, m) => { a[m.dietType] = (a[m.dietType] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const pct = MEAL_ORDERS.length > 0 ? (count / MEAL_ORDERS.length * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1"><span>{type}</span><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">⚠️ Allergy Alerts</h3>
            <div className="space-y-2">
              {MEAL_ORDERS.filter(m => m.allergies.length > 0).map(m => (
                <div key={m.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-medium text-red-800">{m.patientName} — {m.ward} {m.bed}</div>
                  <div className="text-sm text-red-600 mt-1">Allergies: {m.allergies.map(a => <span key={a} className="px-2 py-0.5 bg-red-100 rounded text-xs mr-1">⚠️ {a}</span>)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Ward/Bed</th>
                <th className="px-4 py-3 text-left">Diet</th>
                <th className="px-4 py-3 text-left">Meal</th>
                <th className="px-4 py-3 text-left">Allergies</th>
                <th className="px-4 py-3 text-left">Order Time</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {MEAL_ORDERS.map(m => (
                <tr key={m.id} className={`border-b hover:bg-gray-50 ${m.allergies.length > 0 ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{m.patientName}</td>
                  <td className="px-4 py-3">{m.ward} / {m.bed}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{m.dietType}</Badge></td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{m.meal}</td>
                  <td className="px-4 py-3">{m.allergies.length > 0 ? m.allergies.map(a => <span key={a} className="text-red-600 text-xs">⚠️ {a} </span>) : '—'}</td>
                  <td className="px-4 py-3">{m.orderTime}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENU_TEMPLATES.map(m => (
            <Card key={m.type} className="p-5">
              <h4 className="font-bold text-gray-900 mb-3">{m.type} Diet</h4>
              <div className="space-y-2">
                {m.meals.map((meal, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded text-sm">🍽️ {meal}</div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Patient Nutrition Screening</h3>
            <div className="space-y-2">
              {[
                { patient: 'Kwame Mensah', score: 24, risk: 'Low Risk', ward: 'Medical' },
                { patient: 'Kofi Asante', score: 14, risk: 'High Risk', ward: 'ICU' },
                { patient: 'Akua Boateng', score: 18, risk: 'Moderate Risk', ward: 'Renal' },
                { patient: 'Yaw Darko', score: 22, risk: 'Low Risk', ward: 'Cardiac' },
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div><div className="font-medium">{p.patient}</div><div className="text-xs text-gray-500">{p.ward}</div></div>
                  <div className="text-right"><div className="font-bold">MUST Score: {p.score}</div><Badge className={p.risk.includes('High') ? 'bg-red-100 text-red-800' : p.risk.includes('Moderate') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{p.risk}</Badge></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Daily Nutrition Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">85%</div><div className="text-sm text-green-800">Meals Delivered On Time</div></div>
                <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">{MEAL_ORDERS.length}</div><div className="text-sm text-blue-800">Total Meals Today</div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-600">3</div><div className="text-sm text-yellow-800">Diet Consultations</div></div>
                <div className="p-4 bg-red-50 rounded-lg text-center"><div className="text-2xl font-bold text-red-600">{MEAL_ORDERS.filter(m => m.allergies.length > 0).length}</div><div className="text-sm text-red-800">Allergy Alerts</div></div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
