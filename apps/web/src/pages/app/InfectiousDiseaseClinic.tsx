import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface IDPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  condition: string;
  cd4?: number;
  viralLoad?: string;
  artRegimen?: string;
  artStartDate?: string;
  whoStage?: number;
  opportunistic?: string[];
  hepatitis?: string;
  tbStatus?: string;
  bmi: number;
  status: 'New' | 'Follow-up' | 'On ART' | 'OI Treatment' | 'Pre-ART';
  medications: string[];
  doctor: string;
  followUp: string;
  notes: string;
}

const ID_PATIENTS: IDPatient[] = [
  {
    id: 'ID-001', name: 'Kwame Mensah', age: 45, gender: 'Male', mrn: 'MRN-2026-1020', visitDate: '2026-08-24',
    condition: 'HIV-1 Infection (WHO Stage 3)', cd4: 120, viralLoad: '45,000 copies/mL',
    artRegimen: 'TLD (Tenofovir/Lamivudine/Dolutegravir)', artStartDate: '2026-06-01',
    whoStage: 3, opportunistic: ['Oral Candidiasis', 'Herpes Zoster'], bmi: 20.5,
    status: 'On ART', medications: ['TLD OD', 'Fluconazole 200mg BD x 14 days', 'Acyclovir 400mg TDS x 7 days'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-10-24 (2 months)',
    notes: 'Newly initiated ART. CD4 120 — improving opportunistic infections. Fluconazole for oral candidiasis. Viral load target at 6 months.'
  },
  {
    id: 'ID-002', name: 'Akua Boateng', age: 35, gender: 'Female', mrn: 'MRN-2026-1022', visitDate: '2026-08-24',
    condition: 'HIV-1 Infection (Suppressed Viral Load)', cd4: 650, viralLoad: 'Undetectable (<50 copies/mL)',
    artRegimen: 'TLD (Tenofovir/Lamivudine/Dolutegravir)', artStartDate: '2023-01-15',
    whoStage: 1, bmi: 26.0, status: 'On ART',
    medications: ['TLD OD', 'Isoniazid 300mg preventive therapy'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (6 months)',
    notes: 'Well-controlled HIV. VL undetectable since 2023. IPT for TB prevention. Annual cervical screening due. CD4 stable.'
  },
  {
    id: 'ID-003', name: 'Kofi Asare', age: 52, gender: 'Male', mrn: 'MRN-2026-1024', visitDate: '2026-08-24',
    condition: 'HIV-TB Co-infection (Pulmonary TB)', cd4: 85, viralLoad: '120,000 copies/mL',
    artRegimen: 'AZT/3TC/DTG (adjusted for TB)', artStartDate: '2026-08-20',
    whoStage: 4, opportunistic: ['Pulmonary TB (AFB+)'], tbStatus: 'Active TB — DOTS Phase 1', bmi: 18.5,
    status: 'OI Treatment', medications: ['AZT 300mg BD', '3TC 150mg BD', 'DTG 50mg OD', 'RHZE (TB drugs)', 'Prednisolone (IRIS prevention)'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (2 weeks)',
    notes: 'HIV-TB co-infection. Started ART while on TB treatment. IRIS risk — monitor closely. Nutritional support essential. CD4 very low.'
  },
  {
    id: 'ID-004', name: 'Efua Nyarko', age: 28, gender: 'Female', mrn: 'MRN-2026-1026', visitDate: '2026-08-24',
    condition: 'HIV Exposed Infant (HEI) — 6 months', status: 'Pre-ART',
    bmi: 6.5, medications: ['NVP prophylaxis x 6 weeks (completed)', 'Cotrimoxazole prophylaxis'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-24 (PCR result)',
    notes: 'HEI — mother HIV+ on ART. Infant PCR at 6 weeks negative. DNA PCR at 6 months pending. Cotrimoxazole prophylaxis. Exclusive breastfeeding.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'On ART': 'bg-green-100 text-green-800', 'OI Treatment': 'bg-red-100 text-red-800',
  'Pre-ART': 'bg-purple-100 text-purple-800',
};

export default function InfectiousDiseaseClinic() {
  const [selected, setSelected] = useState<IDPatient | null>(ID_PATIENTS[0] ?? null);

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
          title="Add New Infectious Disease Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Infectious Disease Clinic</h1>
        <p className="text-gray-500">HIV/AIDS management, TB co-infection, opportunistic infections, and antimicrobial stewardship</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Patients', value: ID_PATIENTS.length, color: 'text-blue-600' },
          { label: 'On ART', value: ID_PATIENTS.filter(p => p.status === 'On ART').length, color: 'text-green-600' },
          { label: 'OI Treatment', value: ID_PATIENTS.filter(p => p.status === 'OI Treatment').length, color: 'text-red-600' },
          { label: 'Suppressed VL', value: ID_PATIENTS.filter(p => p.viralLoad?.includes('Undetectable')).length, color: 'text-purple-600' },
          { label: 'CD4 <200', value: ID_PATIENTS.filter(p => (p.cd4 ?? 0) < 200).length, color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {ID_PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === p.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                    {p.whoStage && <Badge className="text-[10px] bg-red-100 text-red-800">WHO Stage {p.whoStage}</Badge>}
                  </div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                </div>
                <div className="text-right">
                  {p.cd4 !== undefined && (
                    <div className={`text-sm font-bold ${p.cd4 < 200 ? 'text-red-600' : p.cd4 < 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                      CD4 {p.cd4}
                    </div>
                  )}
                  {p.viralLoad && <div className="text-xs text-gray-400">VL: {p.viralLoad}</div>}
                </div>
              </div>
              {p.opportunistic && p.opportunistic.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {p.opportunistic.map(o => <Badge key={o} className="text-[10px] bg-red-100 text-red-700">🦠 {o}</Badge>)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p>
                <p className="text-sm text-blue-600">{selected.condition}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                {selected.cd4 !== undefined && (
                  <div className={`rounded p-2 ${selected.cd4 < 200 ? 'bg-red-50 text-red-600' : selected.cd4 < 500 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                    <div className="text-lg font-bold">{selected.cd4}</div>
                    <div className="text-[10px]">CD4 (cells/µL)</div>
                  </div>
                )}
                {selected.viralLoad && (
                  <div className={`rounded p-2 ${selected.viralLoad.includes('Undetectable') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <div className="text-lg font-bold">{selected.viralLoad.includes('Undetectable') ? 'UD' : selected.viralLoad.split(' ')[0]}</div>
                    <div className="text-[10px]">Viral Load</div>
                  </div>
                )}
              </div>

              {selected.artRegimen && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-700">ART Regimen</div>
                  <div className="text-sm text-green-600 font-semibold">{selected.artRegimen}</div>
                  {selected.artStartDate && <div className="text-xs text-green-600 mt-1">Started: {selected.artStartDate}</div>}
                </div>
              )}

              {selected.tbStatus && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-700">TB Status</div>
                  <div className="text-sm text-orange-600">{selected.tbStatus}</div>
                </div>
              )}

              {selected.opportunistic && selected.opportunistic.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-700 mb-1">Opportunistic Infections</div>
                  {selected.opportunistic.map((o, i) => (
                    <div key={i} className="text-xs text-red-600">🦠 {o}</div>
                  ))}
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Medications</div>
                {selected.medications.map((m, i) => (
                  <div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>
                ))}
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
