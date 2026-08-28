import { useState } from 'react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: string[];
}

interface AddNewModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (record: Record<string, any>) => void;
  fields: Field[];
  title?: string;
}

export default function AddNewModal({ open, onClose, onAdd, fields, title = 'Add New Record' }: AddNewModalProps) {
  const [form, setForm] = useState<Record<string, any>>({});

  if (!open) return null;

  const handleSubmit = () => {
    onAdd(form);
    setForm({});
  };

  return (
    <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-4 shadow-lg">
      <h3 className="font-bold text-green-800 text-lg">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            {f.type === 'select' ? (
              <select
                value={form[f.key] || ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'number' ? (
              <input
                type="number"
                value={form[f.key] || ''}
                onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            ) : f.type === 'checkbox' ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form[f.key] || false}
                  onChange={e => setForm({ ...form, [f.key]: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">{f.label}</span>
              </div>
            ) : (
              <input
                type="text"
                value={form[f.key] || ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={handleSubmit} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Save Record</button>
        <button onClick={() => { onClose(); setForm({}); }} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
      </div>
    </div>
  );
}

export type { Field };
