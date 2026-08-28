import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type DispenseStatus = 'pending' | 'dispensing' | 'dispensed' | 'verified';

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  items: DispenseItem[];
  status: DispenseStatus;
  insuranceCovered: boolean;
  totalAmount: number;
  paidAmount: number;
}

interface DispenseItem {
  drugName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  frequency: string;
  duration: string;
  instructions: string;
  price: number;
  dispensed: boolean;
}

const PRESCRIPTIONS: Prescription[] = [
  {
    id: 'RX001', patientName: 'Kwame Mensah', patientId: 'P001', doctorName: 'Dr. Akua Osei',
    date: '2024-01-16', status: 'pending', insuranceCovered: true, totalAmount: 45.00, paidAmount: 0,
    items: [
      { drugName: 'Amoxicillin', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', quantity: 30, frequency: 'TID', duration: '10 days', instructions: 'Take with food', price: 15.00, dispensed: false },
      { drugName: 'Paracetamol', genericName: 'Acetaminophen', strength: '500mg', dosageForm: 'Tablet', quantity: 30, frequency: 'QID', duration: '7 days', instructions: 'Take as needed for pain', price: 10.00, dispensed: false },
      { drugName: 'Vitamin C', genericName: 'Ascorbic Acid', strength: '100mg', dosageForm: 'Tablet', quantity: 30, frequency: 'OD', duration: '30 days', instructions: 'Take in the morning', price: 20.00, dispensed: false }
    ]
  },
  {
    id: 'RX002', patientName: 'Ama Darko', patientId: 'P002', doctorName: 'Dr. Kofi Asante',
    date: '2024-01-16', status: 'dispensing', insuranceCovered: false, totalAmount: 120.00, paidAmount: 0,
    items: [
      { drugName: 'Metformin', genericName: 'Metformin HCl', strength: '500mg', dosageForm: 'Tablet', quantity: 60, frequency: 'BID', duration: '30 days', instructions: 'Take with meals', price: 80.00, dispensed: true },
      { drugName: 'Gliclazide', genericName: 'Gliclazide', strength: '80mg', dosageForm: 'Tablet', quantity: 30, frequency: 'OD', duration: '30 days', instructions: 'Take before breakfast', price: 40.00, dispensed: false }
    ]
  },
  {
    id: 'RX003', patientName: 'Yaw Boateng', patientId: 'P003', doctorName: 'Dr. Akua Osei',
    date: '2024-01-15', status: 'dispensed', insuranceCovered: true, totalAmount: 65.00, paidAmount: 0,
    items: [
      { drugName: 'Ciprofloxacin', genericName: 'Ciprofloxacin', strength: '500mg', dosageForm: 'Tablet', quantity: 14, frequency: 'BID', duration: '7 days', instructions: 'Take on empty stomach', price: 35.00, dispensed: true },
      { drugName: 'ORS', genericName: 'Oral Rehydration Salts', strength: '1L', dosageForm: 'Powder', quantity: 10, frequency: 'PRN', duration: 'As needed', instructions: 'Mix with clean water', price: 30.00, dispensed: true }
    ]
  },
  {
    id: 'RX004', patientName: 'Efua Ansah', patientId: 'P004', doctorName: 'Dr. Nana Agyeman',
    date: '2024-01-16', status: 'pending', insuranceCovered: true, totalAmount: 25.00, paidAmount: 0,
    items: [
      { drugName: 'Artemether-Lumefantrine', genericName: 'ACT', strength: '20/120mg', dosageForm: 'Tablet', quantity: 24, frequency: 'BID', duration: '3 days', instructions: 'Take with fatty food', price: 25.00, dispensed: false }
    ]
  },
  {
    id: 'RX005', patientName: 'Abena Pokua', patientId: 'P005', doctorName: 'Dr. Kofi Asante',
    date: '2024-01-14', status: 'verified', insuranceCovered: true, totalAmount: 180.00, paidAmount: 0,
    items: [
      { drugName: 'Tenofovir', genericName: 'Tenofovir Disoproxil', strength: '300mg', dosageForm: 'Tablet', quantity: 30, frequency: 'OD', duration: '30 days', instructions: 'Take at the same time daily', price: 120.00, dispensed: true },
      { drugName: 'Lamivudine', genericName: 'Lamivudine', strength: '150mg', dosageForm: 'Tablet', quantity: 60, frequency: 'BID', duration: '30 days', instructions: 'Take with or without food', price: 60.00, dispensed: true }
    ]
  }
];

const STATUS_CONFIG: Record<DispenseStatus, { color: string; label: string; bg: string; icon: string }> = {
  pending: { color: 'text-amber-600', label: 'Pending', bg: 'bg-amber-50 border-amber-200', icon: '⏳' },
  dispensing: { color: 'text-blue-600', label: 'Dispensing', bg: 'bg-blue-50 border-blue-200', icon: '💊' },
  dispensed: { color: 'text-emerald-600', label: 'Dispensed', bg: 'bg-emerald-50 border-emerald-200', icon: '✅' },
  verified: { color: 'text-purple-600', label: 'Verified', bg: 'bg-purple-50 border-purple-200', icon: '🔒' }
};

export default function PharmacyDispensing() {
  const [activeTab, setActiveTab] = useState<'queue' | 'dispense' | 'history' | 'analytics'>('queue');
  const [verificationPin, setVerificationPin] = useState('');

  const stats = {
    pending: PRESCRIPTIONS.filter(r => r.status === 'pending').length,
    dispensing: PRESCRIPTIONS.filter(r => r.status === 'dispensing').length,
    dispensed: PRESCRIPTIONS.filter(r => r.status === 'dispensed').length,
    verified: PRESCRIPTIONS.filter(r => r.status === 'verified').length,
    totalRevenue: PRESCRIPTIONS.reduce((sum, r) => sum + r.totalAmount, 0)
  };

  const handleDispenseItem = (rxId: string, _itemIndex: number) => {
    alert(`Item dispensed for ${rxId}`);
  };

  const handleVerifyDispensing = (rxId: string) => {
    if (!verificationPin) return;
    alert(`Dispensing verified for ${rxId} with PIN`);
    setVerificationPin('');
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
          title="Add New PharmacyDispensing"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Dispensing</h1>
          <p className="text-gray-500">Prescription processing and medication dispensing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Prescription</button>
          <button onClick={() => {}} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Dispense Queue</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'bg-amber-500', icon: '⏳' },
          { label: 'Dispensing', value: stats.dispensing, color: 'bg-blue-500', icon: '💊' },
          { label: 'Dispensed', value: stats.dispensed, color: 'bg-emerald-500', icon: '✅' },
          { label: 'Verified', value: stats.verified, color: 'bg-purple-500', icon: '🔒' },
          { label: 'Revenue', value: `GH₵ ${stats.totalRevenue.toFixed(2)}`, color: 'bg-green-600', icon: '💰' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-sm opacity-90">{s.label}</span>
            </div>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['queue', 'dispense', 'history', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'queue' ? 'Dispensing Queue' : tab === 'dispense' ? 'Dispense' : tab === 'history' ? 'History' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {PRESCRIPTIONS.map(prescription => {
            const status = STATUS_CONFIG[prescription.status];
            return (
              <div key={prescription.id} className={`border ${status.bg} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{status.icon}</span>
                      <span className="font-bold">{prescription.id}</span>
                      <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                      {prescription.insuranceCovered && <Badge className="text-blue-600 bg-blue-50 border border-blue-200">NHIS</Badge>}
                    </div>
                    <p className="text-gray-700 mt-1">{prescription.patientName} — {prescription.items.length} item(s)</p>
                    <p className="text-sm text-gray-500">Doctor: {prescription.doctorName} | Date: {prescription.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">GH₵ {prescription.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{prescription.items.length} medications</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispense Tab (Detail View) */}
      {activeTab === 'dispense' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Select Prescription to Dispense</h3>
          {PRESCRIPTIONS.filter(r => r.status === 'pending' || r.status === 'dispensing').map(prescription => (
            <div key={prescription.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold">{prescription.id}</span> — {prescription.patientName}
                  <p className="text-sm text-gray-500">{prescription.doctorName} | {prescription.date}</p>
                </div>
                <div className="flex gap-2">
                  {prescription.status === 'pending' && (
                    <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Start Dispensing</button>
                  )}
                  {prescription.status === 'dispensing' && (
                    <button onClick={() => {}} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg">Mark Complete</button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {prescription.items.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${item.dispensed ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.drugName} {item.strength}</p>
                        <p className="text-sm text-gray-500">{item.dosageForm} | Qty: {item.quantity} | {item.frequency} × {item.duration}</p>
                        <p className="text-xs text-gray-400 italic">{item.instructions}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">GH₵ {item.price.toFixed(2)}</span>
                        {item.dispensed ? (
                          <Badge className="text-emerald-600 bg-emerald-50">✅ Dispensed</Badge>
                        ) : (
                          <button onClick={() => handleDispenseItem(prescription.id, idx)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Dispense</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-gray-600">Total: </span>
                  <span className="font-bold text-lg">GH₵ {prescription.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <input type="password" value={verificationPin} onChange={e => setVerificationPin(e.target.value)}
                    className="border rounded-lg px-3 py-1 text-sm w-32" placeholder="PIN" />
                  <button onClick={() => handleVerifyDispensing(prescription.id)}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg">Verify & Sign</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Dispensing History</h3>
          {PRESCRIPTIONS.filter(r => r.status === 'dispensed' || r.status === 'verified').map(prescription => (
            <div key={prescription.id} className="border rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">{prescription.id}</span> — {prescription.patientName}
                  <p className="text-sm text-gray-500">Dispensed on {prescription.date}</p>
                </div>
                <Badge className="text-emerald-600 bg-emerald-50">✅ Completed</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Dispensing Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Total Prescriptions</span><span className="font-bold">{PRESCRIPTIONS.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Total Items Dispensed</span><span className="font-bold">{PRESCRIPTIONS.reduce((sum, r) => sum + r.items.filter(i => i.dispensed).length, 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Insurance Covered</span><span className="font-bold text-blue-600">{PRESCRIPTIONS.filter(r => r.insuranceCovered).length}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Cash Payment</span><span className="font-bold text-green-600">{PRESCRIPTIONS.filter(r => !r.insuranceCovered).length}</span></div>
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Top Dispensed Drugs</h4>
            <div className="space-y-3">
              {Object.entries(PRESCRIPTIONS.flatMap(r => r.items).reduce<Record<string, number>>((acc, item) => {
                acc[item.drugName] = (acc[item.drugName] || 0) + item.quantity;
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([drug, qty]) => (
                <div key={drug} className="flex items-center justify-between">
                  <span className="text-gray-600">{drug}</span>
                  <Badge className="bg-blue-50 text-blue-600">{qty} units</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
