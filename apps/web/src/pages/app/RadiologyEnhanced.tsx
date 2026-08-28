import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface ImagingRequest { id: string; patientName: string; mrn: string; ward: string; doctor: string; modality: 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound' | 'Mammography' | 'Fluoroscopy'; bodyPart: string; clinicalIndication: string; status: 'Ordered' | 'Scheduled' | 'In Progress' | 'Completed' | 'Reported' | 'Urgent'; dateOrdered: string; dateCompleted?: string; radiologist?: string; findings?: string; impression?: string; priority: 'Routine' | 'Urgent' | 'STAT'; }

const REQUESTS: ImagingRequest[] = [
  { id: 'RAD-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', doctor: 'Dr. Yaw Boateng', modality: 'X-Ray', bodyPart: 'Chest PA', clinicalIndication: 'Post-appendectomy — rule out pneumonia', status: 'Reported', dateOrdered: '2026-08-26', dateCompleted: '2026-08-26 10:00', radiologist: 'Dr. Radiologist', findings: 'Clear lung fields. No pleural effusion. Heart size normal. No post-operative complications.', impression: 'Normal chest X-ray', priority: 'Routine' },
  { id: 'RAD-002', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', doctor: 'Dr. Ama Darko', modality: 'CT Scan', bodyPart: 'Brain (non-contrast)', clinicalIndication: 'Altered consciousness — rule out intracranial pathology', status: 'Completed', dateOrdered: '2026-08-26', dateCompleted: '2026-08-26 11:30', priority: 'STAT' },
  { id: 'RAD-003', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', doctor: 'Dr. Kofi Asante', modality: 'Ultrasound', bodyPart: 'Abdomen (whole)', clinicalIndication: 'Abdominal pain, elevated LFTs', status: 'Scheduled', dateOrdered: '2026-08-26', priority: 'Routine' },
  { id: 'RAD-004', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', ward: 'Paediatric', doctor: 'Dr. Nana Agyeman', modality: 'X-Ray', bodyPart: 'Chest AP', clinicalIndication: 'High fever, cough — pneumonia?', status: 'In Progress', dateOrdered: '2026-08-26', priority: 'Urgent' },
  { id: 'RAD-005', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', ward: 'Oncology', doctor: 'Dr. Yaw Boateng', modality: 'CT Scan', bodyPart: 'Chest with contrast', clinicalIndication: 'Staging — lung mass', status: 'Reported', dateOrdered: '2026-08-25', dateCompleted: '2026-08-25 14:00', radiologist: 'Dr. Radiologist', findings: '3cm mass in right upper lobe. Enlarged mediastinal lymph nodes. No pleural effusion.', impression: 'Right upper lobe mass — likely primary lung malignancy (Stage IIIA)', priority: 'Urgent' },
  { id: 'RAD-006', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', ward: 'ICU', doctor: 'Dr. James Mensah', modality: 'X-Ray', bodyPart: 'Chest portable', clinicalIndication: 'Ventilated patient — daily check', status: 'Reported', dateOrdered: '2026-08-26', dateCompleted: '2026-08-26 08:00', radiologist: 'Dr. Radiologist', findings: 'ETT in good position. NG tube tip in stomach. No new consolidation. Mild bilateral dependent atelectasis.', impression: 'No ventilator-associated pneumonia', priority: 'Routine' },
];

const MODALITY_ICONS: Record<string, string> = { 'X-Ray': '📸', 'CT Scan': '🔬', 'MRI': '🧲', 'Ultrasound': '🔊', 'Mammography': '🔬', 'Fluoroscopy': '📸' };

export default function RadiologyEnhanced() {
  const [selected, setSelected] = useState<ImagingRequest | null>(null);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? REQUESTS : REQUESTS.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Radiology & Imaging</h1>
          <p className="text-slate-500 text-sm">Imaging requests, reports, and PACS integration</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Request</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Requests</p><p className="text-2xl font-bold">{REQUESTS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Scheduled</p><p className="text-2xl font-bold text-blue-600">{REQUESTS.filter(r => r.status === 'Scheduled').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">In Progress</p><p className="text-2xl font-bold text-orange-600">{REQUESTS.filter(r => r.status === 'In Progress').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Reported</p><p className="text-2xl font-bold text-green-600">{REQUESTS.filter(r => r.status === 'Reported').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">STAT</p><p className="text-2xl font-bold text-red-600">{REQUESTS.filter(r => r.priority === 'STAT').length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Scheduled', 'In Progress', 'Completed', 'Reported'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filtered.sort((a, b) => { const o: Record<string, number> = { STAT: 0, Urgent: 1, Routine: 2 }; return (o[a.priority] ?? 3) - (o[b.priority] ?? 3); }).map(r => (
            <Card key={r.id} className={`p-3 cursor-pointer hover:shadow transition ${selected?.id === r.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{MODALITY_ICONS[r.modality] ?? '📸'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.patientName}</span>
                    <Badge tone={r.priority === 'STAT' ? 'red' : r.priority === 'Urgent' ? 'gold' : 'blue'}>{r.priority}</Badge>
                    <Badge tone={r.status === 'Reported' ? 'green' : 'blue'}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{r.modality} — {r.bodyPart}</p>
                  <p className="text-xs text-slate-400">{r.mrn} · {r.ward} · {r.doctor}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="p-6 h-fit sticky top-4">
            <h2 className="text-lg font-bold mb-2">{selected.modality} — {selected.bodyPart}</h2>
            <p className="text-xs text-slate-500 mb-4">{selected.patientName} ({selected.mrn}) · {selected.ward} · {selected.doctor}</p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-500">Clinical Indication</p>
                <p className="text-sm mt-1">{selected.clinicalIndication}</p>
              </div>

              {selected.findings && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700">Findings</p>
                  <p className="text-sm mt-1">{selected.findings}</p>
                </div>
              )}

              {selected.impression && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-semibold text-green-700">Impression</p>
                  <p className="text-sm mt-1 font-medium">{selected.impression}</p>
                </div>
              )}

              {selected.radiologist && <p className="text-xs text-slate-500">Reported by: {selected.radiologist}</p>}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">🖼️ View Images</button>
              <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">📄 PDF Report</button>
              <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">🔔 Alert Doctor</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
