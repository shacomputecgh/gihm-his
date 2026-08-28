import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Visitor { id: string; visitorName: string; phone: string; idType: string; idNumber: string; patientName: string; patientMrn: string; ward: string; bed: string; visitType: 'General' | 'ICU Restricted' | 'Isolation' | 'Paediatric' | 'Maternity'; checkInTime: string; checkOutTime?: string; badgeNumber: string; temperature: string; healthScreening: boolean; status: 'In Hospital' | 'Checked Out' | 'Overdue' | 'Banned'; escortRequired: boolean; }

const VISITORS: Visitor[] = [
  { id: 'VIS-001', visitorName: 'Kwaku Asante', phone: '+233 24 567 8901', idType: 'Ghana Card', idNumber: 'GHA-1234-5678-9012', patientName: 'Kwame Asante', patientMrn: 'MRN-2024-0891', ward: 'Surgical Ward', bed: 'B-12', visitType: 'General', checkInTime: '2026-08-26 10:00', badgeNumber: 'VB-001', temperature: '36.5°C', healthScreening: true, status: 'In Hospital', escortRequired: false },
  { id: 'VIS-002', visitorName: 'Abena Osei', phone: '+233 50 123 4567', idType: 'Voter ID', idNumber: 'VIC-9876-5432', patientName: 'Akua Mensah', patientMrn: 'MRN-2024-1234', ward: 'Maternity', bed: 'M-05', visitType: 'Maternity', checkInTime: '2026-08-26 09:30', badgeNumber: 'VB-002', temperature: '36.8°C', healthScreening: true, status: 'In Hospital', escortRequired: false },
  { id: 'VIS-003', visitorName: 'Dr. James Mensah', phone: '+233 20 987 6543', idType: 'Staff ID', idNumber: 'STF-001', patientName: 'Nana Osei', patientMrn: 'MRN-2024-0567', ward: 'ICU', bed: 'ICU-08', visitType: 'ICU Restricted', checkInTime: '2026-08-26 11:00', badgeNumber: 'VB-003', temperature: '36.4°C', healthScreening: true, status: 'In Hospital', escortRequired: true },
  { id: 'VIS-004', visitorName: 'Yaa Asantewaa', phone: '+233 27 321 6549', idType: 'Ghana Card', idNumber: 'GHA-4567-8901-2345', patientName: 'Kofi Amoako Jr.', patientMrn: 'MRN-2024-0777', ward: 'Paediatric', bed: 'P-01', visitType: 'Paediatric', checkInTime: '2026-08-26 08:00', badgeNumber: 'VB-004', temperature: '36.7°C', healthScreening: true, status: 'In Hospital', escortRequired: false },
  { id: 'VIS-005', visitorName: 'Kofi Boateng', phone: '+233 26 456 7890', idType: 'Ghana Card', idNumber: 'GHA-7890-1234-5678', patientName: 'Efua Nyarko', patientMrn: 'MRN-2024-0998', ward: 'Medical Ward B', bed: 'B-12', visitType: 'Isolation', checkInTime: '2026-08-26 10:30', badgeNumber: 'VB-005', temperature: '36.9°C', healthScreening: true, status: 'In Hospital', escortRequired: true },
  { id: 'VIS-006', visitorName: 'Ama Frimpong', phone: '+233 24 111 2222', idType: 'Passport', idNumber: 'PSS-123456', patientName: 'Ama Boateng', patientMrn: 'MRN-2024-0112', ward: 'Oncology', bed: 'ONC-05', visitType: 'General', checkInTime: '2026-08-25 14:00', checkOutTime: '2026-08-25 18:00', badgeNumber: 'VB-006', temperature: '36.6°C', healthScreening: true, status: 'Checked Out', escortRequired: false },
];

const VISIT_TYPE_STYLE: Record<string, string> = { 'General': 'bg-green-100 text-green-800', 'ICU Restricted': 'bg-red-100 text-red-800', 'Isolation': 'bg-purple-100 text-purple-800', 'Paediatric': 'bg-blue-100 text-blue-800', 'Maternity': 'bg-pink-100 text-pink-800' };

export default function VisitorManagementEnhanced() {
  const [visitors] = useState<Visitor[]>(VISITORS);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? visitors : visitors.filter(v => v.status === filter);
  const inHospital = visitors.filter(v => v.status === 'In Hospital');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visitor Management</h1>
          <p className="text-slate-500 text-sm">Check-in/out, badge printing, health screening, and ward restrictions</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Register Visitor</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">In Hospital</p><p className="text-2xl font-bold text-green-600">{inHospital.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">ICU Visitors</p><p className="text-2xl font-bold text-red-600">{inHospital.filter(v => v.visitType === 'ICU Restricted').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Escort Required</p><p className="text-2xl font-bold text-orange-600">{inHospital.filter(v => v.escortRequired).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Checked Out Today</p><p className="text-2xl font-bold text-slate-600">{visitors.filter(v => v.status === 'Checked Out').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Health Screened</p><p className="text-2xl font-bold text-green-600">{visitors.filter(v => v.healthScreening).length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'In Hospital', 'Checked Out', 'Overdue', 'Banned'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(v => (
          <Card key={v.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{v.visitorName}</span>
                  <Badge tone={v.status === 'In Hospital' ? 'green' : v.status === 'Overdue' ? 'red' : 'blue'}>{v.status}</Badge>
                  <Badge tone={VISIT_TYPE_STYLE[v.visitType]?.includes('red') ? 'red' : 'blue'}>{v.visitType}</Badge>
                  {v.escortRequired && <Badge tone="orange">Escort Required</Badge>}
                </div>
                <p className="text-sm text-slate-500">{v.phone} · {v.idType}: {v.idNumber}</p>
                <p className="text-sm">Visiting: <strong>{v.patientName}</strong> ({v.patientMrn}) — {v.ward} Bed {v.bed}</p>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span>Badge: {v.badgeNumber}</span>
                  <span>In: {v.checkInTime}</span>
                  {v.checkOutTime && <span>Out: {v.checkOutTime}</span>}
                  <span>Temp: {v.temperature}</span>
                  <span>Screening: {v.healthScreening ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {v.status === 'In Hospital' && <button onClick={() => {}} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Check Out</button>}
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">🖨️ Badge</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
