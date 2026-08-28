import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Input, PageHeader, useToast } from '../../components/ui';

interface Document {
  id: string;
  name: string;
  type: 'lab_report' | 'prescription' | 'imaging' | 'insurance' | 'consent' | 'discharge' | 'referral' | 'other';
  patientName: string;
  mrn: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  status: 'active' | 'archived';
  tags: string[];
}

const DOC_TYPES: Record<string, { icon: string; color: string }> = {
  lab_report: { icon: '🧪', color: 'bg-cyan-100 text-cyan-700' },
  prescription: { icon: '💊', color: 'bg-indigo-100 text-indigo-700' },
  imaging: { icon: '📷', color: 'bg-purple-100 text-purple-700' },
  insurance: { icon: '💳', color: 'bg-yellow-100 text-yellow-700' },
  consent: { icon: '📝', color: 'bg-green-100 text-green-700' },
  discharge: { icon: '🏥', color: 'bg-blue-100 text-blue-700' },
  referral: { icon: '🔄', color: 'bg-orange-100 text-orange-700' },
  other: { icon: '📄', color: 'bg-slate-100 text-slate-700' },
};

const DEMO_DOCS: Document[] = [
  { id: '1', name: 'CBC Report - Jan 2024', type: 'lab_report', patientName: 'Kwame A.', mrn: 'MRN-00142', uploadedBy: 'Dr. Asante', uploadedAt: '2024-01-15', size: '245 KB', status: 'active', tags: ['blood', 'routine'] },
  { id: '2', name: 'Chest X-Ray', type: 'imaging', patientName: 'Ama D.', mrn: 'MRN-00138', uploadedBy: 'Dr. Frimpong', uploadedAt: '2024-01-14', size: '1.2 MB', status: 'active', tags: ['chest', 'emergency'] },
  { id: '3', name: 'Surgery Consent Form', type: 'consent', patientName: 'Yaw M.', mrn: 'MRN-00155', uploadedBy: 'Nurse Darko', uploadedAt: '2024-01-13', size: '89 KB', status: 'active', tags: ['surgery', 'consent'] },
  { id: '4', name: 'NHIS Claim - December', type: 'insurance', patientName: 'Akua B.', mrn: 'MRN-00160', uploadedBy: 'Cashier Akua', uploadedAt: '2024-01-12', size: '156 KB', status: 'active', tags: ['nhis', 'claim'] },
  { id: '5', name: 'Discharge Summary', type: 'discharge', patientName: 'Nana K.', mrn: 'MRN-00148', uploadedBy: 'Dr. Boateng', uploadedAt: '2024-01-11', size: '312 KB', status: 'archived', tags: ['discharge', 'summary'] },
  { id: '6', name: 'Referral Letter - KATH', type: 'referral', patientName: 'Efua A.', mrn: 'MRN-00165', uploadedBy: 'Dr. Asante', uploadedAt: '2024-01-10', size: '78 KB', status: 'active', tags: ['referral', 'kath'] },
];

export default function DocumentManagement() {
  const toast = useToast();
  const [docs, setDocs] = useState<Document[]>(DEMO_DOCS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = docs.filter((d) => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.patientName.toLowerCase().includes(search.toLowerCase()) && !d.mrn.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function simulateUpload() {
    const types: Document['type'][] = ['lab_report', 'prescription', 'imaging', 'consent', 'discharge', 'referral'];
    const newDoc: Document = {
      id: String(Date.now()),
      name: 'Uploaded Document',
      type: types[Math.floor(Math.random() * types.length)] ?? 'other',
      patientName: 'New Patient',
      mrn: 'MRN-NEW',
      uploadedBy: 'You',
      uploadedAt: new Date().toISOString().slice(0, 10),
      size: `${Math.floor(Math.random() * 500)} KB`,
      status: 'active',
      tags: ['new'],
    };
    setDocs([newDoc, ...docs]);
    setShowUpload(false);
    toast('Document uploaded successfully', 'success');
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
          title="Add New Document"
          fields={[{"name":"title","label":"Document Title","type":"text","required":true},{"name":"category","label":"Category","type":"select","options":["Policy","SOP","Form","Report","Certificate","License","Other"]},{"name":"department","label":"Department","type":"text"},{"name":"version","label":"Version","type":"text","placeholder":"e.g. 1.0"},{"name":"expiryDate","label":"Review Date","type":"date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="📁 Document Management"
        subtitle={`${docs.length} documents · ${docs.filter((d) => d.status === 'active').length} active`}
        action={<Button variant="green" onClick={() => setShowUpload(!showUpload)}>📤 Upload Document</Button>}
      />

      {showUpload && (
        <Card className="mb-5 border-green-200 bg-green-50" title="Upload Document">
          <div className="rounded-xl border-2 border-dashed border-green-300 bg-white p-8 text-center">
            <p className="text-4xl">📁</p>
            <p className="mt-2 text-sm text-slate-600">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-slate-400">Supports PDF, JPG, PNG, DICOM (max 50MB)</p>
            <Button variant="green" className="mt-4" onClick={() => void simulateUpload()}>📤 Select Files</Button>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All Types</option>
          {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {k.replace('_', ' ')}</option>)}
        </select>
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Document</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Uploaded By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((d) => {
                const typeCfg = DOC_TYPES[d.type] || { icon: '📄', color: 'bg-slate-100 text-slate-700' };
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{typeCfg.icon}</span>
                        <div>
                          <p className="font-semibold text-slate-800">{d.name}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${typeCfg.color}`}>{d.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-slate-700">{d.patientName}</p>
                      <p className="text-[10px] text-slate-400">{d.mrn}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{d.uploadedBy}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{d.uploadedAt}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{d.size}</td>
                    <td className="px-5 py-3"><Badge tone={d.status === 'active' ? 'green' : 'gray'}>{d.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => {}} className="text-xs font-bold text-blue-600 hover:underline">View</button>
                        <button onClick={() => {}} className="text-xs font-bold text-slate-500 hover:underline">Download</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
