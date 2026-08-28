import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface BloodUnit {
  id: string; bloodGroup: string; component: string; units: number;
  expiry: string; status: 'Available' | 'Reserved' | 'Expired' | 'Issued';
  donor: string; collectionDate: string;
}

interface CompatibilityTest {
  id: string; patientName: string; bloodGroup: string; crossmatch: string;
  antibody: string; result: string;
}

const INVENTORY: BloodUnit[] = [
  { id: 'BB-001', bloodGroup: 'O+', component: 'Packed RBC', units: 25, expiry: '2026-09-20', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-20' },
  { id: 'BB-002', bloodGroup: 'A+', component: 'Packed RBC', units: 18, expiry: '2026-09-15', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-15' },
  { id: 'BB-003', bloodGroup: 'B+', component: 'Packed RBC', units: 12, expiry: '2026-09-10', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-10' },
  { id: 'BB-004', bloodGroup: 'AB+', component: 'Packed RBC', units: 5, expiry: '2026-09-05', status: 'Reserved', donor: 'Volunteer', collectionDate: '2026-08-05' },
  { id: 'BB-005', bloodGroup: 'O-', component: 'Packed RBC', units: 8, expiry: '2026-09-18', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-18' },
  { id: 'BB-006', bloodGroup: 'O+', component: 'Fresh Frozen Plasma', units: 15, expiry: '2026-09-20', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-20' },
  { id: 'BB-007', bloodGroup: 'O+', component: 'Platelets', units: 3, expiry: '2026-08-27', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-24' },
  { id: 'BB-008', bloodGroup: 'A+', component: 'Cryoprecipitate', units: 10, expiry: '2026-10-01', status: 'Available', donor: 'Volunteer', collectionDate: '2026-08-01' },
];

const COMPATIBILITY: CompatibilityTest[] = [
  { id: 'CT-001', patientName: 'Kwame Asante', bloodGroup: 'A+', crossmatch: 'Compatible', antibody: 'Negative', result: 'Approved' },
  { id: 'CT-002', patientName: 'Akua Mensah', bloodGroup: 'O+', crossmatch: 'Compatible', antibody: 'Anti-D', result: 'Approved — D-negative units only' },
  { id: 'CT-003', patientName: 'Nana Osei', bloodGroup: 'B+', crossmatch: 'Incompatible', antibody: 'Anti-A', result: 'Rejected — Crossmatch incompatible' },
];

const STATUS_COLORS: Record<string, string> = { Available: 'bg-green-100 text-green-800', Reserved: 'bg-yellow-100 text-yellow-800', Expired: 'bg-red-100 text-red-800', Issued: 'bg-blue-100 text-blue-800' };

export default function BloodBankInventory() {
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
          title="Add New Blood Inventory"
          fields={[{"name":"bloodType","label":"Blood Type","type":"select","options":["A+","A-","B+","B-","AB+","AB-","O+","O-"],"required":true},{"name":"component","label":"Component","type":"select","options":["Whole Blood","Packed RBC","Platelets","FFP","Cryoprecipitate"],"required":true},{"name":"units","label":"Units","type":"number"},{"name":"location","label":"Storage Location","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Blood Bank Inventory</h1><p className="text-gray-500">Blood component tracking, compatibility testing, crossmatch, and transfusion management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Units', value: INVENTORY.reduce((s, i) => s + i.units, 0), color: 'text-red-600' }, { label: 'Available', value: INVENTORY.filter(i => i.status === 'Available').length, color: 'text-green-600' }, { label: 'Reserved', value: INVENTORY.filter(i => i.status === 'Reserved').length, color: 'text-yellow-600' }, { label: 'Blood Groups', value: [...new Set(INVENTORY.map(i => i.bloodGroup))].length, color: 'text-blue-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-3">Inventory</h3>
          <div className="space-y-2">
            {INVENTORY.map(i => (
              <div key={i.id} className="flex items-center justify-between py-2 border-b last:border-0"><div className="flex items-center gap-2"><span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold">{i.bloodGroup}</span><span className="text-sm">{i.component}</span></div><div className="flex items-center gap-2"><span className="font-bold">{i.units} units</span><Badge className={STATUS_COLORS[i.status]}>{i.status}</Badge><span className="text-xs text-gray-500">Exp: {i.expiry}</span></div></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-3">Compatibility Tests</h3>
          <div className="space-y-3">
            {COMPATIBILITY.map(c => (
              <div key={c.id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-1"><span className="font-bold text-sm">{c.patientName}</span><Badge className={c.result.startsWith('Approved') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{c.crossmatch}</Badge></div>
                <div className="text-xs text-gray-500">Blood Group: {c.bloodGroup} | Antibody: {c.antibody}</div>
                <div className="text-sm mt-1">{c.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
