import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

interface DischargeRecord {
  id: string; patientName: string; mrn: string; admissionDate: string; dischargeDate: string;
  lengthOfStay: number; consultant: string; department: string;
  admissionDiagnosis: string[]; dischargeDiagnosis: string[];
  procedures: string[]; complications: string[];
  conditionAtDischarge: string;
  dischargeMedications: string[]; medicationsChanged: string[];
  followUp: { appointment: string; department: string; notes: string }[];
  instructions: string[]; warnings: string[];
  dischargeSummary: string;
  status: 'draft' | 'completed' | 'printed';
}

const MOCK_DISCHARGES: DischargeRecord[] = [
  { id: 'DC001', patientName: 'Kwame Asante', mrn: 'MRN-001', admissionDate: '2026-05-20', dischargeDate: '2026-05-24', lengthOfStay: 4, consultant: 'Dr. Mensah', department: 'Medical', admissionDiagnosis: ['Hypertensive Urgency', 'Papilloedema'], dischargeDiagnosis: ['Essential Hypertension — improved', 'Papilloedema — resolving'], procedures: ['Fundoscopy', 'ECG', 'Blood investigations'], complications: ['None'], conditionAtDischarge: 'Stable. BP 138/82. Headache resolved. No visual disturbance.', dischargeMedications: ['Amlodipine 5mg OD', 'Enalapril 10mg OD', 'Metformin 500mg BD'], medicationsChanged: ['Stopped IV Paracetamol', 'Changed Enalapril from 10mg BD to 10mg OD'], followUp: [{ appointment: '2026-06-07', department: 'Cardiology', notes: 'BP review and fundoscopy' }, { appointment: '2026-06-07', department: 'OPD', notes: 'HbA1c check' }], instructions: ['Continue medications as prescribed', 'Low salt diet', 'Avoid strenuous activity for 2 weeks', 'Monitor BP at home daily', 'Return immediately if headache returns or vision changes'], warnings: ['Do not stop medications without doctor advice', 'Seek emergency care if BP > 180/110 or severe headache'], dischargeSummary: 'Mr. Asante was admitted for hypertensive urgency with papilloedema. BP was 158/95 on admission. Managed with Amlodipine and Enalapril. BP improved to 138/82. Fundoscopy showed resolving papilloedema. Blood investigations normal except mildly elevated creatinine which improved. Patient discharged stable on oral medications with close follow-up.', status: 'completed' },
  { id: 'DC002', patientName: 'Ama Darko', mrn: 'MRN-002', admissionDate: '2026-05-23', dischargeDate: '2026-05-24', lengthOfStay: 1, consultant: 'Dr. Boateng', department: 'Surgery', admissionDiagnosis: ['Acute Appendicitis'], dischargeDiagnosis: ['Acute Appendicitis — post-laparoscopic appendectomy'], procedures: ['Laparoscopic Appendectomy'], complications: ['None'], conditionAtDischarge: 'Good. Tolerating soft diet. Wound clean and dry. Ambulating independently.', dischargeMedications: ['Paracetamol 1g QDS PRN', 'Amoxicillin 500mg TDS x 5 days'], medicationsChanged: ['Stopped IV antibiotics', 'Started oral antibiotics'], followUp: [{ appointment: '2026-05-30', department: 'Surgery', notes: 'Wound check and histology review' }], instructions: ['Take oral antibiotics for 5 days', 'Wound care — keep dry for 48 hours', 'Light activities for 2 weeks', 'No heavy lifting for 6 weeks', 'Return if wound becomes red, swollen, or discharges'], warnings: ['Seek emergency care if fever > 38.5°C or severe abdominal pain'], dischargeSummary: 'Ms. Darko underwent laparoscopic appendectomy for acute appendicitis. Surgery was uncomplicated. Post-operative recovery was smooth — tolerating soft diet, passing flatus, ambulating independently. Wound clean and dry. Discharged on oral antibiotics and analgesics.', status: 'completed' },
  { id: 'DC003', patientName: 'Efua Mensah', mrn: 'MRN-004', admissionDate: '2026-05-22', dischargeDate: '2026-05-23', lengthOfStay: 1, consultant: 'Dr. Agyeman', department: 'Obstetrics', admissionDiagnosis: ['Normal Vaginal Delivery'], dischargeDiagnosis: ['Normal Vaginal Delivery — uncomplicated'], procedures: ['Normal vaginal delivery'], complications: ['None'], conditionAtDischarge: 'Mother: Stable. Baby: Healthy, feeding well.', dischargeMedications: ['Iron supplement 200mg OD x 6 weeks', 'Paracetamol 1g QDS PRN'], medicationsChanged: ['Started iron supplementation'], followUp: [{ appointment: '2026-05-30', department: 'Obstetrics', notes: '6-day postnatal check' }, { appointment: '2026-06-22', department: 'Obstetrics', notes: '6-week postnatal check' }], instructions: ['Exclusive breastfeeding for 6 months', 'Take iron supplements daily', 'Perineal care — sitz bath twice daily', 'Contact clinic if fever, heavy bleeding, or foul-smelling discharge', 'Baby immunizations: BCG, OPV0, HepB0 given today'], warnings: ['Seek emergency care if heavy vaginal bleeding or high fever'], dischargeSummary: 'Ms. Mensah delivered a healthy baby girl (3.2kg) by normal vaginal delivery. Mother and baby doing well. Breastfeeding established. Immunizations given. Mother discharged on iron supplementation with follow-up arranged.', status: 'completed' },
];

export default function DischargeSummary() {
  const [selectedDischarge, setSelectedDischarge] = useState<string | null>(null);

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
          title="Add New Discharge Summary"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"mrn","label":"MRN","type":"text","required":true},{"name":"admissionDate","label":"Admission Date","type":"date"},{"name":"dischargeDate","label":"Discharge Date","type":"date"},{"name":"diagnosis","label":"Discharge Diagnosis","type":"text","required":true},{"name":"dischargeMedications","label":"Discharge Medications","type":"textarea"},{"name":"followUp","label":"Follow-up Instructions","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Discharge Summary" subtitle="Comprehensive discharge documentation and medication reconciliation" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_DISCHARGES.length}</div><div className="text-xs text-slate-500">Discharges</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_DISCHARGES.filter(d => d.status === 'completed').length}</div><div className="text-xs text-slate-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_DISCHARGES.reduce((s, d) => s + d.lengthOfStay, 0)}</div><div className="text-xs text-slate-500">Total Bed Days</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_DISCHARGES.filter(d => d.complications[0] !== 'None').length}</div><div className="text-xs text-slate-500">Complications</div></Card>
      </div>

      <div className="space-y-3">
        {MOCK_DISCHARGES.map(d => {
          const isExpanded = selectedDischarge === d.id;
          return (
            <Card key={d.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedDischarge(isExpanded ? null : d.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{d.patientName}</h3>
                    <Badge tone={d.status === 'completed' ? 'green' : 'gold'}>{d.status.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>📅 Admitted: {d.admissionDate}</span><span>📅 Discharged: {d.dischargeDate}</span><span>⏱️ LOS: {d.lengthOfStay} days</span><span>👨‍⚕️ {d.consultant}</span><span>🏥 {d.department}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">Discharge: {d.dischargeDiagnosis.join(', ')}</div>
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {isExpanded && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📝 Discharge Summary</h4><p className="text-xs text-slate-700 leading-relaxed">{d.dischargeSummary}</p></div>
                  <div className="rounded-lg bg-green-50 p-3"><h4 className="font-bold text-xs text-green-700 mb-1">📋 Condition at Discharge</h4><p className="text-xs text-green-600">{d.conditionAtDischarge}</p></div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-blue-50 p-3"><h4 className="font-bold text-xs text-blue-700 mb-1">💊 Discharge Medications</h4><ul className="list-disc list-inside text-xs text-blue-600">{d.dischargeMedications.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
                    <div className="rounded-lg bg-amber-50 p-3"><h4 className="font-bold text-xs text-amber-700 mb-1">🔄 Medications Changed</h4><ul className="list-disc list-inside text-xs text-amber-600">{d.medicationsChanged.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3"><h4 className="font-bold text-xs text-purple-700 mb-1">📅 Follow-up Appointments</h4>{d.followUp.map((f, i) => <div key={i} className="text-xs text-purple-600 mt-1">• {f.appointment} — {f.department}: {f.notes}</div>)}</div>
                  <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📋 Patient Instructions</h4><ul className="list-disc list-inside text-xs text-slate-700">{d.instructions.map((inst, i) => <li key={i}>{inst}</li>)}</ul></div>
                  <div className="rounded-lg bg-red-50 p-3"><h4 className="font-bold text-xs text-red-700 mb-1">⚠️ Warning Signs</h4><ul className="list-disc list-inside text-xs text-red-600">{d.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                  <div className="flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Complete</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-xs">🖨️ Print Summary</Button>
                    <Button className="bg-slate-100 text-slate-700 text-xs">📤 Send to Patient</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
