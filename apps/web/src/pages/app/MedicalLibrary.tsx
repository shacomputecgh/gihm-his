import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Book {
  id: string; title: string; author: string; category: string;
  edition: string; year: number; status: 'Available' | 'On Loan' | 'Reserved' | 'Reference Only';
  location: string; isbn: string;
}

interface Journal {
  id: string; title: string; publisher: string; frequency: string;
  impact: string; access: 'Open Access' | 'Subscription' | 'Free';
}

const BOOKS: Book[] = [
  { id: 'BK-001', title: 'Harrison\'s Principles of Internal Medicine', author: 'Kasper et al.', category: 'Internal Medicine', edition: '21st', year: 2022, status: 'Reference Only', location: 'Section A', isbn: '978-0071806152' },
  { id: 'BK-002', title: 'Robbins Pathologic Basis of Disease', author: 'Kumar et al.', category: 'Pathology', edition: '10th', year: 2020, status: 'Available', location: 'Section B', isbn: '978-0323611695' },
  { id: 'BK-003', title: 'WHO Essential Medicines List', author: 'WHO', category: 'Pharmacy', edition: '23rd', year: 2023, status: 'Available', location: 'Section C', isbn: '978-9240093393' },
  { id: 'BK-004', title: 'Oxford Handbook of Clinical Medicine', author: 'Murray et al.', category: 'Clinical', edition: '10th', year: 2023, status: 'On Loan', location: 'Section A', isbn: '978-0199689903' },
  { id: 'BK-005', title: 'Nelson Textbook of Paediatrics', author: 'Kliegman et al.', category: 'Paediatrics', edition: '22nd', year: 2024, status: 'Available', location: 'Section D', isbn: '978-0323881807' },
];

const JOURNALS: Journal[] = [
  { id: 'JN-001', title: 'The Lancet', publisher: 'Elsevier', frequency: 'Weekly', impact: '168.9', access: 'Subscription' },
  { id: 'JN-002', title: 'New England Journal of Medicine', publisher: 'NEJM', frequency: 'Weekly', impact: '176.1', access: 'Subscription' },
  { id: 'JN-003', title: 'Ghana Medical Journal', publisher: 'Ghana Medical Association', frequency: 'Quarterly', impact: '1.2', access: 'Open Access' },
  { id: 'JN-004', title: 'BMJ', publisher: 'BMJ Publishing', frequency: 'Weekly', impact: '39.9', access: 'Open Access' },
  { id: 'JN-005', title: 'African Journal of Health Sciences', publisher: 'AMREF', frequency: 'Bi-monthly', impact: '0.8', access: 'Free' },
];

const STATUS_COLORS: Record<string, string> = { 'Available': 'bg-green-100 text-green-800', 'On Loan': 'bg-yellow-100 text-yellow-800', 'Reserved': 'bg-blue-100 text-blue-800', 'Reference Only': 'bg-red-100 text-red-800' };
const ACCESS_COLORS: Record<string, string> = { 'Open Access': 'bg-green-100 text-green-800', 'Subscription': 'bg-yellow-100 text-yellow-800', 'Free': 'bg-blue-100 text-blue-800' };

export default function MedicalLibrary() {
  const [tab, setTab] = useState<'books' | 'journals' | 'stats'>('books');

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
          title="Add New Pharmacy"
          fields={[{"name": "drugName", "label": "Drug Name", "type": "text", "placeholder": "e.g. Paracetamol 500mg", "required": true}, {"name": "genericName", "label": "Generic Name", "type": "text", "placeholder": "e.g. Acetaminophen"}, {"name": "category", "label": "Category", "type": "select", "options": ["Analgesic", "Antibiotic", "Antimalarial", "Antihypertensive", "Antidiabetic", "Vitamin", "Other"]}, {"name": "dosageForm", "label": "Dosage Form", "type": "select", "options": ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler"]}, {"name": "strength", "label": "Strength", "type": "text", "placeholder": "e.g. 500mg"}, {"name": "quantity", "label": "Quantity", "type": "number", "placeholder": "0", "required": true}, {"name": "unitPrice", "label": "Unit Price (GH₵)", "type": "number", "placeholder": "0.00", "required": true}, {"name": "batchNumber", "label": "Batch Number", "type": "text", "placeholder": "BAT-XXXX"}, {"name": "expiryDate", "label": "Expiry Date", "type": "date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Medical Library & Knowledge Base</h1><p className="text-gray-500">Clinical references, medical textbooks, journal access, and evidence-based resources</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Textbooks', value: BOOKS.length, color: 'text-blue-600' }, { label: 'Journals', value: JOURNALS.length, color: 'text-green-600' }, { label: 'Available', value: BOOKS.filter(b => b.status === 'Available').length, color: 'text-purple-600' }, { label: 'On Loan', value: BOOKS.filter(b => b.status === 'On Loan').length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['books', 'journals', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'books' ? 'Textbooks' : t === 'journals' ? 'Journals' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'books' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">Category</th><th className="p-3">Edition</th><th className="p-3">Location</th><th className="p-3">Status</th></tr></thead>
            <tbody>{BOOKS.map(b => (
              <tr key={b.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{b.title}</td><td className="p-3 text-xs">{b.author}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{b.category}</Badge></td><td className="p-3">{b.edition} ({b.year})</td><td className="p-3 text-xs">{b.location}</td><td className="p-3"><Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'journals' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Journal</th><th className="p-3">Publisher</th><th className="p-3">Frequency</th><th className="p-3">Impact Factor</th><th className="p-3">Access</th></tr></thead>
            <tbody>{JOURNALS.map(j => (
              <tr key={j.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{j.title}</td><td className="p-3 text-xs">{j.publisher}</td><td className="p-3">{j.frequency}</td><td className="p-3 font-bold">{j.impact}</td><td className="p-3"><Badge className={ACCESS_COLORS[j.access]}>{j.access}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Books by Category</h3>
            {[...new Set(BOOKS.map(b => b.category))].map(c => <div key={c} className="flex items-center justify-between py-2 border-b last:border-0"><span className="text-sm">{c}</span><span className="font-bold">{BOOKS.filter(b => b.category === c).length}</span></div>)}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Journal Access</h3>
            {Object.keys(ACCESS_COLORS).map(a => <div key={a} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={ACCESS_COLORS[a]}>{a}</Badge><span className="font-bold">{JOURNALS.filter(j => j.access === a).length}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
