import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Transfer { id: string; patientName: string; mrn: string; fromWard: string; toWard: string; bedFrom: string; bedTo?: string; reason: string; clinicalNotes: string; requestedBy: string; approvedBy?: string; status: 'Requested' | 'Approved' | 'In Transit' | 'Completed' | 'Cancelled'; dateRequested: string; dateApproved?: string; dateCompleted?: string; equipmentNeeded: string[]; escortRequired: boolean; isolationRequired: boolean; }

const TRANSFERS: Transfer[] = [
  { id: 'TRF-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', fromWard: 'Medical Ward A', toWard: 'ICU', bedFrom: 'A-12', bedTo: 'ICU-05', reason: 'Deteriorating vitals — needs ICU monitoring', clinicalNotes: 'BP dropping, HR rising. GCS falling. Needs continuous monitoring and IV inotropes.', requestedBy: 'Dr. Sarah Johnson', approvedBy: 'Dr. James Mensah', status: 'In Transit', dateRequested: '2026-08-26 08:30', dateApproved: '2026-08-26 08:35', equipmentNeeded: ['Portable monitor', 'IV pump', 'Oxygen cylinder'], escortRequired: true, isolationRequired: false },
  { id: 'TRF-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0923', fromWard: 'Surgical Ward', toWard: 'Maternity Ward', bedFrom: 'S-08', bedTo: 'M-15', reason: 'Pregnancy confirmed — transfer to maternity', clinicalNotes: 'Routine transfer. Stable patient. No complications.', requestedBy: 'Dr. Ama Darko', status: 'Approved', dateRequested: '2026-08-26 10:00', dateApproved: '2026-08-26 10:15', equipmentNeeded: [], escortRequired: false, isolationRequired: false },
  { id: 'TRF-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0756', fromWard: 'Emergency', toWard: 'Surgical Ward', bedFrom: 'ER-03', bedTo: 'S-15', reason: 'Appendicitis — post-op recovery', clinicalNotes: 'Post-appendectomy, stable. Ready for surgical ward step-down.', requestedBy: 'Dr. Kofi Appiah', approvedBy: 'Dr. James Mensah', status: 'Requested', dateRequested: '2026-08-26 11:20', equipmentNeeded: ['Wheelchair'], escortRequired: false, isolationRequired: false },
  { id: 'TRF-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0845', fromWard: 'Paediatric Ward', toWard: 'NICU', bedFrom: 'P-06', bedTo: 'NICU-03', reason: 'Neonatal complication — requires NICU care', clinicalNotes: 'Newborn with respiratory distress. Needs NICU monitoring.', requestedBy: 'Dr. Ama Darko', approvedBy: 'Dr. James Mensah', status: 'Completed', dateRequested: '2026-08-25 14:00', dateApproved: '2026-08-25 14:05', dateCompleted: '2026-08-25 14:30', equipmentNeeded: ['Incubator', 'Neonatal monitor'], escortRequired: true, isolationRequired: false },
  { id: 'TRF-005', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0334', fromWard: 'Medical Ward B', toWard: 'Oncology', bedFrom: 'B-18', bedTo: 'ONC-08', reason: 'Confirmed malignancy — transfer to oncology', clinicalNotes: 'Biopsy results confirm lymphoma. Oncology team ready.', requestedBy: 'Dr. Kofi Asante', status: 'Requested', dateRequested: '2026-08-26 12:00', equipmentNeeded: [], escortRequired: false, isolationRequired: false },
];

const _STATUS_COLORS: Record<string, string> = { Requested: 'bg-yellow-100 text-yellow-800', Approved: 'bg-blue-100 text-blue-800', 'In Transit': 'bg-orange-100 text-orange-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' };

export default function WardTransferEnhanced() {
  const [transfers] = useState<Transfer[]>(TRANSFERS);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const active = transfers.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ward Transfer Management</h1>
          <p className="text-slate-500 text-sm">Patient transfer workflow with approval chain</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Transfer</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Active Transfers</p><p className="text-2xl font-bold text-orange-600">{active.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Awaiting Approval</p><p className="text-2xl font-bold text-yellow-600">{transfers.filter(t => t.status === 'Requested').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">In Transit</p><p className="text-2xl font-bold text-blue-600">{transfers.filter(t => t.status === 'In Transit').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Completed Today</p><p className="text-2xl font-bold text-green-600">{transfers.filter(t => t.status === 'Completed').length}</p></Card>
      </div>

      <div className="space-y-3">
        {transfers.sort((a, b) => { const order: Record<string, number> = { Requested: 0, Approved: 1, 'In Transit': 2, Completed: 3, Cancelled: 4 }; return (order[a.status] ?? 5) - (order[b.status] ?? 5); }).map(t => (
          <Card key={t.id} className={`p-4 cursor-pointer hover:shadow transition ${selected?.id === t.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === t.id ? null : t)}>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400">{t.fromWard}</span>
                <span className="text-xs text-slate-400">{t.bedFrom}</span>
              </div>
              <div className="flex-1 text-center">
                <div className="text-lg">→</div>
                <Badge tone={t.status === 'Completed' ? 'green' : t.status === 'In Transit' ? 'gold' : 'blue'}>{t.status}</Badge>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400">{t.toWard}</span>
                <span className="text-xs text-slate-400">{t.bedTo}</span>
              </div>
              <div className="flex-1 ml-4">
                <p className="font-medium">{t.patientName} <span className="text-xs text-slate-400">{t.mrn}</span></p>
                <p className="text-sm text-slate-500">{t.reason}</p>
                <p className="text-xs text-slate-400 mt-1">Requested by {t.requestedBy} · {t.dateRequested}</p>
              </div>
              <div className="flex gap-1">
                {t.isolationRequired && <Badge tone="red">Isolation</Badge>}
                {t.escortRequired && <Badge tone="gold">Escort</Badge>}
                {t.equipmentNeeded.length > 0 && <Badge tone="blue">{t.equipmentNeeded.length} items</Badge>}
              </div>
            </div>
            {selected?.id === t.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs font-semibold text-slate-500">Clinical Notes</p><p className="text-sm mt-1">{t.clinicalNotes}</p></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Approval Chain</p>
                    <div className="mt-1 space-y-1 text-sm">
                      <p>✅ Requested: {t.requestedBy} ({t.dateRequested})</p>
                      {t.approvedBy && <p>✅ Approved: {t.approvedBy} ({t.dateApproved})</p>}
                      {t.status === 'In Transit' && <p>🚚 In Transit</p>}
                      {t.status === 'Completed' && <p>✅ Completed: {t.dateCompleted}</p>}
                    </div>
                  </div>
                </div>
                {t.equipmentNeeded.length > 0 && (
                  <div><p className="text-xs font-semibold text-slate-500">Equipment Needed</p>
                    <div className="flex gap-1 mt-1">{t.equipmentNeeded.map((e, i) => <Badge key={i} tone="blue">{e}</Badge>)}</div>
                  </div>
                )}
                <div className="flex gap-2">
                  {t.status === 'Requested' && <><button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Approve</button><button className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Reject</button></>}
                  {t.status === 'Approved' && <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Start Transit</button>}
                  {t.status === 'In Transit' && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Complete Transfer</button>}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
