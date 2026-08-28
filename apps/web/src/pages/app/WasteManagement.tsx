import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, Input, PageHeader } from '../../components/ui';

type WasteTab = 'collection' | 'disposal' | 'compliance' | 'analytics';

interface WasteRecord {
  id: string;
  date: string;
  time: string;
  department: string;
  generatedBy: string;
  wasteType: 'infectious' | 'sharps' | 'pathological' | 'pharmaceutical' | 'chemical' | 'general' | 'radioactive';
  description: string;
  weight: number;
  colorCode: 'red' | 'yellow' | 'black' | 'blue' | 'white';
  containerId: string;
  collectedBy: string;
  collectedTime: string;
  disposedBy?: string;
  disposedDate?: string;
  disposalMethod?: 'incineration' | 'autoclave' | 'chemical' | 'landfill' | 'recycling';
  status: 'collected' | 'stored' | 'in-transit' | 'disposed' | 'audited';
}

const WASTE_TYPES = {
  infectious: { label: 'Infectious', colorCode: 'red', icon: '☣️', color: 'bg-red-100 text-red-700' },
  sharps: { label: 'Sharps', colorCode: 'yellow', icon: '💉', color: 'bg-yellow-100 text-yellow-700' },
  pathological: { label: 'Pathological', colorCode: 'yellow', icon: '🧬', color: 'bg-yellow-100 text-yellow-700' },
  pharmaceutical: { label: 'Pharmaceutical', colorCode: 'blue', icon: '💊', color: 'bg-blue-100 text-blue-700' },
  chemical: { label: 'Chemical', colorCode: 'black', icon: '⚗️', color: 'bg-slate-100 text-slate-700' },
  general: { label: 'General', colorCode: 'black', icon: '🗑️', color: 'bg-gray-100 text-gray-700' },
  radioactive: { label: 'Radioactive', colorCode: 'white', icon: '☢️', color: 'bg-purple-100 text-purple-700' },
};

const COLOR_CODES = {
  red: { label: 'Red Bag', desc: 'Infectious waste', bg: 'bg-red-500', text: 'text-white' },
  yellow: { label: 'Yellow Container', desc: 'Sharps & pathological', bg: 'bg-yellow-500', text: 'text-white' },
  black: { label: 'Black Bag', desc: 'General waste', bg: 'bg-gray-700', text: 'text-white' },
  blue: { label: 'Blue Bag', desc: 'Pharmaceutical waste', bg: 'bg-blue-500', text: 'text-white' },
  white: { label: 'White Bag', desc: 'Radioactive waste', bg: 'bg-white border', text: 'text-purple-700' },
};

const MOCK_WASTE: WasteRecord[] = [
  { id: 'WR001', date: '2026-05-23', time: '08:30', department: 'Laboratory', generatedBy: 'Lab Technician', wasteType: 'infectious', description: 'Used blood collection tubes, culture plates', weight: 3.5, colorCode: 'red', containerId: 'RED-LAB-01', collectedBy: 'Waste Handler', collectedTime: '09:00', status: 'stored' },
  { id: 'WR002', date: '2026-05-23', time: '08:45', department: 'Theatre', generatedBy: 'Scrub Nurse', wasteType: 'sharps', description: 'Surgical needles, scalpel blades, suture needles', weight: 1.2, colorCode: 'yellow', containerId: 'YELLOW-TH-01', collectedBy: 'Waste Handler', collectedTime: '09:15', disposedBy: 'EnviroSafe Ltd', disposedDate: '2026-05-23', disposalMethod: 'incineration', status: 'disposed' },
  { id: 'WR003', date: '2026-05-23', time: '09:00', department: 'Pharmacy', generatedBy: 'Pharmacist', wasteType: 'pharmaceutical', description: 'Expired medications: Paracetamol, Amoxicillin, Metformin (total 45 packs)', weight: 5.0, colorCode: 'blue', containerId: 'BLUE-PH-01', collectedBy: 'Waste Handler', collectedTime: '10:00', status: 'stored' },
  { id: 'WR004', date: '2026-05-23', time: '07:00', department: 'Ward M-12', generatedBy: 'Nurse Ama', wasteType: 'infectious', description: 'Used IV lines, blood-stained dressings, catheter bags', weight: 4.2, colorCode: 'red', containerId: 'RED-M12-01', collectedBy: 'Waste Handler', collectedTime: '08:00', disposedBy: 'EnviroSafe Ltd', disposedDate: '2026-05-22', disposalMethod: 'incineration', status: 'disposed' },
  { id: 'WR005', date: '2026-05-23', time: '06:00', department: 'All Departments', generatedBy: 'Cleaning Staff', wasteType: 'general', description: 'General hospital waste — packaging, paper, food waste', weight: 25.0, colorCode: 'black', containerId: 'BLK-GEN-01', collectedBy: 'Waste Handler', collectedTime: '06:30', disposedBy: 'City Waste Ltd', disposedDate: '2026-05-23', disposalMethod: 'landfill', status: 'disposed' },
  { id: 'WR006', date: '2026-05-23', time: '10:30', department: 'Oncology', generatedBy: 'Dr. Mensah', wasteType: 'pathological', description: 'Surgical specimens, tissue samples', weight: 2.1, colorCode: 'yellow', containerId: 'YELLOW-ON-01', collectedBy: 'Waste Handler', collectedTime: '11:00', status: 'stored' },
  { id: 'WR007', date: '2026-05-23', time: '11:00', department: 'Laboratory', generatedBy: 'Lab Scientist', wasteType: 'chemical', description: 'Formalin, methanol, acetic acid (5L total)', weight: 5.5, colorCode: 'black', containerId: 'BLK-LAB-01', collectedBy: 'Waste Handler', collectedTime: '11:30', status: 'stored' },
  { id: 'WR008', date: '2026-05-22', time: '14:00', department: 'Radiology', generatedBy: 'Radiographer', wasteType: 'radioactive', description: 'Expired radioactive isotopes (I-131)', weight: 0.5, colorCode: 'white', containerId: 'WHT-RAD-01', collectedBy: 'Nuclear Safety Officer', collectedTime: '14:30', status: 'audited' },
  { id: 'WR009', date: '2026-05-22', time: '09:00', department: 'Ward S-05', generatedBy: 'Nurse Kofi', wasteType: 'infectious', description: 'Post-surgical dressings, drainage bags', weight: 3.0, colorCode: 'red', containerId: 'RED-S05-01', collectedBy: 'Waste Handler', collectedTime: '10:00', disposedBy: 'EnviroSafe Ltd', disposedDate: '2026-05-22', disposalMethod: 'incineration', status: 'disposed' },
  { id: 'WR010', date: '2026-05-21', time: '08:00', department: 'Pharmacy', generatedBy: 'Pharmacist', wasteType: 'sharps', description: 'Expired insulin pen needles, used syringes', weight: 0.8, colorCode: 'yellow', containerId: 'YELLOW-PH-01', collectedBy: 'Waste Handler', collectedTime: '09:00', disposedBy: 'EnviroSafe Ltd', disposedDate: '2026-05-21', disposalMethod: 'incineration', status: 'disposed' },
];

export default function WasteManagement() {
  const [tab, setTab] = useState<WasteTab>('collection');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWaste = MOCK_WASTE.filter(w => {
    return w.department.toLowerCase().includes(searchTerm.toLowerCase()) || w.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalWeight = MOCK_WASTE.reduce((sum, w) => sum + w.weight, 0);
  const todayWeight = MOCK_WASTE.filter(w => w.date === '2026-05-23').reduce((sum, w) => sum + w.weight, 0);
  const disposedCount = MOCK_WASTE.filter(w => w.status === 'disposed').length;
  const pendingDisposal = MOCK_WASTE.filter(w => ['collected', 'stored'].includes(w.status)).length;

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
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Medical Waste Management" subtitle="Biohazard waste tracking, segregation, and disposal compliance" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_WASTE.length}</div><div className="text-xs text-slate-500">Total Records</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{todayWeight.toFixed(1)} kg</div><div className="text-xs text-slate-500">Today's Waste</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{disposedCount}</div><div className="text-xs text-slate-500">Disposed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{pendingDisposal}</div><div className="text-xs text-slate-500">Pending Disposal</div></Card>
      </div>

      {/* Color Code Legend */}
      <Card className="p-4">
        <h3 className="font-bold text-xs text-slate-600 mb-2">🎨 Waste Segregation Color Codes (Ghana EPA Standards)</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(COLOR_CODES).map(([code, cfg]) => (
            <div key={code} className="flex items-center gap-2">
              <span className={`h-4 w-4 rounded ${cfg.bg} ${cfg.text} border shadow text-center text-[8px] leading-4`}></span>
              <span className="text-xs text-slate-600"><strong>{cfg.label}</strong>: {cfg.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['collection', 'disposal', 'compliance', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'collection' ? '📦 Collection' : t === 'disposal' ? '🔥 Disposal' : t === 'compliance' ? '📋 Compliance' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Collection Tab */}
      {tab === 'collection' && (
        <div className="space-y-3">
          <Input placeholder="Search by department or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
          {filteredWaste.map(w => {
            const wasteType = WASTE_TYPES[w.wasteType];
            const colorCode = COLOR_CODES[w.colorCode];
            return (
              <Card key={w.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`h-10 w-10 rounded-lg ${colorCode.bg} ${colorCode.text} flex items-center justify-center text-lg shadow`}>
                      {wasteType.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${wasteType.color}`}>{wasteType.label}</span>
                        <Badge tone={w.status === 'disposed' ? 'green' : w.status === 'stored' ? 'gold' : 'blue'}>{w.status.toUpperCase()}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-700">{w.description}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                        <span>🏥 {w.department}</span>
                        <span>👤 {w.generatedBy}</span>
                        <span>⚖️ {w.weight} kg</span>
                        <span>📦 {w.containerId}</span>
                        <span>📅 {w.date} {w.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disposal Tab */}
      {tab === 'disposal' && (
        <div className="space-y-3">
          {MOCK_WASTE.filter(w => w.status === 'disposed' || w.status === 'in-transit').map(w => {
            const wasteType = WASTE_TYPES[w.wasteType];
            return (
              <Card key={w.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wasteType.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{w.containerId}</span>
                      <Badge tone="green">DISPOSED</Badge>
                    </div>
                    <div className="text-xs text-slate-500">{w.description} · {w.weight} kg</div>
                    <div className="text-[10px] text-slate-400">
                      Disposed by: <strong>{w.disposedBy}</strong> on {w.disposedDate} via <strong>{w.disposalMethod}</strong>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Compliance Tab */}
      {tab === 'compliance' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📋 Regulatory Compliance Checklist</h3>
            {[
              { item: 'Waste segregation at point of generation', status: 'compliant' },
              { item: 'Color-coded containers in all departments', status: 'compliant' },
              { item: 'Sharps containers at 75% capacity replacement', status: 'compliant' },
              { item: 'Waste handler PPE (gloves, gowns, masks)', status: 'compliant' },
              { item: 'Daily waste collection schedule maintained', status: 'compliant' },
              { item: 'Waste manifest forms completed', status: 'partially' },
              { item: 'Licensed disposal contractor (EnviroSafe Ltd)', status: 'compliant' },
              { item: 'Quarterly waste audit conducted', status: 'pending' },
              { item: 'Staff training on waste management', status: 'compliant' },
              { item: 'Emergency spill kit available', status: 'compliant' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-xs text-slate-700">{c.item}</span>
                <Badge tone={c.status === 'compliant' ? 'green' : c.status === 'partially' ? 'gold' : 'red'}>
                  {c.status === 'compliant' ? '✅ Compliant' : c.status === 'partially' ? '⚠️ Partial' : '❌ Pending'}
                </Badge>
              </div>
            ))}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📅 Disposal Schedule</h3>
            <div className="space-y-2">
              {[
                { type: 'Infectious (Red)', frequency: 'Daily', next: '2026-05-24', provider: 'EnviroSafe Ltd' },
                { type: 'Sharps (Yellow)', frequency: 'Daily', next: '2026-05-24', provider: 'EnviroSafe Ltd' },
                { type: 'Pharmaceutical (Blue)', frequency: 'Weekly', next: '2026-05-27', provider: 'EnviroSafe Ltd' },
                { type: 'General (Black)', frequency: 'Daily', next: '2026-05-24', provider: 'City Waste Ltd' },
                { type: 'Radioactive (White)', frequency: 'Monthly', next: '2026-06-01', provider: 'Nuclear Regulatory Authority' },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-2 text-xs">
                  <div className="font-medium">{s.type}</div>
                  <div className="text-slate-500">Every {s.frequency} · Next: {s.next} · Provider: {s.provider}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">☣️ Waste by Type</h3>
            {Object.entries(WASTE_TYPES).map(([key, cfg]) => {
              const count = MOCK_WASTE.filter(w => w.wasteType === key).length;
              const weight = MOCK_WASTE.filter(w => w.wasteType === key).reduce((s, w) => s + w.weight, 0);
              if (count === 0) return null;
              const pct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
              return (
                <div key={key} className="mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{cfg.icon} {cfg.label}</span>
                    <span className="font-bold">{weight.toFixed(1)} kg ({count} items)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(cfg.color?.split(' ')[0] ?? 'bg-gray-500').replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🏥 Waste by Department</h3>
            {[...new Set(MOCK_WASTE.map(w => w.department))].map(dept => {
              const deptWeight = MOCK_WASTE.filter(w => w.department === dept).reduce((s, w) => s + w.weight, 0);
              return (
                <div key={dept} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-xs text-slate-600">{dept}</span>
                  <span className="text-sm font-bold text-slate-600">{deptWeight.toFixed(1)} kg</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
