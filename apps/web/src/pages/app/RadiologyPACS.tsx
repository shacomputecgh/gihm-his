import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, PageHeader } from '../../components/ui';

interface ImagingStudy {
  id: string; patientName: string; mrn: string; date: string; modality: string;
  bodyPart: string; indication: string; status: 'ordered' | 'performed' | 'interpreted' | 'reported';
  radiologist?: string; findings?: string; impression?: string; urgent: boolean;
}

const MOCK_STUDIES: ImagingStudy[] = [
  { id: 'IM001', patientName: 'Kwame Asante', mrn: 'MRN-001', date: '2026-05-22', modality: 'CT', bodyPart: 'Abdomen', indication: 'Evaluate for renal pathology', status: 'reported', radiologist: 'Dr. Radiologist', findings: 'No renal calculi. Normal liver and spleen. Mild bilateral renal cortical thinning.', impression: 'Mild chronic kidney changes. No acute pathology.', urgent: false },
  { id: 'IM002', patientName: 'Kofi Asante Jr.', mrn: 'MRN-003', date: '2026-05-23', modality: 'X-Ray', bodyPart: 'Chest (PA)', indication: 'Cough and fever — rule out pneumonia', status: 'reported', radiologist: 'Dr. Radiologist', findings: 'Right lower lobe consolidation with air bronchograms. No pleural effusion.', impression: 'Right lower lobe pneumonia', urgent: true },
  { id: 'IM003', patientName: 'Ama Darko', mrn: 'MRN-002', date: '2026-05-23', modality: 'CT', bodyPart: 'Abdomen', indication: 'Suspected appendicitis', status: 'interpreted', urgent: true },
  { id: 'IM004', patientName: 'Nana Akua', mrn: 'MRN-008', date: '2026-05-20', modality: 'X-Ray', bodyPart: 'Hip (AP)', indication: 'Pre-operative assessment for THR', status: 'reported', radiologist: 'Dr. Radiologist', findings: 'Severe osteoarthritis left hip — joint space narrowing, osteophytes, subchondral sclerosis.', impression: 'Severe OA left hip — suitable for THR', urgent: false },
  { id: 'IM005', patientName: 'Efua Amoah', mrn: 'MRN-007', date: '2026-05-22', modality: 'Ultrasound', bodyPart: 'Obstetric', indication: 'Dating scan — 12 weeks', status: 'ordered', urgent: false },
];

const modalityConfig: Record<string, { icon: string; color: string }> = { 'X-Ray': { icon: '📷', color: 'bg-blue-50 text-blue-700' }, CT: { icon: '🖥️', color: 'bg-purple-50 text-purple-700' }, MRI: { icon: '🧲', color: 'bg-cyan-50 text-cyan-700' }, Ultrasound: { icon: '🔊', color: 'bg-green-50 text-green-700' } };

export default function RadiologyPACS() {
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);

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
          title="Add New PACS Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Radiology PACS" subtitle="Picture Archiving and Communication System — imaging studies and reporting" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_STUDIES.length}</div><div className="text-xs text-slate-500">Total Studies</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_STUDIES.filter(s => s.status === 'reported').length}</div><div className="text-xs text-slate-500">Reported</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_STUDIES.filter(s => s.status === 'ordered').length}</div><div className="text-xs text-slate-500">Pending</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_STUDIES.filter(s => s.urgent).length}</div><div className="text-xs text-slate-500">Urgent</div></Card>
      </div>

      <div className="space-y-3">
        {MOCK_STUDIES.map(s => {
          const modCfg = modalityConfig[s.modality] ?? { icon: '📷', color: 'bg-slate-50 text-slate-700' };
          const isExpanded = selectedStudy === s.id;
          return (
            <Card key={s.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''} ${s.urgent ? 'border-l-4 border-red-400' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedStudy(isExpanded ? null : s.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${modCfg.color}`}>{modCfg.icon} {s.modality}</span>
                    <h3 className="font-bold text-sm text-slate-800">{s.patientName}</h3>
                    <Badge tone={s.status === 'reported' ? 'green' : s.status === 'interpreted' ? 'blue' : s.status === 'performed' ? 'gold' : 'gray'}>{s.status.toUpperCase()}</Badge>
                    {s.urgent && <Badge tone="red">URGENT</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{s.bodyPart} · {s.indication} · {s.date}</div>
                  <div className="text-[10px] text-slate-400">MRN: {s.mrn}</div>
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {isExpanded && s.findings && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📝 Findings</h4><p className="text-xs text-slate-700">{s.findings}</p></div>
                  {s.impression && <div className="rounded-lg bg-blue-50 p-3"><h4 className="font-bold text-xs text-blue-700 mb-1">💡 Impression</h4><p className="text-xs text-blue-600 font-medium">{s.impression}</p></div>}
                  <div className="text-[10px] text-slate-400">Radiologist: {s.radiologist}</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
