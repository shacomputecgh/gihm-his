import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface ServiceLevel { id: string; department: string; service: string; target: string; actual: string; status: 'Meeting' | 'Exceeding' | 'Below Target'; period: string; complaints: number; compliments: number; lastUpdated: string; }
interface Complaint { id: string; patientName: string; department: string; category: string; description: string; dateSubmitted: string; status: 'Open' | 'Investigating' | 'Resolved' | 'Escalated'; priority: string; assignedTo: string; responseDue: string; }

const SERVICES: ServiceLevel[] = [
  { id: 'SC-001', department: 'Emergency', service: 'Triage Wait Time', target: '< 15 min', actual: '12 min', status: 'Meeting', period: 'Aug 2026', complaints: 3, compliments: 8, lastUpdated: '2026-08-26' },
  { id: 'SC-002', department: 'OPD', service: 'Doctor Consultation', target: '< 30 min', actual: '25 min', status: 'Meeting', period: 'Aug 2026', complaints: 5, compliments: 12, lastUpdated: '2026-08-26' },
  { id: 'SC-003', department: 'Pharmacy', service: 'Dispensing Time', target: '< 20 min', actual: '18 min', status: 'Meeting', period: 'Aug 2026', complaints: 2, compliments: 15, lastUpdated: '2026-08-26' },
  { id: 'SC-004', department: 'Laboratory', service: 'Result Turnaround', target: '< 4 hours', actual: '3.5 hours', status: 'Meeting', period: 'Aug 2026', complaints: 4, compliments: 10, lastUpdated: '2026-08-26' },
  { id: 'SC-005', department: 'Maternity', service: 'Antenatal Wait', target: '< 45 min', actual: '52 min', status: 'Below Target', period: 'Aug 2026', complaints: 7, compliments: 6, lastUpdated: '2026-08-26' },
  { id: 'SC-006', department: 'Radiology', service: 'Scan Report Time', target: '< 24 hours', actual: '18 hours', status: 'Exceeding', period: 'Aug 2026', complaints: 1, compliments: 9, lastUpdated: '2026-08-26' },
  { id: 'SC-007', department: 'Theatre', service: 'Start Time Accuracy', target: '< 30 min delay', actual: '22 min', status: 'Meeting', period: 'Aug 2026', complaints: 2, compliments: 5, lastUpdated: '2026-08-26' },
  { id: 'SC-008', department: 'ICU', service: 'Family Communication', target: 'Every 4 hours', actual: 'Every 3 hours', status: 'Exceeding', period: 'Aug 2026', complaints: 1, compliments: 4, lastUpdated: '2026-08-26' },
];

const COMPLAINTS: Complaint[] = [
  { id: 'CMP-001', patientName: 'Kwame Asante', department: 'Maternity', category: 'Wait Time', description: 'Waited over 1 hour for antenatal appointment', dateSubmitted: '2026-08-25', status: 'Investigating', priority: 'Medium', assignedTo: 'Nurse Manager', responseDue: '2026-08-27' },
  { id: 'CMP-002', patientName: 'Akua Mensah', department: 'Pharmacy', category: 'Staff Attitude', description: 'Pharmacist was rude when asked about medication', dateSubmitted: '2026-08-24', status: 'Resolved', priority: 'Low', assignedTo: 'Pharmacy Manager', responseDue: '2026-08-26' },
  { id: 'CMP-003', patientName: 'Nana Osei', department: 'Emergency', category: 'Facility', description: 'Toilets in emergency department were not clean', dateSubmitted: '2026-08-26', status: 'Open', priority: 'High', assignedTo: 'Facilities Manager', responseDue: '2026-08-27' },
  { id: 'CMP-004', patientName: 'Efua Nyarko', department: 'Laboratory', category: 'Communication', description: 'Not informed about delay in test results', dateSubmitted: '2026-08-25', status: 'Open', priority: 'Medium', assignedTo: 'Lab Manager', responseDue: '2026-08-28' },
];

export default function ServiceCharterEnhanced() {
  const [tab, setTab] = useState<'services' | 'complaints'>('services');
  const meetingTarget = SERVICES.filter(s => s.status !== 'Below Target').length;
  const totalComplaints = COMPLAINTS.length;
  const openComplaints = COMPLAINTS.filter(c => c.status === 'Open').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Charter</h1>
          <p className="text-slate-500 text-sm">Service level agreements, complaints, and department performance</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('services')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'services' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Service Levels</button>
        <button onClick={() => setTab('complaints')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'complaints' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Complaints ({openComplaints})</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Services Tracked</p><p className="text-2xl font-bold">{SERVICES.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Meeting Target</p><p className="text-2xl font-bold text-green-600">{meetingTarget}/{SERVICES.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Total Complaints</p><p className="text-2xl font-bold text-orange-600">{totalComplaints}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Open Complaints</p><p className="text-2xl font-bold text-red-600">{openComplaints}</p></Card>
      </div>

      {tab === 'services' ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr className="text-left text-slate-500">
              <th className="p-3">Department</th><th className="p-3">Service</th><th className="p-3">Target</th><th className="p-3">Actual</th><th className="p-3">Status</th><th className="p-3 text-center">Complaints</th><th className="p-3 text-center">Compliments</th>
            </tr></thead>
            <tbody>
              {SERVICES.sort((a, b) => a.status === 'Below Target' ? -1 : b.status === 'Below Target' ? 1 : 0).map(s => (
                <tr key={s.id} className={`border-t hover:bg-slate-50 ${s.status === 'Below Target' ? 'bg-red-50' : ''}`}>
                  <td className="p-3 font-medium">{s.department}</td>
                  <td className="p-3">{s.service}</td>
                  <td className="p-3 text-slate-500">{s.target}</td>
                  <td className="p-3 font-medium">{s.actual}</td>
                  <td className="p-3"><Badge tone={s.status === 'Meeting' ? 'green' : s.status === 'Exceeding' ? 'blue' : 'red'}>{s.status}</Badge></td>
                  <td className="p-3 text-center">{s.complaints}</td>
                  <td className="p-3 text-center">{s.compliments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="space-y-3">
          {COMPLAINTS.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.id}</span>
                    <Badge tone={c.status === 'Open' ? 'red' : c.status === 'Investigating' ? 'gold' : 'green'}>{c.status}</Badge>
                    <Badge tone={c.priority === 'High' ? 'red' : 'gold'}>{c.priority}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{c.description}</p>
                  <p className="text-xs text-slate-500 mt-1">Department: {c.department} · Category: {c.category}</p>
                  <p className="text-xs text-slate-500">Patient: {c.patientName} · Submitted: {c.dateSubmitted} · Due: {c.responseDue}</p>
                  <p className="text-xs text-slate-500">Assigned to: {c.assignedTo}</p>
                </div>
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Respond</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
