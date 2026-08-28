import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off';
type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'insurance' | 'nhis';

interface Invoice {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  services: { description: string; amount: number }[];
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  insuranceClaim?: string;
  dueDate: string;
}

interface RevenueReport {
  period: string;
  totalRevenue: number;
  collected: number;
  outstanding: number;
  insurancePending: number;
  writeOffs: number;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
  partial: { label: 'Partial', color: 'text-blue-600', bg: 'bg-blue-50' },
  paid: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  overdue: { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' },
  written_off: { label: 'Written Off', color: 'text-gray-600', bg: 'bg-gray-50' }
};

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
  cash: { label: 'Cash', icon: '💵', color: 'text-emerald-600' },
  card: { label: 'Card', icon: '💳', color: 'text-blue-600' },
  mobile_money: { label: 'Mobile Money', icon: '📱', color: 'text-purple-600' },
  insurance: { label: 'Insurance', icon: '🏥', color: 'text-indigo-600' },
  nhis: { label: 'NHIS', icon: '🇬🇭', color: 'text-amber-600' }
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV001', patientName: 'Kwame Mensah', patientId: 'P001', date: '2024-01-16',
    services: [{ description: 'Consultation', amount: 50 }, { description: 'Lab Tests', amount: 120 }, { description: 'Medication', amount: 45 }],
    totalAmount: 215, paidAmount: 215, status: 'paid', paymentMethod: 'insurance',
    insuranceClaim: 'INS-001', dueDate: '2024-02-16'
  },
  {
    id: 'INV002', patientName: 'Ama Darko', patientId: 'P002', date: '2024-01-16',
    services: [{ description: 'Consultation', amount: 50 }, { description: 'Diabetes Medication', amount: 80 }],
    totalAmount: 130, paidAmount: 50, status: 'partial', paymentMethod: 'cash',
    dueDate: '2024-02-16'
  },
  {
    id: 'INV003', patientName: 'Yaw Boateng', patientId: 'P003', date: '2024-01-15',
    services: [{ description: 'Emergency Consultation', amount: 100 }, { description: 'IV Fluids', amount: 60 }, { description: 'Medication', amount: 35 }],
    totalAmount: 195, paidAmount: 195, status: 'paid', paymentMethod: 'mobile_money',
    dueDate: '2024-01-30'
  },
  {
    id: 'INV004', patientName: 'Efua Ansah', patientId: 'P004', date: '2024-01-14',
    services: [{ description: 'Paediatric Consultation', amount: 40 }, { description: 'Vaccination', amount: 25 }],
    totalAmount: 65, paidAmount: 0, status: 'overdue', paymentMethod: 'cash',
    dueDate: '2024-01-28'
  },
  {
    id: 'INV005', patientName: 'Nana Kwame', patientId: 'P014', date: '2024-01-16',
    services: [{ description: 'Orthopaedic Consultation', amount: 80 }, { description: 'X-Ray', amount: 150 }, { description: 'Plaster', amount: 40 }],
    totalAmount: 270, paidAmount: 100, status: 'partial', paymentMethod: 'nhis',
    insuranceClaim: 'NHIS-005', dueDate: '2024-02-16'
  },
  {
    id: 'INV006', patientName: 'Abena Boateng', patientId: 'P015', date: '2024-01-13',
    services: [{ description: 'Psychiatric Consultation', amount: 60 }, { description: 'Medication', amount: 30 }],
    totalAmount: 90, paidAmount: 90, status: 'paid', paymentMethod: 'card',
    dueDate: '2024-01-27'
  }
];

const REVENUE_REPORTS: RevenueReport[] = [
  { period: 'January 2024', totalRevenue: 45200, collected: 38500, outstanding: 4200, insurancePending: 2500, writeOffs: 0 },
  { period: 'December 2023', totalRevenue: 52300, collected: 49800, outstanding: 1500, insurancePending: 1000, writeOffs: 0 },
  { period: 'November 2023', totalRevenue: 48700, collected: 46200, outstanding: 1800, insurancePending: 700, writeOffs: 0 }
];

export default function RevenueCycle() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'revenue' | 'analytics'>('invoices');

  const stats = {
    totalRevenue: MOCK_INVOICES.reduce((sum, inv) => sum + inv.totalAmount, 0),
    collected: MOCK_INVOICES.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.paidAmount, 0),
    outstanding: MOCK_INVOICES.filter(inv => inv.status !== 'paid' && inv.status !== 'written_off').reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0),
    overdue: MOCK_INVOICES.filter(inv => inv.status === 'overdue').length
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
          title="Add New Revenue Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Cycle Management</h1>
          <p className="text-gray-500">Billing, payments, and financial tracking</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Invoice</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `GH₵ ${stats.totalRevenue.toLocaleString()}`, color: 'bg-blue-500' },
          { label: 'Collected', value: `GH₵ ${stats.collected.toLocaleString()}`, color: 'bg-emerald-500' },
          { label: 'Outstanding', value: `GH₵ ${stats.outstanding.toLocaleString()}`, color: 'bg-amber-500' },
          { label: 'Overdue', value: stats.overdue, color: 'bg-red-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-4 rounded-xl`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['invoices', 'revenue', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'invoices' ? 'Invoices' : tab === 'revenue' ? 'Revenue Reports' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {MOCK_INVOICES.map(invoice => {
            const status = STATUS_CONFIG[invoice.status];
            const method = PAYMENT_METHOD_CONFIG[invoice.paymentMethod];
            return (
              <div key={invoice.id} className={`border rounded-xl p-4 ${status.bg}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{invoice.id}</span>
                      <Badge className={`${status.color} bg-white border`}>{status.label}</Badge>
                      <Badge className={`${method.color} bg-white border`}>{method.icon} {method.label}</Badge>
                    </div>
                    <p className="text-gray-700 mt-1">{invoice.patientName}</p>
                    <div className="mt-2 space-y-1">
                      {invoice.services.map((svc, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-500">{svc.description}</span>
                          <span>GH₵ {svc.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">GH₵ {invoice.totalAmount.toFixed(2)}</p>
                    {invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount && (
                      <p className="text-sm text-amber-600">Paid: GH₵ {invoice.paidAmount.toFixed(2)}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Due: {invoice.dueDate}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revenue Reports Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-3">
          {REVENUE_REPORTS.map(report => (
            <div key={report.period} className="border rounded-xl p-4">
              <h4 className="font-bold">{report.period}</h4>
              <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                <div><span className="text-gray-500">Total:</span> <span className="font-bold">GH₵ {report.totalRevenue.toLocaleString()}</span></div>
                <div><span className="text-gray-500">Collected:</span> <span className="font-bold text-emerald-600">GH₵ {report.collected.toLocaleString()}</span></div>
                <div><span className="text-gray-500">Outstanding:</span> <span className="font-bold text-amber-600">GH₵ {report.outstanding.toLocaleString()}</span></div>
                <div><span className="text-gray-500">Insurance:</span> <span className="font-bold text-blue-600">GH₵ {report.insurancePending.toLocaleString()}</span></div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full mt-3">
                <div className="h-3 bg-emerald-500 rounded-full" style={{ width: `${(report.collected / report.totalRevenue) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{((report.collected / report.totalRevenue) * 100).toFixed(1)}% collection rate</p>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Payment Methods</h4>
            <div className="space-y-3">
              {Object.entries(PAYMENT_METHOD_CONFIG).map(([method, config]) => {
                const count = MOCK_INVOICES.filter(i => i.paymentMethod === method).length;
                return (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-gray-600">{config.icon} {config.label}</span>
                    <Badge className={`${config.color} bg-white border`}>{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Invoice Status</h4>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = MOCK_INVOICES.filter(i => i.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-600">{config.label}</span>
                    <Badge className={`${config.color} bg-white border`}>{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
