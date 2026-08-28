import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type ReferralTab = 'active' | 'completed' | 'analytics';

interface Referral {
  id: string; patientName: string; mrn: string; date: string; type: 'internal' | 'external';
  fromDept: string; toDept: string; toFacility?: string; reason: string; urgency: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'in-transit' | 'completed' | 'rejected';
  referringDoctor: string; receivingDoctor?: string; notes?: string;
}

const MOCK_REFERRALS: Referral[] = [
  { id: 'REF001', patientName: 'Kwame Asante', mrn: 'MRN-001', date: '2026-05-23', type: 'internal', fromDept: 'Emergency', toDept: 'Cardiology', reason: 'Hypertensive urgency with papilloedema — cardiology review required', urgency: 'urgent', status: 'accepted', referringDoctor: 'Dr. Mensah', receivingDoctor: 'Dr. Cardiologist' },
  { id: 'REF002', patientName: 'Akua Mensah', mrn: 'MRN-005', date: '2026-05-23', type: 'internal', fromDept: 'Medical Ward', toDept: 'Ophthalmology', reason: 'Urgent fundoscopy for papilloedema assessment', urgency: 'urgent', status: 'pending', referringDoctor: 'Dr. Mensah' },
  { id: 'REF003', patientName: 'Efua Amoah', mrn: 'MRN-007', date: '2026-05-22', type: 'external', fromDept: 'Obstetrics', toDept: 'N/A', toFacility: 'Korle-Bu Teaching Hospital', reason: 'High-risk pregnancy — requires specialist neonatal care', urgency: 'urgent', status: 'in-transit', referringDoctor: 'Dr. Agyeman', notes: 'Patient stabilized. Ambulance transfer arranged.' },
  { id: 'REF004', patientName: 'Nana Ama', mrn: 'MRN-204', date: '2026-05-20', type: 'internal', fromDept: 'Geriatrics', toDept: 'Psychiatry', reason: 'Behavioural changes and agitation — psychiatric evaluation needed', urgency: 'routine', status: 'accepted', referringDoctor: 'Dr. Old', receivingDoctor: 'Dr. Psych Kwame' },
  { id: 'REF005', patientName: 'Samuel Tetteh', mrn: 'MRN-103', date: '2026-05-22', type: 'external', fromDept: 'Emergency', toDept: 'N/A', toFacility: '37 Military Hospital', reason: 'Requires specialized orthopaedic surgery not available locally', urgency: 'routine', status: 'completed', referringDoctor: 'Dr. Boateng', notes: 'Patient transferred successfully. Records sent electronically.' },
];

export default function ReferralManagement() {
  const [tab, setTab] = useState<ReferralTab>('active');
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const urgencyConfig: Record<string, { label: string; tone: 'red' | 'gold' | 'blue' }> = { emergency: { label: 'EMERGENCY', tone: 'red' }, urgent: { label: 'Urgent', tone: 'gold' }, routine: { label: 'Routine', tone: 'blue' } };
  const statusConfig: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'gray' }> = { pending: { label: 'Pending', tone: 'gold' }, accepted: { label: 'Accepted', tone: 'blue' }, 'in-transit': { label: 'In Transit', tone: 'gold' }, completed: { label: 'Completed', tone: 'green' }, rejected: { label: 'Rejected', tone: 'red' } };

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
          title="Add New Referral"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"referringDoctor","label":"Referring Doctor","type":"text","required":true},{"name":"specialty","label":"Specialty","type":"select","options":["Cardiology","Neurology","Orthopaedics","Oncology","Paediatrics","Psychiatry","Surgery","Other"]},{"name":"reason","label":"Reason for Referral","type":"textarea","required":true},{"name":"urgency","label":"Urgency","type":"select","options":["Routine","Urgent","Emergency"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Referral Management" subtitle="Internal and external referral tracking and coordination" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_REFERRALS.length}</div><div className="text-xs text-slate-500">Total Referrals</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_REFERRALS.filter(r => r.status === 'pending').length}</div><div className="text-xs text-slate-500">Pending</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_REFERRALS.filter(r => r.status === 'completed').length}</div><div className="text-xs text-slate-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_REFERRALS.filter(r => r.type === 'external').length}</div><div className="text-xs text-slate-500">External</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['active', 'completed', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'active' ? '📋 Active' : t === 'completed' ? '✅ Completed' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <div className="space-y-3">
          {MOCK_REFERRALS.filter(r => r.status !== 'completed').map(r => {
            const urgCfg = urgencyConfig[r.urgency]!;
            const statCfg = statusConfig[r.status]!;
            const isExpanded = selectedReferral === r.id;
            return (
              <Card key={r.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedReferral(isExpanded ? null : r.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800">{r.patientName}</h3>
                      <Badge tone={urgCfg.tone}>{urgCfg.label}</Badge>
                      <Badge tone={statCfg.tone}>{statCfg.label}</Badge>
                      <Badge tone={r.type === 'external' ? 'navy' : 'blue'}>{r.type === 'external' ? '🏥 External' : '🏛 Internal'}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{r.fromDept} → {r.type === 'external' ? r.toFacility : r.toDept}</div>
                    <div className="mt-1 text-[10px] text-slate-400">📅 {r.date} · 👨‍⚕️ {r.referringDoctor}{r.receivingDoctor ? ` → ${r.receivingDoctor}` : ''}</div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📝 Reason for Referral</h4><p className="text-xs text-slate-700">{r.reason}</p></div>
                    {r.notes && <div className="rounded-lg bg-blue-50 p-3"><h4 className="font-bold text-xs text-blue-700 mb-1">📋 Notes</h4><p className="text-xs text-blue-600">{r.notes}</p></div>}
                    <div className="flex gap-2">
                      {r.status === 'pending' && <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Accept</Button>}
                      {r.status === 'accepted' && <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📤 Transfer</Button>}
                      <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print Referral</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'completed' && (
        <div className="space-y-3">
          {MOCK_REFERRALS.filter(r => r.status === 'completed').map(r => (
            <Card key={r.id} className="p-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">{r.patientName}</h3>
                <Badge tone="green">Completed</Badge>
                <span className="text-xs text-slate-400">{r.fromDept} → {r.type === 'external' ? r.toFacility : r.toDept}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Referrals by Department</h3>
            {[...new Set(MOCK_REFERRALS.map(r => r.fromDept))].map(dept => {
              const count = MOCK_REFERRALS.filter(r => r.fromDept === dept).length;
              return (<div key={dept} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600">{dept}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Referral Status</h3>
            {Object.entries(statusConfig).map(([k, v]) => {
              const count = MOCK_REFERRALS.filter(r => r.status === k).length;
              if (count === 0) return null;
              return (<div key={k} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><Badge tone={v.tone}>{v.label}</Badge><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
