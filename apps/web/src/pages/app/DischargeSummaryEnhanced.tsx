import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Discharge { id: string; patientName: string; mrn: string; ward: string; doctor: string; admissionDate: string; dischargeDate: string; diagnosis: string; admissionSummary: string; treatment: string; dischargeMedications: string[]; followUp: string; instructions: string; condition: 'Stable' | 'Improved' | 'Unchanged' | 'Deteriorated'; mode: 'Routine' | 'AMA' | 'Transfer' | 'Referred'; }

const DISCHARGES: Discharge[] = [
  { id: 'DC-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', doctor: 'Dr. Yaw Boateng', admissionDate: '2026-08-22', dischargeDate: '2026-08-26', diagnosis: 'Acute Appendicitis — Post Appendectomy', admissionSummary: 'Presented with right iliac fossa pain, nausea, and vomiting. CT abdomen confirmed acute appendicitis. Taken to theatre for emergency appendectomy.', treatment: 'Emergency laparoscopic appendectomy under GA. IV Ceftriaxone 1g OD for 5 days. IV fluids then oral diet. Pain management with paracetamol and tramadol.', dischargeMedications: ['Amoxicillin 500mg TDS × 5 days', 'Paracetamol 1g QDS PRN', 'Ibuprofen 400mg TDS with food × 5 days'], followUp: 'Surgical outpatient clinic in 2 weeks. Wound review.', instructions: 'Keep wound dry for 48 hours. Light diet for 1 week. No heavy lifting for 4 weeks. Return if fever, wound redness, or increasing pain.', condition: 'Improved', mode: 'Routine' },
  { id: 'DC-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', ward: 'Maternity', doctor: 'Dr. Ama Darko', admissionDate: '2026-08-25', dischargeDate: '2026-08-26', diagnosis: 'Caesarean Section — Successful Delivery', admissionSummary: 'Emergency C-section for fetal distress. Baby boy delivered at 38 weeks, 3.2kg, Apgar 8/9.', treatment: 'Caesarean section under spinal anaesthesia. Baby delivered healthy. Skin-to-skin initiated. Breastfeeding commenced.', dischargeMedications: ['Paracetamol 1g QDS × 7 days', 'Ibuprofen 400mg TDS × 7 days', 'Ferrous Sulphate 200mg BD × 6 weeks'], followUp: 'Postnatal clinic in 6 weeks. Baby immunisation schedule as per Growth Monitoring.', instructions: 'Rest for 2 weeks. No lifting > 5kg. Wound care daily. Exclusive breastfeeding. Return if wound discharge, fever, or heavy bleeding.', condition: 'Improved', mode: 'Routine' },
  { id: 'DC-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', doctor: 'Dr. Ama Darko', admissionDate: '2026-08-18', dischargeDate: '2026-08-26', diagnosis: 'Severe Community-Acquired Pneumonia — Recovered', admissionSummary: 'Admitted via Emergency with sepsis secondary to pneumonia. Required non-invasive ventilation for 3 days.', treatment: 'IV Amoxicillin-Clavulanate + Azithromycin. NIV for 72 hours. Transitioned to oral antibiotics on day 5.', dischargeMedications: ['Amoxicillin-Clavulanate 625mg TDS × 5 days', 'Azithromycin 500mg OD × 3 days', 'Inhalers — Salbutamol PRN'], followUp: 'Respiratory clinic in 4 weeks. Repeat CXR.', instructions: 'Gradual return to activity. Use inhalers as directed. Smoking cessation counselling. Pneumococcal vaccination in 6 weeks.', condition: 'Improved', mode: 'Routine' },
  { id: 'DC-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward A', doctor: 'Dr. Kofi Asante', admissionDate: '2026-08-20', dischargeDate: '2026-08-26', diagnosis: 'Type 2 Diabetes Mellitus — Hyperglycaemia', admissionSummary: 'Admitted with blood glucose > 30mmol/L, dehydrated, confused. HbA1c 9.2%.', treatment: 'IV insulin infusion, aggressive IV fluid resuscitation. Transitioned to SC insulin regimen. Dietitian review. Diabetic education.', dischargeMedications: ['Insulin Glargine 18u at bedtime', 'Metformin 500mg BD with meals', 'Gliclazide 80mg BD'], followUp: 'Diabetic clinic in 2 weeks. GP review in 1 week. HbA1c in 3 months.', instructions: 'Blood glucose monitoring 4 times daily. Inject insulin at same time daily. Dietitian diet plan. Return if BG > 20 or < 4.', condition: 'Stable', mode: 'Routine' },
];

export default function DischargeSummaryEnhanced() {
  const toast = useToast();
  const [discharges] = useState<Discharge[]>(DISCHARGES);
  const [selected, setSelected] = useState<Discharge | null>(null);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? discharges : discharges.filter(d => d.condition === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discharge Summaries</h1>
          <p className="text-slate-500 text-sm">Complete discharge documentation with medication plans and follow-up instructions</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Discharge</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold">{discharges.length}</p><p className="text-xs text-slate-500">Total Discharges</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{discharges.filter(d => d.condition === 'Improved').length}</p><p className="text-xs text-slate-500">Improved</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{discharges.filter(d => d.mode === 'Routine').length}</p><p className="text-xs text-slate-500">Routine</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{discharges.filter(d => d.mode === 'Transfer' || d.mode === 'Referred').length}</p><p className="text-xs text-slate-500">Transferred</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Improved', 'Stable', 'Unchanged', 'Deteriorated'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filtered.map(d => (
            <Card key={d.id} className={`p-4 cursor-pointer hover:shadow transition ${selected?.id === d.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === d.id ? null : d)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{d.patientName}</span>
                    <Badge tone={d.condition === 'Improved' ? 'green' : 'blue'}>{d.condition}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{d.mrn} · {d.ward} · {d.doctor}</p>
                  <p className="text-sm mt-1">{d.diagnosis}</p>
                  <p className="text-xs text-slate-400 mt-1">Admitted: {d.admissionDate} → Discharged: {d.dischargeDate}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="p-6 h-fit sticky top-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold">{selected.patientName}</h2>
                <p className="text-xs text-slate-500">{selected.mrn} · {selected.ward} · {selected.doctor}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">📄 Export PDF</button>
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">🖨️ Print</button>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded">
                <div><span className="text-slate-500">Admission:</span> {selected.admissionDate}</div>
                <div><span className="text-slate-500">Discharge:</span> {selected.dischargeDate}</div>
                <div><span className="text-slate-500">Diagnosis:</span> <strong>{selected.diagnosis}</strong></div>
                <div><span className="text-slate-500">Mode:</span> <Badge tone={selected.mode === 'Routine' ? 'green' : 'gold'}>{selected.mode}</Badge></div>
              </div>

              <div><p className="font-semibold text-slate-700">Admission Summary</p><p className="mt-1 text-slate-600">{selected.admissionSummary}</p></div>
              <div><p className="font-semibold text-slate-700">Treatment Given</p><p className="mt-1 text-slate-600">{selected.treatment}</p></div>

              <div><p className="font-semibold text-slate-700">Discharge Medications</p>
                <ul className="mt-1 space-y-1">{selected.dischargeMedications.map((m, i) => <li key={i} className="flex items-center gap-2 text-slate-600">💊 {m}</li>)}</ul>
              </div>

              <div><p className="font-semibold text-slate-700">Follow-Up</p><p className="mt-1 text-slate-600">{selected.followUp}</p></div>
              <div><p className="font-semibold text-slate-700">Patient Instructions</p><p className="mt-1 text-slate-600">{selected.instructions}</p></div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
