import { useState } from 'react';
import { Card, Input } from '../../components/ui';

interface WardStatus {
  name: string; totalBeds: number; occupied: number; available: number;
  awaitingAdmission: number; awaitingDischarge: number; awaitingTransfer: number;
  nurses: string; doctor: string;
  patients: { name: string; bed: string; admissionDate: string; diagnosis: string; expectedDischarge: string }[];
}

const WARDS: WardStatus[] = [
  { name: 'Emergency', totalBeds: 20, occupied: 18, available: 2, awaitingAdmission: 5, awaitingDischarge: 2, awaitingTransfer: 3, nurses: 'Nurse Ama, Nurse Kofi, Nurse Esi', doctor: 'Dr. Asante', patients: [
    { name: 'Kwame Boateng', bed: 'EM-01', admissionDate: '2026-08-25', diagnosis: 'Road Traffic Accident', expectedDischarge: '2026-08-28' },
    { name: 'Abena Osei', bed: 'EM-05', admissionDate: '2026-08-25', diagnosis: 'Acute Asthma', expectedDischarge: '2026-08-26' },
  ] },
  { name: 'Medical Ward', totalBeds: 40, occupied: 32, available: 8, awaitingAdmission: 3, awaitingDischarge: 1, awaitingTransfer: 0, nurses: 'Nurse Esi, Nurse Abena', doctor: 'Dr. Osei', patients: [
    { name: 'Yaw Mensah', bed: 'MW-12', admissionDate: '2026-08-20', diagnosis: 'Pneumonia', expectedDischarge: '2026-08-27' },
    { name: 'Akua Asare', bed: 'MW-18', admissionDate: '2026-08-22', diagnosis: 'Diabetic Ketoacidosis', expectedDischarge: '2026-08-26' },
  ] },
  { name: 'Surgical Ward', totalBeds: 35, occupied: 28, available: 7, awaitingAdmission: 2, awaitingDischarge: 3, awaitingTransfer: 1, nurses: 'Nurse Kofi, Nurse Efua', doctor: 'Dr. Boateng', patients: [
    { name: 'Kofi Amoako', bed: 'SW-08', admissionDate: '2026-08-23', diagnosis: 'Appendectomy', expectedDischarge: '2026-08-26' },
  ] },
  { name: 'ICU', totalBeds: 10, occupied: 9, available: 1, awaitingAdmission: 2, awaitingDischarge: 0, awaitingTransfer: 1, nurses: 'Nurse Abena, Nurse Premium', doctor: 'Dr. Agyemang', patients: [
    { name: 'Yaa Asantewaa', bed: 'ICU-03', admissionDate: '2026-08-21', diagnosis: 'Sepsis', expectedDischarge: '2026-08-28' },
  ] },
  { name: 'Maternity Ward', totalBeds: 25, occupied: 18, available: 7, awaitingAdmission: 1, awaitingDischarge: 2, awaitingTransfer: 0, nurses: 'Nurse Adwoa, Nurse Akosua', doctor: 'Dr. Afriyie', patients: [
    { name: 'Esi Boateng', bed: 'MT-05', admissionDate: '2026-08-24', diagnosis: 'Normal Delivery', expectedDischarge: '2026-08-26' },
  ] },
  { name: 'Paediatric Ward', totalBeds: 30, occupied: 22, available: 8, awaitingAdmission: 1, awaitingDischarge: 1, awaitingTransfer: 0, nurses: 'Nurse Akua, Nurse Kwaku', doctor: 'Dr. Appiah', patients: [
    { name: 'Baby Kofi (2y)', bed: 'PD-10', admissionDate: '2026-08-24', diagnosis: 'Severe Malaria', expectedDischarge: '2026-08-27' },
  ] },
  { name: 'Oncology Ward', totalBeds: 15, occupied: 12, available: 3, awaitingAdmission: 0, awaitingDischarge: 1, awaitingTransfer: 0, nurses: 'Nurse Nana', doctor: 'Dr. Forson', patients: [] },
  { name: 'Psychiatric Unit', totalBeds: 12, occupied: 8, available: 4, awaitingAdmission: 0, awaitingDischarge: 0, awaitingTransfer: 0, nurses: 'Nurse Owusu', doctor: 'Dr. Darko', patients: [] },
];

const getOccupancyColor = (occ: number, total: number) => {
  const pct = (occ / total) * 100;
  if (pct >= 95) return 'bg-red-500'; if (pct >= 85) return 'bg-orange-500'; if (pct >= 70) return 'bg-yellow-500'; return 'bg-green-500';
};

export default function PatientFlowBoard() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const totalBeds = WARDS.reduce((s, w) => s + w.totalBeds, 0);
  const totalOccupied = WARDS.reduce((s, w) => s + w.occupied, 0);
  const totalAwaiting = WARDS.reduce((s, w) => s + w.awaitingAdmission, 0);
  const totalDischarge = WARDS.reduce((s, w) => s + w.awaitingDischarge, 0);
  const filtered = WARDS.filter((w) => !search || w.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Patient Flow Board</h1><p className="text-gray-500">Real-time bed occupancy, admissions, discharges, and transfers</p></div>
        <Input placeholder="Search wards..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalBeds}</div><div className="text-sm text-gray-500">Total Beds</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{totalOccupied}/{totalBeds} ({Math.round(totalOccupied/totalBeds*100)}%)</div><div className="text-sm text-gray-500">Occupied</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{totalAwaiting}</div><div className="text-sm text-gray-500">Awaiting Admission</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{totalDischarge}</div><div className="text-sm text-gray-500">Awaiting Discharge</div></Card>
      </div>
      <div className="grid gap-3">
        {filtered.map((ward) => (
          <div key={ward.name} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-4 cursor-pointer" onClick={() => setSelected(selected === ward.name ? null : ward.name)}>
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold text-lg">{ward.name}</h3><p className="text-sm text-gray-500">{ward.nurses} · {ward.doctor}</p></div>
              <div className="flex items-center gap-4 text-sm">
                {ward.awaitingAdmission > 0 && <span className="text-orange-600 font-medium">⬆ {ward.awaitingAdmission} admit</span>}
                {ward.awaitingDischarge > 0 && <span className="text-purple-600 font-medium">⬇ {ward.awaitingDischarge} discharge</span>}
                {ward.awaitingTransfer > 0 && <span className="text-blue-600 font-medium">↔ {ward.awaitingTransfer} transfer</span>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><div className="text-sm font-medium">{ward.occupied}/{ward.totalBeds}</div><div className="text-xs text-gray-500">{ward.available} free</div></div>
                <div className="w-32 bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${getOccupancyColor(ward.occupied, ward.totalBeds)}`} style={{ width: `${(ward.occupied / ward.totalBeds) * 100}%` }} /></div>
              </div>
            </div>
            {selected === ward.name && ward.patients.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Current Patients</h4>
                <div className="grid md:grid-cols-2 gap-2">{ward.patients.map((p, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded text-sm">
                    <span className="font-medium">{p.name}</span> — Bed {p.bed}<br />
                    <span className="text-gray-500">{p.diagnosis} · Admitted {p.admissionDate}</span>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
