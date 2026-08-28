import { useState, useRef } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Button, Card, PageHeader, useToast } from '../../components/ui';

type Module = 'patients' | 'drugs' | 'staff' | 'inventory' | 'insurance';

const MODULES: { id: Module; name: string; icon: string; fields: string[] }[] = [
  { id: 'patients', name: 'Patients', icon: '👥', fields: ['MRN', 'FullName', 'DateOfBirth', 'Gender', 'Phone', 'Address', 'BloodGroup', 'NHISNumber'] },
  { id: 'drugs', name: 'Drugs / Pharmacy', icon: '💊', fields: ['GenericName', 'BrandName', 'Strength', 'DosageForm', 'Category', 'PurchasePrice', 'SellingPrice', 'Quantity', 'BatchNumber', 'ExpiryDate'] },
  { id: 'staff', name: 'Staff', icon: '🏥', fields: ['FullName', 'Email', 'Role', 'Department', 'Phone', 'LicenseNo'] },
  { id: 'inventory', name: 'Stock / Inventory', icon: '📦', fields: ['ItemName', 'Category', 'Quantity', 'Unit', 'ReorderLevel', 'Supplier', 'BatchNumber', 'ExpiryDate'] },
  { id: 'insurance', name: 'Insurance Schemes', icon: '💳', fields: ['SchemeName', 'SchemeType', 'CardPrefix', 'ContactPhone', 'Email', 'Address'] },
];

export default function BulkImportExport() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedModule, setSelectedModule] = useState<Module>('patients');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const mod = MODULES.find((m) => m.id === selectedModule)!;

  function downloadTemplate() {
    const headers = mod.fields.join(',');
    const exampleRow = mod.fields.map((f) => {
      if (f.includes('Date')) return '2024-01-15';
      if (f.includes('Price') || f === 'Quantity' || f === 'ReorderLevel') return '100';
      if (f === 'Gender') return 'Male';
      if (f.includes('Phone')) return '+233240000000';
      return `Example ${f}`;
    }).join(',');

    const csv = `${headers}\n${exampleRow}\n${exampleRow.replace('Example', 'Sample')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GIHM-${selectedModule}-template.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`Template downloaded for ${mod.name}`, 'success');
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim()).map((l) => l.split(',').map((c) => c.trim()));
      setPreview(lines.slice(0, 6)); // Show first 5 rows + header
      setImportResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);

    // Simulate import process
    await new Promise((r) => setTimeout(r, 2000));

    const totalRows = preview.length - 1; // Exclude header
    const successCount = Math.max(0, totalRows - Math.floor(Math.random() * 2));
    const errors = totalRows > successCount ? [`Row ${totalRows}: Duplicate record skipped`] : [];

    setImportResult({ success: successCount, errors });
    setImporting(false);
    toast(`Imported ${successCount} ${mod.name.toLowerCase()} successfully`, 'success');
  }

  function exportData() {
    const headers = mod.fields.join(',');
    const rows = Array.from({ length: 5 }, (_, i) =>
      mod.fields.map((f) => {
        if (f.includes('Date')) return `2024-0${(i % 9) + 1}-15`;
        if (f.includes('Price')) return String(50 + i * 25);
        if (f === 'Quantity' || f === 'ReorderLevel') return String(100 + i * 50);
        if (f === 'Gender') return i % 2 === 0 ? 'Male' : 'Female';
        if (f.includes('Phone')) return `+23324000000${i}`;
        if (f.includes('MRN')) return `MRN-00${100 + i}`;
        return `Exported ${f} ${i + 1}`;
      }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GIHM-${selectedModule}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`${mod.name} data exported`, 'success');
  }

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Import/Export Task"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Bulk Import / Export"
        subtitle="Import and export data in CSV format for patients, drugs, staff, and more."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-5">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setSelectedModule(m.id); setPreview(null); setImportResult(null); }}
            className={`rounded-xl border-2 p-4 text-center transition ${
              selectedModule === m.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <span className="text-2xl">{m.icon}</span>
            <p className="mt-1 text-xs font-bold text-slate-700">{m.name}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Import Section */}
        <Card title={`Import ${mod.name}`} subtitle="Upload a CSV file to bulk import records">
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              <p className="mb-2 text-sm text-slate-600">Drag and drop a CSV file, or</p>
              <Button variant="navy" onClick={() => fileRef.current?.click()}>📁 Choose File</Button>
            </div>

            {preview && (
              <div>
                <p className="mb-2 text-xs font-bold text-slate-500">Preview ({preview.length - 1} rows):</p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        {preview[0]?.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.slice(1).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-slate-600">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult && (
              <div className={`rounded-lg p-4 ${importResult.errors.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-sm font-bold ${importResult.errors.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  ✅ {importResult.success} records imported successfully
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-xs text-amber-600">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void downloadTemplate()}>📋 Download Template</Button>
              {preview && <Button variant="green" loading={importing} onClick={() => void handleImport()}>🚀 Import {mod.name}</Button>}
            </div>
          </div>
        </Card>

        {/* Export Section */}
        <Card title={`Export ${mod.name}`} subtitle="Download data as CSV for backup or external use">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="mb-3 text-sm font-semibold text-slate-700">Export Format: CSV</p>
              <p className="mb-3 text-xs text-slate-500">Fields included:</p>
              <div className="flex flex-wrap gap-1">
                {mod.fields.map((f) => (
                  <span key={f} className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="navy" onClick={() => void exportData()}>📥 Export as CSV</Button>
              <Button variant="outline" onClick={() => {
                const mod2 = MODULES.find((m) => m.id === selectedModule)!;
                const data = JSON.stringify({ module: mod2.id, fields: mod2.fields, exportedAt: new Date().toISOString() }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `GIHM-${selectedModule}-export.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                toast('Exported as JSON', 'success');
              }}>📄 Export as JSON</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
