import { useState } from 'react';
import { logAudit } from '../lib/auditTrail';

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
}

interface AddNewFormProps {
  title: string;
  fields: FormField[];
  onSave: (data: Record<string, string>) => void;
  onCancel: () => void;
  initialData?: Record<string, string> | null;
  moduleName?: string;
}

/**
 * Reusable form component for adding new records or editing existing ones.
 * Shows actual input fields based on the field definitions.
 */
export default function AddNewForm({ title, fields, onSave, onCancel, initialData, moduleName }: AddNewFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    if (initialData) {
      return Object.fromEntries(fields.map((f) => [f.name, initialData[f.name] || f.defaultValue || '']));
    }
    return Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || '']));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Log audit trail
    logAudit({
      userId: 'current',
      userName: 'Current User',
      role: 'user',
      action: initialData ? 'UPDATE' : 'CREATE',
      module: moduleName || title.replace('Add New ', '').replace('Edit ', ''),
      description: `${initialData ? 'Updated' : 'Created'} record via ${title}`,
    });
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-4 shadow-lg">
      <h3 className="font-bold text-green-800 text-lg">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                required={field.required}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow transition">
          {initialData ? 'Update' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">Cancel</button>
      </div>
    </form>
  );
}
